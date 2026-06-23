# Scanlines-System Repo Extraction — Design

**Date:** 2026-06-23
**Status:** Approved (design); pending implementation plan

## Goal

Promote `packages/scanlines-system` out of the undef-logos (`undef-ship`) repo
into its own **private** repo, `undef-games/scanlines-system`, without changing
how any consumer behaves. Distribution stays exactly as it is today —
**vendor-sync** — so the only thing that moves is *where the canonical source
lives* and *where each consumer's relative path points*.

## Context (current state)

The package is `@undef-games/scanlines-system` (`private: true`, `version
0.0.0`, ESM, `type: module`). It has **never been published** and is consumed
two different ways:

- **undef-logos itself** (the flagship Hugo homepage + the `lab` playground)
  imports the package's **source directly** — `lab/package.json` has
  `"@undef-games/scanlines-system": "file:../packages/scanlines-system"`, and
  both `lab` (Vite alias + tsconfig path) and `themes/scanlines/assets/ts`
  resolve the barrel to `packages/scanlines-system/src/index.ts`. This is how
  the scanline engine, dice, WARP, and section effects render on undef.games.
- **undef-admin** and **undef-account** **vendor** a curated 40-file UI subset
  via `sync-scanlines.mjs` into `src/vendor/scanlines-system/`, with SHA256
  drift detection (`VENDOR_MANIFEST.json`, `check:theme`).
- **undef-auth** + **undef-account** also receive `selector-contract.ts` via a
  separate `scripts/sync_selector_contract.py`.
- **undef-sprite** does **not** consume the package.

The package cannot currently build or test itself standalone: its
`tsconfig.json` hardcodes `typeRoots`/`paths` into `../../lab/node_modules`, its
tests run inside `lab`'s vitest config, and its `build-theme-boot.mjs` uses
`esbuild` from the monorepo root (not a declared devDependency).

## Decisions

1. **Distribution: vendor-sync from the private repo.** No npm registry, no
   auth tokens. The new private repo is just the canonical source the existing
   sync scripts pull from. (Honors the standing "keep vendor-sync" preference.)
2. **undef-logos consumption: sibling source checkout.** The new repo lives on
   disk next to undef-logos; `lab` + Hugo keep importing the source via a
   `file:` link, repointed to the sibling. The `lab` stays in undef-logos. The
   extracted repo gets its own standalone build/test/CI regardless.
3. **Git history: preserved** via `git filter-repo --path
   packages/scanlines-system` (path-renamed to repo root).

## Architecture — the new repo

`undef-games/scanlines-system` (private), checked out at
`/Users/tim/code/gh/undef-games/scanlines-system` (sibling of undef-logos,
undef-admin, undef-account).

Contents = today's `packages/scanlines-system/` verbatim:

```
src/        tokens/ react/ atmosphere/ surfaces/ styles/ testing/ index.ts
scripts/    sync-scanlines.mjs  vendor-surface.mjs  build-theme-boot.mjs  (+ tests)
dist/       theme-boot.js  theme-boot.inline.ts   (pre-built, committed)
package.json  tsconfig.json
```

…plus the scaffolding it currently borrows (see "Standalone build/test/CI").

The `exports` map is unchanged:

```json
".":                          "./src/index.ts",
"./styles/site.css":          "./src/atmosphere/site.css",
"./testing/selector-contract":"./src/testing/selector-contract.ts"
```

## Consumer repointing (one mechanism: relative sibling paths)

| Consumer | Today | After |
|---|---|---|
| undef-logos `lab` | `file:../packages/scanlines-system` + alias/tsconfig → `../packages/scanlines-system/src` | `file:../scanlines-system` + alias/tsconfig → `../scanlines-system/src` |
| undef-logos Hugo (`themes/scanlines/assets/ts`) | barrel via the Vite alias above | same alias, repointed to sibling |
| undef-admin / undef-account `sync:theme` / `check:theme` | `node ../../undef-logos/packages/scanlines-system/scripts/sync-scanlines.mjs` | `node ../../scanlines-system/scripts/sync-scanlines.mjs` |
| undef-auth + account selector-contract | `undef-logos/scripts/sync_selector_contract.py` | script moves into scanlines-system; target paths unchanged |

Every change is "delete `undef-logos/packages/` from a relative path." After
all consumers are repointed and verified, `packages/scanlines-system/` is
**removed** from undef-logos.

The vendored `src/vendor/scanlines-system/` copies in admin/account are
**byte-identical** before and after — same files, new source location — so the
recorded SHA256 hashes still match and `check:theme` stays green. (The
`sourceSha` git-HEAD field in `VENDOR_MANIFEST.json` will update on the next
real `sync:theme`, but `--check` validates file hashes, not `sourceSha`.)

