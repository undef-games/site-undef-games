import { useEffect, useRef } from 'react'
import type { Application, Graphics } from 'pixi.js'
import { BASELINE_EFFECTS, type EffectsSettings } from './effects-config'
import { hexToPixiColor } from './effects-style'
import { getStationStatus, type StationState } from './station-state'

export type ChannelMode = 'baseline' | 'game' | 'noise' | 'lock'

export function StationSignalScene({
  state,
  scrollDepth = 0,
  channelMode = 'baseline',
  effects = BASELINE_EFFECTS,
}: {
  state: StationState
  scrollDepth?: number
  channelMode?: ChannelMode
  effects?: EffectsSettings
}) {
  const status = getStationStatus(state)
  const plan = getSignalFieldPlan(state.signal, channelMode)
  const hostRef = useRef<HTMLDivElement>(null)
  const signalRef = useRef(state.signal)
  const scrollDepthRef = useRef(scrollDepth)
  const channelModeRef = useRef(channelMode)
  const effectsRef = useRef(effects)

  useEffect(() => {
    signalRef.current = state.signal
  }, [state.signal])

  useEffect(() => {
    scrollDepthRef.current = scrollDepth
  }, [scrollDepth])

  useEffect(() => {
    channelModeRef.current = channelMode
  }, [channelMode])

  useEffect(() => {
    effectsRef.current = effects
  }, [effects])

  useEffect(() => {
    const host = hostRef.current
    if (!host || !canUsePixi()) return
    const target: HTMLElement = host

    let app: Application | null = null
    let graphics: Graphics | null = null
    let resizeObserver: ResizeObserver | null = null
    let disposed = false
    const pointer = { active: false, x: 0, y: 0 }

    const onPointerMove = (event: PointerEvent) => {
      const rect = host.getBoundingClientRect()
      const relativeX = rect.width === 0 ? 0.5 : (event.clientX - rect.left) / rect.width
      const relativeY = rect.height === 0 ? 0.5 : (event.clientY - rect.top) / rect.height
      pointer.active = relativeX >= -0.08 && relativeX <= 1.08 && relativeY >= -0.08 && relativeY <= 1.08
      pointer.x = Math.min(1, Math.max(0, relativeX)) - 0.5
      pointer.y = Math.min(1, Math.max(0, relativeY)) - 0.5
      target.dataset.pointerActive = String(pointer.active)
      target.dataset.pointerY = pointer.y.toFixed(3)
    }

    const onPointerLeave = () => {
      pointer.active = false
      target.dataset.pointerActive = 'false'
    }

    const resizeToHost = () => {
      if (!app) return
      const rect = target.getBoundingClientRect()
      const width = Math.max(1, Math.round(rect.width))
      const height = Math.max(1, Math.round(rect.height))
      app.renderer.resize(width, height)
      if (graphics) {
        drawSignalField(
          graphics,
          app,
          signalRef.current,
          pointer,
          scrollDepthRef.current,
          channelModeRef.current,
          effectsRef.current,
        )
      }
    }

    async function mountPixi() {
      const { Application, Graphics } = await import('pixi.js')
      if (disposed) return
      const rect = target.getBoundingClientRect()

      app = new Application()
      await app.init({
        antialias: true,
        autoDensity: true,
        background: '#050607',
        height: Math.max(1, Math.round(rect.height)),
        resolution: Math.min(window.devicePixelRatio || 1, 2),
        width: Math.max(1, Math.round(rect.width)),
      })
      if (disposed) {
        app.destroy(true)
        return
      }

      graphics = new Graphics()
      app.stage.addChild(graphics)
      target.appendChild(app.canvas)
      window.addEventListener('pointermove', onPointerMove)
      window.addEventListener('pointerleave', onPointerLeave)
      resizeObserver = new ResizeObserver(resizeToHost)
      resizeObserver.observe(target)
      requestAnimationFrame(resizeToHost)
      app.ticker.add(() => {
        if (graphics && app) {
          drawSignalField(
            graphics,
            app,
            signalRef.current,
            pointer,
            scrollDepthRef.current,
            channelModeRef.current,
            effectsRef.current,
          )
        }
      })
    }

    void mountPixi()

    return () => {
      disposed = true
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerleave', onPointerLeave)
      resizeObserver?.disconnect()
      app?.destroy(true)
    }
  }, [])

  return (
    <div
      ref={hostRef}
      className="station-signal-scene"
      aria-label="interactive station signal"
      data-active-scanlines={plan.activeScanlines}
      data-field-shape="scan-field"
      data-renderer="pixijs"
      data-resize-mode="observer"
      data-channel-mode={channelMode}
      data-pointer-active="false"
      data-scroll-depth={scrollDepth}
      data-signal={state.signal}
      data-status={status.label}
    />
  )
}

