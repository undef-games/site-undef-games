export type ScanlinesSurface = 'site' | 'auth' | 'account'

export interface ScanlinesNavItem {
  href: string
  label: string
  current?: boolean
}

export interface ScanlinesUtilityAction {
  href: string
  label: string
}

export const SITE_SURFACE_NAV_ITEMS: ScanlinesNavItem[] = [
  { href: '/games/', label: 'Games' },
  { href: '/logs/', label: 'Logs' },
  { href: '/about/', label: 'About' },
]

export const BACK_TO_SITE_ACTION: ScanlinesUtilityAction = {
  href: 'https://undef.games/',
  label: 'Back to site',
}
