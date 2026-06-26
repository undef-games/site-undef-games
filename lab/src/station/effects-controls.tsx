import {
  EFFECTS_PRESETS,
  type EffectsPresetId,
  type EffectsSettings,
  type EffectsTone,
  type ScanlineEngineState,
  type ScanlineLayerId,
  type ScanlineLayerMoveDirection,
  type ScanlineLayerPatch,
  type ScanlineLayers,
  type SectionEffectId,
  type SectionEffects,
  type SectionToyEffect,
} from '@undef-games/scanlines-system'
import { ScanlineEngineControls } from './scanline-engine-controls'

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

const TONE_LABELS: Record<EffectsTone, { icon: string; label: string }> = {
  dark: { icon: 'Moon', label: 'Dark' },
  light: { icon: 'Sun', label: 'Light' },
}

const SECTION_EFFECT_OPTIONS: { label: string; value: SectionToyEffect }[] = [
  { label: 'Skinny bars', value: 'bars' },
  { label: 'Tumbling dice', value: 'dice' },
  { label: 'Warp ships', value: 'warp' },
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
  { id: 'graph', label: 'Graph paper layer' },
  { id: 'crt', label: 'CRT monitor layer' },
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
  activeTone,
  darkPresetId,
  lightPresetId,
  onActiveTone,
  onAddScanlineEngineLayer,
  onResetProminent,
  onScanlineLayerChange,
  onDuplicateScanlineEngineLayer,
  onMoveScanlineEngineLayer,
  onResetTheme,
  sectionEffects,
  scanlineEngine,
  scanlineLayers,
  settings,
  onChange,
  onPreset,
  onSectionEffect,
  onRemoveScanlineEngineLayer,
  onUpdateScanlineBasePattern,
  onUpdateScanlineEngineLayer,
}: {
  activePresetId: EffectsPresetId | 'custom'
  activeTone: EffectsTone
  darkPresetId: EffectsPresetId | 'custom'
  lightPresetId: EffectsPresetId | 'custom'
  onActiveTone: (tone: EffectsTone) => void
  onAddScanlineEngineLayer: () => void
  onResetProminent: () => void
  onScanlineLayerChange: (layerId: ScanlineLayerId, active: boolean) => void
  onDuplicateScanlineEngineLayer: (id: string) => void
  onMoveScanlineEngineLayer: (id: string, direction: ScanlineLayerMoveDirection) => void
  onResetTheme: () => void
  sectionEffects: SectionEffects
  scanlineEngine: ScanlineEngineState
  scanlineLayers: ScanlineLayers
  settings: EffectsSettings
  onChange: (key: EffectsControlKey, value: string | number) => void
  onPreset: (tone: EffectsTone, presetId: EffectsPresetId) => void
  onSectionEffect: (sectionId: SectionEffectId, effect: SectionToyEffect) => void
  onRemoveScanlineEngineLayer: (id: string) => void
  onUpdateScanlineBasePattern: (basePattern: ScanlineEngineState['basePattern']) => void
  onUpdateScanlineEngineLayer: (id: string, patch: ScanlineLayerPatch) => void
}) {
  const renderPresetSelect = (tone: EffectsTone, presetId: EffectsPresetId | 'custom') => (
    <label className="preset-select-control">
      <span>{TONE_LABELS[tone].label} theme preset</span>
      <select
        aria-label={`${TONE_LABELS[tone].label} theme preset`}
        value={presetId === 'custom' ? 'custom' : presetId}
        onChange={(event) => {
          if (event.currentTarget.value !== 'custom') {
            onPreset(tone, event.currentTarget.value)
          }
        }}
      >
        {presetId === 'custom' ? <option value="custom">Custom</option> : null}
        {EFFECTS_PRESETS.filter((preset) => preset.tone === tone).map((preset) => (
          <option key={preset.id} value={preset.id}>
            {preset.label}
          </option>
        ))}
      </select>
    </label>
  )

  return (
    <section className="effects-controls" aria-label="effects controls">
      <div className="identity-header">
        <p>Effects</p>
        <span>{activePresetId === 'custom' ? `${activeTone} custom` : `${activeTone} preset`}</span>
      </div>

      <div className="theme-mode-control" aria-label="theme mode">
        {(['dark', 'light'] as const).map((tone) => (
          <button
            key={tone}
            type="button"
            aria-label={`${TONE_LABELS[tone].label} mode`}
            aria-pressed={activeTone === tone}
            onClick={() => onActiveTone(tone)}
          >
            <span aria-hidden="true">{TONE_LABELS[tone].icon}</span>
            {TONE_LABELS[tone].label}
          </button>
        ))}
      </div>

      <div className="theme-preset-grid" aria-label="theme presets">
        {renderPresetSelect('dark', darkPresetId)}
        {renderPresetSelect('light', lightPresetId)}
        <button
          className="reset-theme-button"
          type="button"
          onClick={onResetTheme}
        >
          Reset theme
        </button>
        <button
          className="reset-prominent-button"
          type="button"
          onClick={onResetProminent}
        >
          Reset intros
        </button>
      </div>

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
        <div
          key={group.label}
          className={`effect-group-section effect-group-section--${group.label.toLowerCase().replace(/\s+/g, '-')}`}
        >
          <div className="effect-group">
            <p className="control-label">{group.label}</p>
            {group.controls.map((control) => (
              <EffectNumberControl key={control.key} control={control} value={Number(settings[control.key])} onChange={onChange} />
            ))}
          </div>
          {group.label === 'Scanlines' ? (
            <ScanlineEngineControls
              engine={scanlineEngine}
              onAddLayer={onAddScanlineEngineLayer}
              onDuplicateLayer={onDuplicateScanlineEngineLayer}
              onMoveLayer={onMoveScanlineEngineLayer}
              onRemoveLayer={onRemoveScanlineEngineLayer}
              onUpdateBasePattern={onUpdateScanlineBasePattern}
              onUpdateLayer={onUpdateScanlineEngineLayer}
            />
          ) : null}
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
