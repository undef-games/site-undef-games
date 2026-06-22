import { afterEach, describe, expect, it } from 'vitest'
import { applyStoredTheme } from './boot'
import { STORAGE_KEY } from './persistence'

afterEach(() => {
  localStorage.clear()
  document.documentElement.removeAttribute('style')
  document.documentElement.removeAttribute('data-scan-tone')
})

describe('applyStoredTheme', () => {
  it('applies the dark default when nothing is stored', () => {
    applyStoredTheme()
    expect(document.documentElement.dataset.scanTone).toBe('dark')
  })

  it('applies a light tone read from localStorage', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ activeTone: 'light', version: 1 }))
    applyStoredTheme()
    expect(document.documentElement.dataset.scanTone).toBe('light')
  })

  it('does not throw on corrupt storage', () => {
    localStorage.setItem(STORAGE_KEY, '{not json')
    expect(() => { applyStoredTheme() }).not.toThrow()
  })
})
