// @vitest-environment node
import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { buildThemeBoot } from './build-theme-boot.mjs'
const OUT = new URL('../dist/theme-boot.js', import.meta.url)
const INLINE_OUT = new URL('../dist/theme-boot.inline.ts', import.meta.url)
describe('theme-boot artifact', () => {
  it('exists and is a self-contained IIFE', () => {
    expect(existsSync(OUT)).toBe(true)
    const src = readFileSync(OUT, 'utf8')
    expect(src).not.toMatch(/\bimport\b/)
    expect(src).not.toMatch(/\bexport\b/)
    expect(src).toMatch(/scanTone/)
  })

  it('inline module exists and exports THEME_BOOT_INLINE as a string containing the IIFE', () => {
    expect(existsSync(INLINE_OUT)).toBe(true)
    const src = readFileSync(INLINE_OUT, 'utf8')
    expect(src).toMatch(/export const THEME_BOOT_INLINE = "/)
    expect(src).toMatch(/scanTone/)
    expect(src).toMatch(/__undefScanTheme/)
  })

  // Freshness guard: a committed dist that is stale relative to boot.ts/hydrate.ts
  // would otherwise pass every other check and ship silently to all surfaces.
  it('committed dist is up to date with the current source', async () => {
    const { iife, inline } = await buildThemeBoot({ write: false })
    expect(readFileSync(OUT, 'utf8')).toBe(iife)
    expect(readFileSync(INLINE_OUT, 'utf8')).toBe(inline)
  })
})
