# Homepage Copy Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refresh the public-site and lab landing copy so `undef games` reads clearly as an indie developer building game tools and systems for shared play, with WARP as the flagship route and `Logs` replacing `Blog`.

**Architecture:** Keep the current visual composition and shared runtime intact, but move the lab landing copy into a dedicated TypeScript module so `app-shell.tsx` stops carrying a pile of inline marketing text. Update Hugo-owned copy in `data/site/home.json`, `content/*.md`, and header partials so the non-lab surfaces match the same voice and navigation vocabulary.

**Tech Stack:** Hugo, React, TypeScript, Vite, Vitest, Playwright.

---

## File Map

### Existing files to modify

- `lab/src/app/app-shell.tsx`
  - Replace inline landing copy/product metadata with imports from a focused copy module.
- `lab/src/app/app-shell.test.tsx`
  - Update expectations for the new hero/supporting copy and flagship wording.
- `lab/src/styles/hero.css`
  - Tighten header-to-hero spacing on the shared runtime surface.
- `themes/scanlines/layouts/partials/header.html`
  - Rename `Blog` nav link to `Logs`.
- `themes/scanlines/layouts/partials/hero.html`
  - Render refreshed hero copy and CTA labels from Hugo data.
- `themes/scanlines/layouts/partials/products.html`
  - Render refreshed product index heading/copy.
- `themes/scanlines/static/css/chrome.css`
  - Tighten header-to-hero spacing on Hugo surfaces.
- `data/site/home.json`
  - Replace generic homepage copy with the approved company/product language.
- `content/_index.md`
  - Refresh homepage description metadata.
- `content/games.md`
  - Refresh section intro and product blurbs.
- `content/blog.md`
  - Rename page to `Logs` and rewrite intro copy.
- `content/about.md`
  - Rewrite company explanation to match the approved positioning.
- `tests/e2e/site.spec.ts`
  - Update nav, homepage, and supporting-page copy expectations.
- `tests/e2e/logo-lab.spec.ts`
  - Update lab landing copy expectations.

### New files to create

- `lab/src/app/site-copy.ts`
  - Own lab landing hero copy, project metadata, section headings, and CTA labels.

---

## Task 1: Split lab landing copy into a focused module

**Files:**
- Create: `lab/src/app/site-copy.ts`
- Modify: `lab/src/app/app-shell.tsx`
- Test: `lab/src/app/app-shell.test.tsx`

- [ ] **Step 1: Write the failing AppShell copy expectations**

Add or update a test in `lab/src/app/app-shell.test.tsx` so the lab runtime is forced to expose the new positioning and flagship language:

```tsx
it('renders the refreshed company and flagship copy on the landing surface', () => {
  render(<AppShell />)

  expect(
    screen.getByText(/indie developer building game tools and systems for fun shared experiences/i),
  ).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /explore warp/i })).toBeInTheDocument()
  expect(screen.getByText(/TradeWars: WARP Agent Runtime Platform/i)).toBeInTheDocument()
  expect(screen.getByText(/at the table and on the network/i)).toBeInTheDocument()
})
```

- [ ] **Step 2: Run the AppShell test to verify it fails**

Run:

```bash
cd /Users/tim/code/gh/undef-games/undef-logos/.worktrees/main-verify/lab
npm run test:run -- src/app/app-shell.test.tsx
```

Expected: FAIL because `AppShell` still renders the old “Systems, toys, and game-shaped experiments tuned out of undefined space.” copy and does not expose the new CTA text.

- [ ] **Step 3: Create a focused lab copy module**

Create `lab/src/app/site-copy.ts`:

```ts
export const LAB_HERO_COPY = {
  kicker: 'CH 00 / SIGNAL FIELD',
  title: 'undef games',
  support:
    'Indie developer building game tools and systems for fun shared experiences online and off.',
  primaryAction: { href: 'https://warp.undef.games', label: 'Explore WARP' },
  secondaryAction: { href: '#projects', label: 'View projects' },
  statusLabel: 'Shared play, digital and physical.',
} as const

export const LAB_PROJECTS = [
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
  {
    className: 'product-link--taybols',
    description:
      'Smaller experiments, generators, and odd little game utilities with room to become bigger systems.',
    href: 'https://taybols.undef.games',
    label: 'Taybols',
    tag: 'taybols',
  },
] as const

export const LAB_SECTIONS = {
  signal: {
    kicker: 'Interactive field',
    title: 'Responsive by design, not by decoration.',
    body:
      'The scanline field stays alive under the cursor and the page so the site feels active without hiding the products behind abstract motion.',
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
} as const
```

- [ ] **Step 4: Wire `AppShell` to the new copy module**

Update `lab/src/app/app-shell.tsx`:

```tsx
import { LAB_HERO_COPY, LAB_PROJECTS, LAB_SECTIONS } from './site-copy'
```

Replace the inline `PRODUCT_LINKS` constant with `LAB_PROJECTS`, and replace the hard-coded strings in the landing sections:

```tsx
<p className="station-copy">{LAB_HERO_COPY.support}</p>
<div className="station-actions" aria-label="landing actions">
  <a href={isSiteSurface ? LAB_HERO_COPY.primaryAction.href : '#signal'}>
    {isSiteSurface ? LAB_HERO_COPY.primaryAction.label : 'Tune signal'}
  </a>
  <a href={LAB_HERO_COPY.secondaryAction.href}>{LAB_HERO_COPY.secondaryAction.label}</a>
</div>
<p className="station-status">{status.lock ? 'Signal locked' : LAB_HERO_COPY.statusLabel}</p>
```

And use `LAB_SECTIONS.*` for:

- `landing-section--signal`
- `landing-section--products`
- `landing-section--warp`
- `landing-section--dice`
- `landing-section--taybols`
- `landing-section--identity`
- `landing-final`

Also switch the WARP section link label to `LAB_SECTIONS.warp.linkLabel`.

- [ ] **Step 5: Run the AppShell test to verify it passes**

Run:

```bash
cd /Users/tim/code/gh/undef-games/undef-logos/.worktrees/main-verify/lab
npm run test:run -- src/app/app-shell.test.tsx
```

Expected: PASS with the refreshed copy visible in the rendered landing surface.

- [ ] **Step 6: Commit**

```bash
cd /Users/tim/code/gh/undef-games/undef-logos/.worktrees/main-verify
git add lab/src/app/site-copy.ts lab/src/app/app-shell.tsx lab/src/app/app-shell.test.tsx
git commit -m "refactor: split landing page copy"
```

## Task 2: Refresh Hugo-owned homepage and supporting-page copy

**Files:**
- Modify: `data/site/home.json`
- Modify: `content/_index.md`
- Modify: `content/games.md`
- Modify: `content/blog.md`
- Modify: `content/about.md`
- Modify: `themes/scanlines/layouts/partials/header.html`
- Modify: `themes/scanlines/layouts/partials/hero.html`
- Modify: `themes/scanlines/layouts/partials/products.html`
- Test: `tests/e2e/site.spec.ts`

- [ ] **Step 1: Write the failing site copy assertions**

Update `tests/e2e/site.spec.ts` so the public site must expose the renamed nav and revised company copy:

```ts
test('renders the refreshed homepage copy and logs navigation', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('navigation', { name: /primary/i }).getByRole('link', { name: /^Logs$/i })).toBeVisible()
  await expect(page.getByRole('heading', { name: /^undef games$/i })).toBeVisible()
  await expect(page.getByText(/indie developer building game tools and systems/i)).toBeVisible()
  await expect(page.getByRole('link', { name: /explore warp/i })).toBeVisible()
  await expect(page.getByRole('heading', { name: /projects built to be used, watched, and played with/i })).toBeVisible()
})
```

