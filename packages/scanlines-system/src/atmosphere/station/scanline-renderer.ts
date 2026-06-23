import type { ScanlineBlendMode, ScanlineEngineState, ScanlinePattern } from './scanline-engine'

const TAU = Math.PI * 2

export type TraceSamplePoint = {
  x: number
  y: number
}

export type TracePoint = TraceSamplePoint | null

export type TraceSampleInput = {
  amplitude: number
  baseY: number
  dashLength?: number
  frequency: number
  gapLength?: number
  height: number
  jitter?: number
  phase: number
  sampleCount?: number
  stepSharpness?: number
  width: number
}

export type PlannedTrace = {
  blendMode: ScanlineBlendMode
  kind: ScanlinePattern
  layerId?: string
  opacity: number
  points: TracePoint[]
  thickness: number
}

export type BuildBasePatternTracesInput = {
  basePattern: ScanlineEngineState['basePattern']
  height: number
  signal: number
  time: number
  width: number
}

export type BuildLayerTracesInput = {
  engine: ScanlineEngineState
  height: number
  pointer: { active: boolean; x: number; y: number }
  scrollDepth: number
  time: number
  width: number
}

export type BuildScanlineFrameInput = BuildLayerTracesInput & {
  signal: number
}

export type ScanlineFrame = {
  basePattern: ScanlineEngineState['basePattern']
  baseTraces: PlannedTrace[]
  layerCount: number
  layerTraces: PlannedTrace[]
  traces: PlannedTrace[]
}

export function sampleStraightTrace(input: TraceSampleInput): TracePoint[] {
  return buildTracePoints(input, () => 0)
}

export function sampleSineTrace(input: TraceSampleInput): TracePoint[] {
  return buildTracePoints(input, ({ angle }) => Math.sin(angle))
}

export function sampleAuditTrace(input: TraceSampleInput): TracePoint[] {
  return buildTracePoints(input, ({ angle, stepSharpness }) => {
    const smooth = Math.sin(angle - TAU / 3)
    const stepped = Math.round(smooth * (2 + stepSharpness * 3)) / (2 + stepSharpness * 3)
    return mix(smooth, stepped, 0.45 + stepSharpness * 0.55)
  })
}

export function sampleBrokenTrace(input: TraceSampleInput): TracePoint[] {
  const profile = [0, 7 / 6, -0.5, 0.5, -1, 0, 1]
  return buildTracePoints(input, ({ phaseTurns, stepSharpness, t }) => {
    const stepped = profile[mapProfileIndexFromTurns(t, phaseTurns, profile.length)]
    const smooth = Math.sin(((t + phaseTurns) * TAU * 1.5) - TAU / 6)
    return mix(smooth, stepped, 0.4 + stepSharpness * 0.6)
  })
}

export function samplePulseTrace(input: TraceSampleInput): TracePoint[] {
  const profile = [0, 0, 1.5, 0, -1.5, 0, 0]
  return buildTracePoints(input, ({ phaseTurns, t }) => profile[mapProfileIndexFromTurns(t, phaseTurns, profile.length)])
}

export function buildBasePatternTraces(input: BuildBasePatternTracesInput): PlannedTrace[] {
  const signal = clamp(input.signal / 100, 0, 1)

  return [
    {
      blendMode: 'screen',
      kind: input.basePattern,
      opacity: 0.32 + signal * 0.24,
      points: sampleTrace(input.basePattern, {
        amplitude: input.height * (0.08 + signal * 0.08),
        baseY: input.height * (0.5 - (signal - 0.5) * 0.06),
        frequency: 1 + signal * 0.25,
        height: input.height,
        phase: input.time * 0.05,
        sampleCount: 49,
        width: input.width,
      }),
      thickness: 1.5 + signal * 1.5,
    },
  ]
}

