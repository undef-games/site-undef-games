import { afterEach, beforeEach, expect, it, vi } from 'vitest'

const applyStoredTheme = vi.fn()
const applyThemeState = vi.fn()
const createDefaultThemeState = vi.fn(() => ({ activeTone: 'dark' as const }))
const readThemeState = vi.fn()
const writeThemeState = vi.fn()
vi.mock('@undef-games/scanlines-system', () => ({
  applyStoredTheme, applyThemeState, createDefaultThemeState, readThemeState, writeThemeState,
}))

function setReadyState(value: DocumentReadyState) {
  Object.defineProperty(document, 'readyState', { value, configurable: true })
}

// Track window listeners added during each test so we can remove them after,
// preventing accumulated storage listeners from bleeding across module imports.
const addedListeners: Array<{ type: string; listener: EventListenerOrEventListenerObject }> = []
const origAddEventListener = window.addEventListener.bind(window)

beforeEach(() => {
  vi.spyOn(window, 'addEventListener').mockImplementation((type, listener, options) => {
    addedListeners.push({ type, listener: listener as EventListenerOrEventListenerObject })
    origAddEventListener(type, listener as EventListenerOrEventListenerObject, options)
  })
})

afterEach(() => {
  // Remove every window listener that the imported module registered this test.
  for (const { type, listener } of addedListeners) {
    window.removeEventListener(type, listener)
  }
  addedListeners.length = 0
  vi.restoreAllMocks()
  vi.resetModules()
  vi.clearAllMocks()
  document.body.innerHTML = ''
})

it('applies the stored theme on load', async () => {
  setReadyState('complete')
  await import('./theme-hydrate')
  expect(applyStoredTheme).toHaveBeenCalledTimes(1)
})

it('toggles light -> dark, persists, applies, and dispatches the event', async () => {
  readThemeState.mockReturnValue({ activeTone: 'light' })
  document.body.innerHTML = '<button data-theme-toggle></button>'
  setReadyState('complete')                       // init runs immediately
  await import('./theme-hydrate')
  const onChange = vi.fn()
  window.addEventListener('undef-theme-change', onChange)
  document.querySelector<HTMLButtonElement>('[data-theme-toggle]')!.click()
  expect(writeThemeState).toHaveBeenCalledWith({ activeTone: 'dark' })
  expect(applyThemeState).toHaveBeenCalledWith({ activeTone: 'dark' })
  expect(onChange).toHaveBeenCalledTimes(1)
})

it('toggles dark -> light', async () => {
  readThemeState.mockReturnValue({ activeTone: 'dark' })
  document.body.innerHTML = '<button data-theme-toggle></button>'
  setReadyState('complete')
  await import('./theme-hydrate')
  document.querySelector<HTMLButtonElement>('[data-theme-toggle]')!.click()
  expect(writeThemeState).toHaveBeenCalledWith({ activeTone: 'light' })
  expect(applyThemeState).toHaveBeenCalledWith({ activeTone: 'light' })
})

it('falls back to the default theme state when none is stored', async () => {
  readThemeState.mockReturnValue(null)             // exercises `?? createDefaultThemeState()`
  document.body.innerHTML = '<button data-theme-toggle></button>'
  setReadyState('complete')
  await import('./theme-hydrate')
  document.querySelector<HTMLButtonElement>('[data-theme-toggle]')!.click()
  expect(createDefaultThemeState).toHaveBeenCalledTimes(1)
  // default is dark -> next is light:
  expect(writeThemeState).toHaveBeenCalledWith({ activeTone: 'light' })
})

it('wires the toggle on DOMContentLoaded when the document is still loading', async () => {
  readThemeState.mockReturnValue({ activeTone: 'light' })
  document.body.innerHTML = '<button data-theme-toggle></button>'
  setReadyState('loading')                         // init deferred to DOMContentLoaded
  await import('./theme-hydrate')
  document.querySelector<HTMLButtonElement>('[data-theme-toggle]')!.click()
  expect(writeThemeState).not.toHaveBeenCalled()   // not wired yet
  document.dispatchEvent(new Event('DOMContentLoaded'))
  document.querySelector<HTMLButtonElement>('[data-theme-toggle]')!.click()
  expect(writeThemeState).toHaveBeenCalledWith({ activeTone: 'dark' })
})

it('does not throw when the toggle button is absent', async () => {
  document.body.innerHTML = ''                      // no [data-theme-toggle]
  setReadyState('complete')
  await expect(import('./theme-hydrate')).resolves.toBeDefined()
  expect(applyStoredTheme).toHaveBeenCalledTimes(1)
})

it('re-applies the stored theme on a storage event', async () => {
  setReadyState('complete')
  await import('./theme-hydrate')
  applyStoredTheme.mockClear() // reset import-time call so the assertion isolates the storage-event call
  window.dispatchEvent(new Event('storage'))
  expect(applyStoredTheme).toHaveBeenCalledTimes(1)
})
