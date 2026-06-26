import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { StationState } from '@undef-games/scanlines-system'
import { StationControls } from './station-controls'

afterEach(() => {
  cleanup()
})

function makeProps(overrides?: Partial<{ state: StationState; onTune: () => void; onDetune: () => void; onReset: () => void }>) {
  return {
    state: { signal: 50 } satisfies StationState,
    onTune: vi.fn(),
    onDetune: vi.fn(),
    onReset: vi.fn(),
    ...overrides,
  }
}

describe('StationControls', () => {
  it('displays the current signal value in the label and meter', () => {
    render(<StationControls {...makeProps({ state: { signal: 72 } })} />)

    expect(screen.getByText('Signal 72')).toBeInTheDocument()
    expect(screen.getByLabelText('signal 72')).toBeInTheDocument()
  })

  it('renders the signal meter span with width matching the signal percentage', () => {
    render(<StationControls {...makeProps({ state: { signal: 40 } })} />)

    const meter = screen.getByLabelText('signal 40')
    const span = meter.querySelector('span')
    expect(span).toHaveStyle({ inlineSize: '40%' })
  })

  it('shows a different signal percentage in the meter for a different signal', () => {
    render(<StationControls {...makeProps({ state: { signal: 80 } })} />)

    const meter = screen.getByLabelText('signal 80')
    const span = meter.querySelector('span')
    expect(span).toHaveStyle({ inlineSize: '80%' })
  })

  it('shows "dead channel scan" when signal is below 85 (lock=false)', () => {
    render(<StationControls {...makeProps({ state: { signal: 50 } })} />)

    expect(screen.getByText('dead channel scan')).toBeInTheDocument()
  })

  it('shows "station lockup armed" when signal is 85 or above (lock=true)', () => {
    render(<StationControls {...makeProps({ state: { signal: 90 } })} />)

    expect(screen.getByText('station lockup armed')).toBeInTheDocument()
  })

  it('shows "dead channel scan" at signal 0 (no signal)', () => {
    render(<StationControls {...makeProps({ state: { signal: 0 } })} />)

    expect(screen.getByText('dead channel scan')).toBeInTheDocument()
  })

  it('shows "station lockup armed" at signal exactly 85', () => {
    render(<StationControls {...makeProps({ state: { signal: 85 } })} />)

    expect(screen.getByText('station lockup armed')).toBeInTheDocument()
  })

  it('fires onTune when "Tune signal" is clicked', async () => {
    const user = userEvent.setup()
    const onTune = vi.fn()
    render(<StationControls {...makeProps({ onTune })} />)

    await user.click(screen.getByRole('button', { name: 'Tune signal' }))

    expect(onTune).toHaveBeenCalledTimes(1)
  })

  it('fires onDetune when "Detune" is clicked', async () => {
    const user = userEvent.setup()
    const onDetune = vi.fn()
    render(<StationControls {...makeProps({ onDetune })} />)

    await user.click(screen.getByRole('button', { name: 'Detune' }))

    expect(onDetune).toHaveBeenCalledTimes(1)
  })

  it('fires onReset when "Reset" is clicked', async () => {
    const user = userEvent.setup()
    const onReset = vi.fn()
    render(<StationControls {...makeProps({ onReset })} />)

    await user.click(screen.getByRole('button', { name: 'Reset' }))

    expect(onReset).toHaveBeenCalledTimes(1)
  })

  it('does not call onDetune or onReset when Tune is clicked', async () => {
    const user = userEvent.setup()
    const props = makeProps()
    render(<StationControls {...props} />)

    await user.click(screen.getByRole('button', { name: 'Tune signal' }))

    expect(props.onDetune).not.toHaveBeenCalled()
    expect(props.onReset).not.toHaveBeenCalled()
  })

  it('renders within a section with aria-label "station controls"', () => {
    render(<StationControls {...makeProps()} />)

    expect(screen.getByRole('region', { name: 'station controls' })).toBeInTheDocument()
  })
})
