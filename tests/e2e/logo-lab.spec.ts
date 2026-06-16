import { expect, test, type Page } from '@playwright/test'

test('tunes the static station identity to signal lock', async ({ page }) => {
  await page.goto('/lab/')

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
  await page.goto('/lab/')

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

test('pulses lab rail buttons on press and release in dark and light themes', async ({ page }) => {
  await page.goto('/lab/')

  const tuneButton = page.getByRole('button', { name: /tune signal/i })
  await expect(tuneButton).toBeVisible()
  await tuneButton.dispatchEvent('pointerdown', { pointerType: 'mouse' })
  await expect(tuneButton).toHaveAttribute('data-press-state', 'down')
  await expect.poll(() => tuneButton.evaluate((element) => getComputedStyle(element).filter)).not.toBe('none')

  await page.locator('body').dispatchEvent('pointerup', { pointerType: 'mouse' })
  await expect(tuneButton).toHaveAttribute('data-press-state', 'release')
  await expect(tuneButton).not.toHaveAttribute('data-press-state', 'release')

  await page.getByRole('button', { name: /light mode/i }).click()
  await expect(page.locator('.station-shell')).toHaveAttribute('data-tone', 'light')

  await tuneButton.dispatchEvent('pointerdown', { pointerType: 'mouse' })
  await expect(tuneButton).toHaveAttribute('data-press-state', 'down')

  await page.locator('body').dispatchEvent('pointerup', { pointerType: 'mouse' })
  await expect(tuneButton).toHaveAttribute('data-press-state', 'release')
})

test('splits lab rail sections into distinct panels with separate accents', async ({ page }) => {
  await page.goto('/lab/')

  const controls = page.locator('.station-controls')
  const channels = page.locator('.channel-selector')
  const scope = page.locator('.signal-scope')
  const effects = page.locator('.effects-controls')
  const identity = page.locator('.station-identity')

  const panelStyles = await Promise.all(
    [controls, channels, scope, effects, identity].map((locator) =>
      locator.evaluate((element) => {
        const style = getComputedStyle(element)
        return {
          backgroundImage: style.backgroundImage,
          borderTopColor: style.borderTopColor,
          borderRadius: style.borderRadius,
        }
      }),
    ),
  )

  const distinctBorders = new Set(panelStyles.map((style) => style.borderTopColor))
  expect(distinctBorders.size).toBeGreaterThanOrEqual(3)
  panelStyles.forEach((style) => {
    expect(style.backgroundImage).not.toBe('none')
    expect(style.borderRadius).not.toBe('0px')
  })

  await expect
    .poll(() => page.locator('.effects-controls .control-label').first().evaluate((element) => getComputedStyle(element).fontSize))
    .toBe('11px')
})

test('keeps the Pixi canvas fitted after viewport resize', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 820 })
  await page.goto('/lab/')

  const signalScene = page.getByLabel('interactive station signal')
  await expect(signalScene.locator('canvas')).toHaveCount(1)
  await expect.poll(() => signalScene.locator('canvas').evaluate(hasPaintedWebGlPixels)).toBe(true)

  await page.setViewportSize({ width: 920, height: 760 })
  await expect.poll(() => signalScene.evaluate(getCanvasFitDelta)).toBeLessThanOrEqual(2)
})

test('updates the landing scan field while scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 820 })
  await page.goto('/lab/')

  const signalScene = page.getByLabel('interactive station signal')
  const forwardToyLine = page.locator('.landing-section--signal .section-toy span').first()
  const reverseToyLine = page.locator('.landing-section--signal .section-toy span').nth(1)
  await expect(signalScene).toHaveAttribute('data-scroll-depth', '0')
  await expect(page.getByLabel('signal behavior')).toBeVisible()
  await expect(forwardToyLine).toBeVisible()
  const initialForwardTravel = await forwardToyLine.evaluate(getTranslateX)
  const initialReverseTravel = await reverseToyLine.evaluate(getTranslateX)

  await page.mouse.move(420, 320)
  await page.mouse.wheel(0, 720)

  await expect.poll(async () => Number(await signalScene.getAttribute('data-scroll-depth'))).toBeGreaterThan(0)
  await expect.poll(() => forwardToyLine.evaluate(getTranslateX)).toBeGreaterThan(initialForwardTravel + 100)
  await expect.poll(() => reverseToyLine.evaluate(getTranslateX)).toBeLessThan(initialReverseTravel - 100)
  await expect(page.getByRole('heading', { name: /responsive by design, not by decoration/i })).toBeVisible()
})

