import { describe, expect, it, vi } from 'vitest'

import { ConsoleTransport, MemoryTransport } from './transports'
import type { EventEnvelope } from './types'

const event: EventEnvelope = {
  eventId: 'event-1',
  eventType: 'message',
  timestamp: '2026-10-25T08:00:00.000Z',
  appId: 'learning-app',
  sessionId: 'session-1',
  sdk: { name: '@trace-kit/core', version: '0.0.0' },
  context: {},
  payload: { message: 'hello', level: 'info' },
}

describe('MemoryTransport', () => {
  it('stores events for tests and rejects writes after close', async () => {
    const transport = new MemoryTransport()
    transport.send(event)
    expect(transport.events).toEqual([event])

    transport.clear()
    expect(transport.events).toEqual([])

    await transport.close()
    expect(() => transport.send(event)).toThrow('closed')
  })
})

describe('ConsoleTransport', () => {
  it('uses an injectable logger without depending on DOM types', async () => {
    const logger = { log: vi.fn() }
    const transport = new ConsoleTransport(logger)

    transport.send(event)
    expect(logger.log).toHaveBeenCalledWith('[TraceKit event]', event)

    await transport.close()
    expect(() => transport.send(event)).toThrow('closed')
  })
})
