import type { ScanlineBlendMode, ScanlineEngineState, ScanlinePattern } from './scanline-engine'

const TAU = Math.PI * 2

export type TraceSamplePoint = {
  x: number
  y: number
}

export type TraceSampleInput = {
  amplitude: number
  baseY: number
  frequency: number
  height: number
  phase: number
  sampleCount?: number
  width: number
}

export type PlannedTrace = {
  blendMode: ScanlineBlendMode
  kind: ScanlinePattern
  layerId?: string
  opacity: number
  points: TraceSamplePoint[]
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

export function sampleStraightTrace(input: TraceSampleInput): TraceSamplePoint[] {
  return buildTracePoints(input, () => 0)
}

export function sampleSineTrace(input: TraceSampleInput): TraceSamplePoint[] {
  return buildTracePoints(input, ({ angle }) => Math.sin(angle))
}

export function sampleAuditTrace(input: TraceSampleInput): TraceSamplePoint[] {
  return buildTracePoints(input, ({ angle }) => Math.round(Math.sin(angle - TAU / 3)))
}

export function sampleBrokenTrace(input: TraceSampleInput): TraceSamplePoint[] {
  const profile = [0, 7 / 6, -0.5, 0.5, -1, 0, 1]
  return buildTracePoints(input, ({ index, sampleCount }) => profile[mapProfileIndex(index, sampleCount, profile.length)])
}

export function samplePulseTrace(input: TraceSampleInput): TraceSamplePoint[] {
  const profile = [0, 0, 1.5, 0, -1.5, 0, 0]
  return buildTracePoints(input, ({ index, sampleCount }) => profile[mapProfileIndex(index, sampleCount, profile.length)])
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
  const pointerShift = input.pointer.active ? input.pointer.y * input.height * 0.05 : 0

  return input.engine.layers.flatMap((layer, index) => {
    if (!layer.enabled) return []

    const roleOpacity = layer.role === 'advanced' ? 1 : layer.intensity
    const phase =
      layer.phase +
      input.time * (0.08 + layer.speed * 0.18) +
      scrollDepth * (layer.role === 'advanced' ? layer.scrollCoupling * 0.25 : 0.06)
    const frequency = layer.role === 'advanced' ? layer.frequency : 1 + layer.intensity * 0.4
    const amplitude =
      input.height *
      (0.03 + layer.amplitude * 0.08 + (layer.role === 'advanced' ? layer.pointerCoupling * 0.015 : 0))
    const baseY =
      centerY +
      pointerShift +
      input.height * layer.verticalOffset * 0.18 +
      (index - Math.max(0, input.engine.layers.length - 1) / 2) * input.height * 0.035

    return [
      {
        blendMode: layer.role === 'advanced' ? layer.blendMode : 'screen',
        kind: layer.kind,
        layerId: layer.id,
        opacity: clamp(layer.opacity * roleOpacity, 0, 1),
        points: sampleTrace(layer.kind, {
          amplitude,
          baseY,
          frequency,
          height: input.height,
          phase,
          sampleCount: 37,
          width: input.width,
        }),
        thickness: layer.role === 'advanced' ? Math.max(0.75, layer.thickness * 1.2) : 1 + layer.intensity,
      },
    ]
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

function sampleTrace(kind: ScanlinePattern, input: TraceSampleInput): TraceSamplePoint[] {
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
  getNormalizedOffset: (context: { angle: number; index: number; sampleCount: number; t: number }) => number,
): TraceSamplePoint[] {
  const sampleCount = Math.max(2, Math.round(input.sampleCount ?? 33))
  const phase = input.phase * TAU

  return Array.from({ length: sampleCount }, (_, index) => {
    const t = sampleCount === 1 ? 0 : index / (sampleCount - 1)
    const angle = t * TAU * input.frequency + phase
    return {
      x: t * input.width,
      y: clamp(input.baseY + getNormalizedOffset({ angle, index, sampleCount, t }) * input.amplitude, 0, input.height),
    }
  })
}

function mapProfileIndex(index: number, sampleCount: number, profileLength: number) {
  if (sampleCount <= 1) return 0
  return Math.round((index / (sampleCount - 1)) * (profileLength - 1))
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}
