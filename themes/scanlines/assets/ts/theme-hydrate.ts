// themes/scanlines/assets/ts/theme-hydrate.ts
import {
  applyStoredTheme,
  applyThemeState,
  createDefaultThemeState,
  readThemeState,
  writeThemeState,
} from '@undef-games/scanlines-system'

applyStoredTheme()

function toggle() {
  const current = readThemeState() ?? createDefaultThemeState()
  const nextTone: 'dark' | 'light' = current.activeTone === 'light' ? 'dark' : 'light'
  const next = { ...current, activeTone: nextTone }
  writeThemeState(next)
  applyThemeState(next)
  window.dispatchEvent(new CustomEvent('undef-theme-change'))
}

function init() {
  document.querySelector<HTMLButtonElement>('[data-theme-toggle]')?.addEventListener('click', toggle)
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true })
} else {
  init()
}
window.addEventListener('storage', () => { applyStoredTheme() })
