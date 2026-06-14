import type { LogoConcept } from '../concepts/types'
import {
  boardRoute,
  consoleCommands,
  defineRules,
  getConceptPhase,
  getConceptProgress,
  type LogoPlayState,
} from '../logo/logo-play-state'
import { getLogoSystem } from '../logo/logo-system'

export function ControlPanel({
  concept,
  playState,
  commandInput,
  onCommandInput,
  onAdvance,
  onRunCommand,
  onReset,
}: {
  concept: LogoConcept
  playState: LogoPlayState
  commandInput: string
  onCommandInput: (value: string) => void
  onAdvance: () => void
  onRunCommand: (command?: string) => void
  onReset: () => void
}) {
  const system = getLogoSystem(concept)
  const phase = getConceptPhase(concept.id, playState)
  const progress = getConceptProgress(concept.id, playState)
  const activePhase = system.phases[phase]

  return (
    <section className="panel instrument-panel">
      <div className="panel-heading">
        <div>
          <h2>Instrument</h2>
          <p>{activePhase}</p>
        </div>
        <button className="ghost-button" type="button" onClick={onReset}>
          Reset
        </button>
      </div>
      <div className="phase-track" aria-label="prototype phase">
        {system.phases.map((label, index) => (
          <span key={label} data-active={index === phase}>
            {index + 1}
          </span>
        ))}
      </div>
      {concept.id === 'define-the-game' && <DefineControls playState={playState} onAdvance={onAdvance} />}
      {concept.id === 'command-console' && (
        <ConsoleControls
          playState={playState}
          commandInput={commandInput}
          onCommandInput={onCommandInput}
          onRunCommand={onRunCommand}
        />
      )}
      {concept.id === 'rule-board' && <BoardControls progress={progress} playState={playState} onAdvance={onAdvance} />}
    </section>
  )
}

function DefineControls({ playState, onAdvance }: { playState: LogoPlayState; onAdvance: () => void }) {
  return (
    <div className="instrument-body">
      <p className="state-line">Rules: {playState.defineRules.length ? playState.defineRules.join(' / ') : 'undefined'}</p>
      <div className="action-grid">
        {defineRules.map((rule, index) => (
          <button key={rule} type="button" disabled={playState.defineRules.includes(rule)} onClick={onAdvance}>
            Define {rule}
            <span>{playState.defineRules.includes(rule) ? 'locked' : index === playState.defineRules.length ? 'next' : 'waiting'}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function ConsoleControls({
  playState,
  commandInput,
  onCommandInput,
  onRunCommand,
}: {
  playState: LogoPlayState
  commandInput: string
  onCommandInput: (value: string) => void
  onRunCommand: (command?: string) => void
}) {
  const progress = getConceptProgress('command-console', playState)
  const nextCommand = consoleCommands[progress]

  return (
    <div className="instrument-body terminal-body">
      <div className="terminal-output" aria-label="command history">
        {playState.consoleHistory.length === 0 ? (
          <p>awaiting command</p>
        ) : (
          playState.consoleHistory.slice(-5).map((entry, index) => (
            <p key={`${entry.command}-${index}`} data-status={entry.status}>
              {entry.status}: {entry.command}
            </p>
          ))
        )}
      </div>
      <label className="command-row">
        <span>Command input</span>
        <input value={commandInput} onChange={(event) => onCommandInput(event.target.value)} placeholder={nextCommand ?? 'game compiled'} />
      </label>
      <div className="button-row">
        <button type="button" onClick={() => onRunCommand()}>
          Run command
        </button>
        {nextCommand && (
          <button type="button" onClick={() => onRunCommand(nextCommand)}>
            Type {nextCommand}
          </button>
        )}
      </div>
    </div>
  )
}

function BoardControls({
  progress,
  playState,
  onAdvance,
}: {
  progress: number
  playState: LogoPlayState
  onAdvance: () => void
}) {
  const nextTile = boardRoute[playState.boardPath.length]
  const actionLabel = progress === 0 ? 'Make illegal move' : nextTile ? `Route to tile ${nextTile}` : 'Route locked'

  return (
    <div className="instrument-body">
      <p className="state-line">Path: {playState.boardPath.join(' -> ')}</p>
      <div className="board-readout" aria-label="board route">
        {Array.from({ length: 16 }).map((_, index) => {
          const tile = index + 1
          const active = playState.boardPath.includes(tile)
          return (
            <span key={tile} data-active={active}>
              {tile}
            </span>
          )
        })}
      </div>
      <button type="button" disabled={!nextTile} onClick={onAdvance}>
        {actionLabel}
      </button>
    </div>
  )
}
