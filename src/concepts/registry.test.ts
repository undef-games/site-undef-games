import { describe, expect, it } from 'vitest'
import { conceptLanes } from './lanes'
import { concepts } from './registry'

const requiredIds = [
  'define-the-game',
  'command-console',
  'rule-board',
]

const hexColorPattern = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i

describe('concepts', () => {
  it('contains 3 prototype entries', () => {
    expect(concepts).toHaveLength(3)
  })

  it('contains exactly the required ids with no duplicates', () => {
    const ids = concepts.map((concept) => concept.id)

    expect(ids).toEqual(requiredIds)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('assigns every concept to a known lane', () => {
    expect(concepts.every((concept) => conceptLanes.includes(concept.lane))).toBe(true)
  })

  it('defines complete non-empty creative metadata for every concept', () => {
    expect(
      concepts.every(
        (concept) =>
          concept.prompt.length > 0 &&
          concept.tags.length > 0 &&
          concept.geometryPreset.length > 0 &&
          concept.motionPreset.length > 0 &&
          concept.symbolRules.length > 0 &&
          concept.wordmarkRules.length > 0 &&
          concept.compactLockupRules.length > 0,
      ),
    ).toBe(true)
  })

  it('uses hex color strings for every color token', () => {
    expect(
      concepts.every((concept) =>
        Object.values(concept.colorTokens).every((colorToken) => hexColorPattern.test(colorToken)),
      ),
    ).toBe(true)
  })

  it('defines finite ordered mutation ranges for every control', () => {
    expect(
      concepts.every((concept) =>
        Object.values(concept.mutationRanges).every(
          (range) => Number.isFinite(range.min) && Number.isFinite(range.max) && range.min <= range.max,
        ),
      ),
    ).toBe(true)
  })
})
