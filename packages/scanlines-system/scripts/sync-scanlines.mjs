// packages/scanlines-system/scripts/sync-scanlines.mjs
import { createHash } from 'node:crypto'
import { cpSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'
import { VENDOR_DEST, VENDOR_FILES } from './vendor-surface.mjs'

const MANIFEST = 'VENDOR_MANIFEST.json'
const sha256 = (buf) => createHash('sha256').update(buf).digest('hex')

function sourceSha(sourceDir) {
  try { return execFileSync('git', ['-C', sourceDir, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim() }
  catch { return 'unknown' }
}

export function syncTo(targetDir, sourceDir) {
  const destRoot = join(targetDir, VENDOR_DEST)
  const files = {}
  for (const rel of VENDOR_FILES) {
    const from = join(sourceDir, rel)
    const to = join(destRoot, rel)
    mkdirSync(dirname(to), { recursive: true })
    cpSync(from, to)
    files[rel] = sha256(readFileSync(to))
  }
  mkdirSync(destRoot, { recursive: true })
  writeFileSync(join(destRoot, MANIFEST), `${JSON.stringify({ sourceSha: sourceSha(sourceDir), files }, null, 2)}\n`)
}

export function checkTarget(targetDir) {
  const destRoot = join(targetDir, VENDOR_DEST)
  const manifest = JSON.parse(readFileSync(join(destRoot, MANIFEST), 'utf8'))
  const mismatches = []
  for (const [rel, want] of Object.entries(manifest.files)) {
    let got
    try { got = sha256(readFileSync(join(destRoot, rel))) } catch { got = 'MISSING' }
    if (got !== want) mismatches.push(rel)
  }
  return { ok: mismatches.length === 0, mismatches }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2)
  const targetDir = args[args.indexOf('--target') + 1] ?? '.'
  const sourceDir = fileURLToPath(new URL('..', import.meta.url))
  if (args.includes('--check')) {
    const res = checkTarget(targetDir)
    if (!res.ok) { console.error('scanlines vendor drift:', res.mismatches.join(', ')); process.exit(1) }
    console.log('scanlines vendor OK')
  } else {
    syncTo(targetDir, sourceDir)
    console.log(`synced scanlines vendor into ${targetDir}`)
  }
}
