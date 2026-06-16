export const MAX_SCANLINE_ENGINE_LAYERS = 13 as const

export type ScanlinePattern = 'straight' | 'sine' | 'audit' | 'broken' | 'pulse'
export type ScanlineBlendMode = 'add' | 'screen' | 'soft-light' | 'difference'

export type ScanlineLayerBase = {
  id: string
  enabled: boolean
  kind: ScanlinePattern
  opacity: number
  speed: number
  amplitude: number
  verticalOffset: number
  phase: number
}

export type AdvancedScanlineLayer = ScanlineLayerBase & {
  role: 'advanced'
  blendMode: ScanlineBlendMode
  spacingInfluence: number
  frequency: number
  thickness: number
  jitter: number
  dashLength: number
  gapLength: number
  stepSharpness: number
  scrollCoupling: number
  pointerCoupling: number
}

export type SupportingScanlineLayer = ScanlineLayerBase & {
  role: 'support'
  intensity: number
}

export type ScanlineLayer = AdvancedScanlineLayer | SupportingScanlineLayer

export type ScanlineEngineState = {
  basePattern: Exclude<ScanlinePattern, 'pulse'>
  layers: ScanlineLayer[]
}

export type ScanlineLayerMoveDirection = 'up' | 'down'

type AdvancedScanlineLayerFields = Omit<AdvancedScanlineLayer, keyof ScanlineLayerBase | 'role'>
type SupportingScanlineLayerFields = Omit<SupportingScanlineLayer, keyof ScanlineLayerBase | 'role'>

export type ScanlineLayerPatch =
  Partial<Omit<ScanlineLayerBase, 'id'>> &
  Partial<AdvancedScanlineLayerFields> &
  Partial<SupportingScanlineLayerFields>

type ScanlineLayerTemplate =
  Partial<ScanlineLayerBase> &
  Partial<AdvancedScanlineLayerFields> &
  Partial<SupportingScanlineLayerFields> & {
    role?: ScanlineLayer['role']
  }

const ADVANCED_LAYER_COUNT = 3

export function createDefaultScanlineEngine(): ScanlineEngineState {
  return {
    basePattern: 'straight',
    layers: [],
  }
}

export function createScanlineLayer(kind: ScanlinePattern, index: number): ScanlineLayer {
  return createLayerFromTemplate({ kind }, index)
}

export function addScanlineLayer(engine: ScanlineEngineState, kind: ScanlinePattern): ScanlineEngineState {
  if (engine.layers.length >= MAX_SCANLINE_ENGINE_LAYERS) {
    return { ...engine, layers: engine.layers.map((layer) => ({ ...layer })) }
  }

  return {
    ...engine,
    layers: normalizeLayers([...engine.layers, createScanlineLayer(kind, engine.layers.length)]),
  }
}

export function duplicateScanlineLayer(engine: ScanlineEngineState, id: string): ScanlineEngineState {
  if (engine.layers.length >= MAX_SCANLINE_ENGINE_LAYERS) {
    return { ...engine, layers: engine.layers.map((layer) => ({ ...layer })) }
  }

  const index = engine.layers.findIndex((layer) => layer.id === id)
  if (index < 0) {
    return { ...engine, layers: engine.layers.map((layer) => ({ ...layer })) }
  }

  const source = engine.layers[index]
  const duplicate = createLayerFromTemplate({ ...source, id: undefined }, index + 1)

  return {
    ...engine,
    layers: normalizeLayers([
      ...engine.layers.slice(0, index + 1),
      duplicate,
      ...engine.layers.slice(index + 1),
    ]),
  }
}

export function removeScanlineLayer(engine: ScanlineEngineState, id: string): ScanlineEngineState {
  return {
    ...engine,
    layers: normalizeLayers(engine.layers.filter((layer) => layer.id !== id)),
  }
}

export function moveScanlineLayer(
  engine: ScanlineEngineState,
  id: string,
  direction: ScanlineLayerMoveDirection,
): ScanlineEngineState {
  const index = engine.layers.findIndex((layer) => layer.id === id)
  if (index < 0) {
    return { ...engine, layers: engine.layers.map((layer) => ({ ...layer })) }
  }

  const targetIndex = direction === 'up' ? index - 1 : index + 1
  if (targetIndex < 0 || targetIndex >= engine.layers.length) {
    return { ...engine, layers: engine.layers.map((layer) => ({ ...layer })) }
  }

  const layers = engine.layers.slice()
  const [layer] = layers.splice(index, 1)
  layers.splice(targetIndex, 0, layer)

  return {
    ...engine,
    layers: normalizeLayers(layers),
  }
}

export function updateScanlineLayer(
  engine: ScanlineEngineState,
  id: string,
  patch: ScanlineLayerPatch,
): ScanlineEngineState {
  return {
    ...engine,
    layers: normalizeLayers(engine.layers.map((layer) => (layer.id === id ? { ...layer, ...patch, id } : layer))),
  }
}

function normalizeLayers(layers: ScanlineLayer[]): ScanlineLayer[] {
  return layers.slice(0, MAX_SCANLINE_ENGINE_LAYERS).map((layer, index) => createLayerFromTemplate(layer, index))
}

function createLayerFromTemplate(template: ScanlineLayerTemplate, index: number): ScanlineLayer {
  const base: ScanlineLayerBase = {
    id: template.id ?? createScanlineLayerId(),
    enabled: template.enabled ?? true,
    kind: template.kind ?? 'straight',
    opacity: template.opacity ?? 0.6,
    speed: template.speed ?? 0,
    amplitude: template.amplitude ?? 0.4,
    verticalOffset: template.verticalOffset ?? 0,
    phase: template.phase ?? 0,
  }

  if (index < ADVANCED_LAYER_COUNT) {
    return {
      ...base,
      role: 'advanced',
      blendMode: template.blendMode ?? 'screen',
      spacingInfluence: template.spacingInfluence ?? 0.5,
      frequency: template.frequency ?? 1,
      thickness: template.thickness ?? 1,
      jitter: template.jitter ?? 0,
      dashLength: template.dashLength ?? 0,
      gapLength: template.gapLength ?? 0,
      stepSharpness: template.stepSharpness ?? 0.5,
      scrollCoupling: template.scrollCoupling ?? 0,
      pointerCoupling: template.pointerCoupling ?? 0,
    }
  }

  return {
    ...base,
    role: 'support',
    intensity: template.intensity ?? 0.5,
  }
}

function createScanlineLayerId(): string {
  return `scanline-layer-${globalThis.crypto.randomUUID()}`
}
