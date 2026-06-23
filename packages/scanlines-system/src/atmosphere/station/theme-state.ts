import {
  DEFAULT_PALETTE,
  readRawThemeStateObject,
  THEME_STATE_VERSION,
  writeThemeState,
  type ThemeState,
  type Tone,
} from '../../tokens/persistence'
import {
  EFFECTS_PRESETS,
  type EffectsPresetId,
  type EffectsSettings,
} from './effects-config'
import {
  createDefaultScanlineEngine,
  updateScanlineLayer,
  type ScanlineBlendMode,
  type ScanlineEngineState,
  type ScanlineLayerPatch,
  type ScanlinePattern,
} from './scanline-engine'
import type { SectionEffects } from './station-toys'

export const DEFAULT_DARK_PRESET_ID: EffectsPresetId = 'blue-noise'
export const DEFAULT_LIGHT_PRESET_ID: EffectsPresetId = 'paper-terminal'

export type ScanlineLayerId = 'graph' | 'crt' | 'glitch'
export type ScanlineLayers = Record<ScanlineLayerId, boolean>

export type ThemePresetState = {
  presetId: EffectsPresetId | 'custom'
  settings: EffectsSettings
}

export type FullThemeState = ThemeState & {
  scanlineEngine: ScanlineEngineState
  scanlineLayers: ScanlineLayers
  sectionEffects: SectionEffects
  tones: Record<Tone, ThemePresetState>
}

export const DEFAULT_SECTION_EFFECTS: SectionEffects = {
  dice: 'dice',
  identity: 'tumble',
  projects: 'tumble',
  signal: 'bars',
  taybols: 'bars',
  warp: 'warp',
}

export const DEFAULT_SCANLINE_LAYERS: ScanlineLayers = {
  graph: false,
  crt: false,
  glitch: false,
}

const cloneSettings = (settings: EffectsSettings): EffectsSettings => ({ ...settings })

const findPreset = (presetId: EffectsPresetId, tone?: Tone) =>
  EFFECTS_PRESETS.find((preset) => preset.id === presetId && (!tone || preset.tone === tone))

const defaultPresetState = (presetId: EffectsPresetId, tone: Tone): ThemePresetState => {
  const preset = findPreset(presetId, tone) ?? EFFECTS_PRESETS.find((candidate) => candidate.tone === tone) ?? EFFECTS_PRESETS[0]
  return {
    presetId: preset.id,
    settings: { ...cloneSettings(preset.settings), ...DEFAULT_PALETTE[tone] },
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object'
}

function isTone(value: unknown): value is Tone {
  return value === 'dark' || value === 'light'
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isLayerPattern(value: unknown): value is ScanlinePattern {
  return value === 'straight' || value === 'sine' || value === 'audit' || value === 'broken' || value === 'pulse'
}

function isBasePattern(value: unknown): value is ScanlineEngineState['basePattern'] {
  return value === 'straight' || value === 'sine' || value === 'audit' || value === 'broken'
}

function isBlendMode(value: unknown): value is ScanlineBlendMode {
  return value === 'add' || value === 'screen' || value === 'soft-light' || value === 'difference'
}

function resolveScanlineLayerPatch(value: Record<string, unknown>): ScanlineLayerPatch {
  const patch: ScanlineLayerPatch = {}

  if (typeof value.enabled === 'boolean') patch.enabled = value.enabled
  if (isLayerPattern(value.kind)) patch.kind = value.kind
  if (isNumber(value.opacity)) patch.opacity = value.opacity
  if (isNumber(value.speed)) patch.speed = value.speed
  if (isNumber(value.amplitude)) patch.amplitude = value.amplitude
  if (isNumber(value.verticalOffset)) patch.verticalOffset = value.verticalOffset
  if (isNumber(value.phase)) patch.phase = value.phase
  if (isBlendMode(value.blendMode)) patch.blendMode = value.blendMode
  if (isNumber(value.spacingInfluence)) patch.spacingInfluence = value.spacingInfluence
  if (isNumber(value.frequency)) patch.frequency = value.frequency
  if (isNumber(value.thickness)) patch.thickness = value.thickness
  if (isNumber(value.jitter)) patch.jitter = value.jitter
  if (isNumber(value.dashLength)) patch.dashLength = value.dashLength
  if (isNumber(value.gapLength)) patch.gapLength = value.gapLength
  if (isNumber(value.stepSharpness)) patch.stepSharpness = value.stepSharpness
  if (isNumber(value.scrollCoupling)) patch.scrollCoupling = value.scrollCoupling
  if (isNumber(value.pointerCoupling)) patch.pointerCoupling = value.pointerCoupling
  if (isNumber(value.intensity)) patch.intensity = value.intensity

  return patch
}

function resolveScanlineEngine(value: unknown, defaults: ScanlineEngineState): ScanlineEngineState {
  if (!isRecord(value)) return createDefaultScanlineEngine()

  const resolvedBasePattern = isBasePattern(value.basePattern) ? value.basePattern : defaults.basePattern

  const layers = Array.isArray(value.layers) ? value.layers : []
  let engine: ScanlineEngineState = {
    basePattern: resolvedBasePattern,
    layers: [],
  }

  for (const layer of layers) {
    if (!isRecord(layer) || typeof layer.id !== 'string') continue
    const patch = resolveScanlineLayerPatch(layer)
    engine = {
      ...engine,
      layers: [...engine.layers, { id: layer.id }] as ScanlineEngineState['layers'],
    }
    engine = updateScanlineLayer(engine, layer.id, patch)
  }

  return engine
}

export function createDefaultFullThemeState(): FullThemeState {
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

export function getActiveThemeSettings(theme: FullThemeState): EffectsSettings {
  return theme.tones[theme.activeTone].settings
}

export function getActiveThemePresetId(theme: FullThemeState): EffectsPresetId | 'custom' {
  return theme.tones[theme.activeTone].presetId
}

function mergeFullThemeState(value: Record<string, unknown>): FullThemeState | null {
  if (value.version !== THEME_STATE_VERSION) return null

  const defaults = createDefaultFullThemeState()
  const activeTone = isTone(value.activeTone) ? value.activeTone : defaults.activeTone
  const scanlineEngine = resolveScanlineEngine(value.scanlineEngine, defaults.scanlineEngine)
  const tones = isRecord(value.tones) ? value.tones : {}
  const scanlineLayers = isRecord(value.scanlineLayers) ? value.scanlineLayers : {}
  const sectionEffects = isRecord(value.sectionEffects) ? value.sectionEffects : {}

  const resolveTone = (tone: Tone): ThemePresetState => {
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

export function readFullThemeState(storage?: Storage): FullThemeState | null {
  const raw = storage ? readRawThemeStateObject(storage) : readRawThemeStateObject()
  if (!raw) return null
  return mergeFullThemeState(raw)
}

export function writeFullThemeState(theme: FullThemeState, storage?: Storage) {
  if (storage) writeThemeState(theme, storage)
  else writeThemeState(theme)
}
