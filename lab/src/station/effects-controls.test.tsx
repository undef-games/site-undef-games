import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  BASELINE_EFFECTS,
  createDefaultScanlineEngine,
  DEFAULT_SCANLINE_LAYERS,
  DEFAULT_SECTION_EFFECTS,
  EFFECTS_PRESETS,
  type EffectsPresetId,
  type EffectsSettings,
  type EffectsTone,
  type ScanlineEngineState,
  type ScanlineLayers,
  type SectionEffects,
} from '@undef-games/scanlines-system'
import { EffectsControls } from './effects-controls'

afterEach(() => {
  cleanup()
})

// Pick stable preset IDs from the exported presets list.
const darkPresets = EFFECTS_PRESETS.filter((p) => p.tone === 'dark')
const lightPresets = EFFECTS_PRESETS.filter((p) => p.tone === 'light')
const DARK_PRESET_ID = darkPresets[0].id
const DARK_PRESET_2_ID = darkPresets[1].id
const LIGHT_PRESET_ID = lightPresets[0].id
const LIGHT_PRESET_2_ID = lightPresets[1].id

type EffectsControlsProps = Parameters<typeof EffectsControls>[0]

function makeProps(overrides: Partial<EffectsControlsProps> = {}): EffectsControlsProps {
  return {
    activePresetId: DARK_PRESET_ID,
    activeTone: 'dark',
    darkPresetId: DARK_PRESET_ID,
    lightPresetId: LIGHT_PRESET_ID,
    onActiveTone: vi.fn(),
    onAddScanlineEngineLayer: vi.fn(),
    onResetProminent: vi.fn(),
    onScanlineLayerChange: vi.fn(),
    onDuplicateScanlineEngineLayer: vi.fn(),
    onMoveScanlineEngineLayer: vi.fn(),
    onResetTheme: vi.fn(),
    sectionEffects: { ...DEFAULT_SECTION_EFFECTS },
    scanlineEngine: createDefaultScanlineEngine(),
    scanlineLayers: { ...DEFAULT_SCANLINE_LAYERS },
    settings: { ...BASELINE_EFFECTS },
    onChange: vi.fn(),
    onPreset: vi.fn(),
    onSectionEffect: vi.fn(),
    onRemoveScanlineEngineLayer: vi.fn(),
    onUpdateScanlineBasePattern: vi.fn(),
    onUpdateScanlineEngineLayer: vi.fn(),
    ...overrides,
  }
}

// ─── Header ───────────────────────────────────────────────────────────────────

describe('EffectsControls — identity header', () => {
  it('shows "<tone> preset" when activePresetId is not custom', () => {
    render(<EffectsControls {...makeProps({ activePresetId: DARK_PRESET_ID, activeTone: 'dark' })} />)

    expect(screen.getByText('dark preset')).toBeInTheDocument()
  })

  it('shows "<tone> custom" when activePresetId is custom', () => {
    render(<EffectsControls {...makeProps({ activePresetId: 'custom', activeTone: 'light' })} />)

    expect(screen.getByText('light custom')).toBeInTheDocument()
  })
})

// ─── Theme mode (tone) buttons ─────────────────────────────────────────────

