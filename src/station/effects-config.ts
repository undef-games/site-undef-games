import type { CSSProperties } from 'react'

export type EffectsPresetId = 'current' | 'low-signal' | 'hard-lock' | 'dead-channel' | 'clean-specimen' | 'overdriven'

export type EffectsSettings = {
  paletteBg: string
  palettePanel: string
  paletteText: string
  paletteSignal: string
  paletteMuted: string
  paletteGlow: string
  scanOpacity: number
  scanSpacing: number
  scanSpeed: number
  sweepStrength: number
  noiseAmount: number
  jitterAmount: number
  glowStrength: number
  frostBlur: number
  driftAmount: number
  pointerWake: number
  scrollBoost: number
  occlusionStrength: number
  rectangleOpacity: number
  rectangleTravel: number
  rectangleSpin: number
  rectanglePulse: number
  rectangleFill: number
  rectangleBorder: number
  rectangleGlow: number
}

export type EffectsPreset = {
  id: EffectsPresetId
  label: string
  settings: EffectsSettings
}

export const BASELINE_EFFECTS: EffectsSettings = {
  paletteBg: '#050607',
  palettePanel: '#08090a',
  paletteText: '#f4f4f0',
  paletteSignal: '#d8ff35',
  paletteMuted: '#f4f4f0',
  paletteGlow: '#d8ff35',
  scanOpacity: 1,
  scanSpacing: 1,
  scanSpeed: 1,
  sweepStrength: 1,
  noiseAmount: 1,
  jitterAmount: 1,
  glowStrength: 1,
  frostBlur: 1,
  driftAmount: 1,
  pointerWake: 1,
  scrollBoost: 1,
  occlusionStrength: 1,
  rectangleOpacity: 1,
  rectangleTravel: 1,
  rectangleSpin: 1,
  rectanglePulse: 1,
  rectangleFill: 1,
  rectangleBorder: 1,
  rectangleGlow: 1,
}

export const EFFECTS_PRESETS: EffectsPreset[] = [
  { id: 'current', label: 'Current baseline', settings: BASELINE_EFFECTS },
  {
    id: 'low-signal',
    label: 'Low signal',
    settings: {
      ...BASELINE_EFFECTS,
      scanOpacity: 0.72,
      scanSpeed: 0.72,
      sweepStrength: 0.62,
      noiseAmount: 0.82,
      glowStrength: 0.62,
      rectangleOpacity: 0.78,
      rectanglePulse: 0.68,
    },
  },
  {
    id: 'hard-lock',
    label: 'Hard lock',
    settings: {
      ...BASELINE_EFFECTS,
      scanOpacity: 1.22,
      scanSpacing: 0.82,
      scanSpeed: 0.48,
      sweepStrength: 1.42,
      noiseAmount: 0.55,
      jitterAmount: 0.45,
      glowStrength: 1.28,
      rectangleBorder: 1.35,
      rectangleGlow: 1.3,
    },
  },
  {
    id: 'dead-channel',
    label: 'Dead channel',
    settings: {
      ...BASELINE_EFFECTS,
      paletteSignal: '#f4f4f0',
      paletteGlow: '#f4f4f0',
      scanOpacity: 0.88,
      scanSpeed: 1.55,
      sweepStrength: 0.42,
      noiseAmount: 1.65,
      jitterAmount: 1.5,
      glowStrength: 0.58,
      rectangleOpacity: 0.58,
      rectangleFill: 0.7,
      rectangleBorder: 0.72,
    },
  },
  {
    id: 'clean-specimen',
    label: 'Clean specimen',
    settings: {
      ...BASELINE_EFFECTS,
      scanOpacity: 0.42,
      scanSpacing: 1.24,
      scanSpeed: 0.4,
      sweepStrength: 0.32,
      noiseAmount: 0.22,
      jitterAmount: 0.22,
      glowStrength: 0.38,
      frostBlur: 0.55,
      rectangleOpacity: 0.55,
      rectanglePulse: 0.35,
    },
  },
  {
    id: 'overdriven',
    label: 'Overdriven',
    settings: {
      ...BASELINE_EFFECTS,
      scanOpacity: 1.55,
      scanSpacing: 0.72,
      scanSpeed: 1.72,
      sweepStrength: 1.72,
      noiseAmount: 1.45,
      jitterAmount: 1.6,
      glowStrength: 1.75,
      frostBlur: 1.35,
      pointerWake: 1.4,
      scrollBoost: 1.45,
      rectangleOpacity: 1.22,
      rectangleTravel: 1.12,
      rectangleSpin: 1.28,
      rectanglePulse: 1.4,
      rectangleGlow: 1.5,
    },
  },
]

