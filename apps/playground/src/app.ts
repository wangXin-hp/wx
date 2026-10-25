import { getCorePackageName, initBrowserMonitoring, TRACE_KIT_BROWSER_NAME } from '@trace-kit/browser'
import { MemoryTransport, type MonitorClient } from '@trace-kit/core'

let activeClient: MonitorClient | undefined

/**
 * Playground 不是生产 UI，而是 SDK 的可观察实验台：每个按钮都对应一个明确的采集入口，
 * 事件会同时出现在页面 JSON 面板和 Console，方便把“用户操作 → SDK → 事件对象”串起来。
 */
export function renderApp(container: HTMLElement): void {
  void activeClient?.close()

  const transport = new MemoryTransport()
  const client = initBrowserMonitoring({
    appId: 'tracekit-playground',
    transport,
    context: { source: 'playground' },
  })
  activeClient = client

  container.innerHTML = `
    <section class="shell">
      <p class="eyebrow">CHECKPOINT 4</p>
      <h1>TraceKit Playground</h1>
      <p class="intro">
        点击按钮触发错误、性能或手动事件。Browser SDK 会把它们交给 Core，页面下方展示最终 EventEnvelope。
      </p>
      <dl class="package-grid">
        <div><dt>Browser package</dt><dd>${TRACE_KIT_BROWSER_NAME}</dd></div>
        <div><dt>Core dependency</dt><dd>${getCorePackageName()}</dd></div>
      </dl>
      <div class="actions">
        <button data-action="sync-error">触发同步错误</button>
        <button data-action="rejection">触发 Promise rejection</button>
        <button data-action="exception">手动捕获异常</button>
        <button data-action="message">发送消息事件</button>
        <button data-action="custom">发送自定义事件</button>
        <button data-action="refresh">刷新事件面板</button>
        <button data-action="clear">清空事件</button>
      </div>
      <p class="hint">同时观察 Console、下面的事件 JSON 和浏览器的 Sources/Network 面板。</p>
      <pre class="event-output" data-event-output>[]</pre>
    </section>
  `

  const output = container.querySelector<HTMLElement>('[data-event-output]')
  const renderEvents = (): void => {
    if (!output) return
    output.textContent = JSON.stringify(transport.events, null, 2)
    console.log('[TraceKit playground events]', transport.events)
  }

  const capture = (promise: Promise<string | null>): void => {
    void promise.then(renderEvents).catch((error: unknown) => console.error('[TraceKit playground]', error))
  }

  container.querySelector('[data-action="sync-error"]')?.addEventListener('click', () => {
    // 故意抛出，让 BrowserErrorIntegration 通过 window error 自动捕获。
    throw new Error('playground synchronous error')
  })

  container.querySelector('[data-action="rejection"]')?.addEventListener('click', () => {
    // 不 await 这个 Promise，模拟真实应用中未处理的 rejection。
    void Promise.reject(new Error('playground unhandled rejection'))
  })

  container.querySelector('[data-action="exception"]')?.addEventListener('click', () => {
    capture(client.captureException(new Error('playground manual exception')))
  })

  container.querySelector('[data-action="message"]')?.addEventListener('click', () => {
    capture(client.captureMessage('用户点击了支付按钮'))
  })

  container.querySelector('[data-action="custom"]')?.addEventListener('click', () => {
    capture(client.captureEvent('button_clicked', { button: 'pay' }))
  })

  container.querySelector('[data-action="clear"]')?.addEventListener('click', () => {
    transport.clear()
    renderEvents()
  })

  container.querySelector('[data-action="refresh"]')?.addEventListener('click', renderEvents)

  // LOAD 可能在初始化后立即产生，刷新一次让你能看到自动性能事件；其他 Web Vitals 会在浏览器时机成熟后出现。
  window.setTimeout(renderEvents, 0)
}
