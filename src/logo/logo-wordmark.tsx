import type { LogoConcept } from '../concepts/types'
import { getLogoSystem } from './logo-system'

export function LogoWordmark({ concept, phase = 0 }: { concept: LogoConcept; phase?: number }) {
  const system = getLogoSystem(concept)
  const phaseName = system.phases[phase % system.phases.length]

  return (
    <div className="logo-wordmark" data-concept={concept.id} data-layout={system.layout}>
      <span>{system.wordmark}</span>
      <small>{phaseName}</small>
    </div>
  )
}
