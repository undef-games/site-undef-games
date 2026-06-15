import { describe, expect, it } from 'vitest'
import { BASELINE_EFFECTS } from '../station/effects-config'
import {
  clearThemeState,
  createDefaultThemeState,
  getActiveThemeSettings,
  readThemeState,
  STORAGE_KEY,
  writeThemeState,
  type ThemeState,
} from './persistence'

describe('theme persistence', () => {
  it('round-trips the saved theme state through localStorage', () => {
    const storage = window.localStorage
    storage.clear()
    const theme: ThemeState = {
      ...createDefaultThemeState(),
      activeTone: 'light',
      scanlineLayers: { graph: true, crt: false, glitch: true },
      tones: {
        dark: {
          presetId: 'current',
          settings: BASELINE_EFFECTS,
        },
        light: {
          presetId: 'custom',
          settings: {
            ...BASELINE_EFFECTS,
            paletteBg: '#ffffff',
            paletteSignal: '#123456',
            scanOpacity: 0.42,
          },
        },
      },
    }

    writeThemeState(theme, storage)

    expect(JSON.parse(storage.getItem(STORAGE_KEY) ?? '{}')).toMatchObject({ version: 1 })
    expect(readThemeState(storage)).toMatchObject(theme)
    expect(getActiveThemeSettings(theme)).toMatchObject(theme.tones.light.settings)
  })

  it('returns null for missing malformed or wrong-version theme state', () => {
    const storage = window.localStorage
    storage.clear()

    expect(readThemeState(storage)).toBeNull()

    storage.setItem(STORAGE_KEY, '{')
    expect(readThemeState(storage)).toBeNull()

    storage.setItem(STORAGE_KEY, JSON.stringify({ version: 999 }))
    expect(readThemeState(storage)).toBeNull()
  })

  it('clears the saved theme state', () => {
    const storage = window.localStorage
    storage.clear()
    writeThemeState(createDefaultThemeState(), storage)

    clearThemeState(storage)

    expect(storage.getItem(STORAGE_KEY)).toBeNull()
    expect(readThemeState(storage)).toBeNull()
  })
})
