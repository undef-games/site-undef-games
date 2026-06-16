# Scanlines System Architecture

## Goal

Move production site JavaScript and TypeScript ownership out of `lab/` and into a reusable shared package, while keeping the lab as a separate Vite application.

The end state is:

- Hugo theme owns production entrypoints
- shared runtime logic lives in `packages/scanlines-system`
- `lab/` contains only lab-specific UI and tuning workflows
- other `*.undef.games` Hugo sites can consume the same theme and shared system without importing from `lab/`

## Problem

The current structure mixes two concerns:

1. `themes/scanlines/` is the Hugo theme and should own the production site surface
2. `lab/src/` still contains production-facing runtime code such as:
   - site bootstrap
   - site shell
   - shared scanline scene logic
   - theme persistence logic

That creates the wrong dependency direction:

- production Hugo site depends on `lab/`
- experimental lab code acts as a source of truth for site behavior

This is not maintainable for a shared internal theme.

## Decision

Create a shared package:

- `packages/scanlines-system`

Keep the lab as a separate application:

- `lab/`

Make Hugo production entrypoints thin wrappers:

- `themes/scanlines/assets/ts/`

## Target Structure

### Shared system

- `packages/scanlines-system/src/site/`
  - shared site shell
  - Hugo payload reader
  - site bootstrap helpers

- `packages/scanlines-system/src/station/`
  - scanline scene
  - renderer
  - scanline engine
  - shared interaction policy

- `packages/scanlines-system/src/theme/`
  - theme state
  - persistence contract
  - theme hydration helpers

- `packages/scanlines-system/src/styles/`
  - shared runtime styles used by site and lab

- `packages/scanlines-system/src/index.ts`
  - explicit exports only

### Hugo theme

- `themes/scanlines/assets/ts/site.ts`
  - mounts the shared site runtime into the Hugo DOM

- `themes/scanlines/assets/ts/theme-hydrate.ts`
  - either stays as a thin entrypoint or moves to shared theme code with a thin wrapper here

- `themes/scanlines/layouts/`
  - remains Hugo-owned

- `themes/scanlines/static/css/`
  - remains Hugo-owned for theme chrome and static site CSS

### Lab

- `lab/src/`
  - lab-only controls
  - presets authoring
  - experimental UI
  - imports shared logic from `packages/scanlines-system`

## Ownership Rules

### Production-owned by Hugo theme

These stay under `themes/scanlines/`:

- layouts
- partials
- static CSS for theme chrome and baseline page framing
- Hugo-specific TS entrypoints

### Shared-owned by system package

These move out of `lab/src/`:

- `app-shell.tsx`
- `site-main.tsx`
- `site-copy-site.ts`
- station scene / renderer / engine
- theme persistence and shared state
- shared runtime styles

### Lab-only

These remain in `lab/src/`:

- effects control panels
- compare trays
- prompt panels
- concept rails
- logo exploration and generation UI
- lab-specific app root and routes

## Dependency Direction

Allowed:

- Hugo entrypoints -> `packages/scanlines-system`
- lab app -> `packages/scanlines-system`

Not allowed:

- Hugo theme -> `lab/`
- shared system -> `lab/`
- shared system -> Hugo layouts

The shared system may know about the `site-copy-data` payload contract, but it should not know about Hugo templates directly.

## Theme State Model

The persisted theme contract remains shared:

- localStorage key stays consistent across site and lab
- lab writes theme state
- Hugo site reads and applies theme state

The persistence implementation should live in:

- `packages/scanlines-system/src/theme/`

Hugo should consume it through a thin entrypoint, not by importing from `lab/src`

## Build Model

### Desired build flow

1. Hugo builds the site HTML into `public/`
2. shared TS is compiled through the site and lab entrypoints
3. site-facing built assets are emitted for Hugo pages
4. lab assets are emitted separately for `/lab/`

### Desired source model

- production source files are never located under `lab/`
- `lab/` is a consumer of shared code, not a supplier of production code

## Migration Strategy

### Phase 1: establish package

Create `packages/scanlines-system` with package metadata, TS config, and explicit exports.

### Phase 2: move shared runtime

Move shared site, station, theme, and shared-style modules out of `lab/src` into `packages/scanlines-system/src`

Keep import-compatible wrappers temporarily if needed to reduce churn.

### Phase 3: thin Hugo entrypoints

Replace Hugo imports of lab-owned code with theme-owned entrypoints under:

- `themes/scanlines/assets/ts/`

Those entrypoints should import from `packages/scanlines-system`.

### Phase 4: slim lab

Remove production-owned modules from `lab/src` and leave only lab-specific UI plus imports from shared code.

### Phase 5: verification

Verify:

- `undef.games` still builds and runs
- `/lab/` still builds and runs
- theme persistence still crosses between lab and site
- Hugo no longer depends on `lab/` source files

## Testing Expectations

Keep and adapt tests at the correct boundary:

- shared runtime tests move with the shared modules
- Hugo e2e tests remain at repo level
- lab-only tests stay in `lab/`

Required verification before completion:

- shared runtime unit tests
- lab build
- Hugo/site build
- focused e2e for site surface
- focused e2e for `/lab/`

## Non-Goals

This migration does not by itself:

- redesign the public site
- remove the separate lab application
- replace Hugo
- change the persisted theme key
- publish `scanlines` as a public external theme

## Recommendation

Proceed with:

- `packages/scanlines-system`
- Hugo-owned production entrypoints in `themes/scanlines/assets/ts`
- separate `lab/` app as a consumer

This gives the cleanest long-term internal architecture for multiple `*.undef.games` sites without forcing the lab to become the source of production behavior.
