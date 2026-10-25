import {
  ConsoleTransport,
  MonitorClient,
  type Integration,
  type MonitorOptions,
  type Transport,
} from '@trace-kit/core'

import { collectBrowserContext } from './browser-context'
import { BrowserErrorIntegration } from './error-integration'
import { WebVitalsIntegration } from './performance'

export interface BrowserMonitoringOptions extends Omit<
  MonitorOptions,
  'context' | 'integrations' | 'transport'
> {
  /** 未指定时使用控制台 Transport；真正的 FetchTransport 会在后续检查点加入。 */
  transport?: Transport
  context?: Record<string, unknown>
  integrations?: Integration[]
  /** 关闭默认错误监听时仍可以追加自己的 Integration。 */
  defaultIntegrations?: boolean
}

/**
 * 浏览器 SDK 的便利入口。
 * 默认安装 BrowserErrorIntegration，并把经过筛选的浏览器上下文放进每条事件的 context。
 * 当前默认 ConsoleTransport 只用于学习和调试，不代表已经完成服务端上报。
 */
export function initBrowserMonitoring(options: BrowserMonitoringOptions): MonitorClient {
  const integrations =
    options.defaultIntegrations === false ? [] : [new BrowserErrorIntegration(), new WebVitalsIntegration()]

  return new MonitorClient({
    ...options,
    transport: options.transport ?? new ConsoleTransport(),
    context: {
      ...collectBrowserContext(),
      ...options.context,
    },
    integrations: [...integrations, ...(options.integrations ?? [])],
  })
}
