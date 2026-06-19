import { afterEach, describe, expect, it } from 'vitest'
import { readSiteSurfaceCopy, type SiteSurfaceCopy } from '@undef/scanlines-system'

const VALID_SITE_SURFACE_COPY: SiteSurfaceCopy = {
  hero: {
    kicker: 'Shared play, digital and physical.',
    title: 'undef games',
    support: 'Indie developer building game tools and systems for fun shared experiences online and off.',
    primaryAction: { href: 'https://warp.undef.games/', label: 'Explore WARP' },
    secondaryAction: { href: '/games/', label: 'View projects' },
    statusLabel: 'CH 00  SIGNAL 50  SYNCING',
  },
  projects: [
    {
      className: 'warp',
      description: 'Agents, automation, and operator surfaces for a live TradeWars runtime.',
      href: 'https://warp.undef.games/',
      label: 'TradeWars: WARP Agent Runtime Platform',
      tag: 'WARP',
    },
    {
      className: 'dice',
      description: 'Fast dice tools for digital tables, rituals, and shared sessions.',
      href: 'https://undefdice.com/',
      label: 'Undef Dice',
      tag: 'DICE',
    },
    {
      className: 'taybols',
      description: 'Smaller strange things built to be tried, tuned, and replayed.',
      href: 'https://taybols.undef.games/',
      label: 'Taybols',
      tag: 'TAYBOLS',
    },
  ],
  sections: {
    signal: {
      kicker: 'Interactive field',
      title: 'Responsive by design, not by decoration.',
      body: 'The scanline field stays alive under the cursor and the page so the site feels active without hiding the products behind abstract motion.',
    },
    projects: {
      kicker: 'Live routes',
      title: 'Projects built to be used, watched, and played with.',
    },
    warp: {
      kicker: 'Runtime platform',
      title: 'TradeWars: WARP Agent Runtime Platform',
      body: 'A live alpha route for agents, automation, and operator surfaces in the TradeWars world.',
      href: 'https://warp.undef.games/',
      linkLabel: 'Explore WARP',
    },
    dice: {
      kicker: 'Dice tools',
      title: 'Undef Dice',
      body: 'Fast table-ready dice tools for shared sessions, quick rulings, and repeat play.',
      href: 'https://undefdice.com/',
      linkLabel: 'Open Undef Dice',
    },
    taybols: {
      kicker: 'Small experiments',
      title: 'Taybols',
      body: 'A smaller route for odd tools, playful systems, and experiments worth testing in public.',
      href: 'https://taybols.undef.games/',
      linkLabel: 'Visit Taybols',
    },
    identity: {
      kicker: 'Identity baseline',
      title: 'Good systems should make shared play easier to reach.',
      body: 'We build the technical parts seriously so the experience on the other side can stay welcoming, legible, and fun.',
    },
    closing: {
      kicker: 'Next route',
      title: 'Follow the live work, then step into the build that fits you.',
      action: 'Back to top',
    },
  },
}

function createValidPayload() {
  return structuredClone(VALID_SITE_SURFACE_COPY)
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
    payload.hero.primaryAction = { href: payload.hero.primaryAction.href, label: 42 as never }
    mountSiteCopyScript(payload)

    expect(readSiteSurfaceCopy()).toBeNull()
  })

  it('returns null when the embedded payload omits required hero fields', () => {
    const payload = createValidPayload()
    payload.hero = (({ secondaryAction: _removed, ...hero }) => hero)(payload.hero) as never
    mountSiteCopyScript(payload)

    expect(readSiteSurfaceCopy()).toBeNull()
  })

  it('returns null when a project omits its required class name', () => {
    const payload = createValidPayload()
    payload.projects[0] = (({ className: _removed, ...project }) => project)(payload.projects[0]) as never
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
