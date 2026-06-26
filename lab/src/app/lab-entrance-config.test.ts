import { describe, expect, it } from 'vitest'
import { LAB_BACK_ENTRANCE } from './lab-entrance-config'

describe('LAB_BACK_ENTRANCE', () => {
  it('has the correct id', () => {
    expect(LAB_BACK_ENTRANCE.id).toBe('lab-back')
  })

  it('uses the geometric-genie effect', () => {
    expect(LAB_BACK_ENTRANCE.effect).toBe('geometric-genie')
  })

  it('has journey travel mode', () => {
    expect(LAB_BACK_ENTRANCE.travel).toBe('journey')
  })

  it('plays once', () => {
    expect(LAB_BACK_ENTRANCE.replay).toBe('once')
  })

  it('has spotlight role', () => {
    expect(LAB_BACK_ENTRANCE.role).toBe('spotlight')
  })

  it('has veil enabled', () => {
    expect(LAB_BACK_ENTRANCE.veil).toBe(true)
  })

  it('has a duration of 640ms', () => {
    expect(LAB_BACK_ENTRANCE.durationMs).toBe(640)
  })

  it('uses the correct storage key', () => {
    expect(LAB_BACK_ENTRANCE.storageKey).toBe('undef-prominent-back-seen')
  })

  it('matches the full expected config', () => {
    expect(LAB_BACK_ENTRANCE).toEqual({
      id: 'lab-back',
      effect: 'geometric-genie',
      travel: 'journey',
      replay: 'once',
      role: 'spotlight',
      veil: true,
      durationMs: 640,
      storageKey: 'undef-prominent-back-seen',
    })
  })
})
