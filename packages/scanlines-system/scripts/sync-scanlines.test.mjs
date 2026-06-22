// @vitest-environment node
// packages/scanlines-system/scripts/sync-scanlines.test.mjs
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import { checkTarget, syncTo } from './sync-scanlines.mjs'

const SOURCE = fileURLToPath(new URL('..', import.meta.url)) // packages/scanlines-system
const targets = []
afterEach(() => { targets.length = 0 })

describe('sync-scanlines', () => {
  it('copies the surface and a manifest, then self-check passes', () => {
    const t = mkdtempSync(join(tmpdir(), 'vendor-'))
    targets.push(t)
    syncTo(t, SOURCE)
    expect(checkTarget(t)).toEqual({ ok: true, mismatches: [] })
  })

  it('self-check fails when a vendored file is hand-edited', () => {
    const t = mkdtempSync(join(tmpdir(), 'vendor-'))
    targets.push(t)
    syncTo(t, SOURCE)
    const f = join(t, 'src/vendor/scanlines-system/src/theme/boot.ts')
    writeFileSync(f, `${readFileSync(f, 'utf8')}\n// tampered`)
    const res = checkTarget(t)
    expect(res.ok).toBe(false)
    expect(res.mismatches.some((m) => m.includes('boot.ts'))).toBe(true)
  })
})
