import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { readSiteSurfaceCopy, type SiteSurfaceCopy } from './site-copy-site'

const testFilePath = import.meta.url.startsWith('file:')
  ? fileURLToPath(import.meta.url)
  : import.meta.url
const builtHomepagePath = resolve(dirname(testFilePath), '../../../public/index.html')
const builtHomepageHtml = readFileSync(builtHomepagePath, 'utf8')
const builtPayloadMatch = builtHomepageHtml.match(
  /<script[^>]*id=["']?site-copy-data["']?[^>]*type=["']?application\/json["']?[^>]*>([\s\S]*?)<\/script>/i,
)

if (!builtPayloadMatch) {
  throw new Error('public/index.html is missing embedded site-copy-data')
}
const builtPayloadJson = builtPayloadMatch[1]

function createValidPayload() {
  return JSON.parse(builtPayloadJson) as SiteSurfaceCopy
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
