import { expect, test } from '@playwright/test'
import { scanlinesSelectorContract } from '@undef/scanlines-system'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

function buildHugoHtml(configToml: string, relativePath = 'index.html') {
  const workspaceRoot = process.cwd()
  const tempRoot = mkdtempSync(join(tmpdir(), 'scanlines-testids-'))
  const configPath = join(tempRoot, 'hugo.test.toml')
  const destination = join(tempRoot, 'public')

  writeFileSync(configPath, configToml)

  try {
    execFileSync(
      'hugo',
      ['--minify', '--config', configPath, '--destination', destination],
      { cwd: workspaceRoot, stdio: 'pipe' },
    )

    return readFileSync(join(destination, relativePath), 'utf8')
  } finally {
    rmSync(tempRoot, { force: true, recursive: true })
  }
}

test('renders the refreshed homepage copy and logs navigation', async ({ page, request }) => {
  await page.goto('/')
  const homeResponse = await request.get('/')
  const homeHtml = await homeResponse.text()

  await expect(page.getByRole('banner')).toBeVisible()
  await expect(page.getByRole('navigation', { name: /primary/i }).getByRole('link', { name: /games/i })).toHaveAttribute(
    'href',
    '/games/',
  )
  await expect(page.getByRole('navigation', { name: /primary/i }).getByRole('link', { name: /^Logs$/i })).toHaveAttribute(
    'href',
    '/logs/',
  )
  await expect(page.getByRole('navigation', { name: /primary/i }).getByRole('link', { name: /about/i })).toHaveAttribute(
    'href',
    '/about/',
  )
  await expect(page.getByRole('heading', { name: /^undef games$/i })).toBeVisible()
  expect(homeHtml).toMatch(/<section class=scan-fallback__hero aria-label="undef games landing page">/i)
  expect(homeHtml).toMatch(/<p class=scan-fallback__kicker>\s*CH 00 \/ SIGNAL FIELD\s*<\/p>/i)
  expect(homeHtml).toMatch(/<h1>\s*undef games\s*<\/h1>/i)
  expect(homeHtml).toMatch(/Indie developer building game tools and systems for fun shared experiences online and off\./i)
  expect(homeHtml).toMatch(/<a href=https:\/\/warp\.undef\.games>\s*Explore WARP\s*<\/a>/i)
  expect(homeHtml).toMatch(/<a href=#projects>\s*View projects\s*<\/a>/i)
  const payloadMatch = homeHtml.match(
    /<script id="?site-copy-data"? type="?application\/json"?>([\s\S]*?)<\/script>/i,
  )
  expect(payloadMatch, 'homepage should embed serialized site copy').not.toBeNull()
  const payload = JSON.parse(payloadMatch?.[1] ?? '{}')
  expect(payload).toMatchObject({
    hero: {
      kicker: 'CH 00 / SIGNAL FIELD',
      title: 'undef games',
      support: 'Indie developer building game tools and systems for fun shared experiences online and off.',
      primaryAction: {
        href: 'https://warp.undef.games',
        label: 'Explore WARP',
      },
      secondaryAction: {
        href: '#projects',
        label: 'View projects',
      },
      statusLabel: 'Shared play, digital and physical.',
    },
    sections: {
      projects: {
        kicker: 'Live routes',
        title: 'Projects built to be used, watched, and played with.',
      },
      identity: {
        kicker: 'Company baseline',
        title: 'Good systems should make shared play easier to reach.',
        body: 'undef games builds the technical side of play so people can gather, operate, and have fun across digital and physical spaces.',
      },
    },
  })
  expect(payload.projects).toEqual([
    {
      className: 'product-link--warp',
      description:
        'The flagship route: a live alpha platform for TradeWars runtime, automation, and operator tooling.',
      href: 'https://warp.undef.games',
      label: 'TradeWars: WARP Agent Runtime Platform',
      tag: 'warp',
    },
    {
      className: 'product-link--dice',
      description: 'Dice and table tools for shared play at the table and on the network.',
      href: 'https://undefdice.com',
      label: 'Undef Dice',
      tag: 'dice',
    },
    {
      className: 'product-link--taybols',
      description: 'Smaller experiments, generators, and odd little utilities with room to become bigger systems.',
      href: 'https://taybols.undef.games',
      label: 'Taybols',
      tag: 'taybols',
    },
  ])
  for (const project of payload.projects) {
    expect(Object.keys(project).sort()).toEqual(['className', 'description', 'href', 'label', 'tag'])
  }
  expect(payload.hero).not.toHaveProperty('copy')
  expect(payload.hero).not.toHaveProperty('primary_href')
  expect(payload.hero).not.toHaveProperty('primary_label')
  expect(payload.hero).not.toHaveProperty('secondary_href')
  expect(payload.hero).not.toHaveProperty('secondary_label')
  expect(payload.sections.identity).not.toHaveProperty('copy')
  await expect(page.getByText(/indie developer building game tools and systems/i)).toBeVisible()
  await expect(page.getByLabel('landing actions').getByRole('link', { name: /explore warp/i })).toBeVisible()
  await expect(page.getByRole('link', { name: /log in/i })).toHaveAttribute('href', 'https://account.undef.games/')
  await expect(page.getByRole('link', { name: /open lab/i }).last()).toHaveAttribute('href', '/lab/')
  await expect(page.locator('.station-shell')).toHaveAttribute('data-surface', 'site')
  await expect(page.getByLabel('interactive station signal')).toHaveAttribute('data-renderer', 'pixijs')
  await expect(page.getByLabel('interactive station signal')).toHaveAttribute('data-signal', '50')
  await expect(page.getByLabel('interactive station signal').locator('canvas')).toHaveCount(1)
  await expect(page.getByRole('link', { name: /open lab/i }).first()).toHaveAttribute('href', '/lab/')
  await expect(page.getByLabel('station tools and identity')).toHaveCount(0)
  await expect(page.getByLabel('effects controls')).toHaveCount(0)
  await expect(page.getByRole('heading', { name: /projects built to be used, watched, and played with/i })).toBeVisible()
  await expect(page.getByRole('heading', { name: /good systems should make shared play easier to reach/i })).toBeVisible()
  await expect(
    page.getByText(/undef games builds the technical side of play so people can gather, operate, and have fun/i),
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
    {
      heading: /^Games$/i,
      path: '/games/',
      description: /active game tools, systems, and playable utilities from undef games/i,
      intro: /the flagship route: a live alpha platform for tradewars runtime, automation, and operator tooling/i,
    },
    {
      heading: /^Logs$/i,
      path: '/logs/',
      description: /development logs, release notes, and project updates from undef games/i,
      intro: /this is where release notes, build updates, and project notes will collect/i,
    },
    {
      heading: /^About$/i,
      path: '/about/',
      description: /undef games is an indie developer building game tools and systems for fun shared experiences/i,
      intro: /undef games is an indie developer building strong game tools and systems to support fun shared experiences online and off/i,
    },
  ]) {
    await page.goto(route.path)

    await expect(page.getByRole('banner')).toBeVisible()
    await expect(page.getByRole('heading', { name: route.heading })).toBeVisible()
    await expect(page.locator('.scan-page__hero')).toContainText(route.description)
    await expect(page.locator('.scan-page__body')).toContainText(route.intro)
    await expect(page.getByRole('link', { name: /log in/i })).toHaveAttribute('href', 'https://account.undef.games/')
    await expect(page.getByRole('link', { name: /open lab/i })).toHaveAttribute('href', '/lab/')
    await expect(page.getByRole('contentinfo')).toContainText(/undef\.games/i)
    await expect(page.getByLabel('effects controls')).toHaveCount(0)
  }
})

