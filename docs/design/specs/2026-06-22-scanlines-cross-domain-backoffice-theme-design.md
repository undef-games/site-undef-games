# Scanlines Cross-Domain Backoffice Theme

## Goal

Apply the full scanlines visual treatment to the backoffice frontends and unify
**every HTML-rendering `*.undef.games` surface onto one shared theme runtime and
one cross-domain cookie**, so a visitor's theme choice (tone + palette) follows
them as they move between domains.

Backoffice frontends in scope:

- `undef-admin/frontend` — operator console (net-new theming)
- `undef-account/frontend` — account portal (migrate + turn on full treatment)
- `undef-account-linked/frontend` — linked-account portal (bring up to full)

This extends three prior specs and is, in large part, **finishing and repairing**
the architecture they already decided:

- `docs/design/specs/2026-06-16-scanlines-system-architecture.md` — `scanlines-system`
  is the single source of truth; theme persistence lives in `src/theme/`.
- `docs/design/specs/2026-06-17-auth-account-shared-shell.md` — sync/vendor is the
  chosen integration model; surfaces differ by config, not forks.
- `docs/design/specs/2026-06-15-hugo-shared-runtime.md` — Hugo bootstraps the shared
  runtime rather than reimplementing it.

## Problem

The cross-domain promise is currently broken because the theme/cookie engine is
**not actually shared**. Four divergent implementations exist:

1. `packages/scanlines-system/src/theme/{persistence,hydrate}.ts` — the most
   complete; cookie + localStorage aware. Used only by lab/site.
2. `themes/scanlines/assets/ts/theme-hydrate.ts` — a near-duplicate that reads and
   writes **localStorage only**, ignores the cookie, and ships different default
   colors. The flagship `undef.games` therefore never participates in cross-domain
   theming. **This is a regression** from the architecture spec, which requires the
   persistence implementation to live in `src/theme/` with a thin Hugo wrapper.
3. `undef-account/frontend/src/theme.ts` — a hand-rolled partial reimplementation
   (cookie-aware, but only a subset of palette fields, its own color picker).
4. `undef-account-linked/frontend` — a simpler variant of the same idea.

`undef-admin/frontend` has no theming at all (plain `styles.css`). Vendored copies
of the shell already diverge from source, and nothing prevents further drift.

## Scope

### In scope

- Consolidate the theme/cookie runtime to a single source of truth in
  `packages/scanlines-system/src/theme/`.
- Add a framework-agnostic FOUC boot artifact usable by React **and**
  server-rendered surfaces.
- Extend the existing surface-config model with an `admin` surface and a
  `shell-admin.css`.
- Define a bounded, curated **vendor surface** plus drift-proof **pull-sync**
  tooling (push variant deferred).
- Integrate full visual treatment into `undef-admin`, `undef-account`,
  `undef-account-linked`.
- Repair the Hugo flagship so it writes the shared cookie.
- Align the `undef-auth` and `undef-auth-uwarp` server-rendered `ui.ts` consent
  screens onto the same boot engine and cookie.

### Out of scope

- Billing UI (`undef-billing` is an API-only worker; nothing renders HTML).
- Product toys: `undef-dice`, `undef-sprite`, `taybols`, `undef-engine`,
  `undef-experiments`, `uwarp-space`.
- Publishing `scanlines-system` to a registry (push-sync and packaging are a
  later, separate decision).
- Business logic, nav model, or auth flow changes.

## Decision / Architecture

### 1. Canonical theme runtime (single source of truth)

All theme behavior lives in `packages/scanlines-system/src/theme/`:

- `persistence.ts` stays the **format authority** (cookie + localStorage, the
  `undef-logos-theme` key, `Domain=.undef.games`, `ThemeState` shape). Unchanged
  contract.
- `hydrate.ts` stays the **apply authority** (palette → `--fx-*` / `--scan-*` CSS
  variables + `data-scan-tone` on `<html>`). Reconcile its default palette to the
  brand lime set (`#050607` bg / `#d8ff35` signal for dark; existing paper light).
  The Hugo blue defaults are dropped as the shared default (may survive only as a
  named preset).
- **New** `theme-boot`: a dependency-free IIFE built from the read+apply path,
  intended to be inlined in any `<head>`. It reads localStorage→cookie and applies
  the palette **before paint**, so every surface (React or server-rendered) avoids
  a flash and honors the cross-domain cookie identically.
- **New** React `ThemeProvider` / `useTheme`: a thin wrapper exposing the current
  tone, a `toggle()` that writes both stores, a cross-tab `storage` listener, and
  reactive palette values for components.

The three divergent copies are retired: Hugo `theme-hydrate.ts` becomes a thin
wrapper over the shared boot; `undef-account/frontend/src/theme.ts` is removed in
favor of the vendored runtime; `account-linked` likewise.

### 2. Surface configuration

Extend `shell/surface-config.ts`:

```
ScanlinesSurface = 'site' | 'auth' | 'account' | 'admin'
```

Per the existing config axes (`scanlineField`, `ghostMark`, `motionProfile`):

| Surface | scanlineField | motionProfile | loud layers (crt/glitch/graph) |
|---------|---------------|---------------|--------------------------------|
| admin   | on            | quiet         | off by default                 |
| account | on            | quiet         | off by default                 |
| auth    | on            | live          | off by default                 |

"Full visual treatment" for the dense backoffice consoles = shared shell + scanline
field backdrop + panels + tone-aware palette, with the loud layers off by default
(they already default `false` in `DEFAULT_SCANLINE_LAYERS`) so tables stay legible.
Turning the field **on** for `account` supersedes the "no animated background for
now" decision in the 2026-06-17 spec — which was explicitly designed to be flipped
without reworking the shell. Add `shell-admin.css` and an admin nav config
alongside the existing `shell-account.css` / `shell-auth.css`.

