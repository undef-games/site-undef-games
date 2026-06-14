import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { AppShell } from './app-shell'

afterEach(() => cleanup())

describe('AppShell', () => {
  it('renders the shell heading and compare tray placeholder', () => {
    render(<AppShell />)
    expect(screen.getByText(/undef logos/i)).toBeInTheDocument()
    expect(screen.getByText(/prototypes/i)).toBeInTheDocument()
  })

  it('applies the active concept system label', () => {
    render(<AppShell />)
    expect(screen.getByText(/Define the Game \/ undefined/i)).toBeInTheDocument()
  })

  it('turns Define the Game into a playable mark by defining three rules', async () => {
    const user = userEvent.setup()
    render(<AppShell />)

    await user.click(screen.getByRole('button', { name: /define world/i }))
    await user.click(screen.getByRole('button', { name: /define move/i }))
    await user.click(screen.getByRole('button', { name: /define win/i }))

    expect(screen.getByText(/Define the Game \/ playable/i)).toBeInTheDocument()
    expect(screen.getByText(/world \/ move \/ win/i)).toBeInTheDocument()
  })

  it('compiles the console mark from typed commands and preserves progress across concepts', async () => {
    const user = userEvent.setup()
    render(<AppShell />)

    await user.click(screen.getByRole('button', { name: 'Command Console' }))
    await user.type(screen.getByLabelText(/command input/i), 'define world')
    await user.click(screen.getByRole('button', { name: /run command/i }))

    expect(screen.getByText(/Command Console \/ compile/i)).toBeInTheDocument()
    expect(screen.getByText(/ok: define world/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Rule Board' }))
    await user.click(screen.getByRole('button', { name: 'Command Console' }))

    expect(screen.getByText(/Command Console \/ compile/i)).toBeInTheDocument()
  })

  it('routes the board into a locked path', async () => {
    const user = userEvent.setup()
    render(<AppShell />)

    await user.click(screen.getByRole('button', { name: 'Rule Board' }))
    await user.click(screen.getByRole('button', { name: /make illegal move/i }))
    await user.click(screen.getByRole('button', { name: /route to tile 10/i }))
    await user.click(screen.getByRole('button', { name: /route to tile 14/i }))

    expect(screen.getByText(/Rule Board \/ route locked/i)).toBeInTheDocument()
    expect(screen.getByText(/5 -> 6 -> 10 -> 14/i)).toBeInTheDocument()
  })
})