test('keeps secondary page heroes tight to the header', async ({ page }) => {
  for (const path of ['/games/', '/logs/', '/about/']) {
    await page.goto(path)

    const spacing = await page.evaluate(() => {
      const header = document.querySelector('.site-header')!.getBoundingClientRect()
      const kicker = document.querySelector('.scan-page__hero .scan-fallback__kicker')!.getBoundingClientRect()
      const title = document.querySelector('.scan-page__hero h1')!.getBoundingClientRect()
      return {
        kickerGap: kicker.top - header.bottom,
        titleGap: title.top - header.bottom,
      }
    })

    expect(spacing.kickerGap).toBeLessThanOrEqual(96)
    expect(spacing.titleGap).toBeLessThanOrEqual(140)
  }
})

test('ships a production CORS allowlist header artifact', async () => {
  const headersFile = readFileSync('public/_headers', 'utf8')

  expect(headersFile).toContain('Access-Control-Allow-Origin: *')
  expect(headersFile).toContain('Access-Control-Allow-Methods: GET, HEAD, OPTIONS')
  expect(headersFile).toContain('Access-Control-Allow-Headers: Origin, Content-Type, Accept')
})

test('omits shared shell test ids when the Hugo flag is omitted', async () => {
  const html = buildHugoHtml(`baseURL = "https://undef.games/"
locale = "en-us"
title = "undef games"
theme = "scanlines"
enableGitInfo = false
enableRobotsTXT = true

[taxonomies]

[params]
  description = "Systems, toys, and game-shaped experiments tuned out of undefined space."
  site_name = "undef games"
  lab = "/lab/"
  login_url = "https://account.undef.games/"
  tagline = "Systems, toys, and game-shaped experiments tuned out of undefined space."
`)

  for (const hook of scanlinesSelectorContract.surfaces.site.hooks.shared) {
    expect(html).not.toContain(`data-testid="${hook}"`)
  }
})