## Standalone build / test / CI (the real work)

The extraction stands the package on its own feet:

- **`package.json`:** keep `private: true`; declare the devDeps it implicitly
  uses today — `vitest`, `@vitest/coverage-v8`, `@testing-library/jest-dom`,
  `@testing-library/react`, `@testing-library/user-event`, `jsdom`, `esbuild`,
  `pixi.js`, `react`, `@types/react`, `typescript`. Runtime dep
  `@provide-io/telemetry@^0.4.8` unchanged. Add scripts: `test`, `typecheck`,
  `build:theme-boot`, `check` (drift self-check).
- **`tsconfig.json`:** remove the `../../lab/node_modules` `typeRoots`/`paths`;
  resolve types from the repo's own `node_modules`. Keep `noEmit`, `Bundler`
  resolution, `react-jsx`.
- **`vitest.config.ts`:** new — migrate the test `include` globs and the **100%
  coverage thresholds** (currently living in `lab/vite.config.ts`, scoped to
  `log`, `telemetry`, `console`, `kit`, `surfaces`) into the package.
- **CI** (`.github/workflows/ci.yml`): typecheck → test + coverage gate → build
  `dist/theme-boot.js` → assert `dist/` is fresh and committed. Per the repo
  workflow policy, any `run:` block over 3 lines is extracted to a `ci/` script
  with a one-line comment above each step.

## Migration order (each step verified green before the next)

1. **Create + populate the new repo.** `filter-repo` the package history into
   `undef-games/scanlines-system`; add standalone scaffolding; CI green in
   isolation (typecheck + test + coverage + dist build).
2. **Repoint undef-logos** `lab` + Hugo to the sibling `file:` link and aliases.
   Verify: `make test`, lab build, Hugo build all green; the homepage still
   renders the scanline effects.
3. **Repoint admin / account / auth** sync sources; re-run `sync:theme` and
   `check:theme`. Verify: admin unit + e2e (the existing harness), account unit
   + e2e, both `check:theme` drift checks green.
4. **Remove `packages/scanlines-system/`** from undef-logos (and the now-dead
   `scripts/sync_selector_contract.py`, `scripts/check_scanlines_system_boundary.sh`
   if fully superseded).

## Verification strategy

No new test infrastructure — the question "did extraction break anything?" is
answered entirely by re-running each consumer's **existing** suite, repo by
repo: lab/scanlines unit + 100% coverage, admin e2e, account e2e, and the
`check:theme` drift checks. Extraction is correct iff every pre-existing gate is
still green and the flagship homepage still renders.

## Risks & mitigations (from the coupling map)

| Risk | Mitigation |
|---|---|
| tsconfig `typeRoots`/`paths` → `../../lab/node_modules` (package can't typecheck alone) | New repo declares its own `@types` devDeps; tsconfig resolves locally |
| `build-theme-boot.mjs` uses `esbuild` not declared as a dep | Add `esbuild` devDependency |
| `dist/theme-boot.js` is a committed pre-built artifact | Keep committed; CI asserts freshness on every push |
| Sync scripts assume `packages/scanlines-system/scripts/` location | Scripts move with the package; consumers update the relative path only |
| `sync_selector_contract.py` hardcodes monorepo-relative targets | Script moves into scanlines-system; sibling-relative target paths still resolve |
| Boundary check (`check_scanlines_system_boundary.sh`) only existed in-monorepo | Extraction structurally prevents the coupling it guarded; drop or slim to "lab/Hugo import the barrel, not deep paths" |
| Active homepage-effects work (WARP/dice/Taybols) now lives in the sibling repo | Expected and accepted — `file:` link preserves HMR; future effect work happens in scanlines-system |

## Out of scope

- Publishing to any npm registry (public or private).
- Moving the `lab` into the new repo / giving the package a standalone demo site.
- undef-sprite (does not consume the package).
- The gated admin/account Terraform deploys.
- Any change to the theme's runtime behavior, tokens, or visuals.

## Global constraints

- New repo is **private**; `package.json` stays `private: true`; nothing is
  published to a registry.
- Distribution remains **vendor-sync**; vendored files stay byte-identical
  through the move (`check:theme` must stay green).
- Consumer repointing is **relative-path-only** — no absolute paths, no
  hardcoded URLs/ports.
- CI workflow `run:` blocks over 3 lines are extracted to `ci/` scripts.
- Commit messages do not mention AI assistance; no git rollbacks (changes are
  auto-committed); sign with `git -c commit.gpgsign=false` when interactive
  signing is unavailable.
