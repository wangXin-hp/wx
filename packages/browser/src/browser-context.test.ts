import { describe, expect, it } from 'vitest'

import { collectBrowserContext } from './browser-context'

describe('collectBrowserContext', () => {
  it('keeps only the intentionally supported low-sensitivity fields', () => {
    expect(
      collectBrowserContext({
        location: { origin: 'https://example.test', pathname: '/checkout' },
        document: { referrer: 'https://search.test/' },
        navigator: {
          userAgent: 'TraceKit Test Browser',
          language: 'zh-CN',
          platform: 'Win32',
        },
      })
    ).toEqual({
      origin: 'https://example.test',
      pathname: '/checkout',
      referrer: 'https://search.test/',
      userAgent: 'TraceKit Test Browser',
      language: 'zh-CN',
      platform: 'Win32',
    })
  })
})
