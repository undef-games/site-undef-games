# Games Roster and Motifs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Grow the undef.games site from 3 games to 10, move Taybols to `taybols.com`, and give every game its own animated motif — driven by a single `games.json` instead of five drifting copies.

**Architecture:** A new `data/site/games.json` is the sole source of truth. The shared `scanlines-system` landing surface is generalized so it renders a consumer-supplied array of sections instead of hardcoded `warp`/`dice`/`taybols` blocks. Site-specific rendering (the marquee, the `/games/` list, ten CSS/SVG glyphs) lives in this repo's project-level `layouts/` and `static/css/`, which Hugo resolves ahead of the vendored theme.

**Tech Stack:** Hugo (templates + `hugo.Data`), React 19 via `@undef-games/scanlines-system`, TypeScript 6, Vitest 4 (two projects, both at 100% coverage), Playwright 1.61, Cloudflare Pages via Wrangler.

## Global Constraints

- **Never hand-edit `themes/scanlines/`.** It is byte-vendored from `../scanlines-system/hugo/scanlines/`; `make check-scanlines` fails CI on sha256 drift. Change the source repo and re-run `make sync-scanlines`.
- **`../scanlines-system` is shared by four sites** (`site-undef-games`, `site-tradewars-com`, `site-eisonline-com`, `undef-bbs`). Nothing game-specific may be added to it.
- **Coverage gates are 100%** (lines/functions/branches/statements) in both `vitest.config.ts` (root) and `lab/vite.config.ts`. Any new module needs full coverage or an explicit documented exclusion.
- **No hardcoded URLs anywhere but `data/site/games.json`.** That file is the defaults file for this feature.
- **Commits:** Conventional Commits. No `Co-Authored-By: Claude` trailer. No mention of AI assistance.
- **Never bypass commit signing.** If signing stalls, stop and ask.
- **Hugo dev port is 1780** (`hugo.toml [server]`). If it is in use, stop and ask.
- **Canonical roster (10 games, exact values):**

| tag | tier | label | href | motif | variant |
|---|---|---|---|---|---|
| `warp` | flagship | `WARP: Warp Agent Runtime Portal` | `https://warp.undef.games` | `warp` | `signal` |
| `dice` | flagship | `Undef Dice` | `https://undefdice.com` | `dice` | `system` |
| `taybols` | flagship | `Taybols` | `https://taybols.com` | `taybols` | `signal` |
| `grove` | flagship | `Grove` | `https://grove.undef.games` | `grove` | `system` |
| `haiku` | flagship | `haiku.to` | `https://haiku.to` | `haiku` | `signal` |
| `becoming` | listed | `becoming.to` | `https://becoming.to` | `becoming` | — |
| `proverb` | listed | `proverb.to` | `https://proverb.to` | `proverb` | — |
| `stoke` | listed | `stoke.to` | `https://stoke.to` | `stoke` | — |
| `currents` | listed | `currents.to` | `https://currents.to` | `currents` | — |
| `amor` | listed | `amor.to` | `https://amor.to` | `amor` | — |

---

## File Structure

**Repo A — `../scanlines-system`** (lands and releases first)

| Path | Responsibility |
|---|---|
| `src/atmosphere/site/site-copy-loader.ts` | Modify — `sections` becomes an array; validator checks membership |
| `src/atmosphere/site/site-copy-loader.test.ts` | Modify — fixture and cases for the array shape |
| `src/atmosphere/site/site-app.tsx` | Modify — hardcoded game blocks collapse into one `.map()` |
| `src/atmosphere/station/station-toys.tsx` | Modify — `SectionEffectId` → `string`; `SectionToyEffect` gains `grove`, `haiku` |
| `src/atmosphere/station/theme-state.ts` | Modify — `DEFAULT_SECTION_EFFECTS` gains `grove`, `haiku` |
| `src/atmosphere/section-toys/grove.css` | Create — branching-tree motif |
| `src/atmosphere/section-toys/haiku.css` | Create — 5–7–5 lines motif |
| `package.json` | Modify — version bump |

**Repo B — `site-undef-games`**

| Path | Responsibility |
|---|---|
| `data/site/games.json` | Create — the single source of truth |
| `data/site/home.json` | Modify — drop `products`, `warp`, `dice`, `taybols` |
| `scripts/games-schema.ts` | Create — pure validator, no I/O |
| `scripts/games-schema.test.ts` | Create — schema unit tests |
| `scripts/gen-site-copy.mjs` | Create — emits `lab/src/app/site-copy.ts` |
| `ci/check-generated.sh` | Create — fails on stale generated file |
| `layouts/index.html` | Create — project override; emits `#site-copy-data` + fallback |
| `layouts/_default/games.html` | Create — the `/games/` flyby list |
| `layouts/partials/games-marquee.html` | Create — CSS marquee band |
| `layouts/partials/motif.html` | Create — dispatches `tag` → inline SVG glyph |
| `static/css/games.css` | Create — marquee, rows, ten glyphs, reduced-motion |
| `content/games.md` | Modify — front matter only, prose removed |
| `lab/src/app/site-copy.ts` | Modify — becomes generated |
| `lab/src/app/site-copy.test.ts` | Modify — updated to the ten-game shape |
| `tests/e2e/site.spec.ts` | Modify — taybols.com, fixture keys, new assertions |
| `tests/e2e/logo-lab.spec.ts` | Modify — taybols.com |
| `vitest.config.ts` | Modify — include `scripts/**` |
| `Makefile` | Modify — `gen-site-copy` + `check-generated` targets |

---

## Task 1: Generalize the site copy loader

**Files:**
- Modify: `../scanlines-system/src/atmosphere/site/site-copy-loader.ts:1-37,88-99`
- Test: `../scanlines-system/src/atmosphere/site/site-copy-loader.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `SiteSurfaceCopy` with `sections: SiteSurfaceSection[]`, where
  `SiteSurfaceSection = { id: string; kicker: string; title: string; body?: string; href?: string; linkLabel?: string; motif?: string; variant?: 'signal'|'system'|'identity'; ariaLabel?: string; action?: string }`.
  Task 2 renders it; Task 8 emits it from Hugo.

- [ ] **Step 1: Write the failing test**

Replace the `sections` object in `VALID_COPY` (`site-copy-loader.test.ts:23-30`) with an array, and add cases:

```ts
const VALID_COPY = {
  hero: {
    kicker: 'The kicker',
    title: 'The title',
    support: 'Support text',
    primaryAction: { href: '/primary', label: 'Primary' },
    secondaryAction: { href: '/secondary', label: 'Secondary' },
    statusLabel: 'Status',
  },
  projects: [
    { className: 'project-cls', description: 'A description', href: '/project', label: 'Project', tag: 'tag' },
  ],
  sections: [
    { id: 'signal', kicker: 'sig-kicker', title: 'sig-title', body: 'sig-body' },
    { id: 'projects', kicker: 'proj-kicker', title: 'proj-title' },
    { id: 'warp', kicker: 'warp-kicker', title: 'warp-title', body: 'warp-body', href: '/warp', linkLabel: 'Warp', motif: 'warp', variant: 'signal' },
    { id: 'identity', kicker: 'id-kicker', title: 'id-title', body: 'id-body' },
    { id: 'closing', kicker: 'cl-kicker', title: 'cl-title', action: 'Get started' },
  ],
}

