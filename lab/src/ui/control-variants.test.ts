import { describe, expect, it } from 'vitest'
import { CONTROL_VARIANTS } from './control-variants'

describe('CONTROL_VARIANTS', () => {
  it('tune is primary', () => {
    expect(CONTROL_VARIANTS.tune).toBe('primary')
  })

  it('detune is ghost', () => {
    expect(CONTROL_VARIANTS.detune).toBe('ghost')
  })

  it('signalReset is danger', () => {
    expect(CONTROL_VARIANTS.signalReset).toBe('danger')
  })

  it('themeReset is danger', () => {
    expect(CONTROL_VARIANTS.themeReset).toBe('danger')
  })

  it('prominentReset is danger', () => {
    expect(CONTROL_VARIANTS.prominentReset).toBe('danger')
  })

  it('addLayer is primary', () => {
    expect(CONTROL_VARIANTS.addLayer).toBe('primary')
  })

  it('removeLayer is danger', () => {
    expect(CONTROL_VARIANTS.removeLayer).toBe('danger')
  })

  it('duplicateLayer is ghost', () => {
    expect(CONTROL_VARIANTS.duplicateLayer).toBe('ghost')
  })

  it('toggleLayer is ghost', () => {
    expect(CONTROL_VARIANTS.toggleLayer).toBe('ghost')
  })

  it('moveLayer is ghost', () => {
    expect(CONTROL_VARIANTS.moveLayer).toBe('ghost')
  })

  it('runCommand is primary', () => {
    expect(CONTROL_VARIANTS.runCommand).toBe('primary')
  })

  it('prototypeReset is ghost', () => {
    expect(CONTROL_VARIANTS.prototypeReset).toBe('ghost')
  })

  it('prototypeAdvance is ghost', () => {
    expect(CONTROL_VARIANTS.prototypeAdvance).toBe('ghost')
  })
})
