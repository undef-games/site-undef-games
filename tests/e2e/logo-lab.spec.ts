import { expect, test, type Page } from '@playwright/test'

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
  await expect
    .poll(() => page.getByRole('button', { name: /tune signal/i }).evaluate(readControlColors))
    .toMatchObject({
      backgroundColor: 'rgba(5, 6, 7, 0.84)',
      borderColor: 'rgba(244, 244, 240, 0.22)',
      color: 'rgb(244, 244, 240)',
    })
  await expect
    .poll(() => page.getByRole('button', { name: /CH 00/i }).evaluate(readControlColors))
    .toMatchObject({
      backgroundColor: 'rgba(216, 255, 53, 0.12)',
      borderColor: 'rgb(216, 255, 53)',
      color: 'rgb(216, 255, 53)',
    })
  await expect
    .poll(() => page.getByRole('button', { name: /CH 13/i }).evaluate(readControlColors))
    .toMatchObject({
      backgroundColor: 'rgb(5, 6, 7)',
      borderColor: 'rgba(244, 244, 240, 0.2)',
      color: 'rgba(244, 244, 240, 0.78)',
    })

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
  const colorSwatch = page.locator('.color-control input[type="color"]').first()
  const swatchBox = await colorSwatch.boundingBox()
  expect(swatchBox).not.toBeNull()
  expect(swatchBox!.width).toBeLessThanOrEqual(40)
  expect(swatchBox!.height).toBeLessThanOrEqual(28)
  await expect.poll(() => colorSwatch.evaluate((element) => getComputedStyle(element).borderRadius)).toBe('0px')

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
  const reverseToyLine = page.locator('.landing-section--signal .section-toy span').nth(2)
  await expect(signalScene).toHaveAttribute('data-scroll-depth', '0')
  await expect(page.getByLabel('signal behavior')).toBeVisible()
  await expect(sectionToyLine).toBeVisible()
  const initialTravel = await sectionToyLine.evaluate(getTranslateX)
  const initialReverseTravel = await reverseToyLine.evaluate(getTranslateX)

  await page.mouse.move(420, 320)
  await page.mouse.wheel(0, 720)

  await expect.poll(async () => Number(await signalScene.getAttribute('data-scroll-depth'))).toBeGreaterThan(0)
  await expect.poll(() => sectionToyLine.evaluate(getTranslateX)).toBeLessThan(initialTravel - 100)
  await expect.poll(() => reverseToyLine.evaluate(getTranslateX)).toBeLessThan(initialReverseTravel - 100)
  await expect(page.getByRole('heading', { name: /scanlines react/i })).toBeVisible()
})

test('advertises concrete undef games projects', async ({ page }) => {
  await page.goto('/')

  const projects = page.getByLabel('undef games projects')
  await expect(projects).toBeVisible()
  await expect(projects.getByRole('heading', { name: /actual projects/i })).toBeVisible()
  await expect(projects.getByRole('link', { name: /TradeWars: WARP Agent Runtime Platform/i })).toHaveAttribute(
    'href',
    /https:\/\/warp\.undef\.games\/?/,
  )
  await expect(projects.getByRole('link', { name: /Undef Dice/i })).toHaveAttribute('href', /https:\/\/undefdice\.com\/?/)
  await expect(projects.getByRole('link', { name: /Taybols/i })).toHaveAttribute('href', /https:\/\/taybols\.undef\.games\/?/)
})

test('moves identity boxes from right to left through section scroll and reverses', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 820 })
  await page.goto('/')

  const identitySection = page.getByLabel('identity baseline')
  const identityBox = page.locator('.landing-section--identity .section-toy span').first()
  await expect(identityBox).toBeVisible()

  const sectionMetrics = await identitySection.evaluate((element) => {
    const rect = element.getBoundingClientRect()
    return {
      height: rect.height,
      top: rect.top + window.scrollY,
      viewportHeight: window.innerHeight,
    }
  })

  await page.evaluate((scrollY) => window.scrollTo(0, scrollY), sectionMetrics.top - sectionMetrics.viewportHeight)
  await expect.poll(() => identityBox.evaluate(getTranslateX)).toBeGreaterThan(420)

  await page.evaluate((scrollY) => window.scrollTo(0, scrollY), sectionMetrics.top + sectionMetrics.height)
  await expect.poll(() => identityBox.evaluate(getTranslateX)).toBeLessThan(-420)

  await page.evaluate((scrollY) => window.scrollTo(0, scrollY), sectionMetrics.top - sectionMetrics.viewportHeight)
  await expect.poll(() => identityBox.evaluate(getTranslateX)).toBeGreaterThan(420)
})

