# Games roster expansion and per-game motifs

**Date:** 2026-07-23
**Status:** Approved, ready for implementation planning
**Revision:** 2 — corrected after tracing the homepage render path (see
"Architecture correction")

## Problem

The undef.games site lists three games. The studio now ships ten. Three
problems follow from that:

1. **Taybols moved.** It is live at `https://taybols.com`; the site still points
   at `https://taybols.undef.games`.
2. **Seven games are missing.** Grove and six `.to` daily apps have shipped and
   appear nowhere.
3. **Nothing on the page identifies a specific game.** The site has an animated
   `SectionToy` system, but only WARP, Dice, and Taybols have bespoke motifs.

Underneath all three sits a structural problem: the games list is duplicated in
five places across two repositories, and it has **already drifted**. Taybols is
described as "Random tables for tabletop play" in `data/site/home.json:33` and
as "Smaller experiments, generators, and odd little game utilities" in
`lab/src/app/site-copy.ts:29`.

## Architecture correction

Revision 1 of this spec assumed the homepage was a Hugo template in
`themes/scanlines/`. Tracing the render path showed otherwise, and two
corrections follow.

**1. `themes/scanlines/` is vendored, not editable.** It is copied byte-for-byte
from `../scanlines-system/hugo/scanlines/` by `make sync-scanlines`, and
`make check-scanlines` fails CI on any sha256 drift
(`themes/scanlines/VENDOR_MANIFEST.json`). It is shared by **four** sites:
`site-undef-games`, `site-tradewars-com`, `site-eisonline-com`, `undef-bbs`.

Therefore all site-specific rendering — the `/games/` page, the marquee, and the
CSS motifs — goes in **this repo's project-level `layouts/` and
`static/css/`**, which are not vendored. Hugo resolves project layouts ahead of
theme layouts, so `layouts/index.html` here overrides the theme's copy.

**2. The homepage is React from the shared package.** `baseof.html` loads
`/lab/assets/site.js` → `themes/scanlines/assets/ts/site.ts` →
`mountSiteSurface()` → `../scanlines-system/src/atmosphere/site/site-app.tsx`.
`SiteApp` hardcodes one JSX block per game, and
`src/atmosphere/site/site-copy-loader.ts` hardcodes the same three keys and
**validates them fail-closed** — a shape mismatch makes `readSiteSurfaceCopy()`
return `null`, `SiteApp` returns `null`, and the homepage renders blank.

**Approved resolution: generalize the site surface.** The hardcoded per-game
sections and the closed `SiteSurfaceSections` type become a generic,
consumer-supplied array. This stops the shared design system from hardcoding
undef.games product names, and afterwards adding game #11 is a one-object edit
to `games.json` with no cross-repo work.

**Good news found while tracing:** `SectionToy` is already generic. The effect
is only a CSS class — `section-toy--effect-${effect}` — with one stylesheet per
effect at `src/atmosphere/section-toys/<effect>.css`. New homepage motifs are
**CSS files plus a union entry**, not React components.

## Roster

Ten games. `tier` determines how much page a game gets.

| tag | tier | label | href | description |
|---|---|---|---|---|
| `warp` | flagship | WARP: Warp Agent Runtime Portal | `https://warp.undef.games` | Your portal into a TradeWars universe: a live alpha agent platform with automation, operator tooling, and agent-to-agent coordination, all while wrapped around one of the most influential pre-internet online games. |
| `dice` | flagship | Undef Dice | `https://undefdice.com` | Dice and table tools for shared play at the table and on the network. |
| `taybols` | flagship | Taybols | `https://taybols.com` | Random tables for tabletop play. Roll for NPCs, encounters, and rumors, build your own, or import a whole book from a PDF. |
| `grove` | flagship | Grove | `https://grove.undef.games` | Browser-based git history visualizer — directories as a force-directed tree, files orbiting as colored dots, contributors gliding between them. No install. |
| `haiku` | flagship | haiku.to | `https://haiku.to` | Write haiku, watch them fall, remix what other people leave behind. |
| `becoming` | listed | becoming.to | `https://becoming.to` | One affirmation a day. You are already on your way. |
| `proverb` | listed | proverb.to | `https://proverb.to` | One old saying a day. Draw the water and it rises. |
| `stoke` | listed | stoke.to | `https://stoke.to` | One motivational quote a day. Stoke the fire. |
| `currents` | listed | currents.to | `https://currents.to` | A daily ambient puzzle on a sumi-e canvas — one brushstroke to carve a riverbed. Same landscape for everyone. |
| `amor` | listed | amor.to | `https://amor.to` | A quiet place for two. Not a messaging app — a shared digital terrarium. |

Descriptions are taken from each project's own `<meta name="description">` or
README.

**Deliberately excluded:** `bbs.undef.games` (a directory, not a game),
`quotable.to` (parked domain), `quotable` (backend service), `ugrow` and
`vim-adventures` (design notes only).

**Naming:** the `.to` apps are labeled as bare domains — `amor.to`, not `Amor`.

### Section copy for the new flagships

Grove:

