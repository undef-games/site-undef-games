import { useEffect, useState } from 'react'
import { EffectsControls } from '../station/effects-controls'
import {
  BASELINE_EFFECTS,
  EFFECTS_PRESETS,
  createEffectsStyle,
  getEffectsTone,
  type EffectsPresetId,
  type EffectsSettings,
} from '../station/effects-config'
import { StationControls } from '../station/station-controls'
import { StationGlyph, StationIdentity } from '../station/station-identity'
import { StationSignalScene } from '../station/station-signal-scene'
import { createStationState, detuneSignal, getStationStatus, resetSignal, tuneSignal } from '../station/station-state'
import {
  ChannelSelector,
  PacketDrift,
  SectionToy,
  SignalScope,
  STATION_CHANNELS,
  type SectionEffectId,
  type SectionEffects,
  type SectionToyEffect,
} from '../station/station-toys'

const PRODUCT_LINKS = [
  {
    className: 'product-link--warp',
    description: 'Agent runtime platform for TradeWars automation, tools, and live operators.',
    href: 'https://warp.undef.games',
    label: 'TradeWars: WARP Agent Runtime Platform',
    tag: 'warp',
  },
  {
    className: 'product-link--dice',
    description: 'Fast dice, table helpers, and lightweight play tools for groups.',
    href: 'https://undefdice.com',
    label: 'Undef Dice',
    tag: 'dice',
  },
  {
    className: 'product-link--taybols',
    description: 'Table-shaped experiments, generators, and odd little game utilities.',
    href: 'https://taybols.undef.games',
    label: 'Taybols',
    tag: 'taybols',
  },
]

const DEFAULT_SECTION_EFFECTS: SectionEffects = {
  dice: 'bars',
  identity: 'tumble',
  projects: 'tumble',
  signal: 'bars',
  taybols: 'bars',
  warp: 'tumble',
}

