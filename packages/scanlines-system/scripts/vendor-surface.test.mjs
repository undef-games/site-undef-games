// @vitest-environment node
// packages/scanlines-system/scripts/vendor-surface.test.mjs
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { VENDOR_FILES } from './vendor-surface.mjs'

describe('vendor surface', () => {
  it('lists only existing files and excludes station/site', () => {
    expect(VENDOR_FILES.length).toBeGreaterThan(0)
    for (const rel of VENDOR_FILES) {
      expect(existsSync(fileURLToPath(new URL(`../${rel}`, import.meta.url)))).toBe(true)
    }
    expect(VENDOR_FILES.some((f) => f.includes('/station/'))).toBe(false)
    expect(VENDOR_FILES.some((f) => f.endsWith('dist/theme-boot.js'))).toBe(true)
  })
})
