import { describe, expect, it } from 'vitest'
import { createLogoLabStore } from './logo-lab-store'

describe('logo lab store', () => {
  it('starts with logo lab defaults', () => {
    const store = createLogoLabStore()

    expect(store.getState().activeConceptId).toBe('define-the-game')
    expect(store.getState().hoveredConceptId).toBeNull()
    expect(store.getState().pinnedConceptIds).toEqual([])
    expect(store.getState().displayMode).toBe('landing')
  })

  it('pins a concept id once', () => {
    const store = createLogoLabStore()
    store.getState().pinConcept('define-the-game')
    store.getState().pinConcept('define-the-game')
    expect(store.getState().pinnedConceptIds).toEqual(['define-the-game'])
  })

  it('does not notify pinned concept subscribers for duplicate pins', () => {
    const store = createLogoLabStore()
    let observedCount = 0

    store.subscribe(
      (state) => state.pinnedConceptIds,
      () => {
        observedCount += 1
      },
    )

    store.getState().pinConcept('define-the-game')
    expect(observedCount).toBe(1)

    observedCount = 0
    store.getState().pinConcept('define-the-game')

    expect(observedCount).toBe(0)
  })

  it('sets the active concept', () => {
    const store = createLogoLabStore()

    store.getState().setActiveConcept('orbit-signal')

    expect(store.getState().activeConceptId).toBe('orbit-signal')
  })
})
