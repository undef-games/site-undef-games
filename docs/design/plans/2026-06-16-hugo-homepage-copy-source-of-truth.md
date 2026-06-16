# Hugo Homepage Copy Source of Truth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Hugo the only source of production homepage copy and have the shared site runtime consume Hugo-serialized JSON instead of duplicating homepage messaging in TypeScript.

**Architecture:** Move the production homepage message model into Hugo-rendered data, serialize it into the homepage HTML, and add a small runtime loader that hydrates the `site` surface from that payload. Keep lab-local defaults for `/lab/`, and make runtime failure modes preserve server-rendered Hugo content instead of falling back to stale production copy.

**Tech Stack:** Hugo templates/content, TypeScript/React, Vitest, Playwright, Cloudflare Pages build pipeline

---

## File Structure

### Hugo-owned production content

- `content/_index.md`
  - homepage page-level metadata
  - if needed, front matter pointer fields for homepage payload sections
- `themes/scanlines/layouts/index.html`
  - current Hugo homepage fallback renderer
  - will also emit serialized production homepage JSON
- `themes/scanlines/layouts/partials/*.html`
  - touch only if extracting homepage payload rendering into a focused partial improves clarity

### Runtime consumption

- `lab/src/app/app-shell.tsx`
  - production `site` surface currently hydrates with local copy constants
  - must switch to Hugo JSON payload on `surface="site"`
- `lab/src/app/site-copy.ts`
  - currently duplicates production homepage copy
  - should become lab-only defaults or be split into `site-copy-lab.ts`
- `lab/src/app/` new loader/parser module
  - focused reader for `<script id="site-copy-data" type="application/json">`
  - validates shape and returns parsed runtime copy model

### Tests

- `lab/src/app/site-copy.test.ts`
  - replace or repurpose current copy guard test so it tests loader/fallback behavior instead of hardcoded production text
- `lab/src/app/app-shell.test.tsx`
  - add tests for site-surface JSON hydration and invalid/missing payload behavior
- `tests/e2e/site.spec.ts`
  - assert generated homepage contains serialized payload
  - assert hydrated site does not regress to stale copy

---

### Task 1: Define the Hugo homepage payload contract

**Files:**
- Modify: `content/_index.md`
- Modify: `themes/scanlines/layouts/index.html`
- Test: `tests/e2e/site.spec.ts`

- [ ] **Step 1: Add the failing e2e assertion for homepage payload presence**

Add a test block in `tests/e2e/site.spec.ts` after the homepage request HTML is read:

```ts
  expect(homeHtml).toMatch(/<script id="site-copy-data" type="application\/json">/i)
  expect(homeHtml).toMatch(/"hero":/i)
  expect(homeHtml).toMatch(/"sections":/i)
  expect(homeHtml).toMatch(/"projects":/i)
```

- [ ] **Step 2: Run the homepage Playwright test and verify it fails**

Run:

```bash
cd /Users/tim/code/gh/undef-games/undef-logos/.worktrees/main-verify
npx playwright test tests/e2e/site.spec.ts -g "renders the refreshed homepage copy and logs navigation"
```

Expected:
- FAIL because `site-copy-data` is not present in the generated homepage HTML

- [ ] **Step 3: Add homepage payload fields to Hugo content or derive them from the existing Hugo homepage data source**

If the current homepage already uses Hugo data through `hugo.Data.site.home`, keep that as the content source and make `content/_index.md` only carry page metadata. If a missing field blocks serialization, add the field in the Hugo-owned source rather than reintroducing runtime-owned copy.

Keep the homepage content model consistent with the existing runtime needs:

```md
---
title: "undef games"
description: "Indie developer building game tools and systems for fun shared experiences online and off."
---
```

Do not move production message text into `lab/src/app/site-copy.ts`.

- [ ] **Step 4: Emit serialized homepage JSON from `themes/scanlines/layouts/index.html`**

Add a serialized JSON block near the end of the homepage markup, using the same Hugo content source already used for the visible homepage:

```gohtml
  {{ $siteCopy := dict
    "hero" (dict
      "kicker" $hero.kicker
      "title" $hero.title
      "support" $hero.copy
      "primaryAction" (dict "href" $hero.primary_href "label" $hero.primary_label)
      "secondaryAction" (dict "href" $hero.secondary_href "label" $hero.secondary_label)
      "statusLabel" "Shared play, digital and physical."
    )
    "projects" $products
    "sections" (dict
      "projects" (dict "kicker" $productsIntro.kicker "title" $productsIntro.title)
      "identity" (dict "kicker" $identity.kicker "title" $identity.title "body" $identity.copy)
    )
  }}
  <script id="site-copy-data" type="application/json">{{ $siteCopy | jsonify }}</script>
```

Do not overcompress the shape; keep it explicit and aligned with runtime needs.

- [ ] **Step 5: Re-run the focused homepage test**

Run:

```bash
cd /Users/tim/code/gh/undef-games/undef-logos/.worktrees/main-verify
npx playwright test tests/e2e/site.spec.ts -g "renders the refreshed homepage copy and logs navigation"
```

