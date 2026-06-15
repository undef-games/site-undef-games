import { expect, test } from '@playwright/test'

test('renders the Hugo scanlines landing page', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: /^undef games$/i })).toBeVisible()
  await expect(page.getByRole('link', { name: /open lab/i })).toHaveAttribute('href', '/lab/')
  await expect(page.getByRole('heading', { name: /actual projects on the network/i })).toBeVisible()
  await expect(page.getByRole('link', { name: /TradeWars: WARP Agent Runtime Platform/i })).toHaveAttribute(
    'href',
    /https:\/\/warp\.undef\.games\/?/,
  )
  await expect(page.getByRole('link', { name: /Undef Dice/i })).toHaveAttribute('href', /https:\/\/undefdice\.com\/?/)
  await expect(page.getByRole('link', { name: /Taybols/i })).toHaveAttribute('href', /https:\/\/taybols\.undef\.games\/?/)
})

test('serves the interactive lab below /lab/', async ({ page }) => {
  await page.goto('/lab/')

  await expect(page.getByRole('heading', { name: /undef games/i })).toBeVisible()
  await expect(page.getByLabel('interactive station signal')).toHaveAttribute('data-renderer', 'pixijs')
  await expect(page.getByLabel('effects controls')).toBeVisible()
})
