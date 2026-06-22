import { applyThemeState } from './hydrate'
import { readThemeState } from './persistence'

export function applyStoredTheme(): void {
  try {
    applyThemeState(readThemeState())
  } catch {
    document.documentElement.dataset.scanTone = 'dark'
  }
}