test('tumbles identity rectangles at distinct rates while they travel', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 820 })
  await page.goto('/')

  const identitySection = page.getByLabel('identity baseline')
  const identityBoxes = page.locator('.landing-section--identity .section-toy span').filter({ visible: true })
  await expect(identityBoxes).toHaveCount(4)

  const sectionMetrics = await identitySection.evaluate((element) => {
    const rect = element.getBoundingClientRect()
    return {
      height: rect.height,
      top: rect.top + window.scrollY,
      viewportHeight: window.innerHeight,
    }
  })

  await scrollSectionToProgress(page, sectionMetrics, 0.25)
  const earlyTransforms = await identityBoxes.evaluateAll(getBoxTransforms)

  await scrollSectionToProgress(page, sectionMetrics, 0.65)
  const laterTransforms = await identityBoxes.evaluateAll(getBoxTransforms)
  const laterAngles = laterTransforms.map((box) => Math.round(box.rotation))
  const uniqueAngles = new Set(laterAngles.map((angle) => Math.round(angle / 8) * 8))

  expect(uniqueAngles.size).toBeGreaterThanOrEqual(3)
  laterTransforms.forEach((box, index) => {
    expect(box.translateX).toBeLessThan(earlyTransforms[index].translateX - 250)
    expect(Math.abs(box.rotation - earlyTransforms[index].rotation)).toBeGreaterThan(18)
  })
})

test('pulses identity rectangle fill border and glow out of phase', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 820 })
  await page.goto('/')

  const identityBoxes = page.locator('.landing-section--identity .section-toy span').filter({ visible: true })
  await expect(identityBoxes).toHaveCount(4)

  const pulseStyles = await identityBoxes.evaluateAll((elements) =>
    elements.map((element) => {
      const style = getComputedStyle(element)
      return {
        delays: style.animationDelay.split(',').map((value) => value.trim()),
        durations: style.animationDuration.split(',').map((value) => value.trim()),
        names: style.animationName.split(',').map((value) => value.trim()),
      }
    }),
  )

  pulseStyles.forEach((style) => {
    expect(style.names).toEqual(['identity-fill-pulse', 'identity-border-pulse', 'identity-glow-pulse'])
    expect(style.durations).toHaveLength(3)
    expect(style.delays).toHaveLength(3)
  })

  const fillDurations = new Set(pulseStyles.map((style) => style.durations[0]))
  const borderDurations = new Set(pulseStyles.map((style) => style.durations[1]))
  const glowDelays = new Set(pulseStyles.map((style) => style.delays[2]))

  expect(fillDurations.size).toBeGreaterThanOrEqual(3)
  expect(borderDurations.size).toBeGreaterThanOrEqual(3)
  expect(glowDelays.size).toBe(4)
})

test('keeps pointer scan control active over the hero text', async ({ page }) => {
  await page.goto('/')

  const signalScene = page.getByLabel('interactive station signal')
  await expect(signalScene.locator('canvas')).toHaveCount(1)
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

test('exposes right-rail effect presets and live parameters', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 820 })
  await page.goto('/')

  const rail = page.getByLabel('station tools and identity')
  const effects = page.getByLabel('effects controls')
  const presetSelect = effects.getByLabel('Effect preset')
  await expect(rail).toBeVisible()
  await expect(effects).toBeVisible()
  await expect(presetSelect).toHaveValue('current')
  await expect.poll(() => presetSelect.locator('option').count()).toBeGreaterThanOrEqual(30)
  const presetGroups = await presetSelect.locator('optgroup').evaluateAll((groups) =>
    groups.map((group) => {
      const presetGroup = group as HTMLOptGroupElement
      return {
        label: presetGroup.label,
        options: Array.from(presetGroup.querySelectorAll('option')).map((option) => option.textContent?.trim() ?? ''),
      }
    }),
  )
  expect(presetGroups.map((group) => group.label)).toEqual(['🌙 Dark presets', '☀️ Light presets'])
  presetGroups.forEach((group) => {
    const icon = group.label.startsWith('🌙') ? '🌙' : '☀️'
    const labels = group.options.map((label) => label.replace(/^\S+\s/u, ''))
    expect(group.options.every((label) => label.startsWith(icon))).toBe(true)
    expect(labels).toEqual([...labels].sort((left, right) => left.localeCompare(right)))
  })

  await expect(effects.getByLabel('Scan opacity', { exact: true })).toHaveValue('1')
  await expect.poll(() => page.locator('.station-shell').evaluate((element) => getComputedStyle(element).getPropertyValue('--fx-scan-opacity').trim())).toBe('0.055')

  await presetSelect.selectOption('paper-terminal')
  await expect(page.locator('.station-shell')).toHaveAttribute('data-tone', 'light')
  await expect.poll(() => page.locator('.station-shell').evaluate((element) => getComputedStyle(element).getPropertyValue('--fx-text-on-light').trim())).toBe('#11130d')
  await expect.poll(() => page.locator('.station-shell').evaluate((element) => getComputedStyle(element).getPropertyValue('--fx-text-on-dark').trim())).toBe('#f4f4f0')
  await expect
    .poll(() => page.getByRole('heading', { name: /actual projects/i }).evaluate((element) => getComputedStyle(element).color))
    .toBe('rgb(17, 19, 13)')
  await expect
    .poll(() => page.getByRole('button', { name: /tune signal/i }).evaluate((element) => getComputedStyle(element).color))
    .toBe('rgb(244, 244, 240)')

  await presetSelect.selectOption('cyan-ice')
  await expect.poll(() => page.locator('.station-shell').evaluate((element) => getComputedStyle(element).getPropertyValue('--fx-signal').trim())).toBe('#39e8ff')
  await expect.poll(() => page.locator('.station-shell').evaluate((element) => getComputedStyle(element).getPropertyValue('--fx-support-1').trim())).toBe('#9df7ff')
  await expect.poll(() => page.locator('.station-shell').evaluate((element) => getComputedStyle(element).getPropertyValue('--fx-support-2').trim())).toBe('#8fb9ff')
  await expect.poll(() => page.locator('.station-shell').evaluate((element) => getComputedStyle(element).getPropertyValue('--fx-support-3').trim())).toBe('#d8ff35')
  await expect.poll(() => page.locator('.station-shell').evaluate((element) => getComputedStyle(element).getPropertyValue('--fx-scan-spacing').trim())).toBe('15.6px')

  await effects.getByLabel('Scan opacity', { exact: true }).fill('1.4')
  await expect.poll(() => page.locator('.station-shell').evaluate((element) => getComputedStyle(element).getPropertyValue('--fx-scan-opacity').trim())).toBe('0.077')

  await effects.getByLabel('Rectangle spin', { exact: true }).fill('1.35')
  await expect.poll(() => page.locator('.station-shell').evaluate((element) => getComputedStyle(element).getPropertyValue('--fx-rectangle-spin').trim())).toBe('1.35')
})

