import type { LogoConcept } from '../concepts/types'

export type LogoSystem = {
  id: string
  wordmark: string
  compact: string
  descriptor: string
  layout: 'inline' | 'stacked' | 'badge' | 'field'
  scene: 'cursor' | 'gate' | 'map' | 'glitch' | 'monogram' | 'play' | 'nodes' | 'tiles' | 'particles' | 'mutations' | 'dice' | 'burst' | 'pixel'
}

const systems: Record<string, LogoSystem> = {
  'prompt-cursor': {
    id: 'prompt-cursor',
    wordmark: 'undef_ games',
    compact: '>_',
    descriptor: 'terminal cursor lockup',
    layout: 'inline',
    scene: 'cursor',
  },
  'warp-gate': {
    id: 'warp-gate',
    wordmark: '[ undef games ]',
    compact: 'GATE',
    descriptor: 'portal bracket system',
    layout: 'stacked',
    scene: 'gate',
  },
  'wireframe-map': {
    id: 'wireframe-map',
    wordmark: 'undef / games',
    compact: 'MAP',
    descriptor: 'route-grid identity',
    layout: 'field',
    scene: 'map',
  },
  'brutalist-glitch': {
    id: 'brutalist-glitch',
    wordmark: 'UNDEF GAMES',
    compact: 'UG!',
    descriptor: 'offset slab mark',
    layout: 'badge',
    scene: 'glitch',
  },
  'ug-monogram': {
    id: 'ug-monogram',
    wordmark: 'undef games',
    compact: 'UG',
    descriptor: 'engineered monogram',
    layout: 'inline',
    scene: 'monogram',
  },
  'undefined-to-play': {
    id: 'undefined-to-play',
    wordmark: 'undef -> play',
    compact: 'PLAY',
    descriptor: 'resolved play signal',
    layout: 'stacked',
    scene: 'play',
  },
  'modular-nodes': {
    id: 'modular-nodes',
    wordmark: 'undef.games/node',
    compact: 'N3',
    descriptor: 'procedural node graph',
    layout: 'field',
    scene: 'nodes',
  },
  'tile-anomaly': {
    id: 'tile-anomaly',
    wordmark: 'undef games',
    compact: 'TILE',
    descriptor: 'ordered grid anomaly',
    layout: 'field',
    scene: 'tiles',
  },
  'emergence-chaos': {
    id: 'emergence-chaos',
    wordmark: 'undef games',
    compact: 'E*',
    descriptor: 'particle emergence',
    layout: 'badge',
    scene: 'particles',
  },
  'system-mutations': {
    id: 'system-mutations',
    wordmark: 'undef.games/v13',
    compact: 'MUT',
    descriptor: 'parametric variant stack',
    layout: 'stacked',
    scene: 'mutations',
  },
  'dice-pixel-dialogue': {
    id: 'dice-pixel-dialogue',
    wordmark: 'undef says games',
    compact: 'D6',
    descriptor: 'dice dialogue bubble',
    layout: 'badge',
    scene: 'dice',
  },
  'party-energy': {
    id: 'party-energy',
    wordmark: 'undef games!',
    compact: 'POP',
    descriptor: 'social token burst',
    layout: 'stacked',
    scene: 'burst',
  },
  'pixel-to-vector': {
    id: 'pixel-to-vector',
    wordmark: 'undef games',
    compact: 'PX',
    descriptor: 'pixel-to-vector bridge',
    layout: 'inline',
    scene: 'pixel',
  },
}

export function getLogoSystem(concept: LogoConcept): LogoSystem {
  return systems[concept.id] ?? systems['prompt-cursor']
}
