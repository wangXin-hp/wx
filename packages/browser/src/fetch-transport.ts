import type { EventEnvelope, Transport } from '@trace-kit/core'

export interface FetchTransportOptions {
  endpoint?: string
  batchSize?: number
  flushInterval?: number
}

export class FetchTransport implements Transport {
  private readonly endpoint: string
  private readonly batchSize: number
  private readonly queue: EventEnvelope[] = []
  private timer?: number
  private flushing?: Promise<void>
  private closed = false

  constructor(options: FetchTransportOptions = {}) {
    this.endpoint = options.endpoint ?? '/collect'
    this.batchSize = options.batchSize ?? 10
    this.timer = window.setInterval(() => void this.flush(), options.flushInterval ?? 5000)
  }

  send(event: EventEnvelope): void {
    if (this.closed) throw new Error('FetchTransport is closed')
    this.queue.push(event)
    if (this.queue.length >= this.batchSize) void this.flush()
  }

  flush(): Promise<void> {
    if (this.flushing) return this.flushing
    this.flushing = this.flushQueue().finally(() => {
      this.flushing = undefined
    })
    return this.flushing
  }

  async close(): Promise<void> {
    if (this.closed) return
    this.closed = true
    if (this.timer !== undefined) window.clearInterval(this.timer)
    await this.flush()
  }

  private async flushQueue(): Promise<void> {
    if (this.queue.length === 0) return
    const events = this.queue.splice(0, this.batchSize)
    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events }),
      })
      if (!response.ok) throw new Error(`Collector returned ${response.status}`)
    } catch (error) {
      this.queue.unshift(...events)
      throw error
    }
  }
}
