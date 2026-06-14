export type LogoConceptId = 'define-the-game' | 'command-console' | 'rule-board'

export type ConsoleHistoryEntry = {
  command: string
  status: 'ok' | 'error'
}

export type LogoPlayState = {
  defineRules: string[]
  consoleHistory: ConsoleHistoryEntry[]
  boardPath: number[]
  boardIllegalMove: boolean
}

export const defineRules = ['world', 'move', 'win'] as const
export const consoleCommands = ['define world', 'spawn player', 'run game'] as const
export const boardRoute = [5, 6, 10, 14] as const

export function createInitialLogoPlayState(): LogoPlayState {
  return {
    defineRules: [],
    consoleHistory: [],
    boardPath: [boardRoute[0]],
    boardIllegalMove: false,
  }
}

export function advanceConcept(state: LogoPlayState, conceptId: string): LogoPlayState {
  if (conceptId === 'define-the-game') {
    const nextRule = defineRules[state.defineRules.length]
    return nextRule ? { ...state, defineRules: [...state.defineRules, nextRule] } : state
  }

  if (conceptId === 'command-console') {
    return submitConsoleCommand(state, consoleCommands[getConceptProgress('command-console', state)] ?? consoleCommands[0])
  }

  if (conceptId === 'rule-board') {
    const nextIndex = boardRoute[state.boardPath.length]
    if (nextIndex === undefined) return state

    return {
      ...state,
      boardPath: [...state.boardPath, nextIndex],
      boardIllegalMove: state.boardIllegalMove || nextIndex === 6,
    }
  }

  return state
}

export function submitConsoleCommand(state: LogoPlayState, rawCommand: string): LogoPlayState {
  const command = rawCommand.trim().toLowerCase()
  if (!command) return state

  const expected = consoleCommands[getConceptProgress('command-console', state)]
  const status = command === expected ? 'ok' : 'error'

  return {
    ...state,
    consoleHistory: [...state.consoleHistory, { command, status }],
  }
}

export function resetConcept(state: LogoPlayState, conceptId: string): LogoPlayState {
  if (conceptId === 'define-the-game') return { ...state, defineRules: [] }
  if (conceptId === 'command-console') return { ...state, consoleHistory: [] }
  if (conceptId === 'rule-board') return { ...state, boardPath: [boardRoute[0]], boardIllegalMove: false }
  return state
}

export function getConceptProgress(conceptId: string, state: LogoPlayState): number {
  if (conceptId === 'define-the-game') return Math.min(state.defineRules.length, defineRules.length)
  if (conceptId === 'command-console') {
    return Math.min(state.consoleHistory.filter((entry) => entry.status === 'ok').length, consoleCommands.length)
  }
  if (conceptId === 'rule-board') return Math.max(0, Math.min(state.boardPath.length - 1, boardRoute.length - 1))
  return 0
}

export function getConceptPhase(conceptId: string, state: LogoPlayState): number {
  const progress = getConceptProgress(conceptId, state)
  if (progress === 0) return 0
  if (progress >= 3) return 2
  return 1
}
