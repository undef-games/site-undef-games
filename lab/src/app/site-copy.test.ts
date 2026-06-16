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
            "primaryAction": { "href": "/play", "label": "Play" }
          },
          "projects": [
            {
              "description": "desc",
              "href": "/warp",
              "label": "Warp",
              "tag": "warp"
            }
          ],
          "sections": {
            "projects": { "kicker": "k", "title": "t" },
            "identity": { "kicker": "i", "title": "it", "body": "ib" }
          }
        }
      </script>
    `

    expect(readSiteSurfaceCopy()).toEqual({
      hero: {
        support: 'from-hugo',
        primaryAction: { href: '/play', label: 'Play' },
      },
      projects: [
        {
          description: 'desc',
          href: '/warp',
          label: 'Warp',
          tag: 'warp',
        },
      ],
      sections: {
        projects: { kicker: 'k', title: 't' },
        identity: { kicker: 'i', title: 'it', body: 'ib' },
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
})
