import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ControlPanel } from './control-panel'
import { concepts } from '../concepts/registry'
import type { LogoPlayState } from '../logo/logo-play-state'
import { boardRoute } from '../logo/logo-play-state'

afterEach(() => cleanup())

// Helpers to grab each concept from the real registry
const defineGameConcept = concepts.find((c) => c.id === 'define-the-game')!
const commandConsoleConcept = concepts.find((c) => c.id === 'command-console')!
const ruleBoardConcept = concepts.find((c) => c.id === 'rule-board')!

const baseState: LogoPlayState = {
  defineRules: [],
  consoleHistory: [],
  boardPath: [boardRoute[0]],
  boardIllegalMove: false,
}

// ─── ControlPanel shell ──────────────────────────────────────────────────────

describe('ControlPanel — shell', () => {
  it('renders the phase label from the logo system', () => {
    render(
      <ControlPanel
        concept={defineGameConcept}
        playState={baseState}
        commandInput=""
        onCommandInput={vi.fn()}
        onAdvance={vi.fn()}
        onRunCommand={vi.fn()}
        onReset={vi.fn()}
      />,
    )
    // define-the-game at progress 0 → phase 0 → 'undefined'
    expect(screen.getByText('undefined')).toBeInTheDocument()
  })

  it('calls onReset when the Reset button is clicked', async () => {
    const user = userEvent.setup()
    const onReset = vi.fn()
    render(
      <ControlPanel
        concept={defineGameConcept}
        playState={baseState}
        commandInput=""
        onCommandInput={vi.fn()}
        onAdvance={vi.fn()}
        onRunCommand={vi.fn()}
        onReset={onReset}
      />,
    )
    await user.click(screen.getByRole('button', { name: 'Reset' }))
    expect(onReset).toHaveBeenCalledTimes(1)
  })

  it('renders the phase track with correct active index', () => {
    render(
      <ControlPanel
        concept={defineGameConcept}
        playState={baseState}
        commandInput=""
        onCommandInput={vi.fn()}
        onAdvance={vi.fn()}
        onRunCommand={vi.fn()}
        onReset={vi.fn()}
      />,
    )
    const spans = within(screen.getByLabelText('prototype phase')).getAllByText(/\d/)
    // Phase 0 is active, rest are not
    expect(spans[0]).toHaveAttribute('data-active', 'true')
    expect(spans[1]).toHaveAttribute('data-active', 'false')
    expect(spans[2]).toHaveAttribute('data-active', 'false')
  })

  it('phase track reflects phase 1 when some defineRules are added', () => {
    const stateOneRule: LogoPlayState = { ...baseState, defineRules: ['world'] }
    render(
      <ControlPanel
        concept={defineGameConcept}
        playState={stateOneRule}
        commandInput=""
        onCommandInput={vi.fn()}
        onAdvance={vi.fn()}
        onRunCommand={vi.fn()}
        onReset={vi.fn()}
      />,
    )
    const spans = within(screen.getByLabelText('prototype phase')).getAllByText(/\d/)
    expect(spans[0]).toHaveAttribute('data-active', 'false')
    expect(spans[1]).toHaveAttribute('data-active', 'true')
    expect(spans[2]).toHaveAttribute('data-active', 'false')
    // Phase 1 label for define-the-game is 'resolving'
    expect(screen.getByText('resolving')).toBeInTheDocument()
  })

  it('phase track reflects phase 2 when all defineRules are added', () => {
    const stateAllRules: LogoPlayState = { ...baseState, defineRules: ['world', 'move', 'win'] }
    render(
      <ControlPanel
        concept={defineGameConcept}
        playState={stateAllRules}
        commandInput=""
        onCommandInput={vi.fn()}
        onAdvance={vi.fn()}
        onRunCommand={vi.fn()}
        onReset={vi.fn()}
      />,
    )
    const spans = within(screen.getByLabelText('prototype phase')).getAllByText(/\d/)
    expect(spans[2]).toHaveAttribute('data-active', 'true')
    expect(screen.getByText('playable')).toBeInTheDocument()
  })
})

