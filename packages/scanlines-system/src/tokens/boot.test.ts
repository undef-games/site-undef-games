import { afterEach, describe, expect, it } from 'vitest'
import { applyStoredTheme } from './boot'
import { STORAGE_KEY } from './persistence'

afterEach(() => {
  localStorage.clear()
  document.documentElement.removeAttribute('style')
  document.documentElement.removeAttribute('data-scan-tone')
  delete (window as unknown as Record<string, unknown>).__undefScanTheme
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

  it('sets window.__undefScanTheme.tone to light when light tone is stored', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ activeTone: 'light', version: 1 }))
    applyStoredTheme()
    expect((window as unknown as Record<string, unknown>).__undefScanTheme).toBeDefined()
    expect((window as unknown as { __undefScanTheme: { tone: string } }).__undefScanTheme.tone).toBe('light')
  })

  it('sets window.__undefScanTheme.tone to dark when nothing is stored', () => {
    applyStoredTheme()
    expect((window as unknown as Record<string, unknown>).__undefScanTheme).toBeDefined()
    expect((window as unknown as { __undefScanTheme: { tone: string } }).__undefScanTheme.tone).toBe('dark')
  })
})
