import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { AppShell } from './app-shell'

afterEach(() => cleanup())

describe('AppShell', () => {
  it('renders the shell heading and compare tray placeholder', () => {
    render(<AppShell />)
    expect(screen.getByText(/undef logos/i)).toBeInTheDocument()
    expect(screen.getByText(/compare tray/i)).toBeInTheDocument()
  })

  it('applies the active concept system label', () => {
    render(<AppShell />)
    expect(screen.getByText(/Prompt Cursor \/ terminal cursor lockup/i)).toBeInTheDocument()
  })
})
