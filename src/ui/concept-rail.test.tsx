import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ConceptRail } from './concept-rail'
import { concepts } from '../concepts/registry'

describe('ConceptRail', () => {
  it('renders 13 concept buttons', () => {
    render(<ConceptRail concepts={concepts} activeConceptId="prompt-cursor" onSelect={() => undefined} />)
    expect(screen.getAllByRole('button')).toHaveLength(13)
  })
})
