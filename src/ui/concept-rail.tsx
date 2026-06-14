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
      {concepts.map((concept) => (
        <button
          key={concept.id}
          type="button"
          data-active={concept.id === activeConceptId}
          onClick={() => onSelect(concept.id)}
        >
          {concept.name}
        </button>
      ))}
    </nav>
  )
}
