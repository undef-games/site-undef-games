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
  it('creates default theme state with the default scanline engine', () => {
    const theme = createDefaultThemeState()

    expect(theme.scanlineEngine.basePattern).toBe('straight')
    expect(theme.scanlineEngine.layers).toEqual([])
  })

  it('hydrates saved scanline engine state and falls back safely for older saves', () => {
    const storage = window.localStorage
    storage.clear()

    const saved = {
      version: 1,
      activeTone: 'dark',
      tones: createDefaultThemeState().tones,
      scanlineLayers: { graph: true, crt: false, glitch: false },
      sectionEffects: createDefaultThemeState().sectionEffects,
      scanlineEngine: {
        basePattern: 'audit',
        layers: [
          {
            id: 'layer-1',
            enabled: true,
            kind: 'sine',
            role: 'advanced',
            opacity: 1,
            speed: 1,
            amplitude: 1,
            verticalOffset: 0,
            phase: 0,
            blendMode: 'screen',
            spacingInfluence: 1,
            frequency: 1,
            thickness: 1,
            jitter: 0,
            dashLength: 0,
            gapLength: 0,
            stepSharpness: 0.5,
            scrollCoupling: 1,
            pointerCoupling: 1,
          },
        ],
      },
    }

    storage.setItem(STORAGE_KEY, JSON.stringify(saved))
    expect(readThemeState(storage)?.scanlineEngine.basePattern).toBe('audit')
    expect(readThemeState(storage)?.scanlineEngine.layers).toHaveLength(1)

    storage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        activeTone: 'dark',
        tones: createDefaultThemeState().tones,
        scanlineLayers: { graph: false, crt: true, glitch: false },
        sectionEffects: createDefaultThemeState().sectionEffects,
      }),
    )

    expect(readThemeState(storage)?.scanlineEngine.basePattern).toBe('straight')
    expect(readThemeState(storage)?.scanlineEngine.layers).toEqual([])
  })

  it('round-trips the saved theme state through localStorage', () => {
    const storage = window.localStorage
    storage.clear()
    const theme: ThemeState = {
      ...createDefaultThemeState(),
      activeTone: 'light',
      scanlineLayers: { graph: true, crt: false, glitch: true },
      scanlineEngine: {
        basePattern: 'audit',
        layers: [],
      },
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
