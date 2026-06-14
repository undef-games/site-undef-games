import { useState } from 'react'
import type { CSSProperties } from 'react'
import { concepts } from '../concepts/registry'
import {
  advanceConcept,
  createInitialLogoPlayState,
  getConceptPhase,
  resetConcept,
  submitConsoleCommand,
} from '../logo/logo-play-state'
import { getLogoSystem } from '../logo/logo-system'
import { ResolvedLogoPanel } from '../logo/resolved-logo-panel'
import { LogoLabScene } from '../scene/logo-lab-scene'
import { CompareTray } from '../ui/compare-tray'
import { ConceptRail } from '../ui/concept-rail'
import { ControlPanel } from '../ui/control-panel'
import { PromptPanel } from '../ui/prompt-panel'

export function AppShell() {
  const [activeConceptId, setActiveConceptId] = useState(concepts[0].id)
  const [playState, setPlayState] = useState(createInitialLogoPlayState)
  const [commandInput, setCommandInput] = useState('')
  const concept = concepts.find((candidate) => candidate.id === activeConceptId) ?? concepts[0]
  const system = getLogoSystem(concept)
  const skinStyle = {
    '--concept-bg': concept.colorTokens.background,
    '--concept-fg': concept.colorTokens.foreground,
    '--concept-accent': concept.colorTokens.accent,
  } as CSSProperties
  const phase = getConceptPhase(concept.id, playState)
  const activePhase = system.phases[phase]
  const selectConcept = (id: string) => setActiveConceptId(id)
  const advanceActiveConcept = () => setPlayState((current) => advanceConcept(current, concept.id))
  const runCommand = (command = commandInput) => {
    setPlayState((current) => submitConsoleCommand(current, command))
    setCommandInput('')
  }
  const resetActiveConcept = () => setPlayState((current) => resetConcept(current, concept.id))

  return (
    <div className="app-shell" data-concept={concept.id} data-system-layout={system.layout} style={skinStyle}>
      <header className="topbar">
        <div>
          <p className="eyebrow">undef games</p>
          <h1>undef logos</h1>
          <p className="active-system">{concept.name} / {activePhase}</p>
        </div>
      </header>
      <main className="layout">
        <ConceptRail concepts={concepts} activeConceptId={concept.id} onSelect={selectConcept} />
        <section className="scene-frame">
          <LogoLabScene concept={concept} playState={playState} onAdvance={advanceActiveConcept} />
        </section>
        <aside className="panel-stack">
          <ControlPanel
            concept={concept}
            playState={playState}
            commandInput={commandInput}
            onCommandInput={setCommandInput}
            onAdvance={advanceActiveConcept}
            onRunCommand={runCommand}
            onReset={resetActiveConcept}
          />
          <ResolvedLogoPanel concept={concept} playState={playState} />
          <CompareTray concepts={concepts} activeConceptId={concept.id} />
          <PromptPanel prompt={concept.prompt} />
        </aside>
      </main>
    </div>
  )
}
