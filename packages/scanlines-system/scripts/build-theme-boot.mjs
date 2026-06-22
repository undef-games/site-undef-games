import { build } from 'esbuild'
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
