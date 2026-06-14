import { expect, test } from '@playwright/test'

test('renders the logo lab shell', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /undef logos/i })).toBeVisible()
  await expect(page.getByLabel('interactive logo scene')).toBeVisible()

  const warpGate = page.getByRole('button', { name: 'Warp Gate' })
  await warpGate.click()
  await expect(warpGate).toHaveAttribute('aria-current', 'true')
})