Expected:
- PASS on payload presence assertions

- [ ] **Step 6: Commit**

```bash
git add content/_index.md themes/scanlines/layouts/index.html tests/e2e/site.spec.ts
git commit -m "feat: serialize homepage copy from hugo"
```

---

### Task 2: Add a runtime loader for Hugo homepage JSON

**Files:**
- Create: `lab/src/app/site-copy-site.ts`
- Modify: `lab/src/app/site-copy.test.ts`
- Test: `lab/src/app/site-copy.test.ts`

- [ ] **Step 1: Write the failing loader tests**

Replace the current copy literal guard with loader behavior tests:

```ts
import { describe, expect, it } from 'vitest'
import { readSiteSurfaceCopy } from './site-copy-site'

describe('site copy loader', () => {
  it('reads production site copy from embedded hugo json', () => {
    document.body.innerHTML = `
      <script id="site-copy-data" type="application/json">
        {"hero":{"support":"from-hugo"},"projects":[],"sections":{"signal":{"kicker":"k","title":"t","body":"b"},"projects":{"kicker":"p","title":"pt"},"identity":{"kicker":"i","title":"it","body":"ib"},"closing":{"kicker":"c","title":"ct","action":"a"}}}
      </script>
    `

    expect(readSiteSurfaceCopy()?.hero.support).toBe('from-hugo')
  })

  it('returns null for missing or invalid payloads', () => {
    document.body.innerHTML = ''
    expect(readSiteSurfaceCopy()).toBeNull()
  })
})
```

- [ ] **Step 2: Run the loader test and verify it fails**

Run:

```bash
cd /Users/tim/code/gh/undef-games/undef-logos/.worktrees/main-verify/lab
npm run test:run -- src/app/site-copy.test.ts
```

Expected:
- FAIL because `readSiteSurfaceCopy` does not exist yet

- [ ] **Step 3: Implement the minimal loader/parser**

Create `lab/src/app/site-copy-site.ts`:

```ts
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
  sections: Record<string, unknown>
}

export function readSiteSurfaceCopy(): SiteSurfaceCopy | null {
  const node = document.getElementById('site-copy-data')
  if (!(node instanceof HTMLScriptElement)) return null

  try {
    const parsed = JSON.parse(node.textContent ?? '')
    return isSiteSurfaceCopy(parsed) ? parsed : null
  } catch {
    return null
  }
}
```

Add a minimal local shape guard. Keep it focused; do not build a schema framework.

- [ ] **Step 4: Re-run the loader test**

Run:

```bash
cd /Users/tim/code/gh/undef-games/undef-logos/.worktrees/main-verify/lab
npm run test:run -- src/app/site-copy.test.ts
```

Expected:
- PASS

- [ ] **Step 5: Commit**

```bash
git add lab/src/app/site-copy-site.ts lab/src/app/site-copy.test.ts
git commit -m "feat: add hugo site copy loader"
```

---

### Task 3: Switch `AppShell` site hydration to Hugo payload

**Files:**
- Modify: `lab/src/app/app-shell.tsx`
- Modify: `lab/src/app/site-copy.ts`
- Modify: `lab/src/app/app-shell.test.tsx`
- Test: `lab/src/app/app-shell.test.tsx`

- [ ] **Step 1: Add the failing `AppShell` site-surface tests**

Add two tests in `lab/src/app/app-shell.test.tsx`:

```ts
it('uses embedded hugo copy on the site surface', () => {
  document.body.innerHTML = `<script id="site-copy-data" type="application/json">{"hero":{"support":"from-hugo","primaryAction":{"href":"https://warp.undef.games","label":"Explore WARP"},"secondaryAction":{"href":"#projects","label":"View projects"},"statusLabel":"Shared play, digital and physical."},"projects":[],"sections":{"signal":{"kicker":"Interactive field","title":"from-hugo signal","body":"from-hugo body"},"projects":{"kicker":"Live routes","title":"from-hugo projects"},"identity":{"kicker":"Company baseline","title":"from-hugo identity","body":"from-hugo identity body"},"closing":{"kicker":"undef.games","title":"Built for people to play together.","action":"Back to top"}}}</script>`

  render(<AppShell surface="site" />)

  expect(screen.getByText('from-hugo signal')).toBeInTheDocument()
})

it('does not replace site content with stale defaults when the payload is missing', () => {
  render(<AppShell surface="site" />)
  expect(screen.queryByText('Responsive by design, not by decoration.')).not.toBeInTheDocument()
})
```

- [ ] **Step 2: Run the `AppShell` test file and verify it fails**

Run:

```bash
cd /Users/tim/code/gh/undef-games/undef-logos/.worktrees/main-verify/lab
npm run test:run -- src/app/app-shell.test.tsx
```

Expected:
- FAIL because the site surface still reads from local runtime copy

- [ ] **Step 3: Update `AppShell` to use Hugo payload for `surface="site"`**

In `lab/src/app/app-shell.tsx`:

- import the new `readSiteSurfaceCopy`
- derive a `siteCopy` object for `surface === "site"`
- use that object instead of the production literals from `site-copy.ts`

