import { build } from 'esbuild'
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const OUT = fileURLToPath(new URL('../dist/theme-boot.js', import.meta.url))
const INLINE_OUT = fileURLToPath(new URL('../dist/theme-boot.inline.ts', import.meta.url))

// Build the boot IIFE in memory and derive the inline-string module. When
// `write` is true, persist both to dist/. The CLI path and the freshness test
// both consume the SAME in-memory output, so the committed dist is byte-equal
// to a fresh rebuild by construction.
export async function buildThemeBoot({ write = false } = {}) {
  const result = await build({
    entryPoints: [fileURLToPath(new URL('../src/tokens/boot-entry.ts', import.meta.url))],
    bundle: true,
    minify: true,
    format: 'iife',
    target: 'es2019',
    legalComments: 'none',
    write: false,
  })
  const iife = result.outputFiles[0].text
  const inline = `// Generated from theme-boot.js by build-theme-boot.mjs. Do not edit.\nexport const THEME_BOOT_INLINE = ${JSON.stringify(iife)}\n`
  if (write) {
    writeFileSync(OUT, iife)
    writeFileSync(INLINE_OUT, inline)
  }
  return { iife, inline }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await buildThemeBoot({ write: true })
  console.log('built dist/theme-boot.js + dist/theme-boot.inline.ts')
}
