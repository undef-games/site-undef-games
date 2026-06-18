import type { HTMLAttributes, ReactNode } from 'react'

export interface ScanlinesPanelProps extends HTMLAttributes<HTMLElement> {
  title?: string
  children: ReactNode
}

export function ScanlinesPanel({ title, children, className, ...props }: ScanlinesPanelProps) {
  return (
    <section {...props} className={['scanlines-panel', className].filter(Boolean).join(' ')}>
      {title ? <h2 className="scanlines-panel__title">{title}</h2> : null}
      {children}
    </section>
  )
}
