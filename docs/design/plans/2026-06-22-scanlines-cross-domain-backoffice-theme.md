# Scanlines Cross-Domain Backoffice Theme Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the full scanlines visual treatment to the backoffice frontends (admin, account, account-linked) and unify every HTML-rendering `*.undef.games` surface onto one shared theme runtime and one cross-domain cookie.

**Architecture:** `packages/scanlines-system/src/theme/` becomes the single source of truth. The read+apply logic is authored once (`boot.ts`), compiled to a self-contained IIFE (`dist/theme-boot.js`) that every surface loads as a blocking `<head>` script for flash-free cross-domain theming. React apps additionally use a `ThemeProvider`/`useTheme` that imports the same apply function. A curated vendor slice is synced into each consumer repo with a hash-locked manifest that forbids drift. All previously divergent copies are deleted outright — no compatibility shims.

**Tech Stack:** TypeScript, React 19, Vite 8, Vitest 4, esbuild (IIFE build), Node ≥22, Hugo (flagship), Hono/Python workers (auth).

## Global Constraints

- Persisted theme key is `undef-logos-theme` — never rename it.
- Cookie attributes: `Domain=.undef.games` on `undef.games`/`*.undef.games` hosts (else host-only), `Path=/`, `Max-Age=31536000`, `SameSite=Lax`, `Secure` only on `https:`.
- Read order is always `localStorage` → cookie. Every write updates **both**.
- Canonical default palette — dark: `--fx-bg #050607`, `--fx-signal #d8ff35`, `--fx-text #f4f4f0`, `--fx-panel #08090a`; light: `--fx-bg #f4f0df`, `--fx-signal #405500`, `--fx-text #11130d`, `--fx-panel #ddd7c1`. The old Hugo blue defaults are dropped from the shared default.
- Loud scanline layers (`graph`, `crt`, `glitch`) stay `false` by default (`DEFAULT_SCANLINE_LAYERS`).
- Vendor slice **excludes** `station/`, `site/`, `sections.css`, `section-toys.css`, `hero.css`, `responsive.css`.
- **End-state only:** delete superseded code. No legacy functions, no import-compatibility wrappers, no deprecated re-exports.
- Do not publish `scanlines-system` to a registry; distribution is pull-sync/vendor.
- Consumer repos are siblings under `/Users/tim/code/gh/undef-games/`. From a consumer's `frontend/`, the source is `../../undef-logos/packages/scanlines-system`.
- Per `AGENTS.md`: do not commit `public/`, `lab/dist/`, `.terraform/`, `data/build.json`. Run `make typecheck && make test` before claiming undef-logos tasks complete.

---

## File Structure

**Source of truth — `undef-logos/packages/scanlines-system/`**
- `src/theme/persistence.ts` — MODIFY: format authority (already cookie+localStorage). Confirm constants.
- `src/theme/hydrate.ts` — MODIFY: export `applyThemeState(theme)`; reconcile default palette; remove now-unused wrappers.
- `src/theme/boot.ts` — CREATE: `applyStoredTheme()` pure read+apply.
- `src/theme/boot-entry.ts` — CREATE: side-effect entry that calls `applyStoredTheme()`.
- `src/theme/provider.tsx` — CREATE: `ThemeProvider`, `useTheme`.
- `src/theme/signal-color.ts` — CREATE: `SIGNAL_COLORS`, `getSignalColor`, `setSignalColor`.
- `src/shell/surface-config.ts` — MODIFY: add `'admin'` surface + admin nav.
- `src/styles/shell-admin.css` — CREATE.
- `src/styles/backdrop.css` — CREATE: `.scanlines-backdrop` (extracted from `.scan-fallback`).
- `src/styles/account.css` — CREATE: promote account's orphan vendor file into source.
- `scripts/build-theme-boot.mjs` — CREATE: esbuild IIFE build → `dist/theme-boot.js`.
- `scripts/vendor-surface.mjs` — CREATE: the explicit curated file list (shared by sync + tests).
- `scripts/sync-scanlines.mjs` — CREATE: pull + check + manifest.
- `themes/scanlines/assets/ts/theme-hydrate.ts` — REWRITE: thin toggle wiring importing shared code.
- `themes/scanlines/layouts/partials/head.html` — MODIFY: load `theme-boot.js`.

**Consumers (siblings)**
- `undef-admin/frontend/` — vendor slice + boot + provider + shell + styles (net-new).
- `undef-account/frontend/` — vendor refresh; delete `src/theme.ts`; field on.
- `undef-account-linked/frontend/` — vendor slice + full treatment.
- `undef-auth/src/ui.ts`, `undef-auth-uwarp/src/ui.ts` — replace bespoke inline boot with shared `theme-boot.js`.

---

## PHASE 0 — Canonical runtime (in `undef-logos`)

### Task 1: Reconcile canonical default palette in `hydrate.ts`

**Files:**
- Modify: `packages/scanlines-system/src/theme/hydrate.ts`
- Test: `packages/scanlines-system/src/theme/hydrate.test.ts` (create)

**Interfaces:**
- Produces: `applyThemeState(theme: ThemeState | null): void` — applies palette of the theme's `activeTone` (or defaults when `null`) to `document.documentElement`.

- [ ] **Step 1: Write the failing test**

```ts
// packages/scanlines-system/src/theme/hydrate.test.ts
import { afterEach, describe, expect, it } from 'vitest'
import { applyThemeState } from './hydrate'
import { createDefaultThemeState } from './persistence'

afterEach(() => {
  document.documentElement.removeAttribute('style')
  document.documentElement.removeAttribute('data-scan-tone')
})

describe('applyThemeState', () => {
  it('applies the brand lime dark default when given null', () => {
    applyThemeState(null)
    const root = document.documentElement
    expect(root.dataset.scanTone).toBe('dark')
    expect(root.style.getPropertyValue('--fx-bg').trim()).toBe('#050607')
    expect(root.style.getPropertyValue('--fx-signal').trim()).toBe('#d8ff35')
  })

  it('applies the light palette when activeTone is light', () => {
    const theme = createDefaultThemeState()
    theme.activeTone = 'light'
    applyThemeState(theme)
    expect(document.documentElement.dataset.scanTone).toBe('light')
    expect(document.documentElement.style.getPropertyValue('--fx-bg').trim()).toBe('#f4f0df')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --prefix lab exec -- vitest run ../packages/scanlines-system/src/theme/hydrate.test.ts`