Keep the branch explicit:

```ts
const siteCopy = surface === 'site' ? readSiteSurfaceCopy() : null
const heroCopy = siteCopy?.hero ?? LAB_HERO_COPY
const sectionCopy = siteCopy?.sections ?? LAB_SECTIONS
const projectCopy = siteCopy?.projects?.length ? siteCopy.projects : LAB_PROJECTS
```

Then tighten the fallback rule:

- for `surface === "site"`, only use lab defaults for fields that truly must exist to avoid a runtime crash
- do not preserve the stale production string literals in the site path

- [ ] **Step 4: Isolate lab-only copy defaults**

Update `lab/src/app/site-copy.ts` so it is clearly lab-local or neutral runtime fallback data, not “production homepage source.”

At minimum:

- rename exports or comments to reflect lab/runtime fallback purpose
- remove any implication that this file owns production homepage copy

- [ ] **Step 5: Re-run the `AppShell` tests**

Run:

```bash
cd /Users/tim/code/gh/undef-games/undef-logos/.worktrees/main-verify/lab
npm run test:run -- src/app/app-shell.test.tsx
```

Expected:
- PASS

- [ ] **Step 6: Commit**

```bash
git add lab/src/app/app-shell.tsx lab/src/app/site-copy.ts lab/src/app/app-shell.test.tsx
git commit -m "fix: hydrate site copy from hugo payload"
```

---

### Task 4: Add end-to-end regression coverage for the old drift

**Files:**
- Modify: `tests/e2e/site.spec.ts`
- Test: `tests/e2e/site.spec.ts`

- [ ] **Step 1: Add a failing regression assertion for the old hydrated copy**

In the homepage e2e test, add assertions that the hydrated page does not show the old signal heading/body:

```ts
  await expect(page.getByText('Responsive by design, not by decoration.')).toHaveCount(0)
  await expect(page.getByText(/The scanline field stays alive under the cursor and the page/i)).toHaveCount(0)
```

- [ ] **Step 2: Run the focused e2e test and verify it fails if the old runtime copy still leaks**

Run:

```bash
cd /Users/tim/code/gh/undef-games/undef-logos/.worktrees/main-verify
npx playwright test tests/e2e/site.spec.ts -g "renders the refreshed homepage copy and logs navigation"
```

Expected:
- PASS only after Task 3 is correctly wired

- [ ] **Step 3: Expand the payload assertions to verify runtime-aligned content**

Keep explicit assertions for:

```ts
  await expect(page.getByRole('heading', { name: /projects built to be used, watched, and played with/i })).toBeVisible()
  await expect(page.getByRole('heading', { name: /good systems should make shared play easier to reach/i })).toBeVisible()
```

and add the new signal heading/body once finalized in Hugo content.

- [ ] **Step 4: Commit**

```bash
git add tests/e2e/site.spec.ts
git commit -m "test: guard homepage hydration against copy drift"
```

---

### Task 5: Full verification and production deployment

**Files:**
- Verify only

- [ ] **Step 1: Run the full lab/unit suite**

Run:

```bash
cd /Users/tim/code/gh/undef-games/undef-logos/.worktrees/main-verify
make test
```

Expected:
- all Vitest suites pass

- [ ] **Step 2: Run typecheck**

Run:

```bash
cd /Users/tim/code/gh/undef-games/undef-logos/.worktrees/main-verify
make typecheck
```

Expected:
- PASS

- [ ] **Step 3: Run the site e2e suite**

Run:

```bash
cd /Users/tim/code/gh/undef-games/undef-logos/.worktrees/main-verify
make e2e
```

Expected:
- PASS

- [ ] **Step 4: Build the deploy artifact**

Run:

```bash
cd /Users/tim/code/gh/undef-games/undef-logos/.worktrees/main-verify
make build
```

Expected:
- PASS
- generated homepage HTML includes `site-copy-data`
- generated `public/lab/assets/app-*.js` no longer contains the stale production heading

- [ ] **Step 5: Commit final verification-only adjustments if any**

```bash
git add -A
git commit -m "chore: finalize hugo homepage copy hydration"
```

Only if verification forced a real code or test edit.

- [ ] **Step 6: Deploy**

Run:

```bash
cd /Users/tim/code/gh/undef-games/undef-logos/.worktrees/main-verify
make deploy
```

Expected:
- Cloudflare Pages deploy succeeds
- verify live `https://undef.games/` no longer hydrates to stale runtime copy

---

## Self-Review

- Spec coverage:
  - Hugo owns homepage copy: covered by Tasks 1 and 3
  - JSON serialization: covered by Task 1
  - runtime consumption on `site`: covered by Tasks 2 and 3
  - safe failure behavior: covered by Tasks 2 and 3
  - regression prevention: covered by Task 4
  - deploy verification: covered by Task 5
- Placeholder scan:
  - no TBD/TODO placeholders remain
  - all tasks include exact file paths and commands
- Type consistency:
  - plan consistently uses `site-copy-data`, `readSiteSurfaceCopy`, `surface="site"`, and Hugo payload naming

