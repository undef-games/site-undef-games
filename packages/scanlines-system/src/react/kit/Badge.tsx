import type { ReactNode } from 'react'

export type BadgeTone = 'neutral' | 'signal' | 'positive' | 'warn' | 'danger'

export function Badge({ tone = 'neutral', children }: { tone?: BadgeTone; children: ReactNode }) {
  return <span className={`badge badge--${tone}`}>{children}</span>
}

export function StatusPill({ tone = 'neutral', children }: { tone?: BadgeTone; children: ReactNode }) {
  return (
    <span className="status-pill" data-tone={tone}>
      <span className="status-pill__dot" aria-hidden="true" />
      {children}
    </span>
  )
}
