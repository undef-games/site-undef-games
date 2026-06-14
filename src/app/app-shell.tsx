import { LogoLabScene } from '../scene/logo-lab-scene'

export function AppShell() {
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
          <LogoLabScene activeConceptId="prompt-cursor" />
        </section>
        <aside className="panel-stack">
          <section className="panel">
            <h2>Resolved logo system</h2>
          </section>
          <section className="panel">
            <h2>Compare tray</h2>
          </section>
        </aside>
      </main>
    </div>
  )
}
