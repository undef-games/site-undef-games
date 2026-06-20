import { expect, test } from '@playwright/test'

test('renders the Hugo scanlines landing page', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: /^undef games$/i })).toBeVisible()
  await expect(page.getByRole('banner')).toBeVisible()
  await expect(page.getByRole('navigation', { name: /primary/i }).getByRole('link', { name: /games/i })).toHaveAttribute(
    'href',
    '/games/',
  )
  await expect(page.getByRole('navigation', { name: /primary/i }).getByRole('link', { name: /blog/i })).toHaveAttribute(
    'href',
    '/blog/',
  )
  await expect(page.getByRole('navigation', { name: /primary/i }).getByRole('link', { name: /about/i })).toHaveAttribute(
    'href',
    '/about/',
  )
  await expect(page.getByRole('link', { name: /log in/i })).toHaveAttribute('href', 'https://account.undef.games/')
  await expect(page.getByRole('link', { name: /open lab/i }).last()).toHaveAttribute('href', '/lab/')
  await expect(page.locator('.station-shell')).toHaveAttribute('data-surface', 'site')
  await expect(page.getByLabel('interactive station signal')).toHaveAttribute('data-renderer', 'pixijs')
  await expect(page.getByLabel('interactive station signal')).toHaveAttribute('data-signal', '50')
  await expect(page.getByLabel('interactive station signal').locator('canvas')).toHaveCount(1)
  await expect(page.getByRole('link', { name: /open lab/i }).first()).toHaveAttribute('href', '/lab/')
  await expect(page.getByLabel('station tools and identity')).toHaveCount(0)
  await expect(page.getByLabel('effects controls')).toHaveCount(0)
  await expect(
    page.getByText(/indie developer building game tools and systems for fun shared experiences/i),
  ).toBeVisible()
  await expect(
    page.getByRole('heading', { name: /projects built to be used, watched, and played with/i }),
  ).toBeVisible()
  await expect(
    page.getByText(
      /undef games builds the technical side of play so people can gather, operate, and have fun/i,
    ),
  ).toBeVisible()
  const projects = page.getByLabel('undef games projects')
  await expect(projects.getByRole('link', { name: /TradeWars: WARP Agent Runtime Platform/i })).toHaveAttribute(
    'href',
    /https:\/\/warp\.undef\.games\/?/,
  )
  await expect(projects.getByRole('link', { name: /Undef Dice/i })).toHaveAttribute('href', /https:\/\/undefdice\.com\/?/)
  await expect(projects.getByRole('link', { name: /^taybols Taybols/i })).toHaveAttribute(
    'href',
    /https:\/\/taybols\.undef\.games\/?/,
  )
})

test('serves separate Hugo pages with the scanlines header', async ({ page }) => {
  for (const route of [
    { heading: /^Games$/i, path: '/games/' },
    { heading: /^Blog$/i, path: '/blog/' },
    { heading: /^About$/i, path: '/about/' },
  ]) {
    await page.goto(route.path)

    await expect(page.getByRole('banner')).toBeVisible()
    await expect(page.getByRole('heading', { name: route.heading })).toBeVisible()
    await expect(page.getByRole('link', { name: /log in/i })).toHaveAttribute('href', 'https://account.undef.games/')
    await expect(page.getByRole('link', { name: /open lab/i })).toHaveAttribute('href', '/lab/')
    await expect(page.getByRole('contentinfo')).toContainText(/undef\.games/i)
    await expect(page.getByLabel('effects controls')).toHaveCount(0)
  }
})

test('keeps the home mark alive with a subtle theme chase', async ({ page }) => {
  await page.goto('/games/')

  const mark = page.locator('.site-header__mark')
  await expect(mark).toBeVisible()
  await expect
    .poll(() =>
      mark.evaluate((element) => {
        const style = getComputedStyle(element, '::before')
        return {
          animationDuration: style.animationDuration,
          animationName: style.animationName,
          backgroundImage: style.backgroundImage,
        }
      }),
    )
    .toMatchObject({
      animationDuration: '8s',
      animationName: 'ug-mark-chase',
      backgroundImage: expect.stringContaining('conic-gradient'),
    })
  await expect
    .poll(() => mark.evaluate((element) => getComputedStyle(element).boxShadow))
    .not.toBe('none')
})

