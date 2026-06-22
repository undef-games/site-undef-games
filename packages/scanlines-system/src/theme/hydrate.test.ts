// packages/scanlines-system/src/theme/hydrate.test.ts
import { afterEach, describe, expect, it } from 'vitest'
import { applyThemeState } from './hydrate'
import { createDefaultThemeState } from './persistence'

afterEach(() => {
  document.documentElement.removeAttribute('style')
  document.documentElement.removeAttribute('data-scan-tone')
})

describe('applyThemeState', () => {
  it('applies the brand lime dark default when given null', () => {
    applyThemeState(null)
    const root = document.documentElement
    expect(root.dataset.scanTone).toBe('dark')
    expect(root.style.getPropertyValue('--fx-bg').trim()).toBe('#050607')
    expect(root.style.getPropertyValue('--fx-signal').trim()).toBe('#d8ff35')
  })

  it('applies the light palette when activeTone is light', () => {
    const theme = createDefaultThemeState()
    theme.activeTone = 'light'
    applyThemeState(theme)
    expect(document.documentElement.dataset.scanTone).toBe('light')
    expect(document.documentElement.style.getPropertyValue('--fx-bg').trim()).toBe('#f4f0df')
  })
})
