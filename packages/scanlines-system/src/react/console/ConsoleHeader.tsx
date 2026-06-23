import type { ReactNode } from 'react'
import type { ScanlinesNavItem } from '../../surfaces/surface-config'

export interface ConsoleHeaderProps {
  brandLabel: string
  nav?: ScanlinesNavItem[]
  activeNavHref?: string
  utilities?: ReactNode
  actions?: ReactNode
  homeHref?: string
}

export function ConsoleHeader({ brandLabel, nav = [], activeNavHref, utilities, actions, homeHref = '/' }: ConsoleHeaderProps) {
  return (
    <header className="console-header">
      <a className="console-header__brand" href={homeHref}>{brandLabel}</a>
      {nav.length > 0 && (
        <nav className="console-header__nav" aria-label="Primary">
          {nav.map((item) => (
            <a key={item.href} href={item.href} aria-current={item.href === activeNavHref ? 'page' : undefined}>{item.label}</a>
          ))}
        </nav>
      )}
      <div className="console-header__actions">{actions}</div>
      <div className="console-header__utilities">{utilities}</div>
    </header>
  )
}
