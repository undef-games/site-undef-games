import { createDefaultThemeState, readThemeState, writeThemeState } from './persistence'

type Tone = 'dark' | 'light'

type PaletteSettings = {
  paletteBg?: string
  paletteGlow?: string
  paletteMuted?: string
  palettePanel?: string
  paletteSignal?: string
  paletteSupport1?: string
  paletteSupport2?: string
  paletteSupport3?: string
  paletteText?: string
  paletteTextOnDark?: string
  paletteTextOnLight?: string
}

const DEFAULT_PALETTES: Record<Tone, PaletteSettings> = {
  dark: {
    paletteBg: '#050607',
    paletteGlow: '#d8ff35',
    paletteMuted: '#f4f4f0',
    palettePanel: '#08090a',
    paletteSignal: '#d8ff35',
    paletteSupport1: '#d8ff35',
    paletteSupport2: '#d8ff35',
    paletteSupport3: '#d8ff35',
    paletteText: '#f4f4f0',
    paletteTextOnDark: '#f4f4f0',
    paletteTextOnLight: '#050607',
  },
  light: {
    paletteBg: '#f4f0df',
    paletteGlow: '#b0d000',
    paletteMuted: '#11130d',
    palettePanel: '#ddd7c1',
    paletteSignal: '#405500',
    paletteSupport1: '#b0d000',
    paletteSupport2: '#213019',
    paletteSupport3: '#f8fbef',
    paletteText: '#11130d',
    paletteTextOnDark: '#f4f4f0',
    paletteTextOnLight: '#11130d',
  },
}

function normalizeHex(value: unknown, fallback: string) {
  if (typeof value !== "string") return fallback
  const normalized = value.trim()
  return /^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(normalized) ? normalized : fallback
}

function hexToRgbTriplet(hex: string) {
  const normalized = hex.replace('#', '')
  const value = normalized.length === 3 ? normalized.split('').map((char) => `${char}${char}`).join('') : normalized
  const numeric = Number.parseInt(value, 16)
  if (!Number.isFinite(numeric)) return '244 244 240'
  return `${(numeric >> 16) & 255} ${(numeric >> 8) & 255} ${numeric & 255}`
}

function getHexLuminance(hex: string) {
  const normalized = hex.replace('#', '')
  const value = normalized.length === 3 ? normalized.split('').map((char) => `${char}${char}`).join('') : normalized
  const numeric = Number.parseInt(value, 16)
  if (!Number.isFinite(numeric)) return 0

  const channels = [((numeric >> 16) & 255) / 255, ((numeric >> 8) & 255) / 255, (numeric & 255) / 255].map((channel) =>
    channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
  )

  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722
}

function setVar(name: string, value: string) {
  document.documentElement.style.setProperty(name, value)
}

function updateThemeToggle(activeTone: Tone) {
  const toggle = document.querySelector<HTMLButtonElement>('[data-theme-toggle]')
  if (!toggle) return
  toggle.setAttribute('aria-label', activeTone === 'light' ? 'Switch to dark mode' : 'Switch to light mode')
}

