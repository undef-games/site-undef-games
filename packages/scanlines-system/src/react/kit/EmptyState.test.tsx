import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { EmptyState } from './EmptyState'

afterEach(() => cleanup())

describe('EmptyState', () => {
  it('renders title, hint, and action when all props are provided', () => {
    render(
      <EmptyState
        title="No results found"
        hint="Try adjusting your filters"
        action={<button>Clear filters</button>}
      />
    )
    expect(screen.getByText('No results found')).toBeInTheDocument()
    expect(screen.getByText('Try adjusting your filters')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Clear filters' })).toBeInTheDocument()
  })

  it('renders only the title when hint and action are omitted', () => {
    render(<EmptyState title="Nothing here yet" />)
    expect(screen.getByText('Nothing here yet')).toBeInTheDocument()
    const hint = document.querySelector('.empty-state__hint')
    expect(hint).toBeNull()
  })
})
