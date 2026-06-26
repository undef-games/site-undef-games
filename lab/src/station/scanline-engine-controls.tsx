import {
  MAX_SCANLINE_ENGINE_LAYERS,
  ScanlinesButton,
  type ScanlineBlendMode,
  type ScanlineEngineState,
  type ScanlineLayer,
  type ScanlineLayerMoveDirection,
  type ScanlineLayerPatch,
  type ScanlinePattern,
} from '@undef-games/scanlines-system'
import { CONTROL_VARIANTS } from '../ui/control-variants'

const BASE_PATTERN_OPTIONS: { label: string; value: ScanlineEngineState['basePattern'] }[] = [
  { label: 'Straight', value: 'straight' },
  { label: 'Sine', value: 'sine' },
  { label: 'Audit', value: 'audit' },
  { label: 'Broken', value: 'broken' },
]

const LAYER_PATTERN_OPTIONS: { label: string; value: ScanlinePattern }[] = [
  ...BASE_PATTERN_OPTIONS,
  { label: 'Pulse', value: 'pulse' },
]

const BLEND_MODE_OPTIONS: { label: string; value: ScanlineBlendMode }[] = [
  { label: 'Add', value: 'add' },
  { label: 'Screen', value: 'screen' },
  { label: 'Soft light', value: 'soft-light' },
  { label: 'Difference', value: 'difference' },
]

const COMMON_NUMBER_CONTROLS: {
  key: keyof Pick<ScanlineLayer, 'opacity' | 'speed' | 'amplitude' | 'verticalOffset' | 'phase'>
  label: string
  max: number
  min: number
  step: number
}[] = [
  { key: 'opacity', label: 'Opacity', min: 0, max: 1, step: 0.05 },
  { key: 'speed', label: 'Speed', min: -2, max: 2, step: 0.05 },
  { key: 'amplitude', label: 'Amplitude', min: 0, max: 2, step: 0.05 },
  { key: 'verticalOffset', label: 'Vertical offset', min: -2, max: 2, step: 0.05 },
  { key: 'phase', label: 'Phase', min: -1, max: 1, step: 0.05 },
]

const ADVANCED_NUMBER_CONTROLS = [
  { key: 'spacingInfluence', label: 'Spacing influence', min: 0, max: 2, step: 0.05 },
  { key: 'frequency', label: 'Frequency', min: 0.1, max: 4, step: 0.05 },
  { key: 'thickness', label: 'Thickness', min: 0.1, max: 3, step: 0.05 },
  { key: 'jitter', label: 'Jitter', min: 0, max: 2, step: 0.05 },
  { key: 'dashLength', label: 'Dash length', min: 0, max: 4, step: 0.05 },
  { key: 'gapLength', label: 'Gap length', min: 0, max: 4, step: 0.05 },
  { key: 'stepSharpness', label: 'Step sharpness', min: 0, max: 1, step: 0.05 },
  { key: 'scrollCoupling', label: 'Scroll coupling', min: 0, max: 2, step: 0.05 },
  { key: 'pointerCoupling', label: 'Pointer coupling', min: 0, max: 2, step: 0.05 },
] as const