Also update the supporting-page route expectations:

```ts
for (const route of [
  { heading: /^Games$/i, path: '/games/' },
  { heading: /^Logs$/i, path: '/blog/' },
  { heading: /^About$/i, path: '/about/' },
]) {
```

- [ ] **Step 2: Run the site Playwright test to verify it fails**

Run:

```bash
cd /Users/tim/code/gh/undef-games/undef-logos/.worktrees/main-verify
/Users/tim/code/gh/undef-games/undef-logos/node_modules/.bin/playwright test tests/e2e/site.spec.ts --grep "refreshed homepage copy and logs navigation|serves separate Hugo pages"
```

Expected: FAIL because the nav still says `Blog`, the hero still uses the old “undefined space” copy, and the supporting pages still carry the old intros.

- [ ] **Step 3: Refresh the Hugo data and content files**

Update `data/site/home.json`:

```json
{
  "hero": {
    "kicker": "CH 00 / SIGNAL FIELD",
    "title": "undef games",
    "copy": "Indie developer building game tools and systems for fun shared experiences online and off.",
    "primary_label": "Explore WARP",
    "primary_href": "https://warp.undef.games",
    "secondary_label": "View projects",
    "secondary_href": "#projects"
  },
  "products": [
    {
      "tag": "warp",
      "label": "TradeWars: WARP Agent Runtime Platform",
      "href": "https://warp.undef.games",
      "description": "The flagship route: a live alpha platform for TradeWars runtime, automation, and operator tooling."
    },
    {
      "tag": "dice",
      "label": "Undef Dice",
      "href": "https://undefdice.com",
      "description": "Dice and table tools for shared play at the table and on the network."
    },
    {
      "tag": "taybols",
      "label": "Taybols",
      "href": "https://taybols.undef.games",
      "description": "Smaller experiments, generators, and odd little utilities with room to become bigger systems."
    }
  ],
  "identity": {
    "kicker": "Company baseline",
    "title": "Good systems should make shared play easier to reach.",
    "copy": "undef games builds the technical side of play so people can gather, operate, and have fun across digital and physical spaces."
  }
}
```

Update `content/_index.md`:

```md
---
title: "undef games"
description: "Indie developer building game tools and systems for fun shared experiences online and off."
---
```

Update `content/games.md`:

```md
---
title: "Games"
kicker: "Live routes"
description: "Active game tools, systems, and playable utilities from undef games."
---

## TradeWars: WARP Agent Runtime Platform

The flagship route: a live alpha platform for TradeWars runtime, automation, and operator tooling.

[Explore WARP](https://warp.undef.games)

## Undef Dice

Dice and table tools built to keep shared play moving quickly at the table and on the network.

[Open Undef Dice](https://undefdice.com)

## Taybols

Smaller experiments, generators, and utility tools that can grow into finished systems.

[Open Taybols](https://taybols.undef.games)
```

Update `content/blog.md`:

```md
---
title: "Logs"
kicker: "Field notes"
description: "Development logs, release notes, and project updates from undef games."
---

## Logs are coming online.

This is where release notes, build updates, and project notes will collect as the company and its products keep moving.
```

Update `content/about.md`:

```md
---
title: "About"
kicker: "Signal source"
description: "undef games is an indie developer building game tools and systems for fun shared experiences."
---

undef games is an indie developer building strong game tools and systems to support fun shared experiences online and off.

We care about the technical side of play because better systems make it easier for people to gather, operate, and enjoy games together across digital and physical spaces.
```

Update `themes/scanlines/layouts/partials/header.html` so the nav label reads:

```html
<a href="/blog/" {{ if eq .RelPermalink "/blog/" }}aria-current="page"{{ end }}>Logs</a>
```

Update `themes/scanlines/layouts/partials/products.html` heading copy:

```html
<p class="scan-kicker">Live routes</p>
<h2>Projects built to be used, watched, and played with.</h2>
```

