import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { LogoLabScene } from './logo-lab-scene'
import { concepts } from '../concepts/registry'
import { createInitialLogoPlayState } from '../logo/logo-play-state'

describe('LogoLabScene', () => {
  it('renders the canvas region label', () => {
    render(<LogoLabScene concept={concepts[0]} playState={createInitialLogoPlayState()} onAdvance={() => undefined} />)
    expect(screen.getByLabelText(/interactive logo scene/i)).toHaveClass('scene-canvas')
  })
})
