import type { MutationRange } from '../concepts/types'

export function clampControlValue(range: MutationRange, value: number) {
  if (!Number.isFinite(range.min) || !Number.isFinite(range.max) || !Number.isFinite(value) || range.min > range.max) {
    throw new RangeError('Control value and mutation range must be finite, with min less than or equal to max.')
  }

  return Math.min(range.max, Math.max(range.min, value))
}