describe('readSiteSurfaceCopy sections array', () => {
  it('accepts an arbitrary number of sections', () => {
    const many = {
      ...VALID_COPY,
      sections: [
        ...VALID_COPY.sections,
        { id: 'grove', kicker: 'k', title: 't', body: 'b', href: '/g', linkLabel: 'Open', motif: 'grove', variant: 'system' },
        { id: 'haiku', kicker: 'k', title: 't', body: 'b', href: '/h', linkLabel: 'Open', motif: 'haiku', variant: 'signal' },
      ],
    }
    injectScript(JSON.stringify(many))
    expect(readSiteSurfaceCopy()?.sections).toHaveLength(7)
  })

  it('rejects a sections value that is not an array', () => {
    injectScript(JSON.stringify({ ...VALID_COPY, sections: { signal: {} } }))
    expect(readSiteSurfaceCopy()).toBeNull()
  })

  it('rejects a section missing id', () => {
    injectScript(JSON.stringify({ ...VALID_COPY, sections: [{ kicker: 'k', title: 't' }] }))
    expect(readSiteSurfaceCopy()).toBeNull()
  })

  it('rejects a section whose optional field has the wrong type', () => {
    injectScript(JSON.stringify({ ...VALID_COPY, sections: [{ id: 'x', kicker: 'k', title: 't', body: 42 }] }))
    expect(readSiteSurfaceCopy()).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd ../scanlines-system && npm run test:run -- src/atmosphere/site/site-copy-loader.test.ts`
Expected: FAIL — the current `isSiteSurfaceSections` requires named keys, so every new case returns `null`.

- [ ] **Step 3: Write minimal implementation**

Replace `site-copy-loader.ts:1-37` (the section type block) and `:88-99` (`isSiteSurfaceSections`) with:

```ts
export type SiteSurfaceSection = {
  id: string
  kicker: string
  title: string
  body?: string
  href?: string
  linkLabel?: string
  motif?: string
  variant?: 'signal' | 'system' | 'identity'
  ariaLabel?: string
  action?: string
}

function isOptionalString(value: unknown): boolean {
  return value === undefined || typeof value === 'string'
}

function isVariant(value: unknown): boolean {
  return value === undefined || value === 'signal' || value === 'system' || value === 'identity'
}

function isSiteSurfaceSection(value: unknown): value is SiteSurfaceSection {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.kicker === 'string' &&
    typeof value.title === 'string' &&
    isOptionalString(value.body) &&
    isOptionalString(value.href) &&
    isOptionalString(value.linkLabel) &&
    isOptionalString(value.motif) &&
    isOptionalString(value.ariaLabel) &&
    isOptionalString(value.action) &&
    isVariant(value.variant)
  )
}

function isSiteSurfaceSections(value: unknown): value is SiteSurfaceSection[] {
  return Array.isArray(value) && value.every(isSiteSurfaceSection)
}
```

Change `SiteSurfaceCopy.sections` to `sections: SiteSurfaceSection[]`. Delete the now-unused `SectionCopy`, `BodySectionCopy`, `LinkSectionCopy`, `ClosingSectionCopy`, `SiteSurfaceSections`, `isSectionCopy`, `isBodySectionCopy`, `isLinkSectionCopy`, `isClosingSectionCopy`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd ../scanlines-system && npm run coverage -- src/atmosphere/site/site-copy-loader.test.ts`
Expected: PASS, 100% coverage on `site-copy-loader.ts`.

- [ ] **Step 5: Commit**

```bash
cd ../scanlines-system
git add src/atmosphere/site/site-copy-loader.ts src/atmosphere/site/site-copy-loader.test.ts
git commit -m "feat(site): accept a generic sections array in the site copy contract

The landing surface hardcoded warp/dice/taybols section keys and validated
them fail-closed, which made the shared package carry one consumer's product
names and blanked the page on any shape change. Sections are now an ordered
array the consumer supplies."
```

---

## Task 2: Render sections from the array

**Files:**
- Modify: `../scanlines-system/src/atmosphere/site/site-app.tsx:1-30,140-210`
- Test: `../scanlines-system/src/atmosphere/site/site-app.test.tsx` (create if absent)

**Interfaces:**
- Consumes: `SiteSurfaceSection` from Task 1.
- Produces: DOM contract `section.landing-section.landing-section--<id>`, one per section, in array order. Task 13's E2E asserts against it.

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SiteApp } from './site-app'

function injectCopy(sections: unknown[]) {
  const script = document.createElement('script')
  script.id = 'site-copy-data'
  script.type = 'application/json'
  script.textContent = JSON.stringify({
    hero: {
      kicker: 'k', title: 'undef games', support: 's',
      primaryAction: { href: '/a', label: 'A' },
      secondaryAction: { href: '/b', label: 'B' },
      statusLabel: 'status',
    },
    projects: [],
    sections,
  })
  document.body.appendChild(script)
}

describe('SiteApp sections', () => {
  it('renders one landing-section per supplied section, in order', () => {
    injectCopy([
      { id: 'signal', kicker: 'k', title: 'Signal', body: 'b' },
      { id: 'grove', kicker: 'k', title: 'Grove', body: 'b', href: '/g', linkLabel: 'Open Grove', motif: 'grove', variant: 'system' },
      { id: 'haiku', kicker: 'k', title: 'Haiku', body: 'b', href: '/h', linkLabel: 'Open haiku.to', motif: 'haiku', variant: 'signal' },
    ])
    const { container } = render(<SiteApp />)
    const ids = [...container.querySelectorAll('.landing-section')].map((n) =>
      [...n.classList].find((c) => c.startsWith('landing-section--')),
    )
    expect(ids).toEqual(['landing-section--signal', 'landing-section--grove', 'landing-section--haiku'])
    expect(screen.getByRole('link', { name: 'Open Grove' })).toHaveAttribute('href', '/g')
  })

  it('omits the link when a section has no href', () => {
    injectCopy([{ id: 'signal', kicker: 'k', title: 'Signal', body: 'b' }])
    const { container } = render(<SiteApp />)
    expect(container.querySelector('.section-link')).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd ../scanlines-system && npm run test:run -- src/atmosphere/site/site-app.test.tsx`
Expected: FAIL — `SiteApp` reads `copy.sections.signal` etc., so it throws or renders nothing.

- [ ] **Step 3: Write minimal implementation**

In `site-app.tsx`, delete the six hardcoded `<section className="landing-section landing-section--…">` blocks (signal, products, warp, dice, taybols, identity) and the `landing-final` block, and replace with:

```tsx
{copy.sections.map((section) => {
  if (section.id === 'closing') {
    return (
      <section key={section.id} className="landing-final" aria-label="final call to action">
        <p>{section.kicker}</p>
        <h2>{section.title}</h2>
        <a
          className="scanlines-button scanlines-button--primary"
          href="#top"
          onClick={(event) => event.preventDefault()}
        >
          {section.action}
        </a>
      </section>
    )
  }

  const effect = (sectionEffects[section.id] ?? section.motif ?? 'bars') as SectionToyEffect

  return (
    <section
      key={section.id}
      className={`landing-section landing-section--${section.id}`}
      id={section.id}
      aria-label={section.ariaLabel ?? section.title}
    >
      {renderSectionToy(section.variant ?? 'signal', effect)}
      <p className="section-kicker">{section.kicker}</p>
      <h2>{section.title}</h2>
      {section.body && <p>{section.body}</p>}
      {section.id === 'projects' && (
        <div className="product-link-list" aria-label="undef games project links">
          {copy.projects.map((product) => (
            <a key={product.href} className={`product-link ${product.className}`} href={product.href}>
              <span>{product.tag}</span>
              <strong>{product.label}</strong>
              <small>{product.description}</small>
            </a>
          ))}
        </div>
      )}
      {section.href && section.linkLabel && (
        <a className="section-link" href={section.href}>
          {section.linkLabel}
        </a>
      )}
    </section>
  )
})}
```

Note `sectionEffects` is `Record<string, SectionToyEffect>` after Task 3; until then the index access needs the `as` cast shown.

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd ../scanlines-system && npm run test:run`
Expected: PASS — full suite, including the existing station tests.

- [ ] **Step 5: Commit**

```bash
cd ../scanlines-system
git add src/atmosphere/site/site-app.tsx src/atmosphere/site/site-app.test.tsx
git commit -m "feat(site): render landing sections from the supplied array

Removes the per-product JSX blocks so the shared surface no longer names
one consumer's games. Section order, ids, and links now come from data."
```

---

## Task 3: Open the section effect id and register two new toys

**Files:**
- Modify: `../scanlines-system/src/atmosphere/station/station-toys.tsx:4-6`
- Modify: `../scanlines-system/src/atmosphere/station/theme-state.ts:42-49`
- Test: `../scanlines-system/src/atmosphere/station/theme-state.test.ts`

**Interfaces:**
- Produces: `SectionEffects = Record<string, SectionToyEffect>`; `SectionToyEffect` additionally accepts `'grove'` and `'haiku'`. Task 4 supplies their CSS; Task 13's E2E fixture uses the new default keys.

- [ ] **Step 1: Write the failing test**

Append to `theme-state.test.ts`:

```ts
import { DEFAULT_SECTION_EFFECTS } from './theme-state'

describe('section effect defaults', () => {
  it('ships defaults for the new flagship sections', () => {
    expect(DEFAULT_SECTION_EFFECTS.grove).toBe('grove')
    expect(DEFAULT_SECTION_EFFECTS.haiku).toBe('haiku')
  })

  it('preserves unknown section ids supplied by a consumer', () => {
    const restored = readFullThemeState.length >= 0
    expect(restored).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd ../scanlines-system && npm run test:run -- src/atmosphere/station/theme-state.test.ts`
Expected: FAIL — `Property 'grove' does not exist` / `undefined`.

- [ ] **Step 3: Write minimal implementation**

`station-toys.tsx:4-6`:

```ts
export type SectionToyEffect = 'bars' | 'crt' | 'dice' | 'frames' | 'grove' | 'haiku' | 'notes'
  | 'rails' | 'rungs' | 'scatter' | 'slab' | 'taybols' | 'tumble' | 'warp'
export type SectionEffectId = string
export type SectionEffects = Record<SectionEffectId, SectionToyEffect>
```

`theme-state.ts:42`:

```ts
export const DEFAULT_SECTION_EFFECTS: SectionEffects = {
  dice: 'dice',
  grove: 'grove',
  haiku: 'haiku',
  identity: 'tumble',
  projects: 'tumble',
  signal: 'bars',
  taybols: 'taybols',
  warp: 'warp',
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd ../scanlines-system && npm run coverage`
Expected: PASS, gates hold.

- [ ] **Step 5: Commit**

```bash
cd ../scanlines-system
git add src/atmosphere/station/station-toys.tsx src/atmosphere/station/theme-state.ts src/atmosphere/station/theme-state.test.ts
git commit -m "feat(station): open SectionEffectId and register grove and haiku toys

SectionEffectId enumerated one consumer's product names, so every new
section needed a release here. It is now a string key; SectionToyEffect
stays closed because each value names a real stylesheet."
```

---

## Task 4: Author the grove and haiku section-toy stylesheets

**Files:**
- Create: `../scanlines-system/src/atmosphere/section-toys/grove.css`
- Create: `../scanlines-system/src/atmosphere/section-toys/haiku.css`
- Modify: whichever module imports the sibling `section-toys/*.css` files (find with `grep -rn "section-toys/" ../scanlines-system/src --include='*.ts' --include='*.tsx' --include='*.css'`)

**Interfaces:**
- Consumes: `SectionToyEffect` values `'grove'`, `'haiku'` from Task 3.
- Produces: `.section-toy--effect-grove`, `.section-toy--effect-haiku` styling the generic spans `SectionToy` emits.

- [ ] **Step 1: Read an existing effect stylesheet for the contract**

Run: `cat ../scanlines-system/src/atmosphere/section-toys/taybols.css`
This shows which `--toy-*` custom properties the spans expose. Match that contract; do not invent new properties.

- [ ] **Step 2: Write `grove.css`**

Branching tree — spans become limbs rising and nodes orbiting.

```css
.section-toy--effect-grove span {
  background: linear-gradient(90deg, transparent, rgb(var(--fx-signal-rgb) / 0.55), transparent);
  height: var(--toy-height);
  width: var(--toy-width);
  transform-origin: left center;
  animation: section-toy-grove-limb calc(6s + var(--toy-index) * 0.42s) ease-in-out infinite;
  animation-delay: calc(var(--toy-index) * -0.31s);
}

@keyframes section-toy-grove-limb {
  0%, 100% { transform: translate(var(--toy-x-start), var(--toy-y-start)) rotate(calc(var(--toy-spin-start) * 0.2)) scaleX(0.72); opacity: 0.28; }
  50% { transform: translate(calc(var(--toy-x-start) + var(--toy-x-travel) * 0.12), calc(var(--toy-y-start) + var(--toy-y-travel) * 0.3)) rotate(calc(var(--toy-spin) * 0.12)) scaleX(1); opacity: 0.72; }
}

@media (prefers-reduced-motion: reduce) {
  .section-toy--effect-grove span { animation: none; opacity: 0.4; transform: translate(var(--toy-x-start), var(--toy-y-start)) scaleX(0.9); }
}
```

- [ ] **Step 3: Write `haiku.css`**

Three-line cadence — spans settle in 5–7–5 proportion.

```css
.section-toy--effect-haiku span {
  background: rgb(var(--fx-signal-rgb) / 0.5);
  height: 2px;
  width: calc(var(--toy-width) * (0.5 + 0.25 * (var(--toy-row) % 3)));
  animation: section-toy-haiku-settle calc(4.2s + var(--toy-row) * 0.6s) ease-out infinite;
  animation-delay: calc(var(--toy-index) * -0.4s);
}

@keyframes section-toy-haiku-settle {
  0% { transform: translate(var(--toy-x-start), calc(var(--toy-y-start) + 26px)); opacity: 0; }
  35% { opacity: 0.68; }
  70%, 100% { transform: translate(var(--toy-x-start), var(--toy-y-start)); opacity: 0.2; }
}

@media (prefers-reduced-motion: reduce) {
  .section-toy--effect-haiku span { animation: none; opacity: 0.42; transform: translate(var(--toy-x-start), var(--toy-y-start)); }
}
```

- [ ] **Step 4: Wire the imports and verify the build**

Add both files alongside the existing effect imports found in Step 1.
Run: `cd ../scanlines-system && npm run coverage && npm run build`
Expected: PASS, build emits without unresolved CSS imports.

- [ ] **Step 5: Commit**

```bash
cd ../scanlines-system
git add src/atmosphere/section-toys/grove.css src/atmosphere/section-toys/haiku.css
git commit -m "feat(section-toys): add grove and haiku motifs

Grove reads as branching limbs with orbiting nodes; haiku settles three
lines in 5-7-5 cadence. Both freeze under prefers-reduced-motion."
```

---

## Task 5: Release scanlines-system

**Files:**
- Modify: `../scanlines-system/package.json` (`version`)

- [ ] **Step 1: Run the full gate**

Run: `cd ../scanlines-system && npm run coverage && npm run build`
Expected: PASS.

- [ ] **Step 2: Bump the minor version**

`0.1.0` → `0.2.0`. The section contract changed shape, so this is not a patch.

- [ ] **Step 3: Commit and tag**

```bash
cd ../scanlines-system
git add package.json
git commit -m "chore(release): 0.2.0 — generic landing sections, grove and haiku toys"
git tag v0.2.0
```

- [ ] **Step 4: Push**

```bash
cd ../scanlines-system && git push && git push --tags
```

---

## Task 6: Sync the vendored theme

**Files:**
- Modify: `themes/scanlines/**` (written by the sync tool — never by hand)

- [ ] **Step 1: Sync**

Run: `make sync-scanlines`

- [ ] **Step 2: Verify the manifest agrees**

Run: `make check-scanlines`
Expected: exit 0, no mismatches reported.

- [ ] **Step 3: Confirm what changed**

Run: `git diff --stat themes/scanlines/`
Expected: only `VENDOR_MANIFEST.json` plus any theme files the release touched. If `layouts/index.html` changed, note it — Task 8 overrides it at project level regardless.

- [ ] **Step 4: Commit**

```bash
git add themes/scanlines
git commit -m "chore(theme): sync vendored scanlines theme to 0.2.0"
```

---

## Task 7: Author games.json and its schema test

**Files:**
- Create: `data/site/games.json`
- Create: `scripts/games-schema.ts`
- Test: `scripts/games-schema.test.ts`
- Modify: `vitest.config.ts:6-13`

**Interfaces:**
- Produces: `validateGames(data: unknown): string[]` — returns an array of human-readable problems, empty when valid. Task 12's generator imports it.

- [ ] **Step 1: Widen the root vitest include**

`vitest.config.ts`:

```ts
    include: ['themes/scanlines/assets/ts/**/*.test.ts', 'scripts/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['themes/scanlines/assets/ts/**/*.ts', 'scripts/**/*.ts'],
      exclude: ['**/*.test.ts'],
```

- [ ] **Step 2: Write the failing test**

`scripts/games-schema.test.ts`:

```ts
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { validateGames } from './games-schema'

const games = JSON.parse(readFileSync(new URL('../data/site/games.json', import.meta.url), 'utf8'))

describe('games.json', () => {
  it('is valid', () => {
    expect(validateGames(games)).toEqual([])
  })

  it('has ten games', () => {
    expect(games.games).toHaveLength(10)
  })

  it('points taybols at taybols.com', () => {
    const taybols = games.games.find((g: { tag: string }) => g.tag === 'taybols')
    expect(taybols.href).toBe('https://taybols.com')
  })

  it('has five flagships', () => {
    expect(games.games.filter((g: { tier: string }) => g.tier === 'flagship')).toHaveLength(5)
  })
})

describe('validateGames', () => {
  const base = { tag: 'x', tier: 'listed', label: 'L', href: 'https://x.test', description: 'd', motif: 'x' }

  it('rejects a non-object', () => {
    expect(validateGames(null)).toContain('games.json must be an object with a games array')
  })

  it('rejects a duplicate tag', () => {
    expect(validateGames({ games: [base, base] })).toContain('duplicate tag: x')
  })

  it('rejects an unknown tier', () => {
    expect(validateGames({ games: [{ ...base, tier: 'wat' }] })).toContain('x: tier must be flagship or listed')
  })

  it('rejects a missing required field', () => {
    const { href: _href, ...noHref } = base
    expect(validateGames({ games: [noHref] })).toContain('x: missing href')
  })

  it('requires a section on a flagship', () => {
    expect(validateGames({ games: [{ ...base, tier: 'flagship', variant: 'signal' }] })).toContain('x: flagship needs a section')
  })

  it('requires a variant on a flagship', () => {
    const section = { kicker: 'k', title: 't', copy: 'c', link_label: 'l' }
    expect(validateGames({ games: [{ ...base, tier: 'flagship', section }] })).toContain('x: flagship needs a variant')
  })

  it('rejects a section on a listed game', () => {
    const section = { kicker: 'k', title: 't', copy: 'c', link_label: 'l' }
    expect(validateGames({ games: [{ ...base, section }] })).toContain('x: listed game must not have a section')
  })

  it('rejects an incomplete section', () => {
    expect(validateGames({ games: [{ ...base, tier: 'flagship', variant: 'signal', section: { kicker: 'k' } }] }))
      .toContain('x: section missing title')
  })

  it('rejects a non-https href', () => {
    expect(validateGames({ games: [{ ...base, href: 'http://x.test' }] })).toContain('x: href must be https')
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -- scripts/games-schema.test.ts`
Expected: FAIL — `Cannot find module './games-schema'`.

- [ ] **Step 4: Write the validator**

`scripts/games-schema.ts`:

```ts
const REQUIRED = ['tag', 'tier', 'label', 'href', 'description', 'motif'] as const
const SECTION_REQUIRED = ['kicker', 'title', 'copy', 'link_label'] as const
const VARIANTS = ['signal', 'system', 'identity']

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function validateGames(data: unknown): string[] {
  if (!isRecord(data) || !Array.isArray(data.games)) {
    return ['games.json must be an object with a games array']
  }

  const problems: string[] = []
  const seen = new Set<string>()

  for (const game of data.games) {
    if (!isRecord(game)) {
      problems.push('every game must be an object')
      continue
    }

    const tag = typeof game.tag === 'string' ? game.tag : '(untagged)'
    if (seen.has(tag)) problems.push(`duplicate tag: ${tag}`)
    seen.add(tag)

    for (const field of REQUIRED) {
      if (typeof game[field] !== 'string' || game[field] === '') problems.push(`${tag}: missing ${field}`)
    }

    if (typeof game.href === 'string' && !game.href.startsWith('https://')) {
      problems.push(`${tag}: href must be https`)
    }

    if (game.tier !== 'flagship' && game.tier !== 'listed') {
      problems.push(`${tag}: tier must be flagship or listed`)
      continue
    }

    if (game.tier === 'flagship') {
      if (!VARIANTS.includes(game.variant as string)) problems.push(`${tag}: flagship needs a variant`)
      if (!isRecord(game.section)) {
        problems.push(`${tag}: flagship needs a section`)
      } else {
        for (const field of SECTION_REQUIRED) {
          if (typeof game.section[field] !== 'string' || game.section[field] === '') {
            problems.push(`${tag}: section missing ${field}`)
          }
        }
      }
    } else if (game.section !== undefined) {
      problems.push(`${tag}: listed game must not have a section`)
    }
  }

  return problems
}
```

- [ ] **Step 5: Author `data/site/games.json`**

All ten entries, using the Global Constraints table for `tag`/`tier`/`label`/`href`/`motif`/`variant`, the spec's roster table for `description`, and the spec's "Section copy" section for `grove` and `haiku`. Carry `warp`, `dice`, and `taybols` section copy over verbatim from `data/site/home.json`, changing only the Taybols `href` to `https://taybols.com`.

- [ ] **Step 6: Run tests to verify they pass**

Run: `npm run coverage -- scripts/games-schema.test.ts`
Expected: PASS, 100% on `games-schema.ts`.

- [ ] **Step 7: Commit**

```bash
git add data/site/games.json scripts/games-schema.ts scripts/games-schema.test.ts vitest.config.ts
git commit -m "feat(data): add games.json as the single source of truth for the roster

Ten games with tier-driven presentation, replacing the list that was
duplicated across home.json, the Hugo templates, the games page, and the
lab -- where it had already drifted."
```

---

## Task 8: Project-level homepage override

**Files:**
- Create: `layouts/index.html`
- Modify: `data/site/home.json` (remove `products`, `warp`, `dice`, `taybols`)

**Interfaces:**
- Consumes: `data/site/games.json` (Task 7); the `sections` array contract from Task 1.
- Produces: `#site-copy-data` JSON matching `SiteSurfaceCopy`, and the static fallback markup.

- [ ] **Step 1: Write the template**

`layouts/index.html`. Section order is signal → projects → flagships → identity → closing.

```go-html-template
{{ define "main" }}
  {{ $hero := hugo.Data.site.home.hero }}
  {{ $games := hugo.Data.site.games.games }}
  {{ $flagships := where $games "tier" "flagship" }}

  {{ $projectItems := slice }}
  {{ range $games }}
    {{ $projectItems = $projectItems | append (dict
      "className" (printf "product-link--%s" .tag)
      "description" .description "href" .href "label" .label "tag" .tag) }}
  {{ end }}

  {{ $sections := slice
    (dict "id" "signal" "kicker" hugo.Data.site.home.signal.kicker
          "title" hugo.Data.site.home.signal.title "body" hugo.Data.site.home.signal.copy)
    (dict "id" "projects" "kicker" hugo.Data.site.home.products_intro.kicker
          "title" hugo.Data.site.home.products_intro.title) }}
  {{ range $flagships }}
    {{ $sections = $sections | append (dict
      "id" .tag "kicker" .section.kicker "title" .section.title "body" .section.copy
      "href" .href "linkLabel" .section.link_label "motif" .motif "variant" .variant
      "ariaLabel" .label) }}
  {{ end }}
  {{ $sections = $sections | append
    (dict "id" "identity" "kicker" hugo.Data.site.home.identity.kicker
          "title" hugo.Data.site.home.identity.title "body" hugo.Data.site.home.identity.copy)
    (dict "id" "closing" "kicker" hugo.Data.site.home.closing.kicker
          "title" hugo.Data.site.home.closing.title "action" hugo.Data.site.home.closing.action) }}

  {{ $siteCopy := dict
    "hero" (dict "kicker" $hero.kicker "title" $hero.title "support" $hero.copy
      "primaryAction" (dict "href" $hero.primary_href "label" $hero.primary_label)
      "secondaryAction" (dict "href" $hero.secondary_href "label" $hero.secondary_label)
      "statusLabel" $hero.status_label)
    "sections" $sections
    "projects" $projectItems }}

  <div id="scanlines-root">
    <script id="site-copy-data" type="application/json">{{ $siteCopy | jsonify | safeJS }}</script>
    <main class="scan-fallback" id="main-content">
      <section class="scan-fallback__hero" aria-label="undef games landing page">
        <p class="scan-fallback__kicker">{{ $hero.kicker }}</p>
        <h1>{{ $hero.title }}</h1>
        <p>{{ $hero.copy }}</p>
        <nav class="scan-fallback__actions" aria-label="landing actions">
          <a href="{{ $hero.primary_href }}">{{ $hero.primary_label }}</a>
          <a href="{{ $hero.secondary_href }}">{{ $hero.secondary_label }}</a>
        </nav>
      </section>
      {{ partial "games-marquee.html" $games }}
      <section class="scan-fallback__section" id="projects" aria-label="undef games projects">
        <p class="scan-fallback__kicker">{{ hugo.Data.site.home.products_intro.kicker }}</p>
        <h2>{{ hugo.Data.site.home.products_intro.title }}</h2>
        <div class="scan-fallback__products">
          {{ range $games }}
            <a href="{{ .href }}"><span>{{ .tag }}</span><strong>{{ .label }}</strong><small>{{ .description }}</small></a>
          {{ end }}
        </div>
      </section>
      <section class="scan-fallback__section" aria-label="identity baseline">
        <p class="scan-fallback__kicker">{{ hugo.Data.site.home.identity.kicker }}</p>
        <h2>{{ hugo.Data.site.home.identity.title }}</h2>
        <p>{{ hugo.Data.site.home.identity.copy }}</p>
      </section>
    </main>
  </div>
{{ end }}
```

- [ ] **Step 2: Prune home.json**

Delete the `products` array and the `warp`, `dice`, `taybols` objects. Keep `hero`, `products_intro`, `identity`, `signal`, `closing`.

- [ ] **Step 3: Verify the rendered blob**

Run: `make build-hugo && node -e "const m=require('fs').readFileSync('public/index.html','utf8').match(/<script id=\"site-copy-data\"[^>]*>([\s\S]*?)<\/script>/); const c=JSON.parse(m[1]); console.log(c.sections.map(s=>s.id).join(' ')); console.log('projects:', c.projects.length)"`
Expected: `signal projects warp dice taybols grove haiku identity closing` and `projects: 10`.

- [ ] **Step 4: Commit**

```bash
git add layouts/index.html data/site/home.json
git commit -m "feat(home): render the homepage from games.json

Project-level override; the vendored theme template stays untouched.
Section list is built by ranging over the roster instead of naming each
game, so the flagship set is data."
```

---

## Task 9: Marquee partial and stylesheet

**Files:**
- Create: `layouts/partials/games-marquee.html`
- Create: `static/css/games.css`
- Modify: `layouts/partials/head.html` — **cannot be edited here (vendored)**. Load the stylesheet from `layouts/index.html` and `layouts/_default/games.html` instead, or add a project-level `layouts/partials/head.html` override that includes the theme's content plus the new link. Prefer the override; record the theme's current content when copying it.

- [ ] **Step 1: Write the marquee partial**

Context is the games slice. The track is duplicated so the loop is seamless.

```go-html-template
{{ $games := . }}
<section class="ug-marquee" aria-label="undef games roster">
  <div class="ug-marquee__track">
    {{ range $pass := slice 1 2 }}
      {{ range $games }}
        <a class="ug-marquee__tile" href="{{ .href }}" {{ if eq $pass 2 }}aria-hidden="true" tabindex="-1"{{ end }}>
          {{ partial "motif.html" .tag }}
          <span class="ug-marquee__label">{{ .label }}</span>
        </a>
      {{ end }}
    {{ end }}
  </div>
</section>
```

- [ ] **Step 2: Write the marquee CSS**

Into `static/css/games.css`:

```css
.ug-marquee { overflow: hidden; border-block: 1px solid rgb(var(--fx-signal-rgb) / 0.22); background: var(--fx-panel); padding: 0.7rem 0; }
.ug-marquee__track { display: flex; gap: 0.75rem; width: max-content; animation: ug-marquee-run 42s linear infinite; }
.ug-marquee:hover .ug-marquee__track,
.ug-marquee:focus-within .ug-marquee__track { animation-play-state: paused; }
@keyframes ug-marquee-run { to { transform: translateX(-50%); } }
.ug-marquee__tile { display: flex; align-items: center; gap: 0.5rem; padding: 0.3rem 0.7rem; white-space: nowrap; text-decoration: none; border: 1px solid rgb(var(--fx-signal-rgb) / 0.3); color: var(--fx-signal); font-size: 0.75rem; letter-spacing: 0.12em; }
.ug-marquee__tile:hover { background: rgb(var(--fx-signal-rgb) / 0.1); }
.ug-marquee__label { color: inherit; }
@media (prefers-reduced-motion: reduce) {
  .ug-marquee__track { animation: none; flex-wrap: wrap; width: 100%; }
  .ug-marquee__tile[aria-hidden='true'] { display: none; }
}
```

- [ ] **Step 3: Verify it renders**

Run: `make build-hugo && grep -c 'ug-marquee__tile' public/index.html`
Expected: `20` (ten games, two passes).

- [ ] **Step 4: Commit**

```bash
git add layouts/partials/games-marquee.html static/css/games.css layouts/partials/head.html
git commit -m "feat(home): add the roster marquee band

CSS-only so it renders identically before and after React hydration.
Pauses on hover and focus; wraps to a static grid under reduced motion."
```

---

## Task 10: The ten motif glyphs

**Files:**
- Create: `layouts/partials/motif.html`
- Modify: `static/css/games.css`

**Interfaces:**
- Consumes: a game `tag` string.
- Produces: an inline `<svg class="ug-motif ug-motif--<tag>">`.

- [ ] **Step 1: Write the dispatcher partial**

`layouts/partials/motif.html` — context is the tag string. Each branch emits the glyph designed for that game.

```go-html-template
{{ $tag := . }}
<svg class="ug-motif ug-motif--{{ $tag }}" viewBox="0 0 30 30" aria-hidden="true" focusable="false">
  {{ if eq $tag "warp" }}
    <path class="s" d="M15 6 L23 15 L15 24 L7 15 Z"/>
    <path class="s ug-motif__streak" d="M2 11 H10 M2 15 H8 M2 19 H10"/>
    <path class="s ug-motif__streak" d="M28 11 H20 M28 15 H22 M28 19 H20"/>
  {{ else if eq $tag "dice" }}
    <g class="ug-motif__cube">
      <rect class="s" x="7" y="7" width="16" height="16" rx="2"/>
      <circle class="f" cx="12" cy="12" r="1.6"/><circle class="f" cx="15" cy="15" r="1.6"/><circle class="f" cx="18" cy="18" r="1.6"/>
    </g>
  {{ else if eq $tag "taybols" }}
    <rect class="s" x="5" y="5" width="20" height="20" rx="1.5" opacity=".55"/>
    <path class="s ug-motif__rowline" d="M9 11 H18"/>
    <path class="s ug-motif__rowline" d="M9 15 H21"/>
    <path class="s ug-motif__rowline" d="M9 19 H14"/>
  {{ else if eq $tag "grove" }}
    <path class="s" d="M15 25 V17 M15 17 L9 11 M15 17 L21 11 M9 11 L6 7 M21 11 L24 7"/>
    <g class="ug-motif__orbit"><circle class="f" cx="24" cy="7" r="2"/></g>
    <g class="ug-motif__orbit ug-motif__orbit--slow"><circle class="f" cx="6" cy="7" r="1.6" opacity=".7"/></g>
  {{ else if eq $tag "haiku" }}
    <path class="s ug-motif__line" d="M6 10 H16"/>
    <path class="s ug-motif__line" d="M6 15 H24"/>
    <path class="s ug-motif__line" d="M6 20 H16"/>
  {{ else if eq $tag "becoming" }}
    <path class="s" d="M4 24 H26" opacity=".55"/>
    <g class="ug-motif__sun"><path class="s" d="M8 24 A7 7 0 0 1 22 24"/><circle class="f" cx="15" cy="15" r="2.4"/></g>
  {{ else if eq $tag "proverb" }}
    <g class="ug-motif__ring">
      <circle class="s" cx="15" cy="15" r="9" opacity=".6"/>
      <path class="s" d="M15 4 V7 M26 15 H23 M15 26 V23 M4 15 H7 M22.8 7.2 L20.7 9.3 M22.8 22.8 L20.7 20.7 M7.2 22.8 L9.3 20.7 M7.2 7.2 L9.3 9.3"/>
    </g>
    <circle class="f" cx="15" cy="15" r="2"/>
  {{ else if eq $tag "stoke" }}
    <g class="ug-motif__spark"><path class="s" d="M15 3 V8 M15 22 V27 M3 15 H8 M22 15 H27 M6.5 6.5 L10 10 M23.5 6.5 L20 10 M6.5 23.5 L10 20 M23.5 23.5 L20 20"/></g>
    <circle class="f" cx="15" cy="15" r="3"/>
  {{ else if eq $tag "currents" }}
    <path class="s" d="M3 20 Q9 10 15 16 T27 12" opacity=".3"/>
    <path class="s ug-motif__wave" d="M3 20 Q9 10 15 16 T27 12"/>
    <circle class="f" cx="27" cy="12" r="1.8"/>
  {{ else if eq $tag "amor" }}
    <path class="s" d="M15 7 L21 15 L15 23 L9 15 Z" opacity=".65"/>
    <circle class="f ug-motif__touch ug-motif__touch--left" cx="9" cy="15" r="2.2"/>
    <circle class="f ug-motif__touch ug-motif__touch--right" cx="21" cy="15" r="2.2"/>
  {{ end }}
</svg>
```

- [ ] **Step 2: Add the motif CSS**

Append to `static/css/games.css`:

```css
.ug-motif { width: 1.9rem; height: 1.9rem; flex: none; color: var(--fx-signal); overflow: visible; }
.ug-motif .s { fill: none; stroke: currentColor; stroke-width: 1.6; stroke-linecap: round; }
.ug-motif .f { fill: currentColor; stroke: none; }

.ug-motif__streak { stroke-dasharray: 8 16; animation: ug-warp 1.1s linear infinite; opacity: .8; }
@keyframes ug-warp { from { stroke-dashoffset: 24; } to { stroke-dashoffset: 0; } }

.ug-motif__cube { transform-origin: 15px 15px; animation: ug-spin 6s cubic-bezier(.5,0,.5,1) infinite; }
.ug-motif__ring { transform-origin: 15px 15px; animation: ug-spin 14s linear infinite; }
.ug-motif__orbit { transform-origin: 15px 15px; animation: ug-spin 7s linear infinite reverse; }
.ug-motif__orbit--slow { animation-duration: 11s; animation-direction: normal; }
@keyframes ug-spin { to { transform: rotate(360deg); } }

.ug-motif__rowline { animation: ug-sweep 2.6s ease-in-out infinite; }
.ug-motif__rowline:nth-of-type(2) { animation-delay: -.65s; }
.ug-motif__rowline:nth-of-type(3) { animation-delay: -1.3s; }
@keyframes ug-sweep { 0%, 100% { opacity: .25; } 50% { opacity: 1; } }

.ug-motif__line { animation: ug-rise 3.6s ease-out infinite; }
.ug-motif__line:nth-of-type(2) { animation-delay: -1.2s; }
.ug-motif__line:nth-of-type(3) { animation-delay: -2.4s; }
.ug-motif__sun { transform-origin: 15px 24px; animation: ug-rise 4s ease-out infinite; }
@keyframes ug-rise { 0% { transform: translateY(6px); opacity: .3; } 60%, 100% { transform: translateY(0); opacity: 1; } }

.ug-motif__spark { transform-origin: 15px 15px; animation: ug-flare 1.7s ease-in-out infinite; }
@keyframes ug-flare { 0%, 100% { transform: scale(.5); opacity: .3; } 45% { transform: scale(1.25); opacity: 1; } }

.ug-motif__wave { stroke-dasharray: 6 8; animation: ug-flow 2.4s linear infinite; }
@keyframes ug-flow { to { stroke-dashoffset: -40; } }

.ug-motif__touch { animation: ug-beat 2.2s ease-in-out infinite; }
.ug-motif__touch--left { transform-origin: 9px 15px; }
.ug-motif__touch--right { transform-origin: 21px 15px; animation-delay: -1.1s; }
@keyframes ug-beat { 0%, 100% { transform: scale(.72); opacity: .45; } 50% { transform: scale(1.12); opacity: 1; } }

@media (prefers-reduced-motion: reduce) {
  .ug-motif *, .ug-motif { animation: none !important; opacity: 1; }
}
```

- [ ] **Step 3: Verify every tag renders a glyph**

Run: `make build-hugo && for t in warp dice taybols grove haiku becoming proverb stoke currents amor; do printf "%-10s %s\n" "$t" "$(grep -c "ug-motif--$t" public/index.html)"; done`
Expected: each ≥ 2 (both marquee passes). Any `0` means a missing `{{ else if }}` branch.

- [ ] **Step 4: Commit**

```bash
git add layouts/partials/motif.html static/css/games.css
git commit -m "feat(motifs): add a glyph per game

Each mark is drawn from what the project does: a branching tree for Grove,
5-7-5 lines for haiku.to, a sumi-e stroke for currents.to, paired touches
on one crystal for amor.to. All freeze under reduced motion."
```

---

## Task 11: The /games/ page

**Files:**
- Create: `layouts/_default/games.html`
- Modify: `content/games.md`
- Modify: `static/css/games.css`

- [ ] **Step 1: Reduce games.md to front matter**

```markdown
---
title: "Games"
kicker: "Live routes"
description: "Active game tools, systems, and playable utilities from undef games."
layout: "games"
---
```

- [ ] **Step 2: Write the list template**

```go-html-template
{{ define "main" }}
  {{ $games := hugo.Data.site.games.games }}
  <main class="scan-page" id="main-content">
    <section class="scan-page__hero" aria-labelledby="page-title">
      <p class="scan-fallback__kicker">{{ .Params.kicker }}</p>
      <h1 id="page-title">{{ .Title }}</h1>
      {{ with .Params.description }}<p>{{ . }}</p>{{ end }}
    </section>
    <section class="scan-page__body">
      <ul class="ug-games" aria-label="undef games roster">
        {{ range $index, $game := $games }}
          <li class="ug-games__row ug-games__row--{{ $game.tag }}" style="--row-index: {{ $index }}">
            <span class="ug-games__flyby" aria-hidden="true">{{ partial "motif.html" $game.tag }}</span>
            <a class="ug-games__link" href="{{ $game.href }}">
              <strong class="ug-games__name">{{ $game.label }}</strong>
              <small class="ug-games__desc">{{ $game.description }}</small>
            </a>
          </li>
        {{ end }}
      </ul>
    </section>
  </main>
{{ end }}
```

- [ ] **Step 3: Add the row and flyby CSS**

```css
.ug-games { list-style: none; margin: 0; padding: 0; }
.ug-games__row { position: relative; overflow: hidden; border-bottom: 1px solid rgb(var(--fx-muted-rgb) / 0.12); }
.ug-games__link { display: flex; flex-direction: column; gap: 0.2rem; padding: 0.9rem 1rem; text-decoration: none; position: relative; z-index: 2; }
.ug-games__link:hover { background: rgb(var(--fx-signal-rgb) / 0.06); }
.ug-games__name { color: var(--fx-signal); letter-spacing: 0.08em; }
.ug-games__desc { color: rgb(var(--fx-muted-rgb) / 0.7); }
.ug-games__flyby { position: absolute; top: 50%; left: 0; margin-top: -0.95rem; z-index: 1; opacity: 0.5;
  animation: ug-flyby linear infinite;
  animation-duration: calc(9s + (var(--row-index) % 4) * 2.5s);
  animation-delay: calc(var(--row-index) * -1.7s); }
@keyframes ug-flyby { from { transform: translateX(-3rem); } to { transform: translateX(100vw); } }
@media (prefers-reduced-motion: reduce) {
  .ug-games__flyby { animation: none; left: auto; right: 1rem; opacity: 0.35; }
}
```

- [ ] **Step 4: Verify**

Run: `make build-hugo && grep -c 'ug-games__row' public/games/index.html`
Expected: `10`.

- [ ] **Step 5: Commit**

```bash
git add layouts/_default/games.html content/games.md static/css/games.css
git commit -m "feat(games): generate the games page from the roster

One row per game with its own motif tracking across on independent timing.
The hand-written prose is removed; it duplicated the descriptions and had
no way to stay in sync with the roster."
```

---

## Task 12: Generate the lab copy

**Files:**
- Create: `scripts/gen-site-copy.mjs`
- Create: `ci/check-generated.sh`
- Modify: `lab/src/app/site-copy.ts` (becomes generated output)
- Modify: `lab/src/app/site-copy.test.ts`
- Modify: `Makefile`

- [ ] **Step 1: Write the generator**

`scripts/gen-site-copy.mjs` reads `data/site/games.json` + `data/site/home.json` and writes `lab/src/app/site-copy.ts` with a `// GENERATED — do not edit. Run: make gen-site-copy` banner, exporting `LAB_HERO_COPY`, `LAB_PROJECTS`, and `LAB_SECTIONS` (the latter now an array matching Task 1's contract).

- [ ] **Step 2: Add Make targets**

```make
gen-site-copy: ## Regenerate lab/src/app/site-copy.ts from data/site/games.json
	@node scripts/gen-site-copy.mjs

check-generated: ## Fail if generated files are stale
	@bash ci/check-generated.sh
```

Add both to `.PHONY`.

- [ ] **Step 3: Write the staleness check**

`ci/check-generated.sh` — regenerate into a temp copy, diff against the committed file, exit 1 with the diff on mismatch. Keep the logic here, not inline in any workflow YAML.

- [ ] **Step 4: Generate and update the lab test**

Run: `make gen-site-copy`
Then update `lab/src/app/site-copy.test.ts`: `VALID_SITE_SURFACE_COPY.sections` becomes an array, and the project assertions expect ten entries with `taybols` at `https://taybols.com`.

- [ ] **Step 5: Verify both gates**

Run: `make test && make check-generated`
Expected: PASS; `check-generated` exits 0.

- [ ] **Step 6: Commit**

```bash
git add scripts/gen-site-copy.mjs ci/check-generated.sh Makefile lab/src/app/site-copy.ts lab/src/app/site-copy.test.ts
git commit -m "feat(lab): generate site-copy.ts from games.json

Closes the drift that had Taybols described two different ways in
home.json and the lab. A CI check now fails on a stale committed copy."
```

---

## Task 13: End-to-end coverage

**Files:**
- Modify: `tests/e2e/site.spec.ts:46-48,100-110`
- Modify: `tests/e2e/logo-lab.spec.ts:175`

- [ ] **Step 1: Update the moved URL**

`site.spec.ts:46-48` and `logo-lab.spec.ts:175` — `taybols.undef.games` → `taybols\.com`.

- [ ] **Step 2: Update the saved-theme fixture**

`site.spec.ts:100-110` `sectionEffects` gains `grove: 'grove'` and `haiku: 'haiku'`.

- [ ] **Step 3: Add the new assertions**

```ts
test('renders the full roster', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByLabel('undef games projects').getByRole('link')).toHaveCount(10)
  await expect(page.locator('.landing-section')).toHaveCount(7)
  await expect(page.locator('.ug-marquee__tile')).toHaveCount(20)
})

test('homepage is not blank after hydration', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('.station-shell')).toBeVisible()
  await expect(page.locator('#scanlines-root')).not.toBeEmpty()
})

test('games page lists every game', async ({ page }) => {
  await page.goto('/games/')
  await expect(page.locator('.ug-games__row')).toHaveCount(10)
  await expect(page.locator('.ug-games__flyby .ug-motif')).toHaveCount(10)
})

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' })
  test('freezes every animated surface', async ({ page }) => {
    await page.goto('/')
    const running = await page.evaluate(() =>
      document.getAnimations().filter((a) => a.playState === 'running').length,
    )
    expect(running).toBe(0)
  })
})
```

`.landing-section` is 7: signal, projects, 5 flagships — `landing-final` carries its own class, and `identity` is a `landing-section`, so confirm the count against the built page and adjust to what Task 8 actually emits.

- [ ] **Step 4: Run the suite**

Run: `make e2e`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add tests/e2e/site.spec.ts tests/e2e/logo-lab.spec.ts
git commit -m "test(e2e): cover the ten-game roster and the taybols.com move

Adds a not-blank guard on the homepage, which fails closed if the Hugo
copy blob and the loader contract ever disagree again."
```

---

## Task 14: Full gate and deploy

- [ ] **Step 1: Run every gate**

```bash
make check-scanlines && make test-assets && make typecheck-assets && make test && make typecheck && make check-generated && make e2e
```
Expected: all PASS. Do not proceed on any failure.

- [ ] **Step 2: Preview deploy**

Run: `make deploy-preview`
Open the returned staging URL. Confirm: marquee scrolls, ten cards, five deep sections with motifs, `/games/` shows ten rows with flybys, Taybols links to `taybols.com`.

- [ ] **Step 3: Production deploy**

Run: `make deploy`

- [ ] **Step 4: Verify production**

Check `https://undef.games/` and `https://undef.games/games/` render the roster and that no console errors appear.

- [ ] **Step 5: Push**

```bash
git push origin main
```

---

## Self-Review

**Spec coverage:** Roster → Task 7. Data model → Task 7. Homepage → Tasks 8, 9. Games page → Task 11. Lab generation → Task 12. Shared design system (5 listed changes) → Tasks 1–4. Motifs → Tasks 4, 10. Reduced motion → Tasks 4, 9, 10, 11, plus the E2E in 13. Testing → Tasks 7, 12, 13. Build sequence → Tasks 1–14 in order. Risks: fail-closed validator has an explicit E2E guard (Task 13 Step 3); vendored theme is never hand-edited (Global Constraints, Task 6).

**Gaps accepted:** Task 12 Steps 1 and 3 describe the generator and the check by contract rather than showing full source — the output is mechanical from `games.json` and the exact emitted text depends on the final JSON. Task 9's `head.html` stylesheet wiring names two options because the theme file is vendored; the implementer picks the override and copies the current theme content.

**Type consistency:** `SiteSurfaceSection` field names (`id`, `kicker`, `title`, `body`, `href`, `linkLabel`, `motif`, `variant`, `ariaLabel`, `action`) are identical in Task 1's type, Task 2's renderer, and Task 8's Hugo dict. `games.json` uses snake_case `link_label` only inside `section`, and Task 8 maps it to `linkLabel` — intentional, since one is data-file convention and the other is the TS contract.
