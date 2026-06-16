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
} from '@undef/scanlines-system'

describe('theme persistence', () => {
  const createSavedTheme = (overrides: Record<string, unknown> = {}) => ({
    version: 1,
    activeTone: 'dark',
    tones: createDefaultThemeState().tones,
    scanlineLayers: { graph: false, crt: false, glitch: false },
    sectionEffects: createDefaultThemeState().sectionEffects,
    ...overrides,
  })

  it('creates default theme state with the default scanline engine', () => {
    const theme = createDefaultThemeState()

    expect(theme.scanlineEngine.basePattern).toBe('straight')
    expect(theme.scanlineEngine.layers).toEqual([])
  })

  it('hydrates saved scanline engine state and falls back safely for older saves', () => {
    const storage = window.localStorage
    storage.clear()

    const saved = createSavedTheme({
      scanlineLayers: { graph: true, crt: false, glitch: false },
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
    })

    storage.setItem(STORAGE_KEY, JSON.stringify(saved))
    expect(readThemeState(storage)?.scanlineEngine.basePattern).toBe('audit')
    expect(readThemeState(storage)?.scanlineEngine.layers).toHaveLength(1)

    storage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...createSavedTheme(),
        scanlineLayers: { graph: false, crt: true, glitch: false },
      }),
    )

    expect(readThemeState(storage)?.scanlineEngine.basePattern).toBe('straight')
    expect(readThemeState(storage)?.scanlineEngine.layers).toEqual([])
  })

  it('falls back when persisted scanline engine fields are malformed', () => {
    const storage = window.localStorage
    storage.clear()

    storage.setItem(
      STORAGE_KEY,
      JSON.stringify(
        createSavedTheme({
          scanlineEngine: {
            basePattern: 'zigzag',
            layers: [
              {
                id: 'layer-1',
                enabled: 'yes',
                kind: 'zigzag',
                role: 'advanced',
                opacity: '0.8',
                speed: 'fast',
                amplitude: null,
                verticalOffset: 'top',
                phase: {},
                blendMode: 'multiply',
                spacingInfluence: 'dense',
                frequency: 'high',
                thickness: 'thick',
                jitter: 'noisy',
                dashLength: 'long',
                gapLength: 'wide',
                stepSharpness: 'sharp',
                scrollCoupling: 'linked',
                pointerCoupling: 'linked',
              },
            ],
          },
        }),
      ),
    )

    const theme = readThemeState(storage)
    expect(theme?.scanlineEngine.basePattern).toBe('straight')
    expect(theme?.scanlineEngine.layers).toEqual([
      {
        id: 'layer-1',
        enabled: true,
        kind: 'straight',
        role: 'advanced',
        opacity: 0.6,
        speed: 0,
        amplitude: 0.4,
        verticalOffset: 0,
        phase: 0,
        blendMode: 'screen',
        spacingInfluence: 0.5,
        frequency: 1,
        thickness: 1,
        jitter: 0,
        dashLength: 0,
        gapLength: 0,
        stepSharpness: 0.5,
        scrollCoupling: 0,
        pointerCoupling: 0,
      },
    ])
  })

  it('fills missing fields for partial advanced and support layers', () => {
    const storage = window.localStorage
    storage.clear()

    storage.setItem(
      STORAGE_KEY,
      JSON.stringify(
        createSavedTheme({
          scanlineEngine: {
            basePattern: 'broken',
            layers: [
              { id: 'advanced-partial', kind: 'audit' },
              { id: 'support-partial', kind: 'broken', enabled: false },
              { id: 'support-full', kind: 'sine', intensity: 0.9 },
              { id: 'support-from-index-3', kind: 'straight' },
            ],
          },
        }),
      ),
    )

    const layers = readThemeState(storage)?.scanlineEngine.layers ?? []

    expect(layers).toHaveLength(4)
    expect(layers[0]).toMatchObject({
      id: 'advanced-partial',
      role: 'advanced',
      kind: 'audit',
      enabled: true,
      blendMode: 'screen',
      spacingInfluence: 0.5,
    })
    expect(layers[1]).toMatchObject({
      id: 'support-partial',
      role: 'advanced',
      kind: 'broken',
      enabled: false,
      blendMode: 'screen',
    })
    expect(layers[2]).toMatchObject({
      id: 'support-full',
      role: 'advanced',
      kind: 'sine',
      spacingInfluence: 0.5,
    })
    expect(layers[3]).toMatchObject({
      id: 'support-from-index-3',
      role: 'support',
      kind: 'straight',
      enabled: true,
      intensity: 0.5,
    })
  })

  it('truncates over-cap saved layers and drops invalid ids', () => {
    const storage = window.localStorage
    storage.clear()

    const layers = Array.from({ length: 20 }, (_, index) => ({
      id: `layer-${index}`,
      kind: index % 2 === 0 ? 'straight' : 'sine',
    }))

    storage.setItem(
      STORAGE_KEY,
      JSON.stringify(
        createSavedTheme({
          scanlineEngine: {
            basePattern: 'audit',
            layers: [{ id: 123, kind: 'broken' }, ...layers, { kind: 'audit' }],
          },
        }),
      ),
    )

    const hydratedLayers = readThemeState(storage)?.scanlineEngine.layers ?? []

    expect(hydratedLayers).toHaveLength(13)
    expect(hydratedLayers.map((layer) => layer.id)).toEqual([
      'layer-0',
      'layer-1',
      'layer-2',
      'layer-3',
      'layer-4',
      'layer-5',
      'layer-6',
      'layer-7',
      'layer-8',
      'layer-9',
      'layer-10',
      'layer-11',
      'layer-12',
    ])
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