// ─── DefineControls ──────────────────────────────────────────────────────────

describe('DefineControls (define-the-game)', () => {
  it('shows "Rules: undefined" when no rules are defined', () => {
    render(
      <ControlPanel
        concept={defineGameConcept}
        playState={baseState}
        commandInput=""
        onCommandInput={vi.fn()}
        onAdvance={vi.fn()}
        onRunCommand={vi.fn()}
        onReset={vi.fn()}
      />,
    )
    expect(screen.getByText('Rules: undefined')).toBeInTheDocument()
  })

  it('shows the joined rules when some are defined', () => {
    const state: LogoPlayState = { ...baseState, defineRules: ['world', 'move'] }
    render(
      <ControlPanel
        concept={defineGameConcept}
        playState={state}
        commandInput=""
        onCommandInput={vi.fn()}
        onAdvance={vi.fn()}
        onRunCommand={vi.fn()}
        onReset={vi.fn()}
      />,
    )
    expect(screen.getByText('Rules: world / move')).toBeInTheDocument()
  })

  it('labels the first button "next" when no rules are defined', () => {
    render(
      <ControlPanel
        concept={defineGameConcept}
        playState={baseState}
        commandInput=""
        onCommandInput={vi.fn()}
        onAdvance={vi.fn()}
        onRunCommand={vi.fn()}
        onReset={vi.fn()}
      />,
    )
    // First rule button has span "next", others have "waiting"
    const worldBtn = screen.getByRole('button', { name: /Define world/ })
    expect(within(worldBtn).getByText('next')).toBeInTheDocument()
  })

  it('labels middle buttons "waiting" when first rule is done', () => {
    const state: LogoPlayState = { ...baseState, defineRules: ['world'] }
    render(
      <ControlPanel
        concept={defineGameConcept}
        playState={state}
        commandInput=""
        onCommandInput={vi.fn()}
        onAdvance={vi.fn()}
        onRunCommand={vi.fn()}
        onReset={vi.fn()}
      />,
    )
    // world is locked, move is next, win is waiting
    const worldBtn = screen.getByRole('button', { name: /Define world/ })
    const moveBtn = screen.getByRole('button', { name: /Define move/ })
    const winBtn = screen.getByRole('button', { name: /Define win/ })
    expect(within(worldBtn).getByText('locked')).toBeInTheDocument()
    expect(within(moveBtn).getByText('next')).toBeInTheDocument()
    expect(within(winBtn).getByText('waiting')).toBeInTheDocument()
  })

  it('disables buttons for already-defined rules', () => {
    const state: LogoPlayState = { ...baseState, defineRules: ['world'] }
    render(
      <ControlPanel
        concept={defineGameConcept}
        playState={state}
        commandInput=""
        onCommandInput={vi.fn()}
        onAdvance={vi.fn()}
        onRunCommand={vi.fn()}
        onReset={vi.fn()}
      />,
    )
    expect(screen.getByRole('button', { name: /Define world/ })).toBeDisabled()
    expect(screen.getByRole('button', { name: /Define move/ })).not.toBeDisabled()
  })

  it('calls onAdvance when a define rule button is clicked', async () => {
    const user = userEvent.setup()
    const onAdvance = vi.fn()
    render(
      <ControlPanel
        concept={defineGameConcept}
        playState={baseState}
        commandInput=""
        onCommandInput={vi.fn()}
        onAdvance={onAdvance}
        onRunCommand={vi.fn()}
        onReset={vi.fn()}
      />,
    )
    await user.click(screen.getByRole('button', { name: /Define world/ }))
    expect(onAdvance).toHaveBeenCalledTimes(1)
  })
})

// ─── ConsoleControls ─────────────────────────────────────────────────────────