test('emits the shared site selector contract when the Hugo flag is enabled', async ({ request }) => {
  const html = await (await request.get('/')).text()

  for (const hook of scanlinesSelectorContract.surfaces.site.hooks.shared) {
    expect(html).toContain(`data-testid=${hook}`)
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

  const themeToggle = page.getByTestId('site-theme-toggle')
  const loginLink = page.getByTestId('site-login-link')
  const labLink = page.getByTestId('site-lab-link').last()
  await expect(themeToggle).toBeVisible()
  await expect(themeToggle).toHaveAttribute('aria-pressed', 'false')
  await expect(themeToggle).toHaveAttribute('aria-label', 'Switch to dark mode')
  await expect(loginLink).toHaveAttribute('href', 'https://account.undef.games/')
  await expect(labLink).toHaveAttribute('href', '/lab/')
  const toggleBox = await themeToggle.boundingBox()
  const labBox = await labLink.boundingBox()
  expect(toggleBox).not.toBeNull()
  expect(labBox).not.toBeNull()
  expect(labBox!.x - (toggleBox!.x + toggleBox!.width)).toBeGreaterThanOrEqual(0)
  expect(labBox!.x - (toggleBox!.x + toggleBox!.width)).toBeLessThanOrEqual(6)

  await themeToggle.click()

  await expect(page.locator('html')).toHaveAttribute('data-scan-tone', 'dark')
  await expect(themeToggle).toHaveAttribute('aria-pressed', 'true')
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
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
  expect(overflow).toBe(false)
})

test('keeps the homepage hero copy tight to the header', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('.station-kicker')).toBeVisible()

  const heroGap = await page.evaluate(() => {
    const header = document.querySelector('.site-header')!.getBoundingClientRect()
    const kicker = document.querySelector('.station-shell--site .station-kicker')!.getBoundingClientRect()
    return kicker.top - header.bottom
  })

  expect(heroGap).toBeLessThanOrEqual(24)
})

test('serves the interactive lab below /lab/', async ({ page }) => {
  await page.goto('/lab/')

  await expect(page.getByRole('heading', { name: /undef games/i })).toBeVisible()
  await expect(page.getByLabel('interactive station signal')).toHaveAttribute('data-renderer', 'pixijs')
  await expect(page.getByLabel('effects controls')).toBeVisible()
  const backLink = page.getByRole('link', { name: /^< Back$/ })
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
  const backLink = page.getByRole('link', { name: /^< Back$/ })
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
  await expect(page.getByRole('link', { name: /^< Back$/ })).not.toHaveClass(/home-quick-link--intro/)
})

test('returns from the lab to the previous undef games page when available', async ({ page }) => {
  await page.goto('/games/')
  await page.getByRole('link', { name: /open lab/i }).last().click()

  await expect(page).toHaveURL(/\/lab\/$/)
  const backLink = page.getByRole('link', { name: /^< Back$/ })
  await expect(backLink).toHaveAttribute('href', '/games/')

  await backLink.click()

  await expect(page).toHaveURL(/\/games\/$/)
})
