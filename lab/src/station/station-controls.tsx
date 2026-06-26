import { getStationStatus, type StationState } from '@undef-games/scanlines-system'

export function StationControls({
  state,
  onTune,
  onDetune,
  onReset,
}: {
  state: StationState
  onTune: () => void
  onDetune: () => void
  onReset: () => void
}) {
  const status = getStationStatus(state)

  return (
    <section className="station-controls" aria-label="station controls">
      <div>
        <p className="control-label">Signal {state.signal}</p>
        <div className="signal-meter" aria-label={`signal ${state.signal}`}>
          <span style={{ inlineSize: `${state.signal}%` }} />
        </div>
      </div>
      <div className="control-buttons">
        <button type="button" onClick={onTune}>
          Tune signal
        </button>
        <button type="button" onClick={onDetune}>
          Detune
        </button>
        <button type="button" onClick={onReset}>
          Reset
        </button>
      </div>
      <p className="lock-readout">{status.lock ? 'station lockup armed' : 'dead channel scan'}</p>
    </section>
  )
}
