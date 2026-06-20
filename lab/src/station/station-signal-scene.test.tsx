import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { getSignalFieldPlan, shouldTrackPointerType, StationSignalScene } from './station-signal-scene'
import { createStationState } from './station-state'

afterEach(() => cleanup())

describe('StationSignalScene', () => {
  it('renders the interactive station signal canvas region', () => {
    render(<StationSignalScene state={createStationState()} />)

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
    const { rerender } = render(<StationSignalScene state={createStationState()} />)
    const scene = screen.getByLabelText(/interactive station signal/i)
    const initialScanlines = Number(scene.getAttribute('data-active-scanlines'))

    rerender(<StationSignalScene state={createStationState({ signal: 100 })} />)

    expect(Number(scene.getAttribute('data-active-scanlines'))).toBeGreaterThan(initialScanlines)
  })

  it('ignores touch pointers so drag gestures can scroll the page', () => {
    expect(shouldTrackPointerType('touch')).toBe(false)
    expect(shouldTrackPointerType('mouse')).toBe(true)
    expect(shouldTrackPointerType('pen')).toBe(true)
    expect(shouldTrackPointerType('')).toBe(true)
  })
})
