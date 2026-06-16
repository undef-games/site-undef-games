type SectionCopy = {
  kicker: string
  title: string
}

type BodySectionCopy = SectionCopy & {
  body: string
}

type SiteSurfaceSections = {
  projects: SectionCopy
  identity: BodySectionCopy
}

export type SiteSurfaceCopy = {
  hero: {
    kicker: string
    title: string
    support: string
    primaryAction: { href: string; label: string }
    secondaryAction: { href: string; label: string }
    statusLabel: string
  }
  projects: Array<{
    className: string
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
  return isRecord(value) && typeof value.href === 'string' && typeof value.label === 'string'
}

function isProject(value: unknown): value is SiteSurfaceCopy['projects'][number] {
  return (
    isRecord(value) &&
    typeof value.className === 'string' &&
    typeof value.description === 'string' &&
    typeof value.href === 'string' &&
    typeof value.label === 'string' &&
    typeof value.tag === 'string'
  )
}

function isSectionCopy(value: unknown): value is SectionCopy {
  return isRecord(value) && typeof value.kicker === 'string' && typeof value.title === 'string'
}

function isBodySectionCopy(value: unknown): value is BodySectionCopy {
  return (
    isRecord(value) &&
    typeof value.kicker === 'string' &&
    typeof value.title === 'string' &&
    typeof value.body === 'string'
  )
}

function isSiteSurfaceSections(value: unknown): value is SiteSurfaceSections {
  return isRecord(value) && isSectionCopy(value.projects) && isBodySectionCopy(value.identity)
}

function isSiteSurfaceCopy(value: unknown): value is SiteSurfaceCopy {
  if (!isRecord(value)) return false

  const { hero, projects, sections } = value

  return (
    isRecord(hero) &&
    typeof hero.kicker === 'string' &&
    typeof hero.title === 'string' &&
    typeof hero.support === 'string' &&
    isLink(hero.primaryAction) &&
    isLink(hero.secondaryAction) &&
    typeof hero.statusLabel === 'string' &&
    Array.isArray(projects) &&
    projects.every(isProject) &&
    isSiteSurfaceSections(sections)
  )
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
