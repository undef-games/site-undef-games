import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { attachButtonPressFeedback } from './button-press-feedback'

describe('attachButtonPressFeedback', () => {
  let container: HTMLDivElement
  let button: HTMLButtonElement
  let cleanup: () => void

  beforeEach(() => {
    vi.useFakeTimers()
    container = document.createElement('div')
    button = document.createElement('button')
    container.appendChild(button)
    document.body.appendChild(container)
    cleanup = attachButtonPressFeedback(container)
  })

  afterEach(() => {
    cleanup()
    document.body.removeChild(container)
    vi.useRealTimers()
  })

  it('sets pressState to "down" on pointerdown on a button inside the container', () => {
    button.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    expect(button.dataset.pressState).toBe('down')
  })

  it('sets pressState to "down" when pointerdown fires on a child element inside the button (event delegation via closest)', () => {
    const child = document.createElement('span')
    button.appendChild(child)
    child.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    expect(button.dataset.pressState).toBe('down')
  })

  it('sets pressState to "release" on pointerup after a press', () => {
    button.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    expect(button.dataset.pressState).toBe('down')
    window.dispatchEvent(new PointerEvent('pointerup'))
    expect(button.dataset.pressState).toBe('release')
  })

  it('clears pressState after RELEASE_MS on pointerup', () => {
    button.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    window.dispatchEvent(new PointerEvent('pointerup'))
    expect(button.dataset.pressState).toBe('release')
    vi.advanceTimersByTime(240)
    expect(button.dataset.pressState).toBeUndefined()
  })

  it('clears pressState immediately on pointercancel (no release state)', () => {
    button.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    expect(button.dataset.pressState).toBe('down')
    window.dispatchEvent(new PointerEvent('pointercancel'))
    expect(button.dataset.pressState).toBeUndefined()
  })

  it('does not set pressState for a disabled button', () => {
    button.disabled = true
    button.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    expect(button.dataset.pressState).toBeUndefined()
  })

  it('does not set pressState for a button outside the container', () => {
    const outside = document.createElement('button')
    document.body.appendChild(outside)
    outside.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    expect(outside.dataset.pressState).toBeUndefined()
    document.body.removeChild(outside)
  })

  it('does not set pressState for a non-button element', () => {
    const span = document.createElement('span')
    container.appendChild(span)
    span.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    // No button active — pointerup does nothing
    window.dispatchEvent(new PointerEvent('pointerup'))
    expect(button.dataset.pressState).toBeUndefined()
  })

  it('overrides a previous release timer when pointerdown fires again before release clears', () => {
    button.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    window.dispatchEvent(new PointerEvent('pointerup'))
    expect(button.dataset.pressState).toBe('release')

    // Press again before timer fires
    button.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    expect(button.dataset.pressState).toBe('down')

    // Now release again
    window.dispatchEvent(new PointerEvent('pointerup'))
    expect(button.dataset.pressState).toBe('release')
  })

  it('does not delete pressState in timer callback when state changed away from "release"', () => {
    // Press → release → press again (state becomes 'down'); then let the original release timer fire
    button.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    window.dispatchEvent(new PointerEvent('pointerup'))
    // At this point a 240ms timer is queued with pressState='release'
    // Now press again: clearReleaseTimer cancels it, state goes to 'down'
    button.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    expect(button.dataset.pressState).toBe('down')
    // Release the second press — schedules a NEW 240ms timer; state='release'
    window.dispatchEvent(new PointerEvent('pointerup'))
    expect(button.dataset.pressState).toBe('release')
    // Manually change pressState so when the timer fires, the guard (==='release') is false
    button.dataset.pressState = 'down'
    // Advance time: timer fires but guard is false, so pressState stays 'down'
    vi.advanceTimersByTime(240)
    // pressState was 'down' when timer fired — should NOT be deleted
    expect(button.dataset.pressState).toBe('down')
  })

  it('removes listeners on cleanup so pointerdown no longer sets pressState', () => {
    cleanup()
    button.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    expect(button.dataset.pressState).toBeUndefined()
    // Re-attach for afterEach cleanup to not fail
    cleanup = attachButtonPressFeedback(container)
    cleanup()
    cleanup = () => undefined
  })

  it('removes window listeners on cleanup so pointerup no longer triggers release', () => {
    // Press first (before cleanup)
    button.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    expect(button.dataset.pressState).toBe('down')
    cleanup()
    // manually delete pressState to simulate fresh state
    delete button.dataset.pressState
    // Now pointerup should NOT trigger anything since listener removed
    window.dispatchEvent(new PointerEvent('pointerup'))
    // state was deleted and not re-set
    expect(button.dataset.pressState).toBeUndefined()
    cleanup = () => undefined
  })

  it('setReleaseState no-ops when button is disconnected', () => {
    // Press button, remove it from DOM, then fire pointerup
    button.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    expect(button.dataset.pressState).toBe('down')
    container.removeChild(button)
    // Button is no longer connected
    expect(button.isConnected).toBe(false)
    // setReleaseState should bail early — pressState remains 'down', NOT changed to 'release'
    window.dispatchEvent(new PointerEvent('pointerup'))
    expect(button.dataset.pressState).toBe('down')
    // Restore for afterEach
    container.appendChild(button)
  })

  it('pointercancel with no active button is a no-op', () => {
    // No press has occurred; activeButton is null
    window.dispatchEvent(new PointerEvent('pointercancel'))
    expect(button.dataset.pressState).toBeUndefined()
  })
})
