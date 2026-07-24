import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { EffectsControls } from '../station/effects-controls'
import {
  addScanlineLayer,
  duplicateScanlineLayer,
  moveScanlineLayer,
  removeScanlineLayer,
  updateScanlineLayer as updateScanlineEngineLayerState,
  clearThemeState,
  createDefaultFullThemeState,
  createEffectsStyle,
  createStationState,
  detuneSignal,
  EFFECTS_PRESETS,
  getActiveThemeSettings,
  getStationStatus,
  ProminentEntrance,
  PROMINENT_ENTRANCE_EFFECTS,
  readFullThemeState,
  resetProminentEntrances,
  resetSignal,
  STATION_CHANNELS,
  tuneSignal,
  writeFullThemeState,
  ChannelSelector,
  PacketDrift,
  SectionToy,
  SignalScope,
  StationGlyph,
  StationIdentity,
  type EffectsPresetId,
  type EffectsSettings,
  type EffectsTone,
  type FullThemeState,
  type ProminentEntranceEffect,
  type ScanlineEngineState,
  type ScanlineLayerId,
  type ScanlineLayerMoveDirection,
  type ScanlineLayerPatch,
  type SectionEffectId,
  type SectionToyEffect,
} from '@undef-games/scanlines-system'
import { LAB_BACK_ENTRANCE } from './lab-entrance-config'
import { StationControls } from '../station/station-controls'
import { StationSignalScene } from '@undef-games/scanlines-system'
import { attachButtonPressFeedback } from '../ui/button-press-feedback'
import { LAB_HERO_COPY, LAB_PROJECTS, LAB_SECTIONS } from './site-copy'

export type AppShellSurface = 'lab' | 'site'

function resolveLabBackHref() {
  try {
    if (!document.referrer) return '/'
    const referrer = new URL(document.referrer)
    const current = new URL(window.location.href)
    if (referrer.origin !== current.origin || referrer.pathname === current.pathname) return '/'
    return `${referrer.pathname}${referrer.search}${referrer.hash}` || '/'
  } catch {
    return '/'
  }
}

