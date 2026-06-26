# undef-logos hugo TS assets Coverage — Design

**Date:** 2026-06-26
**Status:** Approved (design); pending implementation plan
**Scope:** Sub-project #3 of the coverage push (the hugo theme TS assets + the repo-root gating decision). #1 (scanlines-system) and #2 (lab) are done.

## Goal

Bring the repo root's only first-party TS — the two hugo theme assets — to **100% gated** unit coverage, by standing up a root vitest setup (none exists today) and unit-testing the glue. Keeps the existing e2e as the integration layer. After this, all three first-party TS surfaces (package, lab, hugo assets) are gated.

## Background

The hugo theme has exactly two TS asset files, both thin browser glue around the now-100%-gated `@undef-games/scanlines-system` package:
- `themes/scanlines/assets/ts/site.ts` (8 lines): gets `#scanlines-root` and calls `mountSiteSurface(root)` from the package (guarded by `if (root)`).
- `themes/scanlines/assets/ts/theme-hydrate.ts` (30 lines): imports the package's theme functions, calls `applyStoredTheme()` at load, defines `toggle()` (flip tone, `writeThemeState`/`applyThemeState`, dispatch `undef-theme-change`), wires a `[data-theme-toggle]` button in `init()`, runs boot (`readyState === 'loading'` → DOMContentLoaded vs immediate), and re-hydrates on the `storage` event.

The repo root has **no vitest/unit setup** (only `lab/` does) and builds via `make`/hugo. It already has 6 Playwright e2e specs; `site.spec.ts` and `cross-domain-theme.spec.ts` exercise the toggle, mount, and theme hydration end-to-end. The decision (chosen over "e2e-only + document") is to **also unit-gate the two glue files**, so the repo's "100% gated" bar is uniform across all three TS surfaces.

## The testing rule (decided)

Unit-test the glue's **own orchestration** with the package **mocked** — the package's logic (`applyStoredTheme`, `readThemeState`, `writeThemeState`, `applyThemeState`, `mountSiteSurface`) is already 100%-gated in #1, so re-exercising it here would test the package, not the glue. The unit tests assert that the glue calls the right package functions with the right values, wires the right DOM, and dispatches the right event. The existing e2e remains the real-integration layer (unchanged).

## Design

### 1. Stand up root vitest infra

- Add `vitest.config.ts` at the repo root:
  - `test.environment: 'jsdom'`, a root `test/setup.ts` if needed.
  - `resolve.alias` mirroring `lab/vite.config.ts`: `@undef-games/scanlines-system` → `../scanlines-system/src/index.ts`, and the two CSS subpaths → their source (or an empty stub), so `site.ts`'s `import '…/styles/site.css'` resolves. (CSS may instead be neutralized via vitest's css handling — the plan picks the simplest that works.)
  - `coverage`: `provider: 'v8'`, `include: ['themes/scanlines/assets/ts/**/*.ts']`, `exclude: ['**/*.{test,spec}.ts']`, `thresholds` 100% on all four metrics.
- Add root devDeps at latest: `vitest`, `jsdom` (`@vitest/coverage-v8` already present; `@testing-library/dom` if used). Per the dependency policy, latest major/minor/patch — discuss if a latest version is incompatible.
- Add root `package.json` scripts: `"test": "vitest run"`, `"coverage": "vitest run --coverage"` (rename the existing `test:lab`/`typecheck:lab` stay as-is). Add a `make` target (e.g. `test-assets`, and fold it into the default `test` flow) since the root drives via make — follow the repo's CI-script policy (no inline multi-line scripts in workflows).

### 2. Unit tests (mock the package)

Colocated next to the sources, behavioral, to 100% lines+branches:

- `themes/scanlines/assets/ts/site.test.ts`: with the package mocked, assert `mountSiteSurface` is called once with the `#scanlines-root` element when it exists, and **not** called when `#scanlines-root` is absent (the `if (root)` branch). Use `vi.resetModules()` + set up `document.body` + dynamic `import('./site')` per case (the call happens at module import).

- `themes/scanlines/assets/ts/theme-hydrate.test.ts`: with the package mocked (`applyStoredTheme`, `readThemeState`, `writeThemeState`, `applyThemeState`, `createDefaultThemeState` as `vi.fn()`s):
  - `applyStoredTheme()` is called once on import.
  - `toggle()` (triggered by clicking `[data-theme-toggle]`): when `readThemeState()` returns `{activeTone:'light'}` → `writeThemeState`/`applyThemeState` called with `activeTone:'dark'`; when `{activeTone:'dark'}` → `'light'`; when `readThemeState()` returns `null` → uses `createDefaultThemeState()` (the `?? ` fallback). Assert a `window` `undef-theme-change` CustomEvent is dispatched each time (spy on `dispatchEvent` / add an `addEventListener`).
  - `init()` wiring: a `[data-theme-toggle]` button present at init → clicking it triggers the toggle; absent button → no throw (the `?.` path).
  - **Boot branches** via `vi.resetModules()` + setting `document.readyState` then dynamic `import('./theme-hydrate')`: `readyState === 'loading'` → `init` runs on `DOMContentLoaded`; otherwise `init` runs immediately.
  - `storage` event on `window` → `applyStoredTheme` called again.

### 3. Keep the e2e (unchanged)

`tests/e2e/site.spec.ts` (toggle click → aria flip → localStorage persist; cross-page hydrate; mounted surface) and `cross-domain-theme.spec.ts` (cookie hydration) remain as the integration layer. No new e2e.

### 4. Gate

Root `npm run coverage` reports 100% over the two asset files; wire it into the `make` test flow / CI so it can't silently regress.

## Cross-repo

All in `undef-logos`. The package (#1) and lab (#2) are untouched.

## Testing approach

- Root vitest (jsdom), colocated `*.test.ts`, package **mocked** via `vi.mock`.
- Module-import side effects handled with `vi.resetModules()` + dynamic `import()` per scenario.
- Behavioral assertions only — assert the package-fn call arguments / dispatched event / DOM wiring that differ per branch; no coverage-only/existence-only/mock-attached-only tests; assert discriminants unconditionally.
- `v8 ignore` only for a provably-dead branch, commented (a reviewer verifies). None expected.
- Per-file acceptance during development: scoped `npx vitest run --coverage --coverage.include='<file>' <test>` at 100%.

## Out of scope

- The package (#1) and lab (#2) — done.
- The lab's `station-signal-scene.tsx` speed/divergence vs the package scene (a separate observation, not a coverage concern).
- Changing the hugo asset build pipeline (only adding a test path).
- Type-checking the hugo assets at the root (vitest's esbuild transpiles TS for tests; a root tsconfig for typecheck is a possible follow-up, not required for the gate).

## Risks / notes

- **Package resolution / CSS:** the only setup risk. `site.ts` imports a CSS file and both import the package; the root has neither a tsconfig nor `@undef-games` in `node_modules`. Mocking the package via `vi.mock` plus the lab's alias recipe (and a CSS stub) should resolve both; the plan validates this in the first task before writing assertions.
- **Module side effects:** `theme-hydrate.ts` runs work at import, so tests must control `document.readyState`/`document.body` *before* importing and use `vi.resetModules()` between scenarios — the main source of test subtlety.
- Flipping on a 100% root gate will fail loudly until both files are covered; sequence test-writing before wiring the gate into CI.
