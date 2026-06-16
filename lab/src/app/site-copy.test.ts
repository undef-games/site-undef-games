import { afterEach, describe, expect, it } from 'vitest'
import { readSiteSurfaceCopy } from './site-copy-site'

describe('site copy loader', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('reads production site copy from embedded hugo json', () => {
    document.body.innerHTML = `
      <script id="site-copy-data" type="application/json">
        {
          "hero": {
            "kicker": "CH 00 / SIGNAL FIELD",
            "title": "undef games",
            "support": "Indie developer building game tools and systems for fun shared experiences online and off.",
            "primaryAction": { "href": "https://warp.undef.games", "label": "Explore WARP" },
            "secondaryAction": { "href": "#projects", "label": "View projects" },
            "statusLabel": "Shared play, digital and physical."
          },
          "projects": [
            {
              "className": "product-link--warp",
              "description": "The flagship route: a live alpha platform for TradeWars runtime, automation, and operator tooling.",
              "href": "https://warp.undef.games",
              "label": "TradeWars: WARP Agent Runtime Platform",
              "tag": "warp"
            },
            {
              "className": "product-link--dice",
              "description": "Dice and table tools for shared play at the table and on the network.",
              "href": "https://undefdice.com",
              "label": "Undef Dice",
              "tag": "dice"
            },
            {
              "className": "product-link--taybols",
              "description": "Smaller experiments, generators, and odd little utilities with room to become bigger systems.",
              "href": "https://taybols.undef.games",
              "label": "Taybols",
              "tag": "taybols"
            }
          ],
          "sections": {
            "projects": {
              "kicker": "Live routes",
              "title": "Projects built to be used, watched, and played with."
            },
            "identity": {
              "kicker": "Company baseline",
              "title": "Good systems should make shared play easier to reach.",
              "body": "undef games builds the technical side of play so people can gather, operate, and have fun across digital and physical spaces."
            }
          }
        }
      </script>
    `

    expect(readSiteSurfaceCopy()).toEqual({
      hero: {
        kicker: 'CH 00 / SIGNAL FIELD',
        title: 'undef games',
        support:
          'Indie developer building game tools and systems for fun shared experiences online and off.',
        primaryAction: { href: 'https://warp.undef.games', label: 'Explore WARP' },
        secondaryAction: { href: '#projects', label: 'View projects' },
        statusLabel: 'Shared play, digital and physical.',
      },
      projects: [
        {
          className: 'product-link--warp',
          description:
            'The flagship route: a live alpha platform for TradeWars runtime, automation, and operator tooling.',
          href: 'https://warp.undef.games',
          label: 'TradeWars: WARP Agent Runtime Platform',
          tag: 'warp',
        },
        {
          className: 'product-link--dice',
          description: 'Dice and table tools for shared play at the table and on the network.',
          href: 'https://undefdice.com',
          label: 'Undef Dice',
          tag: 'dice',
        },
        {
          className: 'product-link--taybols',
          description:
            'Smaller experiments, generators, and odd little utilities with room to become bigger systems.',
          href: 'https://taybols.undef.games',
          label: 'Taybols',
          tag: 'taybols',
        },
      ],
      sections: {
        projects: {
          kicker: 'Live routes',
          title: 'Projects built to be used, watched, and played with.',
        },
        identity: {
          kicker: 'Company baseline',
          title: 'Good systems should make shared play easier to reach.',
          body:
            'undef games builds the technical side of play so people can gather, operate, and have fun across digital and physical spaces.',
        },
      },
    })
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
    document.body.innerHTML = `
      <script id="site-copy-data" type="text/plain">
        {
          "hero": { "support": "from-hugo" },
          "projects": [],
          "sections": {}
        }
      </script>
    `

    expect(readSiteSurfaceCopy()).toBeNull()
  })

  it('returns null when the embedded payload does not match the expected shape', () => {
    document.body.innerHTML = `
      <script id="site-copy-data" type="application/json">
        {
          "hero": { "support": 42 },
          "projects": [],
          "sections": {}
        }
      </script>
    `

    expect(readSiteSurfaceCopy()).toBeNull()
  })

  it('returns null when a hero action link is malformed', () => {
    document.body.innerHTML = `
      <script id="site-copy-data" type="application/json">
        {
          "hero": {
            "kicker": "Interactive field",
            "title": "Built for people to play together.",
            "support": "from-hugo",
            "primaryAction": { "href": "https://warp.undef.games", "label": 42 }
          },
          "projects": [],
          "sections": {
            "projects": { "kicker": "Live routes", "title": "Projects built to be used, watched, and played with." },
            "identity": { "kicker": "Company baseline", "title": "Good systems should make shared play easier to reach.", "body": "identity body" }
          }
        }
      </script>
    `

    expect(readSiteSurfaceCopy()).toBeNull()
  })

  it('returns null when the embedded payload omits required hero fields', () => {
    document.body.innerHTML = `
      <script id="site-copy-data" type="application/json">
        {
          "hero": {
            "kicker": "CH 00 / SIGNAL FIELD",
            "title": "undef games",
            "support": "Indie developer building game tools and systems for fun shared experiences online and off.",
            "primaryAction": { "href": "https://warp.undef.games", "label": "Explore WARP" }
          },
          "projects": [
            {
              "className": "product-link--warp",
              "description": "The flagship route: a live alpha platform for TradeWars runtime, automation, and operator tooling.",
              "href": "https://warp.undef.games",
              "label": "TradeWars: WARP Agent Runtime Platform",
              "tag": "warp"
            }
          ],
          "sections": {
            "projects": { "kicker": "Live routes", "title": "Projects built to be used, watched, and played with." },
            "identity": { "kicker": "Company baseline", "title": "Good systems should make shared play easier to reach.", "body": "identity body" }
          }
        }
      </script>
    `

    expect(readSiteSurfaceCopy()).toBeNull()
  })

  it('returns null when a project omits its required class name', () => {
    document.body.innerHTML = `
      <script id="site-copy-data" type="application/json">
        {
          "hero": {
            "kicker": "CH 00 / SIGNAL FIELD",
            "title": "undef games",
            "support": "Indie developer building game tools and systems for fun shared experiences online and off.",
            "primaryAction": { "href": "https://warp.undef.games", "label": "Explore WARP" },
            "secondaryAction": { "href": "#projects", "label": "View projects" },
            "statusLabel": "Shared play, digital and physical."
          },
          "projects": [
            {
              "description": "The flagship route: a live alpha platform for TradeWars runtime, automation, and operator tooling.",
              "href": "https://warp.undef.games",
              "label": "TradeWars: WARP Agent Runtime Platform",
              "tag": "warp"
            }
          ],
          "sections": {
            "projects": { "kicker": "Live routes", "title": "Projects built to be used, watched, and played with." },
            "identity": { "kicker": "Company baseline", "title": "Good systems should make shared play easier to reach.", "body": "identity body" }
          }
        }
      </script>
    `

    expect(readSiteSurfaceCopy()).toBeNull()
  })

  it('returns null when a nested identity section entry is malformed', () => {
    document.body.innerHTML = `
      <script id="site-copy-data" type="application/json">
        {
          "hero": {
            "kicker": "CH 00 / SIGNAL FIELD",
            "title": "undef games",
            "support": "Indie developer building game tools and systems for fun shared experiences online and off.",
            "primaryAction": { "href": "https://warp.undef.games", "label": "Explore WARP" },
            "secondaryAction": { "href": "#projects", "label": "View projects" },
            "statusLabel": "Shared play, digital and physical."
          },
          "projects": [],
          "sections": {
            "projects": { "kicker": "Live routes", "title": "Projects built to be used, watched, and played with." },
            "identity": { "kicker": "Company baseline", "title": "Good systems should make shared play easier to reach.", "body": 7 }
          }
        }
      </script>
    `

    expect(readSiteSurfaceCopy()).toBeNull()
  })
})