test('hydrates saved scanlines theme across Hugo pages', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      'undef-logos-theme',
      JSON.stringify({
        activeTone: 'light',
        scanlineLayers: { crt: false, glitch: false, graph: false },
        sectionEffects: {
          dice: 'bars',
          identity: 'tumble',
          projects: 'tumble',
          signal: 'bars',
          taybols: 'bars',
          warp: 'tumble',
        },
        tones: {
          dark: { presetId: 'current', settings: {} },
          light: {
            presetId: 'custom',
            settings: {
              paletteBg: '#f4f0df',
              paletteGlow: '#b0d000',
              paletteMuted: '#11130d',
              palettePanel: '#ddd7c1',
              paletteSignal: '#405500',
              paletteSupport1: '#b0d000',
              paletteSupport2: '#213019',
              paletteSupport3: '#f8fbef',
              paletteText: '#11130d',
              paletteTextOnDark: '#f4f4f0',
              paletteTextOnLight: '#11130d',
            },
          },
        },
        version: 1,
      }),
    )
  })

  await page.goto('/games/')

  await expect(page.locator('html')).toHaveAttribute('data-scan-tone', 'light')
  await expect
    .poll(() => page.locator('.site-header__mark').evaluate((element) => getComputedStyle(element).color))
    .toBe('rgb(64, 85, 0)')
  await expect
    .poll(() => page.locator('.scan-footer p').evaluate((element) => getComputedStyle(element).color))
    .toBe('rgb(17, 19, 13)')

  const themeToggle = page.locator('[data-theme-toggle]')
  const labLink = page.getByRole('link', { name: /open lab/i }).last()
  await expect(themeToggle).toBeVisible()
  await expect(themeToggle).toHaveAttribute('aria-label', 'Switch to dark mode')
  const toggleBox = await themeToggle.boundingBox()
  const labBox = await labLink.boundingBox()
  expect(toggleBox).not.toBeNull()
  expect(labBox).not.toBeNull()
  expect(labBox!.x - (toggleBox!.x + toggleBox!.width)).toBeGreaterThanOrEqual(0)
  expect(labBox!.x - (toggleBox!.x + toggleBox!.width)).toBeLessThanOrEqual(6)

  await themeToggle.click()

  await expect(page.locator('html')).toHaveAttribute('data-scan-tone', 'dark')
  await expect(themeToggle).toHaveAttribute('aria-label', 'Switch to light mode')
  await expect
    .poll(() => page.evaluate(() => JSON.parse(window.localStorage.getItem('undef-logos-theme') ?? '{}').activeTone))
    .toBe('dark')
})

test('keeps the site header responsive without pinning controls to wide viewport edges', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 900 })
  await page.goto('/')

  const brandBox = await page.locator('.site-header__brand').boundingBox()
  const loginBox = await page.getByRole('link', { name: /log in/i }).boundingBox()
  const navBox = await page.getByRole('navigation', { name: /primary/i }).boundingBox()
  const heroTextInset = await page.locator('.station-hero').evaluate((element) => {
    const rect = element.getBoundingClientRect()
    const style = getComputedStyle(element)
    return rect.x + Number.parseFloat(style.paddingLeft)
  })
  expect(brandBox).not.toBeNull()
  expect(loginBox).not.toBeNull()
  expect(navBox).not.toBeNull()
  expect(Math.abs(brandBox!.x - heroTextInset)).toBeLessThanOrEqual(8)
  expect(navBox!.x - brandBox!.x).toBeGreaterThan(150)
  expect(loginBox!.x - navBox!.x).toBeGreaterThan(360)
  expect(loginBox!.x + loginBox!.width).toBeLessThan(heroTextInset + 1180)

  await page.setViewportSize({ width: 390, height: 844 })
  await page.reload()

  await expect(page.getByRole('banner')).toBeVisible()
  await expect(page.getByRole('navigation', { name: /primary/i })).toBeVisible()
  await expect(page.getByRole('link', { name: /log in/i })).toBeVisible()
  const headerBox = await page.getByRole('banner').boundingBox()
  const heroHeadingBox = await page.getByRole('heading', { name: /^undef games$/i }).boundingBox()
  const mobileHeroLayout = await page.locator('.station-shell--site .station-hero').evaluate((element) => {
    const style = getComputedStyle(element)
    return {
      alignContent: style.alignContent,
      paddingTop: Number.parseFloat(style.paddingTop),
    }
  })
  const mobileCanvasTouchAction = await page
    .locator('.station-shell--site .station-signal-scene canvas')
    .evaluate((element) => getComputedStyle(element).touchAction)
  expect(headerBox).not.toBeNull()
  expect(heroHeadingBox).not.toBeNull()
  expect(mobileHeroLayout.alignContent).toBe('start')
  expect(mobileHeroLayout.paddingTop).toBeGreaterThanOrEqual(110)
  expect(heroHeadingBox!.y).toBeGreaterThanOrEqual(headerBox!.y + headerBox!.height + 12)
  expect(mobileCanvasTouchAction).not.toBe('none')
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
  expect(overflow).toBe(false)
})