test('advertises concrete undef games projects', async ({ page }) => {
  await page.goto('/lab/')

  const projects = page.getByLabel('undef games projects')
  await expect(projects).toBeVisible()
  await expect(projects.getByRole('heading', { name: /projects built to be used, watched, and played with/i })).toBeVisible()
  await expect(projects.getByRole('link', { name: /TradeWars: WARP Agent Runtime Platform/i })).toHaveAttribute(
    'href',
    /https:\/\/warp\.undef\.games\/?/,
  )
  await expect(projects.getByRole('link', { name: /Undef Dice/i })).toHaveAttribute('href', /https:\/\/undefdice\.com\/?/)
  await expect(projects.getByRole('link', { name: /Taybols/i })).toHaveAttribute('href', /https:\/\/taybols\.undef\.games\/?/)
  await expect(page.getByRole('heading', { name: /good systems should make shared play easier to reach/i })).toBeVisible()
  await expect(
    page.getByText(/undef games builds the technical side of play so people can gather, operate, and have fun/i),
  ).toBeVisible()
  await expect(page.getByRole('link', { name: /back to top/i })).toBeVisible()
})

test('moves identity boxes from right to left through section scroll and reverses', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 820 })
  await page.goto('/lab/')

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
  await page.goto('/lab/')

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
  await page.goto('/lab/')

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
  await page.goto('/lab/')

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
  await page.goto('/lab/')

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
  await page.goto('/lab/')

  const rail = page.getByLabel('station tools and identity')
  const effects = page.getByLabel('effects controls')
  const darkPresetSelect = effects.getByLabel('Dark theme preset')
  const lightPresetSelect = effects.getByLabel('Light theme preset')
  const signalBackground = effects.getByLabel('Signal background')
  await expect(rail).toBeVisible()
  await expect(effects).toBeVisible()
  await expect(darkPresetSelect).toHaveValue('current')
  await expect(lightPresetSelect).toHaveValue('paper-terminal')
  await expect.poll(() => darkPresetSelect.locator('option').count()).toBeGreaterThanOrEqual(20)
  await expect.poll(() => lightPresetSelect.locator('option').count()).toBeGreaterThanOrEqual(12)
  const darkPresetLabels = await darkPresetSelect.locator('option').evaluateAll((options) =>
    options.map((option) => option.textContent?.trim() ?? ''),
  )
  const lightPresetLabels = await lightPresetSelect.locator('option').evaluateAll((options) =>
    options.map((option) => option.textContent?.trim() ?? ''),
  )
  expect(darkPresetLabels).toEqual([...darkPresetLabels].sort((left, right) => left.localeCompare(right)))
  expect(lightPresetLabels).toEqual([...lightPresetLabels].sort((left, right) => left.localeCompare(right)))
  expect(lightPresetLabels).toEqual(
    expect.arrayContaining([
      'Airport display',
      'Archive card',
      'Blueprint paper',
      'Copy machine',
      'Faded arcade',
      'Lab label',
      'Microfiche',
      'Polar logbook',
      'Receipt green',
      'Safety glass',
      'Washed CRT',
    ]),
  )

  await expect(effects.getByLabel('Scan opacity', { exact: true })).toHaveValue('1')
  await expect.poll(() => page.locator('.station-shell').evaluate((element) => getComputedStyle(element).getPropertyValue('--fx-scan-opacity').trim())).toBe('0.055')
  await expect(effects.getByLabel('Scan scroll impact', { exact: true })).toHaveValue('0.35')
  await expect(effects.getByLabel('Scroll inertia', { exact: true })).toHaveValue('0.16')
  await expect(effects.getByLabel('Rectangle wobble', { exact: true })).toHaveValue('0.45')
  await expect(signalBackground.locator('option')).toContainText([
    'Skinny bars',
    'Tumble rectangles',
    'Classic CRT',
    'Bouncing notes',
    'Pixel scatter',
    'Offset frames',
    'Signal rails',
    'Stacked rungs',
    'Signal slabs',
  ])
  await expect(effects.getByLabel('Graph paper layer')).not.toBeChecked()
  await expect(effects.getByLabel('CRT monitor layer')).not.toBeChecked()
  await expect(effects.getByLabel('Glitch scanline layer')).not.toBeChecked()
  await expect
    .poll(() => page.locator('.station-shell').evaluate((element) => getComputedStyle(element).getPropertyValue('--fx-scan-scroll-impact').trim()))
    .toBe('0.35')

  await lightPresetSelect.selectOption('paper-terminal')
  await effects.getByRole('button', { name: /light mode/i }).click()
  await expect(page.locator('.station-shell')).toHaveAttribute('data-tone', 'light')
  await expect.poll(() => page.locator('.station-shell').evaluate((element) => getComputedStyle(element).getPropertyValue('--fx-text-on-light').trim())).toBe('#11130d')
  await expect.poll(() => page.locator('.station-shell').evaluate((element) => getComputedStyle(element).getPropertyValue('--fx-text-on-dark').trim())).toBe('#f4f4f0')
  await expect
    .poll(() =>
      page
        .getByRole('heading', { name: /projects built to be used, watched, and played with/i })
        .evaluate((element) => getComputedStyle(element).color),
    )
    .toBe('rgb(17, 19, 13)')
  await expect
    .poll(() => page.getByRole('button', { name: /tune signal/i }).evaluate((element) => getComputedStyle(element).color))
    .toBe('rgb(244, 244, 240)')
  const graphLayerIndicator = effects.getByText('Graph paper layer').locator('..').locator('.scanline-check')
  await expect.poll(() => graphLayerIndicator.evaluate(readScanlineCheckVisual).then((visual) => visual.afterOpacity)).toBe('0')
  await expect.poll(() => graphLayerIndicator.evaluate(readScanlineCheckVisual).then((visual) => visual.backgroundLuminance)).toBeGreaterThan(0.68)

  await darkPresetSelect.selectOption('cyan-ice')
  await effects.getByRole('button', { name: /dark mode/i }).click()
  await expect.poll(() => page.locator('.station-shell').evaluate((element) => getComputedStyle(element).getPropertyValue('--fx-signal').trim())).toBe('#39e8ff')
  await expect.poll(() => page.locator('.station-shell').evaluate((element) => getComputedStyle(element).getPropertyValue('--fx-support-1').trim())).toBe('#9df7ff')
  await expect.poll(() => page.locator('.station-shell').evaluate((element) => getComputedStyle(element).getPropertyValue('--fx-support-2').trim())).toBe('#8fb9ff')
  await expect.poll(() => page.locator('.station-shell').evaluate((element) => getComputedStyle(element).getPropertyValue('--fx-support-3').trim())).toBe('#d8ff35')
  await expect.poll(() => page.locator('.station-shell').evaluate((element) => getComputedStyle(element).getPropertyValue('--fx-scan-spacing').trim())).toBe('15.6px')

  await effects.getByLabel('Scan opacity', { exact: true }).fill('1.4')
  await expect.poll(() => page.locator('.station-shell').evaluate((element) => getComputedStyle(element).getPropertyValue('--fx-scan-opacity').trim())).toBe('0.077')

  await effects.getByLabel('Scan scroll impact', { exact: true }).fill('0.15')
  await expect
    .poll(() => page.locator('.station-shell').evaluate((element) => getComputedStyle(element).getPropertyValue('--fx-scan-scroll-impact').trim()))
    .toBe('0.15')

  await effects.getByLabel('Scroll inertia', { exact: true }).fill('0.08')
  await expect.poll(() => page.locator('.station-shell').evaluate((element) => getComputedStyle(element).getPropertyValue('--fx-scroll-inertia').trim())).toBe('0.08')

  await effects.getByLabel('Rectangle wobble', { exact: true }).fill('1.25')
  await expect.poll(() => page.locator('.station-shell').evaluate((element) => getComputedStyle(element).getPropertyValue('--fx-rectangle-wobble').trim())).toBe('1.25')

  await effects.getByLabel('Graph paper layer').check()
  await expect(page.locator('.station-shell')).toHaveAttribute('data-scan-graph', 'true')
  await expect.poll(() => page.locator('.station-overlay-layer--graph').evaluate((element) => getComputedStyle(element).opacity)).toBe('0.52')
  await expect.poll(() => graphLayerIndicator.evaluate(readScanlineCheckVisual)).toMatchObject({
    afterOpacity: '1',
    backgroundColor: 'rgb(57, 232, 255)',
  })
  await effects.getByLabel('CRT monitor layer').check()
  await expect(page.locator('.station-shell')).toHaveAttribute('data-scan-crt', 'true')
  await expect
    .poll(() => page.locator('.station-overlay-layer--crt').evaluate((element) => getComputedStyle(element).backgroundImage))
    .toContain('radial-gradient')
  await effects.getByLabel('Glitch scanline layer').check()
  await expect(page.locator('.station-shell')).toHaveAttribute('data-scan-glitch', 'true')

  await effects.getByLabel('Rectangle spin', { exact: true }).fill('1.35')
  await expect.poll(() => page.locator('.station-shell').evaluate((element) => getComputedStyle(element).getPropertyValue('--fx-rectangle-spin').trim())).toBe('1.35')
})

