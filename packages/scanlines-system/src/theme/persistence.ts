export const STORAGE_KEY = 'undef-logos-theme'
export const THEME_STATE_VERSION = 1
export const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365

export type Tone = 'dark' | 'light'

export type PaletteSettings = {
  paletteBg: string
  palettePanel: string
  paletteText: string
  paletteTextOnDark: string
  paletteTextOnLight: string
  paletteSignal: string
  paletteMuted: string
  paletteGlow: string
  paletteSupport1: string
  paletteSupport2: string
  paletteSupport3: string
}

export type ThemeState = {
  activeTone: Tone
  tones: Record<Tone, { settings: PaletteSettings }>
  version: typeof THEME_STATE_VERSION
}

export const DEFAULT_PALETTE: Record<Tone, PaletteSettings> = {
  dark: {
    paletteBg: '#050607',
    palettePanel: '#08090a',
    paletteText: '#f4f4f0',
    paletteTextOnDark: '#f4f4f0',
    paletteTextOnLight: '#050607',
    paletteSignal: '#d8ff35',
    paletteMuted: '#f4f4f0',
    paletteGlow: '#d8ff35',
    paletteSupport1: '#d8ff35',
    paletteSupport2: '#d8ff35',
    paletteSupport3: '#d8ff35',
  },
  light: {
    paletteBg: '#f4f0df',
    palettePanel: '#ddd7c1',
    paletteText: '#11130d',
    paletteTextOnDark: '#f4f4f0',
    paletteTextOnLight: '#11130d',
    paletteSignal: '#405500',
    paletteMuted: '#11130d',
    paletteGlow: '#b0d000',
    paletteSupport1: '#b0d000',
    paletteSupport2: '#213019',
    paletteSupport3: '#f8fbef',
  },
}

export function createDefaultThemeState(): ThemeState {
  return {
    activeTone: 'dark',
    tones: {
      dark: { settings: { ...DEFAULT_PALETTE.dark } },
      light: { settings: { ...DEFAULT_PALETTE.light } },
    },
    version: THEME_STATE_VERSION,
  }
}

export function getActivePaletteSettings(theme: ThemeState): PaletteSettings {
  return theme.tones[theme.activeTone].settings
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

function isTone(value: unknown): value is Tone {
  return value === 'dark' || value === 'light'
}

const PALETTE_KEYS: (keyof PaletteSettings)[] = [
  'paletteBg',
  'palettePanel',
  'paletteText',
  'paletteTextOnDark',
  'paletteTextOnLight',
  'paletteSignal',
  'paletteMuted',
  'paletteGlow',
  'paletteSupport1',
  'paletteSupport2',
  'paletteSupport3',
]

function resolvePaletteSettings(saved: unknown, tone: Tone): PaletteSettings {
  const settings: PaletteSettings = { ...DEFAULT_PALETTE[tone] }
  if (!isRecord(saved)) return settings
  const savedSettings = isRecord(saved.settings) ? saved.settings : undefined
  if (!savedSettings) return settings
  for (const key of PALETTE_KEYS) {
    const value = savedSettings[key]
    if (typeof value === 'string') settings[key] = value
  }
  return settings
}

/**
 * Read the cross-domain theme cookie/localStorage and project the station-free
 * CORE view: active tone plus per-tone palette colors only. Rich authoring
 * fields (scanline engine/layers, section effects, effect settings) are ignored
 * here — they belong to the station full-state layer (theme-state module).
 */
export function readThemeState(storage = getStorage()): ThemeState | null {
  try {
    const raw = storage?.getItem(STORAGE_KEY) ?? readThemeCookie()
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (!isRecord(parsed)) return null
    if (parsed.version !== THEME_STATE_VERSION) return null

    const activeTone = isTone(parsed.activeTone) ? parsed.activeTone : 'dark'
    const tones = isRecord(parsed.tones) ? parsed.tones : {}

    return {
      activeTone,
      tones: {
        dark: { settings: resolvePaletteSettings(tones.dark, 'dark') },
        light: { settings: resolvePaletteSettings(tones.light, 'light') },
      },
      version: THEME_STATE_VERSION,
    }
  } catch {
    return null
  }
}

/**
 * Read the raw stored JSON object (localStorage → cookie) without projecting it
 * to any typed view. Returns `null` when nothing is stored or the payload is
 * unparseable. The station layer reuses this so cookie/storage access lives in
 * exactly one module.
 */
export function readRawThemeStateObject(storage = getStorage()): Record<string, unknown> | null {
  try {
    const raw = storage?.getItem(STORAGE_KEY) ?? readThemeCookie()
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    return isRecord(parsed) ? parsed : null
  } catch {
    return null
  }
}

/**
 * Deep-merge-preserving write (the cross-domain linchpin). Reads the existing
 * RAW stored object and overlays the given core/full theme so that:
 *  - top-level managed keys (`activeTone`, `version`) win, while any unmanaged
 *    keys already stored (e.g. `scanlineEngine`, `scanlineLayers`,
 *    `sectionEffects`) are preserved;
 *  - per-tone `settings` are merged, so effect fields that live alongside
 *    palette fields (e.g. `scanOpacity`) survive a palette-only write.
 *
 * This lets a backoffice/core writer flip the tone without clobbering the lab's
 * rich authoring state, and lets the station layer write the full object.
 */
export function writeThemeState(theme: ThemeState, storage = getStorage()) {
  const raw = readRawThemeStateObject(storage) ?? {}
  const rawTones = isRecord(raw.tones) ? raw.tones : {}

  const mergedTones: Record<string, unknown> = { ...rawTones }
  for (const tone of Object.keys(theme.tones) as Tone[]) {
    const rawTone = isRecord(rawTones[tone]) ? rawTones[tone] : {}
    const rawSettings = isRecord(rawTone.settings) ? rawTone.settings : {}
    const nextTone = theme.tones[tone]
    mergedTones[tone] = {
      ...rawTone,
      ...nextTone,
      settings: { ...rawSettings, ...nextTone.settings },
    }
  }

  const merged = {
    ...raw,
    ...theme,
    tones: mergedTones,
  }

  const serialized = JSON.stringify(merged)
  storage?.setItem(STORAGE_KEY, serialized)
  writeThemeCookie(serialized)
}

export function clearThemeState(storage = getStorage()) {
  storage?.removeItem(STORAGE_KEY)
  clearThemeCookie()
}
