import type { ReactNode } from 'react'
import { BrandMark } from './brand-mark'
import type { ScanlinesNavItem, ScanlinesSurface, ScanlinesUtilityAction } from '../surfaces/surface-config'

export interface ScanlinesHeaderProps {
  surface: ScanlinesSurface
  brandLabel: string
  navItems?: ScanlinesNavItem[]
  utilityAction?: ScanlinesUtilityAction
  accountSlot?: ReactNode
  homeHref?: string
}

export function ScanlinesHeader({
  surface,
  brandLabel,
  navItems = [],
  utilityAction,
  accountSlot,
  homeHref = '/',
}: ScanlinesHeaderProps) {
  return (
    <header className={`scanlines-header scanlines-header--${surface}`}>
      <a className="scanlines-header__brand" href={homeHref} aria-label={`${brandLabel} home`}>
        <BrandMark />
        <span>{brandLabel}</span>
      </a>
      <nav className="scanlines-header__nav" aria-label={`${surface} navigation`}>
        {navItems.map((item) => (
          <a key={item.href} href={item.href} aria-current={item.current ? 'page' : undefined}>
            {item.label}
          </a>
        ))}
      </nav>
      <div className="scanlines-header__utilities">
        {utilityAction ? (
          <a className="scanlines-header__utility-link" href={utilityAction.href}>
            {utilityAction.label}
          </a>
        ) : null}
        {accountSlot}
      </div>
    </header>
  )
}