- [ ] **Step 4: Run the focused Playwright site test to verify it passes**

Run:

```bash
cd /Users/tim/code/gh/undef-games/undef-logos/.worktrees/main-verify
/Users/tim/code/gh/undef-games/undef-logos/node_modules/.bin/playwright test tests/e2e/site.spec.ts --grep "refreshed homepage copy and logs navigation|serves separate Hugo pages"
```

Expected: PASS with `Logs` visible in nav, the new hero copy present, and supporting pages reflecting the new tone.

- [ ] **Step 5: Commit**

```bash
cd /Users/tim/code/gh/undef-games/undef-logos/.worktrees/main-verify
git add data/site/home.json content/_index.md content/games.md content/blog.md content/about.md \
  themes/scanlines/layouts/partials/header.html themes/scanlines/layouts/partials/products.html \
  tests/e2e/site.spec.ts
git commit -m "feat: refresh site copy"
```

## Task 3: Tighten hero spacing and align CTA presentation

**Files:**
- Modify: `lab/src/styles/hero.css`
- Modify: `themes/scanlines/static/css/chrome.css`
- Test: `tests/e2e/site.spec.ts`
- Test: `tests/e2e/logo-lab.spec.ts`

- [ ] **Step 1: Write the failing spacing assertions**

Add a Playwright check that the hero sits closer to the header on both the Hugo surface and the lab surface:

```ts
test('keeps the hero tight to the header on site and lab surfaces', async ({ page }) => {
  await page.goto('/')
  const siteGap = await page.evaluate(() => {
    const header = document.querySelector('.site-header')!.getBoundingClientRect()
    const hero = document.querySelector('.scan-hero')!.getBoundingClientRect()
    return hero.top - header.bottom
  })
  expect(siteGap).toBeLessThanOrEqual(24)

  await page.goto('/lab/')
  const labGap = await page.evaluate(() => {
    const header = document.querySelector('.site-header')!.getBoundingClientRect()
    const hero = document.querySelector('.landing-hero')!.getBoundingClientRect()
    return hero.top - header.bottom
  })
  expect(labGap).toBeLessThanOrEqual(24)
})
```

- [ ] **Step 2: Run the spacing test to verify it fails**

Run:

```bash
cd /Users/tim/code/gh/undef-games/undef-logos/.worktrees/main-verify
/Users/tim/code/gh/undef-games/undef-logos/node_modules/.bin/playwright test tests/e2e/site.spec.ts tests/e2e/logo-lab.spec.ts --grep "hero tight to the header"
```

Expected: FAIL because the current spacing is looser than the approved direction.

- [ ] **Step 3: Tighten the spacing in both CSS surfaces**

Update `themes/scanlines/static/css/scanlines.css` and `lab/src/styles/hero.css` with the exact owning selectors:

```css
.scan-page {
  padding-top: 56px;
}
```

and the mobile override:

```css
@media (max-width: 980px) {
  .scan-page {
    padding-top: 88px;
  }
}
```

Then update `lab/src/styles/hero.css`:

```css
.station-hero {
  padding-top: 48px;
}
```

Keep the existing left/right padding values in place. Only reduce the block-start
spacing so the header and hero visually lock together more tightly without
changing the overall layout.

- [ ] **Step 4: Run the spacing test to verify it passes**

Run:

```bash
cd /Users/tim/code/gh/undef-games/undef-logos/.worktrees/main-verify
/Users/tim/code/gh/undef-games/undef-logos/node_modules/.bin/playwright test tests/e2e/site.spec.ts tests/e2e/logo-lab.spec.ts --grep "hero tight to the header"
```

Expected: PASS with both surfaces reading tighter to the header.

- [ ] **Step 5: Commit**

