# undef-logos Agent Guide

## Project

`undef-logos` is the interactive logo and landing-page lab for `undef games`.
It is a Vite + React app using PixiJS for the main signal field and CSS for the
right rail, product sections, section toys, and scanline overlays.

The current canonical design notes live in:

- `docs/design/specs/initial-style-guide.md`
- `docs/design/specs/2026-06-13-undef-logos-design.md`
- `docs/design/specs/2026-06-14-static-station-id.md`

Treat `initial-style-guide.md` as the active baseline before making visual
changes.

## Commands

Run commands from this directory:

- `npm run dev` starts local Vite development.
- `npm run build` runs TypeScript project build and Vite production build.
- `npm run typecheck` runs TypeScript checks without emitting files.
- `npm run test:run` runs Vitest once.
- `npm run e2e` builds and runs Playwright tests.
- `npm run deploy` builds and deploys `dist` to Cloudflare Pages project
  `undef-logos` on branch `main`.

Playwright starts a local preview server. If a sandbox blocks binding to
`127.0.0.1:4173`, rerun the Playwright command with the normal local-server
approval path instead of changing app ports or tests.

## Source Layout

- `src/app/app-shell.tsx` owns the landing-page structure, right rail state,
  preset state, scanline-layer state, and section ordering.
- `src/station/effects-config.ts` owns effect presets, CSS variable creation,
  light/dark tone detection, and baseline effect values.
- `src/station/effects-controls.tsx` owns the right-rail effects UI.
- `src/station/station-signal-scene.tsx` owns the PixiJS signal-field renderer.
- `src/station/station-toys.tsx` owns channel controls, scope visuals, product
  section background toys, and section effect variants.
- `src/station/station-identity.tsx` owns the Maze Gate U Cut mark and identity
  lockups.
- `src/styles/*.css` are split by purpose. Keep new styles in the closest
  purpose-specific file instead of expanding unrelated CSS files.
- `tests/e2e/logo-lab.spec.ts` is the main rendered-behavior regression suite.

## Design Baseline

- The saved mark is the Maze Gate U Cut.
- The mark belongs in the lockup/identity rail and as a dim frosted background
  presence only. Do not put a hard logo symbol in the center of the hero canvas.
- The first preset, `Current baseline`, must preserve the current baseline look.
  Other presets may explore, but they must not silently change the baseline.
- The right rail is part of the design system. Keep it dense, operational, and
  readable. It is not a generic floating settings card.
- Product examples should remain concrete: WARP, Undef Dice, and Taybols.
- Section background toys should stay behind text, remain bright enough to read
  as intentional, and keep fixed fragment sizes while moving.

## Scanline And Overlay Rules

- The page scanline field should read as one continuous background field through
  the whole page. Do not recenter a scanline band on the browser viewport.
- `Graph paper layer` is the saved old two-axis grid/checker overlay. It should
  not be renamed back to CRT.
- `CRT monitor layer` should look like a monitor surface: horizontal scanlines,
  subtle vignette/phosphor behavior, and no strong graph-paper vertical grid.
- `Glitch scanline layer` is an accent layer and must remain independently
  combinable with Graph paper and CRT.
- Scanline layer controls must remain readable on both light and dark presets.

## Testing Expectations

For visual or interaction changes, run the narrowest relevant Playwright test
first, then run broader checks before claiming the work is complete.

Minimum checks for most UI changes:

- `npm run typecheck`
- `npm run test:run`
- relevant `npx playwright test ...` focused test

Run full `npm run e2e` before deployment or when changing shared interaction,
layout, presets, scanline layers, section toys, or Pixi behavior.

When updating labels, controls, CSS variables, or baseline colors, update the
E2E assertions that protect those decisions. Avoid weakening tests just to make
visual changes pass.

## Deployment

Deploy from `main` with:

```sh
npm run deploy
```

After deployment, verify `https://logos.undef.games` loads the new build. If the
Cloudflare command reports a preview URL and a custom-domain deployment, include
the custom domain in the final status.

## Git

Keep changes scoped to this repo. Do not edit neighboring worktrees unless the
user explicitly redirects you. Before committing or deploying, check:

```sh
git status --short
```

Do not revert unrelated user changes. If unexpected files appear, inspect them
before deciding whether they belong to the current task.
