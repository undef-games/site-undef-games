// @vitest-environment node
import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
const OUT = new URL('../dist/theme-boot.js', import.meta.url)
describe('theme-boot artifact', () => {
  it('exists and is a self-contained IIFE', () => {
    expect(existsSync(OUT)).toBe(true)
    const src = readFileSync(OUT, 'utf8')
    expect(src).not.toMatch(/\bimport\b/)
    expect(src).not.toMatch(/\bexport\b/)
    expect(src).toMatch(/scanTone/)
  })
})