export function ScanlineEngineControls({
  engine,
  onAddLayer,
  onDuplicateLayer,
  onMoveLayer,
  onRemoveLayer,
  onUpdateBasePattern,
  onUpdateLayer,
}: {
  engine: ScanlineEngineState
  onAddLayer: () => void
  onDuplicateLayer: (id: string) => void
  onMoveLayer: (id: string, direction: ScanlineLayerMoveDirection) => void
  onRemoveLayer: (id: string) => void
  onUpdateBasePattern: (basePattern: ScanlineEngineState['basePattern']) => void
  onUpdateLayer: (id: string, patch: ScanlineLayerPatch) => void
}) {
  const layerCount = engine.layers.length
  const canAddLayer = layerCount < MAX_SCANLINE_ENGINE_LAYERS

  return (
    <section className="scanline-engine-controls" aria-label="scanline engine">
      <div className="scanline-engine-header">
        <div>
          <p className="control-label">Scanline engine</p>
          <p className="scanline-engine-count">
            {layerCount} / {MAX_SCANLINE_ENGINE_LAYERS} layers
          </p>
        </div>
        <ScanlinesButton type="button" className="scanline-engine-add" variant={CONTROL_VARIANTS.addLayer} onClick={onAddLayer} disabled={!canAddLayer}>
          Add scanline layer
        </ScanlinesButton>
      </div>

      <label className="scanline-engine-base-pattern">
        <span>Base pattern</span>
        <select
          aria-label="Base pattern"
          value={engine.basePattern}
          onChange={(event) => onUpdateBasePattern(event.currentTarget.value as ScanlineEngineState['basePattern'])}
        >
          {BASE_PATTERN_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <ol className="scanline-engine-layer-list" aria-label="scanline engine layers">
        {engine.layers.map((layer, index) => (
          <li key={layer.id} className="scanline-engine-layer" aria-label={`Layer ${index + 1}`}>
            <div className="scanline-engine-layer-topline">
              <h3>Layer {index + 1}</h3>
              <span>{layer.role === 'advanced' ? 'Advanced' : 'Support'}</span>
            </div>

            <div className="scanline-engine-row-actions">
              <ScanlinesButton type="button" variant={CONTROL_VARIANTS.duplicateLayer} onClick={() => onDuplicateLayer(layer.id)}>
                Duplicate
              </ScanlinesButton>
              <ScanlinesButton type="button" variant={CONTROL_VARIANTS.toggleLayer} onClick={() => onUpdateLayer(layer.id, { enabled: !layer.enabled })}>
                {layer.enabled ? 'Mute' : 'Unmute'}
              </ScanlinesButton>
              <ScanlinesButton type="button" variant={CONTROL_VARIANTS.removeLayer} onClick={() => onRemoveLayer(layer.id)}>
                Delete
              </ScanlinesButton>
              <ScanlinesButton type="button" variant={CONTROL_VARIANTS.moveLayer} onClick={() => onMoveLayer(layer.id, 'up')} disabled={index === 0}>
                Move up
              </ScanlinesButton>
              <ScanlinesButton
                type="button"
                variant={CONTROL_VARIANTS.moveLayer}
                onClick={() => onMoveLayer(layer.id, 'down')}
                disabled={index === engine.layers.length - 1}
              >
                Move down
              </ScanlinesButton>
            </div>

            <div className="scanline-engine-control-grid">
              <label>
                <span>Pattern</span>
                <select
                  aria-label="Pattern"
                  value={layer.kind}
                  onChange={(event) => onUpdateLayer(layer.id, { kind: event.currentTarget.value as ScanlinePattern })}
                >
                  {LAYER_PATTERN_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              {COMMON_NUMBER_CONTROLS.map((control) => (
                <NumberField
                  key={control.key}
                  label={control.label}
                  value={layer[control.key]}
                  min={control.min}
                  max={control.max}
                  step={control.step}
                  onChange={(value) => onUpdateLayer(layer.id, { [control.key]: value })}
                />
              ))}

              {layer.role === 'advanced' ? (
                <>
                  <label>
                    <span>Blend mode</span>
                    <select
                      aria-label="Blend mode"
                      value={layer.blendMode}
                      onChange={(event) =>
                        onUpdateLayer(layer.id, {
                          blendMode: event.currentTarget.value as ScanlineBlendMode,
                        } as ScanlineLayerPatch)
                      }
                    >
                      {BLEND_MODE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  {ADVANCED_NUMBER_CONTROLS.map((control) => (
                    <NumberField
                      key={control.key}
                      label={control.label}
                      value={layer[control.key]}
                      min={control.min}
                      max={control.max}
                      step={control.step}
                      onChange={(value) => onUpdateLayer(layer.id, { [control.key]: value })}
                    />
                  ))}
                </>
              ) : (
                <NumberField
                  label="Intensity"
                  value={layer.intensity}
                  min={0}
                  max={2}
                  step={0.05}
                  onChange={(value) => onUpdateLayer(layer.id, { intensity: value } as ScanlineLayerPatch)}
                />
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}

function NumberField({
  label,
  max,
  min,
  onChange,
  step,
  value,
}: {
  label: string
  max: number
  min: number
  onChange: (value: number) => void
  step: number
  value: number
}) {
  return (
    <label>
      <span>{label}</span>
      <input
        aria-label={label}
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.currentTarget.value))}
      />
    </label>
  )
}