```bash
cd /Users/tim/code/gh/undef-games/undef-logos/.worktrees/main-verify
git add lab/src/styles/hero.css themes/scanlines/static/css/chrome.css tests/e2e/site.spec.ts tests/e2e/logo-lab.spec.ts
git commit -m "fix: tighten hero spacing"
```

## Task 4: Align the remaining homepage sections and final CTA with the approved voice

**Files:**
- Modify: `lab/src/app/site-copy.ts`
- Modify: `data/site/home.json`
- Modify: `themes/scanlines/layouts/partials/hero.html`
- Test: `tests/e2e/logo-lab.spec.ts`
- Test: `tests/e2e/site.spec.ts`

- [ ] **Step 1: Write failing assertions for the company explanation layer**

Add a lab and site expectation that the page explains the company plainly:

```ts
await expect(page.getByText(/good systems should make shared play easier to reach/i)).toBeVisible()
await expect(page.getByText(/undef games builds the technical side of play/i)).toBeVisible()
```

- [ ] **Step 2: Run the focused e2e checks to verify they fail**

Run:

```bash
cd /Users/tim/code/gh/undef-games/undef-logos/.worktrees/main-verify
/Users/tim/code/gh/undef-games/undef-logos/node_modules/.bin/playwright test tests/e2e/site.spec.ts tests/e2e/logo-lab.spec.ts --grep "company explanation|projects built to be used"
```

Expected: FAIL because the identity and closing sections still use the older abstract copy.

- [ ] **Step 3: Update the final homepage explanatory layer**

In `lab/src/app/site-copy.ts`, keep the identity and closing blocks aligned with the spec:

```ts
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
```

Mirror the same company-baseline language in `data/site/home.json` so Hugo and lab agree.

If `themes/scanlines/layouts/partials/hero.html` still uses a weaker primary CTA label or support copy after Task 2, align it here with the same wording:

```html
<a class="scan-button scan-button--primary" href="{{ $hero.primary_href }}">{{ $hero.primary_label }}</a>
```

with the data file carrying:

```json
"primary_label": "Explore WARP"
```

- [ ] **Step 4: Run the focused e2e checks to verify they pass**

Run:

```bash
cd /Users/tim/code/gh/undef-games/undef-logos/.worktrees/main-verify
/Users/tim/code/gh/undef-games/undef-logos/node_modules/.bin/playwright test tests/e2e/site.spec.ts tests/e2e/logo-lab.spec.ts --grep "company explanation|projects built to be used"
```

Expected: PASS with the site explaining the company plainly and the final sections no longer leaning on abstract filler.

- [ ] **Step 5: Commit**

```bash
cd /Users/tim/code/gh/undef-games/undef-logos/.worktrees/main-verify
git add lab/src/app/site-copy.ts data/site/home.json themes/scanlines/layouts/partials/hero.html \
  tests/e2e/site.spec.ts tests/e2e/logo-lab.spec.ts
git commit -m "feat: align homepage company messaging"
```

## Task 5: Full regression verification

**Files:**
- No new files

- [ ] **Step 1: Run typecheck**

Run:

```bash
cd /Users/tim/code/gh/undef-games/undef-logos/.worktrees/main-verify
make typecheck
```

Expected: PASS.

- [ ] **Step 2: Run unit tests**

Run:

```bash
cd /Users/tim/code/gh/undef-games/undef-logos/.worktrees/main-verify
make test
```

Expected: PASS.

- [ ] **Step 3: Run the full Playwright suite**

Run:

```bash
cd /Users/tim/code/gh/undef-games/undef-logos/.worktrees/main-verify
make e2e
```

Expected: PASS, including:

- homepage/site navigation checks
- `/lab/` hero copy checks
- project link checks
- scanline engine and control regressions

- [ ] **Step 4: Commit the finished plan branch state if needed**

If Task 5 required no code changes, skip this commit. If a final regression fix was needed during verification, commit it with a narrow message, for example:

```bash
git add <files>
git commit -m "fix: align refreshed copy regressions"
```
