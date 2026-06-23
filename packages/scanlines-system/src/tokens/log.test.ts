import { afterEach, describe, expect, it, vi } from 'vitest'
import { scanlinesLog, setScanlinesLogger } from './log'

afterEach(() => setScanlinesLogger(null))

describe('scanlines logger seam', () => {
  it('defaults to a no-op (no throw, no console)', () => {
    expect(() => scanlinesLog().warn('x', { a: 1 })).not.toThrow()
    expect(() => scanlinesLog().error('x', { a: 1 })).not.toThrow()
    expect(() => scanlinesLog().info('x', { a: 1 })).not.toThrow()
  })
  it('routes to an injected logger', () => {
    const warn = vi.fn()
    const error = vi.fn()
    const info = vi.fn()
    setScanlinesLogger({ warn, error, info })
    scanlinesLog().warn('theme.read.fail', { reason: 'parse' })
    expect(warn).toHaveBeenCalledWith('theme.read.fail', { reason: 'parse' })
    scanlinesLog().error('theme.init.fail', { reason: 'missing' })
    expect(error).toHaveBeenCalledWith('theme.init.fail', { reason: 'missing' })
    scanlinesLog().info('theme.loaded', { key: 'dark' })
    expect(info).toHaveBeenCalledWith('theme.loaded', { key: 'dark' })
  })
})