export function buildLayerTraces(input: BuildLayerTracesInput): PlannedTrace[] {
  const centerY = input.height * 0.5
  const scrollDepth = clamp(input.scrollDepth, 0, 1)
  const enabledLayers = input.engine.layers.filter((layer) => layer.enabled)

  return enabledLayers.map((layer, index) => {
    const pointerShift =
      input.pointer.active && layer.role === 'advanced'
        ? input.pointer.y * input.height * 0.03 * (1 + layer.pointerCoupling * 0.7)
        : input.pointer.active
          ? input.pointer.y * input.height * 0.02
          : 0

    const roleOpacity = layer.role === 'advanced' ? 1 : layer.intensity
    const phase =
      layer.phase +
      input.time * (0.08 + layer.speed * 0.18) +
      scrollDepth * (layer.role === 'advanced' ? layer.scrollCoupling * 0.25 : 0.06)
    const frequency = layer.role === 'advanced' ? layer.frequency : 1 + layer.intensity * 0.4
    const amplitude =
      input.height *
      (0.03 + layer.amplitude * 0.08 + (layer.role === 'advanced' ? layer.pointerCoupling * 0.015 : 0))
    const layerSpread =
      input.height *
      (layer.role === 'advanced' ? 0.022 + layer.spacingInfluence * 0.026 : 0.018 + layer.intensity * 0.018)
    const baseY =
      centerY +
      pointerShift +
      input.height * layer.verticalOffset * 0.18 +
      (index - Math.max(0, enabledLayers.length - 1) / 2) * layerSpread

    return {
      blendMode: layer.role === 'advanced' ? layer.blendMode : 'screen',
      kind: layer.kind,
      layerId: layer.id,
      opacity: clamp(layer.opacity * roleOpacity, 0, 1),
      points: sampleTrace(layer.kind, {
        amplitude,
        baseY,
        dashLength: layer.role === 'advanced' ? layer.dashLength : 0,
        frequency,
        gapLength: layer.role === 'advanced' ? layer.gapLength : 0,
        height: input.height,
        jitter: layer.role === 'advanced' ? layer.jitter : layer.intensity * 0.12,
        phase,
        sampleCount: 37,
        stepSharpness: layer.role === 'advanced' ? layer.stepSharpness : 0.35,
        width: input.width,
      }),
      thickness: layer.role === 'advanced' ? Math.max(0.75, layer.thickness * 1.2) : 1 + layer.intensity,
    }
  })
}

export function buildScanlineFrame(input: BuildScanlineFrameInput): ScanlineFrame {
  const baseTraces = buildBasePatternTraces({
    basePattern: input.engine.basePattern,
    height: input.height,
    signal: input.signal,
    time: input.time,
    width: input.width,
  })
  const layerTraces = buildLayerTraces(input)

  return {
    basePattern: input.engine.basePattern,
    baseTraces,
    layerCount: input.engine.layers.length,
    layerTraces,
    traces: [...baseTraces, ...layerTraces],
  }
}

function sampleTrace(kind: ScanlinePattern, input: TraceSampleInput): TracePoint[] {
  switch (kind) {
    case 'straight':
      return sampleStraightTrace(input)
    case 'sine':
      return sampleSineTrace(input)
    case 'audit':
      return sampleAuditTrace(input)
    case 'broken':
      return sampleBrokenTrace(input)
    case 'pulse':
      return samplePulseTrace(input)
  }
}

function buildTracePoints(
  input: TraceSampleInput,
  getNormalizedOffset: (context: {
    angle: number
    index: number
    phaseTurns: number
    sampleCount: number
    stepSharpness: number
    t: number
  }) => number,
): TracePoint[] {
  const sampleCount = Math.max(2, Math.round(input.sampleCount ?? 33))
  const phase = input.phase * TAU
  const phaseTurns = normalizeTurns(input.phase)
  const stepSharpness = clamp(input.stepSharpness ?? 0, 0, 1)
  const dashLength = Math.max(0, input.dashLength ?? 0)
  const gapLength = Math.max(0, input.gapLength ?? 0)
  const cycle = dashLength + gapLength
  const jitter = Math.max(0, input.jitter ?? 0)

  return Array.from({ length: sampleCount }, (_, index) => {
    const t = sampleCount === 1 ? 0 : index / (sampleCount - 1)
    if (cycle > 0) {
      const repeatCount = Math.max(1, Math.round(cycle * Math.max(1, input.frequency)))
      const dashFraction = dashLength / cycle
      const cycleProgress = ((t + input.phase * 0.17) * repeatCount) % 1
      if (cycleProgress > dashFraction) {
        return null
      }
    }
    const angle = t * TAU * input.frequency + phase
    const jitterOffset =
      Math.sin(angle * 3.1 + index * 0.73) * input.amplitude * jitter * 0.22 +
      Math.cos(angle * 1.7 + index * 1.11) * input.amplitude * jitter * 0.08
    return {
      x: t * input.width,
      y: clamp(
        input.baseY +
          getNormalizedOffset({ angle, index, phaseTurns, sampleCount, stepSharpness, t }) * input.amplitude +
          jitterOffset,
        0,
        input.height,
      ),
    }
  })
}

function mapProfileIndexFromTurns(t: number, phaseTurns: number, profileLength: number) {
  const rawTurns = t + phaseTurns
  const wrapped = ((rawTurns % 1) + 1) % 1
  const shifted = wrapped === 0 && rawTurns > 0 ? 1 : wrapped
  return Math.round(shifted * (profileLength - 1))
}

function mix(a: number, b: number, weight: number) {
  const clampedWeight = clamp(weight, 0, 1)
  return a * (1 - clampedWeight) + b * clampedWeight
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function normalizeTurns(value: number) {
  return ((value % 1) + 1) % 1
}