Expected: FAIL — `applyThemeState` is not exported.

- [ ] **Step 3: Refactor `hydrate.ts` to export `applyThemeState`**

In `hydrate.ts`, change the module-private `applyPalette(settings, tone)` flow into an exported function that takes a `ThemeState | null`. Reuse the existing `applyPalette` body; derive `settings`/`tone` from the theme:

```ts
import type { ThemeState } from './persistence'

export function applyThemeState(theme: ThemeState | null): void {
  const activeTone = theme?.activeTone ?? 'dark'
  const settings = theme?.tones[activeTone]?.settings ?? DEFAULT_PALETTES[activeTone]
  applyPalette(settings, activeTone)
}
```

Update `DEFAULT_PALETTES.dark` in this file so its `paletteBg`/`paletteSignal`/`palettePanel`/`paletteText` match the Global Constraints (lime, `#050607` bg). Keep `applyPalette` as the internal helper.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm --prefix lab exec -- vitest run ../packages/scanlines-system/src/theme/hydrate.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Remove unused wrappers**

Grep for the old entrypoints and delete any that are now unused (end-state, no wrappers):

```bash
grep -rn "hydrateTheme\|initThemeHydration" packages lab themes --include=*.ts --include=*.tsx | grep -v hydrate.ts
```
If a match exists only in `hydrate.ts`, delete `hydrateTheme`/`initThemeHydration`/`toggleTheme`/`updateThemeToggle` from `hydrate.ts` (boot + provider replace them in later tasks). If a live consumer exists, repoint it to `applyThemeState` in that consumer's task. Re-run `make typecheck`.

- [ ] **Step 6: Commit**

```bash
git add packages/scanlines-system/src/theme/hydrate.ts packages/scanlines-system/src/theme/hydrate.test.ts
git commit -m "feat(theme): export applyThemeState with reconciled lime defaults"
```

---

### Task 2: `boot.ts` — pure read+apply

**Files:**
- Create: `packages/scanlines-system/src/theme/boot.ts`
- Test: `packages/scanlines-system/src/theme/boot.test.ts`

**Interfaces:**
- Consumes: `readThemeState` (persistence), `applyThemeState` (Task 1).
- Produces: `applyStoredTheme(): void` — reads stored state (localStorage→cookie) and applies it; never throws.

- [ ] **Step 1: Write the failing test**

```ts
// packages/scanlines-system/src/theme/boot.test.ts
import { afterEach, describe, expect, it } from 'vitest'
import { applyStoredTheme } from './boot'
import { STORAGE_KEY } from './persistence'

afterEach(() => {
  localStorage.clear()
  document.documentElement.removeAttribute('style')
  document.documentElement.removeAttribute('data-scan-tone')
})

describe('applyStoredTheme', () => {
  it('applies the dark default when nothing is stored', () => {
    applyStoredTheme()
    expect(document.documentElement.dataset.scanTone).toBe('dark')
  })

  it('applies a light tone read from localStorage', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ activeTone: 'light', version: 1 }))
    applyStoredTheme()
    expect(document.documentElement.dataset.scanTone).toBe('light')
  })

  it('does not throw on corrupt storage', () => {
    localStorage.setItem(STORAGE_KEY, '{not json')
    expect(() => { applyStoredTheme() }).not.toThrow()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --prefix lab exec -- vitest run ../packages/scanlines-system/src/theme/boot.test.ts`
Expected: FAIL — `boot.ts` does not exist.

- [ ] **Step 3: Implement `boot.ts`**

```ts
// packages/scanlines-system/src/theme/boot.ts
import { applyThemeState } from './hydrate'
import { readThemeState } from './persistence'

export function applyStoredTheme(): void {
  try {
    applyThemeState(readThemeState())
  } catch {
    document.documentElement.dataset.scanTone = 'dark'
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm --prefix lab exec -- vitest run ../packages/scanlines-system/src/theme/boot.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add packages/scanlines-system/src/theme/boot.ts packages/scanlines-system/src/theme/boot.test.ts
git commit -m "feat(theme): add applyStoredTheme boot helper"
```

---

### Task 3: Build the standalone `theme-boot.js` IIFE

**Files:**
- Create: `packages/scanlines-system/src/theme/boot-entry.ts`
- Create: `packages/scanlines-system/scripts/build-theme-boot.mjs`
- Modify: `lab/package.json` (add `build:theme-boot` script for esbuild resolution)
- Test: `packages/scanlines-system/scripts/build-theme-boot.test.mjs`

**Interfaces:**
- Produces: `packages/scanlines-system/dist/theme-boot.js` — a self-contained IIFE (no imports/exports) that applies the stored theme on load.

- [ ] **Step 1: Create the entry**

```ts
// packages/scanlines-system/src/theme/boot-entry.ts
import { applyStoredTheme } from './boot'
applyStoredTheme()
```

- [ ] **Step 2: Write the failing build test**

```js
// packages/scanlines-system/scripts/build-theme-boot.test.mjs
import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
const OUT = new URL('../dist/theme-boot.js', import.meta.url)
describe('theme-boot artifact', () => {
  it('exists and is a self-contained IIFE', () => {
    expect(existsSync(OUT)).toBe(true)
    const src = readFileSync(OUT, 'utf8')
    expect(src).not.toMatch(/\bimport\b/)
    expect(src).not.toMatch(/\bexport\b/)
    expect(src).toMatch(/scanTone/)
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm --prefix lab exec -- vitest run ../packages/scanlines-system/scripts/build-theme-boot.test.mjs`
Expected: FAIL — `dist/theme-boot.js` does not exist.

- [ ] **Step 4: Implement the build script + wire npm script**

```js
// packages/scanlines-system/scripts/build-theme-boot.mjs
import { build } from 'esbuild'
import { fileURLToPath } from 'node:url'

await build({
  entryPoints: [fileURLToPath(new URL('../src/theme/boot-entry.ts', import.meta.url))],
  outfile: fileURLToPath(new URL('../dist/theme-boot.js', import.meta.url)),
  bundle: true,
  minify: true,
  format: 'iife',
  target: 'es2019',
  legalComments: 'none',
})
console.log('built dist/theme-boot.js')
```

