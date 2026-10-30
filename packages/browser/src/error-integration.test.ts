import { describe, expect, it } from 'vitest'

import { MemoryTransport, MonitorClient } from '@trace-kit/core'

import { BrowserErrorIntegration } from './error-integration'

function createClient(transport: MemoryTransport): MonitorClient {
  return new MonitorClient({
    appId: 'browser-test',
    dsn: 'tracekit://public-test@localhost/browser-test',
    transport,
    integrations: [new BrowserErrorIntegration()],
    context: { origin: 'https://example.test', pathname: '/test' },
    idFactory: (() => {
      let index = 0
      return () => `id-${++index}`
    })(),
  })
}

function dispatchRejection(reason: unknown): void {
  const event = new Event('unhandledrejection')
  Object.defineProperty(event, 'reason', { value: reason })
  window.dispatchEvent(event)
}

describe('BrowserErrorIntegration', () => {
  it('captures ErrorEvent without replacing window.onerror', async () => {
    const transport = new MemoryTransport()
    const client = createClient(transport)
    const existingOnError = () => undefined
    window.onerror = existingOnError

    window.dispatchEvent(
      new ErrorEvent('error', {
        error: new TypeError('script failed'),
        filename: '/assets/app.js',
        lineno: 10,
        colno: 4,
        message: 'script failed',
      })
    )
    await Promise.resolve()

    expect(window.onerror).toBe(existingOnError)
    expect(transport.events[0]).toMatchObject({
      eventType: 'error',
      context: {
        origin: 'https://example.test',
        source: 'window.error',
        filename: '/assets/app.js',
        lineno: 10,
        colno: 4,
      },
      payload: { name: 'TypeError', message: 'script failed' },
    })
    await client.close()
  })

  it.each([new Error('error reason'), 'string reason', { message: 'object reason', code: 400 }])(
    'captures unhandled rejection reason: %o',
    async (reason) => {
      const transport = new MemoryTransport()
      const client = createClient(transport)

      dispatchRejection(reason)
      await Promise.resolve()

      expect(transport.events).toHaveLength(1)
      expect(transport.events[0]?.eventType).toBe('error')
      expect(transport.events[0]?.context.source).toBe('unhandledrejection')
      await client.close()
    }
  )

  it('handles a circular rejection object and removes listeners on close', async () => {
    const reason: Record<string, unknown> = { message: 'circular reason' }
    reason.self = reason
    const transport = new MemoryTransport()
    const client = createClient(transport)

    dispatchRejection(reason)
    await Promise.resolve()
    expect(transport.events[0]?.payload).toMatchObject({
      message: 'circular reason',
      details: { self: '[Circular]' },
    })

    await client.close()
    dispatchRejection(new Error('after close'))
    await Promise.resolve()
    expect(transport.events).toHaveLength(1)
  })
})
