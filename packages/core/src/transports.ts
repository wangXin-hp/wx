import type { EventEnvelope, Transport } from './types'

/**
 * 只把事件保存在内存中的开发/测试 Transport。
 * 它不模拟网络成功率，因此适合断言“客户端生成了什么”，不适合验证重试和超时。
 */
export class MemoryTransport implements Transport {
  readonly events: EventEnvelope[] = []
  private closed = false

  send(event: EventEnvelope): void {
    if (this.closed) throw new Error('MemoryTransport is closed')
    this.events.push(event)
  }

  async flush(): Promise<void> {
    // 内存 Transport 没有待发送队列；保留该方法是为了与真实异步 Transport 使用同一接口。
  }

  async close(): Promise<void> {
    this.closed = true
  }

  clear(): void {
    this.events.length = 0
  }
}

/** 为了让 Core 不依赖 DOM，ConsoleTransport 接收最小 logger 形状。 */
export interface ConsoleLike {
  log(...values: unknown[]): void
}

/** 把最终事件打印出来的调试 Transport；正式上报应在 browser 包提供网络 Transport。 */
export class ConsoleTransport implements Transport {
  private readonly logger: ConsoleLike
  private closed = false

  constructor(logger: ConsoleLike = getDefaultConsole()) {
    this.logger = logger
  }

  send(event: EventEnvelope): void {
    if (this.closed) throw new Error('ConsoleTransport is closed')
    this.logger.log('[TraceKit event]', event)
  }

  async flush(): Promise<void> {
    // Console 没有缓冲区；真实网络 Transport 会在这里等待队列发送完成。
  }

  async close(): Promise<void> {
    this.closed = true
  }
}

function getDefaultConsole(): ConsoleLike {
  const logger = (globalThis as { console?: ConsoleLike }).console
  if (!logger) throw new Error('ConsoleTransport requires a console-like logger')
  return logger
}
