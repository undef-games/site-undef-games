import type { CSSProperties } from 'react'

export type EffectsPresetId = string
export type EffectsTone = 'dark' | 'light'

export type EffectsSettings = {
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
  tone: EffectsTone
}

export const BASELINE_EFFECTS: EffectsSettings = {
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

const preset = (id: EffectsPresetId, label: string, settings: Partial<EffectsSettings>, tone?: EffectsTone): EffectsPreset => {
  const merged = { ...BASELINE_EFFECTS, ...settings }
  const resolvedTone = tone ?? getEffectsTone(merged)
  const textOnDark = settings.paletteTextOnDark ?? (resolvedTone === 'dark' ? merged.paletteText : BASELINE_EFFECTS.paletteTextOnDark)
  const textOnLight =
    settings.paletteTextOnLight ?? (resolvedTone === 'light' ? merged.paletteText : BASELINE_EFFECTS.paletteTextOnLight)

  return {
    id,
    label,
    settings: {
      ...merged,
      paletteText: resolvedTone === 'light' ? textOnLight : textOnDark,
      paletteTextOnDark: textOnDark,
      paletteTextOnLight: textOnLight,
      paletteSupport1: settings.paletteSupport1 ?? settings.paletteGlow ?? settings.paletteSignal ?? merged.paletteSupport1,
      paletteSupport2: settings.paletteSupport2 ?? settings.paletteMuted ?? settings.paletteGlow ?? merged.paletteSupport2,
      paletteSupport3: settings.paletteSupport3 ?? settings.paletteSignal ?? settings.paletteGlow ?? merged.paletteSupport3,
    },
    tone: resolvedTone,
  }
}

const RAW_EFFECTS_PRESETS: EffectsPreset[] = [
  { id: 'current', label: 'Current baseline', settings: BASELINE_EFFECTS, tone: 'dark' },
  preset('low-signal', 'Low signal', {
    scanOpacity: 0.72,
    scanSpeed: 0.72,
    sweepStrength: 0.62,
    noiseAmount: 0.82,
    glowStrength: 0.62,
    rectangleOpacity: 0.78,
    rectanglePulse: 0.68,
  }),
  preset('hard-lock', 'Hard lock', {
    scanOpacity: 1.22,
    scanSpacing: 0.82,
    scanSpeed: 0.48,
    sweepStrength: 1.42,
    noiseAmount: 0.55,
    jitterAmount: 0.45,
    glowStrength: 1.28,
    rectangleBorder: 1.35,
    rectangleGlow: 1.3,
  }),
  preset('dead-channel', 'Dead channel', {
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
  }),
  preset('clean-specimen', 'Clean specimen', {
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
  }),
  preset('overdriven', 'Overdriven', {
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
  }),
  preset('greenroom', 'Greenroom phosphor', {
    paletteBg: '#031008',
    palettePanel: '#06140c',
    paletteSignal: '#54ff7a',
    paletteGlow: '#54ff7a',
    scanOpacity: 1.24,
    scanSpacing: 0.78,
    scanSpeed: 0.92,
    glowStrength: 1.32,
    rectangleOpacity: 1.16,
    rectanglePulse: 1.18,
  }),
  preset('amber-monitor', 'Amber monitor', {
    paletteBg: '#100905',
    palettePanel: '#120c07',
    paletteText: '#fff0c2',
    paletteSignal: '#ffb342',
    paletteMuted: '#ffedd0',
    paletteGlow: '#ff8f1f',
    scanOpacity: 1.12,
    scanSpeed: 0.66,
    sweepStrength: 1.2,
    noiseAmount: 0.72,
    rectangleSpin: 0.82,
  }),
  preset('cyan-ice', 'Cyan ice', {
    paletteBg: '#041014',
    palettePanel: '#061116',
    paletteText: '#e8fbff',
    paletteSignal: '#39e8ff',
    paletteMuted: '#d4f8ff',
    paletteGlow: '#74f1ff',
    paletteSupport1: '#9df7ff',
    paletteSupport2: '#8fb9ff',
    paletteSupport3: '#d8ff35',
    scanOpacity: 0.96,
    scanSpacing: 1.3,
    scanSpeed: 0.52,
    frostBlur: 1.58,
    glowStrength: 1.08,
    rectangleOpacity: 0.82,
  }),
  preset('magenta-relay', 'Magenta relay', {
    paletteBg: '#100611',
    palettePanel: '#120713',
    paletteSignal: '#ff4fe3',
    paletteMuted: '#fff0fb',
    paletteGlow: '#ff70ef',
    paletteSupport1: '#ff9df0',
    paletteSupport2: '#58d9ff',
    paletteSupport3: '#d8ff35',
    scanOpacity: 1.34,
    scanSpeed: 1.26,
    sweepStrength: 1.36,
    jitterAmount: 1.22,
    rectangleSpin: 1.46,
    rectanglePulse: 1.52,
  }),
  preset('red-alert', 'Red alert', {
    paletteBg: '#110505',
    palettePanel: '#140707',
    paletteSignal: '#ff3f35',
    paletteMuted: '#ffe5e0',
    paletteGlow: '#ff675e',
    paletteSupport1: '#ff9c3d',
    paletteSupport2: '#ffe45e',
    paletteSupport3: '#ffffff',
    scanOpacity: 1.42,
    scanSpacing: 0.86,
    scanSpeed: 1.48,
    sweepStrength: 1.68,
    noiseAmount: 1.1,
    pointerWake: 1.28,
  }),
  preset('blue-noise', 'Blue noise', {
    paletteBg: '#050812',
    palettePanel: '#070a16',
    paletteSignal: '#4b83ff',
    paletteMuted: '#e5edff',
    paletteGlow: '#78a2ff',
    paletteSupport1: '#35d5ff',
    paletteSupport2: '#9b6dff',
    paletteSupport3: '#f4f4f0',
    scanOpacity: 1.05,
    scanSpeed: 1.86,
    noiseAmount: 1.78,
    jitterAmount: 1.72,
    sweepStrength: 0.74,
    rectangleOpacity: 0.7,
  }),
  preset('paper-terminal', 'Paper terminal', {
    paletteBg: '#f4f0df',
    palettePanel: '#ddd7c1',
    paletteText: '#11130d',
    paletteSignal: '#405500',
    paletteMuted: '#10120c',
    paletteGlow: '#809a16',
    scanOpacity: 0.38,
    scanSpacing: 1.65,
    scanSpeed: 0.24,
    noiseAmount: 0.34,
    glowStrength: 0.28,
    occlusionStrength: 0.52,
    rectangleOpacity: 0.36,
  }),
  preset('toxic-fog', 'Toxic fog', {
    paletteBg: '#091004',
    palettePanel: '#0b1305',
    paletteSignal: '#a6ff00',
    paletteMuted: '#ebffd0',
    paletteGlow: '#c2ff4b',
    paletteSupport1: '#d8ff35',
    paletteSupport2: '#54ff7a',
    paletteSupport3: '#00f0ff',
    scanOpacity: 1.5,
    scanSpacing: 1.08,
    scanSpeed: 0.82,
    noiseAmount: 1.22,
    glowStrength: 1.9,
    frostBlur: 1.8,
  }),
  preset('ultraviolet', 'Ultraviolet', {
    paletteBg: '#080514',
    palettePanel: '#0d0718',
    paletteSignal: '#9b6dff',
    paletteMuted: '#efe7ff',
    paletteGlow: '#ba90ff',
    paletteSupport1: '#ff4fe3',
    paletteSupport2: '#58d9ff',
    paletteSupport3: '#d8ff35',
    scanOpacity: 1.16,
    scanSpacing: 0.92,
    scanSpeed: 1.14,
    sweepStrength: 1.34,
    glowStrength: 1.58,
    rectangleSpin: 1.12,
  }),
  preset('sodium-vapor', 'Sodium vapor', {
    paletteBg: '#120d05',
    palettePanel: '#151007',
    paletteText: '#fff3da',
    paletteSignal: '#ffd03d',
    paletteMuted: '#fff2cb',
    paletteGlow: '#ff9f1a',
    paletteSupport1: '#ff7b4a',
    paletteSupport2: '#fff0c2',
    paletteSupport3: '#d8ff35',
    scanOpacity: 1.08,
    scanSpeed: 0.76,
    sweepStrength: 1.46,
    noiseAmount: 0.58,
    rectangleTravel: 0.86,
  }),
  preset('glacier-lock', 'Glacier lock', {
    paletteBg: '#061011',
    palettePanel: '#071315',
    paletteSignal: '#b7fff5',
    paletteMuted: '#f0fffc',
    paletteGlow: '#7dfff0',
    scanOpacity: 0.66,
    scanSpacing: 1.72,
    scanSpeed: 0.28,
    sweepStrength: 0.88,
    frostBlur: 1.72,
    rectanglePulse: 0.48,
  }),
  preset('blackbox', 'Blackbox trace', {
    paletteBg: '#010203',
    palettePanel: '#030405',
    paletteSignal: '#7f8a7b',
    paletteMuted: '#c9cec7',
    paletteGlow: '#d8ff35',
    scanOpacity: 0.5,
    scanSpacing: 1.42,
    scanSpeed: 0.58,
    sweepStrength: 0.52,
    noiseAmount: 1.42,
    glowStrength: 0.22,
    rectangleOpacity: 0.42,
  }),
  preset('whiteout', 'Whiteout carrier', {
    paletteBg: '#e9ece5',
    palettePanel: '#dfe3da',
    paletteText: '#070807',
    paletteSignal: '#0c0f0a',
    paletteMuted: '#1a1e16',
    paletteGlow: '#a8bf00',
    paletteSupport1: '#a8bf00',
    paletteSupport2: '#5e6f00',
    paletteSupport3: '#f4f4f0',
    scanOpacity: 0.62,
    scanSpacing: 0.74,
    scanSpeed: 1.22,
    noiseAmount: 1.86,
    jitterAmount: 0.94,
    rectangleOpacity: 1,
  }),
  preset('arcade-carrier', 'Arcade carrier', {
    paletteBg: '#07060d',
    palettePanel: '#0a0811',
    paletteSignal: '#00ffb0',
    paletteMuted: '#fff8d6',
    paletteGlow: '#ff3df2',
    paletteSupport1: '#ff3df2',
    paletteSupport2: '#00b8ff',
    paletteSupport3: '#f6d21b',
    scanOpacity: 1.28,
    scanSpacing: 0.68,
    scanSpeed: 1.32,
    sweepStrength: 1.54,
    jitterAmount: 1.18,
    rectangleSpin: 1.7,
  }),
  preset('deep-sea', 'Deep sea relay', {
    paletteBg: '#020b10',
    palettePanel: '#041017',
    paletteSignal: '#00b8d9',
    paletteMuted: '#d7f5ff',
    paletteGlow: '#29dcff',
    scanOpacity: 0.86,
    scanSpacing: 1.18,
    scanSpeed: 0.62,
    sweepStrength: 0.98,
    noiseAmount: 0.88,
    driftAmount: 1.48,
  }),
  preset('sunset-raster', 'Sunset raster', {
    paletteBg: '#130709',
    palettePanel: '#16090b',
    paletteSignal: '#ff7b4a',
    paletteMuted: '#ffe6d5',
    paletteGlow: '#ffcf52',
    paletteSupport1: '#ffcf52',
    paletteSupport2: '#ff49a8',
    paletteSupport3: '#39e8ff',
    scanOpacity: 1.18,
    scanSpeed: 0.98,
    sweepStrength: 1.22,
    noiseAmount: 0.78,
    glowStrength: 1.38,
    rectanglePulse: 1.34,
  }),
  preset('infrared', 'Infrared map', {
    paletteBg: '#0f0403',
    palettePanel: '#150604',
    paletteSignal: '#ff1f1f',
    paletteMuted: '#ffd8ca',
    paletteGlow: '#ff8d2b',
    scanOpacity: 1.62,
    scanSpacing: 1.12,
    scanSpeed: 0.44,
    sweepStrength: 1.88,
    pointerWake: 1.72,
    rectangleOpacity: 1.28,
  }),
  preset('medical-scope', 'Medical scope', {
    paletteBg: '#020b08',
    palettePanel: '#04110d',
    paletteSignal: '#1eff9b',
    paletteMuted: '#ddfff0',
    paletteGlow: '#62ffc1',
    paletteSupport1: '#62ffc1',
    paletteSupport2: '#39e8ff',
    paletteSupport3: '#fff45e',
    scanOpacity: 0.9,
    scanSpacing: 1.46,
    scanSpeed: 0.9,
    sweepStrength: 1.72,
    noiseAmount: 0.26,
    jitterAmount: 0.16,
  }),
  preset('copper-wire', 'Copper wire', {
    paletteBg: '#100704',
    palettePanel: '#130905',
    paletteSignal: '#d97936',
    paletteMuted: '#ffdec1',
    paletteGlow: '#ffae63',
    scanOpacity: 0.98,
    scanSpeed: 1.06,
    noiseAmount: 0.92,
    glowStrength: 0.84,
    rectangleTravel: 1.36,
    rectangleSpin: 0.68,
  }),
  preset('plasma-bloom', 'Plasma bloom', {
    paletteBg: '#09040f',
    palettePanel: '#100617',
    paletteSignal: '#ff49a8',
    paletteMuted: '#ffe5f3',
    paletteGlow: '#55d7ff',
    paletteSupport1: '#55d7ff',
    paletteSupport2: '#ffcf52',
    paletteSupport3: '#9b6dff',
    scanOpacity: 1.48,
    scanSpacing: 0.78,
    scanSpeed: 1.62,
    sweepStrength: 1.62,
    glowStrength: 1.94,
    frostBlur: 1.46,
  }),
  preset('bunker-light', 'Bunker light', {
    paletteBg: '#080b06',
    palettePanel: '#0b0e08',
    paletteSignal: '#c6d85a',
    paletteMuted: '#ecf0dc',
    paletteGlow: '#d8ff35',
    scanOpacity: 0.74,
    scanSpacing: 1.2,
    scanSpeed: 0.5,
    sweepStrength: 0.7,
    noiseAmount: 0.66,
    occlusionStrength: 1.5,
  }),
  preset('neon-noir', 'Neon noir', {
    paletteBg: '#050507',
    palettePanel: '#08080b',
    paletteSignal: '#00f0ff',
    paletteMuted: '#f6f2ff',
    paletteGlow: '#ff2bd6',
    paletteSupport1: '#ff2bd6',
    paletteSupport2: '#d8ff35',
    paletteSupport3: '#8b6dff',
    scanOpacity: 1.36,
    scanSpacing: 0.84,
    scanSpeed: 1.2,
    sweepStrength: 1.5,
    noiseAmount: 1.12,
    rectanglePulse: 1.62,
  }),
  preset('storm-cell', 'Storm cell', {
    paletteBg: '#06090d',
    palettePanel: '#080c12',
    paletteSignal: '#8fc7ff',
    paletteMuted: '#eef7ff',
    paletteGlow: '#d8ff35',
    paletteSupport1: '#d8ff35',
    paletteSupport2: '#9b6dff',
    paletteSupport3: '#ff4fe3',
    scanOpacity: 1.02,
    scanSpacing: 1.04,
    scanSpeed: 1.58,
    noiseAmount: 1.5,
    jitterAmount: 1.34,
    scrollBoost: 1.72,
  }),
  preset('moss-signal', 'Moss signal', {
    paletteBg: '#071006',
    palettePanel: '#091309',
    paletteSignal: '#91c95d',
    paletteMuted: '#eff7dd',
    paletteGlow: '#c6f05a',
    scanOpacity: 0.88,
    scanSpacing: 1.52,
    scanSpeed: 0.36,
    sweepStrength: 0.74,
    noiseAmount: 0.54,
    rectangleOpacity: 0.92,
  }),
  preset('lunar-gray', 'Lunar gray', {
    paletteBg: '#0a0b0d',
    palettePanel: '#0d0e11',
    paletteSignal: '#d6d9e0',
    paletteMuted: '#f3f4f7',
    paletteGlow: '#a8b6ff',
    scanOpacity: 0.8,
    scanSpacing: 1.34,
    scanSpeed: 0.64,
    sweepStrength: 0.9,
    glowStrength: 0.7,
    frostBlur: 1.28,
  }),
  preset('warning-grid', 'Warning grid', {
    paletteBg: '#0e0a02',
    palettePanel: '#110d04',
    paletteSignal: '#f6d21b',
    paletteMuted: '#fff4b8',
    paletteGlow: '#ff5a1f',
    paletteSupport1: '#ff5a1f',
    paletteSupport2: '#11130d',
    paletteSupport3: '#f4f4f0',
    scanOpacity: 1.3,
    scanSpacing: 0.62,
    scanSpeed: 1.08,
    sweepStrength: 1.7,
    noiseAmount: 0.74,
    rectangleSpin: 1.9,
  }),
  preset('datacenter', 'Datacenter cold', {
    paletteBg: '#03080c',
    palettePanel: '#050c11',
    paletteSignal: '#69b7ff',
    paletteMuted: '#e5f5ff',
    paletteGlow: '#9ad7ff',
    paletteSupport1: '#9ad7ff',
    paletteSupport2: '#54ff7a',
    paletteSupport3: '#d8ff35',
    scanOpacity: 0.7,
    scanSpacing: 1.88,
    scanSpeed: 0.42,
    noiseAmount: 0.18,
    jitterAmount: 0.12,
    sweepStrength: 1.08,
  }),
  preset('phosphor-fade', 'Phosphor fade', {
    paletteBg: '#040805',
    palettePanel: '#070d08',
    paletteSignal: '#aaff74',
    paletteMuted: '#f0ffe7',
    paletteGlow: '#d8ff35',
    scanOpacity: 0.58,
    scanSpacing: 1.14,
    scanSpeed: 0.18,
    sweepStrength: 0.34,
    glowStrength: 0.92,
    rectanglePulse: 0.2,
  }),
]

export const EFFECTS_PRESETS: EffectsPreset[] = [...RAW_EFFECTS_PRESETS].sort((left, right) => {
  const toneOrder = left.tone.localeCompare(right.tone)
  if (toneOrder !== 0) return toneOrder
  return left.label.localeCompare(right.label)
})

export function getEffectsTone(settings: EffectsSettings): EffectsTone {
  return getHexLuminance(settings.paletteBg) > 0.62 ? 'light' : 'dark'
}

export function createEffectsStyle(settings: EffectsSettings, scrollDepth: number): CSSProperties {
  const tone = getEffectsTone(settings)
  const activeText = tone === 'light' ? settings.paletteTextOnLight : settings.paletteTextOnDark
  const bgRgb = hexToRgbTriplet(settings.paletteBg)
  const panelRgb = hexToRgbTriplet(settings.palettePanel)
  const signalRgb = hexToRgbTriplet(settings.paletteSignal)
  const mutedRgb = hexToRgbTriplet(settings.paletteMuted)
  const glowRgb = hexToRgbTriplet(settings.paletteGlow)
  const support1Rgb = hexToRgbTriplet(settings.paletteSupport1)
  const support2Rgb = hexToRgbTriplet(settings.paletteSupport2)
  const support3Rgb = hexToRgbTriplet(settings.paletteSupport3)
  const textRgb = hexToRgbTriplet(activeText)
  const textOnDarkRgb = hexToRgbTriplet(settings.paletteTextOnDark)
  const textOnLightRgb = hexToRgbTriplet(settings.paletteTextOnLight)

  return {
    '--fx-bg': settings.paletteBg,
    '--fx-bg-rgb': bgRgb,
    '--fx-panel': settings.palettePanel,
    '--fx-panel-rgb': panelRgb,
    '--fx-text': activeText,
    '--fx-text-rgb': textRgb,
    '--fx-text-on-dark': settings.paletteTextOnDark,
    '--fx-text-on-dark-rgb': textOnDarkRgb,
    '--fx-text-on-light': settings.paletteTextOnLight,
    '--fx-text-on-light-rgb': textOnLightRgb,
    '--fx-signal': settings.paletteSignal,
    '--fx-signal-rgb': signalRgb,
    '--fx-muted': settings.paletteMuted,
    '--fx-muted-rgb': mutedRgb,
    '--fx-glow': settings.paletteGlow,
    '--fx-glow-rgb': glowRgb,
    '--fx-support-1': settings.paletteSupport1,
    '--fx-support-1-rgb': support1Rgb,
    '--fx-support-2': settings.paletteSupport2,
    '--fx-support-2-rgb': support2Rgb,
    '--fx-support-3': settings.paletteSupport3,
    '--fx-support-3-rgb': support3Rgb,
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
