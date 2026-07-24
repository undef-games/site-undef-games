import { expect, test } from '@playwright/test'

test('lists all 10 games with a per-row motif glyph on /games/', async ({ page }) => {
  await page.goto('/games/')

  await expect(page.locator('.ug-games__row')).toHaveCount(10)
  await expect(page.locator('.ug-games__flyby .ug-motif')).toHaveCount(10)
})

test.describe('reduced motion', () => {
  // NOTE: `test.use({ reducedMotion: 'reduce' })` does not take effect against the pinned
  // Playwright/Chromium build in this repo (the context-option never reaches CDP emulation,
  // even from the global config's top-level `use` — verified: `colorScheme` context-option
  // works fine, only `reducedMotion` is affected). Emulate it explicitly per-test instead,
  // which does work reliably.

  test('/games/ runs no animations when the user prefers reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/games/')

    const running = await page.evaluate(
      () => document.getAnimations().filter((animation) => animation.playState === 'running').length,
    )
    expect(running).toBe(0)
  })

  test('freezes the homepage marquee track when the user prefers reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')

    // The station/scanline scene on the homepage runs its own unrelated animations under
    // reduced motion, so this only asserts the marquee track itself is frozen — not a global
    // document.getAnimations() === 0 check (see /games/ above for that stricter guard).
    const track = page.locator('.landing-marquee__track')
    await expect(track).toHaveCount(1)
    await expect
      .poll(() => track.evaluate((element) => getComputedStyle(element).animationName))
      .toBe('none')
    const frozen = await track.evaluate((element) =>
      element.getAnimations().every((animation) => animation.playState !== 'running'),
    )
    expect(frozen).toBe(true)
  })
})