test('serves the interactive lab below /lab/', async ({ page }) => {
  await page.goto('/lab/')

  await expect(page.getByRole('heading', { name: /undef games/i })).toBeVisible()
  await expect(page.getByLabel('interactive station signal')).toHaveAttribute('data-renderer', 'pixijs')
  await expect(page.getByLabel('effects controls')).toBeVisible()
  const backLink = page.getByRole('link', { name: /back/i })
  await expect(backLink).toHaveAttribute('href', '/')
  await expect(backLink).toHaveText('< Back')
  await expect
    .poll(() =>
      backLink.evaluate((element) => {
        const style = getComputedStyle(element, '::before')
        return {
          animationName: style.animationName,
          backgroundImage: style.backgroundImage,
        }
      }),
    )
    .toMatchObject({
      animationName: 'back-link-chase',
      backgroundImage: expect.stringContaining('conic-gradient'),
    })
  await expect
    .poll(() => backLink.evaluate((element) => getComputedStyle(element).boxShadow))
    .not.toBe('none')
})

test('plays the prominent back control entrance once on first lab load', async ({ page }) => {
  await page.goto('/lab/')
  await page.evaluate(() => window.localStorage.removeItem('undef-prominent-back-seen'))
  await page.reload()

  const veil = page.locator('.prominent-control-veil')
  const backLink = page.getByRole('link', { name: /back/i })
  const broadcast = page.getByLabel('static station identity')
  await expect(veil).toBeVisible()
  await expect(backLink).toHaveAttribute('data-prominent-effect', 'geometric-genie')
  await expect(backLink).toHaveClass(/home-quick-link--intro/)

  const introBox = await backLink.boundingBox()
  const broadcastBox = await broadcast.boundingBox()
  expect(introBox).not.toBeNull()
  expect(broadcastBox).not.toBeNull()
  expect(introBox!.width).toBeGreaterThan(360)
  expect(introBox!.height).toBeGreaterThan(120)
  expect(Math.abs(introBox!.x + introBox!.width / 2 - (broadcastBox!.x + broadcastBox!.width / 2))).toBeLessThan(90)

  await expect
    .poll(() =>
      backLink.evaluate((element) => {
        const style = getComputedStyle(element)
        const borderStyle = getComputedStyle(element, '::before')
        return {
          animationName: style.animationName,
          animationDuration: style.animationDuration,
          backdropFilter: style.backdropFilter,
          clipPath: style.clipPath,
          borderBackground: borderStyle.backgroundImage,
        }
      }),
    )
    .toMatchObject({
      animationName: expect.stringContaining('back-geometric-genie'),
      animationDuration: '0.48s',
      backdropFilter: expect.stringContaining('blur'),
      clipPath: expect.stringContaining('polygon'),
      borderBackground: expect.stringContaining('conic-gradient'),
    })

  await expect(veil).toHaveCount(0, { timeout: 4000 })
  await expect(backLink).not.toHaveClass(/home-quick-link--intro/)
  await expect
    .poll(() => page.evaluate(() => window.localStorage.getItem('undef-prominent-back-seen')))
    .toBe('true')

  await page.reload()

  await expect(page.locator('.prominent-control-veil')).toHaveCount(0)
  await expect(page.getByRole('link', { name: /back/i })).not.toHaveClass(/home-quick-link--intro/)
})

test('returns from the lab to the previous undef games page when available', async ({ page }) => {
  await page.goto('/games/')
  await page.getByRole('link', { name: /open lab/i }).last().click()

  await expect(page).toHaveURL(/\/lab\/$/)
  const backLink = page.getByRole('link', { name: /back/i })
  await expect(backLink).toHaveAttribute('href', '/games/')

  await backLink.click()

  await expect(page).toHaveURL(/\/games\/$/)
})
