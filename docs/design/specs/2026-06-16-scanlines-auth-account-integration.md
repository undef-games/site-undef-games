# Scanlines Auth and Account Integration

## Goal

Make `packages/scanlines-system` the shared source of truth for the public site, auth surface, and account surface.

The end state is:

- `undef.games` remains the flagship public site
- `auth.undef.games` and `account.undef.games` use the same design system
- shared tokens, shell, header, controls, and scanline treatment live in `scanlines-system`
- auth and account keep their own product logic and routes, but stop owning their own visual system

## Problem

Right now the visual system is split across three places:

1. `undef-logos`
   - owns the main site and the evolving scanlines system
   - now owns `packages/scanlines-system`

2. `undef-auth`
   - has inline HTML/CSS generation in `src/ui.ts`
   - already mirrors scanline colors and auth primitives, but in a duplicated form

3. `undef-account/frontend`
   - has a more complete portal CSS surface in `src/styles.css`
   - has its own `theme.ts` that reads `undef-logos-theme`

That gives us duplication in:

- token definitions
- theme hydration logic
- header/brand mark treatment
- button, panel, and form styling
- scanline overlays and motion policy

The current state is visually close, but structurally wrong. The account and auth surfaces are consuming the same brand ideas through copied code instead of a shared system.

## Product Direction

### Shared design language

All three surfaces should feel like the same product family:

- same `ug` mark
- same mono/system typography pairing
- same signal palette behavior
- same scanline field language
- same button, panel, and form primitives
- same motion vocabulary

### Different surface intensity

The surfaces should not be equally loud.

- `undef.games`
  - full flagship treatment
  - richest scanline motion and atmosphere

- `auth.undef.games`
  - same shell and header language
  - simpler task-focused pages
  - minimal motion during login, reset, MFA, and consent flows

- `account.undef.games`
  - same shell and top header
  - same scanline/tone system
  - less sugar than the public site
  - stronger emphasis on clarity and account operations

## Information Architecture

### Public site

`undef.games` keeps the public top navigation:

- `Games`
- `Logs`
- `About`
- account/login state on the right

### Auth host

`auth.undef.games` remains a dedicated auth origin.

It should:

- use the shared header shell
- keep branding identical
- include a `Back to site` affordance
- avoid marketing navigation during focused auth tasks

Reason:

- cleaner operational and security boundary
- less brittle than overlay-driven auth
- better for email links, resets, MFA, consent, and provider redirects

### Account host

`account.undef.games` uses the same header system, but a different nav model:

- account-native sections in primary nav
  - `Overview`
  - `Profile`
  - `Security`
  - `Sessions`
  - `Apps`
  - or equivalent final labels
- `Back to site` as a clear utility route
- logged-in identity/menu on the right

This keeps player orientation while making the account surface task-driven instead of marketing-driven.

## Source of Truth

`packages/scanlines-system` becomes the visual source of truth for all shared UI system pieces.

It should own:

- theme tokens
- tone variants
- theme hydration and storage contract
- scanline field primitives and background treatments
- shared header shell
- brand mark
- nav primitives
- buttons
- panels
- form controls
- notice/alert states
- account/auth shell variants

It should not own:

- auth business logic
- account data-fetching logic
- OAuth/OIDC flow logic
- per-product route definitions
- server-rendered HTML structure that is specific to one service

## Package Structure

The shared package should expand beyond the current site/station/theme split.

### Theme

- `packages/scanlines-system/src/theme/`
  - token definitions
  - tone resolution
  - storage key contract
  - hydration helpers
  - CSS variable application

### Shell

- `packages/scanlines-system/src/shell/`
  - top header
  - brand mark
  - nav primitives
  - utility actions
  - shell variants for `site`, `auth`, and `account`

### Primitives

- `packages/scanlines-system/src/primitives/`
  - button styles and variants
  - panels
  - notices
  - inputs
  - textareas
  - chips/pills
  - field group patterns

### Station / Scanlines

- `packages/scanlines-system/src/station/`
  - existing scanline/station runtime
  - quieter presets/variants for auth/account surfaces

