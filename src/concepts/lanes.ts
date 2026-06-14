export const conceptLanes = [
  'terminal-systems-retrofuture',
  'generative-procedural-simulation',
  'play-toolmaking-game-objects',
] as const

export type ConceptLane = (typeof conceptLanes)[number]
