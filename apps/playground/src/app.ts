import { getCorePackageName, TRACE_KIT_BROWSER_NAME } from '@trace-kit/browser'

export function renderApp(container: HTMLElement): void {
  container.innerHTML = `
    <section class="shell">
      <p class="eyebrow">CHECKPOINT 1</p>
      <h1>TraceKit Playground</h1>
      <p class="intro">
        工程骨架已经连通。后续检查点会在这里逐步加入错误、性能与自定义事件调试能力。
      </p>
      <dl class="package-grid">
        <div>
          <dt>Browser package</dt>
          <dd>${TRACE_KIT_BROWSER_NAME}</dd>
        </div>
        <div>
          <dt>Core dependency</dt>
          <dd>${getCorePackageName()}</dd>
        </div>
      </dl>
      <p class="hint">打开浏览器开发者工具，确认页面没有模块解析错误。</p>
    </section>
  `
}
