import { build } from 'esbuild'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

await build({
  entryPoints: [fileURLToPath(new URL('../src/theme/boot-entry.ts', import.meta.url))],
  outfile: fileURLToPath(new URL('../dist/theme-boot.js', import.meta.url)),
  bundle: true,
  minify: true,
  format: 'iife',
  target: 'es2019',
  legalComments: 'none',
})
console.log('built dist/theme-boot.js')

const iife = readFileSync(fileURLToPath(new URL('../dist/theme-boot.js', import.meta.url)), 'utf8')
writeFileSync(
  fileURLToPath(new URL('../dist/theme-boot.inline.ts', import.meta.url)),
  `// Generated from theme-boot.js by build-theme-boot.mjs. Do not edit.\nexport const THEME_BOOT_INLINE = ${JSON.stringify(iife)}\n`,
)
console.log('built dist/theme-boot.inline.ts')
