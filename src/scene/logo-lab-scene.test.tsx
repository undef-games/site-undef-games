import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { LogoLabScene } from './logo-lab-scene'

describe('LogoLabScene', () => {
  it('renders the canvas region label', () => {
    render(<LogoLabScene activeConceptId="prompt-cursor" />)
    expect(screen.getByLabelText(/interactive logo scene/i)).toBeInTheDocument()
  })
})
