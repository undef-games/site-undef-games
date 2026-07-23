# Games roster expansion and per-game motifs

**Date:** 2026-07-23
**Status:** Approved, ready for implementation planning

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
`lab/src/app/site-copy.ts:29`. Going from three games to ten multiplies that
hazard.

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
README, so the roster speaks in the projects' own words.

**Deliberately excluded:** `bbs.undef.games` (a directory, not a game),
`quotable.to` (parked domain), `quotable` (backend service, not player-facing),
`ugrow` and `vim-adventures` (design notes only, nothing shipped).

**Naming:** the `.to` apps are labeled as bare domains — `amor.to`, not `Amor`.
The domain is the product name.

## Data model

A new `data/site/games.json` is the single source of truth. The snippet below
shows the **shape** — one flagship and one listed entry, with prose elided. The
roster table above is authoritative for the actual copy.

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

**Fields.** `tag` is the stable identifier and CSS-class suffix. `tier` is
`flagship` or `listed`. `label`, `href`, and `description` render the card, the
marquee tile, and the `/games/` row. `motif` names the graphic and is consumed
by both the React and the CSS renderers. `section` carries the deep-section copy
and is **required on `flagship`, absent on `listed`**.

**Tier behavior.**

| Surface | flagship | listed |
|---|---|---|
| Homepage marquee tile | yes | yes |
| Homepage card | yes | yes |
| Homepage deep section | yes | no |
| `/games/` row | yes | yes |

`data/site/home.json` keeps only the non-game content: `hero`,
`products_intro`, `identity`, `signal`, `closing`. Its `products` array and its
`warp` / `dice` / `taybols` keys are removed — that content moves to
`games.json`.

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

## Page structure

### Homepage (`themes/scanlines/layouts/index.html`)

```
hero
marquee band          ← all 10, continuous horizontal scroll, CSS-only
cards grid            ← all 10
deep section × 5      ← tier == flagship, each with its own SectionToy field
identity
closing
```

Today the file names five section dicts by hand at `index.html:37-50` to build
the `$siteCopy` blob for React hydration. Those collapse into a `range` over
`games.json` filtered by tier.

**The marquee is CSS-only and lives in the theme.** The homepage renders a Hugo
static fallback and then hydrates React over it. A React marquee would pop in on
hydration; a CSS marquee renders identically before and after.

### Games page (`themes/scanlines/layouts/games.html`, new)

The compact list: one row per game, each carrying its own motif graphic tracking
horizontally across the row on its own timing and duration. Ten rows, scannable,
no full-height sections.

`content/games.md` keeps its front matter (`title`, `kicker`, `description`) and
**loses its hand-written prose body** — the list is generated from `games.json`.
This is intentional and approved; the prose duplicated the descriptions.

`/games/` is a static Hugo page with no React shell, so its graphics must be
plain CSS/SVG. It cannot use the React `SectionToy` components.

### Lab (`lab/src/app/site-copy.ts`)

Becomes a **generated file**. A script under `scripts/` emits it from
`games.json`; a CI check regenerates and fails on any diff. This is what closes
the existing drift.

## Motifs

Ten motifs, seven of them new. Each is derived from what the project actually
does.

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

Motifs are needed in two independent forms:

| Surface | Technology | Motifs needed |
|---|---|---|
| Homepage deep sections | React `SectionToy`, in `../scanlines-system` | `grove`, `haiku` — 2 new |
| `/games/` rows, marquee tiles | CSS/SVG partials in the Hugo theme | **all 10** |

Only the two new flagships need React toys, because only flagships get deep
sections and the three existing flagships already have theirs.

The CSS/SVG side needs all ten, not just the seven new ones. `warp`, `dice`, and
`taybols` exist today **only** as React `SectionToy` components, and neither
`/games/` nor the CSS marquee can call React. So those three need CSS/SVG ports
alongside the seven new designs: **7 motifs to design, 10 to implement in
CSS/SVG.** The ports should read as the same mark as their React counterparts,
but they are simpler — a small glyph on a list row, not a full-bleed field.

