import type { LogoConcept } from '../concepts/types'

export type LogoSystem = {
  id: string
  wordmark: string
  compact: string
  descriptor: string
  layout: 'resolve' | 'console' | 'board'
  scene: 'define' | 'console' | 'board'
  phases: [string, string, string]
}

const systems: Record<string, LogoSystem> = {
  'define-the-game': {
    id: 'define-the-game',
    wordmark: 'undef games',
    compact: '??/>',
    descriptor: 'undefined becomes playable',
    layout: 'resolve',
    scene: 'define',
    phases: ['undefined', 'resolving', 'playable'],
  },
  'command-console': {
    id: 'command-console',
    wordmark: '> build undef.games',
    compact: '>_',
    descriptor: 'compile a game identity',
    layout: 'console',
    scene: 'console',
    phases: ['error', 'compile', 'run'],
  },
  'rule-board': {
    id: 'rule-board',
    wordmark: 'undef rules',
    compact: 'R-6',
    descriptor: 'one rule breaks the board',
    layout: 'board',
    scene: 'board',
    phases: ['setup', 'illegal move', 'route locked'],
  },
}

export function getLogoSystem(concept: LogoConcept): LogoSystem {
  return systems[concept.id] ?? systems['define-the-game']
}
