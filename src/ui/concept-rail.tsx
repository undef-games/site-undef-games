import type { LogoConcept } from '../concepts/types'

export function ConceptRail({
  concepts,
  activeConceptId,
  onSelect,
}: {
  concepts: LogoConcept[]
  activeConceptId: string
  onSelect: (id: string) => void
}) {
  return (
    <nav className="concept-rail" aria-label="concept rail">
      {concepts.map((concept) => {
        const isActive = concept.id === activeConceptId

        return (
          <button
            key={concept.id}
            type="button"
            aria-current={isActive ? 'true' : undefined}
            data-active={isActive}
            onClick={() => onSelect(concept.id)}
          >
            {concept.name}
          </button>
        )
      })}
    </nav>
  )
}