describe('ConsoleControls (command-console)', () => {
  it('shows "awaiting command" when history is empty', () => {
    render(
      <ControlPanel
        concept={commandConsoleConcept}
        playState={baseState}
        commandInput=""
        onCommandInput={vi.fn()}
        onAdvance={vi.fn()}
        onRunCommand={vi.fn()}
        onReset={vi.fn()}
      />,
    )
    expect(screen.getByText('awaiting command')).toBeInTheDocument()
  })

  it('shows history entries when they exist', () => {
    const state: LogoPlayState = {
      ...baseState,
      consoleHistory: [{ command: 'define world', status: 'ok' }],
    }
    render(
      <ControlPanel
        concept={commandConsoleConcept}
        playState={state}
        commandInput=""
        onCommandInput={vi.fn()}
        onAdvance={vi.fn()}
        onRunCommand={vi.fn()}
        onReset={vi.fn()}
      />,
    )
    expect(screen.queryByText('awaiting command')).not.toBeInTheDocument()
    const entry = screen.getByText('ok: define world')
    expect(entry).toHaveAttribute('data-status', 'ok')
  })

  it('shows history entries with error status', () => {
    const state: LogoPlayState = {
      ...baseState,
      consoleHistory: [{ command: 'bad cmd', status: 'error' }],
    }
    render(
      <ControlPanel
        concept={commandConsoleConcept}
        playState={state}
        commandInput=""
        onCommandInput={vi.fn()}
        onAdvance={vi.fn()}
        onRunCommand={vi.fn()}
        onReset={vi.fn()}
      />,
    )
    const entry = screen.getByText('error: bad cmd')
    expect(entry).toHaveAttribute('data-status', 'error')
  })

  it('shows the placeholder from nextCommand when progress < 3', () => {
    render(
      <ControlPanel
        concept={commandConsoleConcept}
        playState={baseState}
        commandInput=""
        onCommandInput={vi.fn()}
        onAdvance={vi.fn()}
        onRunCommand={vi.fn()}
        onReset={vi.fn()}
      />,
    )
    // progress 0 → nextCommand = 'define world'
    const input = screen.getByPlaceholderText('define world')
    expect(input).toBeInTheDocument()
  })

  it('shows "game compiled" placeholder when all commands are done', () => {
    const state: LogoPlayState = {
      ...baseState,
      consoleHistory: [
        { command: 'define world', status: 'ok' },
        { command: 'spawn player', status: 'ok' },
        { command: 'run game', status: 'ok' },
      ],
    }
    render(
      <ControlPanel
        concept={commandConsoleConcept}
        playState={state}
        commandInput=""
        onCommandInput={vi.fn()}
        onAdvance={vi.fn()}
        onRunCommand={vi.fn()}
        onReset={vi.fn()}
      />,
    )
    expect(screen.getByPlaceholderText('game compiled')).toBeInTheDocument()
  })

  it('shows the "Type <command>" button when nextCommand exists', () => {
    render(
      <ControlPanel
        concept={commandConsoleConcept}
        playState={baseState}
        commandInput=""
        onCommandInput={vi.fn()}
        onAdvance={vi.fn()}
        onRunCommand={vi.fn()}
        onReset={vi.fn()}
      />,
    )
    expect(screen.getByRole('button', { name: 'Type define world' })).toBeInTheDocument()
  })

  it('hides the "Type <command>" button when all commands are done', () => {
    const state: LogoPlayState = {
      ...baseState,
      consoleHistory: [
        { command: 'define world', status: 'ok' },
        { command: 'spawn player', status: 'ok' },
        { command: 'run game', status: 'ok' },
      ],
    }
    render(
      <ControlPanel
        concept={commandConsoleConcept}
        playState={state}
        commandInput=""
        onCommandInput={vi.fn()}
        onAdvance={vi.fn()}
        onRunCommand={vi.fn()}
        onReset={vi.fn()}
      />,
    )
    expect(screen.queryByRole('button', { name: /^Type / })).not.toBeInTheDocument()
  })

  it('calls onRunCommand with no argument when "Run command" is clicked', async () => {
    const user = userEvent.setup()
    const onRunCommand = vi.fn()
    render(
      <ControlPanel
        concept={commandConsoleConcept}
        playState={baseState}
        commandInput=""
        onCommandInput={vi.fn()}
        onAdvance={vi.fn()}
        onRunCommand={onRunCommand}
        onReset={vi.fn()}
      />,
    )
    await user.click(screen.getByRole('button', { name: 'Run command' }))
    // onClick calls onRunCommand() with no arguments
    expect(onRunCommand).toHaveBeenCalledTimes(1)
    expect(onRunCommand).toHaveBeenCalledWith()
  })

  it('calls onRunCommand with the nextCommand when the "Type <command>" button is clicked', async () => {
    const user = userEvent.setup()
    const onRunCommand = vi.fn()
    render(
      <ControlPanel
        concept={commandConsoleConcept}
        playState={baseState}
        commandInput=""
        onCommandInput={vi.fn()}
        onAdvance={vi.fn()}
        onRunCommand={onRunCommand}
        onReset={vi.fn()}
      />,
    )
    await user.click(screen.getByRole('button', { name: 'Type define world' }))
    expect(onRunCommand).toHaveBeenCalledWith('define world')
  })

  it('calls onCommandInput with the typed value', async () => {
    const user = userEvent.setup()
    const onCommandInput = vi.fn()
    render(
      <ControlPanel
        concept={commandConsoleConcept}
        playState={baseState}
        commandInput=""
        onCommandInput={onCommandInput}
        onAdvance={vi.fn()}
        onRunCommand={vi.fn()}
        onReset={vi.fn()}
      />,
    )
    const input = screen.getByPlaceholderText('define world')
    await user.type(input, 'x')
    expect(onCommandInput).toHaveBeenCalledWith('x')
  })

  it('renders the current commandInput value in the input field', () => {
    render(
      <ControlPanel
        concept={commandConsoleConcept}
        playState={baseState}
        commandInput="define world"
        onCommandInput={vi.fn()}
        onAdvance={vi.fn()}
        onRunCommand={vi.fn()}
        onReset={vi.fn()}
      />,
    )
    const input = screen.getByDisplayValue('define world')
    expect(input).toBeInTheDocument()
  })

  it('renders only last 5 history entries', () => {
    const state: LogoPlayState = {
      ...baseState,
      consoleHistory: [
        { command: 'cmd-1', status: 'error' },
        { command: 'cmd-2', status: 'error' },
        { command: 'cmd-3', status: 'error' },
        { command: 'cmd-4', status: 'error' },
        { command: 'cmd-5', status: 'error' },
        { command: 'cmd-6', status: 'error' },
      ],
    }
    render(
      <ControlPanel
        concept={commandConsoleConcept}
        playState={state}
        commandInput=""
        onCommandInput={vi.fn()}
        onAdvance={vi.fn()}
        onRunCommand={vi.fn()}
        onReset={vi.fn()}
      />,
    )
    // cmd-1 should not appear (only last 5)
    expect(screen.queryByText('error: cmd-1')).not.toBeInTheDocument()
    expect(screen.getByText('error: cmd-6')).toBeInTheDocument()
  })
})