function applyPalette(settings: PaletteSettings, preferredTone: Tone) {
  const bg = normalizeHex(settings.paletteBg, preferredTone === 'light' ? '#f4f0df' : '#050607')
  const tone: Tone = getHexLuminance(bg) > 0.62 ? 'light' : 'dark'
  const panel = normalizeHex(settings.palettePanel, tone === 'light' ? '#ddd7c1' : '#08090a')
  const textOnDark = normalizeHex(settings.paletteTextOnDark ?? settings.paletteText, '#f4f4f0')
  const textOnLight = normalizeHex(settings.paletteTextOnLight ?? settings.paletteText, '#050607')
  const text = tone === 'light' ? textOnLight : textOnDark
  const signal = normalizeHex(settings.paletteSignal, '#d8ff35')
  const muted = normalizeHex(settings.paletteMuted, tone === 'light' ? textOnLight : '#f4f4f0')
  const glow = normalizeHex(settings.paletteGlow, signal)
  const support1 = normalizeHex(settings.paletteSupport1, glow)
  const support2 = normalizeHex(settings.paletteSupport2, muted)
  const support3 = normalizeHex(settings.paletteSupport3, signal)
  const bgRgb = hexToRgbTriplet(bg)
  const panelRgb = hexToRgbTriplet(panel)
  const textRgb = hexToRgbTriplet(text)
  const textOnDarkRgb = hexToRgbTriplet(textOnDark)
  const textOnLightRgb = hexToRgbTriplet(textOnLight)
  const signalRgb = hexToRgbTriplet(signal)
  const mutedRgb = hexToRgbTriplet(muted)
  const glowRgb = hexToRgbTriplet(glow)
  const support1Rgb = hexToRgbTriplet(support1)
  const support2Rgb = hexToRgbTriplet(support2)
  const support3Rgb = hexToRgbTriplet(support3)

  document.documentElement.dataset.scanTone = tone
  document.documentElement.style.colorScheme = tone === 'light' ? 'light dark' : 'dark light'

  setVar('--fx-bg', bg)
  setVar('--fx-bg-rgb', bgRgb)
  setVar('--fx-panel', panel)
  setVar('--fx-panel-rgb', panelRgb)
  setVar('--fx-text', text)
  setVar('--fx-text-rgb', textRgb)
  setVar('--fx-text-on-dark', textOnDark)
  setVar('--fx-text-on-dark-rgb', textOnDarkRgb)
  setVar('--fx-text-on-light', textOnLight)
  setVar('--fx-text-on-light-rgb', textOnLightRgb)
  setVar('--fx-signal', signal)
  setVar('--fx-signal-rgb', signalRgb)
  setVar('--fx-muted', muted)
  setVar('--fx-muted-rgb', mutedRgb)
  setVar('--fx-glow', glow)
  setVar('--fx-glow-rgb', glowRgb)
  setVar('--fx-support-1', support1)
  setVar('--fx-support-1-rgb', support1Rgb)
  setVar('--fx-support-2', support2)
  setVar('--fx-support-2-rgb', support2Rgb)
  setVar('--fx-support-3', support3)
  setVar('--fx-support-3-rgb', support3Rgb)
  setVar('--scan-bg', bg)
  setVar('--scan-text', text)
  setVar('--scan-signal', signal)
  setVar('--scan-muted', `rgb(${mutedRgb} / ${tone === 'light' ? '0.78' : '0.72'})`)
  setVar('--scan-line', `rgb(${mutedRgb} / ${tone === 'light' ? '0.18' : '0.14'})`)

  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', bg)
}

export function hydrateTheme() {
  try {
    const theme = readThemeState()
    const activeTone = theme?.activeTone ?? 'dark'
    const settings = theme?.tones[activeTone].settings ?? DEFAULT_PALETTES[activeTone]
    applyPalette(settings, activeTone)
    updateThemeToggle(activeTone)
  } catch {
    document.documentElement.removeAttribute('data-scan-tone')
  }
}

function toggleTheme() {
  const currentTheme = readThemeState() ?? createDefaultThemeState()
  const currentTone = document.documentElement.dataset.scanTone === 'light' ? 'light' : currentTheme.activeTone
  const nextTone: Tone = currentTone === 'light' ? 'dark' : 'light'
  const nextTheme = {
    ...currentTheme,
    activeTone: nextTone,
    tones: {
      dark: {
        ...currentTheme.tones.dark,
        settings: { ...DEFAULT_PALETTES.dark, ...currentTheme.tones.dark.settings },
      },
      light: {
        ...currentTheme.tones.light,
        settings: { ...DEFAULT_PALETTES.light, ...currentTheme.tones.light.settings },
      },
    },
  }

  writeThemeState(nextTheme)
  applyPalette(nextTheme.tones[nextTone].settings, nextTone)
  updateThemeToggle(nextTone)
  window.dispatchEvent(new CustomEvent('undef-theme-change'))
}

export function initThemeHydration() {
  hydrateTheme()
  document.querySelector<HTMLButtonElement>('[data-theme-toggle]')?.addEventListener('click', toggleTheme)
  updateThemeToggle(document.documentElement.dataset.scanTone === 'light' ? 'light' : 'dark')
}
