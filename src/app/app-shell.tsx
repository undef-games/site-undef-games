import { concepts } from '../concepts/registry'
import { ResolvedLogoPanel } from '../logo/resolved-logo-panel'
import { LogoLabScene } from '../scene/logo-lab-scene'

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
        <section className="scene-frame">
          <LogoLabScene activeConceptId={concept.id} />
        </section>
        <aside className="panel-stack">
          <ResolvedLogoPanel concept={concept} />
          <section className="panel">
            <h2>Compare tray</h2>
          </section>
        </aside>
      </main>
    </div>
  )
}
