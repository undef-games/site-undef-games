import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { createDefaultScanlineEngine, getSignalFieldPlan } from '@undef/scanlines-system'
import { StationSignalScene } from './station-signal-scene'
import { createStationState } from './station-state'

afterEach(() => cleanup())

describe('StationSignalScene', () => {
  it('renders the interactive station signal canvas region', () => {
    render(<StationSignalScene state={createStationState()} scanlineEngine={createDefaultScanlineEngine()} />)

    expect(screen.getByLabelText(/interactive station signal/i)).toHaveClass('station-signal-scene')
    expect(screen.getByLabelText(/interactive station signal/i)).toHaveAttribute('data-renderer', 'pixijs')
    expect(screen.getByLabelText(/interactive station signal/i)).toHaveAttribute('data-field-shape', 'scan-field')
    expect(screen.getByLabelText(/interactive station signal/i)).toHaveAttribute('data-resize-mode', 'observer')
  })

  it('plans more active scanlines as signal increases without center-mark or mast shapes', () => {
    const noSignal = getSignalFieldPlan(0)
    const fullSignal = getSignalFieldPlan(100)

    expect(noSignal.shape).toBe('scan-field')
    expect(noSignal.hasCenterMark).toBe(false)
    expect(noSignal.hasMast).toBe(false)
    expect(fullSignal.hasCenterMark).toBe(false)
    expect(fullSignal.hasMast).toBe(false)
    expect(fullSignal.activeScanlines).toBeGreaterThan(noSignal.activeScanlines)
  })

  it('exposes the active scanline count for the current signal state', () => {
    const { rerender } = render(
      <StationSignalScene state={createStationState()} scanlineEngine={createDefaultScanlineEngine()} />,
    )
    const scene = screen.getByLabelText(/interactive station signal/i)
    const initialScanlines = Number(scene.getAttribute('data-active-scanlines'))

    rerender(
      <StationSignalScene
        state={createStationState({ signal: 100 })}
        scanlineEngine={createDefaultScanlineEngine()}
      />,
    )

    expect(Number(scene.getAttribute('data-active-scanlines'))).toBeGreaterThan(initialScanlines)
  })

  it('exposes scanline engine metadata for the current scene plan', () => {
    render(
      <StationSignalScene
        state={createStationState({ signal: 80 })}
        scanlineEngine={{
          basePattern: 'audit',
          layers: [
            {
              amplitude: 0.4,
              blendMode: 'screen',
              dashLength: 0,
              enabled: true,
              frequency: 1,
              gapLength: 0,
              id: 'layer-a',
              jitter: 0,
              kind: 'sine',
              opacity: 0.8,
              phase: 0,
              pointerCoupling: 0,
              role: 'advanced',
              scrollCoupling: 0,
              spacingInfluence: 0.5,
              speed: 0,
              stepSharpness: 0.5,
              thickness: 1,
              verticalOffset: 0,
            },
            {
              amplitude: 0.3,
              enabled: true,
              id: 'layer-b',
              intensity: 0.6,
              kind: 'pulse',
              opacity: 0.5,
              phase: 0.2,
              role: 'support',
              speed: 0.2,
              verticalOffset: 0.1,
            },
          ],
        }}
      />,
    )

    const scene = screen.getByLabelText(/interactive station signal/i)
    expect(scene).toHaveAttribute('data-scanline-base-pattern', 'audit')
    expect(scene).toHaveAttribute('data-scanline-layer-count', '2')
  })
})
