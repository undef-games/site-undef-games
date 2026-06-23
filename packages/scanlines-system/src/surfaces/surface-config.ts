export type ScanlinesSurface = 'site' | 'auth' | 'account' | 'admin'

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

export const ADMIN_SURFACE_NAV_ITEMS: ScanlinesNavItem[] = [
  { href: '#principals', label: 'Principals' },
  { href: '#roles', label: 'Roles' },
  { href: '#audit', label: 'Audit' },
  { href: '#signals', label: 'Signals' },
  { href: '#spend', label: 'Spend' },
]
