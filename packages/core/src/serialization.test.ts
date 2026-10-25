import { describe, expect, it } from 'vitest'

import { normalizeError } from './error'
import { safeSerialize } from './serialization'

describe('safeSerialize', () => {
  it('handles circular references and non-JSON primitives', () => {
    const value: Record<string, unknown> = {
      count: 1n,
      missing: undefined,
      invalid: Number.NaN,
    }
    value.self = value

    expect(safeSerialize(value)).toEqual({
      count: '1n',
      missing: '[undefined]',
      invalid: 'NaN',
      self: '[Circular]',
    })
  })

  it('does not mistake shared references for a cycle', () => {
    const shared = { value: 1 }
    expect(safeSerialize({ first: shared, second: shared })).toEqual({
      first: { value: 1 },
      second: { value: 1 },
    })
  })

  it('survives a property getter that throws', () => {
    const value = Object.create(null) as Record<string, unknown>
    Object.defineProperty(value, 'broken', {
      enumerable: true,
      get() {
        throw new Error('getter failed')
      },
    })

    expect(safeSerialize(value)).toEqual({
      broken: '[Thrown while reading property: getter failed]',
    })
  })
})

describe('normalizeError', () => {
  it('keeps useful fields from Error', () => {
    const error = new TypeError('bad input', { cause: { field: 'email' } })
    expect(normalizeError(error)).toMatchObject({
      name: 'TypeError',
      message: 'bad input',
      cause: { field: 'email' },
    })
  })

  it.each([
    ['plain string', { name: 'Error', message: 'plain string' }],
    [42, { name: 'NonErrorException', message: '42', details: 42 }],
    [null, { name: 'NonErrorException', message: 'null', details: null }],
  ])('normalizes a non-Error rejection reason: %o', (reason, expected) => {
    expect(normalizeError(reason)).toMatchObject(expected)
  })

  it('normalizes a circular object rejection reason', () => {
    const reason: Record<string, unknown> = { message: 'object rejection' }
    reason.self = reason

    expect(normalizeError(reason)).toEqual({
      name: 'NonErrorException',
      message: 'object rejection',
      details: { message: 'object rejection', self: '[Circular]' },
    })
  })
})
