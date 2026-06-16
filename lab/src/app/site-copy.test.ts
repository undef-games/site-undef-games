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
            "support": "from-hugo",
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
              "description": "Dice and table tools built to keep groups moving quickly at the table and on the network.",
              "href": "https://undefdice.com",
              "label": "Undef Dice",
              "tag": "dice"
            }
          ],
          "sections": {
            "signal": {
              "kicker": "Interactive field",
              "title": "Shared play needs strong systems underneath it.",
              "body": "The site stays active and readable while pointing people toward the products, tools, and experiments that make play easier to share online and off."
            },
            "projects": {
              "kicker": "Live routes",
              "title": "Projects built to be used, watched, and played with."
            },
            "warp": {
              "kicker": "Flagship route",
              "title": "TradeWars: WARP Agent Runtime Platform.",
              "body": "A live alpha platform for runtime control, automation, and operator tooling around TradeWars.",
              "linkLabel": "Explore WARP",
              "href": "https://warp.undef.games"
            },
            "dice": {
              "kicker": "Table tools",
              "title": "Undef Dice keeps shared play moving.",
              "body": "Fast dice and lightweight utilities for groups who want clearer game moments online and off.",
              "linkLabel": "Open Undef Dice",
              "href": "https://undefdice.com"
            },
            "taybols": {
              "kicker": "Small experiments",
              "title": "Taybols keeps the smaller ideas in circulation.",
              "body": "Generators, utility tools, and playful experiments that can grow into finished systems.",
              "linkLabel": "Open Taybols",
              "href": "https://taybols.undef.games"
            },
            "identity": {
              "kicker": "Company baseline",
              "title": "Good systems should make shared play easier to reach.",
              "body": "undef games builds the technical side of play so people can gather, operate, and have fun across digital and physical spaces."
            },
            "closing": {
              "kicker": "undef.games",
              "title": "Built for people to play together.",
              "action": "Back to top"
            }
          }
        }
      </script>
    `

    expect(readSiteSurfaceCopy()).toEqual({
      hero: {
        support: 'from-hugo',
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
          description:
            'Dice and table tools built to keep groups moving quickly at the table and on the network.',
          href: 'https://undefdice.com',
          label: 'Undef Dice',
          tag: 'dice',
        },
      ],
      sections: {
        signal: {
          kicker: 'Interactive field',
          title: 'Shared play needs strong systems underneath it.',
          body:
            'The site stays active and readable while pointing people toward the products, tools, and experiments that make play easier to share online and off.',
        },
        projects: {
          kicker: 'Live routes',
          title: 'Projects built to be used, watched, and played with.',
        },
        warp: {
          kicker: 'Flagship route',
          title: 'TradeWars: WARP Agent Runtime Platform.',
          body:
            'A live alpha platform for runtime control, automation, and operator tooling around TradeWars.',
          linkLabel: 'Explore WARP',
          href: 'https://warp.undef.games',
        },
        dice: {
          kicker: 'Table tools',
          title: 'Undef Dice keeps shared play moving.',
          body:
            'Fast dice and lightweight utilities for groups who want clearer game moments online and off.',
          linkLabel: 'Open Undef Dice',
          href: 'https://undefdice.com',
        },
        taybols: {
          kicker: 'Small experiments',
          title: 'Taybols keeps the smaller ideas in circulation.',
          body:
            'Generators, utility tools, and playful experiments that can grow into finished systems.',
          linkLabel: 'Open Taybols',
          href: 'https://taybols.undef.games',
        },
        identity: {
          kicker: 'Company baseline',
          title: 'Good systems should make shared play easier to reach.',
          body:
            'undef games builds the technical side of play so people can gather, operate, and have fun across digital and physical spaces.',
        },
        closing: {
          kicker: 'undef.games',
          title: 'Built for people to play together.',
          action: 'Back to top',
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
            "support": "from-hugo",
            "primaryAction": { "href": "https://warp.undef.games", "label": 42 }
          },
          "projects": [],
          "sections": {
            "signal": { "kicker": "Interactive field", "title": "Shared play needs strong systems underneath it.", "body": "signal body" },
            "projects": { "kicker": "Live routes", "title": "Projects built to be used, watched, and played with." },
            "warp": { "kicker": "Flagship route", "title": "TradeWars: WARP Agent Runtime Platform.", "body": "warp body", "linkLabel": "Explore WARP", "href": "https://warp.undef.games" },
            "dice": { "kicker": "Table tools", "title": "Undef Dice keeps shared play moving.", "body": "dice body", "linkLabel": "Open Undef Dice", "href": "https://undefdice.com" },
            "taybols": { "kicker": "Small experiments", "title": "Taybols keeps the smaller ideas in circulation.", "body": "taybols body", "linkLabel": "Open Taybols", "href": "https://taybols.undef.games" },
            "identity": { "kicker": "Company baseline", "title": "Good systems should make shared play easier to reach.", "body": "identity body" },
            "closing": { "kicker": "undef.games", "title": "Built for people to play together.", "action": "Back to top" }
          }
        }
      </script>
    `

    expect(readSiteSurfaceCopy()).toBeNull()
  })

  it('returns null when a nested section project entry is malformed', () => {
    document.body.innerHTML = `
      <script id="site-copy-data" type="application/json">
        {
          "hero": { "support": "from-hugo" },
          "projects": [],
          "sections": {
            "signal": { "kicker": "Interactive field", "title": "Shared play needs strong systems underneath it.", "body": "signal body" },
            "projects": { "kicker": "Live routes", "title": "Projects built to be used, watched, and played with." },
            "warp": { "kicker": "Flagship route", "title": "TradeWars: WARP Agent Runtime Platform.", "body": "warp body", "linkLabel": "Explore WARP", "href": 7 },
            "dice": { "kicker": "Table tools", "title": "Undef Dice keeps shared play moving.", "body": "dice body", "linkLabel": "Open Undef Dice", "href": "https://undefdice.com" },
            "taybols": { "kicker": "Small experiments", "title": "Taybols keeps the smaller ideas in circulation.", "body": "taybols body", "linkLabel": "Open Taybols", "href": "https://taybols.undef.games" },
            "identity": { "kicker": "Company baseline", "title": "Good systems should make shared play easier to reach.", "body": "identity body" },
            "closing": { "kicker": "undef.games", "title": "Built for people to play together.", "action": "Back to top" }
          }
        }
      </script>
    `

    expect(readSiteSurfaceCopy()).toBeNull()
  })
})