### Cross-repo dependency

`SectionEffectId` and `SectionToyEffect` are closed unions in the sibling
repository at
`../scanlines-system/src/atmosphere/station/station-toys.tsx:4-5`:

```ts
export type SectionToyEffect = 'bars' | 'crt' | 'dice' | 'frames' | 'notes'
  | 'rails' | 'rungs' | 'scatter' | 'slab' | 'taybols' | 'tumble' | 'warp'
export type SectionEffectId = 'dice' | 'identity' | 'projects' | 'signal'
  | 'taybols' | 'warp'
```

Both gain `'grove'` and `'haiku'`. This cannot be done from this repository.
`scanlines-system` is consumed as `file:../../scanlines-system`, so it needs its
own pull request, a version bump, and a release **landed first**; this repo then
picks it up on rebuild.

Adding a game to `games.json` with `tier: "listed"` requires no
`scanlines-system` change at all. Only promoting a game to `flagship` does.

### Reduced motion

Ten simultaneous animations on one page is an accessibility problem. Every
animated surface — marquee, `/games/` row sprites, deep-section fields — carries
a `@media (prefers-reduced-motion: reduce)` branch that freezes it to a static
composed frame. The graphic still reads as that game's mark; it just does not
move.

## Testing

**Unit (Vitest)**

- `games.json` schema: every game has `tag`, `tier`, `label`, `href`,
  `description`, `motif`; every `flagship` has a complete `section`; no `listed`
  has one; `tag` values are unique; every `motif` resolves to a defined graphic.
- Generator: regenerating `lab/src/app/site-copy.ts` from `games.json` produces
  no diff against the committed file.

**End-to-end (Playwright)**

Existing assertions to update:

- `tests/e2e/site.spec.ts:46-48` — Taybols href becomes `https://taybols.com`.
- `tests/e2e/logo-lab.spec.ts:175` — same.
- `tests/e2e/site.spec.ts:100-110` — the saved-theme `sectionEffects` fixture
  gains `grove` and `haiku` keys.

New assertions:

- Homepage renders 10 cards and a marquee band containing all 10 labels.
- Homepage renders exactly 5 deep sections.
- `/games/` renders 10 rows, each with a motif graphic.
- Every `href` in `games.json` appears on both pages.
- Under `prefers-reduced-motion: reduce`, no element reports a running
  animation.

## Build sequence

1. **`scanlines-system` PR** — add `grove` and `haiku` to both unions, implement
   the two `SectionToy` renderers, bump version, release.
2. **`data/site/games.json`** — author all ten entries; add the schema test.
3. **Hugo templates** — rewrite `index.html` to range over `games.json`; add
   `layouts/games.html`; strip the prose from `content/games.md`; add all ten
   CSS/SVG motif partials (seven new designs plus CSS ports of `warp`, `dice`,
   `taybols`); add the CSS marquee; add reduced-motion branches.
4. **Generator** — `scripts/` emitter for `site-copy.ts` plus the CI staleness
   check.
5. **E2E** — update the three existing assertions, add the new ones.
6. **Gate and deploy** — full CI (`make test`, `make typecheck`, `make e2e`),
   then `make deploy`.

Step 1 blocks step 3's deep sections. Steps 2 and 4 are independent of step 1.

## Risks

**Two motion systems on one page.** The marquee and the deep-section fields both
animate and can compete for attention. Mitigation: the marquee is a thin band
with small glyphs and a slow constant rate; the section fields are low-opacity
and behind text. If it still reads as busy after step 3, the marquee's opacity
and rate are the tuning knobs.

**Cross-repo release lag.** If the `scanlines-system` release slips, the two new
deep sections cannot render their motifs. Fallback: ship Grove and haiku.to as
`tier: "listed"` first — they still appear in the marquee, cards, and `/games/`
list — and promote them to `flagship` when the release lands.

**Page length.** Five deep sections is a third longer than today's three.
Accepted; the marquee gives an immediate overview so a visitor never has to
scroll the sections to see the full roster.
