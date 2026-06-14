import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AppShell } from './app-shell'

describe('AppShell', () => {
  it('renders the shell heading and compare tray placeholder', () => {
    render(<AppShell />)
    expect(screen.getByText(/undef logos/i)).toBeInTheDocument()
    expect(screen.getByText(/compare tray/i)).toBeInTheDocument()
  })
})
