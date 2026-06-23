import type { HTMLAttributes, ReactNode } from 'react'

export interface ScanlinesPanelProps extends HTMLAttributes<HTMLElement> {
  title?: string
  children: ReactNode
  variant?: 'default' | 'console'
}

export function ScanlinesPanel({ title, children, className, variant = 'default', ...props }: ScanlinesPanelProps) {
  return (
    <section
      {...props}
      className={['scanlines-panel', variant === 'console' && 'panel--console', className].filter(Boolean).join(' ')}
    >
      {title ? <h2 className="scanlines-panel__title">{title}</h2> : null}
      {children}
    </section>
  )
}
