import { concepts } from '../concepts/registry'
import { ResolvedLogoPanel } from '../logo/resolved-logo-panel'
import { LogoLabScene } from '../scene/logo-lab-scene'
import { CompareTray } from '../ui/compare-tray'
import { ConceptRail } from '../ui/concept-rail'
import { ControlPanel } from '../ui/control-panel'
import { PromptPanel } from '../ui/prompt-panel'

export function AppShell() {
  const concept = concepts[0]

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">undef games</p>
          <h1>undef logos</h1>
        </div>
      </header>
      <main className="layout">
        <ConceptRail concepts={concepts} activeConceptId={concept.id} onSelect={() => undefined} />
        <section className="scene-frame">
          <LogoLabScene activeConceptId={concept.id} />
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
