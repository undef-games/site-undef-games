export type StationState = {
  signal: number
}

export type StationStatus = {
  label: 'NO SIGNAL' | 'SEARCHING' | 'SYNCING' | 'LOCKED'
  channel: 'CH 00'
  lock: boolean
  interference: number
}

export function createStationState(initial?: Partial<StationState>): StationState {
  return {
    signal: clampSignal(initial?.signal ?? 0),
  }
}

export function tuneSignal(state: StationState, amount = 20): StationState {
  return { signal: clampSignal(state.signal + amount) }
}

export function detuneSignal(state: StationState, amount = 20): StationState {
  return { signal: clampSignal(state.signal - amount) }
}

export function resetSignal(_state: StationState): StationState {
  return createStationState()
}

export function getStationStatus(state: StationState): StationStatus {
  const signal = clampSignal(state.signal)
  const label = signal >= 85 ? 'LOCKED' : signal >= 50 ? 'SYNCING' : signal > 0 ? 'SEARCHING' : 'NO SIGNAL'

  return {
    label,
    channel: 'CH 00',
    lock: label === 'LOCKED',
    interference: Number((1 - signal / 100).toFixed(2)),
  }
}

function clampSignal(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.min(100, Math.max(0, Math.round(value)))
}
