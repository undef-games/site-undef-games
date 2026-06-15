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
  await expect(page.getByRole('heading', { name: /actual projects on the network/i })).toBeVisible()
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
    await expect(page.getByLabel('effects controls')).toHaveCount(0)
  }
})

test('keeps the site header responsive without pinning controls to wide viewport edges', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 900 })
  await page.goto('/')

  const brandBox = await page.locator('.site-header__brand').boundingBox()
  const loginBox = await page.getByRole('link', { name: /log in/i }).boundingBox()
  const heroTextInset = await page.locator('.station-hero').evaluate((element) => {
    const rect = element.getBoundingClientRect()
    const style = getComputedStyle(element)
    return rect.x + Number.parseFloat(style.paddingLeft)
  })
  expect(brandBox).not.toBeNull()
  expect(loginBox).not.toBeNull()
  expect(Math.abs(brandBox!.x - heroTextInset)).toBeLessThanOrEqual(8)
  expect(loginBox!.x + loginBox!.width).toBeLessThan(heroTextInset + 720)

  await page.setViewportSize({ width: 390, height: 844 })
  await page.reload()

  await expect(page.getByRole('banner')).toBeVisible()
  await expect(page.getByRole('navigation', { name: /primary/i })).toBeVisible()
  await expect(page.getByRole('link', { name: /log in/i })).toBeVisible()
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
  expect(overflow).toBe(false)
})

test('serves the interactive lab below /lab/', async ({ page }) => {
  await page.goto('/lab/')

  await expect(page.getByRole('heading', { name: /undef games/i })).toBeVisible()
  await expect(page.getByLabel('interactive station signal')).toHaveAttribute('data-renderer', 'pixijs')
  await expect(page.getByLabel('effects controls')).toBeVisible()
})