export function AppShell({ surface = 'lab' }: { surface?: AppShellSurface }) {
  const isSiteSurface = surface === 'site'
  const [labBackHref, setLabBackHref] = useState('/')
  const [prominentReplaySeed, setProminentReplaySeed] = useState(0)
  const [prominentOriginReady, setProminentOriginReady] = useState(false)
  const [prominentOrigin, setProminentOrigin] = useState<{ x: number; y: number } | null>(null)
  // dev-only: ?entrance=<variant>&travel=<journey|contained> plays that entrance on the lab page (replays on refresh)
  const devEntranceParam = typeof window === 'undefined' ? null : new URLSearchParams(window.location.search).get('entrance')
  const devTravelParam = typeof window === 'undefined' ? null : new URLSearchParams(window.location.search).get('travel')
  const devEntrance =
    devEntranceParam && (PROMINENT_ENTRANCE_EFFECTS as readonly string[]).includes(devEntranceParam)
      ? (devEntranceParam as ProminentEntranceEffect)
      : null
  const labEntranceConfig = devEntrance
    ? {
        ...LAB_BACK_ENTRANCE,
        effect: devEntrance,
        travel: devTravelParam === 'contained' ? ('contained' as const) : ('journey' as const),
        replay: 'always' as const,
        veil: true,
      }
    : LAB_BACK_ENTRANCE
  const [stationState, setStationState] = useState(() => createStationState({ signal: isSiteSurface ? 50 : 0 }))
  const [scrollDepth, setScrollDepth] = useState(0)
  const [activeChannel, setActiveChannel] = useState(STATION_CHANNELS[0])
  const [themeState, setThemeState] = useState<FullThemeState>(() => readFullThemeState() ?? createDefaultFullThemeState())
  const effectsSettings = getActiveThemeSettings(themeState)
  const activePresetId = themeState.tones[themeState.activeTone].presetId
  const darkPresetId = themeState.tones.dark.presetId
  const lightPresetId = themeState.tones.light.presetId
  const sectionEffects = themeState.sectionEffects
  const scanlineEngine = themeState.scanlineEngine
  const scanlineLayers = themeState.scanlineLayers
  const effectsSettingsRef = useRef(effectsSettings)
  const stationBroadcastRef = useRef<HTMLDivElement | null>(null)
  const stationSidebarRef = useRef<HTMLElement | null>(null)
  const status = getStationStatus(stationState)

  const tune = () => setStationState((current) => tuneSignal(current, 25))
  const detune = () => setStationState((current) => detuneSignal(current, 25))
  const reset = () => setStationState(resetSignal)

  const updateThemeState = (updater: (current: FullThemeState) => FullThemeState) => {
    setThemeState((current) => {
      const next = updater(current)
      if (!isSiteSurface) {
        writeFullThemeState(next)
      }
      return next
    })
  }

  const applyEffectsPreset = (tone: EffectsTone, presetId: EffectsPresetId) => {
    const preset = EFFECTS_PRESETS.find((candidate) => candidate.id === presetId && candidate.tone === tone)
    if (!preset) return
    updateThemeState((current) => ({
      ...current,
      tones: {
        ...current.tones,
        [tone]: {
          presetId,
          settings: { ...preset.settings },
        },
      },
    }))
  }
  const updateActiveTone = (tone: EffectsTone) => {
    updateThemeState((current) => ({ ...current, activeTone: tone }))
  }
  const updateEffect = (key: keyof EffectsSettings, value: number | string) => {
    updateThemeState((current) => ({
      ...current,
      tones: {
        ...current.tones,
        [current.activeTone]: {
          presetId: 'custom',
          settings: { ...current.tones[current.activeTone].settings, [key]: value },
        },
      },
    }))
  }
  const updateSectionEffect = (sectionId: SectionEffectId, effect: SectionToyEffect) => {
    updateThemeState((current) => ({
      ...current,
      sectionEffects: { ...current.sectionEffects, [sectionId]: effect },
    }))
  }
  const updateScanlineBasePattern = (basePattern: ScanlineEngineState['basePattern']) => {
    updateThemeState((current) => ({
      ...current,
      scanlineEngine: { ...current.scanlineEngine, basePattern },
    }))
  }
  const addScanlineEngineLayer = () => {
    updateThemeState((current) => ({
      ...current,
      scanlineEngine: addScanlineLayer(current.scanlineEngine, current.scanlineEngine.basePattern),
    }))
  }
  const duplicateScanlineEngineLayer = (id: string) => {
    updateThemeState((current) => ({
      ...current,
      scanlineEngine: duplicateScanlineLayer(current.scanlineEngine, id),
    }))
  }
  const removeScanlineEngineLayer = (id: string) => {
    updateThemeState((current) => ({
      ...current,
      scanlineEngine: removeScanlineLayer(current.scanlineEngine, id),
    }))
  }
  const moveScanlineEngineLayer = (id: string, direction: ScanlineLayerMoveDirection) => {
    updateThemeState((current) => ({
      ...current,
      scanlineEngine: moveScanlineLayer(current.scanlineEngine, id, direction),
    }))
  }
  const updateScanlineEngineLayer = (id: string, patch: ScanlineLayerPatch) => {
    updateThemeState((current) => ({
      ...current,
      scanlineEngine: updateScanlineEngineLayerState(current.scanlineEngine, id, patch),
    }))
  }
  const updateScanlineLayer = (layerId: ScanlineLayerId, active: boolean) => {
    updateThemeState((current) => ({
      ...current,
      scanlineLayers: { ...current.scanlineLayers, [layerId]: active },
    }))
  }
  const resetTheme = () => {
    clearThemeState()
    setThemeState(createDefaultFullThemeState())
  }
  const resetProminent = () => {
    resetProminentEntrances([LAB_BACK_ENTRANCE])
    setProminentReplaySeed((current) => current + 1)
  }

  useEffect(() => {
    effectsSettingsRef.current = effectsSettings
  }, [effectsSettings])

  useEffect(() => {
    if (!isSiteSurface) setLabBackHref(resolveLabBackHref())
  }, [isSiteSurface])

  useLayoutEffect(() => {
    const broadcast = stationBroadcastRef.current
    if (!broadcast) return

    const updateProminentOrigin = () => {
      const rect = broadcast.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      setProminentOrigin({ x: centerX, y: centerY })
      setProminentOriginReady(rect.width > 0 && rect.height > 0)
    }

    updateProminentOrigin()

    const observer = new ResizeObserver(updateProminentOrigin)
    observer.observe(broadcast)
    window.addEventListener('resize', updateProminentOrigin)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', updateProminentOrigin)
    }
  }, [])

  useEffect(() => {
    const sidebar = stationSidebarRef.current
    if (!sidebar) return
    return attachButtonPressFeedback(sidebar)
  }, [])

  useEffect(() => {
    const syncThemeState = () => {
      const nextTheme = readFullThemeState()
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
      if (Math.abs(targetScrollDepth - currentScrollDepth) < 0.001) {
        currentScrollDepth = targetScrollDepth
      }
      setScrollDepth((current) => (Math.abs(current - currentScrollDepth) > 0.001 ? currentScrollDepth : current))

      document.querySelectorAll<HTMLElement>('.landing-section').forEach((section) => {
        const rect = section.getBoundingClientRect()
        const travel = window.innerHeight + rect.height
        const targetSectionProgress = Math.min(1, Math.max(0, (window.innerHeight - rect.top) / Math.max(1, travel)))
        const currentSectionProgress = sectionProgress.get(section) ?? targetSectionProgress
        let nextSectionProgress = currentSectionProgress + (targetSectionProgress - currentSectionProgress) * inertia
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
  const activeTone = themeState.activeTone
  const shellStyle = landingStyle as CSSProperties

  return (
    <div
      className={`station-shell station-shell--${surface}`}
      data-scan-graph={scanlineLayers.graph}
      data-scan-crt={scanlineLayers.crt}
      data-scan-glitch={scanlineLayers.glitch}
      data-surface={surface}
      data-status={status.label.toLowerCase().replaceAll(' ', '-')}
      data-tone={activeTone}
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
              <h1 aria-label="undef games">
                <span>undef</span>
                <span>games</span>
              </h1>
              <p className="station-copy">{LAB_HERO_COPY.support}</p>
              <div className="station-actions" aria-label="landing actions">
                <a href={isSiteSurface ? LAB_HERO_COPY.primaryAction.href : '#signal'}>
                  {isSiteSurface ? LAB_HERO_COPY.primaryAction.label : 'Tune signal'}
                </a>
                <a href={LAB_HERO_COPY.secondaryAction.href}>{LAB_HERO_COPY.secondaryAction.label}</a>
              </div>
              <p className="station-status">{status.lock ? 'Signal locked' : LAB_HERO_COPY.statusLabel}</p>
            </div>
          </div>
          {!isSiteSurface && (
            <aside ref={stationSidebarRef} className="station-sidebar" aria-label="station tools and identity">
              <StationControls state={stationState} onTune={tune} onDetune={detune} onReset={reset} />
              <ChannelSelector activeChannel={activeChannel} channels={STATION_CHANNELS} onSelect={setActiveChannel} />
              <SignalScope signal={stationState.signal} scrollDepth={scrollDepth} activeChannel={activeChannel} />
              <EffectsControls
                activePresetId={activePresetId}
                activeTone={themeState.activeTone}
                darkPresetId={darkPresetId}
                lightPresetId={lightPresetId}
                scanlineEngine={scanlineEngine}
                scanlineLayers={scanlineLayers}
                settings={effectsSettings}
                sectionEffects={sectionEffects}
                onAddScanlineEngineLayer={addScanlineEngineLayer}
                onChange={updateEffect}
                onActiveTone={updateActiveTone}
                onDuplicateScanlineEngineLayer={duplicateScanlineEngineLayer}
                onMoveScanlineEngineLayer={moveScanlineEngineLayer}
                onPreset={applyEffectsPreset}
                onResetProminent={resetProminent}
                onResetTheme={resetTheme}
                onRemoveScanlineEngineLayer={removeScanlineEngineLayer}
                onScanlineLayerChange={updateScanlineLayer}
                onSectionEffect={updateSectionEffect}
                onUpdateScanlineBasePattern={updateScanlineBasePattern}
                onUpdateScanlineEngineLayer={updateScanlineEngineLayer}
              />
              <StationIdentity state={stationState} />
            </aside>
          )}
        </section>

        <section className="landing-section landing-section--signal" id="signal" aria-label="signal behavior">
          <SectionToy variant="signal" effect={sectionEffects.signal} />
          <p className="section-kicker">{LAB_SECTIONS.signal.kicker}</p>
          <h2>{LAB_SECTIONS.signal.title}</h2>
          <p>{LAB_SECTIONS.signal.body}</p>
        </section>

        <section className="landing-section landing-section--projects" id="projects" aria-label="undef games projects">
          <SectionToy variant="system" effect={sectionEffects.projects} />
          <p className="section-kicker">{LAB_SECTIONS.projects.kicker}</p>
          <h2>{LAB_SECTIONS.projects.title}</h2>
          <div className="product-link-list" aria-label="undef games project links">
            {LAB_PROJECTS.map((product) => (
              <a key={product.href} className={`product-link ${product.className}`} href={product.href}>
                <span>{product.tag}</span>
                <strong>{product.label}</strong>
                <small>{product.description}</small>
              </a>
            ))}
          </div>
        </section>

        <section className="landing-section landing-section--warp" aria-label="WARP Warp Agent Runtime Portal">
          <SectionToy variant="signal" effect={sectionEffects.warp} />
          <p className="section-kicker">{LAB_SECTIONS.warp.kicker}</p>
          <h2>{LAB_SECTIONS.warp.title}</h2>
          <p>{LAB_SECTIONS.warp.body}</p>
          <a className="section-link" href={LAB_SECTIONS.warp.href}>
            {LAB_SECTIONS.warp.linkLabel}
          </a>
        </section>

        <section className="landing-section landing-section--dice" aria-label="Undef Dice">
          <SectionToy variant="system" effect={sectionEffects.dice} />
          <p className="section-kicker">{LAB_SECTIONS.dice.kicker}</p>
          <h2>{LAB_SECTIONS.dice.title}</h2>
          <p>{LAB_SECTIONS.dice.body}</p>
          <a className="section-link" href={LAB_SECTIONS.dice.href}>
            {LAB_SECTIONS.dice.linkLabel}
          </a>
        </section>

        <section className="landing-section landing-section--taybols" aria-label="Taybols">
          <SectionToy variant="signal" effect={sectionEffects.taybols} />
          <p className="section-kicker">{LAB_SECTIONS.taybols.kicker}</p>
          <h2>{LAB_SECTIONS.taybols.title}</h2>
          <p>{LAB_SECTIONS.taybols.body}</p>
          <a className="section-link" href={LAB_SECTIONS.taybols.href}>
            {LAB_SECTIONS.taybols.linkLabel}
          </a>
        </section>

        <section className="landing-section landing-section--identity" id="identity" aria-label="identity baseline">
          <SectionToy variant="identity" effect={sectionEffects.identity} />
          <p className="section-kicker">{LAB_SECTIONS.identity.kicker}</p>
          <h2>{LAB_SECTIONS.identity.title}</h2>
          <p>{LAB_SECTIONS.identity.body}</p>
        </section>

        <section className="landing-final" aria-label="final call to action">
          <p>{LAB_SECTIONS.closing.kicker}</p>
          <h2>{LAB_SECTIONS.closing.title}</h2>
          <a href="#top" onClick={(event) => event.preventDefault()}>
            {LAB_SECTIONS.closing.action}
          </a>
        </section>
      </main>
      {!isSiteSurface && (
        <ProminentEntrance
          key={`lab-back:${prominentReplaySeed}`}
          config={labEntranceConfig}
          enabled={prominentOriginReady || Boolean(devEntrance)}
          origin={prominentOrigin ?? undefined}
          activeClassName="home-quick-link--intro"
        >
          <a
            className="home-quick-link"
            href={labBackHref}
          >
            {'< Back'}
          </a>
        </ProminentEntrance>
      )}
    </div>
  )
}
