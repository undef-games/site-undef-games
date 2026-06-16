import {
  EFFECTS_PRESETS,
  type EffectsPresetId,
  type EffectsSettings,
  type EffectsTone,
} from '../station/effects-config'
import {
  createDefaultScanlineEngine,
  updateScanlineLayer,
  type ScanlineEngineState,
} from '../station/scanline-engine'
import type { SectionEffects } from '../station/station-toys'

export const STORAGE_KEY = 'undef-logos-theme'
export const THEME_STATE_VERSION = 1
export const DEFAULT_DARK_PRESET_ID: EffectsPresetId = 'current'
export const DEFAULT_LIGHT_PRESET_ID: EffectsPresetId = 'paper-terminal'

export type ScanlineLayerId = 'graph' | 'crt' | 'glitch'
export type ScanlineLayers = Record<ScanlineLayerId, boolean>

export type ThemePresetState = {
  presetId: EffectsPresetId | 'custom'
  settings: EffectsSettings
}

export type ThemeState = {
  activeTone: EffectsTone
  scanlineEngine: ScanlineEngineState
  scanlineLayers: ScanlineLayers
  sectionEffects: SectionEffects
  tones: Record<EffectsTone, ThemePresetState>
  version: typeof THEME_STATE_VERSION
}

export const DEFAULT_SECTION_EFFECTS: SectionEffects = {
  dice: 'bars',
  identity: 'tumble',
  projects: 'tumble',
  signal: 'bars',
  taybols: 'bars',
  warp: 'tumble',
}

export const DEFAULT_SCANLINE_LAYERS: ScanlineLayers = {
  graph: false,
  crt: false,
  glitch: false,
}

const cloneSettings = (settings: EffectsSettings): EffectsSettings => ({ ...settings })

const findPreset = (presetId: EffectsPresetId, tone?: EffectsTone) =>
  EFFECTS_PRESETS.find((preset) => preset.id === presetId && (!tone || preset.tone === tone))

const defaultPresetState = (presetId: EffectsPresetId, tone: EffectsTone): ThemePresetState => {
  const preset = findPreset(presetId, tone) ?? EFFECTS_PRESETS.find((candidate) => candidate.tone === tone) ?? EFFECTS_PRESETS[0]
  return {
    presetId: preset.id,
    settings: cloneSettings(preset.settings),
  }
}

export function createDefaultThemeState(): ThemeState {
  return {
    activeTone: 'dark',
    scanlineEngine: createDefaultScanlineEngine(),
    scanlineLayers: { ...DEFAULT_SCANLINE_LAYERS },
    sectionEffects: { ...DEFAULT_SECTION_EFFECTS },
    tones: {
      dark: defaultPresetState(DEFAULT_DARK_PRESET_ID, 'dark'),
      light: defaultPresetState(DEFAULT_LIGHT_PRESET_ID, 'light'),
    },
    version: THEME_STATE_VERSION,
  }
}

export function getActiveThemeSettings(theme: ThemeState): EffectsSettings {
  return theme.tones[theme.activeTone].settings
}

export function getActiveThemePresetId(theme: ThemeState): EffectsPresetId | 'custom' {
  return theme.tones[theme.activeTone].presetId
}

function getStorage(): Storage | undefined {
  if (typeof window === 'undefined') return undefined
  try {
    return window.localStorage
  } catch {
    return undefined
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object'
}

function isTone(value: unknown): value is EffectsTone {
  return value === 'dark' || value === 'light'
}

function resolveScanlineEngine(value: unknown, defaults: ScanlineEngineState): ScanlineEngineState {
  if (!isRecord(value)) return createDefaultScanlineEngine()

  const basePattern = value.basePattern
  const resolvedBasePattern =
    basePattern === 'straight' || basePattern === 'sine' || basePattern === 'audit' || basePattern === 'broken'
      ? basePattern
      : defaults.basePattern

  const layers = Array.isArray(value.layers) ? value.layers : []
  let engine: ScanlineEngineState = {
    basePattern: resolvedBasePattern,
    layers: [],
  }

  for (const layer of layers) {
    if (!isRecord(layer) || typeof layer.id !== 'string') continue
    const { id, role: _role, ...patch } = layer
    engine = {
      ...engine,
      layers: [...engine.layers, { ...layer, id: layer.id }] as ScanlineEngineState['layers'],
    }
    engine = updateScanlineLayer(engine, id, patch)
  }

  return engine
}

function mergeThemeState(value: Record<string, unknown>): ThemeState | null {
  if (value.version !== THEME_STATE_VERSION) return null

  const defaults = createDefaultThemeState()
  const activeTone = isTone(value.activeTone) ? value.activeTone : defaults.activeTone
  const scanlineEngine = resolveScanlineEngine(value.scanlineEngine, defaults.scanlineEngine)
  const tones = isRecord(value.tones) ? value.tones : {}
  const scanlineLayers = isRecord(value.scanlineLayers) ? value.scanlineLayers : {}
  const sectionEffects = isRecord(value.sectionEffects) ? value.sectionEffects : {}

  const resolveTone = (tone: EffectsTone): ThemePresetState => {
    const saved = isRecord(tones[tone]) ? tones[tone] : {}
    const settings = isRecord(saved.settings) ? ({ ...defaults.tones[tone].settings, ...saved.settings } as EffectsSettings) : defaults.tones[tone].settings
    const presetId = typeof saved.presetId === 'string' ? saved.presetId : defaults.tones[tone].presetId
    return {
      presetId,
      settings: cloneSettings(settings),
    }
  }

  return {
    activeTone,
    scanlineEngine,
    scanlineLayers: {
      graph: typeof scanlineLayers.graph === 'boolean' ? scanlineLayers.graph : defaults.scanlineLayers.graph,
      crt: typeof scanlineLayers.crt === 'boolean' ? scanlineLayers.crt : defaults.scanlineLayers.crt,
      glitch: typeof scanlineLayers.glitch === 'boolean' ? scanlineLayers.glitch : defaults.scanlineLayers.glitch,
    },
    sectionEffects: {
      ...defaults.sectionEffects,
      ...sectionEffects,
    } as SectionEffects,
    tones: {
      dark: resolveTone('dark'),
      light: resolveTone('light'),
    },
    version: THEME_STATE_VERSION,
  }
}

export function readThemeState(storage = getStorage()): ThemeState | null {
  if (!storage) return null
  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (!isRecord(parsed)) return null
    return mergeThemeState(parsed)
  } catch {
    return null
  }
}

export function writeThemeState(theme: ThemeState, storage = getStorage()) {
  if (!storage) return
  storage.setItem(STORAGE_KEY, JSON.stringify(theme))
}

export function clearThemeState(storage = getStorage()) {
  storage?.removeItem(STORAGE_KEY)
}