- kicker: `Repo weather`
- title: `Grove plays a repository back as a living tree.`
- copy: `Point it at any git history and watch directories spread into a force-directed tree while files orbit as colored dots and contributors glide between them firing beams. No install, no backend — a live demo the moment the page loads, and a drag-anywhere timeline to scrub the whole history.`
- link_label: `Open Grove`

haiku.to:

- kicker: `Three lines`
- title: `haiku.to turns three lines into a shared feed.`
- copy: `Write a haiku, watch it fall through the feed, and remix the ones other people leave behind. Compose in five-seven-five, follow a thread of variations, or let the day's verses drift past.`
- link_label: `Open haiku.to`

## Data model

`data/site/games.json` is the single source of truth. The snippet shows the
**shape**; the roster table above is authoritative for copy.

```json
{
  "games": [
    {
      "tag": "warp",
      "tier": "flagship",
      "label": "WARP: Warp Agent Runtime Portal",
      "href": "https://warp.undef.games",
      "description": "Your portal into a TradeWars universe…",
      "motif": "warp",
      "variant": "signal",
      "section": {
        "kicker": "Flagship route",
        "title": "WARP: Warp Agent Runtime Portal.",
        "copy": "…",
        "link_label": "Explore WARP"
      }
    },
    {
      "tag": "amor",
      "tier": "listed",
      "label": "amor.to",
      "href": "https://amor.to",
      "description": "A quiet place for two…",
      "motif": "amor"
    }
  ]
}
```

`tag` is the stable identifier and CSS-class suffix. `tier` is `flagship` or
`listed`. `label`, `href`, `description` render the card, marquee tile, and
`/games/` row. `motif` names the graphic. `variant` is the `SectionToy` layout
(`signal` | `system` | `identity`), flagship-only. `section` carries deep-section
copy and is **required on `flagship`, absent on `listed`**.

| Surface | flagship | listed |
|---|---|---|
| Homepage marquee tile | yes | yes |
| Homepage card | yes | yes |
| Homepage deep section | yes | no |
| `/games/` row | yes | yes |

`data/site/home.json` keeps only non-game content: `hero`, `products_intro`,
`identity`, `signal`, `closing`. Its `products` array and its `warp` / `dice` /
`taybols` keys are removed.

## Page structure

### Homepage — `layouts/index.html` (new, project-level override)

```
hero
marquee band          ← all 10, continuous horizontal scroll, CSS-only
cards grid            ← all 10
deep section × 5      ← tier == flagship, each with its own SectionToy field
identity
closing
```

The template's job is to emit the `#site-copy-data` JSON blob that the React
surface reads, plus the static fallback. It ranges over `games.json` instead of
naming section keys by hand.

**The marquee is CSS-only and lives in this repo's `static/css/`.** The homepage
renders a Hugo fallback and then hydrates React over it; a React marquee would
pop in on hydration, a CSS marquee renders identically before and after.

### Games page — `layouts/_default/games.html` (new, project-level)

The compact list: one row per game, each carrying its own motif graphic tracking
horizontally across the row on its own timing. Selected via `layout: games` in
the front matter of `content/games.md`.

`content/games.md` keeps its front matter and **loses its hand-written prose
body** — approved; the prose duplicated the descriptions.

`/games/` is static Hugo with no React shell, so its graphics are plain CSS/SVG.

### Lab — `lab/src/app/site-copy.ts`

Becomes **generated** from `games.json` by a script under `scripts/`, with a CI
check that fails on a stale committed copy. This closes the existing drift.

## Shared design system changes (`../scanlines-system`)

1. **`src/atmosphere/site/site-copy-loader.ts`** — `SiteSurfaceSections` changes
   from a fixed record to
   `Array<{ id, kicker, title, body, href?, linkLabel?, motif, variant, ariaLabel }>`,
   with the validator checking array membership instead of named keys.
2. **`src/atmosphere/site/site-app.tsx`** — the hardcoded `warp` / `dice` /
   `taybols` blocks collapse into one `.map()` over that array. `signal`,
   `projects`, `identity`, and `closing` stay as they are; they are not games.
3. **`src/atmosphere/station/station-toys.tsx:5`** — `SectionEffectId` stops
   being a closed union of undef.games product names and becomes `string`.
   `SectionToyEffect` stays a closed union — it names real stylesheets — and
   gains `'grove'` and `'haiku'`.
4. **`src/atmosphere/section-toys/grove.css`, `haiku.css`** — new, one per new
   flagship motif, following the existing per-effect stylesheet pattern.
5. **`src/atmosphere/station/theme-state.ts:42`** — `DEFAULT_SECTION_EFFECTS`
   gains `grove` and `haiku` defaults.

Consumed as `file:../../scanlines-system`, so this lands first with a version
bump. `make sync-scanlines` then refreshes the vendored theme here.

## Motifs

Ten motifs, seven newly designed.

