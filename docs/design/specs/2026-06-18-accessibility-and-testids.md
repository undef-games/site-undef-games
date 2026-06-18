# Accessibility and Test ID Standardization

## Goal

Make the shared scanlines shell, auth flows, and account portal consistently accessible and consistently testable across `undef-logos`, `undef-auth`, and `undef-account`.

## Scope

This pass covers:

- ARIA and semantic fixes for shared shell widgets
- explicit form labeling and error-state wiring in auth
- grouped-control semantics and stable test hooks in account
- a standardized `data-testid` naming convention
- a simple flag-based mechanism to enable or disable `data-testid` emission per surface

This pass does not attempt a larger IA rewrite or a redesign of the widgets themselves.

## Source of Truth

The shared contract starts in `undef-logos` and is consumed by `undef-auth` and `undef-account`.

- Shared naming convention: `surface-element-action`
- Shared semantics expectations:
  - landmarks where appropriate
  - explicit labels for form controls
  - associated errors and invalid state
  - button state exposed when controls toggle or remain selected
- Shared testability expectations:
  - semantic queries first
  - `data-testid` only for repeated controls, visual-only widgets, unstable text, or cross-surface integration points

## Test ID Contract

### Naming

Every emitted test id uses:

- `site-theme-toggle`
- `site-login-link`
- `site-lab-link`
- `auth-login-form`
- `auth-login-email`
- `auth-login-password`
- `auth-login-submit`
- `auth-back-button`
- `auth-scanline-field`
- `account-nav-security`

The names are stable identifiers, not presentation strings.

### Emission Policy

`data-testid` emission is controlled by a simple flag per surface.

Recommended contract:

- enabled in development
- enabled in staging and test environments
- configurable in production

The implementation must use a tiny helper instead of handwritten branching in every template or component.

Per repo:

- `undef-logos` Hugo/templates: helper or template conditional
- `undef-auth` worker HTML templates: helper function returning either ` data-testid="..."` or `""`
- `undef-account` React: helper prop function returning `{ "data-testid": value }` or `{}`

## Accessibility Requirements

### Shared Shell

The shared shell needs a consistent accessibility baseline:

- branded home link remains a normal anchor with an accessible name
- theme toggle exposes current state, not only a changing label
- grouped utility controls use meaningful grouping semantics
- current-page navigation continues to use `aria-current="page"`
- decorative marks remain hidden from assistive tech

### Auth

Auth is the highest-priority accessibility surface because it contains required user input.

Requirements:

- all user-editable form controls get stable `id`s
- every form control has an explicit visible or programmatic label tied with `for`
- placeholders remain hints, not the only accessible name
- per-field errors are associated using `aria-describedby`
- invalid fields expose `aria-invalid="true"` when relevant
- password toggle exposes:
  - `aria-label`
  - `aria-pressed`
  - `aria-controls`
- auth back button keeps button semantics and a stable accessible name
- auth scanline field remains non-essential decoration from an accessibility standpoint

### Account

Account already has better semantics than auth, but it is inconsistent.

Requirements:

- generic labeled `div`s that act as grouped controls use `role="group"` where appropriate
- primary account navigation retains a clear `aria-label`
- theme/swatch controls expose stable state and test hooks
- auth-error and loading states have stable selectors and semantic status output

## Testing Expectations

Tests should prefer semantic queries first:

- `getByRole`
- `getByLabelText`
- `getByText`

`data-testid` should be used only when semantics are weak or intentionally visual:

- scanline canvases/fields
- repeated swatches
- route-specific shared shell affordances
- duplicated buttons whose text is not unique

Each repo should add or update tests to validate:

- explicit label wiring
- error association
- toggle state exposure
- presence or absence of `data-testid` under the flag

## Repo Breakdown

### `undef-logos`

Owns the shared shell contract:

- theme toggle state semantics
- grouped utility semantics
- shared `data-testid` helper pattern for site shell controls

### `undef-auth`

Owns the auth input surface:

- explicit form labels
- per-field error wiring
- password toggle accessibility
- auth shell test hooks
- auth scanline field test hook

### `undef-account`

Owns the authenticated app shell:

- grouped-control semantics
- stable test hooks for nav, theme controls, auth-error CTAs, and primary actions

## Non-Goals

This work does not:

- remove all production `data-testid` permanently
- redesign auth/account layouts
- replace semantic queries with test ids everywhere
- add ARIA where native HTML already provides the right semantics

## Success Criteria

This work is complete when:

- auth forms are explicitly labelled and error-associated
- shared shell controls expose meaningful state
- account grouped controls are semantically normalized
- stable `surface-element-action` test ids exist for key controls
- test id emission is controlled by a simple flag per surface
- updated tests prove both the accessibility contract and the test-id contract
