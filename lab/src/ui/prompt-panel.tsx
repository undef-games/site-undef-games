export function PromptPanel({ prompt }: { prompt: string }) {
  return (
    <section className="panel">
      <h2>Prompt</h2>
      <p>{prompt}</p>
    </section>
  )
}
