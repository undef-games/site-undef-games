import type { LogoConcept } from '../concepts/types'
import { getLogoSystem } from './logo-system'

export function LogoWordmark({ concept }: { concept: LogoConcept }) {
  const system = getLogoSystem(concept)

  return (
    <div className="logo-wordmark" data-concept={concept.id} data-layout={system.layout}>
      <span>{system.wordmark}</span>
      <small>{system.descriptor}</small>
    </div>
  )
}
