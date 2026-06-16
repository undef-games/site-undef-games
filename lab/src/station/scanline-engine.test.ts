import { describe, expect, it } from 'vitest'
import {
  MAX_SCANLINE_ENGINE_LAYERS,
  addScanlineLayer,
  createDefaultScanlineEngine,
  duplicateScanlineLayer,
  removeScanlineLayer,
} from './scanline-engine'

describe('scanline engine', () => {
  it('starts with the baseline carrier and no modulation layers', () => {
    const engine = createDefaultScanlineEngine()
    expect(engine.basePattern).toBe('straight')
    expect(engine.layers).toEqual([])
  })

  it('caps the layer stack at thirteen entries', () => {
    let engine = createDefaultScanlineEngine()
    for (let index = 0; index < MAX_SCANLINE_ENGINE_LAYERS + 2; index += 1) {
      engine = addScanlineLayer(engine, index < 3 ? 'sine' : 'pulse')
    }
    expect(engine.layers).toHaveLength(MAX_SCANLINE_ENGINE_LAYERS)
  })

  it('duplicates and removes a layer by id without mutating the rest of the stack', () => {
    let engine = addScanlineLayer(createDefaultScanlineEngine(), 'audit')
    const originalId = engine.layers[0].id
    engine = duplicateScanlineLayer(engine, originalId)
    expect(engine.layers).toHaveLength(2)
    expect(engine.layers[0].kind).toBe('audit')
    expect(engine.layers[1].kind).toBe('audit')

    engine = removeScanlineLayer(engine, originalId)
    expect(engine.layers).toHaveLength(1)
  })
})
