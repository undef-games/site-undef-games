# undef-logos hugo TS assets Coverage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up a root vitest setup (none exists) and unit-gate the two hugo theme TS assets (`site.ts`, `theme-hydrate.ts`) at 100%, with the package mocked.

**Architecture:** Add a root `vitest.config.ts` (jsdom) that mirrors the lab's `@undef-games/scanlines-system` alias and stubs the CSS subpath import; colocate behavioral tests next to the two asset files that mock the package and assert the glue's orchestration (which package fn is called with what, what DOM/event results), exercising import-time side effects via `vi.resetModules()` + dynamic `import()`; then wire `npm run coverage` into the `make` flow so the 100% gate runs in CI. The existing e2e is the integration layer and is untouched.

**Tech Stack:** TypeScript, Vitest 4 + v8 coverage (jsdom), Hugo (the asset build is unchanged), `make`.

## Global Constraints

- **Repo/branch:** all work in `/Users/tim/code/gh/undef-games/undef-logos` on branch `feat/hugo-coverage` (already checked out — do not switch branches).
- **Behavioral tests only**, with the package **mocked** (`vi.mock('@undef-games/scanlines-system', …)`): assert the package-fn call arguments / dispatched event / DOM wiring that DIFFER per branch. Never assert only that a mock "was called", or only existence, where that is invariant to the branch. **Assert discriminants unconditionally.**
- **Module import-time side effects:** both files run work at import; tests must set up `document` state and `document.readyState` BEFORE importing, and use `vi.resetModules()` + dynamic `import()` between scenarios.
- **100% gated:** each asset file reaches 100% lines AND branches; the root gate uses a 100% threshold over `themes/scanlines/assets/ts/**/*.ts`.
- **Dependencies:** add `vitest` + `jsdom` at the **latest** major/minor/patch (`@vitest/coverage-v8@^4.1.9` is already a root devDep — match vitest's major to it, i.e. vitest 4.x). If a latest version is incompatible, STOP and discuss — do not pin back silently.
- **CI/script policy (from CLAUDE.md):** no inline multi-line scripts in workflow YAML; use a `make` target. Add a short comment above each new workflow step / make target. Reuse existing targets where possible.
- **No hardcoded URLs/ports.**
- `v8 ignore` only for a provably-dead branch, commented (a reviewer verifies). None expected.
- Commits: no AI/Claude mention; `git -c commit.gpgsign=false commit -m "..."`. Do NOT `git add` the SDD report (`.superpowers/` is gitignored scratch).

---

## File Structure

- **Create:** `vitest.config.ts` (repo root) — root test + coverage config.
- **Create:** `test/empty.css` (repo root) — empty CSS stub the alias points the package CSS subpath at (only if vitest can't otherwise resolve the CSS import — Task 1 decides).
- **Create:** `themes/scanlines/assets/ts/site.test.ts` — tests for `site.ts`.
- **Create:** `themes/scanlines/assets/ts/theme-hydrate.test.ts` — tests for `theme-hydrate.ts`.
- **Modify:** root `package.json` — add `vitest`/`jsdom` devDeps + `test`/`coverage` scripts.
- **Modify:** `Makefile` — add an asset-test target and wire it into the test/CI flow.

---

### Task 1: Root vitest infra + `site.ts` tests

**Files:**
- Create: `vitest.config.ts`, `themes/scanlines/assets/ts/site.test.ts`, (maybe) `test/empty.css`
- Modify: `package.json` (root)

**Interfaces:**
- Produces: a working root `vitest run` that resolves `@undef-games/scanlines-system` (mockable) and the package CSS import; `site.ts` at 100%.

- [ ] **Step 1: Add root dev deps (latest).** From the repo root:
```bash
npm install -D vitest@latest jsdom@latest
```
Confirm `vitest` major matches the existing `@vitest/coverage-v8` (4.x). If npm resolves a vitest major ahead of the installed coverage plugin, bump `@vitest/coverage-v8` to match (latest) — and if that breaks, STOP and report.

- [ ] **Step 2: Write `vitest.config.ts` at the repo root.**
```ts
import { resolve } from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['themes/scanlines/assets/ts/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['themes/scanlines/assets/ts/**/*.ts'],
      exclude: ['**/*.test.ts'],
      thresholds: { lines: 100, functions: 100, branches: 100, statements: 100 },
    },
  },
  resolve: {
    alias: {
      // CSS subpath import in site.ts — stub to an empty file so jsdom tests don't choke on CSS:
      '@undef-games/scanlines-system/styles/site.css': resolve(__dirname, 'test/empty.css'),
      // Resolve the package to the sibling source (mirrors lab/vite.config.ts); tests vi.mock it anyway:
      '@undef-games/scanlines-system': resolve(__dirname, '../scanlines-system/src/index.ts'),
    },
  },
})
```
Create an empty `test/empty.css` (zero bytes). (If vitest already neutralizes CSS imports and the stub proves unnecessary, drop the CSS alias + the stub file — keep the config minimal.)

- [ ] **Step 3: Add root scripts** to `package.json` (keep existing `test:lab`/`typecheck:lab`/etc.):
```json
"test": "vitest run",
"coverage": "vitest run --coverage"
```

- [ ] **Step 4: Write the failing test** `themes/scanlines/assets/ts/site.test.ts`. Read `site.ts` first to confirm the export/DOM ids. It mounts on `#scanlines-root` only when present.
```ts
import { afterEach, expect, it, vi } from 'vitest'

const mountSiteSurface = vi.fn()
vi.mock('@undef-games/scanlines-system', () => ({ mountSiteSurface }))

afterEach(() => {
  vi.resetModules()
  vi.clearAllMocks()
  document.body.innerHTML = ''
})

it('mounts the site surface on #scanlines-root when it exists', async () => {
  document.body.innerHTML = '<div id="scanlines-root"></div>'
  const root = document.getElementById('scanlines-root')
  await import('./site')
  expect(mountSiteSurface).toHaveBeenCalledTimes(1)
  expect(mountSiteSurface).toHaveBeenCalledWith(root)
})

it('does not mount when #scanlines-root is absent', async () => {
  document.body.innerHTML = '<div id="other"></div>'
  await import('./site')
  expect(mountSiteSurface).not.toHaveBeenCalled()
})
```

- [ ] **Step 5: Run it.**
```bash
npx vitest run --coverage --coverage.include='themes/scanlines/assets/ts/site.ts' themes/scanlines/assets/ts/site.test.ts
```
Expected: 2 passed, `site.ts` 100% lines+branches. If the package or CSS import fails to resolve, adjust the alias/stub from Step 2 (vi.mock factory should satisfy the JS import; the CSS alias the stub). If neither resolves it after a genuine attempt, report BLOCKED with the exact error.

- [ ] **Step 6: Commit.**
```bash
git add vitest.config.ts package.json package-lock.json themes/scanlines/assets/ts/site.test.ts test/empty.css
git -c commit.gpgsign=false commit -m "test(site): root vitest setup + cover the site mount glue"
```

---

### Task 2: `theme-hydrate.ts` tests

**Files:**
- Create: `themes/scanlines/assets/ts/theme-hydrate.test.ts`

**Interfaces:**
- Consumes: the root vitest config + alias from Task 1.
- Produces: `theme-hydrate.ts` at 100%.

Read `theme-hydrate.ts` first. It: calls `applyStoredTheme()` at import; `toggle()` reads `readThemeState() ?? createDefaultThemeState()`, flips `activeTone`, calls `writeThemeState(next)` + `applyThemeState(next)`, dispatches a `window` `undef-theme-change` CustomEvent; `init()` wires a `[data-theme-toggle]` click → `toggle`; boot runs `init` on `DOMContentLoaded` when `document.readyState === 'loading'` else immediately; a `window` `storage` listener calls `applyStoredTheme()`.

- [ ] **Step 1: Write the failing test** `themes/scanlines/assets/ts/theme-hydrate.test.ts`.
```ts
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

const applyStoredTheme = vi.fn()
const applyThemeState = vi.fn()
const createDefaultThemeState = vi.fn(() => ({ activeTone: 'dark' as const }))
const readThemeState = vi.fn()
const writeThemeState = vi.fn()
vi.mock('@undef-games/scanlines-system', () => ({
  applyStoredTheme, applyThemeState, createDefaultThemeState, readThemeState, writeThemeState,
}))

function setReadyState(value: DocumentReadyState) {
  Object.defineProperty(document, 'readyState', { value, configurable: true })
}

afterEach(() => {
  vi.resetModules()
  vi.clearAllMocks()
  document.body.innerHTML = ''
})

it('applies the stored theme on load', async () => {
  setReadyState('complete')
  await import('./theme-hydrate')
  expect(applyStoredTheme).toHaveBeenCalledTimes(1)
})

it('toggles light -> dark, persists, applies, and dispatches the event', async () => {
  readThemeState.mockReturnValue({ activeTone: 'light' })
  document.body.innerHTML = '<button data-theme-toggle></button>'
  setReadyState('complete')                       // init runs immediately
  await import('./theme-hydrate')
  const onChange = vi.fn()
  window.addEventListener('undef-theme-change', onChange)
  document.querySelector<HTMLButtonElement>('[data-theme-toggle]')!.click()
  expect(writeThemeState).toHaveBeenCalledWith({ activeTone: 'dark' })
  expect(applyThemeState).toHaveBeenCalledWith({ activeTone: 'dark' })
  expect(onChange).toHaveBeenCalledTimes(1)
})

it('toggles dark -> light', async () => {
  readThemeState.mockReturnValue({ activeTone: 'dark' })
  document.body.innerHTML = '<button data-theme-toggle></button>'
  setReadyState('complete')
  await import('./theme-hydrate')
  document.querySelector<HTMLButtonElement>('[data-theme-toggle]')!.click()
  expect(writeThemeState).toHaveBeenCalledWith({ activeTone: 'light' })
})

it('falls back to the default theme state when none is stored', async () => {
  readThemeState.mockReturnValue(null)             // exercises `?? createDefaultThemeState()`
  document.body.innerHTML = '<button data-theme-toggle></button>'
  setReadyState('complete')
  await import('./theme-hydrate')
  document.querySelector<HTMLButtonElement>('[data-theme-toggle]')!.click()
  expect(createDefaultThemeState).toHaveBeenCalledTimes(1)
  // default is dark -> next is light:
  expect(writeThemeState).toHaveBeenCalledWith({ activeTone: 'light' })
})

it('wires the toggle on DOMContentLoaded when the document is still loading', async () => {
  readThemeState.mockReturnValue({ activeTone: 'light' })
  document.body.innerHTML = '<button data-theme-toggle></button>'
  setReadyState('loading')                         // init deferred to DOMContentLoaded
  await import('./theme-hydrate')
  document.querySelector<HTMLButtonElement>('[data-theme-toggle]')!.click()
  expect(writeThemeState).not.toHaveBeenCalled()   // not wired yet
  document.dispatchEvent(new Event('DOMContentLoaded'))
  document.querySelector<HTMLButtonElement>('[data-theme-toggle]')!.click()
  expect(writeThemeState).toHaveBeenCalledWith({ activeTone: 'dark' })
})

it('does not throw when the toggle button is absent', async () => {
  document.body.innerHTML = ''                      // no [data-theme-toggle]
  setReadyState('complete')
  await expect(import('./theme-hydrate')).resolves.toBeDefined()
})

it('re-applies the stored theme on a storage event', async () => {
  setReadyState('complete')
  await import('./theme-hydrate')
  applyStoredTheme.mockClear()
  window.dispatchEvent(new Event('storage'))
  expect(applyStoredTheme).toHaveBeenCalledTimes(1)
})
```

- [ ] **Step 2: Run it.**
```bash
npx vitest run --coverage --coverage.include='themes/scanlines/assets/ts/theme-hydrate.ts' themes/scanlines/assets/ts/theme-hydrate.test.ts
```
Expected: all pass, `theme-hydrate.ts` 100% lines+branches. If a branch is uncovered, read the source line and add the case that drives it (do not `v8 ignore` a reachable branch). If the `?? createDefaultThemeState()` fallback expectation mismatches the real default tone, use the real value from `createDefaultThemeState` — adjust the mock's return to the real shape.

- [ ] **Step 3: Run the whole root suite.**
```bash
npm run test
```
Expected: both asset test files pass.

- [ ] **Step 4: Commit.**
```bash
git add themes/scanlines/assets/ts/theme-hydrate.test.ts
git -c commit.gpgsign=false commit -m "test(theme-hydrate): cover toggle, boot branches, and storage rehydrate"
```

---

### Task 3: Wire the gate into `make`/CI

**Files:**
- Modify: `Makefile`
- Modify (if CI references it): the workflow that runs tests (read `.github/workflows/` first)

- [ ] **Step 1: Run the real gate.**
```bash
npm run coverage
```
Expected: PASS at 100% statements/branches/functions/lines over `themes/scanlines/assets/ts/site.ts` and `theme-hydrate.ts`. If either is <100%, fix the test in its task (do NOT widen the exclude-list).

- [ ] **Step 2: Add a `make` target** for the asset tests, mirroring the existing `test`/`typecheck` target style (read the Makefile's existing targets + the `## comment` help convention first). Add a target like:
```make
# Run the hugo theme TS asset unit tests (root vitest)
test-assets: ## Run hugo asset unit tests
	@npm run test
```
Then ensure CI runs it: read `.github/workflows/` and add a step that runs `make test-assets` (with a one-line comment above it), next to wherever `make test` (lab) / `make e2e` run. Follow the CI script policy — no inline multi-line `run:` blocks; the logic lives in the make target. If a single aggregate target is cleaner (e.g. a `test-all: test test-assets`), prefer extending the existing structure over duplicating.

- [ ] **Step 3: Verify the build + lab are unaffected.**
```bash
npx tsc --noEmit -p lab/tsconfig.json 2>/dev/null || true   # the root has no tsconfig; lab typecheck is via `make typecheck`
make typecheck
```
Expected: lab typecheck still clean (the root vitest config + asset tests don't break it).

- [ ] **Step 4: Commit.**
```bash
git add Makefile .github/workflows
git -c commit.gpgsign=false commit -m "ci: gate hugo asset unit tests at 100%"
```

---

## Notes for the executor

- All tasks are in `undef-logos` on `feat/hugo-coverage`. Order: Task 1 (infra, the resolution risk) first, then Task 2, then Task 3 (gate/CI).
- The per-task acceptance is the **scoped coverage run at 100% + behavioral assertions** — a reviewer rejects tests that hit the number via mock-called-only or existence-only checks where invariant.
- When a source's real export/shape differs from this plan's examples (e.g. the default tone, the CSS specifier), use the source — the examples are patterns, the source is ground truth.
- The two files are NOT e2e-tested here; the existing `tests/e2e/{site,cross-domain-theme}.spec.ts` remain the integration layer and are unchanged.
- Do not modify the hugo asset build pipeline or the package; this plan only adds a root test path + gate.
