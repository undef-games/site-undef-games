import { useState } from 'react'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import {
  addScanlineLayer,
  createDefaultScanlineEngine,
  duplicateScanlineLayer,
  moveScanlineLayer,
  removeScanlineLayer,
  updateScanlineLayer,
  type ScanlineEngineState,
} from '@undef-games/scanlines-system'
import { ScanlineEngineControls } from './scanline-engine-controls'

afterEach(() => {
  cleanup()
})

function renderControls(initialEngine = createDefaultScanlineEngine()) {
  function Harness() {
    const [engine, setEngine] = useState<ScanlineEngineState>(initialEngine)

    return (
      <ScanlineEngineControls
        engine={engine}
        onUpdateBasePattern={(basePattern) => setEngine((current) => ({ ...current, basePattern }))}
        onAddLayer={() => setEngine((current) => addScanlineLayer(current, current.basePattern))}
        onDuplicateLayer={(id) => setEngine((current) => duplicateScanlineLayer(current, id))}
        onRemoveLayer={(id) => setEngine((current) => removeScanlineLayer(current, id))}
        onMoveLayer={(id, direction) => setEngine((current) => moveScanlineLayer(current, id, direction))}
        onUpdateLayer={(id, patch) => setEngine((current) => updateScanlineLayer(current, id, patch))}
      />
    )
  }

  return render(<Harness />)
}

function createEngineWithLayers(count: number): ScanlineEngineState {
  let engine = createDefaultScanlineEngine()
  for (let index = 0; index < count; index += 1) {
    engine = addScanlineLayer(engine, 'straight')
  }
  return engine
}

