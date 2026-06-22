import { beforeEach, describe, expect, it } from 'vitest'
import {
  clearThemeState,
  createDefaultThemeState,
  DEFAULT_PALETTE,
  getActivePaletteSettings,
  readThemeState,
  STORAGE_KEY,
  writeThemeState,
} from './persistence'

describe('theme core persistence (station-free)', () => {
  beforeEach(() => {
    window.localStorage.clear()
    document.cookie = `${STORAGE_KEY}=; Path=/; Max-Age=0`
  })

  it('creates a station-free default state with palette-only tones', () => {
    const theme = createDefaultThemeState()

    expect(theme.activeTone).toBe('dark')
    expect(theme.version).toBe(1)
    expect(theme.tones.dark.settings).toEqual(DEFAULT_PALETTE.dark)
    expect(theme.tones.light.settings).toEqual(DEFAULT_PALETTE.light)
    // No rich authoring fields on the core type.
    expect((theme as Record<string, unknown>).scanlineEngine).toBeUndefined()
    expect((theme as Record<string, unknown>).sectionEffects).toBeUndefined()
  })

  it('reads a palette-only view, overlaying stored palette onto defaults', () => {
    const storage = window.localStorage
    storage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        activeTone: 'light',
        tones: {
          dark: { settings: { paletteSignal: '#69a7ff' } },
          light: { settings: { paletteBg: '#ffffff' } },
        },
      }),
    )

    const theme = readThemeState(storage)
    expect(theme?.activeTone).toBe('light')
    // overlaid field
    expect(theme?.tones.dark.settings.paletteSignal).toBe('#69a7ff')
    // untouched fields fall back to defaults
    expect(theme?.tones.dark.settings.paletteBg).toBe(DEFAULT_PALETTE.dark.paletteBg)
    expect(theme?.tones.light.settings.paletteBg).toBe('#ffffff')
    // exactly the 11 palette keys, no effect fields leaked through
    expect(Object.keys(theme?.tones.dark.settings ?? {}).sort()).toEqual(
      Object.keys(DEFAULT_PALETTE.dark).sort(),
    )
  })

  it('returns null when nothing is stored, malformed, or wrong-version', () => {
    const storage = window.localStorage
    expect(readThemeState(storage)).toBeNull()

    storage.setItem(STORAGE_KEY, '{')
    expect(readThemeState(storage)).toBeNull()

    storage.setItem(STORAGE_KEY, JSON.stringify({ version: 999 }))
    expect(readThemeState(storage)).toBeNull()
  })

  it('getActivePaletteSettings returns the active tone palette', () => {
    const theme = createDefaultThemeState()
    expect(getActivePaletteSettings(theme)).toEqual(DEFAULT_PALETTE.dark)
    theme.activeTone = 'light'
    expect(getActivePaletteSettings(theme)).toEqual(DEFAULT_PALETTE.light)
  })

  it('PRESERVE-ON-WRITE: a palette-only write keeps rich authoring fields intact', () => {
    const storage = window.localStorage

    // Seed a raw blob carrying rich fields the core does not know about, and a
    // tone whose settings mixes a palette field with an effect field.
    storage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        activeTone: 'dark',
        scanlineEngine: { basePattern: 'audit', layers: [{ id: 'layer-1', kind: 'sine' }] },
        sectionEffects: { dice: 'dice', warp: 'warp', identity: 'tumble' },
        scanlineLayers: { graph: true, crt: false, glitch: false },
        tones: {
          dark: { presetId: 'blue-noise', settings: { paletteSignal: '#abcdef', scanOpacity: 0.42 } },
          light: { presetId: 'custom', settings: { paletteBg: '#ffffff' } },
        },
      }),
    )

    const core = readThemeState(storage)!
    expect(core.activeTone).toBe('dark')

    writeThemeState({ ...core, activeTone: 'light' }, storage)

    const reread = JSON.parse(storage.getItem(STORAGE_KEY) ?? '{}')
    // managed core field wins
    expect(reread.activeTone).toBe('light')
    expect(reread.version).toBe(1)
    // unmanaged top-level rich fields preserved
    expect(reread.scanlineEngine).toEqual({ basePattern: 'audit', layers: [{ id: 'layer-1', kind: 'sine' }] })
    expect(reread.sectionEffects).toEqual({ dice: 'dice', warp: 'warp', identity: 'tumble' })
    expect(reread.scanlineLayers).toEqual({ graph: true, crt: false, glitch: false })
    // effect field living alongside palette in settings is preserved
    expect(reread.tones.dark.settings.scanOpacity).toBe(0.42)
    // preset id (unmanaged by core) preserved
    expect(reread.tones.dark.presetId).toBe('blue-noise')
    // the core write also overlaid the palette field it read
    expect(reread.tones.dark.settings.paletteSignal).toBe('#abcdef')
  })

  it('writes to both localStorage and the shared cookie, and clears both', () => {
    const storage = window.localStorage
    writeThemeState(createDefaultThemeState(), storage)

    expect(storage.getItem(STORAGE_KEY)).not.toBeNull()
    expect(document.cookie).toContain(`${STORAGE_KEY}=`)

    clearThemeState(storage)

    expect(storage.getItem(STORAGE_KEY)).toBeNull()
    expect(document.cookie).not.toContain(`${STORAGE_KEY}=`)
    expect(readThemeState(storage)).toBeNull()
  })

  it('falls back to the shared cookie when localStorage is empty', () => {
    const storage = window.localStorage
    const theme = createDefaultThemeState()
    theme.tones.dark.settings.paletteSignal = '#69a7ff'

    document.cookie = `${STORAGE_KEY}=${encodeURIComponent(JSON.stringify(theme))}; Path=/`

    expect(readThemeState(storage)?.tones.dark.settings.paletteSignal).toBe('#69a7ff')
  })
})