test('persists separate lab themes and hydrates the production surface', async ({ page }) => {
  await page.goto('/lab/')
  await page.evaluate(() => window.localStorage.clear())
  await page.reload()

  const effects = page.getByLabel('effects controls')
  await effects.getByLabel('Dark theme preset').selectOption('cyan-ice')
  await effects.getByLabel('Light theme preset').selectOption('paper-terminal')
  await effects.getByRole('button', { name: /light mode/i }).click()

  await expect(page.locator('.station-shell')).toHaveAttribute('data-tone', 'light')
  await expect
    .poll(() => page.evaluate(() => JSON.parse(window.localStorage.getItem('undef-logos-theme') ?? '{}')))
    .toMatchObject({
      activeTone: 'light',
      tones: {
        dark: { presetId: 'cyan-ice' },
        light: { presetId: 'paper-terminal' },
      },
      version: 1,
    })

  await page.goto('/')
  await expect(page.locator('.station-shell')).toHaveAttribute('data-surface', 'site')
  await expect(page.locator('.station-shell')).toHaveAttribute('data-tone', 'light')
  await expect
    .poll(() => page.locator('.hero-ghost-glyph').evaluate((element) => getComputedStyle(element).mixBlendMode))
    .toBe('multiply')
  await expect
    .poll(() =>
      page.locator('.hero-ghost-glyph').evaluate((element) => Number.parseFloat(getComputedStyle(element).opacity)),
    )
    .toBeGreaterThanOrEqual(0.16)
  await expect(page.getByLabel('effects controls')).toHaveCount(0)

  await page.goto('/lab/')
  await expect(page.getByLabel('Dark theme preset')).toHaveValue('cyan-ice')
  await expect(page.getByLabel('Light theme preset')).toHaveValue('paper-terminal')
  await expect(page.locator('.station-shell')).toHaveAttribute('data-tone', 'light')

  await page.getByRole('button', { name: /reset theme/i }).click()
  await expect.poll(() => page.evaluate(() => window.localStorage.getItem('undef-logos-theme'))).toBeNull()
  await page.goto('/')
  await expect(page.locator('.station-shell')).toHaveAttribute('data-tone', 'dark')
})

