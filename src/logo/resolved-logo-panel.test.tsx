import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { concepts } from '../concepts/registry'
import { createInitialLogoPlayState } from './logo-play-state'
import { LogoMark } from './logo-mark'
import { ResolvedLogoPanel } from './resolved-logo-panel'

afterEach(() => {
  cleanup()
})

describe('ResolvedLogoPanel', () => {
  it('shows the concept name and current specimen state', () => {
    const concept = concepts[0]

    render(<ResolvedLogoPanel concept={concept} playState={createInitialLogoPlayState()} />)

    expect(screen.getByText(concept.name)).toBeInTheDocument()
    expect(screen.getByText(/undefined becomes playable \/ undefined/i)).toBeInTheDocument()
  })

  it('shows primary, symbol, and compact labels', () => {
    render(<ResolvedLogoPanel concept={concepts[0]} playState={createInitialLogoPlayState()} />)
    expect(screen.getByText(/primary/i)).toBeInTheDocument()
    expect(screen.getByText(/symbol/i)).toBeInTheDocument()
    expect(screen.getByText(/compact/i)).toBeInTheDocument()
  })

  it('keeps the logo mark accessible by default', () => {
    render(<LogoMark concept={concepts[0]} />)

    expect(screen.getByRole('img', { name: /logo mark/i })).toBeInTheDocument()
  })

  it('exposes one meaningful logo mark image and hides repeated decorative marks', () => {
    const concept = concepts[0]

    render(<ResolvedLogoPanel concept={concept} playState={createInitialLogoPlayState()} />)

    expect(screen.getByRole('img', { name: `${concept.name} logo mark` })).toBeInTheDocument()
    expect(screen.getAllByRole('img')).toHaveLength(1)
  })

  it('changes wordmark and compact output by concept system', () => {
    render(<ResolvedLogoPanel concept={concepts[1]} playState={createInitialLogoPlayState()} />)

    expect(screen.getByText('> build undef.games')).toBeInTheDocument()
    expect(screen.getByText('>_')).toBeInTheDocument()
    expect(screen.getByText(/compile a game identity/i)).toBeInTheDocument()
  })
})
