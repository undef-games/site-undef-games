import type { LogoConcept } from '../concepts/types'
import { LogoCompact } from './logo-compact'
import { LogoMark } from './logo-mark'
import { getLogoSystem } from './logo-system'
import { LogoWordmark } from './logo-wordmark'

export function ResolvedLogoPanel({ concept }: { concept: LogoConcept }) {
  const system = getLogoSystem(concept)

  return (
    <section className="panel resolved-panel" data-system={system.id}>
      <h2>{concept.name}</h2>
      <p>{concept.prompt}</p>
      <p className="system-descriptor">{system.descriptor}</p>
      <h3>Primary</h3>
      <div className="logo-variant logo-variant-primary">
        <div className="logo-lockup" data-layout={system.layout}>
          <LogoMark concept={concept} accessibleLabel={`${concept.name} logo mark`} />
          <LogoWordmark concept={concept} />
        </div>
      </div>
      <h3>Symbol</h3>
      <div className="logo-variant logo-variant-symbol">
        <LogoMark concept={concept} decorative />
      </div>
      <h3>Compact</h3>
      <div className="logo-variant logo-variant-compact">
        <LogoCompact concept={concept} />
      </div>
    </section>
  )
}
