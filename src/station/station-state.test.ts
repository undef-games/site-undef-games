import { describe, expect, it } from 'vitest'
import { createStationState, detuneSignal, getStationStatus, resetSignal, tuneSignal } from './station-state'

describe('station state', () => {
  it('starts as a dead channel with no signal', () => {
    const state = createStationState()

    expect(state.signal).toBe(0)
    expect(getStationStatus(state)).toEqual({
      label: 'NO SIGNAL',
      channel: 'CH 00',
      lock: false,
      interference: 1,
    })
  })

  it('tunes signal strength through searching and syncing into a locked signal', () => {
    let state = createStationState()

    state = tuneSignal(state, 25)
    expect(getStationStatus(state).label).toBe('SEARCHING')

    state = tuneSignal(state, 35)
    expect(getStationStatus(state).label).toBe('SYNCING')

    state = tuneSignal(state, 40)
    expect(state.signal).toBe(100)
    expect(getStationStatus(state)).toMatchObject({
      label: 'LOCKED',
      lock: true,
      interference: 0,
    })
  })

  it('detunes and resets without leaving the 0 to 100 signal range', () => {
    let state = createStationState({ signal: 95 })

    state = tuneSignal(state, 20)
    expect(state.signal).toBe(100)

    state = detuneSignal(state, 140)
    expect(state.signal).toBe(0)

    state = tuneSignal(state, 55)
    state = resetSignal(state)
    expect(state.signal).toBe(0)
    expect(getStationStatus(state).label).toBe('NO SIGNAL')
  })
})
