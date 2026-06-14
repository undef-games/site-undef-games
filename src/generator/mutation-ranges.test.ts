import { describe, expect, it } from 'vitest'
import { clampControlValue } from './mutation-ranges'

describe('clampControlValue', () => {
  it('clamps values above the range max', () => {
    expect(clampControlValue({ min: 0, max: 1 }, 3)).toBe(1)
  })

  it('clamps values below the range min', () => {
    expect(clampControlValue({ min: 0, max: 1 }, -2)).toBe(0)
  })

  it('returns finite values already within the range', () => {
    expect(clampControlValue({ min: 0, max: 1 }, 0.5)).toBe(0.5)
  })

  it.each([
    [{ min: Number.NaN, max: 1 }, 0.5],
    [{ min: 0, max: Number.POSITIVE_INFINITY }, 0.5],
    [{ min: 0, max: 1 }, Number.NEGATIVE_INFINITY],
    [{ min: 2, max: 1 }, 1.5],
  ])('throws RangeError for invalid range or value %#', (range, value) => {
    expect(() => clampControlValue(range, value)).toThrow(RangeError)
  })
})
