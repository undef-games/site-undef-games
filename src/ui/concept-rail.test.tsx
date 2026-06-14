import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ConceptRail } from './concept-rail'
import { concepts } from '../concepts/registry'

afterEach(() => cleanup())

describe('ConceptRail', () => {
  it('renders 13 concept buttons', () => {
    render(<ConceptRail concepts={concepts} activeConceptId="prompt-cursor" onSelect={() => undefined} />)
    expect(screen.getAllByRole('button')).toHaveLength(13)
  })

  it('calls onSelect with the selected concept id', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()

    render(<ConceptRail concepts={concepts} activeConceptId="prompt-cursor" onSelect={onSelect} />)
    await user.click(screen.getByRole('button', { name: 'Warp Gate' }))

    expect(onSelect).toHaveBeenCalledWith('warp-gate')
  })

  it('marks the active concept button', () => {
    render(<ConceptRail concepts={concepts} activeConceptId="warp-gate" onSelect={() => undefined} />)

    const activeButton = screen.getByRole('button', { name: 'Warp Gate' })
    expect(activeButton).toHaveAttribute('data-active', 'true')
    expect(activeButton).toHaveAttribute('aria-current', 'true')
  })
})
