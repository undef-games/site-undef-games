# Scanlines Layered Design System & Console Surface — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reorganize `scanlines-system` into composable layers (`tokens`/`atmosphere`/`react`/`surfaces`), add a console surface + a data-component kit, route logging through `@provide-io/telemetry`, and migrate the lab/Hugo (gated) and admin (the proof) onto it — fixing the "atmosphere fighting data" warts.

**Architecture:** End-state reorg behind a stable barrel (the package's public front door — lab/Hugo consume only the barrel + one CSS subpath, so they barely move). New work lives in the `react` layer; the `tokens` layer stays dependency-free via an injected-logger seam. Console surface = tokens + react kit + functional header, atmosphere off by construction.

**Tech Stack:** TypeScript, React 19, Vite 8, Vitest 4 (+ @testing-library + jest-dom, available via lab), Hugo, `@provide-io/telemetry@^0.4.8` (pino + optional OTel), Cloudflare.

## Global Constraints

- **Package scope is `@undef-games/scanlines-system`** (renamed from `@undef/scanlines-system` in Task 1). Update the package `name`, the lab/Hugo barrel imports + the lab vite alias + lab `tsconfig` path mappings.
- **Distribution stays vendor-sync.** No registry publish. Repo extraction/rename is a SEPARATE future spec — this plan targets `undef-logos/packages/scanlines-system` as-is.
- **The barrel (`index.ts`) is the public API**, re-exporting from the layer dirs. Keeping it is NOT a compat shim. End-state otherwise: no legacy re-exports of removed paths, no wrappers.
- **Layers + one-way deps:** `react`/`surfaces` may import `tokens`; only the `marketing` preset + landing/auth/lab touch `atmosphere`; `tokens` imports nothing from `atmosphere`/`react`/telemetry.
- **`@provide-io/telemetry` lives in the `react` layer only.** `tokens/` stays dep-free via a `setScanlinesLogger` injection hook (default no-op). The inline boot IIFE stays telemetry-free (bundled standalone; degrades to dark tone on error).
- **Telemetry honors the toggle:** guard non-trivial logs with `shouldAllow(...)` / respect `logLevel` so disabled telemetry costs ~nothing.
- **Console surface:** atmosphere/field OFF by construction; loud scanline layers stay off; signal/lime is accent-only (never large fills); reading-grade contrast tokens.
- **Cross-domain contract unchanged:** key `undef-logos-theme`, `Domain=.undef.games`, read order localStorage→cookie, **deep-merge-preserving** `writeThemeState` (protects the lab's authored `scanlineEngine`/`sectionEffects`).
- **Kit components are accessible** (semantic table markup, `scope="col"`, ARIA roles, focus, empty states) — matching admin's existing a11y work.
- **Gates (non-negotiable before the reorg + admin land):** `make typecheck && make test`; lab e2e `tests/e2e/logo-lab.spec.ts`; site e2e `tests/e2e/site.spec.ts`; the authoring round-trip (lab writes full `ThemeState` → flagship renders it cross-domain); each consumer's `check:theme`.
- **Test commands (this repo):** focused package test `cd lab && npx vitest run <pattern>` (NOT absolute paths — they pick up stale `.worktrees` copies); full suite `make test`; typecheck `make typecheck`. Commits use `git -c commit.gpgsign=false` (1Password signing fails non-interactively).
- **Out of scope:** account→console (fast-follow spec); repo extraction (separate spec); Pagination/Modal/DatePicker; product apps; new effects.

---

## File Structure (end state, `packages/scanlines-system/src/`)

```
tokens/      persistence.ts hydrate.ts boot.ts boot-entry.ts signal-color.ts
             log.ts (NEW: setScanlinesLogger seam)
             reset.css tokens.css fonts.css
atmosphere/  station/* (effects-config, effects-style, scanline-engine, scanline-renderer,
             signal-field-plan, station-identity, station-signal-scene, station-state,
             station-toys, theme-state) brand-mark.tsx mark-geometry.ts header.tsx
             site/* (site-app, site-main, site-copy-loader)
             backdrop.css shell.css hero.css sections.css section-toys.css responsive.css site.css
react/       provider.tsx button.tsx field.tsx notice.tsx panel.tsx
             telemetry.ts (NEW)
             console/ConsoleShell.tsx ConsoleHeader.tsx
             kit/DataTable.tsx Toolbar.tsx Tabs.tsx FormRow.tsx Badge.tsx EmptyState.tsx
             console.css (NEW: reading tokens) account.css shell-account.css shell-auth.css shell-admin.css
surfaces/    presets.ts (NEW: marketing, console) surface-config.ts (nav item types/data)
index.ts     barrel — re-exports the public API from all layers
```

(Test files live beside their source as today. `git mv` preserves history.)

---

## PHASE 1 — Scope rename + layer reorg (gated foundation)

### Task 1: Rename npm scope to `@undef-games/scanlines-system`

**Files:** Modify `packages/scanlines-system/package.json`; `lab/vite.config.ts`; `lab/tsconfig.json`; `lab/src/**` + `themes/scanlines/assets/ts/**` (barrel imports).

- [ ] **Step 1: Rename the package + every in-repo reference**

```bash
cd /Users/tim/code/gh/undef-games/undef-logos
# package name
sed -i '' 's#"@undef/scanlines-system"#"@undef-games/scanlines-system"#' packages/scanlines-system/package.json
# lab + hugo barrel imports + vite alias + tsconfig paths
grep -rl "@undef/scanlines-system" lab themes --include=*.ts --include=*.tsx --include=*.json 2>/dev/null \
  | xargs sed -i '' 's#@undef/scanlines-system#@undef-games/scanlines-system#g'
```

- [ ] **Step 2: Verify nothing references the old scope**

Run: `grep -rn "@undef/scanlines-system" packages lab themes --include=*.ts --include=*.tsx --include=*.json | grep -v node_modules`
Expected: no output.

- [ ] **Step 3: Typecheck + test**

Run: `make typecheck && make test`
Expected: clean; suite passes (alias resolves under the new name).

- [ ] **Step 4: Commit**

```bash
git add -A && git -c commit.gpgsign=false commit -m "refactor(scanlines): rename package scope to @undef-games"
```

### Task 2: `tokens/` layer + the logger-injection seam

**Files:** Create `packages/scanlines-system/src/tokens/log.ts` + `log.test.ts`; `git mv` runtime + base CSS into `tokens/`; Modify `index.ts`, moved files' relative imports.

**Interfaces:**
- Produces: `setScanlinesLogger(logger: ScanlinesLogger | null): void`, `scanlinesLog(): ScanlinesLogger`, `type ScanlinesLogger = { warn(event: string, data?: Record<string, unknown>): void; error(event: string, data?: Record<string, unknown>): void; info(event: string, data?: Record<string, unknown>): void }`.

- [ ] **Step 1: Write the failing test** (`src/tokens/log.test.ts`)

```ts
import { afterEach, describe, expect, it, vi } from 'vitest'
import { scanlinesLog, setScanlinesLogger } from './log'

afterEach(() => setScanlinesLogger(null))

describe('scanlines logger seam', () => {
  it('defaults to a no-op (no throw, no console)', () => {
    expect(() => scanlinesLog().warn('x', { a: 1 })).not.toThrow()
  })
  it('routes to an injected logger', () => {
    const warn = vi.fn()
    setScanlinesLogger({ warn, error: vi.fn(), info: vi.fn() })
    scanlinesLog().warn('theme.read.fail', { reason: 'parse' })
    expect(warn).toHaveBeenCalledWith('theme.read.fail', { reason: 'parse' })
  })
})
```

- [ ] **Step 2: Run it (RED)** — `cd lab && npx vitest run tokens/log` → FAIL (module missing).

- [ ] **Step 3: Implement `src/tokens/log.ts`**

```ts
export type ScanlinesLogger = {
  warn(event: string, data?: Record<string, unknown>): void
  error(event: string, data?: Record<string, unknown>): void
  info(event: string, data?: Record<string, unknown>): void
}

const noop: ScanlinesLogger = { warn() {}, error() {}, info() {} }
let current: ScanlinesLogger = noop

/** Wire a real logger (e.g. the @provide-io/telemetry seam in the react layer). */
export function setScanlinesLogger(logger: ScanlinesLogger | null): void {
  current = logger ?? noop
}
export function scanlinesLog(): ScanlinesLogger {
  return current
}
```

- [ ] **Step 4: Move the framework-agnostic runtime + base CSS into `tokens/`**

```bash
cd packages/scanlines-system/src
mkdir -p tokens
git mv theme/persistence.ts theme/persistence.test.ts theme/hydrate.ts theme/hydrate.test.ts \
       theme/boot.ts theme/boot.test.ts theme/boot-entry.ts \
       theme/signal-color.ts theme/signal-color.test.ts tokens/
git mv styles/reset.css styles/tokens.css styles/fonts.css tokens/
rmdir theme 2>/dev/null || true
```

- [ ] **Step 5: Route swallowed errors through the seam (no console)**

In `tokens/boot.ts` `applyStoredTheme` catch and `tokens/persistence.ts` `readThemeState` catch, replace silent swallow with `scanlinesLog().warn('scanlines.theme.read_failed', { error: String(e) })` (import `scanlinesLog` from `./log`). Keep the dark-tone fallback. Do NOT add `console.*`.

- [ ] **Step 6: Update the barrel + the boot-entry path**

In `index.ts`, change the `./theme/*` re-exports to `./tokens/*` and add `export * from './tokens/log'`. Update `scripts/build-theme-boot.mjs` entry path `../src/theme/boot-entry.ts` → `../src/tokens/boot-entry.ts`; rebuild (`npm --prefix lab run build:theme-boot`).

- [ ] **Step 7: Typecheck + test + commit**

```bash
make typecheck && make test   # tsc surfaces any missed relative-import moves; fix them
git add -A && git add -f packages/scanlines-system/dist/theme-boot.js packages/scanlines-system/dist/theme-boot.inline.ts
git -c commit.gpgsign=false commit -m "refactor(scanlines): extract tokens layer + logger seam"
```

### Task 3: `react/` layer (provider + primitives)

**Files:** `git mv` provider + primitives into `react/`; Modify `index.ts` + moved files' imports.

- [ ] **Step 1: Move**

```bash
cd packages/scanlines-system/src
mkdir -p react
git mv theme/provider.tsx theme/provider.test.tsx react/ 2>/dev/null || git mv tokens/provider.tsx tokens/provider.test.tsx react/ 2>/dev/null || true
git mv primitives/button.tsx primitives/field.tsx primitives/notice.tsx primitives/panel.tsx react/
rmdir primitives 2>/dev/null || true
```
(Note: `provider.tsx` currently sits in `theme/`; move it to `react/`. Its imports of `persistence`/`hydrate` become `../tokens/persistence` etc.)

- [ ] **Step 2: Fix imports** — in `react/provider.tsx` repoint `./persistence`,`./hydrate` → `../tokens/persistence`,`../tokens/hydrate`. Update `index.ts` `./primitives/*` → `./react/*` and `./theme/provider`→`./react/provider`.

- [ ] **Step 3: Typecheck + test + commit**

```bash
make typecheck && make test
git add -A && git -c commit.gpgsign=false commit -m "refactor(scanlines): extract react layer (provider + primitives)"
```

### Task 4: `atmosphere/` layer (station + brand chrome + effect CSS)

**Files:** `git mv` `station/*`, `site/*`, `shell/{header,brand-mark,mark-geometry}`, and the effect/marketing CSS into `atmosphere/`; Modify `index.ts`, imports, `lab/vite.config.ts` (the `site.css` alias).

- [ ] **Step 1: Move**

```bash
cd packages/scanlines-system/src
mkdir -p atmosphere
git mv station atmosphere/station
git mv site atmosphere/site
git mv shell/header.tsx shell/header.test.tsx shell/brand-mark.tsx shell/mark-geometry.ts atmosphere/
git mv styles/backdrop.css styles/shell.css styles/hero.css styles/sections.css \
       styles/section-toys.css styles/responsive.css styles/site.css atmosphere/
```

- [ ] **Step 2: Fix imports + the lab CSS alias** — repoint moved files' relative imports (tsc will flag). In `lab/vite.config.ts`, change the `@undef-games/scanlines-system/styles/site.css` alias target `../packages/scanlines-system/src/styles/site.css` → `.../src/atmosphere/site.css`, and update the matching `package.json` `exports` entry. Update `index.ts` `./station/*`,`./site/*`,`./shell/{header,brand-mark,mark-geometry}` → `./atmosphere/*`.

- [ ] **Step 3: Typecheck + test + commit** — `make typecheck && make test`; commit `refactor(scanlines): extract atmosphere layer`.

### Task 5: `surfaces/` layer — presets replace the enum

**Files:** Create `src/surfaces/presets.ts` (+ test); `git mv shell/surface-config.ts shell/surface-config.test.ts surfaces/`; Modify `atmosphere/header.tsx`, `index.ts`, `surfaces/surface-config.ts`.

**Interfaces:**
- Produces: `type SurfacePreset = { id: 'marketing' | 'console'; atmosphere: boolean; header: 'brand' | 'console' }`; `MARKETING_PRESET`, `CONSOLE_PRESET`. `surface-config.ts` keeps nav-item types/data (`ScanlinesNavItem`, `ADMIN_SURFACE_NAV_ITEMS`, etc.).

- [ ] **Step 1: Write the failing test** (`src/surfaces/presets.test.ts`)

```ts
import { describe, expect, it } from 'vitest'
import { CONSOLE_PRESET, MARKETING_PRESET } from './presets'

describe('surface presets', () => {
  it('console preset turns atmosphere off and uses the console header', () => {
    expect(CONSOLE_PRESET).toMatchObject({ id: 'console', atmosphere: false, header: 'console' })
  })
  it('marketing preset keeps atmosphere + brand header', () => {
    expect(MARKETING_PRESET).toMatchObject({ id: 'marketing', atmosphere: true, header: 'brand' })
  })
})
```

- [ ] **Step 2: RED** — `cd lab && npx vitest run surfaces/presets` → FAIL.

- [ ] **Step 3: Implement `src/surfaces/presets.ts`**

```ts
export type SurfacePresetId = 'marketing' | 'console'
export interface SurfacePreset {
  id: SurfacePresetId
  atmosphere: boolean // landing/auth/lab true; consoles false
  header: 'brand' | 'console'
}
export const MARKETING_PRESET: SurfacePreset = { id: 'marketing', atmosphere: true, header: 'brand' }
export const CONSOLE_PRESET: SurfacePreset = { id: 'console', atmosphere: false, header: 'console' }
```

- [ ] **Step 4: Move surface-config + migrate the enum's users**

```bash
cd packages/scanlines-system/src
git mv shell/surface-config.ts shell/surface-config.test.ts surfaces/
rmdir shell 2>/dev/null || true
```
`surface-config.ts` keeps `ScanlinesNavItem`/`ScanlinesUtilityAction` + the nav-item constants. `atmosphere/header.tsx` (`ScanlinesHeader`) keeps its `surface` prop for the brand header (still used by site/auth) — it now imports from `../surfaces/surface-config`. Update `index.ts` to `export * from './surfaces/presets'` + `./surfaces/surface-config`.

- [ ] **Step 5: Typecheck + test + commit** — `make typecheck && make test`; commit `refactor(scanlines): surfaces layer with marketing/console presets`.

### Task 6: Update the vendor surface to the layered layout + gate the reorg

**Files:** Modify `packages/scanlines-system/scripts/vendor-surface.mjs`; verification.

- [ ] **Step 1: Repoint `VENDOR_FILES` to the layer dirs**

Update each path: `src/theme/*`→`src/tokens/*`; `src/primitives/*`→`src/react/*`; `src/shell/{header,brand-mark,mark-geometry,surface-config}` → `atmosphere/`+`surfaces/`; styles to their new homes; add `src/tokens/log.ts`, `src/react/provider.tsx`, `src/surfaces/presets.ts`. Keep `dist/theme-boot.js` + `dist/theme-boot.inline.ts`. (Console-specific files added in Phase 3/4 get appended then.)

- [ ] **Step 2: Run the surface test + full suite** — `cd lab && npx vitest run vendor-surface`; then `make typecheck && make test`.

- [ ] **Step 3: GATE — lab + Hugo + authoring round-trip**

Run: `make build` (Hugo + lab compile against the reorganized package). Then `make e2e` focused on the lab + site theme specs:
`npx playwright test tests/e2e/logo-lab.spec.ts tests/e2e/site.spec.ts`
Expected: PASS. Manually confirm the **authoring round-trip**: in the lab, change a preset/effect (writes full `ThemeState`), reload `/` — the change renders. If server binding is sandbox-blocked, report it and run `make e2e` interactively before merge — do NOT weaken tests.

- [ ] **Step 4: Commit** — `git add -A && git -c commit.gpgsign=false commit -m "refactor(scanlines): layered vendor surface; reorg gated on lab+site e2e"`.

---

## PHASE 2 — Telemetry seam

### Task 7: `@provide-io/telemetry` seam in the `react` layer

**Files:** Create `src/react/telemetry.ts` + `telemetry.test.ts`; Modify `package.json` (add dep), `index.ts`.

**Interfaces:**
- Consumes: `setScanlinesLogger`, `ScanlinesLogger` (tokens/log).
- Produces: `createScanlinesLogger(scope?: string): ScanlinesLogger`; `wireScanlinesTelemetry(scope?: string): void` (calls `setScanlinesLogger(createScanlinesLogger(scope))`); re-exports `TelemetryErrorBoundary`, `useTelemetryContext` from `@provide-io/telemetry/react`.

- [ ] **Step 1: Add the dependency**

```bash
npm --prefix packages/scanlines-system pkg set dependencies.@provide-io/telemetry="^0.4.8" 2>/dev/null || \
  node -e "const f='packages/scanlines-system/package.json',p=require('./'+f);p.dependencies={...(p.dependencies||{}),'@provide-io/telemetry':'^0.4.8'};require('fs').writeFileSync(f,JSON.stringify(p,null,2)+'\n')"
npm --prefix lab install @provide-io/telemetry@^0.4.8
```

- [ ] **Step 2: Write the failing test** (`src/react/telemetry.test.ts`)

```ts
import { describe, expect, it, vi } from 'vitest'
vi.mock('@provide-io/telemetry', () => ({
  getLogger: () => ({ warn: vi.fn(), error: vi.fn(), info: vi.fn() }),
  shouldAllow: vi.fn(() => true),
}))
import { shouldAllow } from '@provide-io/telemetry'
import { createScanlinesLogger } from './telemetry'

describe('scanlines telemetry seam', () => {
  it('guards logs with shouldAllow (skips when disabled)', () => {
    ;(shouldAllow as ReturnType<typeof vi.fn>).mockReturnValue(false)
    const log = createScanlinesLogger('test')
    log.warn('e', { a: 1 })
    expect(shouldAllow).toHaveBeenCalledWith('log', 'warn')
  })
})
```

- [ ] **Step 3: RED** — `cd lab && npx vitest run react/telemetry` → FAIL.

- [ ] **Step 4: Implement `src/react/telemetry.ts`**

```ts
import { getLogger, shouldAllow } from '@provide-io/telemetry'
import type { ScanlinesLogger } from '../tokens/log'
import { setScanlinesLogger } from '../tokens/log'

export { TelemetryErrorBoundary, useTelemetryContext } from '@provide-io/telemetry/react'

export function createScanlinesLogger(scope = 'scanlines'): ScanlinesLogger {
  const logger = getLogger(scope)
  const emit = (level: 'warn' | 'error' | 'info', event: string, data?: Record<string, unknown>) => {
    if (!shouldAllow('log', level)) return // honor consent/level — no payload built when disabled
    logger[level]({ event, ...data })
  }
  return {
    warn: (event, data) => emit('warn', event, data),
    error: (event, data) => emit('error', event, data),
    info: (event, data) => emit('info', event, data),
  }
}

/** Call once at app boot (after setupTelemetry) to route tokens-layer logs through telemetry. */
export function wireScanlinesTelemetry(scope = 'scanlines'): void {
  setScanlinesLogger(createScanlinesLogger(scope))
}
```

- [ ] **Step 5: GREEN + barrel** — `cd lab && npx vitest run react/telemetry` → PASS. Add `export * from './react/telemetry'` to `index.ts`. `make typecheck && make test`.

- [ ] **Step 6: Commit** — `git add -A && git -c commit.gpgsign=false commit -m "feat(scanlines): @provide-io/telemetry seam (react layer) wiring the tokens logger"`.

---

## PHASE 3 — Console surface

### Task 8: Console reading tokens (`react/console.css`)

**Files:** Create `src/react/console.css` + a content assertion in `src/styles/styles.test.ts` (or a new test).

- [ ] **Step 1: Failing test** — assert `read('../react/console.css')` matches `/\[data-surface="console"\]/` and `/--console-row-border/`.
- [ ] **Step 2: RED**, then create `src/react/console.css`:

```css
[data-surface="console"] {
  /* reading-grade contrast: bump muted/line over the brand tokens */
  --scan-muted: rgb(var(--fx-muted-rgb, 244 244 240) / 0.86);
  --scan-line: rgb(var(--fx-muted-rgb, 244 244 240) / 0.28);
  /* table tokens */
  --console-table-header-bg: rgb(var(--fx-muted-rgb, 244 244 240) / 0.06);
  --console-row-border: rgb(var(--fx-muted-rgb, 244 244 240) / 0.14);
  --console-zebra: rgb(var(--fx-muted-rgb, 244 244 240) / 0.03);
  --console-hover: rgb(var(--fx-signal-rgb, 216 255 53) / 0.08);
  background: var(--fx-bg, #050607); /* flat, calm — NO scanline field */
  color: var(--fx-text, #f4f4f0);
}
[data-scan-tone="light"][data-surface="console"],
[data-surface="console"][data-scan-tone="light"] {
  --scan-line: rgb(var(--fx-muted-rgb, 17 19 13) / 0.22);
}
```
- [ ] **Step 3: GREEN + commit** — `feat(scanlines): console reading tokens`.

### Task 9: `ConsoleHeader`

**Files:** Create `src/react/console/ConsoleHeader.tsx` + `ConsoleHeader.test.tsx`.

**Interfaces:**
- Produces: `ConsoleHeader(props: { brandLabel: string; nav?: ScanlinesNavItem[]; activeNavHref?: string; utilities?: ReactNode; actions?: ReactNode; homeHref?: string }): JSX.Element` — renders a single `<header role="banner" class="console-header">`.

- [ ] **Step 1: Failing test**

```tsx
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ConsoleHeader } from './ConsoleHeader'

describe('ConsoleHeader', () => {
  it('renders one banner with brand, nav and a utilities slot', () => {
    render(<ConsoleHeader brandLabel="undef admin" nav={[{ href: '#roles', label: 'Roles' }]}
      activeNavHref="#roles" utilities={<button>menu</button>} />)
    const banner = screen.getByRole('banner')
    expect(banner).toHaveClass('console-header')
    expect(screen.getByRole('link', { name: 'Roles' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('button', { name: 'menu' })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: RED**, then implement `ConsoleHeader.tsx`:

```tsx
import type { ReactNode } from 'react'
import type { ScanlinesNavItem } from '../../surfaces/surface-config'

export interface ConsoleHeaderProps {
  brandLabel: string
  nav?: ScanlinesNavItem[]
  activeNavHref?: string
  utilities?: ReactNode
  actions?: ReactNode
  homeHref?: string
}

export function ConsoleHeader({ brandLabel, nav = [], activeNavHref, utilities, actions, homeHref = '/' }: ConsoleHeaderProps) {
  return (
    <header className="console-header">
      <a className="console-header__brand" href={homeHref}>{brandLabel}</a>
      {nav.length > 0 && (
        <nav className="console-header__nav" aria-label="Primary">
          {nav.map((item) => (
            <a key={item.href} href={item.href} aria-current={item.href === activeNavHref ? 'page' : undefined}>{item.label}</a>
          ))}
        </nav>
      )}
      <div className="console-header__actions">{actions}</div>
      <div className="console-header__utilities">{utilities}</div>
    </header>
  )
}
```

- [ ] **Step 3: GREEN + commit** — `feat(scanlines): ConsoleHeader`.

### Task 10: `ConsoleShell`

**Files:** Create `src/react/console/ConsoleShell.tsx` + `.test.tsx`.

**Interfaces:**
- Consumes: `ConsoleHeader`, `TelemetryErrorBoundary` (react/telemetry).
- Produces: `ConsoleShell(props: ConsoleHeaderProps & { children: ReactNode }): JSX.Element` — `<div class="console-shell" data-surface="console">` wrapping header + `<main class="console-main">`, inside a `TelemetryErrorBoundary`.

- [ ] **Step 1: Failing test** — render `<ConsoleShell brandLabel="undef admin"><div>body</div></ConsoleShell>`; assert the root has `data-surface="console"`, a single `banner`, and `screen.getByRole('main')` contains "body".
- [ ] **Step 2: RED**, then implement:

```tsx
import type { ReactNode } from 'react'
import { ConsoleHeader, type ConsoleHeaderProps } from './ConsoleHeader'
import { TelemetryErrorBoundary } from '../telemetry'

export function ConsoleShell({ children, ...header }: ConsoleHeaderProps & { children: ReactNode }) {
  return (
    <TelemetryErrorBoundary>
      <div className="console-shell" data-surface="console">
        <ConsoleHeader {...header} />
        <main className="console-main">{children}</main>
      </div>
    </TelemetryErrorBoundary>
  )
}
```
- [ ] **Step 3: GREEN + barrel** — export `ConsoleShell`/`ConsoleHeader` from `index.ts` (`export * from './react/console/ConsoleShell'` + `'./react/console/ConsoleHeader'`). `make test`. Commit `feat(scanlines): ConsoleShell w/ telemetry error boundary`.

---

## PHASE 4 — Component kit (`react/kit/`)

Each task: failing test → RED → component → GREEN → commit, and append the new file to `index.ts` + `vendor-surface.mjs`. All components are token-driven + accessible.

### Task 11: `DataTable`

**Interfaces:** `DataTable<T>(props: { columns: Column<T>[]; rows: T[]; rowKey: (row: T) => string; dense?: boolean; caption?: string; empty?: ReactNode }): JSX.Element` where `type Column<T> = { key: string; header: string; align?: 'start' | 'end' | 'center'; render?: (row: T) => ReactNode }`.

- [ ] **Step 1: Failing test** (`src/react/kit/DataTable.test.tsx`)

```tsx
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DataTable } from './DataTable'

const cols = [{ key: 'role', header: 'Role' }, { key: 'perms', header: 'Permissions' }]
describe('DataTable', () => {
  it('renders rows with column headers (scope=col) and a caption', () => {
    render(<DataTable caption="Roles" columns={cols} rows={[{ role: 'admin', perms: '12' }]} rowKey={(r) => r.role} />)
    expect(screen.getByRole('columnheader', { name: 'Role' })).toHaveAttribute('scope', 'col')
    expect(screen.getByRole('cell', { name: 'admin' })).toBeInTheDocument()
  })
  it('shows the empty slot when there are no rows', () => {
    render(<DataTable columns={cols} rows={[]} rowKey={() => 'x'} empty={<span>No roles</span>} />)
    expect(screen.getByText('No roles')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: RED**, then implement `DataTable.tsx`:

```tsx
import type { ReactNode } from 'react'

export type Column<T> = { key: string; header: string; align?: 'start' | 'end' | 'center'; render?: (row: T) => ReactNode }
export interface DataTableProps<T> {
  columns: Column<T>[]
  rows: T[]
  rowKey: (row: T) => string
  dense?: boolean
  caption?: string
  empty?: ReactNode
}

export function DataTable<T extends Record<string, unknown>>({ columns, rows, rowKey, dense, caption, empty }: DataTableProps<T>) {
  if (rows.length === 0 && empty) {
    return <div className="datatable datatable--empty">{empty}</div>
  }
  return (
    <div className={['datatable', dense && 'datatable--dense'].filter(Boolean).join(' ')}>
      <table>
        {caption ? <caption className="datatable__caption">{caption}</caption> : null}
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} scope="col" data-align={c.align ?? 'start'}>{c.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)}>
              {columns.map((c) => (
                <td key={c.key} data-align={c.align ?? 'start'}>{c.render ? c.render(row) : String(row[c.key] ?? '')}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```
- [ ] **Step 3: GREEN + barrel/surface + commit** — `feat(scanlines): DataTable`.

### Task 12: `Toolbar`

**Interfaces:** `Toolbar(props: { title?: string; children?: ReactNode }): JSX.Element` → `<div class="toolbar">` with a title region + actions slot.

- [ ] Failing test: renders title + an action button in `screen.getByRole('toolbar')` (use `role="toolbar"`). RED → implement (`<div className="toolbar" role="toolbar">{title && <h2 className="toolbar__title">{title}</h2>}<div className="toolbar__actions">{children}</div></div>`) → GREEN → barrel/surface → commit `feat(scanlines): Toolbar`.

### Task 13: `Tabs`

**Interfaces:** `Tabs(props: { tabs: { id: string; label: string }[]; activeId: string; onSelect: (id: string) => void }): JSX.Element` — `role="tablist"` + `role="tab"` buttons with `aria-selected`.

- [ ] Failing test: clicking a tab calls `onSelect(id)`; active tab has `aria-selected="true"`. RED → implement (buttons `role="tab"`, `aria-selected={t.id===activeId}`, `onClick={()=>onSelect(t.id)}`) → GREEN → barrel/surface → commit `feat(scanlines): Tabs`.

### Task 14: `FormRow`

**Interfaces:** `FormRow(props: { label: string; htmlFor?: string; hint?: string; error?: string; children: ReactNode }): JSX.Element`.

- [ ] Failing test: renders label bound to `htmlFor`; shows `error` text with `role="alert"`. RED → implement (`<div className="form-row"><label htmlFor={htmlFor}>{label}</label><div className="form-row__control">{children}</div>{hint && <p className="form-row__hint">{hint}</p>}{error && <p className="form-row__error" role="alert">{error}</p>}</div>`) → GREEN → barrel/surface → commit `feat(scanlines): FormRow`.

### Task 15: `Badge` / `StatusPill`

**Interfaces:** `Badge(props: { tone?: 'neutral' | 'signal' | 'positive' | 'warn' | 'danger'; children: ReactNode }): JSX.Element`; `StatusPill` = `Badge` with a leading dot.

- [ ] Failing test: `Badge` applies `badge--<tone>`; default tone `neutral`. RED → implement both (`StatusPill` renders `<span className="status-pill" data-tone={tone}><span className="status-pill__dot" aria-hidden />{children}</span>`) → GREEN → barrel/surface → commit `feat(scanlines): Badge + StatusPill`.

### Task 16: `EmptyState`

**Interfaces:** `EmptyState(props: { title: string; hint?: string; action?: ReactNode }): JSX.Element`.

- [ ] Failing test: renders title + optional hint + action slot. RED → implement (`<div className="empty-state"><p className="empty-state__title">{title}</p>{hint && <p className="empty-state__hint">{hint}</p>}{action}</div>`) → GREEN → barrel/surface → commit `feat(scanlines): EmptyState`.

### Task 17: Console-density `Panel` variant + kit CSS

**Files:** Modify `react/panel.tsx` (add `dense`/`variant="console"` prop, no card-glow); append kit styles to `react/console.css` (`.datatable`, `.toolbar`, `.tabs`, `.form-row`, `.badge`, `.status-pill`, `.empty-state`).

- [ ] Failing test: `<Panel variant="console">` applies `panel--console` (tighter, no glow). RED → implement → GREEN → add the kit CSS rules (token-driven, using the console table/contrast tokens) → `make test` → commit `feat(scanlines): console-density panel + kit styles`.

---

## PHASE 5 — Migrate admin (the proof)

Worktree: `undef-admin/frontend` on a new branch `chore/console-surface` (branch off `main`; surgical commits, never `git add -A` — repo has junk). Sibling source path `../../undef-logos/...`.

### Task 18: Re-vendor the layered slice + wire telemetry

- [ ] **Step 1: Branch + re-vendor**

```bash
cd /Users/tim/code/gh/undef-admin && git checkout -b chore/console-surface
cd frontend && rm -rf src/vendor/scanlines-system
node ../../undef-logos/packages/scanlines-system/scripts/sync-scanlines.mjs --target .
mkdir -p public && cp src/vendor/scanlines-system/dist/theme-boot.js public/theme-boot.js
npm install @provide-io/telemetry@^0.4.8
```

- [ ] **Step 2: Update sync/check scripts + scope** — `package.json` `sync:theme`/`check:theme` unchanged path; the vendored imports now use the layer dirs (`./vendor/scanlines-system/src/tokens/...`, `.../src/react/...`). Confirm `npm run check:theme` → `scanlines vendor OK`.

- [ ] **Step 3: Wire telemetry at boot** — in `src/main.tsx`: `import { setupTelemetry } from '@provide-io/telemetry'; import { wireScanlinesTelemetry } from './vendor/scanlines-system/src/react/telemetry'; setupTelemetry({ serviceName: 'undef-admin' }); wireScanlinesTelemetry('admin')` before `createRoot(...)`.

- [ ] **Step 4: Typecheck + commit** — `npm run typecheck`; surgical add (`src/vendor/scanlines-system`, `public/theme-boot.js`, `package.json`, `src/main.tsx`, force-add gitignored dist files); `git -c commit.gpgsign=false commit -m "chore(theme): vendor layered scanlines slice + wire telemetry"`.

### Task 19: Adopt the console surface + kit in admin

**Files:** Modify `src/App.tsx`, `src/main.tsx`, `index.html`, and the 6 data components (`Roles.tsx`, `Principals.tsx`, `Audit.tsx`, `Spend.tsx`, `Signals.tsx`, `Vendors.tsx`), `GrantEditor.tsx`; their tests.

- [ ] **Step 1: Shell + tokens** — `index.html` keeps `<script src="/theme-boot.js">`. `main.tsx` imports the console + kit CSS (`./vendor/scanlines-system/src/react/console.css`, `.../tokens/*.css`) and wraps `<ThemeProvider>`. In `App.tsx`, replace the bespoke header with `<ConsoleShell brandLabel="undef admin" nav={ADMIN_SURFACE_NAV_ITEMS} activeNavHref={...} utilities={<ThemeToggle/>}>` and render `<Tabs>` for the section switch. Keep `useTheme()` inside the shell (admin pattern — provider wraps App internally so bare `render(<App/>)` tests pass).

- [ ] **Step 2: Replace one table with `DataTable` (worked example — `Roles.tsx`)**

Replace `<div className="table-wrap"><table>…</table></div>` with:
```tsx
import { DataTable } from './vendor/scanlines-system/src/react/kit/DataTable'
import { Badge } from './vendor/scanlines-system/src/react/kit/Badge'
// ...
<DataTable
  caption="Role catalog"
  columns={[
    { key: 'role', header: 'Role' },
    { key: 'permissions', header: 'Permissions', render: (r) => r.permissions.map((p) => <Badge key={p}>{p}</Badge>) },
  ]}
  rows={roles}
  rowKey={(r) => r.role}
  empty={<EmptyState title="No roles" />}
  dense
/>
```
Update `Roles.test.tsx` to assert against the `DataTable` output (`getByRole('columnheader', { name: 'Role' })`, the `data-testid` row contract) — do NOT weaken assertions; keep the `data-testid="admin-roles-table"`/`admin-role-row` contract (pass `data-testid` through DataTable or wrap).

- [ ] **Step 3: Apply the same pattern** to `Principals.tsx`, `Audit.tsx`, `Spend.tsx`, `Signals.tsx`, `Vendors.tsx` (DataTable), and `GrantEditor.tsx` (`FormRow`/`FormGrid`). Use `StatusPill` for active/revoked + grant scopes. Remove the now-dead `.table-wrap`/`.permission-list` CSS from admin's `styles.css`.

- [ ] **Step 4: Gate** — `npm run typecheck && npm test && npm run build && npm run check:theme`. All green; existing tests pass against the kit (adjust assertions to the new DOM without weakening). If `@testing-library/jest-dom` is absent in admin, use `classList.contains()`.

- [ ] **Step 5: Commit** — surgical add of the changed source + tests; `git -c commit.gpgsign=false commit -m "feat(theme): adopt console surface + data kit in admin"`.

- [ ] **Step 6: Visual check (pre-merge)** — run admin locally; confirm the console shell (functional header, no scanline field, dense readable tables, accent-only lime) in dark + light. Document outcome.

---

## Out of scope / follow-ups
- **account → console:** separate fast-follow spec (same kit + `CONSOLE_PRESET`).
- **Repo extraction:** lifting `scanlines-system` into its own repo + renaming `undef-logos` — separate infra spec.

## Self-Review Notes
- **Spec coverage:** layers (T2–T5), surfaces-as-presets (T5), vendor surface (T6), telemetry seam + toggle + tokens hook (T7), console reading tokens (T8), ConsoleShell/Header (T9–T10), 6-component kit + density panel (T11–T17), admin migration (T18–T19), lab/Hugo gated (T1/T6), scope rename (T1). All spec sections map to tasks.
- **Type consistency:** `ScanlinesLogger`, `setScanlinesLogger`/`scanlinesLog`, `createScanlinesLogger`/`wireScanlinesTelemetry`, `SurfacePreset`/`CONSOLE_PRESET`/`MARKETING_PRESET`, `ConsoleHeaderProps`, `Column<T>`/`DataTableProps<T>` — defined once, consumed by exact name.
- **Known risk:** the reorg's internal relative-import repointing (T2–T5) is mechanical but broad; `make typecheck` after each move is the net. The barrel + lab/Hugo being barrel-only keeps the blast radius off consumers.
