import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { PromptPanel } from './prompt-panel'

afterEach(() => cleanup())

describe('PromptPanel', () => {
  it('renders the panel heading', () => {
    render(<PromptPanel prompt="Test prompt" />)
    expect(screen.getByRole('heading', { name: 'Prompt' })).toBeInTheDocument()
  })

  it('renders the prompt text', () => {
    render(<PromptPanel prompt="An undefined signal resolves through play." />)
    expect(screen.getByText('An undefined signal resolves through play.')).toBeInTheDocument()
  })

  it('renders a different prompt text when prop changes', () => {
    const { rerender } = render(<PromptPanel prompt="First prompt" />)
    expect(screen.getByText('First prompt')).toBeInTheDocument()
    rerender(<PromptPanel prompt="Second prompt" />)
    expect(screen.getByText('Second prompt')).toBeInTheDocument()
    expect(screen.queryByText('First prompt')).not.toBeInTheDocument()
  })
})
