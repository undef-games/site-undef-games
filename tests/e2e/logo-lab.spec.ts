import { expect, test } from '@playwright/test'

test('renders the logo lab shell', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /undef logos/i })).toBeVisible()
  await expect(page.getByLabel('interactive logo scene')).toBeVisible()

  const commandConsole = page.getByRole('button', { name: 'Command Console' })
  await commandConsole.click()
  await expect(commandConsole).toHaveAttribute('aria-current', 'true')
  await expect(page.getByText('> build undef.games')).toBeVisible()
})