### Styles

- `packages/scanlines-system/src/styles/`
  - base shared CSS
  - shell CSS
  - primitive CSS
  - optional surface-variant CSS hooks

## Integration Model

### `undef.games`

Continues to consume the shared package through the Hugo theme and lab integration already established.

### `undef-auth`

`undef-auth` should stop owning a long inline CSS string as its primary UI system.

Instead:

- shared CSS and markup helpers should come from `scanlines-system`
- `undef-auth` should render auth page templates using shared shell/primitives
- auth-specific templates remain in `undef-auth`, but composed from shared pieces

Likely shape:

- shared template helpers emitted by `scanlines-system`
- or shared HTML fragment builders used by `undef-auth`

The key rule is that `undef-auth` stops being the owner of button/panel/form/header styling.

### `undef-account`

`undef-account/frontend` should stop owning its own theme module and CSS definitions as source-of-truth.

Instead:

- import shared theme hydration and token helpers from `scanlines-system`
- import shared shell/primitives styles from `scanlines-system`
- keep account-specific layout and feature components local
- map account workflow components onto shared primitives instead of local CSS lookalikes

## Motion Policy

The public site is allowed to be richer.

Auth and account surfaces should inherit the same motion system but use more restrained defaults:

- slower or reduced scanline intensity
- less decorative section motion
- fewer experimental toy layers
- minimal movement near credential entry
- no motion that interferes with readability or input focus

The package should support this through surface variants, not through copy-pasted CSS forks.

## Theme Persistence Contract

The `undef-logos-theme` persistence contract remains shared.

That contract should be implemented once in `scanlines-system` and consumed by:

- `undef.games`
- `undef-auth`
- `undef-account`

This preserves:

- tone continuity across hosts
- palette continuity across hosts
- one storage model instead of service-local adapters

## Accessibility and UX Constraints

Shared visual identity cannot compromise auth/account usability.

Required constraints:

- contrast must remain strong on all auth/account forms
- field focus states must be more important than decorative motion
- error states must be immediate and legible
- account navigation must be clearer than public-site mood
- `Back to site` must be easy to discover
- auth tasks must not be blocked or obscured by interactive background behavior

## Migration Strategy

### Phase 1: extract the shared design vocabulary

Move the duplicated auth/account theme pieces into `scanlines-system`:

- tokens
- base CSS variables
- header shell treatment
- panel/input/button patterns
- scanline background defaults for quieter surfaces

### Phase 2: define surface variants

Add explicit shared variants:

- `site`
- `auth`
- `account`

Each variant should resolve:

- nav model
- motion profile
- shell density
- accent intensity

### Phase 3: migrate `undef-account`

This is the better first consumer because it is already a React/Vite frontend.

Replace:

- local `theme.ts`
- local source-of-truth CSS tokens
- duplicated brand/header primitives

with package imports.

### Phase 4: migrate `undef-auth`

Replace inline auth page CSS ownership with shared package ownership.

Keep auth route logic local, but compose the visual shell from shared system pieces.

### Phase 5: unify verification

Add verification that:

- shared design changes render correctly on all three hosts
- auth/account no longer define conflicting token ownership
- shared storage contract stays compatible

## Testing Expectations

Required verification for this integration:

- unit tests for shared theme/token helpers
- build verification in `undef-logos`
- build/typecheck verification in `undef-account/frontend`
- typecheck/test verification in `undef-auth`
- browser verification for representative auth/account pages
- cross-host theme persistence checks where feasible

## Non-Goals

This work does not attempt to:

- merge the three repos
- move auth/account business logic into `undef-logos`
- make account navigation identical to public-site navigation
- collapse auth into an in-page modal flow

## Success Criteria

This work is successful when:

- `scanlines-system` is the clear source of truth for shared visual behavior
- `undef-auth` and `undef-account` stop owning duplicate scanline theme definitions
- all three hosts feel like the same product family
- auth/account remain cleaner and quieter than the public site
- future changes to shared shell/primitives/tokens happen once, not three times