| motif | status | design |
|---|---|---|
| `warp` | exists | Diamond core with warp streaks pulling past it |
| `dice` | exists | Tumbling pip cube, eased so it lands rather than spins |
| `taybols` | exists | Table rows lighting one at a time — a roll landing |
| `grove` | **new** | Branching tree with commit nodes orbiting the limbs |
| `haiku` | **new** | Three lines in 5–7–5 proportion, settling in sequence |
| `becoming` | **new** | Sun clearing the horizon |
| `proverb` | **new** | Slow compass ring |
| `stoke` | **new** | A spark catching and flaring |
| `currents` | **new** | One continuous sumi-e brushstroke with water running along it |
| `amor` | **new** | Two touches alternating on one shared crystal |

Two independent implementations:

| Surface | Where | Technology | Motifs |
|---|---|---|---|
| Homepage deep sections | `../scanlines-system/src/atmosphere/section-toys/` | CSS per effect | `grove`, `haiku` — 2 new |
| `/games/` rows, marquee tiles | this repo, `static/css/` + `layouts/partials/` | CSS/SVG | **all 10** |

The CSS/SVG side needs all ten: `warp`, `dice`, and `taybols` exist today only
as section-toy stylesheets driven by React-generated spans, which `/games/`
cannot use. Their `/games/` glyphs are simpler — a small mark on a list row, not
a full-bleed field. **7 motifs to design, 12 implementations total.**

### Reduced motion

Every animated surface — marquee, `/games/` row sprites, deep-section fields —
carries a `@media (prefers-reduced-motion: reduce)` branch that freezes to a
static composed frame.

## Testing

**Unit — `vitest.config.ts` (root, 100% coverage gate on `themes/scanlines/assets/ts/`)**

The root vitest project currently only includes
`themes/scanlines/assets/ts/**/*.test.ts`, which is vendored. New site-owned TS
(the schema validator, the generator) needs its `include` widened to cover
`scripts/` and any new local module, with matching `coverage.include`.

- `games.json` schema: required fields present; every `flagship` has a complete
  `section` and a `variant`; no `listed` has a `section`; `tag` values unique;
  every `motif` resolves.
- Generator: regenerating `lab/src/app/site-copy.ts` produces no diff.

**Lab — `npm --prefix lab run test:run` (100% coverage gate)**

`lab/src/app/site-copy.test.ts` asserts the current three-product shape and will
need updating to the generated ten-game shape.

**End-to-end (Playwright)**

Existing assertions to update:

- `tests/e2e/site.spec.ts:46-48` — Taybols href → `https://taybols.com`
- `tests/e2e/logo-lab.spec.ts:175` — same
- `tests/e2e/site.spec.ts:100-110` — saved-theme `sectionEffects` fixture gains
  `grove` and `haiku`

New assertions:

- Homepage renders 10 cards, a marquee containing all 10 labels, exactly 5 deep
  sections
- `/games/` renders 10 rows, each with a motif graphic
- Every `href` in `games.json` appears on both pages
- Under `prefers-reduced-motion: reduce`, no element reports a running animation
- **Homepage is not blank** — a direct regression guard on the fail-closed
  validator

## Build sequence

1. **`scanlines-system` PR** — generalize `site-copy-loader.ts` and
   `site-app.tsx`; `SectionEffectId` → `string`; add `grove`/`haiku` to
   `SectionToyEffect`, `DEFAULT_SECTION_EFFECTS`, and two new section-toy
   stylesheets. Version bump, release.
2. **`make sync-scanlines`** here; confirm `make check-scanlines` passes.
3. **`data/site/games.json`** + schema test.
4. **Project-level `layouts/`** — `index.html` override, `_default/games.html`,
   motif partials, marquee; strip prose from `content/games.md`; `static/css/`
   for marquee, rows, all ten glyphs, reduced-motion branches.
5. **Generator** for `site-copy.ts` + CI staleness check; update the lab test.
6. **E2E** — update three assertions, add the new ones.
7. **Gate and deploy** — `make test`, `make test-assets`, `make typecheck`,
   `make typecheck-assets`, `make e2e`, `make check-scanlines`, then
   `make deploy`.

Steps 3 and 5 do not depend on step 1. Step 4's deep sections do.

## Risks

**Fail-closed validator blanks the homepage.** If the Hugo `$siteCopy` shape and
`site-copy-loader.ts` disagree, the homepage silently renders empty. Mitigation:
step 1 lands and syncs before step 4 touches the blob, and the E2E suite gets an
explicit not-blank assertion.

**Four sites share the theme.** Any change that lands in
`../scanlines-system/hugo/scanlines/` reaches tradewars, eisonline, and bbs.
Mitigation: nothing game-specific goes there — the generalization removes
undef.games names from the shared package rather than adding more.

**Cross-repo release lag.** If the `scanlines-system` release slips, ship Grove
and haiku.to as `tier: "listed"` first — they still appear in the marquee,
cards, and `/games/` — and promote them when it lands.

**Two motion systems on one page.** Marquee and section fields can compete.
Mitigation: thin band, small glyphs, slow constant rate; opacity and rate are
the tuning knobs if it reads busy.

**Page length.** Five deep sections is a third longer than three. Accepted; the
marquee gives an immediate overview.
