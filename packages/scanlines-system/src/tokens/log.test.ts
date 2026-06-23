import { afterEach, describe, expect, it, vi } from 'vitest'
import { scanlinesLog, setScanlinesLogger } from './log'

afterEach(() => setScanlinesLogger(null))

describe('scanlines logger seam', () => {
  it('defaults to a no-op (no throw, no console)', () => {
    expect(() => scanlinesLog().warn('x', { a: 1 })).not.toThrow()
  })
  it('routes to an injected logger', () => {
    const warn = vi.fn()
    setScanlinesLogger({ warn, error: vi.fn(), info: vi.fn() })
    scanlinesLog().warn('theme.read.fail', { reason: 'parse' })
    expect(warn).toHaveBeenCalledWith('theme.read.fail', { reason: 'parse' })
  })
})
