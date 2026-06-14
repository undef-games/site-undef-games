import type { LogoConcept } from '../concepts/types'
import { getConceptPhase, getConceptProgress, type LogoPlayState } from './logo-play-state'
import { LogoCompact } from './logo-compact'
import { LogoMark } from './logo-mark'
import { getLogoSystem } from './logo-system'
import { LogoWordmark } from './logo-wordmark'

export function ResolvedLogoPanel({
  concept,
  playState,
}: {
  concept: LogoConcept
  playState: LogoPlayState
}) {
  const system = getLogoSystem(concept)
  const phase = getConceptPhase(concept.id, playState)
  const progress = getConceptProgress(concept.id, playState)
  const activePhase = system.phases[phase]

  return (
    <section className="panel resolved-panel" data-system={system.id}>
      <h2>{concept.name}</h2>
      <p className="system-descriptor">{system.descriptor} / {activePhase}</p>
      <h3>Primary</h3>
      <div className="logo-variant logo-variant-primary">
        <div className="logo-lockup" data-layout={system.layout}>
          <LogoMark concept={concept} phase={phase} progress={progress} accessibleLabel={`${concept.name} logo mark`} />
          <LogoWordmark concept={concept} phase={phase} progress={progress} />
        </div>
      </div>
      <h3>Symbol</h3>
      <div className="logo-variant logo-variant-symbol">
        <LogoMark concept={concept} phase={phase} progress={progress} decorative />
      </div>
      <h3>Compact</h3>
      <div className="logo-variant logo-variant-compact">
        <LogoCompact concept={concept} />
      </div>
    </section>
  )
}
