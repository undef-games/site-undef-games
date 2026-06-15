import type { LogoConcept } from '../concepts/types'

export function CompareTray({ concepts, activeConceptId }: { concepts: LogoConcept[]; activeConceptId: string }) {
  return (
    <section className="panel">
      <h2>Prototypes</h2>
      <div className="prototype-list">
        {concepts.map((concept) => (
          <span key={concept.id} data-active={concept.id === activeConceptId}>
            {concept.name}
          </span>
        ))}
      </div>
    </section>
  )
}
