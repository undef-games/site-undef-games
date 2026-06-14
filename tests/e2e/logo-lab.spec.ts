import { expect, test } from '@playwright/test'

test('renders the logo lab shell', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /undef logos/i })).toBeVisible()
  await expect(page.getByLabel('interactive logo scene')).toBeVisible()

  await page.getByRole('button', { name: /define world/i }).click()
  await page.getByRole('button', { name: /define move/i }).click()
  await page.getByRole('button', { name: /define win/i }).click()
  await expect(page.getByText(/Define the Game \/ playable/i)).toBeVisible()

  const commandConsole = page.getByRole('button', { name: 'Command Console' })
  await commandConsole.click()
  await expect(commandConsole).toHaveAttribute('aria-current', 'true')
  await page.getByLabel(/command input/i).fill('define world')
  await page.getByRole('button', { name: /run command/i }).click()
  await expect(page.getByText(/ok: define world/i)).toBeVisible()
  await expect(page.getByText('> build undef.games')).toBeVisible()

  await page.getByRole('button', { name: 'Rule Board' }).click()
  await page.getByRole('button', { name: /make illegal move/i }).click()
  await page.getByRole('button', { name: /route to tile 10/i }).click()
  await page.getByRole('button', { name: /route to tile 14/i }).click()
  await expect(page.getByText(/Rule Board \/ route locked/i)).toBeVisible()
  await expect(page.getByText(/5 -> 6 -> 10 -> 14/i)).toBeVisible()
})

test('keeps the playable surface usable on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await expect(page.getByLabel('interactive logo scene')).toBeVisible()
  await expect(page.getByRole('button', { name: /define world/i })).toBeVisible()
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
  expect(overflow).toBe(false)
})
