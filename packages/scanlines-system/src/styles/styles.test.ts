import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { describe, expect, it } from 'vitest'
const __dirname = dirname(fileURLToPath(import.meta.url))
const read = (f: string) => readFileSync(join(__dirname, f), 'utf8')
describe('backoffice styles', () => {
  it('backdrop defines the scanline field class', () => {
    expect(read('../atmosphere/backdrop.css')).toMatch(/\.scanlines-backdrop\s*\{/)
  })
  it('admin shell variant exists', () => {
    expect(read('shell-admin.css')).toMatch(/\.scanlines-header--admin/)
  })
})
describe('console surface styles', () => {
  it('console.css scopes tokens to [data-surface="console"]', () => {
    expect(read('../react/console.css')).toMatch(/\[data-surface="console"\]/)
  })
  it('console.css defines --console-row-border token', () => {
    expect(read('../react/console.css')).toMatch(/--console-row-border/)
  })
})
