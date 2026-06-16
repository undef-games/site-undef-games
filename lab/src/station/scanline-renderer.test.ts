import { describe, expect, it } from 'vitest'
import type { ScanlineEngineState } from './scanline-engine'
import {
  buildBasePatternTraces,
  buildLayerTraces,
  buildScanlineFrame,
  sampleAuditTrace,
  sampleBrokenTrace,
  sampleSineTrace,
  sampleStraightTrace,
} from './scanline-renderer'

const SAMPLE_INPUT = {
  amplitude: 12,
  baseY: 40,
  frequency: 1,
  height: 80,
  phase: 0,
  sampleCount: 7,
  width: 120,
}

describe('scanline-renderer', () => {
  it('samples deterministic and distinct base waveform signatures', () => {
    const signatures = {
      straight: sampleStraightTrace(SAMPLE_INPUT).map((point) => Math.round(point.y)),
      sine: sampleSineTrace(SAMPLE_INPUT).map((point) => Math.round(point.y)),
      audit: sampleAuditTrace(SAMPLE_INPUT).map((point) => Math.round(point.y)),
      broken: sampleBrokenTrace(SAMPLE_INPUT).map((point) => Math.round(point.y)),
    }

    expect(signatures.straight).toEqual([40, 40, 40, 40, 40, 40, 40])
    expect(signatures.sine).toEqual([40, 50, 50, 40, 30, 30, 40])
    expect(signatures.audit).toEqual([28, 28, 40, 52, 52, 40, 28])
    expect(signatures.broken).toEqual([40, 54, 34, 46, 28, 40, 52])
  })

  it('builds planned base and layer traces without drawing directly', () => {
    const engine: ScanlineEngineState = {
      basePattern: 'audit',
      layers: [
        {
          amplitude: 0.6,
          blendMode: 'screen',
          dashLength: 0,
          enabled: true,
          frequency: 1,
          gapLength: 0,
          id: 'layer-a',
          jitter: 0,
          kind: 'sine',
          opacity: 0.75,
          phase: 0,
          pointerCoupling: 0,
          role: 'advanced',
          scrollCoupling: 0,
          spacingInfluence: 0.5,
          speed: 0,
          stepSharpness: 0.5,
          thickness: 1.2,
          verticalOffset: 0.1,
        },
        {
          amplitude: 0.4,
          enabled: false,
          id: 'layer-b',
          intensity: 0.5,
          kind: 'pulse',
          opacity: 0.5,
          phase: 0,
          role: 'support',
          speed: 0,
          verticalOffset: 0,
        },
        {
          amplitude: 0.5,
          enabled: true,
          id: 'layer-c',
          intensity: 0.7,
          kind: 'broken',
          opacity: 0.45,
          phase: 0.25,
          role: 'support',
          speed: 0.2,
          verticalOffset: -0.15,
        },
      ],
    }

    const baseTraces = buildBasePatternTraces({
      basePattern: engine.basePattern,
      height: 90,
      signal: 72,
      time: 1.5,
      width: 180,
    })
    const layerTraces = buildLayerTraces({
      engine,
      height: 90,
      pointer: { active: true, x: 0.2, y: -0.15 },
      scrollDepth: 0.35,
      time: 1.5,
      width: 180,
    })
    const frame = buildScanlineFrame({
      engine,
      height: 90,
      pointer: { active: true, x: 0.2, y: -0.15 },
      scrollDepth: 0.35,
      signal: 72,
      time: 1.5,
      width: 180,
    })

    expect(baseTraces).toHaveLength(1)
    expect(baseTraces[0]?.kind).toBe('audit')
    expect(layerTraces).toHaveLength(2)
    expect(layerTraces.map((trace) => trace.kind)).toEqual(['sine', 'broken'])
    expect(frame.basePattern).toBe('audit')
    expect(frame.layerCount).toBe(3)
    expect(frame.baseTraces).toEqual(baseTraces)
    expect(frame.layerTraces).toEqual(layerTraces)
    expect(frame.traces).toHaveLength(3)
  })
})
