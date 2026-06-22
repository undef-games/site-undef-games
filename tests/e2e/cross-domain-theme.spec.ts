import { expect, test } from '@playwright/test'

// Simulates arriving from another subdomain: localStorage is empty, only the
// shared cookie is present. theme-boot.js reads document.cookie as its
// fallback, so data-scan-tone must be set correctly on first paint.

test('honors a pre-set light theme cookie on first paint', async ({ context, page }) => {
  await context.addCookies([
    {
      name: 'undef-logos-theme',
      value: encodeURIComponent(JSON.stringify({ activeTone: 'light', version: 1 })),
      url: 'http://127.0.0.1:4173',
    },
  ])

  await page.goto('/')

  // The blocking theme-boot.js reads the cookie before any paint; the
  // attribute must be present without any JS interaction.
  await expect(page.locator('html')).toHaveAttribute('data-scan-tone', 'light')
})

test('honors a pre-set dark theme cookie on first paint', async ({ context, page }) => {
  await context.addCookies([
    {
      name: 'undef-logos-theme',
      value: encodeURIComponent(JSON.stringify({ activeTone: 'dark', version: 1 })),
      url: 'http://127.0.0.1:4173',
    },
  ])

  await page.goto('/')

  // dark is the default, but explicitly setting the cookie must still round-trip
  await expect(page.locator('html')).toHaveAttribute('data-scan-tone', 'dark')
})

test('falls back to dark when no cookie or localStorage is present', async ({ page }) => {
  // Completely fresh context: no cookie, no localStorage
  await page.goto('/')

  await expect(page.locator('html')).toHaveAttribute('data-scan-tone', 'dark')
})
