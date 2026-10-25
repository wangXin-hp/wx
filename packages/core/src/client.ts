import { normalizeError } from './error'
import { defaultIdFactory } from './id'
import { safeSerialize } from './serialization'
import type {
  CustomEventPayload,
  EventEnvelope,
  EventType,
  IntegrationTeardown,
  JsonValue,
  LogLevel,
  MessagePayload,
  MonitorOptions,
} from './types'

export const TRACE_KIT_CORE_NAME = '@trace-kit/core'
export const TRACE_KIT_CORE_VERSION = '0.0.0'

/**
 * 平台无关的 SDK 核心协调器。
 *
 * 它刻意不监听 window，也不决定 HTTP、Beacon 或批量策略，只做四件事：创建统一事件信封、
 * 保护 payload 的 JSON 边界、执行 beforeSend，然后把事件交给 Transport。这样浏览器 SDK、
 * 未来的 Node SDK 和测试可以共享同一份协议实现。
 */
export class MonitorClient {
  /** 当前客户端实例的关联键；第一版不会读写 Cookie 或 localStorage。 */
  readonly sessionId: string

  private readonly options: Required<Pick<MonitorOptions, 'clock' | 'idFactory'>> & MonitorOptions
  private readonly baseContext: Record<string, unknown>
  private readonly teardowns: IntegrationTeardown[] = []
  private closePromise?: Promise<void>
  private closed = false

  /**
   * 创建客户端并立即安装 Integration。idFactory 和 clock 默认使用运行时能力，
   * 但测试可以注入固定实现，从而断言完整事件内容而不依赖随机数或当前时间。
   */
  constructor(options: MonitorOptions) {
    if (!options.appId.trim()) throw new Error('MonitorClient requires a non-empty appId')

    this.options = {
      ...options,
      clock: options.clock ?? Date.now,
      idFactory: options.idFactory ?? defaultIdFactory,
    }
    this.baseContext = options.context ?? {}
    // sessionId 只生成一次；同一实例中的事件共享它，重建客户端才进入新会话。
    this.sessionId = this.options.idFactory()
    this.setupIntegrations(options.integrations ?? [])
  }

  async capture(
    eventType: EventType,
    payload: unknown,
    context: Record<string, unknown> = {}
  ): Promise<string | null> {
    this.assertOpen()

    // eventId 在第一次创建事件信封时生成；Transport 重试时必须复用这个身份。
    const event: EventEnvelope = {
      eventId: this.options.idFactory(),
      eventType,
      timestamp: new Date(this.options.clock()).toISOString(),
      appId: this.options.appId,
      sessionId: this.sessionId,
      sdk: {
        name: TRACE_KIT_CORE_NAME,
        version: TRACE_KIT_CORE_VERSION,
      },
      context: toContext({ ...this.baseContext, ...context }),
      payload: safeSerialize(payload),
    }

    if (this.options.release !== undefined) event.release = this.options.release
    if (this.options.environment !== undefined) event.environment = this.options.environment

    // beforeSend 可以是异步函数，所以 capture 返回 Promise；返回 null 表示主动丢弃。
    const prepared = this.options.beforeSend ? await this.options.beforeSend(event) : event
    if (prepared === null) return null

    // beforeSend 可能由业务方重写 payload/context，因此进入 Transport 前再守一次 JSON 边界。
    const transportEvent: EventEnvelope = {
      ...prepared,
      context: toContext(prepared.context),
      payload: safeSerialize(prepared.payload),
    }
    // Core 不在这里自行重试；批量、超时和失败回队属于具体 Transport 的职责。
    await this.options.transport.send(transportEvent)
    return transportEvent.eventId
  }

  /** 将 Error 或任意 rejection reason 转成统一 error 事件。 */
  captureException(error: unknown, context?: Record<string, unknown>): Promise<string | null> {
    return this.capture('error', normalizeError(error), context)
  }

  captureMessage(
    message: string,
    level: LogLevel = 'info',
    context?: Record<string, unknown>
  ): Promise<string | null> {
    // message 适合业务过程或人为诊断信息；真正的异常请使用 captureException。
    const payload: MessagePayload = { message, level }
    return this.capture('message', payload, context)
  }

  captureEvent(name: string, data: unknown = {}, context?: Record<string, unknown>): Promise<string | null> {
    // 自定义事件名放在 payload.name，eventType 保持为 custom，便于服务端按类别统一处理。
    if (!name.trim()) return Promise.reject(new Error('captureEvent requires a non-empty name'))
    const payload: CustomEventPayload = { name, data: safeSerialize(data) }
    return this.capture('custom', payload, context)
  }

  async flush(): Promise<void> {
    this.assertOpen()
    // flush 只等待 Transport 当前队列，不创建新事件，也不会关闭客户端。
    await this.options.transport.flush()
  }

  /**
   * 幂等关闭客户端：先移除 Integration，再关闭 Transport。共享 Promise 可以防止
   * 热更新和卸载流程同时调用 close 时重复释放资源。
   */
  close(): Promise<void> {
    // 多个调用者可能同时卸载；共享同一个 Promise 可保证 teardown 和 transport.close 只执行一次。
    this.closePromise ??= this.performClose()
    return this.closePromise
  }

  private setupIntegrations(integrations: MonitorOptions['integrations']): void {
    try {
      for (const integration of integrations ?? []) {
        const teardown = integration.setup(this)
        if (teardown) this.teardowns.push(teardown)
      }
    } catch (setupError) {
      for (const teardown of this.teardowns.reverse()) {
        try {
          teardown()
        } catch {
          // 保留最先发生的 setup 异常，它通常更接近根因。
        }
      }
      throw setupError
    }
  }

  private async performClose(): Promise<void> {
    this.closed = true
    const errors: unknown[] = []

    // 后安装的 Integration 往往依赖先安装者，按栈顺序清理更符合资源获取/释放语义。
    for (const teardown of this.teardowns.reverse()) {
      try {
        teardown()
      } catch (error) {
        errors.push(error)
      }
    }

    try {
      await this.options.transport.close()
    } catch (error) {
      errors.push(error)
    }

    if (errors.length === 1) throw errors[0]
    if (errors.length > 1) throw new AggregateError(errors, 'MonitorClient close failed')
  }

  private assertOpen(): void {
    if (this.closed) throw new Error('MonitorClient is closed')
  }
}

function toContext(context: Record<string, unknown>): Record<string, JsonValue> {
  const serialized = safeSerialize(context)
  return isJsonObject(serialized) ? serialized : {}
}

function isJsonObject(value: JsonValue): value is Record<string, JsonValue> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