Add to `lab/package.json` `scripts`: `"build:theme-boot": "node ../packages/scanlines-system/scripts/build-theme-boot.mjs"`.

- [ ] **Step 5: Build and verify the test passes**

Run: `npm --prefix lab run build:theme-boot && npm --prefix lab exec -- vitest run ../packages/scanlines-system/scripts/build-theme-boot.test.mjs`
Expected: build logs `built dist/theme-boot.js`; test PASS.

- [ ] **Step 6: Commit** (do not gitignore `dist/theme-boot.js` — it is the synced artifact)

```bash
git add packages/scanlines-system/src/theme/boot-entry.ts packages/scanlines-system/scripts/build-theme-boot.mjs packages/scanlines-system/scripts/build-theme-boot.test.mjs packages/scanlines-system/dist/theme-boot.js lab/package.json
git commit -m "feat(theme): build self-contained theme-boot IIFE"
```

---

### Task 4: `ThemeProvider` / `useTheme`

**Files:**
- Create: `packages/scanlines-system/src/theme/provider.tsx`
- Test: `packages/scanlines-system/src/theme/provider.test.tsx`

**Interfaces:**
- Consumes: `readThemeState`, `writeThemeState`, `createDefaultThemeState` (persistence), `applyThemeState` (hydrate).
- Produces:
  - `ThemeProvider({ children }: { children: ReactNode }): JSX.Element`
  - `useTheme(): { tone: 'dark' | 'light'; toggle: () => void }`

- [ ] **Step 1: Write the failing test**

```tsx
// packages/scanlines-system/src/theme/provider.test.tsx
import { afterEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider, useTheme } from './provider'
import { STORAGE_KEY } from './persistence'

function Probe() {
  const { tone, toggle } = useTheme()
  return <button onClick={toggle}>tone:{tone}</button>
}

afterEach(() => { localStorage.clear() })

describe('ThemeProvider', () => {
  it('toggles tone and writes both stores', async () => {
    const user = userEvent.setup()
    render(<ThemeProvider><Probe /></ThemeProvider>)
    expect(screen.getByRole('button')).toHaveTextContent('tone:dark')
    await user.click(screen.getByRole('button'))
    expect(screen.getByRole('button')).toHaveTextContent('tone:light')
    expect(localStorage.getItem(STORAGE_KEY)).toContain('"activeTone":"light"')
    expect(document.cookie).toContain(`${STORAGE_KEY}=`)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --prefix lab exec -- vitest run ../packages/scanlines-system/src/theme/provider.test.tsx`
Expected: FAIL — `provider.tsx` does not exist.

- [ ] **Step 3: Implement `provider.tsx`**

```tsx
// packages/scanlines-system/src/theme/provider.tsx
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { applyThemeState } from './hydrate'
import { createDefaultThemeState, readThemeState, writeThemeState } from './persistence'

type Tone = 'dark' | 'light'
interface ThemeContextValue { tone: Tone; toggle: () => void }
const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [tone, setTone] = useState<Tone>(() => readThemeState()?.activeTone ?? 'dark')

  useEffect(() => {
    applyThemeState(readThemeState())
    const onStorage = () => {
      const next = readThemeState()
      setTone(next?.activeTone ?? 'dark')
      applyThemeState(next)
    }
    window.addEventListener('storage', onStorage)
    return () => { window.removeEventListener('storage', onStorage) }
  }, [])

  const toggle = useCallback(() => {
    const current = readThemeState() ?? createDefaultThemeState()
    const nextTone: Tone = current.activeTone === 'light' ? 'dark' : 'light'
    const next = { ...current, activeTone: nextTone }
    writeThemeState(next)
    applyThemeState(next)
    setTone(nextTone)
    window.dispatchEvent(new CustomEvent('undef-theme-change'))
  }, [])

  const value = useMemo(() => ({ tone, toggle }), [tone, toggle])
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (ctx === null) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm --prefix lab exec -- vitest run ../packages/scanlines-system/src/theme/provider.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/scanlines-system/src/theme/provider.tsx packages/scanlines-system/src/theme/provider.test.tsx
git commit -m "feat(theme): add ThemeProvider and useTheme"
```

---

### Task 5: Shared signal-color helpers (for account)

**Files:**
- Create: `packages/scanlines-system/src/theme/signal-color.ts`
- Test: `packages/scanlines-system/src/theme/signal-color.test.ts`

**Interfaces:**
- Produces:
  - `SIGNAL_COLORS: ReadonlyArray<{ label: string; value: string }>`
  - `getSignalColor(): string`
  - `setSignalColor(hex: string): void` — mutates `tones[activeTone].settings.{paletteSignal,paletteGlow,paletteSupport1}` and writes both stores.

- [ ] **Step 1: Write the failing test**

```ts
// packages/scanlines-system/src/theme/signal-color.test.ts
import { afterEach, describe, expect, it } from 'vitest'
import { SIGNAL_COLORS, getSignalColor, setSignalColor } from './signal-color'
import { STORAGE_KEY } from './persistence'

afterEach(() => { localStorage.clear() })

describe('signal color', () => {
  it('exposes the brand swatches', () => {
    expect(SIGNAL_COLORS[0].value).toBe('#d8ff35')
  })
  it('round-trips a chosen color through storage', () => {
    setSignalColor('#69a7ff')
    expect(getSignalColor()).toBe('#69a7ff')
    expect(localStorage.getItem(STORAGE_KEY)).toContain('#69a7ff')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --prefix lab exec -- vitest run ../packages/scanlines-system/src/theme/signal-color.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `signal-color.ts`** (built on shared persistence — no bespoke cookie code)

```ts
// packages/scanlines-system/src/theme/signal-color.ts
import { createDefaultThemeState, readThemeState, writeThemeState } from './persistence'

export const SIGNAL_COLORS = [
  { label: 'Signal', value: '#d8ff35' },
  { label: 'Blue', value: '#69a7ff' },
  { label: 'Teal', value: '#5eead4' },
  { label: 'Amber', value: '#fbbf24' },
  { label: 'Ember', value: '#ff6b6b' },
  { label: 'Violet', value: '#c084fc' },
] as const

