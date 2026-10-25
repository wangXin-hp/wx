import { describe, expect, it, vi } from 'vitest'

import { MemoryTransport, MonitorClient } from '@trace-kit/core'
import type { Metric } from 'web-vitals'

import { WebVitalsIntegration, mapWebVitalMetric, readLoadMetric } from './performance'

const callbacks = new Map<string, (metric: Metric) => void>()

vi.mock('web-vitals', () => ({
  onCLS: vi.fn((callback: (metric: Metric) => void) => callbacks.set('CLS', callback)),
  onFCP: vi.fn((callback: (metric: Metric) => void) => callbacks.set('FCP', callback)),
  onINP: vi.fn((callback: (metric: Metric) => void) => callbacks.set('INP', callback)),
  onLCP: vi.fn((callback: (metric: Metric) => void) => callbacks.set('LCP', callback)),
  onTTFB: vi.fn((callback: (metric: Metric) => void) => callbacks.set('TTFB', callback)),
}))

function metric(name: Metric['name']): Metric {
  return {
    name,
    value: 123,
    delta: 10,
    rating: 'good',
    id: `${name.toLowerCase()}-id`,
    entries: [],
    navigationType: 'navigate',
    navigationId: 1,
  }
}

describe('performance payload mapping', () => {
  it('keeps the stable fields needed by the event protocol', () => {
    expect(mapWebVitalMetric(metric('LCP'))).toEqual({
      name: 'LCP',
      value: 123,
      delta: 10,
      rating: 'good',
      navigationType: 'navigate',
      metricId: 'lcp-id',
    })
  })

  it('uses loadEventEnd first and falls back when it is not ready', () => {
    const payload = readLoadMetric({
      performance: {
        getEntriesByType: () =>
          [{ type: 'navigate', loadEventEnd: 0, domComplete: 80 }] as PerformanceNavigationTiming[],
        now: () => 100,
      },
    })

    expect(payload).toMatchObject({ name: 'LOAD', value: 80, source: 'navigation-timing' })
  })
})

describe('WebVitalsIntegration', () => {
  it('registers all five metrics and captures a callback as a performance event', async () => {
    const transport = new MemoryTransport()
    const client = new MonitorClient({
      appId: 'performance-test',
      transport,
      integrations: [new WebVitalsIntegration({ captureLoad: false })],
    })

    expect(callbacks.size).toBe(5)
    callbacks.get('CLS')?.(metric('CLS'))
    await Promise.resolve()

    expect(transport.events[0]).toMatchObject({
      eventType: 'performance',
      context: { source: 'web-vitals' },
      payload: { name: 'CLS', value: 123, metricId: 'cls-id' },
    })
    await client.close()
  })

  it('does not report metrics after close', async () => {
    const transport = new MemoryTransport()
    const client = new MonitorClient({
      appId: 'performance-test',
      transport,
      integrations: [new WebVitalsIntegration({ captureLoad: false })],
    })

    await client.close()
    callbacks.get('LCP')?.(metric('LCP'))
    await Promise.resolve()
    expect(transport.events).toHaveLength(0)
  })
})
