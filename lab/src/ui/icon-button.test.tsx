import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { IconButton } from './icon-button'

afterEach(() => cleanup())

describe('IconButton', () => {
  it('renders a button with type="button"', () => {
    render(<IconButton>Click me</IconButton>)
    const btn = screen.getByRole('button', { name: 'Click me' })
    expect(btn).toHaveAttribute('type', 'button')
  })

  it('renders children inside the button', () => {
    render(<IconButton>Label text</IconButton>)
    expect(screen.getByText('Label text')).toBeInTheDocument()
  })

  it('forwards onClick and calls it with the click event', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<IconButton onClick={onClick}>Press</IconButton>)
    await user.click(screen.getByRole('button', { name: 'Press' }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('forwards arbitrary HTML button attributes', () => {
    render(<IconButton aria-label="icon" disabled className="special">X</IconButton>)
    const btn = screen.getByRole('button', { name: 'icon' })
    expect(btn).toBeDisabled()
    expect(btn).toHaveClass('special')
  })

  it('a disabled button is not clickable', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<IconButton onClick={onClick} disabled>No-op</IconButton>)
    await user.click(screen.getByRole('button', { name: 'No-op' }))
    expect(onClick).not.toHaveBeenCalled()
  })
})
