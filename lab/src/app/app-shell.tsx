import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { EffectsControls } from '../station/effects-controls'
import { PROMINENT_ENTRANCE_CONFIGS } from '../prominent/prominent-config'
import { ProminentEntrance } from '../prominent/prominent-entrance'
import { resetProminentEntrances } from '../prominent/prominent-storage'
import {
  EFFECTS_PRESETS,
  type EffectsPresetId,
  type EffectsSettings,
  type EffectsTone,
} from '../station/effects-config'
import { createEffectsStyle } from '../station/effects-style'
import { StationControls } from '../station/station-controls'
import { StationGlyph, StationIdentity } from '../station/station-identity'
import {
  addScanlineLayer,
  duplicateScanlineLayer,
  moveScanlineLayer,
  removeScanlineLayer,
  updateScanlineLayer as updateScanlineEngineLayerState,
  type ScanlineEngineState,
  type ScanlineLayerMoveDirection,
  type ScanlineLayerPatch,
} from '../station/scanline-engine'
import { StationSignalScene } from '../station/station-signal-scene'
import { createStationState, detuneSignal, getStationStatus, resetSignal, tuneSignal } from '../station/station-state'
import {
  ChannelSelector,
  PacketDrift,
  SectionToy,
  SignalScope,
  STATION_CHANNELS,
  type SectionEffectId,
  type SectionToyEffect,
} from '../station/station-toys'
import {
  clearThemeState,
  createDefaultThemeState,
  getActiveThemeSettings,
  readThemeState,
  writeThemeState,
  type ScanlineLayerId,
  type ThemeState,
} from '../store/persistence'
import { attachButtonPressFeedback } from '../ui/button-press-feedback'

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
  const [prominentOrigin, setProminentOrigin] = useState({ bottom: '50vh', left: '50vw' })
  const [stationState, setStationState] = useState(() => createStationState({ signal: isSiteSurface ? 50 : 0 }))
  const [scrollDepth, setScrollDepth] = useState(0)
  const [activeChannel, setActiveChannel] = useState(STATION_CHANNELS[0])
  const [themeState, setThemeState] = useState<ThemeState>(() => readThemeState() ?? createDefaultThemeState())
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

  const updateThemeState = (updater: (current: ThemeState) => ThemeState) => {
    setThemeState((current) => {
      const next = updater(current)
      if (!isSiteSurface) {
        writeThemeState(next)
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
    setThemeState(createDefaultThemeState())
  }
  const resetProminent = () => {
    resetProminentEntrances([PROMINENT_ENTRANCE_CONFIGS.labBack])
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
      setProminentOrigin({
        bottom: `${Math.max(0, window.innerHeight - centerY)}px`,
        left: `${centerX}px`,
      })
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
  const shellStyle = {
    ...landingStyle,
    '--prominent-origin-bottom': prominentOrigin.bottom,
    '--prominent-origin-left': prominentOrigin.left,
  } as CSSProperties

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
              <p className="station-copy">Systems, toys, and game-shaped experiments tuned out of undefined space.</p>
              <div className="station-actions" aria-label="landing actions">
                <a href={isSiteSurface ? '/lab/' : '#signal'}>{isSiteSurface ? 'Open lab' : 'Tune signal'}</a>
                <a href="#projects">View projects</a>
              </div>
              <p className="station-status">{status.lock ? 'Signal locked' : status.label}</p>
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
      {!isSiteSurface && (
        <ProminentEntrance
          key={`lab-back:${prominentReplaySeed}`}
          config={PROMINENT_ENTRANCE_CONFIGS.labBack}
          enabled={prominentOriginReady}
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
