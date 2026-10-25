/** 浏览器 SDK 第一版允许采集的低敏上下文。刻意不包含 query、hash、Cookie 或请求头。 */
export interface BrowserContext {
  origin: string
  pathname: string
  referrer: string
  userAgent: string
  language: string
  platform: string
}

export interface BrowserRuntime {
  location: Pick<Location, 'origin' | 'pathname'>
  document: Pick<Document, 'referrer'>
  navigator: Pick<Navigator, 'userAgent' | 'language' | 'platform'>
}

/**
 * 从浏览器运行时提取最小上下文。
 * 使用参数注入而不是把 window 写死在函数体里，既便于 jsdom/单元测试，也明确采集边界。
 */
export function collectBrowserContext(runtime: BrowserRuntime = getBrowserRuntime()): BrowserContext {
  return {
    origin: runtime.location.origin,
    pathname: runtime.location.pathname,
    referrer: runtime.document.referrer,
    userAgent: runtime.navigator.userAgent,
    language: runtime.navigator.language,
    platform: runtime.navigator.platform,
  }
}

function getBrowserRuntime(): BrowserRuntime {
  return {
    location: window.location,
    document,
    navigator,
  }
}
