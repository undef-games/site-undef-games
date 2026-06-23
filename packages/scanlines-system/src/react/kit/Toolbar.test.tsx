import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { Toolbar } from './Toolbar'

afterEach(() => cleanup())

describe('Toolbar', () => {
  it('renders the toolbar with a title heading and a child action button', () => {
    render(
      <Toolbar title="Users">
        <button type="button">Add User</button>
      </Toolbar>
    )
    const toolbar = screen.getByRole('toolbar')
    expect(toolbar).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Users' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add User' })).toBeInTheDocument()
  })

  it('renders the toolbar without a heading when title is omitted, but still renders children', () => {
    render(
      <Toolbar>
        <button type="button">Refresh</button>
      </Toolbar>
    )
    const toolbar = screen.getByRole('toolbar')
    expect(toolbar).toBeInTheDocument()
    expect(screen.queryByRole('heading')).toBeNull()
    expect(screen.getByRole('button', { name: 'Refresh' })).toBeInTheDocument()
  })
})
