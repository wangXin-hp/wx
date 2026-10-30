import type { MonitorClient } from './client'

/** JSON 传输协议允许的值；Transport 可以直接序列化它们，不需要猜测运行时对象。 */
export type JsonPrimitive = boolean | null | number | string
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue }

/**
 * 第一版协议预留的事件类别。具体事件名放在 payload 中，例如 custom + button_clicked，
 * 这样后端可以先按类别分流，再按 payload 的业务字段做二次解析。
 */
export type EventType = 'custom' | 'error' | 'message' | 'performance'

/**
 * DSN 是接入项目的公开路由标识。它不是数据库密码或管理令牌，
 * 但仍建议由服务端生成，避免客户端自行伪造不存在的项目。
 */
export type Dsn = string

/** message 事件的严重程度，不等同于 HTTP 状态码。 */
export type LogLevel = 'debug' | 'error' | 'info' | 'warning'

/** 发送方身份信息；version 是协议兼容判断的依据，不是应用发布版本。 */
export interface SdkInfo {
  name: string
  version: string
}

export interface EventEnvelope<TPayload = JsonValue> {
  /**
   * 事件所属项目的 DSN。它会随事件一起进入 Transport，保证后续服务端可以
   * 在同一个采集入口中区分多个接入项目；重试时必须保持不变。
   */
  dsn?: Dsn
  /**
   * eventId 是一次事件的稳定身份。Transport 重试时必须复用整个事件，不能重新生成 ID，
   * 否则服务端无法去重，同一故障也无法在日志和数据链路中被准确追踪。
   */
  eventId: string
  /** 服务端的第一层路由键，避免每种 payload 都依赖猜测。 */
  eventType: EventType
  /** 客户端事件实际发生时间；接收时间应由未来的数据服务另行记录。 */
  timestamp: string
  /** 业务应用标识，不是用户 ID，也不应该放入用户隐私信息。 */
  appId: string
  /** 第一版只标识当前 MonitorClient 实例，不读取 Cookie 或 localStorage。 */
  sessionId: string
  /** SDK 版本让服务端能在协议演进时选择兼容的解析逻辑。 */
  sdk: SdkInfo
  /** 应用构建/发布版本；用于定位“哪个版本引入了问题”。 */
  release?: string
  /** 例如 development、staging、production；用于隔离不同运行环境的数据。 */
  environment?: string
  /** 已经过 JSON 安全化的公共上下文，例如 route、browser 等低敏信息。 */
  context: Record<string, JsonValue>
  /** 事件类型对应的数据，必须能安全进入 JSON 请求体。 */
  payload: TPayload
}

/**
 * 上报前的最后一个业务扩展点。返回 null 表示主动丢弃事件，常用于采样或脱敏失败保护。
 * 返回的新对象会在进入 Transport 前再次做 JSON 安全化。
 */
export type BeforeSend = (event: EventEnvelope) => EventEnvelope | null | Promise<EventEnvelope | null>

export interface Transport {
  /** 接收一个已经完成协议封装的事件；重试时必须复用其中的 eventId。 */
  send(event: EventEnvelope): Promise<void> | void
  /** 等待内部队列完成发送；内存 Transport 可以立即完成。 */
  flush(): Promise<void>
  /** 释放定时器、监听器和网络资源；调用后不应再接受新事件。 */
  close(): Promise<void>
}

export type IntegrationTeardown = () => void

export interface Integration {
  name: string
  /** setup 返回清理函数，确保热更新或重复初始化后不会遗留监听器和定时器。 */
  setup(client: MonitorClient): IntegrationTeardown | void
}

export type Clock = () => number
export type IdFactory = () => string

export interface MonitorOptions {
  /** 由接入方提供的稳定应用标识，不能留空。 */
  appId: string
  /**
   * 可选的项目路由标识。Core 保留可选是为了兼容非网络测试/Node 场景；浏览器
   * SDK 的公开初始化入口会要求提供它，因为浏览器数据必须归属一个项目。
   */
  dsn?: Dsn
  /** Core 不决定网络协议，调用方必须明确选择一个 Transport。 */
  transport: Transport
  /** 按传入顺序安装，关闭时按逆序清理。 */
  integrations?: Integration[]
  release?: string
  environment?: string
  /** 每个事件都会继承的公共上下文；进入事件前会做安全序列化。 */
  context?: Record<string, unknown>
  beforeSend?: BeforeSend
  /** 注入后可以让测试拥有完全可预测的 sessionId 和 eventId。 */
  idFactory?: IdFactory
  /** 返回 Unix 毫秒；注入时钟可避免测试依赖真实时间。 */
  clock?: Clock
}

export type ErrorPayload = {
  name: string
  message: string
  stack?: string
  cause?: JsonValue
  details?: JsonValue
}

export type MessagePayload = {
  message: string
  level: LogLevel
}

export type CustomEventPayload = {
  name: string
  data: JsonValue
}