export function getSignalColor(): string {
  const theme = readThemeState() ?? createDefaultThemeState()
  return theme.tones[theme.activeTone].settings.paletteSignal ?? '#d8ff35'
}

export function setSignalColor(hex: string): void {
  const theme = readThemeState() ?? createDefaultThemeState()
  const tone = theme.activeTone
  const next = {
    ...theme,
    tones: {
      ...theme.tones,
      [tone]: {
        ...theme.tones[tone],
        settings: { ...theme.tones[tone].settings, paletteSignal: hex, paletteGlow: hex, paletteSupport1: hex },
      },
    },
  }
  writeThemeState(next)
}
```

> Note: if `EffectsSettings` does not declare `paletteSignal`/`paletteGlow`/`paletteSupport1`, confirm the field names in `station/effects-config.ts` and use the real keys. Do not invent keys.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm --prefix lab exec -- vitest run ../packages/scanlines-system/src/theme/signal-color.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/scanlines-system/src/theme/signal-color.ts packages/scanlines-system/src/theme/signal-color.test.ts
git commit -m "feat(theme): shared signal-color helpers over persistence"
```

---

### Task 6: Add `admin` surface to `surface-config.ts`

**Files:**
- Modify: `packages/scanlines-system/src/shell/surface-config.ts`
- Test: `packages/scanlines-system/src/shell/surface-config.test.ts` (create)

**Interfaces:**
- Produces: `ScanlinesSurface = 'site' | 'auth' | 'account' | 'admin'`; `ADMIN_SURFACE_NAV_ITEMS: ScanlinesNavItem[]`.

- [ ] **Step 1: Write the failing test**

```ts
// packages/scanlines-system/src/shell/surface-config.test.ts
import { describe, expect, it } from 'vitest'
import { ADMIN_SURFACE_NAV_ITEMS } from './surface-config'

describe('admin surface', () => {
  it('exposes admin nav items', () => {
    expect(ADMIN_SURFACE_NAV_ITEMS.map((i) => i.label)).toContain('Principals')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --prefix lab exec -- vitest run ../packages/scanlines-system/src/shell/surface-config.test.ts`
Expected: FAIL — `ADMIN_SURFACE_NAV_ITEMS` not exported.

- [ ] **Step 3: Edit `surface-config.ts`**

Change the type and append:

```ts
export type ScanlinesSurface = 'site' | 'auth' | 'account' | 'admin'

export const ADMIN_SURFACE_NAV_ITEMS: ScanlinesNavItem[] = [
  { href: '#principals', label: 'Principals' },
  { href: '#roles', label: 'Roles' },
  { href: '#audit', label: 'Audit' },
  { href: '#signals', label: 'Signals' },
  { href: '#spend', label: 'Spend' },
]
```

- [ ] **Step 4: Run test + typecheck**

Run: `npm --prefix lab exec -- vitest run ../packages/scanlines-system/src/shell/surface-config.test.ts && make typecheck`
Expected: PASS; typecheck clean (header already keys on `ScanlinesSurface`).

- [ ] **Step 5: Commit**

```bash
git add packages/scanlines-system/src/shell/surface-config.ts packages/scanlines-system/src/shell/surface-config.test.ts
git commit -m "feat(shell): add admin surface and nav"
```

---

### Task 7: Create `backdrop.css`, `shell-admin.css`, promote `account.css`

**Files:**
- Create: `packages/scanlines-system/src/styles/backdrop.css`
- Create: `packages/scanlines-system/src/styles/shell-admin.css`
- Create: `packages/scanlines-system/src/styles/account.css` (copy current `undef-account/frontend/src/vendor/scanlines-system/styles/account.css` verbatim into source)
- Test: `packages/scanlines-system/src/styles/styles.test.ts`

**Interfaces:**
- Produces CSS classes `.scanlines-backdrop`, `.scanlines-header--admin`.

- [ ] **Step 1: Write the failing test**

```ts
// packages/scanlines-system/src/styles/styles.test.ts
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
const read = (f: string) => readFileSync(new URL(`./${f}`, import.meta.url), 'utf8')
describe('backoffice styles', () => {
  it('backdrop defines the scanline field class', () => {
    expect(read('backdrop.css')).toMatch(/\.scanlines-backdrop\s*\{/)
  })
  it('admin shell variant exists', () => {
    expect(read('shell-admin.css')).toMatch(/\.scanlines-header--admin/)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --prefix lab exec -- vitest run ../packages/scanlines-system/src/styles/styles.test.ts`
Expected: FAIL — files do not exist.

- [ ] **Step 3: Create `backdrop.css`** (quiet CSS field extracted from `.scan-fallback`, layers off)

```css
/* packages/scanlines-system/src/styles/backdrop.css */
.scanlines-backdrop {
  min-height: 100svh;
  background:
    repeating-linear-gradient(0deg, rgb(var(--fx-muted-rgb, 244 244 240) / 0.05) 0 1px, transparent 1px 12px),
    radial-gradient(circle at 78% 18%, rgb(var(--fx-signal-rgb, 216 255 53) / 0.10), transparent 34%),
    var(--fx-bg, #050607);
  color: var(--fx-text, #f4f4f0);
}
```

Create `shell-admin.css` modeled on `shell-account.css` (sticky header, left nav, right utilities):

```css
/* packages/scanlines-system/src/styles/shell-admin.css */
.scanlines-header--admin {
  position: sticky;
  top: 0;
  z-index: 20;
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgb(var(--fx-muted-rgb, 244 244 240) / 0.14);
}
.scanlines-header--admin .scanlines-header__nav { justify-content: flex-start; }
.scanlines-header--admin .scanlines-header__utilities { justify-content: flex-end; }
```

Copy account.css into source:

```bash
cp ../undef-account/frontend/src/vendor/scanlines-system/styles/account.css packages/scanlines-system/src/styles/account.css
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm --prefix lab exec -- vitest run ../packages/scanlines-system/src/styles/styles.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/scanlines-system/src/styles/backdrop.css packages/scanlines-system/src/styles/shell-admin.css packages/scanlines-system/src/styles/account.css packages/scanlines-system/src/styles/styles.test.ts
git commit -m "feat(styles): add backdrop, admin shell, promote account.css"
```

---

