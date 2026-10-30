import { describe, expect, it, vi } from 'vitest'

import { MonitorClient } from './client'
import { MemoryTransport } from './transports'
import type { Integration, Transport } from './types'

function createIdFactory(...ids: string[]): () => string {
  let index = 0
  return () => ids[index++] ?? `generated-${index}`
}

describe('MonitorClient event protocol', () => {
  it('creates unique event IDs while keeping one session ID for the client lifetime', async () => {
    const transport = new MemoryTransport()
    const client = new MonitorClient({
      appId: 'learning-app',
      release: '1.2.3',
      environment: 'test',
      context: { region: 'local' },
      transport,
      idFactory: createIdFactory('session-1', 'event-1', 'event-2'),
      clock: () => Date.parse('2026-10-25T08:00:00.000Z'),
    })

    await client.captureMessage('first')
    await client.captureEvent('second', { ok: true }, { route: '/demo' })

    expect(transport.events.map((event) => event.eventId)).toEqual(['event-1', 'event-2'])
    expect(transport.events.map((event) => event.sessionId)).toEqual(['session-1', 'session-1'])
    expect(transport.events[0]).toMatchObject({
      timestamp: '2026-10-25T08:00:00.000Z',
      appId: 'learning-app',
      release: '1.2.3',
      environment: 'test',
      sdk: { name: '@trace-kit/core', version: '0.0.0' },
      context: { region: 'local' },
    })
    expect(transport.events[1]?.context).toEqual({ region: 'local', route: '/demo' })
  })

  it('lets beforeSend modify or discard an event', async () => {
    const transport = new MemoryTransport()
    const client = new MonitorClient({
      appId: 'learning-app',
      transport,
      idFactory: createIdFactory('session', 'keep-id', 'drop-id'),
      beforeSend(event) {
        if (event.eventId === 'drop-id') return null
        return { ...event, context: { ...event.context, scrubbed: true } }
      },
    })

    await expect(client.captureMessage('keep')).resolves.toBe('keep-id')
    await expect(client.captureMessage('drop')).resolves.toBeNull()
    expect(transport.events).toHaveLength(1)
    expect(transport.events[0]?.context).toEqual({ scrubbed: true })
  })

  it('stamps every event with the configured DSN and keeps it immutable through beforeSend', async () => {
    const transport = new MemoryTransport()
    const client = new MonitorClient({
      appId: 'learning-app',
      dsn: ' tracekit://public-key@localhost/project-a ',
      transport,
      beforeSend: (event) => ({ ...event, dsn: 'tracekit://another-project' }),
      idFactory: createIdFactory('session', 'event'),
    })

    await client.captureMessage('belongs to project A')

    expect(transport.events[0]?.dsn).toBe('tracekit://public-key@localhost/project-a')
  })

  it('supports asynchronous beforeSend', async () => {
    const transport = new MemoryTransport()
    const client = new MonitorClient({
      appId: 'learning-app',
      transport,
      idFactory: createIdFactory('session', 'event'),
      beforeSend: async (event) => ({ ...event, environment: 'async-hook' }),
    })

    await client.captureEvent('checkout')
    expect(transport.events[0]?.environment).toBe('async-hook')
  })

  it('hands one stable event identity to a retrying transport', async () => {
    const attemptedIds: string[] = []
    const retryingTransport: Transport = {
      send(event) {
        // Transport 拥有重试策略，因此两次尝试复用 capture 已经创建好的同一个 envelope。
        attemptedIds.push(event.eventId, event.eventId)
      },
      async flush() {},
      async close() {},
    }
    const client = new MonitorClient({
      appId: 'learning-app',
      transport: retryingTransport,
      idFactory: createIdFactory('session', 'stable-event'),
    })

    await client.captureMessage('retry me')
    expect(attemptedIds).toEqual(['stable-event', 'stable-event'])
  })
})

describe('MonitorClient lifecycle', () => {
  it('tears integrations down in reverse order and closes only once', async () => {
    const calls: string[] = []
    const integration = (name: string): Integration => ({
      name,
      setup() {
        calls.push(`setup:${name}`)
        return () => calls.push(`teardown:${name}`)
      },
    })
    const transport: Transport = {
      send() {},
      async flush() {},
      close: vi.fn(async () => {
        calls.push('transport:close')
      }),
    }
    const client = new MonitorClient({
      appId: 'learning-app',
      transport,
      integrations: [integration('first'), integration('second')],
    })

    await Promise.all([client.close(), client.close()])

    expect(calls).toEqual([
      'setup:first',
      'setup:second',
      'teardown:second',
      'teardown:first',
      'transport:close',
    ])
    expect(transport.close).toHaveBeenCalledTimes(1)
    await expect(client.captureMessage('too late')).rejects.toThrow('MonitorClient is closed')
  })

  it('rolls back earlier integrations if a later setup fails', () => {
    const teardown = vi.fn()
    const integrations: Integration[] = [
      { name: 'installed', setup: () => teardown },
      {
        name: 'broken',
        setup() {
          throw new Error('setup failed')
        },
      },
    ]

    expect(
      () => new MonitorClient({ appId: 'learning-app', transport: new MemoryTransport(), integrations })
    ).toThrow('setup failed')
    expect(teardown).toHaveBeenCalledOnce()
  })

  it('rejects empty application and custom event names', async () => {
    expect(() => new MonitorClient({ appId: ' ', transport: new MemoryTransport() })).toThrow(
      'non-empty appId'
    )

    const client = new MonitorClient({ appId: 'learning-app', transport: new MemoryTransport() })
    await expect(client.captureEvent(' ')).rejects.toThrow('non-empty name')
    expect(
      () => new MonitorClient({ appId: 'learning-app', dsn: ' ', transport: new MemoryTransport() })
    ).toThrow('non-empty dsn')
  })
})