export function AppShell() {
  const [stationState, setStationState] = useState(createStationState)
  const [scrollDepth, setScrollDepth] = useState(0)
  const [activeChannel, setActiveChannel] = useState(STATION_CHANNELS[0])
  const [effectsSettings, setEffectsSettings] = useState<EffectsSettings>(BASELINE_EFFECTS)
  const [activePresetId, setActivePresetId] = useState<EffectsPresetId | 'custom'>('current')
  const [sectionEffects, setSectionEffects] = useState<SectionEffects>(DEFAULT_SECTION_EFFECTS)
  const status = getStationStatus(stationState)

  const tune = () => setStationState((current) => tuneSignal(current, 25))
  const detune = () => setStationState((current) => detuneSignal(current, 25))
  const reset = () => setStationState(resetSignal)
  const applyEffectsPreset = (presetId: EffectsPresetId) => {
    const preset = EFFECTS_PRESETS.find((candidate) => candidate.id === presetId)
    if (!preset) return
    setEffectsSettings({ ...preset.settings })
    setActivePresetId(presetId)
  }
  const updateEffect = (key: keyof EffectsSettings, value: number | string) => {
    setEffectsSettings((current) => ({ ...current, [key]: value }))
    setActivePresetId('custom')
  }
  const updateSectionEffect = (sectionId: SectionEffectId, effect: SectionToyEffect) => {
    setSectionEffects((current) => ({ ...current, [sectionId]: effect }))
  }

  useEffect(() => {
    let animationFrame = 0
    let currentScrollDepth = 0
    let targetScrollDepth = 0
    const sectionProgress = new WeakMap<HTMLElement, number>()

    const updateTargets = () => {
      const scrollable = Math.max(1, document.documentElement.scrollHeight - window.innerHeight)
      const landingRange = Math.min(scrollable, window.innerHeight * 1.6)
      targetScrollDepth = Math.min(1, Math.max(0, window.scrollY / Math.max(1, landingRange)))
    }

    const animateScrollEffects = () => {
      currentScrollDepth += (targetScrollDepth - currentScrollDepth) * 0.16
      if (Math.abs(targetScrollDepth - currentScrollDepth) < 0.001) {
        currentScrollDepth = targetScrollDepth
      }
      setScrollDepth((current) => (Math.abs(current - currentScrollDepth) > 0.001 ? currentScrollDepth : current))

      document.querySelectorAll<HTMLElement>('.landing-section').forEach((section) => {
        const rect = section.getBoundingClientRect()
        const travel = window.innerHeight + rect.height
        const targetSectionProgress = Math.min(1, Math.max(0, (window.innerHeight - rect.top) / Math.max(1, travel)))
        const currentSectionProgress = sectionProgress.get(section) ?? targetSectionProgress
        let nextSectionProgress = currentSectionProgress + (targetSectionProgress - currentSectionProgress) * 0.16
        if (Math.abs(targetSectionProgress - nextSectionProgress) < 0.001) {
          nextSectionProgress = targetSectionProgress
        }
        sectionProgress.set(section, nextSectionProgress)
        section.style.setProperty('--section-progress', nextSectionProgress.toFixed(4))
      })

      animationFrame = window.requestAnimationFrame(animateScrollEffects)
    }

    updateTargets()
    animateScrollEffects()
    window.addEventListener('scroll', updateTargets, { passive: true })
    window.addEventListener('resize', updateTargets)
    return () => {
      window.cancelAnimationFrame(animationFrame)
      window.removeEventListener('scroll', updateTargets)
      window.removeEventListener('resize', updateTargets)
    }
  }, [])

  const landingStyle = createEffectsStyle(effectsSettings, scrollDepth)
  const activeTone =
    activePresetId === 'custom'
      ? getEffectsTone(effectsSettings)
      : (EFFECTS_PRESETS.find((preset) => preset.id === activePresetId)?.tone ?? getEffectsTone(effectsSettings))

  return (
    <div
      className="station-shell"
      data-status={status.label.toLowerCase().replaceAll(' ', '-')}
      data-tone={activeTone}
      style={landingStyle}
    >
      <main className="landing-page">
        <section className="landing-hero" aria-label="undef games landing page">
          <div className="station-broadcast" aria-label="static station identity">
            <StationSignalScene
              state={stationState}
              scrollDepth={scrollDepth}
              channelMode={activeChannel.mode}
              effects={effectsSettings}
            />
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
                <a href="#projects">View projects</a>
              </div>
              <p className="station-status">{status.lock ? 'Signal locked' : status.label}</p>
            </div>
          </div>
          <aside className="station-sidebar" aria-label="station tools and identity">
            <StationControls state={stationState} onTune={tune} onDetune={detune} onReset={reset} />
            <ChannelSelector activeChannel={activeChannel} channels={STATION_CHANNELS} onSelect={setActiveChannel} />
            <SignalScope signal={stationState.signal} scrollDepth={scrollDepth} activeChannel={activeChannel} />
            <EffectsControls
              activePresetId={activePresetId}
              settings={effectsSettings}
              sectionEffects={sectionEffects}
              onChange={updateEffect}
              onPreset={applyEffectsPreset}
              onSectionEffect={updateSectionEffect}
            />
            <StationIdentity state={stationState} />
          </aside>
        </section>

        <section className="landing-section landing-section--signal" id="signal" aria-label="signal behavior">
          <SectionToy variant="signal" effect={sectionEffects.signal} />
          <p className="section-kicker">Interactive field</p>
          <h2>Scanlines react to the hand and the page.</h2>
          <p>
            Move across the surface, scroll through the page, and tune the station. The signal field should feel alive
            without adding another symbol on top of the brand.
          </p>
        </section>

        <section className="landing-section landing-section--products" id="projects" aria-label="undef games projects">
          <SectionToy variant="system" effect={sectionEffects.projects} />
          <p className="section-kicker">Live routes</p>
          <h2>Actual projects on the network.</h2>
          <div className="product-link-list" aria-label="undef games project links">
            {PRODUCT_LINKS.map((product) => (
              <a key={product.href} className={`product-link ${product.className}`} href={product.href}>
                <span>{product.tag}</span>
                <strong>{product.label}</strong>
                <small>{product.description}</small>
              </a>
            ))}
          </div>
        </section>

        <section className="landing-section landing-section--warp" aria-label="TradeWars WARP Agent Runtime Platform">
          <SectionToy variant="signal" effect={sectionEffects.warp} />
          <p className="section-kicker">Runtime platform</p>
          <h2>TradeWars: WARP Agent Runtime Platform.</h2>
          <p>Agents, automation, and operator surfaces for a live TradeWars environment.</p>
          <a className="section-link" href="https://warp.undef.games">
            warp.undef.games
          </a>
        </section>

        <section className="landing-section landing-section--dice" aria-label="Undef Dice">
          <SectionToy variant="system" effect={sectionEffects.dice} />
          <p className="section-kicker">Table tools</p>
          <h2>Undef Dice keeps the table moving.</h2>
          <p>Dice and tabletop utilities that feel quick, readable, and useful during play.</p>
          <a className="section-link" href="https://undefdice.com">
            undefdice.com
          </a>
        </section>

        <section className="landing-section landing-section--taybols" aria-label="Taybols">
          <SectionToy variant="signal" effect={sectionEffects.taybols} />
          <p className="section-kicker">Game utilities</p>
          <h2>Taybols is where the smaller tools can stay strange.</h2>
          <p>Generators, table experiments, and playable oddities with room to become finished systems.</p>
          <a className="section-link" href="https://taybols.undef.games">
            taybols.undef.games
          </a>
        </section>

        <section className="landing-section landing-section--identity" id="identity" aria-label="identity baseline">
          <SectionToy variant="identity" effect={sectionEffects.identity} />
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
