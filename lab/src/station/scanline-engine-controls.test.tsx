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
})
