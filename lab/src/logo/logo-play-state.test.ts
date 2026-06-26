import { describe, expect, it } from 'vitest'
import {
  advanceConcept,
  boardRoute,
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

  it('advances command-console via advanceConcept using the next expected command', () => {
    let state = createInitialLogoPlayState()

    state = advanceConcept(state, 'command-console')
    expect(state.consoleHistory).toEqual([{ command: 'define world', status: 'ok' }])
    expect(getConceptProgress('command-console', state)).toBe(1)

    state = advanceConcept(state, 'command-console')
    state = advanceConcept(state, 'command-console')
    expect(getConceptProgress('command-console', state)).toBe(3)
    expect(getConceptPhase('command-console', state)).toBe(2)
  })

  it('advanceConcept returns unchanged state for an unknown conceptId', () => {
    const state = createInitialLogoPlayState()
    const next = advanceConcept(state, 'unknown-concept')
    expect(next).toBe(state)
  })

  it('resets command-console and rule-board state independently', () => {
    let state = createInitialLogoPlayState()
    state = advanceConcept(state, 'command-console')
    state = advanceConcept(state, 'rule-board')

    const afterConsoleReset = resetConcept(state, 'command-console')
    expect(afterConsoleReset.consoleHistory).toEqual([])
    expect(afterConsoleReset.boardPath).toEqual(state.boardPath)

    const afterBoardReset = resetConcept(state, 'rule-board')
    expect(afterBoardReset.boardPath).toEqual([boardRoute[0]])
    expect(afterBoardReset.boardIllegalMove).toBe(false)
    expect(afterBoardReset.consoleHistory).toEqual(state.consoleHistory)
  })

  it('resetConcept returns unchanged state for an unknown conceptId', () => {
    const state = createInitialLogoPlayState()
    const next = resetConcept(state, 'unknown-concept')
    expect(next).toBe(state)
  })

  it('getConceptProgress returns 0 for an unknown conceptId', () => {
    const state = createInitialLogoPlayState()
    expect(getConceptProgress('unknown-concept', state)).toBe(0)
  })

  it('submitConsoleCommand returns unchanged state for a blank command', () => {
    const state = createInitialLogoPlayState()
    const next = submitConsoleCommand(state, '   ')
    expect(next).toBe(state)
    expect(next.consoleHistory).toEqual([])
  })

  it('advanceConcept does not extend define-the-game past the last rule', () => {
    let state = createInitialLogoPlayState()
    state = advanceConcept(state, 'define-the-game')
    state = advanceConcept(state, 'define-the-game')
    state = advanceConcept(state, 'define-the-game')
    // All three rules defined — further advance returns same state
    const after = advanceConcept(state, 'define-the-game')
    expect(after).toBe(state)
    expect(after.defineRules).toEqual(['world', 'move', 'win'])
  })

  it('advanceConcept does not extend rule-board past the last route stop', () => {
    let state = createInitialLogoPlayState()
    state = advanceConcept(state, 'rule-board')
    state = advanceConcept(state, 'rule-board')
    state = advanceConcept(state, 'rule-board')
    // All stops reached — further advance returns same state
    const after = advanceConcept(state, 'rule-board')
    expect(after).toBe(state)
    expect(after.boardPath).toEqual([5, 6, 10, 14])
  })

  it('advanceConcept command-console falls back to first command after all commands are completed', () => {
    let state = createInitialLogoPlayState()
    // Complete all three commands
    state = advanceConcept(state, 'command-console')
    state = advanceConcept(state, 'command-console')
    state = advanceConcept(state, 'command-console')
    expect(getConceptProgress('command-console', state)).toBe(3)

    // Further advance: progress index 3 is out of bounds, fallback to consoleCommands[0] = 'define world'
    const after = advanceConcept(state, 'command-console')
    const lastEntry = after.consoleHistory[after.consoleHistory.length - 1]
    // consoleCommands[0] is 'define world'; status depends on expected at progress=3 (undefined) vs submitted
    expect(lastEntry.command).toBe('define world')
  })
})
