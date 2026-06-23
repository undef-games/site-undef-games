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
  it('console.css contains .datatable kit selector', () => {
    expect(read('../react/console.css')).toMatch(/\.datatable/)
  })
  it('console.css contains .toolbar kit selector', () => {
    expect(read('../react/console.css')).toMatch(/\.toolbar/)
  })
  it('console.css contains .tabs__tab kit selector', () => {
    expect(read('../react/console.css')).toMatch(/\.tabs__tab/)
  })
  it('console.css contains .form-row kit selector', () => {
    expect(read('../react/console.css')).toMatch(/\.form-row/)
  })
  it('console.css contains .badge kit selector', () => {
    expect(read('../react/console.css')).toMatch(/\.badge/)
  })
  it('console.css contains .status-pill kit selector', () => {
    expect(read('../react/console.css')).toMatch(/\.status-pill/)
  })
  it('console.css contains .empty-state kit selector', () => {
    expect(read('../react/console.css')).toMatch(/\.empty-state/)
  })
  it('console.css contains .panel--console variant selector', () => {
    expect(read('../react/console.css')).toMatch(/\.panel--console/)
  })
  it('console.css styles the shell (fills viewport)', () => {
    expect(read('../react/console.css')).toMatch(/\.console-shell\[data-surface="console"\][^{]*\{[^}]*min-height/)
  })
  it('console.css styles the console header bar', () => {
    expect(read('../react/console.css')).toMatch(/\.console-header[^_][^{]*\{/)
  })
  it('console.css styles the header brand (not a default link)', () => {
    expect(read('../react/console.css')).toMatch(/\.console-header__brand[^{]*\{/)
  })
  it('console.css styles the header nav + active state', () => {
    expect(read('../react/console.css')).toMatch(/\.console-header__nav a\[aria-current="page"\]/)
  })
  it('console.css styles the console main region', () => {
    expect(read('../react/console.css')).toMatch(/\.console-main[^{]*\{/)
  })
})
