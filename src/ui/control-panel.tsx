import type { LogoConcept } from '../concepts/types'
import { getLogoSystem } from '../logo/logo-system'

export function ControlPanel({ concept, phase }: { concept: LogoConcept; phase: number }) {
  const system = getLogoSystem(concept)
  const activePhase = system.phases[phase % system.phases.length]

  return (
    <section className="panel">
      <h2>State</h2>
      <p>{activePhase}</p>
      <div className="phase-track" aria-label="prototype phase">
        {system.phases.map((label, index) => (
          <span key={label} data-active={index === phase % system.phases.length}>
            {index + 1}
          </span>
        ))}
      </div>
    </section>
  )
}
