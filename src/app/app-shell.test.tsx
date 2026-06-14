import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AppShell } from './app-shell'

describe('AppShell', () => {
  it('renders the undef logos title', () => {
    render(<AppShell />)
    expect(screen.getByText(/undef logos/i)).toBeInTheDocument()
  })
})
