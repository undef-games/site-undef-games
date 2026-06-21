import {
  EFFECTS_PRESETS,
  type EffectsPresetId,
  type EffectsSettings,
  type EffectsTone,
} from '../station/effects-config'
import {
  createDefaultScanlineEngine,
  updateScanlineLayer,
  type ScanlineBlendMode,
  type ScanlineEngineState,
  type ScanlineLayerPatch,
  type ScanlinePattern,
} from '../station/scanline-engine'
import type { SectionEffects } from '../station/station-toys'

export const STORAGE_KEY = 'undef-logos-theme'
export const THEME_STATE_VERSION = 1
export const DEFAULT_DARK_PRESET_ID: EffectsPresetId = 'blue-noise'
export const DEFAULT_LIGHT_PRESET_ID: EffectsPresetId = 'paper-terminal'
export const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365

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

function getCookieDomain(hostname: string): string | null {
  return hostname === 'undef.games' || hostname.endsWith('.undef.games') ? '.undef.games' : null
}

function readThemeCookie(): string | null {
  if (typeof document === 'undefined') return null
  const prefix = `${STORAGE_KEY}=`
  const cookies = document.cookie.split(';')
  for (const entry of cookies) {
    const trimmed = entry.trim()
    if (!trimmed.startsWith(prefix)) continue
    const value = trimmed.slice(prefix.length)
    try {
      return decodeURIComponent(value)
    } catch {
      return null
    }
  }
  return null
}

function writeThemeCookie(value: string) {
  if (typeof document === 'undefined' || typeof window === 'undefined') return
  const domain = getCookieDomain(window.location.hostname)
  const domainAttr = domain ? `; Domain=${domain}` : ''
  const secureAttr = window.location.protocol === 'https:' ? '; Secure' : ''
  document.cookie =
    `${STORAGE_KEY}=${encodeURIComponent(value)}; Path=/; Max-Age=${THEME_COOKIE_MAX_AGE}; SameSite=Lax${domainAttr}${secureAttr}`
}

function clearThemeCookie() {
  if (typeof document === 'undefined' || typeof window === 'undefined') return
  const domain = getCookieDomain(window.location.hostname)
  const domainAttr = domain ? `; Domain=${domain}` : ''
  const secureAttr = window.location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${STORAGE_KEY}=; Path=/; Max-Age=0; SameSite=Lax${domainAttr}${secureAttr}`
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object'
}

function isTone(value: unknown): value is EffectsTone {
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
  try {
    const raw = storage?.getItem(STORAGE_KEY) ?? readThemeCookie()
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (!isRecord(parsed)) return null
    return mergeThemeState(parsed)
  } catch {
    return null
  }
}

export function writeThemeState(theme: ThemeState, storage = getStorage()) {
  const serialized = JSON.stringify(theme)
  storage?.setItem(STORAGE_KEY, serialized)
  writeThemeCookie(serialized)
}

export function clearThemeState(storage = getStorage()) {
  storage?.removeItem(STORAGE_KEY)
  clearThemeCookie()
}
