import { onCLS, onFCP, onINP, onLCP, onTTFB, type Metric, type ReportOpts } from 'web-vitals'
import type { Integration, MonitorClient } from '@trace-kit/core'

export type WebVitalName = 'CLS' | 'FCP' | 'INP' | 'LCP' | 'TTFB'
export type NavigationKind =
  | 'navigate'
  | 'reload'
  | 'back-forward'
  | 'back-forward-cache'
  | 'prerender'
  | 'restore'
  | 'soft-navigation'
  | 'unknown'

export interface WebVitalsPayload {
  name: WebVitalName
  value: number
  delta: number
  rating: 'good' | 'needs-improvement' | 'poor'
  navigationType: NavigationKind
  /** web-vitals 为同一指标实例提供的去重 ID。 */
  metricId: string
}

export interface LoadPayload {
  name: 'LOAD'
  value: number
  navigationType: NavigationKind
  /** 标明该值来自 Navigation Timing，而不是 web-vitals 算法。 */
  source: 'navigation-timing'
}

export interface WebVitalsIntegrationOptions {
  /** 默认 false，避免一个页面生命周期为同一指标产生大量中间事件。 */
  reportAllChanges?: boolean
  /** 默认 true；使用 Navigation Timing 记录页面 LOAD。 */
  captureLoad?: boolean
}

/**
 * 将 web-vitals Metric 映射为 TraceKit 自己的 payload。
 * TraceKit 不复制 CLS/LCP 等标准算法，只保留服务端协议需要的稳定字段。
 */
export function mapWebVitalMetric(metric: Metric): WebVitalsPayload {
  return {
    name: metric.name,
    value: metric.value,
    delta: metric.delta,
    rating: metric.rating,
    navigationType: metric.navigationType ?? 'unknown',
    metricId: metric.id,
  }
}

export interface NavigationTimingRuntime {
  performance: Pick<Performance, 'getEntriesByType' | 'now'>
}

/**
 * 计算页面 LOAD：优先使用 loadEventEnd；某些浏览器在 load 回调刚触发时仍返回 0，
 * 此时使用 domComplete，再退化到 performance.now()，并保持 source 说明数据来源。
 */
export function readLoadMetric(
  runtime: NavigationTimingRuntime = { performance: window.performance }
): LoadPayload | null {
  const entry = runtime.performance.getEntriesByType('navigation')[0] as
    PerformanceNavigationTiming | undefined
  if (!entry) return null

  const value = entry.loadEventEnd || entry.domComplete || runtime.performance.now()
  return {
    name: 'LOAD',
    value,
    navigationType: normalizeNavigationType(entry.type),
    source: 'navigation-timing',
  }
}

/**
 * 注册五个 Core Web Vitals 回调和页面 LOAD 回调。
 * web-vitals 本身没有返回 unsubscribe API，因此 teardown 使用 active 标记阻止关闭后的事件进入 SDK。
 */
export class WebVitalsIntegration implements Integration {
  readonly name = 'web-vitals'
  private readonly options: Required<WebVitalsIntegrationOptions>

  constructor(options: WebVitalsIntegrationOptions = {}) {
    this.options = {
      reportAllChanges: options.reportAllChanges ?? false,
      captureLoad: options.captureLoad ?? true,
    }
  }

  setup(client: MonitorClient): () => void {
    let active = true
    const report = (metric: Metric): void => {
      if (!active) return
      void client
        .capture('performance', mapWebVitalMetric(metric), { source: 'web-vitals' })
        .catch(() => undefined)
    }
    const reportOptions: ReportOpts = { reportAllChanges: this.options.reportAllChanges }

    onCLS(report, reportOptions)
    onFCP(report, reportOptions)
    onINP(report, reportOptions)
    onLCP(report, reportOptions)
    onTTFB(report, reportOptions)

    if (this.options.captureLoad) {
      const reportLoad = (): void => {
        if (!active) return
        const payload = readLoadMetric()
        if (payload)
          void client.capture('performance', payload, { source: 'navigation-timing' }).catch(() => undefined)
      }

      if (document.readyState === 'complete') {
        reportLoad()
      } else {
        window.addEventListener('load', reportLoad, { once: true })
      }

      return () => {
        active = false
        window.removeEventListener('load', reportLoad)
      }
    }

    return () => {
      active = false
    }
  }
}

// DOM 的 NavigationTimingType 与 web-vitals 的 NavigationType 名称相近但不是同一 TS 类型；
// 这里按浏览器运行时字符串做边界映射，避免把两个标准库声明强行混用。
function normalizeNavigationType(type: string | undefined): NavigationKind {
  if (type === 'back_forward') return 'back-forward'
  if (type === 'navigate' || type === 'reload') return type
  return 'unknown'
}
