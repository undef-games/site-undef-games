import { describe, expect, it } from 'vitest'
import { concepts } from '../concepts/registry'
import { getLogoSystem } from './logo-system'

describe('getLogoSystem', () => {
  it('returns define-the-game system for the define-the-game concept', () => {
    const concept = concepts.find((c) => c.id === 'define-the-game')!
    const system = getLogoSystem(concept)

    expect(system.id).toBe('define-the-game')
    expect(system.wordmark).toBe('undef games')
    expect(system.compact).toBe('??/>')
    expect(system.descriptor).toBe('undefined becomes playable')
    expect(system.layout).toBe('resolve')
    expect(system.scene).toBe('define')
    expect(system.phases).toEqual(['undefined', 'resolving', 'playable'])
  })

  it('returns command-console system for the command-console concept', () => {
    const concept = concepts.find((c) => c.id === 'command-console')!
    const system = getLogoSystem(concept)

    expect(system.id).toBe('command-console')
    expect(system.wordmark).toBe('> build undef.games')
    expect(system.compact).toBe('>_')
    expect(system.descriptor).toBe('compile a game identity')
    expect(system.layout).toBe('console')
    expect(system.scene).toBe('console')
    expect(system.phases).toEqual(['error', 'compile', 'run'])
  })

  it('returns rule-board system for the rule-board concept', () => {
    const concept = concepts.find((c) => c.id === 'rule-board')!
    const system = getLogoSystem(concept)

    expect(system.id).toBe('rule-board')
    expect(system.wordmark).toBe('undef rules')
    expect(system.compact).toBe('R-6')
    expect(system.descriptor).toBe('one rule breaks the board')
    expect(system.layout).toBe('board')
    expect(system.scene).toBe('board')
    expect(system.phases).toEqual(['setup', 'illegal move', 'route locked'])
  })

  it('falls back to define-the-game system for an unknown concept id', () => {
    const unknownConcept = { ...concepts[0], id: 'not-a-real-concept' }
    const system = getLogoSystem(unknownConcept)

    expect(system.id).toBe('define-the-game')
    expect(system.wordmark).toBe('undef games')
    expect(system.layout).toBe('resolve')
  })

  it('returns a different system per concept — not the same object', () => {
    const defineConcept = concepts.find((c) => c.id === 'define-the-game')!
    const consoleConcept = concepts.find((c) => c.id === 'command-console')!

    const defineSystem = getLogoSystem(defineConcept)
    const consoleSystem = getLogoSystem(consoleConcept)

    expect(defineSystem.id).not.toBe(consoleSystem.id)
    expect(defineSystem.wordmark).not.toBe(consoleSystem.wordmark)
    expect(defineSystem.layout).not.toBe(consoleSystem.layout)
  })
})
