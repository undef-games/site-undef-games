import type { LogoConcept } from '../concepts/types'
import { LogoCompact } from './logo-compact'
import { LogoMark } from './logo-mark'
import { LogoWordmark } from './logo-wordmark'

export function ResolvedLogoPanel({ concept }: { concept: LogoConcept }) {
  return (
    <section className="panel">
      <h2>{concept.name}</h2>
      <p>{concept.prompt}</p>
      <h3>Primary</h3>
      <div className="logo-variant logo-variant-primary">
        <div className="logo-lockup">
          <LogoMark accent={concept.colorTokens.accent} accessibleLabel={`${concept.name} logo mark`} />
          <LogoWordmark />
        </div>
      </div>
      <h3>Symbol</h3>
      <div className="logo-variant logo-variant-symbol">
        <LogoMark accent={concept.colorTokens.accent} decorative />
      </div>
      <h3>Compact</h3>
      <div className="logo-variant logo-variant-compact">
        <LogoCompact />
      </div>
    </section>
  )
}
