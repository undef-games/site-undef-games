import { describe, expect, it } from 'vitest'
import { conceptLanes } from './lanes'

describe('conceptLanes', () => {
  it('contains exactly 3 lanes', () => {
    expect(conceptLanes).toHaveLength(3)
  })

  it('includes terminal-systems-retrofuture as the first lane', () => {
    expect(conceptLanes[0]).toBe('terminal-systems-retrofuture')
  })

  it('includes generative-procedural-simulation as the second lane', () => {
    expect(conceptLanes[1]).toBe('generative-procedural-simulation')
  })

  it('includes play-toolmaking-game-objects as the third lane', () => {
    expect(conceptLanes[2]).toBe('play-toolmaking-game-objects')
  })

  it('matches the exact ordered tuple', () => {
    expect([...conceptLanes]).toEqual([
      'terminal-systems-retrofuture',
      'generative-procedural-simulation',
      'play-toolmaking-game-objects',
    ])
  })
})
