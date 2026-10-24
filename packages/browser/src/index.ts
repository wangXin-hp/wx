import { TRACE_KIT_CORE_NAME } from '@trace-kit/core'

export const TRACE_KIT_BROWSER_NAME = '@trace-kit/browser'

/**
 * 这个函数是检查点 1 的依赖探针：它证明 browser 构建时保留了 core 包边界，
 * playground 也确实通过 workspace 协议消费构建后的 SDK，而不是复制源码。
 */
export function getCorePackageName(): string {
  return TRACE_KIT_CORE_NAME
}