test('switches section background effects independently', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 820 })
  await page.goto('/')

  const effects = page.getByLabel('effects controls')
  const signalToy = page.locator('.landing-section--signal .section-toy')
  const projectsToy = page.locator('.landing-section--products .section-toy')
  const identityToy = page.locator('.landing-section--identity .section-toy')
  await expect(signalToy).toHaveClass(/section-toy--effect-bars/)
  await expect.poll(() => signalToy.evaluate((element) => Number(getComputedStyle(element).opacity))).toBeGreaterThanOrEqual(0.7)
  await expect.poll(() => projectsToy.evaluate((element) => Number(getComputedStyle(element).opacity))).toBeGreaterThanOrEqual(0.7)
  await expect
    .poll(() => page.locator('.landing-section--signal .section-toy span').first().evaluate(readToyVisuals))
    .toMatchObject({
      backgroundColor: 'rgba(244, 244, 240, 0.4)',
    })
  await expect
    .poll(() => page.locator('.landing-section--signal .section-toy span').nth(1).evaluate(readToyVisuals))
    .toMatchObject({
      backgroundColor: 'rgba(216, 255, 53, 0.58)',
    })
  await expect(identityToy).toHaveClass(/section-toy--effect-tumble/)

  await effects.getByLabel('Signal background').selectOption('tumble')
  await expect(signalToy).toHaveClass(/section-toy--effect-tumble/)
  await expect.poll(() => page.locator('.landing-section--signal .section-toy span').first().evaluate(getToyRectArea)).toBeGreaterThan(30000)

  await effects.getByLabel('Identity background').selectOption('slab')
  await expect(identityToy).toHaveClass(/section-toy--effect-slab/)
  await expect
    .poll(() => page.locator('.landing-section--identity .section-toy span').first().evaluate((element) => element.getBoundingClientRect().width))
    .toBeGreaterThan(250)
})

function getTranslateX(element: Element) {
  const transform = getComputedStyle(element).transform
  if (transform === 'none') return 0
  const matrix = new DOMMatrixReadOnly(transform)
  return matrix.m41
}

function getBoxTransforms(elements: Element[]) {
  return elements.map((element) => {
    const matrix = new DOMMatrixReadOnly(getComputedStyle(element).transform)
    return {
      rotation: Math.atan2(matrix.b, matrix.a) * (180 / Math.PI),
      translateX: matrix.m41,
    }
  })
}

async function scrollSectionToProgress(
  page: Page,
  sectionMetrics: { height: number; top: number; viewportHeight: number },
  progress: number,
) {
  const targetScroll = sectionMetrics.top - (sectionMetrics.viewportHeight - progress * (sectionMetrics.viewportHeight + sectionMetrics.height))
  await page.evaluate((scrollY) => window.scrollTo(0, scrollY), targetScroll)
  await page.waitForTimeout(120)
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

function getToyRectArea(element: Element) {
  const rect = element.getBoundingClientRect()
  return rect.width * rect.height
}

function readControlColors(element: Element) {
  const style = getComputedStyle(element)
  return {
    backgroundColor: style.backgroundColor,
    borderColor: style.borderTopColor,
    color: style.color,
  }
}

function readToyVisuals(element: Element) {
  const style = getComputedStyle(element)
  return {
    backgroundColor: style.backgroundColor,
    boxShadow: style.boxShadow,
  }
}
