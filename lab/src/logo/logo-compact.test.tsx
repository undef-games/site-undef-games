import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { concepts } from '../concepts/registry'
import { LogoCompact } from './logo-compact'

afterEach(() => {
  cleanup()
})

const defineConcept = concepts.find((c) => c.id === 'define-the-game')!
const consoleConcept = concepts.find((c) => c.id === 'command-console')!
const boardConcept = concepts.find((c) => c.id === 'rule-board')!

describe('LogoCompact', () => {
  it('renders the compact text for define-the-game', () => {
    render(<LogoCompact concept={defineConcept} />)
    expect(screen.getByText('??/>')).toBeInTheDocument()
  })

  it('renders the compact text for command-console', () => {
    render(<LogoCompact concept={consoleConcept} />)
    expect(screen.getByText('>_')).toBeInTheDocument()
  })

  it('renders the compact text for rule-board', () => {
    render(<LogoCompact concept={boardConcept} />)
    expect(screen.getByText('R-6')).toBeInTheDocument()
  })

  it('stamps the concept id and layout onto the wrapper element', () => {
    const { container } = render(<LogoCompact concept={consoleConcept} />)
    const wrapper = container.querySelector('.logo-compact')!

    expect(wrapper.getAttribute('data-concept')).toBe('command-console')
    expect(wrapper.getAttribute('data-layout')).toBe('console')
  })

  it('stamps different concept ids and layouts for each concept', () => {
    const { container: c1 } = render(<LogoCompact concept={defineConcept} />)
    const { container: c2 } = render(<LogoCompact concept={boardConcept} />)

    expect(c1.querySelector('.logo-compact')!.getAttribute('data-concept')).toBe('define-the-game')
    expect(c1.querySelector('.logo-compact')!.getAttribute('data-layout')).toBe('resolve')
    expect(c2.querySelector('.logo-compact')!.getAttribute('data-concept')).toBe('rule-board')
    expect(c2.querySelector('.logo-compact')!.getAttribute('data-layout')).toBe('board')
  })
})