test('switches scanline base patterns and caps the engine at thirteen layers', async ({ page }) => {
  await page.goto('/lab/')

  const engine = page.getByLabel('scanline engine')
  const basePattern = engine.getByLabel('Base pattern')
  const addLayerButton = engine.getByRole('button', { name: /add scanline layer/i })
  const patternCycle = [
    { label: 'Straight', value: 'straight' },
    { label: 'Sine', value: 'sine' },
    { label: 'Audit', value: 'audit' },
    { label: 'Broken', value: 'broken' },
  ] as const

  for (const [index, pattern] of patternCycle.entries()) {
    await basePattern.selectOption(pattern.value)
    await expect(basePattern).toHaveValue(pattern.value)
    await expect(page.getByLabel('interactive station signal')).toHaveAttribute('data-scanline-base-pattern', pattern.value)

    await addLayerButton.click()
    const layer = engine.getByRole('listitem', { name: new RegExp(`Layer ${index + 1}`, 'i') })
    await expect(layer).toBeVisible()
    await expect(layer.getByLabel('Pattern')).toHaveValue(pattern.value)
  }

  for (let index = patternCycle.length; index < 13; index += 1) {
    await addLayerButton.click()
  }

  await expect(engine.getByRole('listitem')).toHaveCount(13)
  await expect(engine.getByText('13 / 13 layers')).toBeVisible()
  await expect(engine.getByRole('listitem', { name: /Layer 13/i }).getByLabel('Pattern')).toHaveValue('broken')
  await expect(addLayerButton).toBeDisabled()
  await expect(page.getByLabel('interactive station signal')).toHaveAttribute('data-scanline-layer-count', '13')
})

test('persists scanline engine choices across reload and resets back to baseline', async ({ page }) => {
  await page.goto('/lab/')
  await page.evaluate(() => window.localStorage.clear())
  await page.reload()

  const engine = page.getByLabel('scanline engine')
  const basePattern = engine.getByLabel('Base pattern')
  const addLayerButton = engine.getByRole('button', { name: /add scanline layer/i })

  await basePattern.selectOption('audit')
  await addLayerButton.click()
  await addLayerButton.click()

  const secondLayer = engine.getByRole('listitem', { name: /Layer 2/i })
  await secondLayer.getByLabel('Pattern').selectOption('sine')

  await expect
    .poll(() => readSavedTheme(page))
    .toMatchObject({
      scanlineEngine: {
        basePattern: 'audit',
        layers: [{ kind: 'audit' }, { kind: 'sine' }],
      },
    })

  await page.reload()

  await expect(basePattern).toHaveValue('audit')
  await expect(engine.getByText('2 / 13 layers')).toBeVisible()
  await expect(page.getByLabel('interactive station signal')).toHaveAttribute('data-scanline-base-pattern', 'audit')
  await expect(page.getByLabel('interactive station signal')).toHaveAttribute('data-scanline-layer-count', '2')
  await expect(engine.getByRole('listitem', { name: /Layer 1/i }).getByLabel('Pattern')).toHaveValue('audit')
  await expect(engine.getByRole('listitem', { name: /Layer 2/i }).getByLabel('Pattern')).toHaveValue('sine')

  await page.getByRole('button', { name: /reset theme/i }).click()

  await expect(basePattern).toHaveValue('straight')
  await expect(engine.getByText('0 / 13 layers')).toBeVisible()
  await expect(engine.getByRole('listitem')).toHaveCount(0)
  await expect(page.getByLabel('interactive station signal')).toHaveAttribute('data-scanline-base-pattern', 'straight')
  await expect(page.getByLabel('interactive station signal')).toHaveAttribute('data-scanline-layer-count', '0')
  await expect.poll(() => page.evaluate(() => window.localStorage.getItem('undef-logos-theme'))).toBeNull()

  await page.reload()

  await expect(basePattern).toHaveValue('straight')
  await expect(engine.getByText('0 / 13 layers')).toBeVisible()
  await expect(engine.getByRole('listitem')).toHaveCount(0)
})

