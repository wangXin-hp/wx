import { describe, expect, it } from 'vitest'

import { TRACE_KIT_CORE_NAME } from './index'

describe('@trace-kit/core package boundary', () => {
  it('exports a stable package name', () => {
    expect(TRACE_KIT_CORE_NAME).toBe('@trace-kit/core')
  })
})
