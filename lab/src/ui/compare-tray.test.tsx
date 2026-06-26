import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { CompareTray } from './compare-tray'
import type { LogoConcept } from '../concepts/types'

afterEach(() => cleanup())

const makeConcept = (id: string, name: string): LogoConcept => ({
  id,
  name,
  lane: 'play-toolmaking-game-objects',
  prompt: '',
  tags: [],
  colorTokens: { background: '#000', foreground: '#fff', accent: '#f00' },
  fontPairing: { display: 'Arial', body: 'Arial' },
  geometryPreset: 'none',
  motionPreset: 'none',
  symbolRules: [],
  wordmarkRules: [],
  compactLockupRules: [],
  mutationRanges: {
    symmetry: { min: 0, max: 1 },
    density: { min: 0, max: 1 },
    noise: { min: 0, max: 1 },
    field: { min: 0, max: 1 },
  },
})

const alpha = makeConcept('alpha', 'Alpha')
const beta = makeConcept('beta', 'Beta')

describe('CompareTray', () => {
  it('renders a span for each concept', () => {
    render(<CompareTray concepts={[alpha, beta]} activeConceptId="alpha" />)
    expect(screen.getByText('Alpha')).toBeInTheDocument()
    expect(screen.getByText('Beta')).toBeInTheDocument()
  })

  it('marks the active concept span with data-active="true"', () => {
    render(<CompareTray concepts={[alpha, beta]} activeConceptId="alpha" />)
    const alphaSpan = screen.getByText('Alpha')
    expect(alphaSpan).toHaveAttribute('data-active', 'true')
  })

  it('marks non-active concepts with data-active="false"', () => {
    render(<CompareTray concepts={[alpha, beta]} activeConceptId="alpha" />)
    const betaSpan = screen.getByText('Beta')
    expect(betaSpan).toHaveAttribute('data-active', 'false')
  })

  it('switches the active concept when activeConceptId changes', () => {
    const { rerender } = render(<CompareTray concepts={[alpha, beta]} activeConceptId="alpha" />)
    expect(screen.getByText('Alpha')).toHaveAttribute('data-active', 'true')
    expect(screen.getByText('Beta')).toHaveAttribute('data-active', 'false')

    rerender(<CompareTray concepts={[alpha, beta]} activeConceptId="beta" />)
    expect(screen.getByText('Alpha')).toHaveAttribute('data-active', 'false')
    expect(screen.getByText('Beta')).toHaveAttribute('data-active', 'true')
  })

  it('renders an empty list when concepts is empty', () => {
    render(<CompareTray concepts={[]} activeConceptId="alpha" />)
    expect(screen.queryByText('Alpha')).not.toBeInTheDocument()
  })
})
