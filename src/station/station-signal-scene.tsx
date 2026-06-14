import { useEffect, useRef } from 'react'
import type { Application, Graphics } from 'pixi.js'
import { getStationStatus, type StationState } from './station-state'

export function StationSignalScene({ state, scrollDepth = 0 }: { state: StationState; scrollDepth?: number }) {
  const status = getStationStatus(state)
  const plan = getSignalFieldPlan(state.signal)
  const hostRef = useRef<HTMLDivElement>(null)
  const signalRef = useRef(state.signal)
  const scrollDepthRef = useRef(scrollDepth)

  useEffect(() => {
    signalRef.current = state.signal
  }, [state.signal])

  useEffect(() => {
    scrollDepthRef.current = scrollDepth
  }, [scrollDepth])

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
    }

    const onPointerLeave = () => {
      pointer.active = false
    }

    const resizeToHost = () => {
      if (!app) return
      const rect = target.getBoundingClientRect()
      const width = Math.max(1, Math.round(rect.width))
      const height = Math.max(1, Math.round(rect.height))
      app.renderer.resize(width, height)
      if (graphics) drawSignalField(graphics, app, signalRef.current, pointer, scrollDepthRef.current)
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
        if (graphics && app) drawSignalField(graphics, app, signalRef.current, pointer, scrollDepthRef.current)
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
  shape: 'scan-field'
  totalScanlines: number
}

export function getSignalFieldPlan(signal: number): SignalFieldPlan {
  const normalizedSignal = Math.min(100, Math.max(0, Math.round(Number.isFinite(signal) ? signal : 0)))
  const clarity = normalizedSignal / 100
  const totalScanlines = 96

  return {
    activeScanlines: Math.round(14 + clarity * 70),
    hasCenterMark: false,
    hasMast: false,
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
) {
  const width = app.screen.width
  const height = app.screen.height
  const time = performance.now() * 0.001
  const lock = signal >= 85
  const clarity = signal / 100
  const plan = getSignalFieldPlan(signal)
  const scrollEnergy = Math.min(1, Math.max(0, scrollDepth))
  const driftX = pointer.x * width * (0.035 + scrollEnergy * 0.045)
  const pointerY = (pointer.y + 0.5) * height

  graphics.clear()
  graphics.rect(0, 0, width, height).fill(0x050607)

  for (let index = 0; index < plan.totalScanlines; index += 1) {
    const y = ((index * 31 + time * (54 + scrollEnergy * 120)) % (height + 90)) - 45
    const active = index < plan.activeScanlines
    const pointerBand = pointer.active ? Math.max(0, 1 - Math.abs(y - pointerY) / Math.max(height * 0.2, 1)) : 0
    const lineWidth = active
      ? width * (0.24 + ((index % 9) * 0.03 + clarity * 0.44 + pointerBand * 0.2 + scrollEnergy * 0.12))
      : width * (0.06 + (index % 5) * 0.028 + pointerBand * 0.08)
    const x = active
      ? width * (0.03 + (index % 4) * 0.018) + driftX
      : width * (0.1 + ((index * 89) % Math.max(width * 0.22, 1)) / width)
    graphics.rect(x, y, Math.min(lineWidth, width * 0.94), active ? 2.4 : 1).fill({
      color: active ? 0xd8ff35 : 0xf4f4f0,
      alpha: active ? 0.12 + clarity * 0.42 + pointerBand * 0.28 + scrollEnergy * 0.12 : 0.045 + pointerBand * 0.09,
    })
  }

  for (let index = 0; index < 130; index += 1) {
    const noise = pseudoNoise(index, time)
    const x = (noise * width + index * 31) % width
    const y = (pseudoNoise(index + 91, time * 0.7) * height + index * 17) % height
    const size = 1 + ((index + Math.floor(time * 6)) % 3)
    graphics.rect(x, y, size, 1).fill({ color: 0xf4f4f0, alpha: 0.03 + (1 - clarity) * 0.18 + scrollEnergy * 0.04 })
  }

  const sweepY = (height * (0.12 + ((time * (0.14 + scrollEnergy * 0.26)) % 0.82))) | 0
  graphics.rect(driftX, sweepY, width, lock ? 3 : 2).fill({ color: 0xd8ff35, alpha: 0.18 + clarity * 0.22 })
}

function pseudoNoise(seed: number, time: number) {
  const raw = Math.sin(seed * 12.9898 + time * 78.233) * 43758.5453
  return raw - Math.floor(raw)
}
