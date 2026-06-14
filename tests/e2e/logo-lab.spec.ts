import { expect, test } from '@playwright/test'

test('tunes the static station identity to signal lock', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: /undef games/i })).toBeVisible()
  const signalScene = page.getByLabel('interactive station signal')
  await expect(signalScene).toBeVisible()
  await expect(signalScene).toHaveAttribute('data-renderer', 'pixijs')
  await expect(signalScene.locator('canvas')).toHaveCount(1)
  await expect.poll(() => signalScene.locator('canvas').evaluate(hasPaintedWebGlPixels)).toBe(true)
  const initialScanlines = Number(await signalScene.getAttribute('data-active-scanlines'))
  await expect(page.getByText(/NO SIGNAL/i).first()).toBeVisible()

  for (let index = 0; index < 4; index += 1) {
    await page.getByRole('button', { name: /tune signal/i }).click()
  }

  const lockedScanlines = Number(await signalScene.getAttribute('data-active-scanlines'))
  expect(lockedScanlines).toBeGreaterThan(initialScanlines)
  await expect(page.getByText(/LOCKED/i).first()).toBeVisible()
  await expect(page.getByText(/^LIVE$/i)).toHaveCount(0)
  await expect(page.getByLabel(/signal 100/i)).toBeVisible()
  await expect(page.getByLabel(/station lockup/i)).toBeVisible()
})

test('keeps the station surface usable on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')

  await expect(page.getByLabel('interactive station signal')).toBeVisible()
  await expect(page.getByRole('button', { name: /tune signal/i })).toBeVisible()

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
  expect(overflow).toBe(false)
})

test('keeps the Pixi canvas fitted after viewport resize', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 820 })
  await page.goto('/')

  const signalScene = page.getByLabel('interactive station signal')
  await expect(signalScene.locator('canvas')).toHaveCount(1)
  await expect.poll(() => signalScene.locator('canvas').evaluate(hasPaintedWebGlPixels)).toBe(true)

  await page.setViewportSize({ width: 920, height: 760 })
  await expect.poll(() => signalScene.evaluate(getCanvasFitDelta)).toBeLessThanOrEqual(2)
})

test('updates the landing scan field while scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 820 })
  await page.goto('/')

  const signalScene = page.getByLabel('interactive station signal')
  const sectionToyLine = page.locator('.landing-section--signal .section-toy span').first()
  await expect(signalScene).toHaveAttribute('data-scroll-depth', '0')
  await expect(page.getByLabel('signal behavior')).toBeVisible()
  await expect(sectionToyLine).toBeVisible()
  const initialTravel = await sectionToyLine.evaluate(getTranslateX)

  await page.mouse.move(420, 320)
  await page.mouse.wheel(0, 720)

  await expect.poll(async () => Number(await signalScene.getAttribute('data-scroll-depth'))).toBeGreaterThan(0)
  await expect.poll(() => sectionToyLine.evaluate(getTranslateX)).toBeLessThan(initialTravel - 250)
  await expect(page.getByRole('heading', { name: /scanlines react/i })).toBeVisible()
})

test('keeps pointer scan control active over the hero text', async ({ page }) => {
  await page.goto('/')

  const signalScene = page.getByLabel('interactive station signal')
  const heading = page.getByRole('heading', { name: /undef games/i })
  const box = await heading.boundingBox()
  expect(box).not.toBeNull()

  await page.mouse.move(box!.x + box!.width * 0.42, box!.y + box!.height * 0.52)

  await expect(signalScene).toHaveAttribute('data-pointer-active', 'true')
  await expect.poll(async () => Number(await signalScene.getAttribute('data-pointer-y'))).not.toBe(0)
})

test('switches channel toys and keeps one canvas scene', async ({ page }) => {
  await page.goto('/')

  const signalScene = page.getByLabel('interactive station signal')
  await expect(signalScene.locator('canvas')).toHaveCount(1)
  await expect(page.getByLabel('signal scope')).toBeVisible()
  await expect(page.getByLabel('channel toys')).toBeVisible()

  await page.getByRole('button', { name: /CH 13/i }).click()

  await expect(signalScene).toHaveAttribute('data-channel-mode', 'game')
  await expect(page.getByLabel('signal scope')).toHaveAttribute('data-channel-mode', 'game')
  await expect(page.locator('.packet-drift')).toHaveAttribute('data-channel-mode', 'game')
  await expect(signalScene.locator('canvas')).toHaveCount(1)
})

function getTranslateX(element: Element) {
  const transform = getComputedStyle(element).transform
  if (transform === 'none') return 0
  const matrix = new DOMMatrixReadOnly(transform)
  return matrix.m41
}

function getCanvasFitDelta(scene: HTMLElement) {
  const canvas = scene.querySelector('canvas')
  if (!canvas) return Number.POSITIVE_INFINITY

  const sceneRect = scene.getBoundingClientRect()
  const canvasRect = canvas.getBoundingClientRect()
  return Math.max(Math.abs(sceneRect.width - canvasRect.width), Math.abs(sceneRect.height - canvasRect.height))
}

function hasPaintedWebGlPixels(canvas: HTMLCanvasElement) {
  const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl')
  if (!gl) return false

  const width = gl.drawingBufferWidth
  const height = gl.drawingBufferHeight
  const pixels = new Uint8Array(4 * 9)
  const sampleX = Math.max(0, Math.floor(width / 2) - 1)
  const sampleY = Math.max(0, Math.floor(height / 2) - 1)
  gl.readPixels(sampleX, sampleY, 3, 3, gl.RGBA, gl.UNSIGNED_BYTE, pixels)

  return pixels.some((channel) => channel > 0)
}
