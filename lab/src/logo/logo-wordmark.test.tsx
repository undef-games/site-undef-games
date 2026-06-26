import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { concepts } from '../concepts/registry'
import { LogoWordmark } from './logo-wordmark'

afterEach(() => {
  cleanup()
})

const defineConcept = concepts.find((c) => c.id === 'define-the-game')!
const consoleConcept = concepts.find((c) => c.id === 'command-console')!
const boardConcept = concepts.find((c) => c.id === 'rule-board')!

describe('LogoWordmark', () => {
  it('renders the wordmark text for define-the-game', () => {
    render(<LogoWordmark concept={defineConcept} />)
    expect(screen.getByText('undef games')).toBeInTheDocument()
  })

  it('renders the wordmark text for command-console', () => {
    render(<LogoWordmark concept={consoleConcept} />)
    expect(screen.getByText('> build undef.games')).toBeInTheDocument()
  })

  it('renders the wordmark text for rule-board', () => {
    render(<LogoWordmark concept={boardConcept} />)
    expect(screen.getByText('undef rules')).toBeInTheDocument()
  })

  it('stamps the concept id and layout onto the wrapper element', () => {
    const { container } = render(<LogoWordmark concept={consoleConcept} />)
    const wrapper = container.querySelector('.logo-wordmark')!

    expect(wrapper.getAttribute('data-concept')).toBe('command-console')
    expect(wrapper.getAttribute('data-layout')).toBe('console')
  })

  it('stamps layout=resolve for define-the-game and layout=board for rule-board', () => {
    const { container: c1 } = render(<LogoWordmark concept={defineConcept} />)
    const { container: c2 } = render(<LogoWordmark concept={boardConcept} />)

    expect(c1.querySelector('.logo-wordmark')!.getAttribute('data-layout')).toBe('resolve')
    expect(c2.querySelector('.logo-wordmark')!.getAttribute('data-layout')).toBe('board')
  })

  it('shows phase 0 name (undefined) by default', () => {
    render(<LogoWordmark concept={defineConcept} />)
    expect(screen.getByText(/^undefined \/ 0 of 3$/)).toBeInTheDocument()
  })

  it('shows phase 1 name (resolving) at phase=1', () => {
    render(<LogoWordmark concept={defineConcept} phase={1} />)
    expect(screen.getByText(/^resolving \/ 1 of 3$/)).toBeInTheDocument()
  })

  it('shows phase 2 name (playable) at phase=2', () => {
    render(<LogoWordmark concept={defineConcept} phase={2} />)
    expect(screen.getByText(/^playable \/ 2 of 3$/)).toBeInTheDocument()
  })

  it('wraps phase index modulo the phases length', () => {
    // phase 3 % 3 = 0 → 'undefined'
    render(<LogoWordmark concept={defineConcept} phase={3} />)
    expect(screen.getByText(/^undefined \/ 3 of 3$/)).toBeInTheDocument()
  })

  it('shows the progress value independently from phase', () => {
    render(<LogoWordmark concept={defineConcept} phase={1} progress={2} />)
    // phase 1 → 'resolving'; progress 2
    expect(screen.getByText(/^resolving \/ 2 of 3$/)).toBeInTheDocument()
  })

  it('defaults progress to phase value when not provided', () => {
    render(<LogoWordmark concept={consoleConcept} phase={2} />)
    expect(screen.getByText(/^run \/ 2 of 3$/)).toBeInTheDocument()
  })
})
