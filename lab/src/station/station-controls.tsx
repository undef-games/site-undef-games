import { ScanlinesButton, getStationStatus, type StationState } from '@undef-games/scanlines-system'
import { CONTROL_VARIANTS } from '../ui/control-variants'

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
        <ScanlinesButton type="button" variant={CONTROL_VARIANTS.tune} onClick={onTune}>
          Tune signal
        </ScanlinesButton>
        <ScanlinesButton type="button" variant={CONTROL_VARIANTS.detune} onClick={onDetune}>
          Detune
        </ScanlinesButton>
        <ScanlinesButton type="button" variant={CONTROL_VARIANTS.signalReset} onClick={onReset}>
          Reset
        </ScanlinesButton>
      </div>
      <p className="lock-readout">{status.lock ? 'station lockup armed' : 'dead channel scan'}</p>
    </section>
  )
}