// ─── BoardControls ────────────────────────────────────────────────────────────

describe('BoardControls (rule-board)', () => {
  it('shows "Path:" with the initial board path', () => {
    render(
      <ControlPanel
        concept={ruleBoardConcept}
        playState={baseState}
        commandInput=""
        onCommandInput={vi.fn()}
        onAdvance={vi.fn()}
        onRunCommand={vi.fn()}
        onReset={vi.fn()}
      />,
    )
    // boardPath starts as [5]
    expect(screen.getByText('Path: 5')).toBeInTheDocument()
  })

  it('shows "Make illegal move" when progress is 0', () => {
    render(
      <ControlPanel
        concept={ruleBoardConcept}
        playState={baseState}
        commandInput=""
        onCommandInput={vi.fn()}
        onAdvance={vi.fn()}
        onRunCommand={vi.fn()}
        onReset={vi.fn()}
      />,
    )
    // progress = 0 → actionLabel = 'Make illegal move'
    expect(screen.getByRole('button', { name: 'Make illegal move' })).toBeInTheDocument()
  })

  it('shows "Route to tile <N>" label when progress > 0 and nextTile exists', () => {
    // boardRoute = [5, 6, 10, 14]; boardPath starts at [5], after one advance → [5, 6]
    const state: LogoPlayState = { ...baseState, boardPath: [5, 6] }
    render(
      <ControlPanel
        concept={ruleBoardConcept}
        playState={state}
        commandInput=""
        onCommandInput={vi.fn()}
        onAdvance={vi.fn()}
        onRunCommand={vi.fn()}
        onReset={vi.fn()}
      />,
    )
    // nextTile = boardRoute[2] = 10
    expect(screen.getByRole('button', { name: 'Route to tile 10' })).toBeInTheDocument()
  })

  it('shows "Route locked" and disables button when boardPath is full', () => {
    // Full path: [5, 6, 10, 14]
    const state: LogoPlayState = { ...baseState, boardPath: [5, 6, 10, 14] }
    render(
      <ControlPanel
        concept={ruleBoardConcept}
        playState={state}
        commandInput=""
        onCommandInput={vi.fn()}
        onAdvance={vi.fn()}
        onRunCommand={vi.fn()}
        onReset={vi.fn()}
      />,
    )
    const btn = screen.getByRole('button', { name: 'Route locked' })
    expect(btn).toBeDisabled()
  })

  it('calls onAdvance when the board action button is clicked', async () => {
    const user = userEvent.setup()
    const onAdvance = vi.fn()
    render(
      <ControlPanel
        concept={ruleBoardConcept}
        playState={baseState}
        commandInput=""
        onCommandInput={vi.fn()}
        onAdvance={onAdvance}
        onRunCommand={vi.fn()}
        onReset={vi.fn()}
      />,
    )
    await user.click(screen.getByRole('button', { name: 'Make illegal move' }))
    expect(onAdvance).toHaveBeenCalledTimes(1)
  })

  it('renders 16 board route tiles', () => {
    render(
      <ControlPanel
        concept={ruleBoardConcept}
        playState={baseState}
        commandInput=""
        onCommandInput={vi.fn()}
        onAdvance={vi.fn()}
        onRunCommand={vi.fn()}
        onReset={vi.fn()}
      />,
    )
    const readout = screen.getByLabelText('board route')
    const tiles = within(readout).getAllByText(/^\d+$/)
    expect(tiles).toHaveLength(16)
    // baseState.boardPath = [boardRoute[0]] = [5]; tile 5 is at index 4, tile 1 (index 0) is not active
    expect(tiles[4]).toHaveAttribute('data-active', 'true')
    expect(tiles[0]).toHaveAttribute('data-active', 'false')
  })

  it('marks tiles in boardPath as active and others as inactive', () => {
    const state: LogoPlayState = { ...baseState, boardPath: [5, 6] }
    render(
      <ControlPanel
        concept={ruleBoardConcept}
        playState={state}
        commandInput=""
        onCommandInput={vi.fn()}
        onAdvance={vi.fn()}
        onRunCommand={vi.fn()}
        onReset={vi.fn()}
      />,
    )
    const readout = screen.getByLabelText('board route')
    // Tile 5 is active, tile 6 is active, tile 1 is not
    const tiles = within(readout).getAllByText(/^\d+$/)
    // Tile #5 is index 4 (tile = index + 1)
    expect(tiles[4]).toHaveAttribute('data-active', 'true')
    expect(tiles[5]).toHaveAttribute('data-active', 'true')
    expect(tiles[0]).toHaveAttribute('data-active', 'false')
  })
})
