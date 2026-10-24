import { beforeEach, describe, expect, it } from 'vitest'

import { renderApp } from './app'

describe('TraceKit playground', () => {
  beforeEach(() => {
    document.body.innerHTML = '<main id="app"></main>'
  })

  it('renders package boundary information', () => {
    const container = document.querySelector<HTMLElement>('#app')

    if (!container) {
      throw new Error('Test fixture is missing #app.')
    }

    renderApp(container)

    expect(container.textContent).toContain('@trace-kit/browser')
    expect(container.textContent).toContain('@trace-kit/core')
  })
})
