import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { createEffectsStyle } from '../station/effects-style'
import { StationGlyph } from '../station/station-identity'
import { StationSignalScene } from '../station/station-signal-scene'
import { createStationState, getStationStatus } from '../station/station-state'
import {
  PacketDrift,
  SectionToy,
  STATION_CHANNELS,
  type SectionToyEffect,
} from '../station/station-toys'
import { createDefaultThemeState, getActiveThemeSettings, readThemeState, type ThemeState } from '../theme/persistence'
import { readSiteSurfaceCopy } from './site-copy-loader'

export function SiteApp() {
  const [stationState] = useState(() => createStationState({ signal: 50 }))
  const [scrollDepth, setScrollDepth] = useState(0)
  const [themeState, setThemeState] = useState<ThemeState>(() => readThemeState() ?? createDefaultThemeState())
  const [copy] = useState(() => readSiteSurfaceCopy())
  const stationBroadcastRef = useRef<HTMLDivElement | null>(null)
  const effectsSettings = getActiveThemeSettings(themeState)
  const effectsSettingsRef = useRef(effectsSettings)
  const activeChannel = STATION_CHANNELS[1]
  const sectionEffects = themeState.sectionEffects
  const scanlineEngine = themeState.scanlineEngine
  const scanlineLayers = themeState.scanlineLayers
  const status = getStationStatus(stationState)

  useEffect(() => {
    effectsSettingsRef.current = effectsSettings
  }, [effectsSettings])

  useEffect(() => {
    const syncThemeState = () => {
      const nextTheme = readThemeState()
      if (nextTheme) setThemeState(nextTheme)
    }

    window.addEventListener('storage', syncThemeState)
    window.addEventListener('undef-theme-change', syncThemeState)

    return () => {
      window.removeEventListener('storage', syncThemeState)
      window.removeEventListener('undef-theme-change', syncThemeState)
    }
  }, [])

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
      const inertia = Math.min(0.5, Math.max(0.02, effectsSettingsRef.current.scrollInertia))
      currentScrollDepth += (targetScrollDepth - currentScrollDepth) * inertia
      if (Math.abs(targetScrollDepth - currentScrollDepth) < 0.001) currentScrollDepth = targetScrollDepth
      setScrollDepth((current) => (Math.abs(current - currentScrollDepth) > 0.001 ? currentScrollDepth : current))

      document.querySelectorAll<HTMLElement>('.landing-section').forEach((section) => {
        const rect = section.getBoundingClientRect()
        const travel = window.innerHeight + rect.height
        const targetSectionProgress = Math.min(1, Math.max(0, (window.innerHeight - rect.top) / Math.max(1, travel)))
        const currentSectionProgress = sectionProgress.get(section) ?? targetSectionProgress
        let nextSectionProgress = currentSectionProgress + (targetSectionProgress - currentSectionProgress) * inertia
        if (Math.abs(targetSectionProgress - nextSectionProgress) < 0.001) nextSectionProgress = targetSectionProgress
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

  if (!copy) return null

  const landingStyle = createEffectsStyle(effectsSettings, scrollDepth)
  const shellStyle = landingStyle as CSSProperties

  const renderSectionToy = (variant: 'signal' | 'system' | 'identity', effect: SectionToyEffect) => (
    <SectionToy variant={variant} effect={effect} />
  )

  return (
    <div
      className="station-shell station-shell--site"
      data-scan-graph={scanlineLayers.graph}
      data-scan-crt={scanlineLayers.crt}
      data-scan-glitch={scanlineLayers.glitch}
      data-surface="site"
      data-status={status.label.toLowerCase().replaceAll(' ', '-')}
      data-tone={themeState.activeTone}
      style={shellStyle}
    >
      <main className="landing-page">
        <section className="landing-hero" aria-label="undef games landing page">
          <div ref={stationBroadcastRef} className="station-broadcast" aria-label="static station identity">
            <StationSignalScene
              state={stationState}
              scanlineEngine={scanlineEngine}
              scrollDepth={scrollDepth}
              channelMode={activeChannel.mode}
              effects={effectsSettings}
            />
            <StationGlyph signal={stationState.signal} className="hero-ghost-glyph" decorative />
            <PacketDrift activeChannel={activeChannel} />
            <div className="station-overlay" aria-hidden="true">
              <span className="station-overlay-layer station-overlay-layer--graph" />
              <span className="station-overlay-layer station-overlay-layer--crt" />
              <span className="station-overlay-layer station-overlay-layer--glitch" />
            </div>
            <div className="station-hero">
              <p className="station-kicker">
                <span>{activeChannel.label}</span>
                <span>Signal {stationState.signal}</span>
                <span>{status.label}</span>
              </p>
              <h1 aria-label={copy.hero.title}>
                <span>undef</span>
                <span>games</span>
              </h1>
              <p className="station-copy">{copy.hero.support}</p>
              <div className="station-actions" aria-label="landing actions">
                <a href={copy.hero.primaryAction.href}>{copy.hero.primaryAction.label}</a>
                <a href={copy.hero.secondaryAction.href}>{copy.hero.secondaryAction.label}</a>
              </div>
              <p className="station-status">{status.lock ? 'Signal locked' : copy.hero.statusLabel}</p>
            </div>
          </div>
        </section>

        <section className="landing-section landing-section--signal" id="signal" aria-label="signal behavior">
          {renderSectionToy('signal', sectionEffects.signal as SectionToyEffect)}
          <p className="section-kicker">{copy.sections.signal.kicker}</p>
          <h2>{copy.sections.signal.title}</h2>
          <p>{copy.sections.signal.body}</p>
        </section>

        <section className="landing-section landing-section--products" id="projects" aria-label="undef games projects">
          {renderSectionToy('system', sectionEffects.projects as SectionToyEffect)}
          <p className="section-kicker">{copy.sections.projects.kicker}</p>
          <h2>{copy.sections.projects.title}</h2>
          <div className="product-link-list" aria-label="undef games project links">
            {copy.projects.map((product) => (
              <a key={product.href} className={`product-link ${product.className}`} href={product.href}>
                <span>{product.tag}</span>
                <strong>{product.label}</strong>
                <small>{product.description}</small>
              </a>
            ))}
          </div>
        </section>

        <section className="landing-section landing-section--warp" aria-label="TradeWars WARP Agent Runtime Platform">
          {renderSectionToy('signal', sectionEffects.warp as SectionToyEffect)}
          <p className="section-kicker">{copy.sections.warp.kicker}</p>
          <h2>{copy.sections.warp.title}</h2>
          <p>{copy.sections.warp.body}</p>
          <a className="section-link" href={copy.sections.warp.href}>
            {copy.sections.warp.linkLabel}
          </a>
        </section>

        <section className="landing-section landing-section--dice" aria-label="Undef Dice">
          {renderSectionToy('system', sectionEffects.dice as SectionToyEffect)}
          <p className="section-kicker">{copy.sections.dice.kicker}</p>
          <h2>{copy.sections.dice.title}</h2>
          <p>{copy.sections.dice.body}</p>
          <a className="section-link" href={copy.sections.dice.href}>
            {copy.sections.dice.linkLabel}
          </a>
        </section>

        <section className="landing-section landing-section--taybols" aria-label="Taybols">
          {renderSectionToy('signal', sectionEffects.taybols as SectionToyEffect)}
          <p className="section-kicker">{copy.sections.taybols.kicker}</p>
          <h2>{copy.sections.taybols.title}</h2>
          <p>{copy.sections.taybols.body}</p>
          <a className="section-link" href={copy.sections.taybols.href}>
            {copy.sections.taybols.linkLabel}
          </a>
        </section>

        <section className="landing-section landing-section--identity" id="identity" aria-label="identity baseline">
          {renderSectionToy('identity', sectionEffects.identity as SectionToyEffect)}
          <p className="section-kicker">{copy.sections.identity.kicker}</p>
          <h2>{copy.sections.identity.title}</h2>
          <p>{copy.sections.identity.body}</p>
        </section>

        <section className="landing-final" aria-label="final call to action">
          <p>{copy.sections.closing.kicker}</p>
          <h2>{copy.sections.closing.title}</h2>
          <a href="#top" onClick={(event) => event.preventDefault()}>
            {copy.sections.closing.action}
          </a>
        </section>
      </main>
    </div>
  )
}