test('switches section background effects independently', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 820 })
  await page.goto('/lab/')

  const effects = page.getByLabel('effects controls')
  const signalToy = page.locator('.landing-section--signal .section-toy')
  const projectsToy = page.locator('.landing-section--products .section-toy')
  const warpToy = page.locator('.landing-section--warp .section-toy')
  const identityToy = page.locator('.landing-section--identity .section-toy')
  await expect(signalToy).toHaveClass(/section-toy--effect-bars/)
  await expect(projectsToy).toHaveClass(/section-toy--effect-tumble/)
  await expect(warpToy).toHaveClass(/section-toy--effect-tumble/)
  await expect.poll(() => signalToy.evaluate((element) => Number(getComputedStyle(element).opacity))).toBeGreaterThanOrEqual(0.7)
  await expect.poll(() => projectsToy.evaluate((element) => Number(getComputedStyle(element).opacity))).toBeGreaterThanOrEqual(0.38)
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

  await effects.getByLabel('Signal background').selectOption('scatter')
  await expect(signalToy).toHaveClass(/section-toy--effect-scatter/)
  await expect.poll(() => page.locator('.landing-section--signal .section-toy span').first().evaluate(getToyRectArea)).toBeLessThan(1600)

  await effects.getByLabel('Signal background').selectOption('crt')
  await expect(signalToy).toHaveClass(/section-toy--effect-crt/)
  await expect
    .poll(() => page.locator('.landing-section--signal .section-toy span').first().evaluate(readToyVisuals))
    .toMatchObject({
      backgroundColor: 'rgba(244, 244, 240, 0.3)',
    })

  await effects.getByLabel('Signal background').selectOption('notes')
  await expect(signalToy).toHaveClass(/section-toy--effect-notes/)
  const noteRect = await page.locator('.landing-section--signal .section-toy span').first().evaluate(readToyRect)
  expect(noteRect.height).toBeGreaterThanOrEqual(74)
  expect(noteRect.height).toBeLessThanOrEqual(82)
  expect(noteRect.width).toBeGreaterThanOrEqual(14)
  expect(noteRect.width).toBeLessThanOrEqual(22)

  await effects.getByLabel('Projects background').selectOption('frames')
  await expect(projectsToy).toHaveClass(/section-toy--effect-frames/)
  await expect.poll(() => page.locator('.landing-section--products .section-toy span').first().evaluate(readToyRect)).toMatchObject({
    height: 78,
    width: 120,
  })

  await effects.getByLabel('WARP background').selectOption('rails')
  await expect(warpToy).toHaveClass(/section-toy--effect-rails/)
  await expect.poll(() => page.locator('.landing-section--warp .section-toy span').first().evaluate(readToyRect)).toMatchObject({
    height: 3,
    width: 210,
  })

  await effects.getByLabel('Dice background').selectOption('rungs')
  await expect(page.locator('.landing-section--dice .section-toy')).toHaveClass(/section-toy--effect-rungs/)
  await expect.poll(() => page.locator('.landing-section--dice .section-toy span').first().evaluate(readToyRect)).toMatchObject({
    height: 62,
    width: 9,
  })

  await effects.getByLabel('Identity background').selectOption('slab')
  await expect(identityToy).toHaveClass(/section-toy--effect-slab/)
  await expect
    .poll(() => page.locator('.landing-section--identity .section-toy span').first().evaluate((element) => element.getBoundingClientRect().width))
    .toBeGreaterThan(250)
})

