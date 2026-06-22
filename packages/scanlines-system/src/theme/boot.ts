import { applyThemeState } from './hydrate'
import { readThemeState } from './persistence'

export function applyStoredTheme(): void {
  try {
    const theme = readThemeState()
    applyThemeState(theme)
    if (typeof window !== 'undefined') {
      const tone = theme?.activeTone ?? 'dark'
      ;(window as unknown as { __undefScanTheme?: { tone: 'dark' | 'light'; settings: unknown } }).__undefScanTheme = {
        tone,
        settings: theme?.tones[tone]?.settings ?? null,
      }
    }
  } catch {
    if (typeof document !== 'undefined') document.documentElement.dataset.scanTone = 'dark'
  }
}
