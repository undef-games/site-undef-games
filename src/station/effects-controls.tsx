import type { EffectsPresetId, EffectsSettings, EffectsTone } from './effects-config'
import { EFFECTS_PRESETS } from './effects-config'
import type { SectionEffectId, SectionEffects, SectionToyEffect } from './station-toys'

type EffectsControlKey = keyof EffectsSettings
export type ScanlineLayerId = 'crt' | 'glitch'
export type ScanlineLayers = Record<ScanlineLayerId, boolean>

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
      { key: 'scanScrollImpact', label: 'Scan scroll impact', min: 0, max: 2, step: 0.05 },
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
      { key: 'scrollInertia', label: 'Scroll inertia', min: 0.02, max: 0.5, step: 0.01 },
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
      { key: 'rectangleWobble', label: 'Rectangle wobble', min: 0, max: 2, step: 0.05 },
    ],
  },
]

const PALETTE_CONTROLS: { key: EffectsControlKey; label: string }[] = [
  { key: 'paletteBg', label: 'Page bg' },
  { key: 'palettePanel', label: 'Rail bg' },
  { key: 'paletteTextOnDark', label: 'Text on dark' },
  { key: 'paletteTextOnLight', label: 'Text on light' },
  { key: 'paletteSignal', label: 'Signal' },
  { key: 'paletteMuted', label: 'Muted' },
  { key: 'paletteGlow', label: 'Glow' },
  { key: 'paletteSupport1', label: 'Support 1' },
  { key: 'paletteSupport2', label: 'Support 2' },
  { key: 'paletteSupport3', label: 'Support 3' },
]

const PRESET_GROUPS: { icon: string; label: string; tone: EffectsTone }[] = [
  { icon: '🌙', label: 'Dark presets', tone: 'dark' },
  { icon: '☀️', label: 'Light presets', tone: 'light' },
]

const SECTION_EFFECT_OPTIONS: { label: string; value: SectionToyEffect }[] = [
  { label: 'Skinny bars', value: 'bars' },
  { label: 'Tumble rectangles', value: 'tumble' },
  { label: 'Classic CRT', value: 'crt' },
  { label: 'Bouncing notes', value: 'notes' },
  { label: 'Pixel scatter', value: 'scatter' },
  { label: 'Offset frames', value: 'frames' },
  { label: 'Signal rails', value: 'rails' },
  { label: 'Stacked rungs', value: 'rungs' },
  { label: 'Signal slabs', value: 'slab' },
]

const SCANLINE_LAYER_OPTIONS: { id: ScanlineLayerId; label: string }[] = [
  { id: 'crt', label: 'CRT scanline layer' },
  { id: 'glitch', label: 'Glitch scanline layer' },
]

const SECTION_EFFECT_CONTROLS: { id: SectionEffectId; label: string }[] = [
  { id: 'signal', label: 'Signal' },
  { id: 'projects', label: 'Projects' },
  { id: 'warp', label: 'WARP' },
  { id: 'dice', label: 'Dice' },
  { id: 'taybols', label: 'Taybols' },
  { id: 'identity', label: 'Identity' },
]

export function EffectsControls({
  activePresetId,
  onScanlineLayerChange,
  sectionEffects,
  scanlineLayers,
  settings,
  onChange,
  onPreset,
  onSectionEffect,
}: {
  activePresetId: EffectsPresetId | 'custom'
  onScanlineLayerChange: (layerId: ScanlineLayerId, active: boolean) => void
  sectionEffects: SectionEffects
  scanlineLayers: ScanlineLayers
  settings: EffectsSettings
  onChange: (key: EffectsControlKey, value: string | number) => void
  onPreset: (presetId: EffectsPresetId) => void
  onSectionEffect: (sectionId: SectionEffectId, effect: SectionToyEffect) => void
}) {
  return (
    <section className="effects-controls" aria-label="effects controls">
      <div className="identity-header">
        <p>Effects</p>
        <span>{activePresetId === 'custom' ? 'custom' : 'preset'}</span>
      </div>

      <label className="preset-select-control">
        <span>Preset</span>
        <select
          aria-label="Effect preset"
          value={activePresetId === 'custom' ? 'custom' : activePresetId}
          onChange={(event) => onPreset(event.currentTarget.value)}
        >
          {activePresetId === 'custom' ? <option value="custom">Custom</option> : null}
          {PRESET_GROUPS.map((group) => (
            <optgroup key={group.tone} label={`${group.icon} ${group.label}`}>
              {EFFECTS_PRESETS.filter((preset) => preset.tone === group.tone).map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {group.icon} {preset.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </label>

      <div className="palette-controls" aria-label="palette controls">
        {PALETTE_CONTROLS.map((control) => (
          <label key={control.key} className="color-control">
            <span>{control.label}</span>
            <input type="color" value={String(settings[control.key])} onChange={(event) => onChange(control.key, event.currentTarget.value)} />
          </label>
        ))}
      </div>

      <div className="section-effect-controls" aria-label="section background controls">
        <p className="control-label">Section backgrounds</p>
        {SECTION_EFFECT_CONTROLS.map((control) => (
          <label key={control.id} className="section-effect-control">
            <span>{control.label}</span>
            <select
              aria-label={`${control.label} background`}
              value={sectionEffects[control.id]}
              onChange={(event) => onSectionEffect(control.id, event.currentTarget.value as SectionToyEffect)}
            >
              {SECTION_EFFECT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>

      <div className="scanline-layer-controls" aria-label="scanline layer controls">
        <p className="control-label">Scanline layers</p>
        {SCANLINE_LAYER_OPTIONS.map((option) => (
          <label key={option.id} className="scanline-layer-control">
            <input
              type="checkbox"
              aria-label={option.label}
              checked={scanlineLayers[option.id]}
              onChange={(event) => onScanlineLayerChange(option.id, event.currentTarget.checked)}
            />
            <span className="scanline-check" aria-hidden="true" />
            <span className="scanline-layer-label">{option.label}</span>
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
