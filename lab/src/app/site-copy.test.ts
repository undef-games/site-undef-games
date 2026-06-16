import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { readSiteSurfaceCopy } from './site-copy-site'

type HomeData = {
  hero: {
    kicker: string
    title: string
    copy: string
    primary_href: string
    primary_label: string
    secondary_href: string
    secondary_label: string
  }
  products_intro: {
    kicker: string
    title: string
  }
  products: Array<{
    description: string
    href: string
    label: string
    tag: string
  }>
  identity: {
    kicker: string
    title: string
    copy: string
  }
}

const homeData = JSON.parse(
  readFileSync(resolve(process.cwd(), '../data/site/home.json'), 'utf8'),
) as HomeData

function createValidPayload() {
  return {
    hero: {
      kicker: homeData.hero.kicker,
      title: homeData.hero.title,
      support: homeData.hero.copy,
      primaryAction: { href: homeData.hero.primary_href, label: homeData.hero.primary_label },
      secondaryAction: { href: homeData.hero.secondary_href, label: homeData.hero.secondary_label },
      statusLabel: 'Shared play, digital and physical.',
    },
    projects: homeData.products.map((product) => ({
      className: `product-link--${product.tag}`,
      description: product.description,
      href: product.href,
      label: product.label,
      tag: product.tag,
    })),
    sections: {
      projects: {
        kicker: homeData.products_intro.kicker,
        title: homeData.products_intro.title,
      },
      identity: {
        kicker: homeData.identity.kicker,
        title: homeData.identity.title,
        body: homeData.identity.copy,
      },
    },
  }
}

function mountSiteCopyScript(payload: unknown, type = 'application/json') {
  document.body.innerHTML = `
    <script id="site-copy-data" type="${type}">
      ${JSON.stringify(payload)}
    </script>
  `
}

describe('site copy loader', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('reads production site copy from embedded hugo json', () => {
    const payload = createValidPayload()
    mountSiteCopyScript(payload)

    expect(readSiteSurfaceCopy()).toEqual(payload)
  })

  it('returns null when the embedded payload is missing', () => {
    expect(readSiteSurfaceCopy()).toBeNull()
  })

  it('returns null when the embedded payload is invalid json', () => {
    document.body.innerHTML = `
      <script id="site-copy-data" type="application/json">
        {"hero":
      </script>
    `

    expect(readSiteSurfaceCopy()).toBeNull()
  })

  it('returns null when the embedded payload script has the wrong type', () => {
    mountSiteCopyScript(createValidPayload(), 'text/plain')

    expect(readSiteSurfaceCopy()).toBeNull()
  })

  it('returns null when the embedded payload does not match the expected shape', () => {
    const payload = createValidPayload()
    payload.hero.support = 42 as never
    mountSiteCopyScript(payload)

    expect(readSiteSurfaceCopy()).toBeNull()
  })

  it('returns null when a hero action link is malformed', () => {
    const payload = createValidPayload()
    payload.hero.primaryAction = { href: homeData.hero.primary_href, label: 42 as never }
    mountSiteCopyScript(payload)

    expect(readSiteSurfaceCopy()).toBeNull()
  })

  it('returns null when the embedded payload omits required hero fields', () => {
    const payload = createValidPayload()
    delete payload.hero.secondaryAction
    mountSiteCopyScript(payload)

    expect(readSiteSurfaceCopy()).toBeNull()
  })

  it('returns null when a project omits its required class name', () => {
    const payload = createValidPayload()
    delete payload.projects[0].className
    mountSiteCopyScript(payload)

    expect(readSiteSurfaceCopy()).toBeNull()
  })

  it('returns null when a nested identity section entry is malformed', () => {
    const payload = createValidPayload()
    payload.sections.identity.body = 7 as never
    mountSiteCopyScript(payload)

    expect(readSiteSurfaceCopy()).toBeNull()
  })
})