export function createEffectsStyle(settings: EffectsSettings, scrollDepth: number): CSSProperties {
  const signalRgb = hexToRgbTriplet(settings.paletteSignal)
  const mutedRgb = hexToRgbTriplet(settings.paletteMuted)
  const glowRgb = hexToRgbTriplet(settings.paletteGlow)
  const textRgb = hexToRgbTriplet(settings.paletteText)

  return {
    '--fx-bg': settings.paletteBg,
    '--fx-panel': settings.palettePanel,
    '--fx-text': settings.paletteText,
    '--fx-text-rgb': textRgb,
    '--fx-signal': settings.paletteSignal,
    '--fx-signal-rgb': signalRgb,
    '--fx-muted': settings.paletteMuted,
    '--fx-muted-rgb': mutedRgb,
    '--fx-glow': settings.paletteGlow,
    '--fx-glow-rgb': glowRgb,
    '--fx-scan-opacity': formatNumber(0.055 * settings.scanOpacity),
    '--fx-scan-spacing': `${formatNumber(12 * settings.scanSpacing)}px`,
    '--fx-section-scan-opacity': formatNumber(0.035 * settings.scanOpacity),
    '--fx-scan-speed': settings.scanSpeed,
    '--fx-sweep-strength': settings.sweepStrength,
    '--fx-noise-amount': settings.noiseAmount,
    '--fx-jitter-amount': settings.jitterAmount,
    '--fx-glow-strength': settings.glowStrength,
    '--fx-frost-blur': settings.frostBlur,
    '--fx-drift-amount': settings.driftAmount,
    '--fx-pointer-wake': settings.pointerWake,
    '--fx-scroll-boost': settings.scrollBoost,
    '--fx-occlusion-strength': settings.occlusionStrength,
    '--fx-rectangle-opacity': settings.rectangleOpacity,
    '--fx-rectangle-travel': settings.rectangleTravel,
    '--fx-rectangle-spin': settings.rectangleSpin,
    '--fx-rectangle-pulse': settings.rectanglePulse,
      '--fx-rectangle-fill': settings.rectangleFill,
      '--fx-rectangle-border': settings.rectangleBorder,
      '--fx-rectangle-glow': settings.rectangleGlow,
      '--fx-rectangle-pulse-factor': formatNumber(1 / Math.max(0.1, settings.rectanglePulse)),
      '--scroll-depth': scrollDepth,
    } as CSSProperties
  }

export function hexToPixiColor(hex: string) {
  const normalized = hex.replace('#', '')
  const value = normalized.length === 3 ? normalized.split('').map((char) => `${char}${char}`).join('') : normalized
  const numeric = Number.parseInt(value, 16)
  return Number.isFinite(numeric) ? numeric : 0xf4f4f0
}

function hexToRgbTriplet(hex: string) {
  const normalized = hex.replace('#', '')
  const value = normalized.length === 3 ? normalized.split('').map((char) => `${char}${char}`).join('') : normalized
  const numeric = Number.parseInt(value, 16)
  if (!Number.isFinite(numeric)) return '244 244 240'
  return `${(numeric >> 16) & 255} ${(numeric >> 8) & 255} ${numeric & 255}`
}

function formatNumber(value: number) {
  return Number(value.toFixed(4)).toString()
}
