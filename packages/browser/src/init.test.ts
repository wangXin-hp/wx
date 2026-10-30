import { describe, expect, it } from 'vitest'

import { MemoryTransport } from '@trace-kit/core'

import { initBrowserMonitoring } from './init'

describe('initBrowserMonitoring', () => {
  it('requires a DSN so browser events have a project boundary', () => {
    // TypeScript 会在调用方缺少 dsn 时直接报错；运行时仍校验空白字符串。
    expect(() =>
      initBrowserMonitoring({
        appId: 'browser-test',
        dsn: ' ',
        transport: new MemoryTransport(),
        defaultIntegrations: false,
      })
    ).toThrow('non-empty dsn')
  })

  it('adds browser context and default error integration', async () => {
    const transport = new MemoryTransport()
    const client = initBrowserMonitoring({
      appId: 'browser-test',
      dsn: 'tracekit://public-test@localhost/browser-test',
      transport,
      context: { feature: 'playground' },
    })

    await client.captureMessage('hello')
    expect(transport.events[0]?.context).toMatchObject({
      origin: window.location.origin,
      pathname: window.location.pathname,
      feature: 'playground',
    })
    await client.close()
  })

  it('can disable default integrations', async () => {
    const transport = new MemoryTransport()
    const client = initBrowserMonitoring({
      appId: 'browser-test',
      dsn: 'tracekit://public-test@localhost/browser-test',
      transport,
      defaultIntegrations: false,
    })

    const previousOnError = window.onerror
    window.onerror = () => true
    try {
      // 不附带 error 对象，避免 jsdom 把这个“无监听器验证”误报成测试框架未处理异常。
      window.dispatchEvent(new Event('error'))
      await Promise.resolve()
      expect(transport.events).toHaveLength(0)
    } finally {
      window.onerror = previousOnError
      await client.close()
    }
  })
})
