import { afterEach, describe, expect, it } from 'vitest'
import { SIGNAL_COLORS, getSignalColor, setSignalColor } from './signal-color'
import { STORAGE_KEY } from './persistence'

afterEach(() => { localStorage.clear() })

describe('signal color', () => {
  it('exposes the brand swatches', () => {
    expect(SIGNAL_COLORS[0].value).toBe('#d8ff35')
  })
  it('round-trips a chosen color through storage', () => {
    setSignalColor('#69a7ff')
    expect(getSignalColor()).toBe('#69a7ff')
    expect(localStorage.getItem(STORAGE_KEY)).toContain('#69a7ff')
  })
})
