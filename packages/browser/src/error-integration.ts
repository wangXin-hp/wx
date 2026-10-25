import type { Integration, MonitorClient } from '@trace-kit/core'

/**
 * 使用 addEventListener 捕获浏览器级错误，不覆盖业务代码可能已经设置的 window.onerror。
 * 这个 Integration 只负责监听和转发，错误协议、ID 和序列化仍由 Core MonitorClient 统一处理。
 */
export class BrowserErrorIntegration implements Integration {
  readonly name = 'browser-errors'

  setup(client: MonitorClient): () => void {
    const onError = (event: ErrorEvent): void => {
      const error = event.error ?? new Error(event.message || 'Unknown window error')
      void client
        .captureException(error, {
          source: 'window.error',
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        })
        .catch(() => undefined)
    }

    const onUnhandledRejection = (event: PromiseRejectionEvent): void => {
      // reason 可能不是 Error，直接交给 normalizeError 处理，而不是先强制转换类型。
      void client.captureException(event.reason, { source: 'unhandledrejection' }).catch(() => undefined)
    }

    window.addEventListener('error', onError)
    window.addEventListener('unhandledrejection', onUnhandledRejection)

    return () => {
      window.removeEventListener('error', onError)
      window.removeEventListener('unhandledrejection', onUnhandledRejection)
    }
  }
}
