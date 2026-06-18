import { initThemeHydration } from '@undef/scanlines-system'

function syncThemeTogglePressedState() {
  const toggle = document.querySelector<HTMLButtonElement>('[data-theme-toggle]')
  if (!toggle) return

  toggle.setAttribute('aria-pressed', document.documentElement.dataset.scanTone === 'dark' ? 'true' : 'false')
}

window.addEventListener('undef-theme-change', syncThemeTogglePressedState)
initThemeHydration()
syncThemeTogglePressedState()
