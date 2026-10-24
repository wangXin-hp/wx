import { describe, expect, it } from 'vitest'

import { getCorePackageName, TRACE_KIT_BROWSER_NAME } from './index'

describe('@trace-kit/browser package boundary', () => {
  it('consumes core through the workspace package name', () => {
    expect(TRACE_KIT_BROWSER_NAME).toBe('@trace-kit/browser')
    expect(getCorePackageName()).toBe('@trace-kit/core')
  })
})
