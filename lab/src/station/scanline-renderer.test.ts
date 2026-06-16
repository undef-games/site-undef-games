import { describe, expect, it } from 'vitest'
import type { ScanlineEngineState } from '@undef/scanlines-system'
import {
  buildBasePatternTraces,
  buildLayerTraces,
  buildScanlineFrame,
  sampleAuditTrace,
  sampleBrokenTrace,
  samplePulseTrace,
  sampleSineTrace,
  sampleStraightTrace,
} from '@undef/scanlines-system'

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
      straight: sampleStraightTrace(SAMPLE_INPUT).flatMap((point) => (point ? [Math.round(point.y)] : [])),
      sine: sampleSineTrace(SAMPLE_INPUT).flatMap((point) => (point ? [Math.round(point.y)] : [])),
      audit: sampleAuditTrace(SAMPLE_INPUT).flatMap((point) => (point ? [Math.round(point.y)] : [])),
      broken: sampleBrokenTrace(SAMPLE_INPUT).flatMap((point) => (point ? [Math.round(point.y)] : [])),
    }

    expect(signatures.straight).toEqual([40, 40, 40, 40, 40, 40, 40])
    expect(signatures.sine).toEqual([40, 50, 50, 40, 30, 30, 40])
    expect(signatures.audit).toEqual([29, 29, 40, 51, 51, 40, 29])
    expect(signatures.broken).toEqual([34, 49, 44, 39, 29, 44, 51])
  })

  it('shifts broken and pulse waveforms when phase changes', () => {
    const brokenA = sampleBrokenTrace(SAMPLE_INPUT).flatMap((point) => (point ? [Math.round(point.y)] : []))
    const brokenB = sampleBrokenTrace({ ...SAMPLE_INPUT, phase: 0.25 }).flatMap((point) => (point ? [Math.round(point.y)] : []))
    const pulseA = samplePulseTrace(SAMPLE_INPUT).flatMap((point) => (point ? [Math.round(point.y)] : []))
    const pulseB = samplePulseTrace({ ...SAMPLE_INPUT, phase: 0.25 }).flatMap((point) => (point ? [Math.round(point.y)] : []))

    expect(brokenB).not.toEqual(brokenA)
    expect(pulseB).not.toEqual(pulseA)
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

  it('keeps enabled layer placement stable when disabled layers are present', () => {
    const baseEngine: ScanlineEngineState = {
      basePattern: 'straight',
      layers: [
        {
          amplitude: 0.45,
          blendMode: 'screen',
          dashLength: 0,
          enabled: true,
          frequency: 1,
          gapLength: 0,
          id: 'layer-a',
          jitter: 0,
          kind: 'straight',
          opacity: 0.7,
          phase: 0,
          pointerCoupling: 0,
          role: 'advanced',
          scrollCoupling: 0,
          spacingInfluence: 0.5,
          speed: 0,
          stepSharpness: 0.5,
          thickness: 1,
          verticalOffset: -0.2,
        },
        {
          amplitude: 0.45,
          blendMode: 'screen',
          dashLength: 0,
          enabled: true,
          frequency: 1,
          gapLength: 0,
          id: 'layer-b',
          jitter: 0,
          kind: 'straight',
          opacity: 0.7,
          phase: 0,
          pointerCoupling: 0,
          role: 'advanced',
          scrollCoupling: 0,
          spacingInfluence: 0.5,
          speed: 0,
          stepSharpness: 0.5,
          thickness: 1,
          verticalOffset: 0.2,
        },
      ],
    }

    const withDisabledMiddle: ScanlineEngineState = {
      ...baseEngine,
      layers: [
        baseEngine.layers[0],
        {
          amplitude: 0.5,
          enabled: false,
          id: 'layer-disabled',
          intensity: 0.6,
          kind: 'pulse',
          opacity: 0.5,
          phase: 0,
          role: 'support',
          speed: 0,
          verticalOffset: 0,
        },
        baseEngine.layers[1],
      ],
    }

    const withoutDisabled = buildLayerTraces({
      engine: baseEngine,
      height: 90,
      pointer: { active: false, x: 0, y: 0 },
      scrollDepth: 0.2,
      time: 0.5,
      width: 180,
    })
    const withDisabled = buildLayerTraces({
      engine: withDisabledMiddle,
      height: 90,
      pointer: { active: false, x: 0, y: 0 },
      scrollDepth: 0.2,
      time: 0.5,
      width: 180,
    })

    expect(withDisabled).toHaveLength(2)
    expect(withDisabled.map((trace) => trace.layerId)).toEqual(withoutDisabled.map((trace) => trace.layerId))
    expect(withDisabled.map((trace) => trace.points)).toEqual(withoutDisabled.map((trace) => trace.points))
  })

  it('applies advanced layer dash, jitter, and step controls to the planned trace', () => {
    const baseLayer: ScanlineEngineState['layers'][number] = {
      amplitude: 0.6,
      blendMode: 'screen',
      dashLength: 0,
      enabled: true,
      frequency: 1,
      gapLength: 0,
      id: 'layer-a',
      jitter: 0,
      kind: 'audit',
      opacity: 0.75,
      phase: 0,
      pointerCoupling: 0,
      role: 'advanced',
      scrollCoupling: 0,
      spacingInfluence: 0.5,
      speed: 0,
      stepSharpness: 0.1,
      thickness: 1.2,
      verticalOffset: 0,
    }

    const plainTrace = buildLayerTraces({
      engine: { basePattern: 'straight', layers: [baseLayer] },
      height: 90,
      pointer: { active: false, x: 0, y: 0 },
      scrollDepth: 0.35,
      time: 1.5,
      width: 180,
    })[0]

    const shapedTrace = buildLayerTraces({
      engine: {
        basePattern: 'straight',
        layers: [
          {
            ...baseLayer,
            dashLength: 1.5,
            gapLength: 1,
            jitter: 0.7,
            stepSharpness: 1,
          },
        ],
      },
      height: 90,
      pointer: { active: false, x: 0, y: 0 },
      scrollDepth: 0.35,
      time: 1.5,
      width: 180,
    })[0]

    expect(plainTrace).toBeDefined()
    expect(shapedTrace).toBeDefined()
    expect(shapedTrace?.points.some((point) => point === null)).toBe(true)
    expect(shapedTrace?.points).not.toEqual(plainTrace?.points)
  })
})
