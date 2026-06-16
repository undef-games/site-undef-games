import { describe, expect, it } from 'vitest'
import {
  MAX_SCANLINE_ENGINE_LAYERS,
  addScanlineLayer,
  createDefaultScanlineEngine,
  duplicateScanlineLayer,
  removeScanlineLayer,
  updateScanlineLayer,
} from '../../../packages/scanlines-system/src/station/scanline-engine'

describe('scanline engine', () => {
  it('adds a new layer to hydrated state without reusing an existing id', () => {
    const engine = addScanlineLayer(
      {
        basePattern: 'straight',
        layers: [
          {
            id: 'scanline-layer-1',
            role: 'advanced',
            enabled: true,
            kind: 'sine',
            opacity: 0.6,
            speed: 0,
            amplitude: 0.4,
            verticalOffset: 0,
            phase: 0,
            blendMode: 'screen',
            spacingInfluence: 0.5,
            frequency: 1,
            thickness: 1,
            jitter: 0,
            dashLength: 0,
            gapLength: 0,
            stepSharpness: 0.5,
            scrollCoupling: 0,
            pointerCoupling: 0,
          },
        ],
      },
      'pulse',
    )

    const ids = engine.layers.map((layer) => layer.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

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

  it('assigns advanced roles to indexes 0..2 and support from index 3 onward', () => {
    let engine = createDefaultScanlineEngine()
    for (let index = 0; index < 4; index += 1) {
      engine = addScanlineLayer(engine, index < 3 ? 'sine' : 'pulse')
    }

    expect(engine.layers[2]).toMatchObject({
      role: 'advanced',
      kind: 'sine',
    })
    expect(engine.layers[3]).toMatchObject({
      role: 'support',
      kind: 'pulse',
      intensity: 0.5,
    })
  })

  it('updates a support layer without losing its support fields', () => {
    let engine = createDefaultScanlineEngine()
    for (let index = 0; index < 4; index += 1) {
      engine = addScanlineLayer(engine, index < 3 ? 'sine' : 'pulse')
    }

    const supportId = engine.layers[3].id
    engine = updateScanlineLayer(engine, supportId, {
      intensity: 0.9,
      opacity: 0.25,
    })

    expect(engine.layers[3]).toMatchObject({
      id: supportId,
      role: 'support',
      kind: 'pulse',
      intensity: 0.9,
      opacity: 0.25,
    })
  })

  it('updates an advanced layer without losing its advanced fields', () => {
    let engine = createDefaultScanlineEngine()
    engine = addScanlineLayer(engine, 'audit')

    const advancedId = engine.layers[0].id
    engine = updateScanlineLayer(engine, advancedId, {
      blendMode: 'difference',
      spacingInfluence: 0.8,
      opacity: 0.4,
    })

    expect(engine.layers[0]).toMatchObject({
      id: advancedId,
      role: 'advanced',
      kind: 'audit',
      blendMode: 'difference',
      spacingInfluence: 0.8,
      opacity: 0.4,
    })
  })
})