function canUsePixi() {
  if (typeof window === 'undefined') return false
  if (/jsdom/i.test(window.navigator.userAgent)) return false
  const canvas = document.createElement('canvas')
  return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'))
}

export type SignalFieldPlan = {
  activeScanlines: number
  hasCenterMark: boolean
  hasMast: boolean
  mode: ChannelMode
  shape: 'scan-field'
  totalScanlines: number
}

export function getSignalFieldPlan(signal: number, channelMode: ChannelMode = 'baseline'): SignalFieldPlan {
  const normalizedSignal = Math.min(100, Math.max(0, Math.round(Number.isFinite(signal) ? signal : 0)))
  const clarity = normalizedSignal / 100
  const modeBonus = channelMode === 'noise' ? 34 : channelMode === 'game' ? 18 : channelMode === 'lock' ? 10 : 0
  const totalScanlines = 96 + modeBonus

  return {
    activeScanlines: Math.round(14 + clarity * 70 + modeBonus * 0.45),
    hasCenterMark: false,
    hasMast: false,
    mode: channelMode,
    shape: 'scan-field',
    totalScanlines,
  }
}

function drawSignalField(
  graphics: Graphics,
  app: Application,
  signal: number,
  pointer: { active: boolean; x: number; y: number },
  scrollDepth: number,
  channelMode: ChannelMode,
  effects: EffectsSettings,
) {
  const width = app.screen.width
  const height = app.screen.height
  const time = performance.now() * 0.001
  const lock = signal >= 85
  const clarity = signal / 100
  const plan = getSignalFieldPlan(signal, channelMode)
  const profile = getChannelProfile(channelMode)
  const scrollEnergy = Math.min(1, Math.max(0, scrollDepth)) * effects.scrollBoost * effects.scanScrollImpact
  const signalColor = hexToPixiColor(channelMode === 'noise' ? effects.paletteMuted : effects.paletteSignal)
  const support1Color = hexToPixiColor(channelMode === 'noise' ? effects.paletteMuted : effects.paletteSupport1)
  const support2Color = hexToPixiColor(channelMode === 'noise' ? effects.paletteMuted : effects.paletteSupport2)
  const support3Color = hexToPixiColor(channelMode === 'noise' ? effects.paletteMuted : effects.paletteSupport3)
  const mutedColor = hexToPixiColor(effects.paletteMuted)
  const backgroundColor = hexToPixiColor(effects.paletteBg)
  const activeColors = [signalColor, support1Color, support2Color, support3Color]
  const driftX =
    pointer.x *
    width *
    (0.035 + scrollEnergy * 0.045 + profile.pointerPush) *
    effects.pointerWake *
    effects.driftAmount
  const pointerY = (pointer.y + 0.5) * height

  graphics.clear()
  graphics.rect(0, 0, width, height).fill(backgroundColor)

  for (let index = 0; index < plan.totalScanlines; index += 1) {
    const y =
      ((index * profile.spacing * effects.scanSpacing +
        time * (54 + scrollEnergy * 120 + profile.speed) * effects.scanSpeed) %
        (height + 90)) -
      45
    const active = index < plan.activeScanlines
    const pointerBand = pointer.active
      ? Math.max(0, 1 - Math.abs(y - pointerY) / Math.max(height * 0.2, 1)) * effects.pointerWake
      : 0
    const jitter = profile.jitter * effects.jitterAmount * pseudoNoise(index + 203, time * 1.4) * width
    const lineWidth = active
      ? width * (0.24 + ((index % 9) * 0.03 + clarity * 0.44 + pointerBand * 0.2 + scrollEnergy * 0.12))
      : width * (0.06 + (index % 5) * 0.028 + pointerBand * 0.08)
    const x = active
      ? width * (0.03 + (index % 4) * 0.018) + driftX + jitter
      : width * (0.1 + ((index * 89) % Math.max(width * 0.22, 1)) / width)
    graphics.rect(x, y, Math.min(lineWidth, width * 0.94), active ? 2.4 : 1).fill({
      color: active ? activeColors[index % activeColors.length] : mutedColor,
      alpha: active
        ? (0.075 + clarity * 0.28 + pointerBand * 0.22 + scrollEnergy * 0.08) * effects.scanOpacity
        : (0.028 + pointerBand * 0.06) * effects.scanOpacity,
    })
  }

  const noiseCount = Math.round((130 + profile.noise) * Math.max(0.05, effects.noiseAmount))
  for (let index = 0; index < noiseCount; index += 1) {
    const noise = pseudoNoise(index, time)
    const x = (noise * width + index * 31) % width
    const y = (pseudoNoise(index + 91, time * 0.7) * height + index * 17) % height
    const size = 1 + ((index + Math.floor(time * 6)) % 3)
    graphics.rect(x, y, size, 1).fill({
      color: mutedColor,
      alpha: (0.024 + (1 - clarity) * 0.13 + scrollEnergy * 0.03) * effects.noiseAmount,
    })
  }

  if (pointer.active) {
    graphics.rect(0, pointerY - 34, width, 68).fill({
      color: support1Color,
      alpha: (0.025 + clarity * 0.03) * effects.pointerWake,
    })
    graphics.rect(driftX - width * 0.08, pointerY, width * 1.08, 2).fill({
      color: support2Color,
      alpha: (0.16 + clarity * 0.16) * effects.pointerWake,
    })
  }

  const sweepY = (height * (0.12 + ((time * (0.14 + scrollEnergy * 0.26)) % 0.82))) | 0
  graphics.rect(driftX, sweepY, width, lock ? 3 : 2).fill({
    color: support3Color,
    alpha: (0.18 + clarity * 0.22) * effects.sweepStrength,
  })

  if (channelMode === 'game' || channelMode === 'lock') {
    const blockY = (height * (0.18 + ((time * 0.07 + scrollEnergy * 0.4) % 0.58))) | 0
    for (let index = 0; index < 7; index += 1) {
      const blockX = width * (0.12 + index * 0.105) + driftX * 0.4
      graphics.rect(blockX, blockY + (index % 3) * 18, width * 0.045, 8).fill({
        color: activeColors[(index + 1) % activeColors.length],
        alpha: (0.12 + clarity * 0.22) * effects.sweepStrength,
      })
    }
  }
}

function getChannelProfile(channelMode: ChannelMode) {
  switch (channelMode) {
    case 'game':
      return { color: 0xd8ff35, jitter: 0.018, noise: 24, pointerPush: 0.012, spacing: 27, speed: 42 }
    case 'noise':
      return { color: 0xf4f4f0, jitter: 0.036, noise: 82, pointerPush: 0.026, spacing: 23, speed: 98 }
    case 'lock':
      return { color: 0xd8ff35, jitter: 0.006, noise: 10, pointerPush: 0.006, spacing: 31, speed: 18 }
    default:
      return { color: 0xd8ff35, jitter: 0.01, noise: 0, pointerPush: 0, spacing: 31, speed: 0 }
  }
}

function pseudoNoise(seed: number, time: number) {
  const raw = Math.sin(seed * 12.9898 + time * 78.233) * 43758.5453
  return raw - Math.floor(raw)
}
