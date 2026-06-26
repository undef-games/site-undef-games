# undef-logos/lab Coverage Implementation Plan

**Status:** ✅ Complete — lab 100% gated (9 station re-export shims de-duped → import the package directly); merged to `undef-logos` main @ `c063f04`, pushed.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring `undef-logos/lab` to 100% gated unit coverage (no gate today) after de-duping the station re-export layer.

**Architecture:** First repoint the lab's consumers off 9 thin `export * from '@undef-games/scanlines-system'` shims and delete them + their redundant tests. Then write behavioral tests for the lab's genuinely-own code, each verified at 100% via a scoped coverage run while the gate is still off; finally add a `coverage` block to `lab/vite.config.ts` and run the real gate. The 2 Pixi shells are excluded and already covered by the existing `/lab/` scene e2e.

**Tech Stack:** TypeScript, React 19, Vitest + @testing-library/react (jsdom), v8 coverage, Vite.

## Global Constraints

- **Repo/branch:** all work in `/Users/tim/code/gh/undef-games/undef-logos` on branch `feat/lab-coverage` (already checked out — do not switch branches).
- **Behavioral tests only.** Assert real values / rendered DOM that DIFFER per branch/input. Never assert only `.toHaveLength(N)` / existence / "did not throw" / "a mock was called" when that is invariant to the branch. **Assert discriminants unconditionally** (no `if (x.type===…)` guards around field assertions).
- **Per-file acceptance:** each new/target file reaches **100% lines AND branches** via a scoped run: `npx vitest run --coverage --coverage.include='<file>' <file>.test.ts`.
- `v8 ignore` only for a provably-DEAD branch, with an explanatory comment (a reviewer verifies reachability). A reachable branch — even via a cast or stub — must be tested.
- Tests are colocated `*.test.ts(x)`; React via `@testing-library/react`; jsdom + `src/test/setup.ts` (the lab's existing setup).
- The package gate is NOT touched (sub-project #1 is done and merged).
- Commits: no AI/Claude mention; `git -c commit.gpgsign=false commit -m "..."`.
- Each test task runs the lab's full suite once before commit (`npm run test:run` from `lab/`) — all pass, pristine.

---

## File Structure

**De-dup — delete (Task 1):** 9 re-export shims — `lab/src/station/{scanline-engine.ts,scanline-renderer.ts,effects-config.ts,effects-style.ts,station-state.ts,station-toys.tsx,station-identity.tsx}`, `lab/src/app/site-copy-site.ts`, `lab/src/store/persistence.ts` — plus the 3 redundant tests `lab/src/station/{scanline-engine.test.ts,scanline-renderer.test.ts,station-state.test.ts}`.

**Create (colocated tests, Tasks 2–4):** for `logo/{logo-system,logo-mark,logo-wordmark,logo-compact}`, `concepts/lanes`, `app/lab-entrance-config`, `ui/{button-press-feedback,compare-tray,control-panel,icon-button,prompt-panel}`, `station/{station-controls,effects-controls}`.

**Modify (Task 6):** `lab/vite.config.ts` (add the `coverage` block).

---

### Task 1: De-dup the station re-export layer

**Files:**
- Modify: every lab file that imports one of the 9 re-export modules (repoint to the package).
- Delete: the 9 shim files + the 3 redundant tests listed above.

The 9 modules are each a pure re-export of `@undef-games/scanlines-system` (verified):
`station/scanline-engine`, `station/scanline-renderer`, `station/effects-config`, `station/effects-style`, `station/station-state`, `station/station-toys`, `station/station-identity`, `app/site-copy-site`, `store/persistence`.

- [ ] **Step 1: Find every consumer.** From `lab/`:
```bash
grep -rnE "from ['\"].*(station/(scanline-engine|scanline-renderer|effects-config|effects-style|station-state|station-toys|station-identity)|site-copy-site|store/persistence|\./(scanline-engine|scanline-renderer|effects-config|effects-style|station-state|station-toys|station-identity|site-copy-site|persistence))['\"]" src --include='*.ts' --include='*.tsx' | grep -v '\.test\.'
```
List every import site (relative `./…`/`../…` forms included).

- [ ] **Step 2: Repoint each import to the package.** For every consumer, change the import source to `'@undef-games/scanlines-system'`, keeping the same named/`type` imports (the package barrel re-exports all of them). Example:
```ts
// before
import { createStationState } from '../station/station-state'
import { readSiteSurfaceCopy } from './site-copy-site'
// after
import { createStationState, readSiteSurfaceCopy } from '@undef-games/scanlines-system'
```
Merge duplicate package imports in a file into one statement where natural.

- [ ] **Step 3: Delete the shims + redundant tests.**
```bash
cd /Users/tim/code/gh/undef-games/undef-logos
git rm lab/src/station/scanline-engine.ts lab/src/station/scanline-renderer.ts lab/src/station/effects-config.ts lab/src/station/effects-style.ts lab/src/station/station-state.ts lab/src/station/station-toys.tsx lab/src/station/station-identity.tsx lab/src/app/site-copy-site.ts lab/src/store/persistence.ts
git rm lab/src/station/scanline-engine.test.ts lab/src/station/scanline-renderer.test.ts lab/src/station/station-state.test.ts
```

- [ ] **Step 4: Verify nothing still references the deleted modules.**
```bash
cd lab && grep -rnE "(station/(scanline-engine|scanline-renderer|effects-config|effects-style|station-state|station-toys|station-identity)|site-copy-site|store/persistence)" src --include='*.ts' --include='*.tsx' | grep -v node_modules
```
Expected: no matches (all repointed).

- [ ] **Step 5: Typecheck, build, test.** From `lab/`: `npx tsc --noEmit && npm run test:run && npm run build`. Expected: all green (no broken imports; the remaining suite passes without the deleted tests).

- [ ] **Step 6: Commit.**
```bash
cd /Users/tim/code/gh/undef-games/undef-logos
git add -A lab/src
git -c commit.gpgsign=false commit -m "refactor(lab): import scanline system from the package; drop re-export shims"
```

---

### Task 2: logo-lab tests

**Files:** Create `lab/src/logo/{logo-system,logo-mark,logo-wordmark,logo-compact}.test.ts(x)`, `lab/src/app/lab-entrance-config.test.ts`, `lab/src/concepts/lanes.test.ts`; read each source.

Targets: `logo-system.ts` (`getLogoSystem(concept) → LogoSystem` — logic), `logo-mark.tsx` (`LogoMark` — props `concept`/`phase`/`progress`/`accessibleLabel`/`decorative`, SVG render), `logo-wordmark.tsx` + `logo-compact.tsx` (small React), `lab-entrance-config.ts` (`LAB_BACK_ENTRANCE` const — data), `concepts/lanes.ts` (`conceptLanes` const — data).

- [ ] **Step 1: Read the sources**; note each function's branches and each component's prop-driven conditionals (esp. `LogoMark`'s `decorative` ARIA branch and the `phase`/`progress` math).

- [ ] **Step 2: Write behavioral tests.** Logic: call `getLogoSystem` for representative concepts and assert the actual resulting `LogoSystem` fields (cover every branch). Data: assert `LAB_BACK_ENTRANCE`'s exact fields and `conceptLanes`'s exact contents. React (Testing Library): render `LogoMark` across prop combos and assert the rendered SVG attributes/structure that differ — e.g.:
```tsx
import { render } from '@testing-library/react'
import { LogoMark } from './logo-mark'
it('marks decorative vs labelled', () => {
  const { container, rerender } = render(<LogoMark concept={/* a real concept */ } />)
  // assert role/aria-label present for the labelled case…
  rerender(<LogoMark concept={/* … */} decorative />)
  // …and aria-hidden / no label for decorative
})
```

- [ ] **Step 3: Verify scoped 100%** for each of the 6 files (`--coverage.include='lab/src/logo/logo-system.ts'` etc.).
- [ ] **Step 4: Run** `npm run test:run` → all pass.
- [ ] **Step 5: Commit** — `test(lab): cover logo system, marks, lab-entrance-config, lanes`

---

### Task 3: ui tests

**Files:** Create `lab/src/ui/{button-press-feedback,compare-tray,control-panel,icon-button,prompt-panel}.test.ts(x)`; read each source.

Targets: `button-press-feedback.ts` (`attachButtonPressFeedback(container)` — attaches DOM listeners; test by attaching to a jsdom element, dispatching the events, and asserting the resulting class/attribute changes + the cleanup), and the React panels `compare-tray`, `control-panel` (158 — the bigger one), `icon-button`, `prompt-panel`.

- [ ] **Step 1: Read the sources**; for `button-press-feedback`, note which events it listens for and what it mutates (so the test can dispatch + assert the actual DOM change, and assert teardown removes it).

- [ ] **Step 2: Write behavioral tests.** For `attachButtonPressFeedback`: render a container, call it, dispatch the press events, assert the concrete DOM effect, then assert the returned cleanup removes the effect/listeners. For the React panels: render with representative props + interactions (`@testing-library/user-event`), assert the rendered DOM + callback args that differ per branch.

- [ ] **Step 3: Verify scoped 100%** for each of the 5 files.
- [ ] **Step 4: Run** `npm run test:run` → all pass.
- [ ] **Step 5: Commit** — `test(lab): cover ui panels + button-press-feedback`

---

### Task 4: station controls tests

**Files:** Create `lab/src/station/{station-controls,effects-controls}.test.tsx`; read each source.

Targets: `station-controls.tsx` (`StationControls`) and `effects-controls.tsx` (`EffectsControls` — ~325 lines, the largest; many interactive control branches). These render the lab's tuning UI and fire callbacks on interaction.

- [ ] **Step 1: Read both**; enumerate the controls/branches (each input/toggle/select, the conditional rendering) so every branch has a behavioral assertion.

- [ ] **Step 2: Write Testing-Library tests.** Render each with representative props; for each control, interact (`user-event`) and assert the rendered state change AND the callback fired with the correct argument (assert the argument value, not just "called"). Cover every conditional branch with a differing-value assertion.

- [ ] **Step 3: Verify scoped 100%** for both files.
- [ ] **Step 4: Run** `npm run test:run` → all pass.
- [ ] **Step 5: Commit** — `test(lab): cover station + effects controls`

---

### Task 5: confirm already-tested files at 100%

**Files:** No new files expected; possibly extend existing tests. Targets (have colocated tests but were never gate-measured): `ui/concept-rail.tsx`, `app/site-copy.ts`, `generator/mutation-ranges.ts`, `logo/logo-play-state.ts`, `logo/resolved-logo-panel.tsx`, `concepts/registry.ts`, `store/logo-lab-store.ts`, `station/scanline-engine-controls.tsx`.

- [ ] **Step 1: Run scoped coverage for each** target (`npx vitest run --coverage --coverage.include='lab/src/...' <its test>`); record each %.
- [ ] **Step 2: For any below 100%**, add the missing behavioral cases to its existing colocated test until 100%. (If all are already 100%, this task only records that — no edits.)
- [ ] **Step 3: Re-run** scoped coverage for any file touched → 100%.
- [ ] **Step 4: Run** `npm run test:run` → all pass.
- [ ] **Step 5: Commit** (only if tests changed) — `test(lab): close gaps in previously-ungated files`

---

### Task 6: add the coverage gate + final gate

**Files:** Modify `lab/vite.config.ts`.

- [ ] **Step 1: Add a `coverage` block** inside the `test` config (keep `include` test glob, `environment`, `setupFiles`, `server.deps` as-is). The lab already has `@vitest/coverage-v8` and a `coverage` npm script:
```ts
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        '**/*.{test,spec}.{ts,tsx}',
        // Canvas/Pixi shells — covered by the /lab/ scene-smoke e2e:
        'src/app/app-shell.tsx',
        'src/station/station-signal-scene.tsx',
        // Bootstrap / mount-only shells (no logic):
        'src/main.tsx',
        'src/site-main.tsx',
        'src/app/App.tsx',
        // Type-only / test infra:
        'src/concepts/types.ts',
        'src/vite-env.d.ts',
        'src/test/setup.ts',
      ],
      thresholds: { lines: 100, functions: 100, branches: 100, statements: 100 },
    },
```
(Note: `src/test/setup.ts` is also a `setupFiles` entry; excluding it from coverage is correct — it's test infra.)

- [ ] **Step 2: Run the real gate** from `lab/`: `npm run coverage`. Expected: PASS at 100% on all four metrics, now measuring every `lab/src` file except the documented exclusions. If any file is <100%, it's a gap from Tasks 2–5 — add the missing test there (do NOT widen the exclude-list to dodge).

- [ ] **Step 3: Typecheck + build** from `lab/`: `npx tsc --noEmit && npm run build` — both clean.

- [ ] **Step 4: Commit.**
```bash
cd /Users/tim/code/gh/undef-games/undef-logos
git add lab/vite.config.ts
git -c commit.gpgsign=false commit -m "test(lab): gate all of lab/src at 100% coverage"
```

---

## Notes for the executor

- All tasks are in `undef-logos` on `feat/lab-coverage`. Order matters: Task 1 (de-dup) first, Task 6 (gate flip) last; Tasks 2–5 are independent.
- The per-task acceptance is the **scoped coverage run at 100% + behavioral assertions** — a reviewer rejects tests that hit the number via mocks, existence-only, or invariant `.toHaveLength` checks.
- When a source's real export/prop names differ from this plan's examples, use the source — the examples are patterns, the source is ground truth.
- The 2 Pixi shells (`app-shell`, `station-signal-scene`) are NOT unit-tested here — they're excluded and verified by the existing `tests/e2e/scene-smoke.spec.ts` (no new e2e in this plan).