### Task 8: Rewrite Hugo `theme-hydrate.ts` as a thin entry (delete the duplicate)

**Files:**
- Rewrite: `themes/scanlines/assets/ts/theme-hydrate.ts`
- Modify: `themes/scanlines/layouts/partials/head.html`

**Interfaces:**
- Consumes: `applyStoredTheme`, `readThemeState`, `writeThemeState`, `createDefaultThemeState`, `applyThemeState` (all from `@undef/scanlines-system`).

- [ ] **Step 1: Replace the file contents entirely** (no legacy palette code remains)

```ts
// themes/scanlines/assets/ts/theme-hydrate.ts
import {
  applyStoredTheme,
  applyThemeState,
  createDefaultThemeState,
  readThemeState,
  writeThemeState,
} from '@undef/scanlines-system'

applyStoredTheme()

function toggle() {
  const current = readThemeState() ?? createDefaultThemeState()
  const next = { ...current, activeTone: current.activeTone === 'light' ? 'dark' : 'light' as const }
  writeThemeState(next)
  applyThemeState(next)
  window.dispatchEvent(new CustomEvent('undef-theme-change'))
}

function init() {
  document.querySelector<HTMLButtonElement>('[data-theme-toggle]')?.addEventListener('click', toggle)
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true })
} else {
  init()
}
window.addEventListener('storage', () => { applyStoredTheme() })
```

- [ ] **Step 2: Add the boot artifact to Hugo `<head>`**

The synced boot lives at `themes/scanlines/static/js/theme-boot.js` (Task 12 syncs it; serves at `/js/theme-boot.js`). Add to `head.html` **before** any other script:

```html
<script src="/js/theme-boot.js"></script>
```

- [ ] **Step 3: Typecheck + build the site**

Run: `make typecheck && make build-hugo`
Expected: typecheck clean; Hugo builds. (Boot file presence is finalized in Task 12; if missing locally, run Task 12 sync first.)

- [ ] **Step 4: Update/relax the old localStorage e2e if present, then commit**

```bash
git add themes/scanlines/assets/ts/theme-hydrate.ts themes/scanlines/layouts/partials/head.html
git commit -m "refactor(hugo): thin theme entry over shared runtime; load theme-boot"
```

---

## PHASE 1 — Vendor surface + sync tooling (in `undef-logos`)

### Task 9: Define the curated vendor surface

**Files:**
- Create: `packages/scanlines-system/scripts/vendor-surface.mjs`
- Test: `packages/scanlines-system/scripts/vendor-surface.test.mjs`

**Interfaces:**
- Produces: `export const VENDOR_FILES: string[]` (paths relative to `packages/scanlines-system/`), and `export const VENDOR_DEST = 'src/vendor/scanlines-system'`.

- [ ] **Step 1: Write the failing test**

```js
// packages/scanlines-system/scripts/vendor-surface.test.mjs
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { VENDOR_FILES } from './vendor-surface.mjs'

describe('vendor surface', () => {
  it('lists only existing files and excludes station/site', () => {
    expect(VENDOR_FILES.length).toBeGreaterThan(0)
    for (const rel of VENDOR_FILES) {
      expect(existsSync(fileURLToPath(new URL(`../${rel}`, import.meta.url)))).toBe(true)
    }
    expect(VENDOR_FILES.some((f) => f.includes('/station/'))).toBe(false)
    expect(VENDOR_FILES.some((f) => f.endsWith('dist/theme-boot.js'))).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --prefix lab exec -- vitest run ../packages/scanlines-system/scripts/vendor-surface.test.mjs`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `vendor-surface.mjs`** (explicit list — no globbing of `station/`)

```js
// packages/scanlines-system/scripts/vendor-surface.mjs
export const VENDOR_DEST = 'src/vendor/scanlines-system'
export const VENDOR_FILES = [
  'src/theme/persistence.ts',
  'src/theme/hydrate.ts',
  'src/theme/boot.ts',
  'src/theme/provider.tsx',
  'src/theme/signal-color.ts',
  'src/shell/brand-mark.tsx',
  'src/shell/mark-geometry.ts',
  'src/shell/header.tsx',
  'src/shell/surface-config.ts',
  'src/primitives/field.tsx',
  'src/primitives/panel.tsx',
  'src/primitives/button.tsx',
  'src/primitives/notice.tsx',
  'src/styles/reset.css',
  'src/styles/tokens.css',
  'src/styles/fonts.css',
  'src/styles/shell.css',
  'src/styles/shell-account.css',
  'src/styles/shell-auth.css',
  'src/styles/shell-admin.css',
  'src/styles/backdrop.css',
  'src/styles/account.css',
  'dist/theme-boot.js',
]
```

> Before finalizing, confirm `station/` is not imported by any listed file: `grep -rn "station/" packages/scanlines-system/src/{theme,shell,primitives}`. If `scanline-engine`/`effects-config` types leak in via `persistence.ts`, those type-only imports are acceptable in vendored TS (they compile in the consumer because the consumer only needs the types at build) — but verify the consumer's `tsc` resolves them; if not, inline the needed types into `persistence.ts` as part of this task. Do not ship broken imports.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm --prefix lab exec -- vitest run ../packages/scanlines-system/scripts/vendor-surface.test.mjs`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/scanlines-system/scripts/vendor-surface.mjs packages/scanlines-system/scripts/vendor-surface.test.mjs
git commit -m "feat(sync): define curated vendor surface"
```

> **Dependency note for Task 9:** if `persistence.ts` imports values (not just types) from `station/`, the vendor slice breaks the "exclude station" constraint. Resolve by splitting the pure `ThemeState` types/persistence into a station-free module during this task, and update `VENDOR_FILES`. This is the one place the architecture may need a real refactor — budget for it.

---

### Task 10: `sync-scanlines.mjs` — pull + manifest

**Files:**
- Create: `packages/scanlines-system/scripts/sync-scanlines.mjs`
- Test: `packages/scanlines-system/scripts/sync-scanlines.test.mjs`

**Interfaces:**
- CLI: `node sync-scanlines.mjs --target <dir>` copies `VENDOR_FILES` from the source package into `<target>/<VENDOR_DEST>` and writes `<target>/<VENDOR_DEST>/VENDOR_MANIFEST.json` = `{ sourceSha, files: { <relpath>: <sha256> } }`.
- CLI: `--check --target <dir>` recomputes hashes of vendored files and exits non-zero on mismatch (self-consistency; no source needed).
- Exports `syncTo(targetDir, sourceDir)`, `checkTarget(targetDir)` for tests.

- [ ] **Step 1: Write the failing test**

```js
// packages/scanlines-system/scripts/sync-scanlines.test.mjs
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import { checkTarget, syncTo } from './sync-scanlines.mjs'

