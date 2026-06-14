import { useEffect, useState, type CSSProperties } from 'react'
import { StationControls } from '../station/station-controls'
import { StationGlyph, StationIdentity } from '../station/station-identity'
import { StationSignalScene } from '../station/station-signal-scene'
import { createStationState, detuneSignal, getStationStatus, resetSignal, tuneSignal } from '../station/station-state'
import { ChannelSelector, PacketDrift, SectionToy, SignalScope, STATION_CHANNELS } from '../station/station-toys'

export function AppShell() {
  const [stationState, setStationState] = useState(createStationState)
  const [scrollDepth, setScrollDepth] = useState(0)
  const [activeChannel, setActiveChannel] = useState(STATION_CHANNELS[0])
  const status = getStationStatus(stationState)

  const tune = () => setStationState((current) => tuneSignal(current, 25))
  const detune = () => setStationState((current) => detuneSignal(current, 25))
  const reset = () => setStationState(resetSignal)

  useEffect(() => {
    const updateScrollDepth = () => {
      const scrollable = Math.max(1, document.documentElement.scrollHeight - window.innerHeight)
      const landingRange = Math.min(scrollable, window.innerHeight * 1.6)
      setScrollDepth(Math.min(1, Math.max(0, window.scrollY / Math.max(1, landingRange))))
    }

    updateScrollDepth()
    window.addEventListener('scroll', updateScrollDepth, { passive: true })
    window.addEventListener('resize', updateScrollDepth)
    return () => {
      window.removeEventListener('scroll', updateScrollDepth)
      window.removeEventListener('resize', updateScrollDepth)
    }
  }, [])

  const landingStyle = { '--scroll-depth': scrollDepth } as CSSProperties

  return (
    <div className="station-shell" data-status={status.label.toLowerCase().replaceAll(' ', '-')} style={landingStyle}>
      <main className="landing-page">
        <section className="landing-hero" aria-label="undef games landing page">
          <div className="station-broadcast" aria-label="static station identity">
            <StationSignalScene state={stationState} scrollDepth={scrollDepth} channelMode={activeChannel.mode} />
            <StationGlyph signal={stationState.signal} className="hero-ghost-glyph" decorative />
            <PacketDrift activeChannel={activeChannel} />
            <div className="station-overlay" aria-hidden="true" />
            <div className="station-hero">
              <p className="station-kicker">
                <span>{activeChannel.label}</span>
                <span>Signal {stationState.signal}</span>
                <span>{status.label}</span>
              </p>
              <h1 aria-label="undef games">
                <span>undef</span>
                <span>games</span>
              </h1>
              <p className="station-copy">Systems, toys, and game-shaped experiments tuned out of undefined space.</p>
              <div className="station-actions" aria-label="landing actions">
                <a href="#signal">Tune signal</a>
                <a href="#identity">View identity</a>
              </div>
              <p className="station-status">{status.lock ? 'Signal locked' : status.label}</p>
            </div>
          </div>
          <aside className="station-sidebar" aria-label="station tools and identity">
            <StationControls state={stationState} onTune={tune} onDetune={detune} onReset={reset} />
            <ChannelSelector activeChannel={activeChannel} channels={STATION_CHANNELS} onSelect={setActiveChannel} />
            <SignalScope signal={stationState.signal} scrollDepth={scrollDepth} activeChannel={activeChannel} />
            <StationIdentity state={stationState} />
          </aside>
        </section>

        <section className="landing-section landing-section--signal" id="signal" aria-label="signal behavior">
          <SectionToy variant="signal" />
          <p className="section-kicker">Interactive field</p>
          <h2>Scanlines react to the hand and the page.</h2>
          <p>
            Move across the surface, scroll through the page, and tune the station. The signal field should feel alive
            without adding another symbol on top of the brand.
          </p>
        </section>

        <section className="landing-section landing-section--system" aria-label="undef games system">
          <SectionToy variant="system" />
          <p className="section-kicker">What it points at</p>
          <h2>Game infrastructure with a playable edge.</h2>
          <div className="landing-columns">
            <p>Party games, tabletop tools, simulation toys, and strange little systems.</p>
            <p>Retro-terminal texture without nostalgia cosplay or fake arcade dressing.</p>
            <p>A studio identity that can hold software, experiments, and finished games.</p>
          </div>
        </section>

        <section className="landing-section landing-section--identity" id="identity" aria-label="identity baseline">
          <SectionToy variant="identity" />
          <p className="section-kicker">Identity baseline</p>
          <h2>The mark stays quiet until the lockup needs it.</h2>
          <p>
            The Maze Gate U Cut is the saved mark. On the landing page, it lives as the identity lockup and as a dim,
            frosted background presence behind the broadcast, never as a hard symbol in the center of the scene.
          </p>
        </section>

        <section className="landing-final" aria-label="final call to action">
          <p>undef.games</p>
          <h2>More signal. Less explanation.</h2>
          <a href="#top" onClick={(event) => event.preventDefault()}>
            Station baseline saved
          </a>
        </section>
      </main>
    </div>
  )
}
