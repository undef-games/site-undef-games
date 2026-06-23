import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'

// Load the REAL package CSS so this gates console.css directly. The bug this
// guards against: the shell/header components emit these classNames but the CSS
// rules were missing, so the chrome rendered unstyled (blue underlined brand,
// no layout, white body). Unit tests are headless and can't catch that; this can.
const consoleCss = readFileSync('packages/scanlines-system/src/react/console.css', 'utf8')

// Markup mirrors ConsoleShell / ConsoleHeader / DataTable output. --fx-* tokens
// are normally set by the theme boot at runtime; we pin a dark palette here so
// console.css resolves deterministically.
const FIXTURE = `<!doctype html><html data-scan-tone="dark"><head><style>
  :root { --fx-bg:#050607; --fx-text:#f4f4f0; --fx-muted-rgb:244 244 240; --fx-signal-rgb:216 255 53; }
  html, body { margin: 0; }
  ${consoleCss}
</style></head><body>
  <div class="console-shell" data-surface="console" data-scan-tone="dark">
    <header class="console-header">
      <a class="console-header__brand" href="/">undef admin</a>
      <nav class="console-header__nav" aria-label="Primary">
        <a href="#roles" aria-current="page">Roles</a>
        <a href="#audit">Audit</a>
      </nav>
      <div class="console-header__actions"></div>
      <div class="console-header__utilities"><button type="button">tone</button></div>
    </header>
    <main class="console-main">
      <div class="datatable">
        <table>
          <caption class="datatable__caption">Role catalog</caption>
          <thead><tr><th scope="col">Role</th><th scope="col" data-align="end">Permissions</th></tr></thead>
          <tbody><tr><td>admin</td><td data-align="end"><span class="badge badge--signal">grant</span></td></tr></tbody>
        </table>
      </div>
    </main>
  </div>
</body></html>`

test.describe('console surface visual contract', () => {
  test('console.css actually styles the shell, header and kit', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.setContent(FIXTURE, { waitUntil: 'load' })

    // Header brand: styled, not a default underlined link (the original break).
    const brand = page.locator('.console-header__brand')
    await expect(brand).toHaveCSS('text-decoration-line', 'none')
    await expect(brand).toHaveCSS('color', 'rgb(244, 244, 240)')

    // Header is a flex bar (default would be block).
    await expect(page.locator('.console-header')).toHaveCSS('display', 'flex')

    // Shell fills the viewport (was unset → white body below the header).
    const shellMinHeight = await page
      .locator('.console-shell')
      .evaluate((el) => Number.parseFloat(getComputedStyle(el).minHeight))
    expect(shellMinHeight).toBeGreaterThan(600)

    // Active nav link uses the lime signal accent.
    await expect(page.locator('.console-header__nav a[aria-current="page"]')).toHaveCSS(
      'color',
      'rgb(216, 255, 53)',
    )

    // No scanline field behind data — flat surface (field-off invariant).
    await expect(page.locator('.console-shell')).toHaveCSS('background-image', 'none')

    // Kit DataTable header has its tinted background (guards the kit CSS too).
    const thBg = await page
      .locator('.datatable thead th')
      .first()
      .evaluate((el) => getComputedStyle(el).backgroundColor)
    expect(thBg).not.toBe('rgba(0, 0, 0, 0)')

    await page.screenshot({ path: 'test-results/console-surface.png', fullPage: true })
  })
})