test('keeps scanline layer checks readable on high-key light presets', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 820 })
  await page.goto('/lab/')

  const effects = page.getByLabel('effects controls')
  const presetSelect = effects.getByLabel('Light theme preset')
  const crtLayer = effects.getByText('CRT monitor layer').locator('..')
  const crtLayerIndicator = crtLayer.locator('.scanline-check')

  for (const presetId of ['whiteout', 'copy-machine']) {
    await presetSelect.selectOption(presetId)
    await effects.getByRole('button', { name: /light mode/i }).click()
    await expect(page.locator('.station-shell')).toHaveAttribute('data-tone', 'light')

    const uncheckedRow = await crtLayer.evaluate(readControlContrast)
    const uncheckedBox = await crtLayerIndicator.evaluate(readScanlineCheckVisual)
    expect(uncheckedRow.backgroundLuminance).toBeGreaterThan(0.62)
    expect(uncheckedRow.textLuminance).toBeLessThan(0.22)
    expect(uncheckedBox.backgroundLuminance).toBeGreaterThan(0.68)
    expect(uncheckedBox.afterOpacity).toBe('0')

    await effects.getByLabel('CRT monitor layer').check()
    const checkedBox = await crtLayerIndicator.evaluate(readScanlineCheckVisual)
    expect(checkedBox.backgroundLuminance).toBeGreaterThan(0.68)
    expect(checkedBox.afterOpacity).toBe('1')
    expect(checkedBox.afterLuminance).toBeLessThan(0.22)
    await effects.getByLabel('CRT monitor layer').uncheck()
  }
})

test('keeps all section effects visibly distinct on whiteout carrier', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 820 })
  await page.goto('/lab/')

  const effects = page.getByLabel('effects controls')
  await effects.getByLabel('Light theme preset').selectOption('whiteout')
  await effects.getByRole('button', { name: /light mode/i }).click()
  const signalToy = page.locator('.landing-section--signal .section-toy')
  const firstSpan = page.locator('.landing-section--signal .section-toy span').first()
  const effectProfiles: string[] = []

  for (const effect of ['bars', 'tumble', 'scatter', 'crt', 'notes', 'frames', 'rails', 'rungs', 'slab']) {
    await effects.getByLabel('Signal background').selectOption(effect)
    await expect(signalToy).toHaveClass(new RegExp(`section-toy--effect-${effect}`))
    const profile = await firstSpan.evaluate(readToyEffectProfile)
    expect(profile.area, `${effect} area`).toBeGreaterThan(20)
    expect(profile.alpha, `${effect} alpha`).toBeGreaterThan(0.1)
    expect(profile.contrast, `${effect} contrast`).toBeGreaterThan(0.16)
    effectProfiles.push(`${effect}:${profile.width}x${profile.height}:${profile.backgroundColor}:${profile.borderColor}`)
  }

  expect(new Set(effectProfiles).size).toBe(effectProfiles.length)
})

test('keeps rectangle toys visible and smoothed under light presets', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 820 })
  await page.goto('/lab/')

  const effects = page.getByLabel('effects controls')
  await effects.getByLabel('Light theme preset').selectOption('whiteout')
  await effects.getByRole('button', { name: /light mode/i }).click()

  const identitySection = page.getByLabel('identity baseline')
  const identityToy = page.locator('.landing-section--identity .section-toy')
  const identityBox = page.locator('.landing-section--identity .section-toy span').first()
  const sectionMetrics = await identitySection.evaluate((element) => {
    const rect = element.getBoundingClientRect()
    return {
      height: rect.height,
      top: rect.top + window.scrollY,
      viewportHeight: window.innerHeight,
    }
  })

  await page.evaluate((scrollY) => window.scrollTo(0, scrollY), sectionMetrics.top - sectionMetrics.viewportHeight * 0.6)
  await expect(identityToy).toHaveClass(/section-toy--effect-tumble/)
  await expect
    .poll(() => identitySection.evaluate((element) => getComputedStyle(element).backgroundImage))
    .not.toBe('none')
  await expect.poll(() => identityToy.evaluate((element) => Number(getComputedStyle(element).opacity))).toBeGreaterThanOrEqual(0.38)
  await expect.poll(() => identityBox.evaluate(getToyRectArea)).toBeGreaterThan(30000)

  const beforeScroll = await identityBox.evaluate(getTranslateX)
  await page.mouse.wheel(0, 600)
  const firstFrame = await identityBox.evaluate(getTranslateX)
  await page.waitForTimeout(220)
  const easedFrame = await identityBox.evaluate(getTranslateX)

  expect(firstFrame).toBeLessThan(beforeScroll)
  expect(Math.abs(easedFrame - firstFrame)).toBeGreaterThan(0.75)
  expect(easedFrame).toBeLessThan(beforeScroll - 12)
})

