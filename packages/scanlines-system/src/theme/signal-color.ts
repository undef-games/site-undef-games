import { createDefaultThemeState, readThemeState, writeThemeState } from './persistence'

export const SIGNAL_COLORS = [
  { label: 'Signal', value: '#d8ff35' },
  { label: 'Blue', value: '#69a7ff' },
  { label: 'Teal', value: '#5eead4' },
  { label: 'Amber', value: '#fbbf24' },
  { label: 'Ember', value: '#ff6b6b' },
  { label: 'Violet', value: '#c084fc' },
] as const

export function getSignalColor(): string {
  const theme = readThemeState() ?? createDefaultThemeState()
  return theme.tones[theme.activeTone].settings.paletteSignal ?? '#d8ff35'
}

export function setSignalColor(hex: string): void {
  const theme = readThemeState() ?? createDefaultThemeState()
  const tone = theme.activeTone
  const next = {
    ...theme,
    tones: {
      ...theme.tones,
      [tone]: {
        ...theme.tones[tone],
        settings: { ...theme.tones[tone].settings, paletteSignal: hex, paletteGlow: hex, paletteSupport1: hex },
      },
    },
  }
  writeThemeState(next)
}
