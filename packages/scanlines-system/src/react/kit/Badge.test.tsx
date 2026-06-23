import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { Badge, StatusPill } from './Badge'

afterEach(() => cleanup())

describe('Badge', () => {
  it('uses the neutral class when tone is omitted (default)', () => {
    render(<Badge>Admin</Badge>)
    const el = screen.getByText('Admin')
    expect(el).toHaveClass('badge')
    expect(el).toHaveClass('badge--neutral')
  })

  it('uses the specified tone class when an explicit tone is provided', () => {
    render(<Badge tone="danger">Revoked</Badge>)
    const el = screen.getByText('Revoked')
    expect(el).toHaveClass('badge')
    expect(el).toHaveClass('badge--danger')
  })
})

describe('StatusPill', () => {
  it('defaults to data-tone="neutral" and renders the aria-hidden dot when tone is omitted', () => {
    const { container } = render(<StatusPill>Active</StatusPill>)
    const pill = container.firstElementChild as HTMLElement
    expect(pill).toHaveAttribute('data-tone', 'neutral')
    const dot = pill.querySelector('.status-pill__dot')
    expect(dot).not.toBeNull()
    expect(dot).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('applies the explicit tone via data-tone attribute', () => {
    const { container } = render(<StatusPill tone="positive">Granted</StatusPill>)
    const pill = container.firstElementChild as HTMLElement
    expect(pill).toHaveAttribute('data-tone', 'positive')
  })
})
