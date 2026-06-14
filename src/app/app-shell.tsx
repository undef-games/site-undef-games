import { useState } from 'react'
import type { CSSProperties } from 'react'
import { concepts } from '../concepts/registry'
import { getLogoSystem } from '../logo/logo-system'
import { ResolvedLogoPanel } from '../logo/resolved-logo-panel'
import { LogoLabScene } from '../scene/logo-lab-scene'
import { CompareTray } from '../ui/compare-tray'
import { ConceptRail } from '../ui/concept-rail'
import { ControlPanel } from '../ui/control-panel'
import { PromptPanel } from '../ui/prompt-panel'

export function AppShell() {
  const [activeConceptId, setActiveConceptId] = useState(concepts[0].id)
  const concept = concepts.find((candidate) => candidate.id === activeConceptId) ?? concepts[0]
  const system = getLogoSystem(concept)
  const skinStyle = {
    '--concept-bg': concept.colorTokens.background,
    '--concept-fg': concept.colorTokens.foreground,
    '--concept-accent': concept.colorTokens.accent,
  } as CSSProperties

  return (
    <div className="app-shell" data-concept={concept.id} data-system-layout={system.layout} style={skinStyle}>
      <header className="topbar">
        <div>
          <p className="eyebrow">undef games</p>
          <h1>undef logos</h1>
          <p className="active-system">{concept.name} / {system.descriptor}</p>
        </div>
      </header>
      <main className="layout">
        <ConceptRail concepts={concepts} activeConceptId={concept.id} onSelect={setActiveConceptId} />
        <section className="scene-frame">
          <LogoLabScene concept={concept} />
        </section>
        <aside className="panel-stack">
          <ResolvedLogoPanel concept={concept} />
          <PromptPanel prompt={concept.prompt} />
          <ControlPanel />
          <CompareTray />
        </aside>
      </main>
    </div>
  )
}
