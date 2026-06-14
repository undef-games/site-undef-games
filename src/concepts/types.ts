import type { ConceptLane } from './lanes'

export type MutationRange = {
  min: number
  max: number
}

export type LogoConcept = {
  id: string
  name: string
  lane: ConceptLane
  prompt: string
  tags: string[]
  colorTokens: {
    background: string
    foreground: string
    accent: string
  }
  fontPairing: {
    display: string
    body: string
  }
  geometryPreset: string
  motionPreset: string
  symbolRules: string[]
  wordmarkRules: string[]
  compactLockupRules: string[]
  mutationRanges: {
    symmetry: MutationRange
    density: MutationRange
    noise: MutationRange
    field: MutationRange
  }
}
