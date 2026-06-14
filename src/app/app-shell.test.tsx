import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { AppShell } from './app-shell'

afterEach(() => cleanup())

describe('AppShell', () => {
  it('renders the static station identity surface', () => {
    render(<AppShell />)

    expect(screen.getByRole('heading', { name: /undef games/i })).toBeInTheDocument()
    expect(screen.getAllByText(/NO SIGNAL/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/CH 00/i).length).toBeGreaterThan(0)
    expect(screen.getByLabelText(/interactive station signal/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/undef games maze gate u cut mark/i)).toBeInTheDocument()
    expect(screen.queryByText(/undef logos/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/^LIVE$/i)).not.toBeInTheDocument()
  })

  it('keeps tuning controls in the right sidebar instead of the broadcast field', () => {
    render(<AppShell />)

    const controls = screen.getByLabelText(/station controls/i)
    const broadcast = screen.getByLabelText(/static station identity/i)
    const sidebar = screen.getByLabelText(/station tools and identity/i)

    expect(broadcast).not.toContainElement(controls)
    expect(sidebar).toContainElement(controls)
  })

  it('keeps the identity rail focused on the selected mark instead of exploration boards', () => {
    render(<AppShell />)

    expect(screen.queryByLabelText(/symbol directions/i)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/focused variants/i)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/style probes/i)).not.toBeInTheDocument()
  })

  it('tunes the dead channel into a locked station ID without live broadcast copy', async () => {
    const user = userEvent.setup()
    render(<AppShell />)

    await user.click(screen.getByRole('button', { name: /tune signal/i }))
    await user.click(screen.getByRole('button', { name: /tune signal/i }))
    await user.click(screen.getByRole('button', { name: /tune signal/i }))
    await user.click(screen.getByRole('button', { name: /tune signal/i }))

    expect(screen.getAllByText(/LOCKED/i).length).toBeGreaterThan(0)
    expect(screen.queryByText(/^LIVE$/i)).not.toBeInTheDocument()
    expect(screen.getByLabelText(/signal 100/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/station lockup/i)).toBeInTheDocument()
  })

  it('detunes and resets the station', async () => {
    const user = userEvent.setup()
    render(<AppShell />)

    await user.click(screen.getByRole('button', { name: /tune signal/i }))
    await user.click(screen.getByRole('button', { name: /detune/i }))
    expect(screen.getAllByText(/NO SIGNAL/i).length).toBeGreaterThan(0)

    await user.click(screen.getByRole('button', { name: /tune signal/i }))
    await user.click(screen.getByRole('button', { name: /reset/i }))
    expect(screen.getByLabelText(/signal 0/i)).toBeInTheDocument()
  })

  it('does not tune from an incidental scene click', async () => {
    const user = userEvent.setup()
    render(<AppShell />)

    await user.click(screen.getByLabelText(/interactive station signal/i))

    expect(screen.getByLabelText(/signal 0/i)).toBeInTheDocument()
    expect(screen.getAllByText(/NO SIGNAL/i).length).toBeGreaterThan(0)
  })
})
