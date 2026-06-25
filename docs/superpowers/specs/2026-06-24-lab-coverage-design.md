# undef-logos/lab Coverage — Design

**Date:** 2026-06-24
**Status:** Approved (design); pending implementation plan
**Scope:** Sub-project #2 of the coverage push (the lab only). #1 (scanlines-system) is done; #3 (hugo TS assets + root) is a separate spec.

## Goal

Bring `undef-logos/lab` to **100% gated** unit coverage — it has **no coverage gate today** — after first de-duping the station re-export layer so the gate measures only the lab's genuinely-own code. Same logic/visual rule as [[testing-and-dependency-policy]] and sub-project #1: logic + React-DOM gated at 100%; canvas/Pixi shells excluded and verified by the existing scene e2e.

## Background

The scanline system was extracted from this lab into the `scanlines-system` package (now 100% gated). The lab kept thin **re-export shims** of the package — `lab/src/station/{scanline-engine,scanline-renderer,effects-config,effects-style,station-state,station-toys,station-identity}` and `lab/src/app/site-copy-site.ts` and `lab/src/store/persistence.ts` are each `export * from '@undef-games/scanlines-system'` (or a named re-export). The lab also carries tests (`station/{scanline-engine,scanline-renderer,station-state}.test.ts`) that **re-test the package code** through those shims — now redundant with the package's own 100% gate. The lab's `vite.config.ts` `test` block has **no `coverage` block** at all, so none of the lab's genuinely-own code (the logo lab, concepts, ui panels, station controls, stores) is gated.

## Decisions

- **De-dup the station re-export layer** (chosen): repoint the lab's consumers to import directly from `@undef-games/scanlines-system`, delete the re-export shims, and delete the redundant station tests. (Not: exclude-and-keep the indirection.)
- **Same logic/visual rule as #1**: gate the lab's logic + React-DOM at 100%; exclude the 2 Pixi shells + bootstraps + type-only files; the Pixi shells are verified by the existing `/lab/` scene-smoke e2e (added in #1 Task 9) — **no new e2e**.

## Design

### Phase A — De-dup the station re-export layer

These 9 files are pure re-exports of the package:
- `lab/src/station/scanline-engine.ts`, `scanline-renderer.ts`, `effects-config.ts`, `effects-style.ts`, `station-state.ts`, `station-toys.tsx`, `station-identity.tsx`
- `lab/src/app/site-copy-site.ts`
- `lab/src/store/persistence.ts` (1-line re-export — confirm during implementation; if it adds lab-local logic, treat as lab code instead)

Steps:
1. Find every lab import of these modules (relative `./…`/`../…` and any aliased path) and repoint it to `@undef-games/scanlines-system`.
2. Delete the re-export shim files.
3. Delete the redundant tests that test the re-exported package code: `lab/src/station/{scanline-engine,scanline-renderer,station-state}.test.ts`.
4. Verify the lab still type-checks (`npx tsc --noEmit`), builds (`npm run build`), and its remaining tests pass.

The genuine lab variants in `station/` stay: `station-signal-scene.tsx` (a 325-line lab Pixi variant — excluded as visual) and the controls `station-controls.tsx`, `effects-controls.tsx`, `scanline-engine-controls.tsx`.

### Phase B — Add the coverage gate

Add a `coverage` block to `lab/vite.config.ts`'s `test` config (keep `environment`/`setupFiles`/`server.deps`):
```ts
coverage: {
  provider: 'v8',
  include: ['src/**/*.{ts,tsx}'],
  exclude: [
    '**/*.{test,spec}.{ts,tsx}',
    // Canvas/Pixi shells — verified by the /lab/ scene-smoke e2e:
    'src/app/app-shell.tsx',
    'src/station/station-signal-scene.tsx',
    // Bootstrap entries (mount-only):
    'src/main.tsx',
    'src/site-main.tsx',
    // Type-only / test infra:
    'src/concepts/types.ts',
    'src/vite-env.d.ts',
    'src/test/setup.ts',
  ],
  thresholds: { lines: 100, functions: 100, branches: 100, statements: 100 },
},
```
(`@vitest/coverage-v8` is already a lab dev-dep. The `coverage` script / how `npm run` triggers it is added/confirmed in the plan.) The exact exclude-list is finalized after Phase A (the deleted shims no longer exist; any remaining 1-line re-export/barrel — e.g. if `store/persistence` stays — is excluded too).

### Phase C — Write the missing unit tests (lab's own code)

Behavioral tests (logic + `@testing-library/react` DOM; assert values that differ per branch — never coverage-only/existence-only; assert discriminants unconditionally), colocated, to 100%:

**Logic:** `logo/logo-system.ts`, `concepts/lanes.ts`, `ui/button-press-feedback.ts`, `app/lab-entrance-config.ts`.

**React (Testing Library):** `logo/logo-mark.tsx`, `logo/logo-wordmark.tsx`, `logo/logo-compact.tsx`, `ui/compare-tray.tsx`, `ui/control-panel.tsx`, `ui/icon-button.tsx`, `ui/prompt-panel.tsx`, `app/App.tsx`, `station/station-controls.tsx`, `station/effects-controls.tsx` (325 — the big one).

**Confirm already-tested files hit 100% once gated** (fill gaps): `ui/concept-rail.tsx`, `app/site-copy.ts`, `generator/mutation-ranges.ts`, `logo/logo-play-state.ts`, `logo/resolved-logo-panel.tsx`, `concepts/registry.ts`, `store/logo-lab-store.ts`, `station/scanline-engine-controls.tsx`.

(`app/App.tsx` is 5 lines — if it is a pure mount shell with no logic, exclude it as a bootstrap instead of testing; decide in the plan by reading it.)

### Phase D — Flip on the gate

Run the lab's coverage at 100% (`npm run coverage` or `npx vitest run --coverage`), `npx tsc --noEmit`, and `npm run build` — all green. Any file <100% is a gap from Phase C; fix the test, do not widen the exclude-list.

## Cross-repo

All in `undef-logos` (`chore/main-local`). The package (#1) is untouched. The 2 Pixi shells are covered by the existing `tests/e2e/scene-smoke.spec.ts`.

## Testing approach

- Colocated `*.test.ts(x)`, run by the lab's existing vitest setup (jsdom, `src/test/setup.ts`).
- Behavioral assertions only; no coverage-only/existence-only/mock-only tests; assert discriminants unconditionally.
- `v8 ignore` only for provably-dead branches, with an explanatory comment (a reviewer verifies reachability).
- Per-file acceptance during development: scoped `npx vitest run --coverage --coverage.include='<file>' <test>` at 100%.

## Out of scope

- Sub-project #3 (hugo TS assets `themes/scanlines/assets/ts/*` + the undef-logos root gating decision).
- The package (#1, done).
- A new e2e (the scene shells are already covered by #1's spec).

## Risks / notes

- Phase A repointing must catch ALL import sites of the 9 re-export modules (relative + aliased); `tsc --noEmit` + `npm run build` are the safety net.
- `effects-controls.tsx` (325) and `scanline-engine-controls.tsx` (243) are the largest test targets — controls UIs with many interactive branches.
- Flipping the gate on a previously-ungated lab will fail loudly for every not-yet-tested file; the plan sequences Phase C before Phase D.