describe('ScanlineEngineControls', () => {
  it('renders the base pattern selector', () => {
    renderControls()

    expect(screen.getByLabelText(/base pattern/i)).toBeInTheDocument()
  })

  it('stops adding layers at thirteen', async () => {
    const user = userEvent.setup()
    renderControls()

    const addLayerButton = screen.getByRole('button', { name: /add scanline layer/i })

    for (let index = 0; index < 13; index += 1) {
      await user.click(addLayerButton)
    }

    expect(screen.getAllByRole('heading', { name: /layer \d+/i })).toHaveLength(13)
    expect(addLayerButton).toBeDisabled()
  })

  it('shows advanced controls for the first three layers', () => {
    renderControls(createEngineWithLayers(3))

    const firstLayer = screen.getByRole('listitem', { name: /layer 1/i })
    const secondLayer = screen.getByRole('listitem', { name: /layer 2/i })
    const thirdLayer = screen.getByRole('listitem', { name: /layer 3/i })

    expect(within(firstLayer).getByLabelText(/blend mode/i)).toBeInTheDocument()
    expect(within(secondLayer).getByLabelText(/frequency/i)).toBeInTheDocument()
    expect(within(thirdLayer).getByLabelText(/pointer coupling/i)).toBeInTheDocument()
  })

  it('shows support controls for later layers', () => {
    renderControls(createEngineWithLayers(4))

    const fourthLayer = screen.getByRole('listitem', { name: /layer 4/i })

    expect(within(fourthLayer).getByLabelText(/intensity/i)).toBeInTheDocument()
    expect(within(fourthLayer).queryByLabelText(/blend mode/i)).not.toBeInTheDocument()
  })

  it('changes the base pattern via the selector', async () => {
    const user = userEvent.setup()
    renderControls()

    await user.selectOptions(screen.getByLabelText(/base pattern/i), 'sine')

    expect(screen.getByLabelText(/base pattern/i)).toHaveValue('sine')
  })

  it('duplicates a layer', async () => {
    const user = userEvent.setup()
    renderControls(createEngineWithLayers(1))

    expect(screen.getAllByRole('heading', { name: /layer \d+/i })).toHaveLength(1)

    await user.click(screen.getByRole('button', { name: /duplicate/i }))

    expect(screen.getAllByRole('heading', { name: /layer \d+/i })).toHaveLength(2)
  })

  it('mutes and unmutes a layer', async () => {
    const user = userEvent.setup()
    renderControls(createEngineWithLayers(1))

    const muteButton = screen.getByRole('button', { name: /mute/i })
    await user.click(muteButton)

    expect(screen.getByRole('button', { name: /unmute/i })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /unmute/i }))

    expect(screen.getByRole('button', { name: /mute/i })).toBeInTheDocument()
  })

  it('removes a layer', async () => {
    const user = userEvent.setup()
    renderControls(createEngineWithLayers(2))

    expect(screen.getAllByRole('heading', { name: /layer \d+/i })).toHaveLength(2)

    await user.click(screen.getAllByRole('button', { name: /delete/i })[0])

    expect(screen.getAllByRole('heading', { name: /layer \d+/i })).toHaveLength(1)
  })

  it('moves a layer down and back up', async () => {
    const user = userEvent.setup()
    renderControls(createEngineWithLayers(2))

    expect(screen.getAllByRole('heading', { name: /layer \d+/i })).toHaveLength(2)

    // Move layer 1 down (it becomes layer 2)
    await user.click(screen.getAllByRole('button', { name: /move down/i })[0])

    // Move the item now at position 2 back up
    await user.click(screen.getAllByRole('button', { name: /move up/i })[1])

    // Still two layers
    expect(screen.getAllByRole('heading', { name: /layer \d+/i })).toHaveLength(2)
  })

  it('changes the layer pattern via the selector', async () => {
    const user = userEvent.setup()
    renderControls(createEngineWithLayers(1))

    const layer = screen.getByRole('listitem', { name: /layer 1/i })
    await user.selectOptions(within(layer).getByLabelText(/^pattern$/i), 'sine')

    expect(within(layer).getByLabelText(/^pattern$/i)).toHaveValue('sine')
  })

  it('updates a number field for a support layer via the intensity input', async () => {
    const user = userEvent.setup()
    renderControls(createEngineWithLayers(4))

    const fourthLayer = screen.getByRole('listitem', { name: /layer 4/i })
    const intensityInput = within(fourthLayer).getByLabelText(/intensity/i)

    await user.clear(intensityInput)
    await user.type(intensityInput, '1.5')

    expect((intensityInput as HTMLInputElement).value).toBe('1.5')
    // onChange calls onUpdateLayer with Number(event.currentTarget.value) — assert the numeric conversion
    expect((intensityInput as HTMLInputElement).valueAsNumber).toBe(1.5)
  })

  it('updates a common number field (opacity) for an advanced layer', async () => {
    const user = userEvent.setup()
    renderControls(createEngineWithLayers(1))

    const firstLayer = screen.getByRole('listitem', { name: /layer 1/i })
    const opacityInput = within(firstLayer).getByLabelText(/^opacity$/i)

    await user.clear(opacityInput)
    await user.type(opacityInput, '0.5')

    expect((opacityInput as HTMLInputElement).value).toBe('0.5')
    // onChange calls onUpdateLayer with Number(event.currentTarget.value) — assert the numeric conversion
    expect((opacityInput as HTMLInputElement).valueAsNumber).toBe(0.5)
  })

  it('changes the blend mode for an advanced layer', async () => {
    const user = userEvent.setup()
    renderControls(createEngineWithLayers(1))

    const firstLayer = screen.getByRole('listitem', { name: /layer 1/i })
    await user.selectOptions(within(firstLayer).getByLabelText(/blend mode/i), 'screen')

    expect(within(firstLayer).getByLabelText(/blend mode/i)).toHaveValue('screen')
  })

  it('updates an advanced number field (frequency) for an advanced layer', async () => {
    const user = userEvent.setup()
    renderControls(createEngineWithLayers(1))

    const firstLayer = screen.getByRole('listitem', { name: /layer 1/i })
    const frequencyInput = within(firstLayer).getByLabelText(/^frequency$/i)

    await user.clear(frequencyInput)
    await user.type(frequencyInput, '2')

    expect((frequencyInput as HTMLInputElement).value).toBe('2')
    // onChange calls onUpdateLayer with Number(event.currentTarget.value) — assert the numeric conversion
    expect((frequencyInput as HTMLInputElement).valueAsNumber).toBe(2)
  })
})
