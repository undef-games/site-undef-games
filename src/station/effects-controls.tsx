import type { EffectsPresetId, EffectsSettings } from './effects-config'
import { EFFECTS_PRESETS } from './effects-config'

type EffectsControlKey = keyof EffectsSettings

type NumberControl = {
  key: EffectsControlKey
  label: string
  max: number
  min: number
  step: number
}

const EFFECT_GROUPS: { controls: NumberControl[]; label: string }[] = [
  {
    label: 'Scanlines',
    controls: [
      { key: 'scanOpacity', label: 'Scan opacity', min: 0, max: 2, step: 0.05 },
      { key: 'scanSpacing', label: 'Scan spacing', min: 0.5, max: 2, step: 0.05 },
      { key: 'scanSpeed', label: 'Scan speed', min: 0, max: 2, step: 0.05 },
      { key: 'sweepStrength', label: 'Sweep strength', min: 0, max: 2, step: 0.05 },
    ],
  },
  {
    label: 'Interference',
    controls: [
      { key: 'noiseAmount', label: 'Noise amount', min: 0, max: 2, step: 0.05 },
      { key: 'jitterAmount', label: 'Jitter amount', min: 0, max: 2, step: 0.05 },
      { key: 'pointerWake', label: 'Pointer wake', min: 0, max: 2, step: 0.05 },
      { key: 'scrollBoost', label: 'Scroll boost', min: 0, max: 2, step: 0.05 },
    ],
  },
  {
    label: 'Scene effects',
    controls: [
      { key: 'glowStrength', label: 'Glow strength', min: 0, max: 2, step: 0.05 },
      { key: 'frostBlur', label: 'Frost blur', min: 0, max: 2, step: 0.05 },
      { key: 'driftAmount', label: 'Drift amount', min: 0, max: 2, step: 0.05 },
      { key: 'occlusionStrength', label: 'Occlusion strength', min: 0, max: 2, step: 0.05 },
    ],
  },
  {
    label: 'Rectangles',
    controls: [
      { key: 'rectangleOpacity', label: 'Rectangle opacity', min: 0, max: 2, step: 0.05 },
      { key: 'rectangleTravel', label: 'Rectangle travel', min: 0.25, max: 2, step: 0.05 },
      { key: 'rectangleSpin', label: 'Rectangle spin', min: 0, max: 2, step: 0.05 },
        { key: 'rectanglePulse', label: 'Rectangle pulse', min: 0.1, max: 2, step: 0.05 },
      { key: 'rectangleFill', label: 'Rectangle fill', min: 0, max: 2, step: 0.05 },
      { key: 'rectangleBorder', label: 'Rectangle border', min: 0, max: 2, step: 0.05 },
      { key: 'rectangleGlow', label: 'Rectangle glow', min: 0, max: 2, step: 0.05 },
    ],
  },
]

const PALETTE_CONTROLS: { key: EffectsControlKey; label: string }[] = [
  { key: 'paletteBg', label: 'Page bg' },
  { key: 'palettePanel', label: 'Rail bg' },
  { key: 'paletteText', label: 'Text' },
  { key: 'paletteSignal', label: 'Signal' },
  { key: 'paletteMuted', label: 'Muted' },
  { key: 'paletteGlow', label: 'Glow' },
]

export function EffectsControls({
  activePresetId,
  settings,
  onChange,
  onPreset,
}: {
  activePresetId: EffectsPresetId | 'custom'
  settings: EffectsSettings
  onChange: (key: EffectsControlKey, value: string | number) => void
  onPreset: (presetId: EffectsPresetId) => void
}) {
  return (
    <section className="effects-controls" aria-label="effects controls">
      <div className="identity-header">
        <p>Effects</p>
        <span>{activePresetId === 'custom' ? 'custom' : 'preset'}</span>
      </div>

      <div className="preset-buttons" aria-label="effect presets">
        {EFFECTS_PRESETS.map((preset) => (
          <button key={preset.id} type="button" aria-pressed={activePresetId === preset.id} onClick={() => onPreset(preset.id)}>
            {preset.label}
          </button>
        ))}
      </div>

      <div className="palette-controls" aria-label="palette controls">
        {PALETTE_CONTROLS.map((control) => (
          <label key={control.key} className="color-control">
            <span>{control.label}</span>
            <input type="color" value={String(settings[control.key])} onChange={(event) => onChange(control.key, event.currentTarget.value)} />
          </label>
        ))}
      </div>

      {EFFECT_GROUPS.map((group) => (
        <div key={group.label} className="effect-group">
          <p className="control-label">{group.label}</p>
          {group.controls.map((control) => (
            <EffectNumberControl key={control.key} control={control} value={Number(settings[control.key])} onChange={onChange} />
          ))}
        </div>
      ))}
    </section>
  )
}

function EffectNumberControl({
  control,
  onChange,
  value,
}: {
  control: NumberControl
  onChange: (key: EffectsControlKey, value: number) => void
  value: number
}) {
  return (
    <div className="effect-control">
      <label>
        <span>{control.label}</span>
        <input
          type="number"
          aria-label={control.label}
          min={control.min}
          max={control.max}
          step={control.step}
          value={value}
          onChange={(event) => onChange(control.key, Number(event.currentTarget.value))}
        />
      </label>
      <input
        type="range"
        aria-label={`${control.label} slider`}
        min={control.min}
        max={control.max}
        step={control.step}
        value={value}
        onChange={(event) => onChange(control.key, Number(event.currentTarget.value))}
      />
    </div>
  )
}
