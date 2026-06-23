# Scanlines Layered Design System & Console Surface

## Goal

Restructure `scanlines-system` into composable **layers** and add a **console
surface** plus a **data-component kit**, so backoffice operator consoles (admin,
account) get a data-appropriate UI while landing/auth keep the atmospheric
treatment. This fixes the "atmosphere fighting data" warts that surfaced once the
theme met real headers + tables. Distribution stays vendor-sync. Logging uses the
`@provide-io/telemetry` module.

Extends the now-merged cross-domain theme work
(`docs/design/specs/2026-06-22-scanlines-cross-domain-backoffice-theme-design.md`):
the station-free theme core, the deep-merge-preserving cookie write, and the
`surface` config all carry forward.

## Problem (the warts)

The theme today is a **monolithic vendored skin** — tokens + atmosphere (scanline
field, brand chrome) + a few primitives + the runtime, copied wholesale. Concrete
consequences on data-dense consoles:

1. **All-or-nothing.** No way to take tokens without the atmospheric field, so
   "full treatment" overwhelmed consoles while being right for landing.
2. **No data primitives.** The kit is `button/field/panel/notice` only. Admin
   hand-rolls `<table className="table-wrap">` across Roles/Principals/Audit/
   Spend/Signals/Vendors; account hand-rolls its own `<table>`s + `.section-grid`/
   `.security-grid`. Every console reinvents data UI with per-app CSS.
3. **Wrong header.** `ScanlinesHeader` is a marketing lockup (ghost-U mark,
   telemetry labels). Admin had to shove its tab-nav around it with `navItems={[]}`
   — the wart showing through. Consoles need a functional header.
4. **Palette tuned for vibe, not reading.** Lime-on-near-black fatigues across
   dense data; `--scan-muted`/`--scan-line` at 0.72/0.14 are too low-contrast for
   scannable rows and form labels.
5. **Field behind data is noise.** Already fought on account (`.account-app`
   obscuring the field). Decorative motion behind a table hurts an operator view.

Root cause: "the theme" is a skin, not a layered system. The fix is **shape**, not
recoloring.

## Decision / Architecture

### 1. Four layers (one-way dependencies)

`scanlines-system` reorganizes into layers; a layer only depends on those above it.
This is an **end-state reorg** — files move, no compatibility re-export shims, and
existing consumers migrate to the new imports.

