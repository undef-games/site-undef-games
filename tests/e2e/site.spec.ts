import { expect, test } from '@playwright/test'

test('renders the Hugo scanlines landing page', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: /^undef games$/i })).toBeVisible()
  await expect(page.locator('.station-shell')).toHaveAttribute('data-surface', 'site')
  await expect(page.getByLabel('interactive station signal')).toHaveAttribute('data-renderer', 'pixijs')
  await expect(page.getByLabel('interactive station signal')).toHaveAttribute('data-signal', '50')
  await expect(page.getByLabel('interactive station signal').locator('canvas')).toHaveCount(1)
  await expect(page.getByRole('link', { name: /open lab/i })).toHaveAttribute('href', '/lab/')
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

test('serves the interactive lab below /lab/', async ({ page }) => {
  await page.goto('/lab/')

  await expect(page.getByRole('heading', { name: /undef games/i })).toBeVisible()
  await expect(page.getByLabel('interactive station signal')).toHaveAttribute('data-renderer', 'pixijs')
  await expect(page.getByLabel('effects controls')).toBeVisible()
})