const SOURCE = fileURLToPath(new URL('..', import.meta.url)) // packages/scanlines-system
const targets = []
afterEach(() => { targets.length = 0 })

describe('sync-scanlines', () => {
  it('copies the surface and a manifest, then self-check passes', () => {
    const t = mkdtempSync(join(tmpdir(), 'vendor-'))
    targets.push(t)
    syncTo(t, SOURCE)
    expect(checkTarget(t)).toEqual({ ok: true, mismatches: [] })
  })

  it('self-check fails when a vendored file is hand-edited', () => {
    const t = mkdtempSync(join(tmpdir(), 'vendor-'))
    targets.push(t)
    syncTo(t, SOURCE)
    const f = join(t, 'src/vendor/scanlines-system/src/theme/boot.ts')
    writeFileSync(f, `${readFileSync(f, 'utf8')}\n// tampered`)
    const res = checkTarget(t)
    expect(res.ok).toBe(false)
    expect(res.mismatches.some((m) => m.includes('boot.ts'))).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --prefix lab exec -- vitest run ../packages/scanlines-system/scripts/sync-scanlines.test.mjs`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `sync-scanlines.mjs`**

```js
// packages/scanlines-system/scripts/sync-scanlines.mjs
import { createHash } from 'node:crypto'
import { cpSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'
import { VENDOR_DEST, VENDOR_FILES } from './vendor-surface.mjs'

const MANIFEST = 'VENDOR_MANIFEST.json'
const sha256 = (buf) => createHash('sha256').update(buf).digest('hex')

function sourceSha(sourceDir) {
  try { return execFileSync('git', ['-C', sourceDir, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim() }
  catch { return 'unknown' }
}

export function syncTo(targetDir, sourceDir) {
  const destRoot = join(targetDir, VENDOR_DEST)
  const files = {}
  for (const rel of VENDOR_FILES) {
    const from = join(sourceDir, rel)
    const to = join(destRoot, rel)
    mkdirSync(dirname(to), { recursive: true })
    cpSync(from, to)
    files[rel] = sha256(readFileSync(to))
  }
  mkdirSync(destRoot, { recursive: true })
  writeFileSync(join(destRoot, MANIFEST), `${JSON.stringify({ sourceSha: sourceSha(sourceDir), files }, null, 2)}\n`)
}

export function checkTarget(targetDir) {
  const destRoot = join(targetDir, VENDOR_DEST)
  const manifest = JSON.parse(readFileSync(join(destRoot, MANIFEST), 'utf8'))
  const mismatches = []
  for (const [rel, want] of Object.entries(manifest.files)) {
    let got
    try { got = sha256(readFileSync(join(destRoot, rel))) } catch { got = 'MISSING' }
    if (got !== want) mismatches.push(rel)
  }
  return { ok: mismatches.length === 0, mismatches }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2)
  const targetDir = args[args.indexOf('--target') + 1] ?? '.'
  const sourceDir = fileURLToPath(new URL('..', import.meta.url))
  if (args.includes('--check')) {
    const res = checkTarget(targetDir)
    if (!res.ok) { console.error('scanlines vendor drift:', res.mismatches.join(', ')); process.exit(1) }
    console.log('scanlines vendor OK')
  } else {
    syncTo(targetDir, sourceDir)
    console.log(`synced scanlines vendor into ${targetDir}`)
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm --prefix lab exec -- vitest run ../packages/scanlines-system/scripts/sync-scanlines.test.mjs`
Expected: PASS (2 tests).

- [ ] **Step 5: Run the full undef-logos suite + commit**

Run: `make typecheck && make test`
Expected: PASS.

```bash
git add packages/scanlines-system/scripts/sync-scanlines.mjs packages/scanlines-system/scripts/sync-scanlines.test.mjs
git commit -m "feat(sync): pull-mode sync with hash-locked manifest and --check"
```

---

## PHASE 2 — Consumer rollout

> Each consumer runs the source script via the sibling path. Pull command (from `<repo>/frontend`):
> `node ../../undef-logos/packages/scanlines-system/scripts/sync-scanlines.mjs --target .`
> Check command: append `--check`. Commits in these tasks happen **in the consumer repo**.

### Task 11: undef-admin — vendor sync + scripts + CI check

**Files:**
- Create (generated): `undef-admin/frontend/src/vendor/scanlines-system/**` + `VENDOR_MANIFEST.json`
- Modify: `undef-admin/frontend/package.json`

- [ ] **Step 1: Pull the vendor slice**

```bash
cd /Users/tim/code/gh/undef-games/undef-admin/frontend
node ../../undef-logos/packages/scanlines-system/scripts/sync-scanlines.mjs --target .
```
Expected: `synced scanlines vendor into .`; `src/vendor/scanlines-system/` populated with a `VENDOR_MANIFEST.json`.

- [ ] **Step 2: Add sync/check npm scripts**

In `undef-admin/frontend/package.json` `scripts`, add:
```json
"sync:theme": "node ../../undef-logos/packages/scanlines-system/scripts/sync-scanlines.mjs --target .",
"check:theme": "node ../../undef-logos/packages/scanlines-system/scripts/sync-scanlines.mjs --check --target ."
```

- [ ] **Step 3: Verify the self-check passes**

Run: `npm run check:theme`
Expected: `scanlines vendor OK`.

- [ ] **Step 4: Commit (in undef-admin)**

```bash
git add src/vendor/scanlines-system package.json
git commit -m "chore(theme): vendor scanlines-system slice"
```

---

### Task 12: undef-admin — boot script + shell + provider + toggle

**Files:**
- Modify: `undef-admin/frontend/index.html`
- Modify: `undef-admin/frontend/src/main.tsx`
- Modify: `undef-admin/frontend/src/App.tsx`
- Test: `undef-admin/frontend/src/App.test.tsx` (extend)
- Copy: sync also placed `dist/theme-boot.js` under vendor; copy it to `public/`.

**Interfaces:**
- Consumes: `ThemeProvider`, `useTheme`, `ScanlinesHeader`, `ADMIN_SURFACE_NAV_ITEMS` from the vendored slice.

- [ ] **Step 1: Place the boot artifact in `public/` and reference it**

```bash
mkdir -p public && cp src/vendor/scanlines-system/dist/theme-boot.js public/theme-boot.js
```
Edit `index.html` `<head>` (first line inside head, before other scripts):
```html
<script src="/theme-boot.js"></script>
```
Add to `package.json` `sync:theme` a trailing copy so the artifact stays fresh:
```json
"sync:theme": "node ../../undef-logos/packages/scanlines-system/scripts/sync-scanlines.mjs --target . && cp src/vendor/scanlines-system/dist/theme-boot.js public/theme-boot.js"
```

- [ ] **Step 2: Write the failing test (header + toggle)**

```tsx
// add to undef-admin/frontend/src/App.test.tsx
import userEvent from '@testing-library/user-event'
// ... inside describe:
it('renders the scanlines admin header and toggles theme via cookie', async () => {
  const user = userEvent.setup()
  render(<App client={stubClient} currentGrants={[]} initialAccessToken={null} />)
  expect(screen.getByRole('banner')).toHaveClass('scanlines-header--admin')
  await user.click(screen.getByRole('button', { name: /theme/i }))
  expect(localStorage.getItem('undef-logos-theme')).toContain('"activeTone"')
})
```
(Use the existing test's stub client/props; reuse whatever harness `App.test.tsx` already sets up.)

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -- src/App.test.tsx`
Expected: FAIL — no `scanlines-header--admin` banner / no theme button.

- [ ] **Step 4: Wrap the app + render the shell**

In `src/main.tsx`, import the vendored styles and wrap with the provider:
```tsx
import { ThemeProvider } from "./vendor/scanlines-system/theme/provider";
import "./vendor/scanlines-system/styles/reset.css";
import "./vendor/scanlines-system/styles/tokens.css";
import "./vendor/scanlines-system/styles/fonts.css";
import "./vendor/scanlines-system/styles/shell.css";
import "./vendor/scanlines-system/styles/shell-admin.css";
import "./vendor/scanlines-system/styles/backdrop.css";
import "./styles.css";
// ...
createRoot(rootElement).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>
);
```
In `src/App.tsx`, render the header and a toggle, and wrap content in `.scanlines-backdrop`:
```tsx
import { ScanlinesHeader } from "./vendor/scanlines-system/shell/header";
import { ADMIN_SURFACE_NAV_ITEMS } from "./vendor/scanlines-system/shell/surface-config";
import { useTheme } from "./vendor/scanlines-system/theme/provider";
// inside App render, at the top level:
const { tone, toggle } = useTheme();
return (
  <div className="scanlines-backdrop">
    <ScanlinesHeader
      surface="admin"
      brandLabel="undef admin"
      navItems={ADMIN_SURFACE_NAV_ITEMS}
      accountSlot={<button type="button" onClick={toggle} aria-label="Toggle theme">{tone === 'light' ? '☾' : '☀'}</button>}
    />
    {/* existing tab UI */}
  </div>
);
```

- [ ] **Step 5: Run test, typecheck, build**

Run: `npm test -- src/App.test.tsx && npm run typecheck && npm run build`
Expected: PASS; clean typecheck; successful build.

- [ ] **Step 6: Commit (in undef-admin)**

```bash
git add index.html public/theme-boot.js src/main.tsx src/App.tsx src/App.test.tsx package.json
git commit -m "feat(theme): full scanlines treatment + cross-domain cookie on admin"
```

---

### Task 13: undef-account — migrate off bespoke `theme.ts`

**Files:**
- Pull vendor (as Task 11, target `undef-account/frontend`) + add `sync:theme`/`check:theme` scripts + `public/theme-boot.js`.
- Delete: `undef-account/frontend/src/theme.ts`
- Modify: `undef-account/frontend/src/App.tsx`, `src/main.tsx`, `index.html`
- Modify/Delete: `undef-account/frontend/src/theme.test.ts` (replace with imports from vendored helpers)

- [ ] **Step 1: Pull vendor + scripts + boot artifact**

```bash
cd /Users/tim/code/gh/undef-games/undef-account/frontend
node ../../undef-logos/packages/scanlines-system/scripts/sync-scanlines.mjs --target .
mkdir -p public && cp src/vendor/scanlines-system/dist/theme-boot.js public/theme-boot.js
```
Add the same `sync:theme` (with the `cp`) and `check:theme` scripts as Task 12 Step 1.

- [ ] **Step 2: Repoint imports, delete `theme.ts`**

In `src/App.tsx`, replace:
```tsx
import { SIGNAL_COLORS, applyThemeFromStorage, getSignalColor, saveSignalColor } from "./theme";
```
with:
```tsx
import { SIGNAL_COLORS, getSignalColor, setSignalColor } from "./vendor/scanlines-system/theme/signal-color";
```
Rename the call site `saveSignalColor(x)` → `setSignalColor(x)`. Remove the `applyThemeFromStorage()` `useEffect` (the `<head>` boot + `ThemeProvider` now handle apply). Then:
```bash
git rm src/theme.ts
```

- [ ] **Step 3: Wrap with provider + boot, flip the field on**

In `src/main.tsx` add the vendored style imports (reset, tokens, fonts, shell, shell-account, backdrop, then `account.css`, then `./styles.css`) and wrap `<App/>` in `<ThemeProvider>` (mirror Task 12 Step 4). In `index.html` `<head>` add `<script src="/theme-boot.js"></script>`. In `App.tsx`, wrap the app root in `<div className="scanlines-backdrop account-app">` to enable the field (supersedes the prior "field off" state).

- [ ] **Step 4: Rewrite the theme test against shared helpers**

Replace `src/theme.test.ts` contents to import `getSignalColor`/`setSignalColor` from the vendored module and assert the cookie round-trip (mirror Task 5's test). Run:
`npm test -- src/theme.test.ts`
Expected: PASS.

- [ ] **Step 5: Full app test + typecheck + build**

Run: `npm test && npm run typecheck && npm run build && npm run check:theme`
Expected: PASS; clean; `scanlines vendor OK`. Fix any signal-picker test IDs that referenced the deleted module.

- [ ] **Step 6: Commit (in undef-account)**

```bash
git add -A
git commit -m "refactor(theme): adopt shared scanlines runtime; remove bespoke theme.ts; field on"
```

---

### Task 14: undef-account-linked — full treatment

**Files:**
- `undef-account-linked/frontend/**` (same shape as account)

- [ ] **Step 1: Inspect its current theme usage**

Run: `grep -rn "undef-logos-theme\|theme" /Users/tim/code/gh/undef-games/undef-account-linked/frontend/src --include=*.ts --include=*.tsx | grep -v vendor`
Identify any bespoke theme code to delete.

- [ ] **Step 2: Pull vendor + scripts + boot** (as Task 13 Step 1, target `undef-account-linked/frontend`).

- [ ] **Step 3: Delete bespoke theme code; wrap with `ThemeProvider`; add `<head>` boot; render `ScanlinesHeader surface="account"` + `.scanlines-backdrop`** (mirror Tasks 12–13).

- [ ] **Step 4: Test + typecheck + build + check**

Run: `npm test && npm run typecheck && npm run build && npm run check:theme`
Expected: PASS.

- [ ] **Step 5: Commit (in undef-account-linked)**

```bash
git add -A
git commit -m "feat(theme): full scanlines treatment + shared cookie"
```

---

### Task 15: undef-auth + undef-auth-uwarp — shared boot in `ui.ts`

**Files:**
- Modify: `undef-auth/src/ui.ts`, `undef-auth-uwarp/src/ui.ts`
- Add static asset: serve `theme-boot.js` from each worker (pull into the repo's served-static dir).

- [ ] **Step 1: Confirm how the worker serves static assets**

Run: `grep -rn "ui.ts\|assets\|static\|\.css\|<script" /Users/tim/code/gh/undef-games/undef-auth/src --include=*.ts | head -30`
Determine where `ui.ts` HTML is built and whether a static path (e.g. `/theme-boot.js`) is already served.

- [ ] **Step 2: Pull the boot artifact into the served path**

Sync the vendor slice into the auth repo (it already vendors `scanlines-system`; extend its existing sync) and copy `dist/theme-boot.js` to the worker's served static location.

- [ ] **Step 3: Replace the hand-rolled inline boot**

In `ui.ts`, delete the bespoke inline script (the `var prefix='undef-logos-theme='…` block ~lines 180-191 and the `SharedThemeState`/preset palette derivation that only re-implements persistence) and inject into `<head>`:
```html
<script src="/theme-boot.js"></script>
```
Keep auth-specific scanline-field rendering (`deriveAuthScanlinePreset`) — that is surface-specific motion, not theme persistence — but have it read tone via `document.documentElement.dataset.scanTone` set by the shared boot, not its own cookie parse.

- [ ] **Step 4: Run the auth test suite + build**

Run the repo's tests (e.g. `npm test` / `make test` in `undef-auth`). Expected: consent screen renders; tone derives from the shared cookie.

- [ ] **Step 5: Commit (in each auth repo)**

```bash
git add -A
git commit -m "refactor(theme): use shared theme-boot; drop bespoke cookie parse"
```

---

## PHASE 3 — Cross-domain verification

### Task 16: Cross-domain e2e + per-surface deploy verification

**Files:**
- Add: `undef-logos/tests/e2e/cross-domain-theme.spec.ts` (or extend existing e2e)

- [ ] **Step 1: Write a cross-domain cookie e2e**

Simulate the shared cookie carrier: set `undef-logos-theme` (activeTone light) as a cookie scoped to the test host, load each built surface, assert `document.documentElement.dataset.scanTone === 'light'` before interaction.

```ts
// undef-logos/tests/e2e/cross-domain-theme.spec.ts
import { expect, test } from '@playwright/test'

test('honors a pre-set theme cookie on first paint', async ({ context, page }) => {
  await context.addCookies([{ name: 'undef-logos-theme', value: encodeURIComponent(JSON.stringify({ activeTone: 'light', version: 1 })), url: 'http://127.0.0.1:1780' }])
  await page.goto('http://127.0.0.1:1780/')
  await expect(page.locator('html')).toHaveAttribute('data-scan-tone', 'light')
})
```

- [ ] **Step 2: Run the Hugo e2e**

Run: `make e2e`
Expected: PASS (flagship now reads the cookie — regression for the original bug).

- [ ] **Step 3: Manual per-surface check (record results)**

For each deployed surface, set the theme on one subdomain, navigate to another, confirm tone persists:
- `undef.games` ↔ `account.undef.games` ↔ `admin.undef.games` ↔ `auth.undef.games`.
Document outcomes in `.provide/HANDOFF.md`.

- [ ] **Step 4: Commit**

```bash
git add undef-logos/tests/e2e/cross-domain-theme.spec.ts
git commit -m "test(e2e): cross-domain theme cookie is honored on first paint"
```

---

## Self-Review Notes

- **Spec coverage:** Canonical runtime (Tasks 1–5, 8); admin surface + styles (6–7); vendor surface + drift-proof sync (9–10); admin/account/account-linked integration (11–14); Hugo cookie fix (8); auth alignment (15); cross-domain e2e (16). All spec sections map to a task.
- **Known risk flagged in Task 9:** if `persistence.ts` imports runtime values from `station/`, the "exclude station" constraint forces a small refactor (split station-free theme types). Budget for it; do not ship broken vendored imports.
- **No legacy wrappers:** Tasks 1, 8, 13, 15 delete the superseded copies outright (`hydrateTheme`/`initThemeHydration`, Hugo palette duplicate, account `theme.ts`, auth inline boot).
- **Type consistency:** shared names used across tasks — `applyStoredTheme`, `applyThemeState`, `ThemeProvider`/`useTheme`, `SIGNAL_COLORS`/`getSignalColor`/`setSignalColor`, `ADMIN_SURFACE_NAV_ITEMS`, `VENDOR_FILES`/`VENDOR_DEST`, `syncTo`/`checkTarget` — defined once and consumed by exact name.