describe('EffectsControls — theme mode buttons', () => {
  it('marks the active tone button as pressed and the inactive one as not pressed', () => {
    render(<EffectsControls {...makeProps({ activeTone: 'dark' })} />)

    expect(screen.getByRole('button', { name: 'Dark mode' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Light mode' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('marks the light button as pressed when activeTone is light', () => {
    render(<EffectsControls {...makeProps({ activeTone: 'light' })} />)

    expect(screen.getByRole('button', { name: 'Light mode' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Dark mode' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('calls onActiveTone("dark") when Dark mode is clicked', async () => {
    const user = userEvent.setup()
    const onActiveTone = vi.fn()
    render(<EffectsControls {...makeProps({ activeTone: 'light', onActiveTone })} />)

    await user.click(screen.getByRole('button', { name: 'Dark mode' }))

    expect(onActiveTone).toHaveBeenCalledWith<[EffectsTone]>('dark')
  })

  it('calls onActiveTone("light") when Light mode is clicked', async () => {
    const user = userEvent.setup()
    const onActiveTone = vi.fn()
    render(<EffectsControls {...makeProps({ activeTone: 'dark', onActiveTone })} />)

    await user.click(screen.getByRole('button', { name: 'Light mode' }))

    expect(onActiveTone).toHaveBeenCalledWith<[EffectsTone]>('light')
  })
})

// ─── Preset selects ────────────────────────────────────────────────────────

describe('EffectsControls — preset selects', () => {
  it('shows the dark preset select with the correct selected value when not custom', () => {
    render(<EffectsControls {...makeProps({ darkPresetId: DARK_PRESET_ID })} />)

    const select = screen.getByLabelText('Dark theme preset') as HTMLSelectElement
    expect(select.value).toBe(DARK_PRESET_ID)
  })

  it('shows a Custom option in the dark preset select when darkPresetId is "custom"', () => {
    render(<EffectsControls {...makeProps({ darkPresetId: 'custom' })} />)

    const select = screen.getByLabelText('Dark theme preset') as HTMLSelectElement
    expect(select.value).toBe('custom')
    expect(screen.getByRole('option', { name: 'Custom' })).toBeInTheDocument()
  })

  it('does NOT show a Custom option in the dark preset select when darkPresetId is a real preset', () => {
    render(<EffectsControls {...makeProps({ darkPresetId: DARK_PRESET_ID })} />)

    const select = screen.getByLabelText('Dark theme preset')
    const options = Array.from(select.querySelectorAll('option'))
    expect(options.map((o) => o.value)).not.toContain('custom')
  })

  it('shows the light preset select with the correct selected value', () => {
    render(<EffectsControls {...makeProps({ lightPresetId: LIGHT_PRESET_ID })} />)

    const select = screen.getByLabelText('Light theme preset') as HTMLSelectElement
    expect(select.value).toBe(LIGHT_PRESET_ID)
  })

  it('shows a Custom option in the light preset select when lightPresetId is "custom"', () => {
    render(<EffectsControls {...makeProps({ lightPresetId: 'custom' })} />)

    const select = screen.getByLabelText('Light theme preset') as HTMLSelectElement
    expect(select.value).toBe('custom')
  })

  it('calls onPreset("dark", presetId) when the dark preset select changes to a real preset', async () => {
    const user = userEvent.setup()
    const onPreset = vi.fn()
    render(<EffectsControls {...makeProps({ darkPresetId: DARK_PRESET_ID, onPreset })} />)

    await user.selectOptions(screen.getByLabelText('Dark theme preset'), DARK_PRESET_2_ID)

    expect(onPreset).toHaveBeenCalledWith<[EffectsTone, EffectsPresetId]>('dark', DARK_PRESET_2_ID)
  })

  it('does NOT call onPreset when the dark preset select changes to "custom"', async () => {
    const user = userEvent.setup()
    const onPreset = vi.fn()
    // Render with custom so the custom option is available to select
    render(<EffectsControls {...makeProps({ darkPresetId: 'custom', onPreset })} />)

    // Select an actual preset so the select is on a non-custom; then go back to custom
    await user.selectOptions(screen.getByLabelText('Dark theme preset'), 'custom')

    expect(onPreset).not.toHaveBeenCalled()
  })

  it('calls onPreset("light", presetId) when the light preset select changes', async () => {
    const user = userEvent.setup()
    const onPreset = vi.fn()
    render(<EffectsControls {...makeProps({ lightPresetId: LIGHT_PRESET_ID, onPreset })} />)

    await user.selectOptions(screen.getByLabelText('Light theme preset'), LIGHT_PRESET_2_ID)

    expect(onPreset).toHaveBeenCalledWith<[EffectsTone, EffectsPresetId]>('light', LIGHT_PRESET_2_ID)
  })

  it('calls onResetTheme when Reset theme is clicked', async () => {
    const user = userEvent.setup()
    const onResetTheme = vi.fn()
    render(<EffectsControls {...makeProps({ onResetTheme })} />)

    await user.click(screen.getByRole('button', { name: 'Reset theme' }))

    expect(onResetTheme).toHaveBeenCalledTimes(1)
  })

  it('calls onResetProminent when Reset intros is clicked', async () => {
    const user = userEvent.setup()
    const onResetProminent = vi.fn()
    render(<EffectsControls {...makeProps({ onResetProminent })} />)

    await user.click(screen.getByRole('button', { name: 'Reset intros' }))

    expect(onResetProminent).toHaveBeenCalledTimes(1)
  })
})

// ─── Palette color inputs ──────────────────────────────────────────────────

describe('EffectsControls — palette color controls', () => {
  it('calls onChange with the key "paletteBg" and the new color value when the Page bg input changes', () => {
    const onChange = vi.fn()
    const settings: EffectsSettings = { ...BASELINE_EFFECTS, paletteBg: '#050607' }
    render(<EffectsControls {...makeProps({ settings, onChange })} />)

    const paletteSection = screen.getByLabelText('palette controls')
    const input = paletteSection.querySelector('input[type="color"][value="#050607"]') as HTMLInputElement
    expect(input).not.toBeNull()
    fireEvent.change(input, { target: { value: '#ff0000' } })

    expect(onChange).toHaveBeenCalledWith('paletteBg', '#ff0000')
  })

  it('renders all ten palette color inputs', () => {
    render(<EffectsControls {...makeProps()} />)

    const paletteSection = screen.getByLabelText('palette controls')
    const colorInputs = paletteSection.querySelectorAll('input[type="color"]')
    expect(colorInputs).toHaveLength(10)
  })

  it('renders the "Signal" palette input with the current signal color value', () => {
    const settings: EffectsSettings = { ...BASELINE_EFFECTS, paletteSignal: '#d8ff35' }
    render(<EffectsControls {...makeProps({ settings })} />)

    const paletteSection = screen.getByLabelText('palette controls')
    const input = paletteSection.querySelector('input[type="color"][value="#d8ff35"]') as HTMLInputElement
    expect(input).not.toBeNull()
    expect(input.value).toBe('#d8ff35')
  })

  it('renders the "Glow" palette input with the current glow color value', () => {
    const settings: EffectsSettings = { ...BASELINE_EFFECTS, paletteGlow: '#aabbcc' }
    render(<EffectsControls {...makeProps({ settings })} />)

    const paletteSection = screen.getByLabelText('palette controls')
    const input = paletteSection.querySelector('input[type="color"][value="#aabbcc"]') as HTMLInputElement
    expect(input).not.toBeNull()
    expect(input.value).toBe('#aabbcc')
  })
})

// ─── Section background selects ────────────────────────────────────────────

describe('EffectsControls — section background controls', () => {
  it('renders a select for each of the 6 sections', () => {
    render(<EffectsControls {...makeProps()} />)

    const section = screen.getByLabelText('section background controls')
    const selects = section.querySelectorAll('select')
    expect(selects).toHaveLength(6)
  })

  it('shows the current effect value in the Signal select', () => {
    const sectionEffects: SectionEffects = { ...DEFAULT_SECTION_EFFECTS, signal: 'bars' }
    render(<EffectsControls {...makeProps({ sectionEffects })} />)

    const select = screen.getByLabelText('Signal background') as HTMLSelectElement
    expect(select.value).toBe('bars')
  })

  it('calls onSectionEffect("signal", "dice") when the Signal select changes', async () => {
    const user = userEvent.setup()
    const onSectionEffect = vi.fn()
    render(<EffectsControls {...makeProps({ onSectionEffect })} />)

    await user.selectOptions(screen.getByLabelText('Signal background'), 'dice')

    expect(onSectionEffect).toHaveBeenCalledWith('signal', 'dice')
  })

  it('calls onSectionEffect("warp", "warp") when the WARP select changes', async () => {
    const user = userEvent.setup()
    const onSectionEffect = vi.fn()
    render(<EffectsControls {...makeProps({ onSectionEffect })} />)

    await user.selectOptions(screen.getByLabelText('WARP background'), 'warp')

    expect(onSectionEffect).toHaveBeenCalledWith('warp', 'warp')
  })

  it('calls onSectionEffect with a different effect value for the Dice section', async () => {
    const user = userEvent.setup()
    const onSectionEffect = vi.fn()
    render(<EffectsControls {...makeProps({ onSectionEffect })} />)

    await user.selectOptions(screen.getByLabelText('Dice background'), 'crt')

    expect(onSectionEffect).toHaveBeenCalledWith('dice', 'crt')
  })

  it('calls onSectionEffect with the correct id for Projects section', async () => {
    const user = userEvent.setup()
    const onSectionEffect = vi.fn()
    render(<EffectsControls {...makeProps({ onSectionEffect })} />)

    await user.selectOptions(screen.getByLabelText('Projects background'), 'bars')

    expect(onSectionEffect).toHaveBeenCalledWith('projects', 'bars')
  })
})

// ─── Scanline layer checkboxes ─────────────────────────────────────────────

describe('EffectsControls — scanline layer controls', () => {
  it('renders checkboxes for graph, crt and glitch layers', () => {
    render(<EffectsControls {...makeProps()} />)

    expect(screen.getByLabelText('Graph paper layer')).toBeInTheDocument()
    expect(screen.getByLabelText('CRT monitor layer')).toBeInTheDocument()
    expect(screen.getByLabelText('Glitch scanline layer')).toBeInTheDocument()
  })

  it('reflects the checked state from scanlineLayers', () => {
    const scanlineLayers: ScanlineLayers = { graph: true, crt: false, glitch: true }
    render(<EffectsControls {...makeProps({ scanlineLayers })} />)

    expect(screen.getByLabelText('Graph paper layer')).toBeChecked()
    expect(screen.getByLabelText('CRT monitor layer')).not.toBeChecked()
    expect(screen.getByLabelText('Glitch scanline layer')).toBeChecked()
  })

  it('calls onScanlineLayerChange("graph", true) when the graph checkbox is ticked', async () => {
    const user = userEvent.setup()
    const onScanlineLayerChange = vi.fn()
    const scanlineLayers: ScanlineLayers = { graph: false, crt: false, glitch: false }
    render(<EffectsControls {...makeProps({ scanlineLayers, onScanlineLayerChange })} />)

    await user.click(screen.getByLabelText('Graph paper layer'))

    expect(onScanlineLayerChange).toHaveBeenCalledWith('graph', true)
  })

  it('calls onScanlineLayerChange("crt", false) when the crt checkbox is unticked', async () => {
    const user = userEvent.setup()
    const onScanlineLayerChange = vi.fn()
    const scanlineLayers: ScanlineLayers = { graph: false, crt: true, glitch: false }
    render(<EffectsControls {...makeProps({ scanlineLayers, onScanlineLayerChange })} />)

    await user.click(screen.getByLabelText('CRT monitor layer'))

    expect(onScanlineLayerChange).toHaveBeenCalledWith('crt', false)
  })

  it('calls onScanlineLayerChange("glitch", true) when the glitch checkbox is ticked', async () => {
    const user = userEvent.setup()
    const onScanlineLayerChange = vi.fn()
    const scanlineLayers: ScanlineLayers = { graph: false, crt: false, glitch: false }
    render(<EffectsControls {...makeProps({ scanlineLayers, onScanlineLayerChange })} />)

    await user.click(screen.getByLabelText('Glitch scanline layer'))

    expect(onScanlineLayerChange).toHaveBeenCalledWith('glitch', true)
  })
})

// ─── Effect number controls (groups) ──────────────────────────────────────

describe('EffectsControls — effect number controls', () => {
  it('renders a number input for Scan opacity with the current value', () => {
    const settings: EffectsSettings = { ...BASELINE_EFFECTS, scanOpacity: 0.75 }
    render(<EffectsControls {...makeProps({ settings })} />)

    const input = screen.getByLabelText('Scan opacity') as HTMLInputElement
    expect(input.value).toBe('0.75')
  })

  it('calls onChange("scanOpacity", 1.2) when the Scan opacity number input changes', () => {
    const onChange = vi.fn()
    const settings: EffectsSettings = { ...BASELINE_EFFECTS, scanOpacity: 1 }
    render(<EffectsControls {...makeProps({ settings, onChange })} />)

    const input = screen.getByLabelText('Scan opacity')
    fireEvent.change(input, { target: { value: '1.2' } })

    expect(onChange).toHaveBeenCalledWith('scanOpacity', 1.2)
  })

  it('renders a range slider for Scan opacity with the same value as the number input', () => {
    const settings: EffectsSettings = { ...BASELINE_EFFECTS, scanOpacity: 0.5 }
    render(<EffectsControls {...makeProps({ settings })} />)

    const slider = screen.getByLabelText('Scan opacity slider') as HTMLInputElement
    expect(slider.value).toBe('0.5')
  })

  it('calls onChange("scanOpacity", 0.8) when the Scan opacity slider changes', () => {
    const onChange = vi.fn()
    const settings: EffectsSettings = { ...BASELINE_EFFECTS, scanOpacity: 1 }
    render(<EffectsControls {...makeProps({ settings, onChange })} />)

    const slider = screen.getByLabelText('Scan opacity slider')
    fireEvent.change(slider, { target: { value: '0.8' } })

    expect(onChange).toHaveBeenCalledWith('scanOpacity', 0.8)
  })

  it('renders a number input for Noise amount with the current value', () => {
    const settings: EffectsSettings = { ...BASELINE_EFFECTS, noiseAmount: 0.5 }
    render(<EffectsControls {...makeProps({ settings })} />)

    const input = screen.getByLabelText('Noise amount') as HTMLInputElement
    expect(input.value).toBe('0.5')
  })

  it('renders a number input for Glow strength with the current value', () => {
    const settings: EffectsSettings = { ...BASELINE_EFFECTS, glowStrength: 1.5 }
    render(<EffectsControls {...makeProps({ settings })} />)

    const input = screen.getByLabelText('Glow strength') as HTMLInputElement
    expect(input.value).toBe('1.5')
  })

  it('renders a number input for Rectangle opacity with the current value', () => {
    const settings: EffectsSettings = { ...BASELINE_EFFECTS, rectangleOpacity: 0.8 }
    render(<EffectsControls {...makeProps({ settings })} />)

    const input = screen.getByLabelText('Rectangle opacity') as HTMLInputElement
    expect(input.value).toBe('0.8')
  })

  it('calls onChange("noiseAmount", 1.5) when the Noise amount slider changes', () => {
    const onChange = vi.fn()
    render(<EffectsControls {...makeProps({ onChange })} />)

    const slider = screen.getByLabelText('Noise amount slider')
    fireEvent.change(slider, { target: { value: '1.5' } })

    expect(onChange).toHaveBeenCalledWith('noiseAmount', 1.5)
  })

  it('calls onChange("rectangleOpacity", 0.5) when the Rectangle opacity number input changes', () => {
    const onChange = vi.fn()
    render(<EffectsControls {...makeProps({ onChange })} />)

    const input = screen.getByLabelText('Rectangle opacity')
    fireEvent.change(input, { target: { value: '0.5' } })

    expect(onChange).toHaveBeenCalledWith('rectangleOpacity', 0.5)
  })
})

// ─── Scanline engine rendered alongside Scanlines group ───────────────────

describe('EffectsControls — ScanlineEngineControls integration', () => {
  it('renders the scanline engine section within the Scanlines group', () => {
    render(<EffectsControls {...makeProps()} />)

    expect(screen.getByLabelText('scanline engine')).toBeInTheDocument()
  })

  it('passes the scanlineEngine prop down to ScanlineEngineControls, showing base pattern select', () => {
    const scanlineEngine: ScanlineEngineState = createDefaultScanlineEngine()
    render(<EffectsControls {...makeProps({ scanlineEngine })} />)

    expect(screen.getByLabelText(/base pattern/i)).toBeInTheDocument()
  })

  it('calls onAddScanlineEngineLayer when the Add scanline layer button is clicked', async () => {
    const user = userEvent.setup()
    const onAddScanlineEngineLayer = vi.fn()
    render(<EffectsControls {...makeProps({ onAddScanlineEngineLayer })} />)

    await user.click(screen.getByRole('button', { name: /add scanline layer/i }))

    expect(onAddScanlineEngineLayer).toHaveBeenCalledTimes(1)
  })

  it('calls onUpdateScanlineBasePattern with the selected pattern value', async () => {
    const user = userEvent.setup()
    const onUpdateScanlineBasePattern = vi.fn()
    render(<EffectsControls {...makeProps({ onUpdateScanlineBasePattern })} />)

    await user.selectOptions(screen.getByLabelText(/base pattern/i), 'sine')

    expect(onUpdateScanlineBasePattern).toHaveBeenCalledWith('sine')
  })
})

// ─── Full render sanity ────────────────────────────────────────────────────

describe('EffectsControls — overall structure', () => {
  it('renders within a section with aria-label "effects controls"', () => {
    render(<EffectsControls {...makeProps()} />)

    expect(screen.getByRole('region', { name: 'effects controls' })).toBeInTheDocument()
  })

  it('renders all four effect group sections (Scanlines, Interference, Scene effects, Rectangles)', () => {
    render(<EffectsControls {...makeProps()} />)

    expect(screen.getByText('Scanlines')).toBeInTheDocument()
    expect(screen.getByText('Interference')).toBeInTheDocument()
    expect(screen.getByText('Scene effects')).toBeInTheDocument()
    expect(screen.getByText('Rectangles')).toBeInTheDocument()
  })
})
