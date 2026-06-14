import { getStationStatus, type StationState } from './station-state'

export function StationIdentity({ state }: { state: StationState }) {
  const status = getStationStatus(state)

  return (
    <aside className="station-identity" aria-label="station identity specimens">
      <div className="identity-header">
        <p>Station ID</p>
        <span>{status.lock ? 'locked mark' : 'scan mark'}</span>
      </div>
      <div className="station-lockup" aria-label="station lockup">
        <StationGlyph signal={state.signal} />
        <div>
          <strong>undef games</strong>
          <small>{status.channel} / signal {state.signal}</small>
        </div>
      </div>
      <div className="identity-grid">
        <div className="channel-bug" aria-label="compact channel bug">
          <span>UG</span>
          <small>00</small>
        </div>
        <div className="no-signal-badge" aria-label="no signal badge">
          <span>{status.lock ? 'LOCKED' : 'SCAN'}</span>
        </div>
      </div>
    </aside>
  )
}

export function StationGlyph({
  signal,
  className = 'station-glyph',
  decorative = false,
}: {
  signal: number
  className?: string
  decorative?: boolean
}) {
  const lock = signal >= 85

  return (
    <svg
      className={className}
      viewBox="0 0 120 120"
      role={decorative ? undefined : 'img'}
      aria-hidden={decorative ? true : undefined}
      aria-label={decorative ? undefined : 'undef games maze gate u cut mark'}
      focusable="false"
    >
      <path d="M30 24v48c0 18 12 30 30 30s30-12 30-30V24" stroke="currentColor" strokeWidth="7" strokeLinecap="square" strokeLinejoin="miter" fill="none" />
      <path d="M46 24v46c0 9 5 14 14 14s14-5 14-14V24" stroke="currentColor" strokeWidth="7" strokeLinecap="square" strokeLinejoin="miter" fill="none" opacity={lock ? 0.72 : 0.4} />
      <path d="M30 44h18M72 44h18M44 98h32" stroke="currentColor" strokeWidth="7" strokeLinecap="square" fill="none" opacity={0.34 + signal / 150} />
    </svg>
  )
}
