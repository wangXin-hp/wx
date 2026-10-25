export { collectBrowserContext } from './browser-context'
export type { BrowserContext, BrowserRuntime } from './browser-context'
export { BrowserErrorIntegration } from './error-integration'
export { initBrowserMonitoring } from './init'
export type { BrowserMonitoringOptions } from './init'

import { TRACE_KIT_CORE_NAME } from '@trace-kit/core'

export const TRACE_KIT_BROWSER_NAME = '@trace-kit/browser'

/** 保留检查点 1 的包边界探针，方便 Playground 验证 browser 仍通过 workspace 消费 core。 */
export function getCorePackageName(): string {
  return TRACE_KIT_CORE_NAME
}
