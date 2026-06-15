import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ConceptRail } from './concept-rail'
import { concepts } from '../concepts/registry'

afterEach(() => cleanup())

describe('ConceptRail', () => {
  it('renders 3 concept buttons', () => {
    render(<ConceptRail concepts={concepts} activeConceptId="define-the-game" onSelect={() => undefined} />)
    expect(screen.getAllByRole('button')).toHaveLength(3)
  })

  it('calls onSelect with the selected concept id', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()

    render(<ConceptRail concepts={concepts} activeConceptId="define-the-game" onSelect={onSelect} />)
    await user.click(screen.getByRole('button', { name: 'Command Console' }))

    expect(onSelect).toHaveBeenCalledWith('command-console')
  })

  it('marks the active concept button', () => {
    render(<ConceptRail concepts={concepts} activeConceptId="command-console" onSelect={() => undefined} />)

    const activeButton = screen.getByRole('button', { name: 'Command Console' })
    expect(activeButton).toHaveAttribute('data-active', 'true')
    expect(activeButton).toHaveAttribute('aria-current', 'true')
  })
})
