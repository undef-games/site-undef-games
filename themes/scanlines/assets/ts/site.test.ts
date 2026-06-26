import { afterEach, expect, it, vi } from 'vitest'

const mountSiteSurface = vi.fn()
vi.mock('@undef-games/scanlines-system', () => ({ mountSiteSurface }))

afterEach(() => {
  vi.resetModules()
  vi.clearAllMocks()
  document.body.innerHTML = ''
})

it('mounts the site surface on #scanlines-root when it exists', async () => {
  document.body.innerHTML = '<div id="scanlines-root"></div>'
  const root = document.getElementById('scanlines-root')
  await import('./site')
  expect(mountSiteSurface).toHaveBeenCalledTimes(1)
  expect(mountSiteSurface).toHaveBeenCalledWith(root)
})

it('does not mount when #scanlines-root is absent', async () => {
  document.body.innerHTML = '<div id="other"></div>'
  await import('./site')
  expect(mountSiteSurface).not.toHaveBeenCalled()
})
