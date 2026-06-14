import type { LogoConcept } from '../concepts/types'
import { getLogoSystem } from './logo-system'

export function LogoCompact({ concept }: { concept: LogoConcept }) {
  const system = getLogoSystem(concept)

  return (
    <div className="logo-compact" data-concept={concept.id} data-layout={system.layout}>
      {system.compact}
    </div>
  )
}
