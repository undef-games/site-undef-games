import { createStore } from 'zustand/vanilla'
import { subscribeWithSelector } from 'zustand/middleware'

export type LogoLabDisplayMode = 'landing' | 'resolved' | 'compare'

export type LogoLabState = {
  activeConceptId: string
  hoveredConceptId: string | null
  pinnedConceptIds: string[]
  displayMode: LogoLabDisplayMode
  setActiveConcept: (id: string) => void
  setHoveredConcept: (id: string | null) => void
  setDisplayMode: (mode: LogoLabDisplayMode) => void
  pinConcept: (id: string) => void
  unpinConcept: (id: string) => void
}

export function createLogoLabStore() {
  return createStore<LogoLabState>()(
    subscribeWithSelector((set) => ({
      activeConceptId: 'define-the-game',
      hoveredConceptId: null,
      pinnedConceptIds: [],
      displayMode: 'landing',
      setActiveConcept: (id) =>
        set((state) =>
          state.activeConceptId === id ? state : { ...state, activeConceptId: id },
        ),
      setHoveredConcept: (id) =>
        set((state) =>
          state.hoveredConceptId === id ? state : { ...state, hoveredConceptId: id },
        ),
      setDisplayMode: (mode) =>
        set((state) =>
          state.displayMode === mode ? state : { ...state, displayMode: mode },
        ),
      pinConcept: (id) =>
        set((state) =>
          state.pinnedConceptIds.includes(id)
            ? state
            : { ...state, pinnedConceptIds: [...state.pinnedConceptIds, id] },
        ),
      unpinConcept: (id) =>
        set((state) =>
          state.pinnedConceptIds.includes(id)
            ? {
                ...state,
                pinnedConceptIds: state.pinnedConceptIds.filter(
                  (conceptId) => conceptId !== id,
                ),
              }
            : state,
        ),
    })),
  )
}

export type LogoLabStore = ReturnType<typeof createLogoLabStore>