### 3. Vendor surface (curated, bounded)

The synced slice is an explicit file list, not a blind directory copy:

- `theme/` (persistence, hydrate, boot, provider)
- `shell/` (header, brand-mark, mark-geometry, surface-config)
- `primitives/` (field, panel, button, notice)
- `styles/` (reset, tokens, fonts, shell, `shell-account`, `shell-auth`,
  `shell-admin`, and a CSS scanline backdrop)

Excluded: `station/` (heavy Pixi lab effects), `site/`, `sections.css`,
`section-toys.css` — these are site/lab-only and must not bloat backoffice apps.
The backoffice "field" is a **CSS scanline backdrop**, not the Pixi station scene.
A standalone backdrop module does not yet exist as a clean unit; the plan extracts
it from the current theme CSS (e.g. `themes/scanlines/static/css/scanlines.css`)
into the shared package so it can be vendored.

### 4. Drift-proof sync tooling (pull now, push later)

A single `scripts/sync-scanlines.mjs` with two modes:

- **pull** (used now): a consumer runs it pointing at a sibling source checkout
  (default `../undef-logos/packages/scanlines-system`). It copies the curated
  surface into `frontend/src/vendor/scanlines-system/` and writes a
  `VENDOR_MANIFEST.json` recording a per-file `sha256` plus the source git SHA.
- **check**: recomputes hashes of the vendored files and compares them to
  `VENDOR_MANIFEST.json`; non-zero exit on any mismatch. This forbids hand-edits
  to vendored files and flags a stale slice. Each consumer wires `--check` into its
  lint/CI/pre-commit.

The copy core is factored so a future **push** mode (run from `undef-logos` over a
target manifest) reuses it without rework.

### 5. Per-app integration

- **admin** (net-new): inline `theme-boot` in `index.html` `<head>`; wrap the app
  in `ThemeProvider`; render the shared `Header` (`surface="admin"`) + CSS scanline
  backdrop (quiet) + panels; add a tone toggle that writes the shared cookie; loud
  layers off.
- **account**: remove `src/theme.ts`; adopt the vendored runtime + boot; flip the
  field on; promote the orphan `account.css` into the source package so it is part
  of the curated slice rather than a one-off.
- **account-linked**: same vendored runtime + boot; bring styling up to the full
  shared treatment.

### 6. Server-rendered surfaces

- **Hugo** (`undef.games`): inline `theme-boot` in the theme `<head>`; the existing
  toggle path must **write the cookie** (not just localStorage). This is the
  flagship cross-domain fix.
- **auth / auth-uwarp** (`ui.ts`): inline `theme-boot` in the consent/security
  screen `<head>` so they read the same cookie and paint the correct tone before
  any other code.

## Data Flow

- The cookie `undef-logos-theme` with `Domain=.undef.games; SameSite=Lax`
  (`Secure` on https) is the **cross-domain carrier**.
- localStorage (same key) is the same-origin fast path and cross-tab channel
  (`storage` event).
- **Read order:** localStorage → cookie. **Write:** both, on every change.
- On load, the boot IIFE reads and applies `--fx-*` / `--scan-*` + `data-scan-tone`
  before paint. A toggle on any surface writes both stores; the next `*.undef.games`
  domain reads the cookie and paints the same tone.

## Error Handling

- Corrupt/missing/oversized cookie or localStorage value → fall back to the default
  tone; never throw (preserve the existing `try/catch` discipline in
  `persistence.ts` / `hydrate.ts`).
- On non-`undef.games` hosts (e.g. `localhost`) the cookie is written host-only (no
  `Domain` attribute) and still shares across localhost ports, since cookies are not
  port-scoped — local multi-app dev still demonstrates cross-"domain" sync.
- Version mismatch in stored state → `mergeThemeState` returns defaults (existing
  behavior); boot must degrade to default tone rather than blank the page.

## Testing

- **scanlines-system unit:** cookie+localStorage round-trip; boot applies the
  expected CSS vars and `data-scan-tone`; `ThemeProvider.toggle()` writes both
  stores and emits the change event; default-palette reconciliation.
- **sync tooling unit:** `--check` fails on an edited vendored file and on a stale
  manifest; a fresh pull produces byte-identical output and a correct manifest.
- **per-app:** admin renders shell + field + toggle and writes the cookie; account
  reads tone from cookie when localStorage is empty (no bespoke `theme.ts` path);
  cross-tab `storage` propagation.
- **cross-domain e2e:** seed the shared cookie as one subdomain, load another, and
  assert the tone is honored; Hugo regression test asserting the toggle now writes
  the cookie.

## Phasing (for the implementation plan)

1. Consolidate canonical runtime: boot IIFE + `ThemeProvider`, reconcile defaults,
   retire duplicates' logic, add `admin` surface + `shell-admin.css`. Tests.
2. Vendor surface definition + `sync-scanlines.mjs` (pull + check + manifest). Tests.
3. `undef-admin` integration.
4. `undef-account` migration (remove `theme.ts`, field on, promote `account.css`)
   and `undef-account-linked`.
5. Hugo cookie fix + auth / auth-uwarp boot alignment.
6. Cross-domain e2e + per-surface deploy verification.

## Non-Goals and Risks

- Registry publishing and push-sync are deferred by explicit decision.
- Each consumer repo must wire its own `--check` step (separate repos, separate CI).
- Turning the field on for `account` intentionally changes its appearance.
- `Secure` cookies require https; local http dev uses a non-secure cookie (expected).
