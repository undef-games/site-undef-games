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

  it('does not notify active concept subscribers when the id is unchanged', () => {
    const store = createLogoLabStore()
    let observedCount = 0

    store.subscribe(
      (state) => state.activeConceptId,
      () => { observedCount += 1 },
    )

    store.getState().setActiveConcept('command-console')
    expect(observedCount).toBe(1)

    observedCount = 0
    store.getState().setActiveConcept('command-console')
    expect(observedCount).toBe(0)
  })

  it('sets and clears the hovered concept', () => {
    const store = createLogoLabStore()

    store.getState().setHoveredConcept('rule-board')
    expect(store.getState().hoveredConceptId).toBe('rule-board')

    store.getState().setHoveredConcept(null)
    expect(store.getState().hoveredConceptId).toBeNull()
  })

  it('does not notify hovered concept subscribers when the id is unchanged', () => {
    const store = createLogoLabStore()
    let observedCount = 0

    store.subscribe(
      (state) => state.hoveredConceptId,
      () => { observedCount += 1 },
    )

    store.getState().setHoveredConcept('define-the-game')
    expect(observedCount).toBe(1)

    observedCount = 0
    store.getState().setHoveredConcept('define-the-game')
    expect(observedCount).toBe(0)
  })

  it('sets the display mode', () => {
    const store = createLogoLabStore()

    store.getState().setDisplayMode('resolved')
    expect(store.getState().displayMode).toBe('resolved')

    store.getState().setDisplayMode('compare')
    expect(store.getState().displayMode).toBe('compare')
  })

  it('does not notify display mode subscribers when the mode is unchanged', () => {
    const store = createLogoLabStore()
    let observedCount = 0

    store.subscribe(
      (state) => state.displayMode,
      () => { observedCount += 1 },
    )

    store.getState().setDisplayMode('resolved')
    expect(observedCount).toBe(1)

    observedCount = 0
    store.getState().setDisplayMode('resolved')
    expect(observedCount).toBe(0)
  })

  it('unpins a concept id', () => {
    const store = createLogoLabStore()
    store.getState().pinConcept('define-the-game')
    store.getState().pinConcept('command-console')

    store.getState().unpinConcept('define-the-game')

    expect(store.getState().pinnedConceptIds).toEqual(['command-console'])
  })

  it('does not notify unpin subscribers when the id was not pinned', () => {
    const store = createLogoLabStore()
    let observedCount = 0

    store.subscribe(
      (state) => state.pinnedConceptIds,
      () => { observedCount += 1 },
    )

    store.getState().unpinConcept('define-the-game')
    expect(observedCount).toBe(0)
  })
})
