// themes/scanlines/assets/ts/theme-hydrate.ts
import {
  applyStoredTheme,
  applyThemeState,
  createDefaultThemeState,
  readThemeState,
  writeThemeState,
} from '@undef-games/scanlines-system'

applyStoredTheme()

function currentTone(): 'dark' | 'light' {
  return (readThemeState() ?? createDefaultThemeState()).activeTone
}

function syncToggleLabel(tone: 'dark' | 'light') {
  const button = document.querySelector<HTMLButtonElement>('[data-theme-toggle]')
  if (!button) return
  button.setAttribute('aria-label', `Switch to ${tone === 'light' ? 'dark' : 'light'} mode`)
  button.setAttribute('aria-pressed', String(tone === 'dark'))
}

function toggle() {
  const current = readThemeState() ?? createDefaultThemeState()
  const nextTone: 'dark' | 'light' = current.activeTone === 'light' ? 'dark' : 'light'
  const next = { ...current, activeTone: nextTone }
  writeThemeState(next)
  applyThemeState(next)
  syncToggleLabel(nextTone)
  window.dispatchEvent(new CustomEvent('undef-theme-change'))
}

function init() {
  syncToggleLabel(currentTone())
  document.querySelector<HTMLButtonElement>('[data-theme-toggle]')?.addEventListener('click', toggle)
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true })
} else {
  init()
}
window.addEventListener('storage', () => {
  applyStoredTheme()
  syncToggleLabel(currentTone())
})
