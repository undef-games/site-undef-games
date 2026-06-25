import { test, expect } from '@playwright/test'

// Smoke-verify that both Pixi scene shells (site-app.tsx surface at '/' and
// station-signal-scene.tsx shell at '/lab/') mount cleanly: canvas present,
// engine boots, surrounding DOM anchors visible, zero console/page errors.

test('site surface: scanline scene mounts with no errors', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(`[console.error] ${m.text()}`)
  })
  page.on('pageerror', (e) => errors.push(`[pageerror] ${e.message}`))

  await page.goto('/')

  // The signal scene shell renders with this aria-label in both surfaces
  const signalScene = page.getByLabel('interactive station signal')
  await expect(signalScene).toBeVisible()
  await expect(signalScene).toHaveAttribute('data-renderer', 'pixijs')

  // Canvas is appended by the Pixi engine after async init
  await expect(signalScene.locator('canvas')).toHaveCount(1)
  await expect(signalScene.locator('canvas')).toBeVisible()

  // Station broadcast div wraps the scene and is a stable DOM anchor
  await expect(page.getByLabel('static station identity')).toBeVisible()

  // The station-shell--site surface marker must be present
  await expect(page.locator('.station-shell--site')).toBeVisible()

  expect(errors, `Unexpected errors on /:\n${errors.join('\n')}`).toEqual([])
})

test('lab surface: scanline scene mounts with no errors', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(`[console.error] ${m.text()}`)
  })
  page.on('pageerror', (e) => errors.push(`[pageerror] ${e.message}`))

  await page.goto('/lab/')

  // The signal scene shell renders with this aria-label in both surfaces
  const signalScene = page.getByLabel('interactive station signal')
  await expect(signalScene).toBeVisible()
  await expect(signalScene).toHaveAttribute('data-renderer', 'pixijs')

  // Canvas is appended by the Pixi engine after async init
  await expect(signalScene.locator('canvas')).toHaveCount(1)
  await expect(signalScene.locator('canvas')).toBeVisible()

  // Station broadcast div wraps the scene and is a stable DOM anchor
  await expect(page.getByLabel('static station identity')).toBeVisible()

  // Lab surface has effects controls; site does not
  await expect(page.getByLabel('effects controls')).toBeVisible()

  expect(errors, `Unexpected errors on /lab/:\n${errors.join('\n')}`).toEqual([])
})