test('tumbles skinny bars and varies row-rectangle travel directions', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 820 })
  await page.goto('/lab/')

  const signalSection = page.getByLabel('signal behavior')
  const signalMetrics = await signalSection.evaluate(readSectionMetrics)
  const firstSkinnyBar = page.locator('.landing-section--signal .section-toy span').first()
  const secondSkinnyBar = page.locator('.landing-section--signal .section-toy span').nth(1)

  await scrollSectionToProgress(page, signalMetrics, 0.12)
  const earlyFirstBar = await firstSkinnyBar.evaluate(readToyMotion)
  const earlySecondBar = await secondSkinnyBar.evaluate(readToyMotion)

  await scrollSectionToProgress(page, signalMetrics, 0.72)
  await page.waitForTimeout(220)
  const lateFirstBar = await firstSkinnyBar.evaluate(readToyMotion)
  const lateSecondBar = await secondSkinnyBar.evaluate(readToyMotion)

  expect(Math.abs(lateFirstBar.rotation - earlyFirstBar.rotation)).toBeGreaterThan(40)
  expect(Math.abs(lateSecondBar.rotation - earlySecondBar.rotation)).toBeGreaterThan(40)
  expect(lateFirstBar.translateX).toBeGreaterThan(earlyFirstBar.translateX + 40)
  expect(lateSecondBar.translateX).toBeLessThan(earlySecondBar.translateX - 40)

  const diceSection = page.getByLabel('Undef Dice')
  const diceMetrics = await diceSection.evaluate(readSectionMetrics)
  const firstRowRect = page.locator('.landing-section--dice .section-toy span').first()
  const secondRowRect = page.locator('.landing-section--dice .section-toy span').nth(1)

  await scrollSectionToProgress(page, diceMetrics, 0.16)
  const earlyFirstRowRect = await firstRowRect.evaluate(readToyMotion)
  const earlySecondRowRect = await secondRowRect.evaluate(readToyMotion)

  await scrollSectionToProgress(page, diceMetrics, 0.76)
  await page.waitForTimeout(220)
  const lateFirstRowRect = await firstRowRect.evaluate(readToyMotion)
  const lateSecondRowRect = await secondRowRect.evaluate(readToyMotion)

  expect(lateFirstRowRect.translateY).toBeLessThan(earlyFirstRowRect.translateY - 24)
  expect(lateSecondRowRect.translateY).toBeGreaterThan(earlySecondRowRect.translateY + 24)
  expect(Math.abs(lateFirstRowRect.rotation - earlyFirstRowRect.rotation)).toBeGreaterThan(18)
})

function getTranslateX(element: Element) {
  const transform = getComputedStyle(element).transform
  if (transform === 'none') return 0
  const matrix = new DOMMatrixReadOnly(transform)
  return matrix.m41
}

function readToyMotion(element: Element) {
  const transform = getComputedStyle(element).transform
  if (transform === 'none') {
    return {
      rotation: 0,
      translateX: 0,
      translateY: 0,
    }
  }

  const matrix = new DOMMatrixReadOnly(transform)
  return {
    rotation: Math.atan2(matrix.b, matrix.a) * (180 / Math.PI),
    translateX: matrix.m41,
    translateY: matrix.m42,
  }
}

function readSectionMetrics(element: Element) {
  const rect = element.getBoundingClientRect()
  return {
    height: rect.height,
    top: rect.top + window.scrollY,
    viewportHeight: window.innerHeight,
  }
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

async function readSavedTheme(page: Page) {
  return page.evaluate(() => JSON.parse(window.localStorage.getItem('undef-logos-theme') ?? '{}'))
}

function readToyRect(element: Element) {
  const rect = element.getBoundingClientRect()
  return {
    height: Math.round(rect.height),
    width: Math.round(rect.width),
  }
}

function readControlColors(element: Element) {
  const style = getComputedStyle(element)
  return {
    backgroundColor: style.backgroundColor,
    borderColor: style.borderTopColor,
    color: style.color,
  }
}

function readScanlineCheckVisual(element: Element) {
  const parseColor = (color: string) => {
    const srgbMatch = color.match(/color\(srgb\s+([0-9.]+)\s+([0-9.]+)\s+([0-9.]+)(?:\s*\/\s*([0-9.]+))?\)/)
    if (srgbMatch) {
      return {
        a: srgbMatch[4] === undefined ? 1 : Number(srgbMatch[4]),
        b: Number(srgbMatch[3]) * 255,
        g: Number(srgbMatch[2]) * 255,
        r: Number(srgbMatch[1]) * 255,
      }
    }
    const rgbaMatch = color.match(/rgba?\(([^)]+)\)/)
    if (rgbaMatch) {
      const channels = rgbaMatch[1].split(/,\s*/)
      return {
        a: channels[3] === undefined ? 1 : Number(channels[3]),
        b: Number(channels[2]),
        g: Number(channels[1]),
        r: Number(channels[0]),
      }
    }
    return { a: 0, b: 0, g: 0, r: 0 }
  }
  const luminance = (color: { a: number; b: number; g: number; r: number }) => {
    const alpha = Number.isFinite(color.a) ? color.a : 1
    const blended = [color.r, color.g, color.b].map((channel) => {
      const value = (channel * alpha + 255 * (1 - alpha)) / 255
      return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
    })
    return 0.2126 * blended[0] + 0.7152 * blended[1] + 0.0722 * blended[2]
  }
  const style = getComputedStyle(element)
  const afterStyle = getComputedStyle(element, '::after')
  const background = parseColor(style.backgroundColor)
  const afterBorder = parseColor(afterStyle.borderRightColor)
  return {
    afterOpacity: afterStyle.opacity,
    afterLuminance: luminance(afterBorder),
    backgroundColor: style.backgroundColor,
    backgroundLuminance: luminance(background),
    borderColor: style.borderTopColor,
  }
}