- **`tokens/`** — palette, tone, spacing, type CSS vars + the framework-agnostic
  cookie/boot runtime (`persistence`, `hydrate`, `boot`, `boot-entry`/inline,
  `signal-color`) + `reset`/`tokens`/`fonts` CSS. **No React, no telemetry
  dependency.** Station-free. The cross-domain contract. Universal: Hugo, auth
  `ui.ts`, and the SPAs. (≈ today's framework-agnostic `theme/` + base CSS.) The
  runtime exposes an **optional logger-injection hook** (a `setLogger`-style seam,
  default no-op) so its currently-swallowed errors can be surfaced when a consumer
  wires telemetry — without `tokens/` itself depending on `@provide-io/telemetry`.
- **`atmosphere/`** — scanline field/effects, brand chrome (`ScanlinesHeader`,
  brand mark/`mark-geometry`, `backdrop.css`), the full effects engine. **Opt-in.**
  Landing + auth import it; consoles never do. (≈ today's `station/` +
  `backdrop.css` + the marketing header + `shell.css`.)
- **`react/`** — the React layer: `ThemeProvider`/`useTheme` (the `provider`),
  today's `button/field/panel/notice`, the new console primitives (Section 4), and
  the **telemetry seam** (Section 5). This is the only layer that depends on React
  and on `@provide-io/telemetry`. SPA-only — Hugo/auth never import it.
- **`surfaces/`** — presets = recipes over the layers (Section 2). Replaces the
  hard-coded `ScanlinesSurface = 'site'|'auth'|'account'|'admin'` enum.

The package barrel (`index.ts`) and `package.json` `exports` are updated to expose
the layers (e.g. subpath-style `tokens`, `atmosphere`, `react`, `surfaces`
groupings). The vendored slice's `VENDOR_FILES` is grouped by layer; `sync`/
`check:theme` mechanics are unchanged. A console app vendors `tokens` + `react` +
`surfaces/console` and **never** `atmosphere/`.

### 2. Surfaces as presets (compositions, not an enum)

A surface is a preset object applied by the consumer:

- **`marketing`** = tokens + atmosphere + brand header (landing, lab, auth field).
- **`console`** = tokens + react kit + functional header; atmosphere OFF.

Presets carry the existing config axes (`scanlineField`, `motionProfile`, etc.) so
adding/adjusting a surface is composition, not editing a baked-in union + re-vendor.

### 3. The console surface

`surfaces/console` adds three things:

- **`ConsoleShell` + `ConsoleHeader`** — a functional frame replacing the marketing
  header. `ConsoleHeader`: small brand wordmark (no ghost-U), primary section nav,
  a utility slot (account menu / sign-out / **theme toggle** — cross-domain cookie
  stays), and an optional page-actions slot. Sticky, dense, operational. Fixes the
  admin `navItems={[]}` wart.
- **Console "reading" token set** — a tone-aware overlay on the brand palette tuned
  for legibility: higher-contrast `--scan-muted`/`--scan-line`; dedicated table
  tokens (header bg, row border, zebra, hover); signal/lime constrained to
  **accent-only** (links, primary buttons, status), never large fills. Brand
  palette unchanged; the console reads from a denser, higher-contrast layer.
- **No atmosphere** — the console surface cannot import the field/effects layer, so
  the background is a flat, calm, tone-aware surface. "Field fighting tables" is
  impossible by construction.

### 4. The component kit (`react/`)

Six new token-driven, accessible (semantic + ARIA, matching admin's a11y work)
components, plus reuse of three. Scoped to what admin + account actually use:

| Component | Purpose | Replaces |
|---|---|---|
| `DataTable` | column config, sticky header, zebra/hover, dense mode, alignment, row actions, built-in empty slot | hand-rolled `<table className="table-wrap">` (admin Roles/Principals/Audit/Spend/Signals/Vendors; account sessions/apps) |
| `Toolbar` | section title + search/filter + action buttons above a table/section | per-app section headers |
| `Tabs` | section nav (admin principals/roles/audit/spend/…); pairs with `ConsoleHeader` | admin's hand-rolled tab-list |
| `FormRow` / `FormGrid` | label + control + hint/error layout over the existing `field` | GrantEditor; account profile/billing forms |
| `Badge` / `StatusPill` | roles, permission chips, active/revoked, grant scopes | admin permission-list; account status spans |
| `EmptyState` | consistent "no rows / nothing here" | ad-hoc empty rendering |

Reused: **`Panel`** (new console-density variant — tighter, no card-glow),
**`Button`**, **`Notice`**.

**Deliberately out (YAGNI):** Pagination, Modal/Dialog, DatePicker — not needed by
admin/account today; add later if a consumer needs them.

### 5. Logging / telemetry (`@provide-io/telemetry`)

- **One telemetry seam lives in the `react` layer** (not `tokens/`, so the
  universal layer stays dependency-free): it wraps `@provide-io/telemetry` —
  `getLogger('scanlines:<module>')`; **all** React-layer code logs through it,
  never `console`. Consumers call `setupTelemetry({ serviceName })` once at app
  boot, and wire the seam's logger into the `tokens/` runtime via its
  logger-injection hook so framework-agnostic errors flow through the same sink.
- **Honor the toggle (zero-overhead-when-off):** the seam respects `logLevel` and
  consent (`setConsentLevel('FULL'|'FUNCTIONAL'|'MINIMAL'|'NONE')`) and guards
  non-trivial payloads with `shouldAllow(signal, level)`, so disabled telemetry
  costs ~nothing.
- **Surface today's silent failures:** the runtime's swallowed `try/catch` parse/
  boot errors become `log.warn`/`log.error` (with `computeErrorFingerprint`) —
  observable instead of invisible.
- **Kit error boundary:** `ConsoleShell` (and risky data renders) wrap in
  `TelemetryErrorBoundary` (from `@provide-io/telemetry/react`) for graceful
  fallback + reporting; `useTelemetryContext` binds surface/route context.
- **Dependency:** `@provide-io/telemetry` becomes a dependency of the `react`
  layer; vendored consumers install it. OTel is optional (core = pino; graceful
  degradation), so no hard OTel requirement.
- **One exception:** the inline boot IIFE is bundled standalone and cannot `import`
  the module — it stays telemetry-free and degrades to dark tone on error as today.

### 6. Lab + Hugo as first-class consumers; admin as the proof

- **Lab + Hugo are migrated** to import from the new layers (end-state, no compat
  shims). The lab keeps using `tokens` + `atmosphere` (the marketing path) exactly
  as today, just via the new module locations; the `surface='site'` enum usage
  becomes the `marketing` preset. This is the highest-risk migration (the lab
  authors the full `ThemeState` via `station/` + Pixi).
- **Admin migrates** to the console surface + kit (the proof that fixes the warts):
  `ConsoleShell`/`ConsoleHeader`, `DataTable` for all its tables, `Tabs`,
  `Badge`/`StatusPill`, `FormRow` for GrantEditor — dropping its hand-rolled table
  CSS. Re-vendor the slice.
- **account → console** is a **fast-follow spec**, not this one.

## Data flow / invariants

- The **tokens/cookie contract is unchanged** — `undef-logos-theme`, `Domain=
  .undef.games`, read order localStorage→cookie, deep-merge-preserving write. The
  console surface only adds a reading-token overlay + functional chrome.
- The **deep-merge-preserve invariant** (from the prior spec) guarantees a
  console-surface writer (e.g. a theme toggle) cannot clobber the lab's authored
  `scanlineEngine`/`sectionEffects` in the shared cookie. This protection is why
  the lab keeps working through the reorg.
- **Layer dependency direction** is enforced by import boundaries: `react`/
  `surfaces` may import `tokens`; nothing imports `atmosphere` except the marketing
  preset + landing/auth/lab.

## Error handling

- Telemetry seam degrades gracefully: OTel absent → pino core; consent `NONE` /
  high `logLevel` → no-op (no payload built).
- Runtime failures (corrupt cookie/localStorage, boot parse) log via the seam and
  fall back to default dark tone; never throw to the page.
- `TelemetryErrorBoundary` around `ConsoleShell` renders a graceful fallback and
  reports, so a data-render bug doesn't blank an operator console.

## Testing / gates

- **Component kit:** unit tests per component asserting real behavior + a11y
  (table semantics/`scope`, ARIA roles, focus, empty states), not mocks.
- **Telemetry seam:** logs route through the module (mocked) and honor consent/
  level (a disabled logger builds no payload).
- **Lab + Hugo (gating):** `make typecheck && make test`; the **lab e2e**
  (`tests/e2e/logo-lab.spec.ts`) and **site e2e** (`tests/e2e/site.spec.ts`) pass;
  the **authoring round-trip** — lab writes full `ThemeState` (incl.
  `scanlineEngine`/`sectionEffects`) → flagship/`/lab` renders it, surviving
  cross-domain — passes.
- **Admin:** its full frontend suite green; `check:theme` OK after re-vendor; a
  visual check of the console shell + tables (dark/light) before merge.

## Non-goals

- Publishing to a registry (vendor-sync stays — explicit prior decision).
- account → console (fast-follow spec).
- Pagination/Modal/DatePicker; product apps (dice/sprite/taybols/engine); new
  effects or palette redesign.

## Phasing (for the implementation plan)

1. **Layer reorg** — split into `tokens/atmosphere/react/surfaces`; update barrel +
   `exports`; migrate lab + Hugo entrypoints to the new imports (end-state, no
   shims). Gate: lab+site e2e + authoring round-trip green.
2. **Telemetry seam** — wrap `@provide-io/telemetry`, route the runtime's
   swallowed errors through it, honor consent/level; add the dep to `react`.
3. **Console surface** — `ConsoleShell`/`ConsoleHeader` + reading tokens +
   `surfaces/console` preset.
4. **Component kit** — `DataTable`, `Toolbar`, `Tabs`, `FormRow`/`FormGrid`,
   `Badge`/`StatusPill`, `EmptyState`; console-density `Panel`.
5. **Migrate admin** to the console surface + kit; re-vendor; suite + visual check.
6. **(Fast-follow, separate spec)** account → console.
