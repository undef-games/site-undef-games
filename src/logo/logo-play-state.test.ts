import { describe, expect, it } from 'vitest'
import {
  advanceConcept,
  createInitialLogoPlayState,
  getConceptPhase,
  getConceptProgress,
  resetConcept,
  submitConsoleCommand,
} from './logo-play-state'

describe('logo play state', () => {
  it('defines world, move, and win before the define mark becomes playable', () => {
    let state = createInitialLogoPlayState()

    state = advanceConcept(state, 'define-the-game')
    expect(state.defineRules).toEqual(['world'])
    expect(getConceptProgress('define-the-game', state)).toBe(1)
    expect(getConceptPhase('define-the-game', state)).toBe(1)

    state = advanceConcept(state, 'define-the-game')
    state = advanceConcept(state, 'define-the-game')

    expect(state.defineRules).toEqual(['world', 'move', 'win'])
    expect(getConceptProgress('define-the-game', state)).toBe(3)
    expect(getConceptPhase('define-the-game', state)).toBe(2)
  })

  it('compiles console commands in order and records invalid commands as errors', () => {
    let state = createInitialLogoPlayState()

    state = submitConsoleCommand(state, 'spawn player')
    expect(state.consoleHistory).toEqual([{ command: 'spawn player', status: 'error' }])
    expect(getConceptProgress('command-console', state)).toBe(0)
    expect(getConceptPhase('command-console', state)).toBe(0)

    state = submitConsoleCommand(state, 'define world')
    state = submitConsoleCommand(state, 'spawn player')
    state = submitConsoleCommand(state, 'run game')

    expect(state.consoleHistory.slice(-3)).toEqual([
      { command: 'define world', status: 'ok' },
      { command: 'spawn player', status: 'ok' },
      { command: 'run game', status: 'ok' },
    ])
    expect(getConceptProgress('command-console', state)).toBe(3)
    expect(getConceptPhase('command-console', state)).toBe(2)
  })

  it('routes the board through an illegal move before locking the mark path', () => {
    let state = createInitialLogoPlayState()

    expect(state.boardPath).toEqual([5])
    state = advanceConcept(state, 'rule-board')
    expect(state.boardIllegalMove).toBe(true)
    expect(state.boardPath).toEqual([5, 6])
    expect(getConceptPhase('rule-board', state)).toBe(1)

    state = advanceConcept(state, 'rule-board')
    state = advanceConcept(state, 'rule-board')

    expect(state.boardPath).toEqual([5, 6, 10, 14])
    expect(getConceptProgress('rule-board', state)).toBe(3)
    expect(getConceptPhase('rule-board', state)).toBe(2)
  })

  it('resets only the selected concept state', () => {
    let state = createInitialLogoPlayState()
    state = advanceConcept(state, 'define-the-game')
    state = submitConsoleCommand(state, 'define world')

    state = resetConcept(state, 'define-the-game')

    expect(state.defineRules).toEqual([])
    expect(state.consoleHistory).toEqual([{ command: 'define world', status: 'ok' }])
  })
})