function readControlContrast(element: Element) {
  const parseColor = (color: string) => {
    const srgbMatch = color.match(/color\(srgb\s+([0-9.]+)\s+([0-9.]+)\s+([0-9.]+)(?:\s*\/\s*([0-9.]+))?\)/)
    if (srgbMatch) {
      return {
        a: srgbMatch[4] === undefined ? 1 : Number(srgbMatch[4]),
        b: Number(srgbMatch[3]) * 255,
        g: Number(srgbMatch[2]) * 255,
        r: Number(srgbMatch[1]) * 255,
      }
    }
    const rgbaMatch = color.match(/rgba?\(([^)]+)\)/)
    if (rgbaMatch) {
      const channels = rgbaMatch[1].split(/,\s*/)
      return {
        a: channels[3] === undefined ? 1 : Number(channels[3]),
        b: Number(channels[2]),
        g: Number(channels[1]),
        r: Number(channels[0]),
      }
    }
    return { a: 0, b: 0, g: 0, r: 0 }
  }
  const luminance = (color: { a: number; b: number; g: number; r: number }) => {
    const alpha = Number.isFinite(color.a) ? color.a : 1
    const blended = [color.r, color.g, color.b].map((channel) => {
      const value = (channel * alpha + 255 * (1 - alpha)) / 255
      return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
    })
    return 0.2126 * blended[0] + 0.7152 * blended[1] + 0.0722 * blended[2]
  }
  const style = getComputedStyle(element)
  return {
    backgroundColor: style.backgroundColor,
    backgroundLuminance: luminance(parseColor(style.backgroundColor)),
    color: style.color,
    textLuminance: luminance(parseColor(style.color)),
  }
}

function readToyEffectProfile(element: Element) {
  const parseColor = (color: string) => {
    const srgbMatch = color.match(/color\(srgb\s+([0-9.]+)\s+([0-9.]+)\s+([0-9.]+)(?:\s*\/\s*([0-9.]+))?\)/)
    if (srgbMatch) {
      return {
        a: srgbMatch[4] === undefined ? 1 : Number(srgbMatch[4]),
        b: Number(srgbMatch[3]) * 255,
        g: Number(srgbMatch[2]) * 255,
        r: Number(srgbMatch[1]) * 255,
      }
    }
    const rgbaMatch = color.match(/rgba?\(([^)]+)\)/)
    if (rgbaMatch) {
      const channels = rgbaMatch[1].split(/,\s*/)
      return {
        a: channels[3] === undefined ? 1 : Number(channels[3]),
        b: Number(channels[2]),
        g: Number(channels[1]),
        r: Number(channels[0]),
      }
    }
    const hexMatch = color.trim().match(/^#([0-9a-f]{6})$/i)
    if (hexMatch) {
      const value = Number.parseInt(hexMatch[1], 16)
      return {
        a: 1,
        b: value & 255,
        g: (value >> 8) & 255,
        r: (value >> 16) & 255,
      }
    }
    return { a: 0, b: 0, g: 0, r: 0 }
  }
  const luminance = (color: { a: number; b: number; g: number; r: number }) => {
    const alpha = Number.isFinite(color.a) ? color.a : 1
    const blended = [color.r, color.g, color.b].map((channel) => {
      const value = (channel * alpha + 255 * (1 - alpha)) / 255
      return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
    })
    return 0.2126 * blended[0] + 0.7152 * blended[1] + 0.0722 * blended[2]
  }
  const style = getComputedStyle(element)
  const rect = element.getBoundingClientRect()
  const background = parseColor(style.backgroundColor)
  const pageBackground = parseColor(getComputedStyle(document.querySelector('.station-shell')!).getPropertyValue('--fx-bg'))
  return {
    alpha: background.a,
    area: Math.round(rect.width * rect.height),
    backgroundColor: style.backgroundColor,
    borderColor: style.borderTopColor,
    contrast: Math.abs(luminance(background) - luminance(pageBackground)),
    height: Math.round(rect.height),
    width: Math.round(rect.width),
  }
}

function readToyVisuals(element: Element) {
  const style = getComputedStyle(element)
  return {
    backgroundColor: style.backgroundColor,
    boxShadow: style.boxShadow,
  }
}
