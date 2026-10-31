export { collectBrowserContext } from './browser-context'
export type { BrowserContext, BrowserRuntime } from './browser-context'
export { BrowserErrorIntegration } from './error-integration'
export { initBrowserMonitoring } from './init'
export { FetchTransport } from './fetch-transport'
export type { FetchTransportOptions } from './fetch-transport'
export type { BrowserMonitoringOptions } from './init'
export { WebVitalsIntegration, mapWebVitalMetric, readLoadMetric } from './performance'
export type {
  LoadPayload,
  NavigationKind,
  WebVitalName,
  WebVitalsIntegrationOptions,
  WebVitalsPayload,
} from './performance'

import { TRACE_KIT_CORE_NAME } from '@trace-kit/core'

export const TRACE_KIT_BROWSER_NAME = '@trace-kit/browser'

/** 保留检查点 1 的包边界探针，方便 Playground 验证 browser 仍通过 workspace 消费 core。 */
export function getCorePackageName(): string {
  return TRACE_KIT_CORE_NAME
}
