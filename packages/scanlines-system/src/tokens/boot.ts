import { applyThemeState } from './hydrate'
import { scanlinesLog } from './log'
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
  } catch (e) {
    scanlinesLog().warn('scanlines.theme.read_failed', { error: String(e) })
    if (typeof document !== 'undefined') document.documentElement.dataset.scanTone = 'dark'
  }
}
