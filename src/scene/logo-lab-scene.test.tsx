import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { LogoLabScene } from './logo-lab-scene'
import { concepts } from '../concepts/registry'

describe('LogoLabScene', () => {
  it('renders the canvas region label', () => {
    render(<LogoLabScene concept={concepts[0]} />)
    expect(screen.getByLabelText(/interactive logo scene/i)).toHaveClass('scene-canvas')
  })
})
