type SectionCopy = {
  kicker: string
  title: string
}

type BodySectionCopy = SectionCopy & {
  body: string
}

type ProjectSectionCopy = BodySectionCopy & {
  href: string
  linkLabel: string
}

type ClosingSectionCopy = SectionCopy & {
  action: string
}

type SiteSurfaceSections = {
  signal: BodySectionCopy
  projects: SectionCopy
  warp: ProjectSectionCopy
  dice: ProjectSectionCopy
  taybols: ProjectSectionCopy
  identity: BodySectionCopy
  closing: ClosingSectionCopy
}

export type SiteSurfaceCopy = {
  hero: {
    support: string
    primaryAction?: { href: string; label: string }
    secondaryAction?: { href: string; label: string }
    statusLabel?: string
  }
  projects: Array<{
    className?: string
    description: string
    href: string
    label: string
    tag: string
  }>
  sections: SiteSurfaceSections
}

type JsonRecord = Record<string, unknown>

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null
}

function isLink(value: unknown): value is { href: string; label: string } {
  return (
    isRecord(value) &&
    typeof value.href === 'string' &&
    typeof value.label === 'string'
  )
}

function isProject(value: unknown): value is SiteSurfaceCopy['projects'][number] {
  return (
    isRecord(value) &&
    typeof value.description === 'string' &&
    typeof value.href === 'string' &&
    typeof value.label === 'string' &&
    typeof value.tag === 'string' &&
    (value.className === undefined || typeof value.className === 'string')
  )
}

function isSectionCopy(value: unknown): value is SectionCopy {
  return (
    isRecord(value) &&
    typeof value.kicker === 'string' &&
    typeof value.title === 'string'
  )
}

function isBodySectionCopy(value: unknown): value is BodySectionCopy {
  return isSectionCopy(value) && typeof value.body === 'string'
}

function isProjectSectionCopy(value: unknown): value is ProjectSectionCopy {
  return (
    isBodySectionCopy(value) &&
    typeof value.href === 'string' &&
    typeof value.linkLabel === 'string'
  )
}

function isClosingSectionCopy(value: unknown): value is ClosingSectionCopy {
  return isSectionCopy(value) && typeof value.action === 'string'
}

function isSiteSurfaceSections(value: unknown): value is SiteSurfaceSections {
  if (!isRecord(value)) return false

  return (
    isBodySectionCopy(value.signal) &&
    isSectionCopy(value.projects) &&
    isProjectSectionCopy(value.warp) &&
    isProjectSectionCopy(value.dice) &&
    isProjectSectionCopy(value.taybols) &&
    isBodySectionCopy(value.identity) &&
    isClosingSectionCopy(value.closing)
  )
}

function isSiteSurfaceCopy(value: unknown): value is SiteSurfaceCopy {
  if (!isRecord(value)) return false

  const { hero, projects, sections } = value
  if (!isRecord(hero) || typeof hero.support !== 'string') return false
  if (hero.primaryAction !== undefined && !isLink(hero.primaryAction)) return false
  if (hero.secondaryAction !== undefined && !isLink(hero.secondaryAction)) return false
  if (hero.statusLabel !== undefined && typeof hero.statusLabel !== 'string') return false
  if (!Array.isArray(projects) || !projects.every(isProject)) return false
  if (!isSiteSurfaceSections(sections)) return false

  return true
}

export function readSiteSurfaceCopy(): SiteSurfaceCopy | null {
  const node = document.getElementById('site-copy-data')
  if (!(node instanceof HTMLScriptElement)) return null
  if (node.type !== 'application/json') return null

  try {
    const parsed = JSON.parse(node.textContent ?? '')
    return isSiteSurfaceCopy(parsed) ? parsed : null
  } catch {
    return null
  }
}
