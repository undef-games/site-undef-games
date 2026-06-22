import { beforeEach, describe, expect, it } from 'vitest'
import { BASELINE_EFFECTS } from './effects-config'
import {
  createDefaultFullThemeState,
  getActiveThemeSettings,
  readFullThemeState,
  writeFullThemeState,
  type FullThemeState,
} from './theme-state'
import { clearThemeState, STORAGE_KEY } from '../theme/persistence'

describe('station full theme state', () => {
  beforeEach(() => {
    window.localStorage.clear()
    document.cookie = `${STORAGE_KEY}=; Path=/; Max-Age=0`
  })

  const createSavedTheme = (overrides: Record<string, unknown> = {}) => ({
    version: 1,
    activeTone: 'dark',
    tones: createDefaultFullThemeState().tones,
    scanlineLayers: { graph: false, crt: false, glitch: false },
    sectionEffects: createDefaultFullThemeState().sectionEffects,
    ...overrides,
  })

  it('creates default full theme state with the default scanline engine', () => {
    const theme = createDefaultFullThemeState()

    expect(theme.scanlineEngine.basePattern).toBe('straight')
    expect(theme.scanlineEngine.layers).toEqual([])
  })

  it('full round-trip: write defaults then read back with effect fields intact', () => {
    const storage = window.localStorage
    writeFullThemeState(createDefaultFullThemeState(), storage)

    const reread = readFullThemeState(storage)
    expect(reread).not.toBeNull()
    expect(reread?.scanlineEngine).toBeDefined()
    expect(reread?.scanlineEngine.basePattern).toBe('straight')

    const active = getActiveThemeSettings(reread!)
    // effect field carried by the full EffectsSettings is defined
    expect(active.scanOpacity).toBeDefined()
    // palette field sourced from the single core DEFAULT_PALETTE
    expect(active.paletteBg).toBe('#050607')
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
    expect(readFullThemeState(storage)?.scanlineEngine.basePattern).toBe('audit')
    expect(readFullThemeState(storage)?.scanlineEngine.layers).toHaveLength(1)

    storage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...createSavedTheme(),
        scanlineLayers: { graph: false, crt: true, glitch: false },
      }),
    )

    expect(readFullThemeState(storage)?.scanlineEngine.basePattern).toBe('straight')
    expect(readFullThemeState(storage)?.scanlineEngine.layers).toEqual([])
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

    const theme = readFullThemeState(storage)
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

    const layers = readFullThemeState(storage)?.scanlineEngine.layers ?? []

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

    const hydratedLayers = readFullThemeState(storage)?.scanlineEngine.layers ?? []

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

  it('round-trips the saved full theme state through localStorage', () => {
    const storage = window.localStorage
    storage.clear()
    const theme: FullThemeState = {
      ...createDefaultFullThemeState(),
      activeTone: 'light',
      scanlineLayers: { graph: true, crt: false, glitch: true },
      scanlineEngine: {
        basePattern: 'audit',
        layers: [],
      },
      tones: {
        dark: {
          presetId: 'blue-noise',
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

    writeFullThemeState(theme, storage)

    expect(JSON.parse(storage.getItem(STORAGE_KEY) ?? '{}')).toMatchObject({ version: 1 })
    expect(readFullThemeState(storage)).toMatchObject(theme)
    expect(getActiveThemeSettings(theme)).toMatchObject(theme.tones.light.settings)
  })

  it('falls back to the shared theme cookie when localStorage is empty', () => {
    const storage = window.localStorage
    storage.clear()
    const theme = createDefaultFullThemeState()
    theme.tones.dark.settings.paletteSignal = '#69a7ff'

    document.cookie = `${STORAGE_KEY}=${encodeURIComponent(JSON.stringify(theme))}; Path=/`

    expect(readFullThemeState(storage)).toMatchObject(theme)
  })

  it('writes and clears the shared theme cookie alongside localStorage', () => {
    const storage = window.localStorage
    storage.clear()
    const theme = createDefaultFullThemeState()

    writeFullThemeState(theme, storage)

    expect(document.cookie).toContain(`${STORAGE_KEY}=`)

    clearThemeState(storage)

    expect(document.cookie).not.toContain(`${STORAGE_KEY}=`)
  })

  it('returns null for missing malformed or wrong-version theme state', () => {
    const storage = window.localStorage
    storage.clear()

    expect(readFullThemeState(storage)).toBeNull()

    storage.setItem(STORAGE_KEY, '{')
    expect(readFullThemeState(storage)).toBeNull()

    storage.setItem(STORAGE_KEY, JSON.stringify({ version: 999 }))
    expect(readFullThemeState(storage)).toBeNull()
  })

  it('clears the saved theme state', () => {
    const storage = window.localStorage
    storage.clear()
    writeFullThemeState(createDefaultFullThemeState(), storage)

    clearThemeState(storage)

    expect(storage.getItem(STORAGE_KEY)).toBeNull()
    expect(readFullThemeState(storage)).toBeNull()
  })
})
