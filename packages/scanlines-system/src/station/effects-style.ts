import type { CSSProperties } from 'react'
import type { EffectsSettings, EffectsTone } from './effects-config'

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
    '--fx-scan-scroll-impact': settings.scanScrollImpact,
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
    '--fx-scroll-inertia': settings.scrollInertia,
    '--fx-occlusion-strength': settings.occlusionStrength,
    '--fx-rectangle-opacity': settings.rectangleOpacity,
    '--fx-rectangle-travel': settings.rectangleTravel,
    '--fx-rectangle-spin': settings.rectangleSpin,
    '--fx-rectangle-pulse': settings.rectanglePulse,
    '--fx-rectangle-fill': settings.rectangleFill,
    '--fx-rectangle-border': settings.rectangleBorder,
    '--fx-rectangle-glow': settings.rectangleGlow,
    '--fx-rectangle-wobble': settings.rectangleWobble,
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
