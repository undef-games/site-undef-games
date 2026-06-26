# Scanlines-System Repo Extraction Implementation Plan

**Status:** ✅ Complete (prior session) — package extracted to its own private repo; all consumers repointed (sibling `file:` link); merged + pushed.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move `packages/scanlines-system` out of undef-logos into its own private repo `undef-games/scanlines-system`, with every consumer repointed and every pre-existing test still green.

**Architecture:** The new repo is a disk sibling of undef-logos/admin/account. Distribution stays **vendor-sync** (no registry). undef-logos's `lab` + Hugo consume the package's source via a sibling `file:` link; admin/account keep vendoring the curated subset; the only change anywhere is a relative path losing its `undef-logos/packages/` segment. The package gains its own standalone build/test/CI (it currently borrows lab's).

**Tech Stack:** TypeScript (ESM, `Bundler` resolution, `noEmit`), Vitest + v8 coverage, esbuild (theme-boot build), git filter-repo (history), GitHub Actions.

## Layout & environment (read first)

All four repos are siblings under `/Users/tim/code/gh/undef-games/`:

```
/Users/tim/code/gh/undef-games/
├── scanlines-system/   ← NEW (this plan creates it)
├── undef-logos/        ← lab + Hugo (source consumer)
├── undef-admin/        ← frontend/ (vendor consumer)
├── undef-account/      ← frontend/ (vendor consumer)
└── undef-auth/         ← vendor/ (selector-contract only)
```

**Every relative path in this plan assumes that sibling layout.** Apply the
undef-logos edits to the canonical `/Users/tim/code/gh/undef-games/undef-logos`
checkout (not a nested `.worktrees/...` worktree — its relative depth differs
and `file:../../scanlines-system` would not resolve). Confirm which undef-logos
checkout is canonical before Task 7.

## Global Constraints

- New repo is **private** (`gh repo create --private`); `package.json` stays `private: true`; nothing is published to any npm registry.
- Distribution remains **vendor-sync**; the vendored `src/vendor/scanlines-system/` files in admin/account MUST stay byte-identical through the move (`check:theme` stays green; only `VENDOR_MANIFEST.json`'s `sourceSha` may change on a real re-sync, and `--check` ignores `sourceSha`).
- Consumer repointing is **relative-path-only** — no absolute paths, no hardcoded URLs/ports.
- CI workflow `run:` blocks over 3 lines are extracted to a `ci/` script (or an npm script) with a one-line comment above each step.
- Commit messages do **not** mention AI assistance. No git rollbacks. Use `git -c commit.gpgsign=false commit` (interactive signing fails non-interactively).
- The package's `exports` map is unchanged: `"."` → `./src/index.ts`, `"./styles/site.css"` → `./src/atmosphere/site.css`, `"./testing/selector-contract"` → `./src/testing/selector-contract.ts`.

---

### Task 1: Extract the package into a new private repo (history preserved)

Creates `undef-games/scanlines-system` from undef-logos's history, with
`packages/scanlines-system/` rewritten to the repo root. **This is the one
outward, hard-to-reverse step (creates a remote private repo + first push) —
confirm before pushing.**

**Files:**
- Create: `/Users/tim/code/gh/undef-games/scanlines-system/` (whole repo)
- Source: `/Users/tim/code/gh/undef-games/undef-logos` (clone source; package at `packages/scanlines-system`)

**Interfaces:**
- Produces: a repo whose root contains `src/`, `scripts/`, `dist/`, `package.json`, `tsconfig.json` — the exact contents of `packages/scanlines-system/` today.

- [ ] **Step 1: Ensure `git filter-repo` is available**

```bash
git filter-repo --version || brew install git-filter-repo
```
Expected: a version string (install if missing).

- [ ] **Step 2: Clone undef-logos to the sibling path and filter to the subdirectory**

```bash
cd /Users/tim/code/gh/undef-games
git clone /Users/tim/code/gh/undef-games/undef-logos scanlines-system
cd scanlines-system
git checkout main
git filter-repo --subdirectory-filter packages/scanlines-system
```
Expected: filter-repo rewrites history; `packages/scanlines-system` becomes the root. `git filter-repo` removes the `origin` remote automatically.

> **Fallback if `git filter-repo` cannot be installed** — use built-in subtree:
> ```bash
> cd /Users/tim/code/gh/undef-games/undef-logos && git subtree split -P packages/scanlines-system -b scanlines-export
> cd /Users/tim/code/gh/undef-games && mkdir scanlines-system && cd scanlines-system && git init
> git pull /Users/tim/code/gh/undef-games/undef-logos scanlines-export
> ```

- [ ] **Step 3: Verify the contents and history landed at root**

```bash
cd /Users/tim/code/gh/undef-games/scanlines-system
ls src scripts dist package.json tsconfig.json
git log --oneline | head -5
test ! -d packages && echo "no nested packages/ — OK"
```
Expected: all listed paths exist; commit history is present; `no nested packages/ — OK`.

- [ ] **Step 4: Create the private GitHub repo and push (CONFIRM FIRST)**

```bash
cd /Users/tim/code/gh/undef-games/scanlines-system
gh repo create undef-games/scanlines-system --private --source=. --remote=origin
git push -u origin main
```
Expected: repo created private; `main` pushed. Verify: `gh repo view undef-games/scanlines-system --json visibility -q .visibility` → `PRIVATE`.

---

### Task 2: Stand up a standalone `package.json` (own devDeps + scripts)

The package currently declares no devDeps and borrows lab's. Give it the exact
versions lab uses so it installs and builds on its own.

**Files:**
- Modify: `/Users/tim/code/gh/undef-games/scanlines-system/package.json`
- Create: `/Users/tim/code/gh/undef-games/scanlines-system/package-lock.json` (generated)

**Interfaces:**
- Produces: npm scripts `typecheck`, `test`, `coverage`, `build:theme-boot`, `check:dist`; a populated `node_modules` so Tasks 3–6 can run.

- [ ] **Step 1: Replace `package.json` with the standalone manifest**

```json
{
  "name": "@undef-games/scanlines-system",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "exports": {
    ".": "./src/index.ts",
    "./styles/site.css": "./src/atmosphere/site.css",
    "./testing/selector-contract": "./src/testing/selector-contract.ts"
  },
  "scripts": {
    "typecheck": "tsc --noEmit -p tsconfig.json",
    "test": "vitest run",
    "test:run": "vitest run",
    "coverage": "vitest run --coverage",
    "build:theme-boot": "node scripts/build-theme-boot.mjs",
    "check:dist": "node scripts/build-theme-boot.mjs && git diff --exit-code dist/"
  },
  "dependencies": {
    "@provide-io/telemetry": "^0.4.8"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "6.9.1",
    "@testing-library/react": "16.3.2",
    "@testing-library/user-event": "14.6.1",
    "@types/node": "25.9.3",
    "@types/react": "19.2.17",
    "@types/react-dom": "19.2.3",
    "@vitejs/plugin-react": "6.0.2",
    "@vitest/coverage-v8": "^4.1.8",
    "esbuild": "0.28.1",
    "jsdom": "29.1.1",
    "pixi.js": "8.19.0",
    "react": "19.2.7",
    "react-dom": "19.2.7",
    "typescript": "6.0.3",
    "vitest": "4.1.8"
  },
  "overrides": {
    "esbuild": "0.28.1"
  }
}
```

- [ ] **Step 2: Install and generate the lockfile**

```bash
cd /Users/tim/code/gh/undef-games/scanlines-system
npm install
```
Expected: installs cleanly; `package-lock.json` is created.

- [ ] **Step 3: Verify the theme-boot build runs (esbuild resolves) and dist is unchanged**

```bash
npm run check:dist
```
Expected: builds and prints no diff (committed `dist/theme-boot.js` is byte-identical to a fresh build). Exit 0.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git -c commit.gpgsign=false commit -m "build: standalone package manifest with own devDependencies"
```

---

### Task 3: Standalone `tsconfig.json` (resolve from own node_modules)

Remove the `../../lab/node_modules` `typeRoots`/`paths` so the package
typechecks without lab.

**Files:**
- Modify: `/Users/tim/code/gh/undef-games/scanlines-system/tsconfig.json`

**Interfaces:**
- Consumes: devDeps installed in Task 2 (`@types/node`, `@types/react`, `vitest`, `@testing-library/jest-dom`, `pixi.js`, `@provide-io/telemetry`).
- Produces: a passing `npm run typecheck`.

- [ ] **Step 1: Replace `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2024",
    "useDefineForClassFields": true,
    "lib": ["DOM", "DOM.Iterable", "ES2024"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "ignoreDeprecations": "6.0",
    "baseUrl": ".",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "types": ["node", "vitest/globals", "@testing-library/jest-dom"]
  },
  "include": ["src"]
}
```

- [ ] **Step 2: Run the typecheck**

```bash
cd /Users/tim/code/gh/undef-games/scanlines-system
npm run typecheck
```
Expected: exits 0 with no errors. (If a type for `pixi.js`/`react` is unresolved, confirm Task 2 installed it; do not re-add `../../lab` paths.)

- [ ] **Step 3: Commit**

```bash
git add tsconfig.json
git -c commit.gpgsign=false commit -m "build: standalone tsconfig resolving from own node_modules"
```

---

### Task 4: Standalone `vitest.config.ts` + test setup (100% coverage gate)

Move the test runner config and the 100% coverage thresholds out of
`lab/vite.config.ts` into the package.

**Files:**
- Create: `/Users/tim/code/gh/undef-games/scanlines-system/vitest.config.ts`
- Create: `/Users/tim/code/gh/undef-games/scanlines-system/test/setup.ts`

**Interfaces:**
- Consumes: `@vitejs/plugin-react`, `vitest`, `jsdom`, `@testing-library/jest-dom`, `@vitest/coverage-v8` from Task 2.
- Produces: `npm test` and `npm run coverage` green; the coverage gate covers `tokens/log.ts`, `react/telemetry.ts`, `react/console/**`, `react/kit/**`, `surfaces/presets.ts`.

- [ ] **Step 1: Create `test/setup.ts`** (copied verbatim from lab's setup — jsdom mocks for ResizeObserver + localStorage)

```ts
import '@testing-library/jest-dom/vitest'

class ResizeObserverMock {
  private readonly callback: ResizeObserverCallback

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback
  }

  observe(target: Element) {
    this.callback(
      [
        {
          target,
          contentRect: target.getBoundingClientRect()
        } as ResizeObserverEntry
      ],
      this
    )
  }

  unobserve() {}
  disconnect() {}
}

globalThis.ResizeObserver ??= ResizeObserverMock

class StorageMock implements Storage {
  private readonly items = new Map<string, string>()

  get length() {
    return this.items.size
  }

  clear() {
    this.items.clear()
  }

  getItem(key: string) {
    return this.items.get(key) ?? null
  }

  key(index: number) {
    return Array.from(this.items.keys())[index] ?? null
  }

  removeItem(key: string) {
    this.items.delete(key)
  }

  setItem(key: string, value: string) {
    this.items.set(key, value)
  }
}

if (!globalThis.localStorage) {
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: new StorageMock(),
  })
}

if (typeof window !== 'undefined' && !window.localStorage) {
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: globalThis.localStorage,
  })
}
```

- [ ] **Step 2: Create `vitest.config.ts`** (globs relative to the package root; coverage `include` de-globbed from `**/scanlines-system/src/...` to `src/...`)

```ts
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  test: {
    include: ['src/**/*.{test,spec}.{ts,tsx}', 'scripts/**/*.{test,spec}.mjs'],
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    server: {
      deps: {
        // Force @provide-io/telemetry through Vite's resolver so extensionless
        // internal imports resolve in the ESM test env.
        inline: ['@provide-io/telemetry'],
      },
    },
    coverage: {
      provider: 'v8',
      include: [
        'src/tokens/log.ts',
        'src/react/telemetry.ts',
        'src/react/console/**',
        'src/react/kit/**',
        'src/surfaces/presets.ts',
      ],
      thresholds: { lines: 100, functions: 100, branches: 100, statements: 100 },
    },
  },
})
```

- [ ] **Step 3: Run tests + coverage**

```bash
cd /Users/tim/code/gh/undef-games/scanlines-system
npm run coverage
```
Expected: all migrated unit tests (tokens/react/atmosphere/surfaces) AND the `scripts/*.test.mjs` tests pass; the v8 coverage gate reports 100% lines/functions/branches/statements on the included files; exit 0.

- [ ] **Step 4: Commit**

```bash
git add vitest.config.ts test/setup.ts
git -c commit.gpgsign=false commit -m "test: standalone vitest config + setup with 100% coverage gate"
```

---

### Task 5: Move the selector-contract sync script into the new repo

`sync_selector_contract.py` distributes `selector-contract.ts` to undef-auth +
undef-account (a separate channel from vendor-surface). Move it with corrected
path math so it still resolves the sibling targets.

**Files:**
- Create: `/Users/tim/code/gh/undef-games/scanlines-system/scripts/sync_selector_contract.py`

**Interfaces:**
- Produces: a script that copies `src/testing/selector-contract.ts` to the two sibling vendor paths; reused by Task 10 (which deletes the undef-logos copy).

- [ ] **Step 1: Create the script with package-root-relative path math**

```python
#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path
import shutil


PKG_ROOT = Path(__file__).resolve().parents[1]
MONOREPO_ROOT = PKG_ROOT.parent
SOURCE = PKG_ROOT / "src" / "testing" / "selector-contract.ts"
TARGETS = [
    MONOREPO_ROOT / "undef-auth" / "vendor" / "scanlines-system" / "selector-contract.ts",
    MONOREPO_ROOT / "undef-account" / "frontend" / "vendor" / "scanlines-system" / "selector-contract.ts",
]


def main() -> int:
    if not SOURCE.exists():
        raise SystemExit(f"missing source contract: {SOURCE}")

    for target in TARGETS:
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(SOURCE, target)
        print(f"synced {SOURCE} -> {target}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
```

- [ ] **Step 2: Verify it reproduces the existing contracts byte-identically**

```bash
cd /Users/tim/code/gh/undef-games/scanlines-system
python scripts/sync_selector_contract.py
git -C /Users/tim/code/gh/undef-games/undef-auth diff --stat
git -C /Users/tim/code/gh/undef-games/undef-account diff --stat
```
Expected: the script prints two `synced …` lines; both consumer `git diff --stat` show **no changes** (the moved script produced identical files), confirming the path math is correct.

- [ ] **Step 3: Commit**

```bash
cd /Users/tim/code/gh/undef-games/scanlines-system
git add scripts/sync_selector_contract.py
git -c commit.gpgsign=false commit -m "build: move selector-contract sync into the package"
```

---

### Task 6: CI workflow + README

Lean CI for a private vendored package: typecheck → test+coverage → assert the
committed theme-boot dist is fresh. Plus a README documenting how it's consumed.

**Files:**
- Create: `/Users/tim/code/gh/undef-games/scanlines-system/.github/workflows/ci.yml`
- Create: `/Users/tim/code/gh/undef-games/scanlines-system/README.md`

**Interfaces:**
- Consumes: npm scripts `typecheck`, `coverage`, `check:dist` from Task 2.

- [ ] **Step 1: Create `.github/workflows/ci.yml`** (each step ≤1 logic line via npm scripts, so no `ci/` extraction needed)

```yaml
name: ci
on:
  push:
    branches: [main]
  pull_request:

jobs:
  build-test:
    runs-on: ubuntu-latest
    steps:
      # Check out the repository
      - uses: actions/checkout@v4
      # Node 22 matches the consumer engines field
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      # Install from the committed lockfile
      - run: npm ci
      # Typecheck against the package's own tsconfig
      - run: npm run typecheck
      # Unit tests with the 100% coverage gate
      - run: npm run coverage
      # Fail if committed dist/theme-boot.js drifted from a fresh build
      - run: npm run check:dist
```

- [ ] **Step 2: Create `README.md`**

````markdown
# @undef-games/scanlines-system

Private shared visual system (scanline theme, tokens, React kit, console
surface, atmosphere/station effects) for the Undef sites and back-office apps.

## Layout

This repo lives as a **sibling** of its consumers:

```
undef-games/
├── scanlines-system/   ← this repo (canonical source)
├── undef-logos/        ← flagship Hugo site + lab (source consumer via file: link)
├── undef-admin/        ← vendors the UI subset
├── undef-account/      ← vendors the UI subset
└── undef-auth/         ← vendors selector-contract only
```

## Distribution: vendor-sync (no registry)

Not published to npm. Consumers copy a curated file subset into their own
`src/vendor/scanlines-system/` and verify it hasn't drifted:

```bash
# from a consumer (e.g. undef-admin/frontend):
node ../../scanlines-system/scripts/sync-scanlines.mjs --target .   # refresh
node ../../scanlines-system/scripts/sync-scanlines.mjs --check --target .   # drift check
```

undef-logos's `lab` + Hugo instead import the source directly via a
`file:../../scanlines-system` link + Vite alias.

The selector contract is distributed separately:
`python scripts/sync_selector_contract.py`.

## Develop

```bash
npm install
npm run typecheck
npm run coverage        # unit tests + 100% coverage gate
npm run build:theme-boot
```
````

- [ ] **Step 3: Verify CI steps locally**

```bash
cd /Users/tim/code/gh/undef-games/scanlines-system
npm run typecheck && npm run coverage && npm run check:dist
```
Expected: all three exit 0.

- [ ] **Step 4: Commit and push**

```bash
git add .github/workflows/ci.yml README.md
git -c commit.gpgsign=false commit -m "ci: typecheck/test/coverage/dist-freshness workflow + README"
git push
```
Expected: push succeeds; the GitHub Actions run goes green. **The new repo is now self-sufficient in isolation — Phase A complete.**

---

### Task 7: Repoint undef-logos lab + Hugo to the sibling

Switch lab's source link, Vite aliases, tsconfig paths, and the theme-boot
script from `../packages/scanlines-system` to the sibling
`../../scanlines-system`; drop the now-foreign scanlines test/coverage globs
from lab's vitest. The package still physically exists in undef-logos until
Task 10 — this task just stops pointing at it.

**Files:**
- Modify: `/Users/tim/code/gh/undef-games/undef-logos/lab/package.json:18,14`
- Modify: `/Users/tim/code/gh/undef-games/undef-logos/lab/tsconfig.json:17-18`
- Modify: `/Users/tim/code/gh/undef-games/undef-logos/lab/vite.config.ts:29-30,42,52-63`

**Interfaces:**
- Consumes: the sibling repo at `/Users/tim/code/gh/undef-games/scanlines-system` (Tasks 1–6).

- [ ] **Step 1: Repoint `lab/package.json`** — the `file:` dep (line 18) and the `build:theme-boot` script (line 14)

Change:
```json
"@undef-games/scanlines-system": "file:../packages/scanlines-system",
```
to:
```json
"@undef-games/scanlines-system": "file:../../scanlines-system",
```
and:
```json
"build:theme-boot": "node ../packages/scanlines-system/scripts/build-theme-boot.mjs"
```
to:
```json
"build:theme-boot": "node ../../scanlines-system/scripts/build-theme-boot.mjs"
```

- [ ] **Step 2: Repoint `lab/tsconfig.json` paths** (lines 17–18)

Change:
```json
"@undef-games/scanlines-system": ["../packages/scanlines-system/src/index.ts"],
"@undef-games/scanlines-system/styles/site.css": ["../packages/scanlines-system/src/styles/site.css"],
```
to:
```json
"@undef-games/scanlines-system": ["../../scanlines-system/src/index.ts"],
"@undef-games/scanlines-system/styles/site.css": ["../../scanlines-system/src/styles/site.css"],
```

- [ ] **Step 3: Repoint the Vite aliases and strip foreign test globs in `lab/vite.config.ts`**

Aliases (lines 29–30):
```ts
      '@undef-games/scanlines-system/styles/site.css': resolve(__dirname, '../../scanlines-system/src/atmosphere/site.css'),
      '@undef-games/scanlines-system': resolve(__dirname, '../../scanlines-system/src/index.ts'),
```
Test `include` (line 42) — drop the two `../packages/scanlines-system/...` entries (those tests now run in the sibling repo):
```ts
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
```
Coverage block (lines 52–63) — remove it entirely; the 100% gate now lives in the sibling repo. The resulting `test` block is:
```ts
  test: {
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    server: {
      deps: {
        inline: ['@provide-io/telemetry'],
      },
    },
  }
```

- [ ] **Step 4: Relink and verify lab typecheck + tests**

```bash
cd /Users/tim/code/gh/undef-games/undef-logos
npm --prefix lab install
npm --prefix lab run typecheck
npm --prefix lab run test:run
```
Expected: install relinks to the sibling; typecheck passes; lab's own tests pass (the scanlines tests no longer run here — they run in the sibling repo).

- [ ] **Step 5: Verify the full site build + homepage renders from the sibling**

```bash
cd /Users/tim/code/gh/undef-games/undef-logos
make build
test -f public/index.html && test -d public/lab && echo "build OK"
```
Expected: `make build` succeeds sourcing the theme from the sibling; `build OK`. Spot-check that `public/` contains the scanline assets (the homepage still renders dice/WARP/scanline effects).

- [ ] **Step 6: Commit**

```bash
git add lab/package.json lab/tsconfig.json lab/vite.config.ts lab/package-lock.json
git -c commit.gpgsign=false commit -m "build: consume scanlines-system from sibling repo via file link"
```

---

### Task 8: Repoint undef-admin vendor sync

Drop `undef-logos/packages/` from admin's sync/check scripts; re-sync; prove
the vendored files and suites are unchanged.

**Files:**
- Modify: `/Users/tim/code/gh/undef-games/undef-admin/frontend/package.json:14-15`

**Interfaces:**
- Consumes: `../../scanlines-system/scripts/sync-scanlines.mjs` (Task 1).

- [ ] **Step 1: Repoint the `sync:theme` and `check:theme` scripts**

Change both occurrences of:
```
../../undef-logos/packages/scanlines-system/scripts/sync-scanlines.mjs
```
to:
```
../../scanlines-system/scripts/sync-scanlines.mjs
```
(Lines 14–15: `sync:theme` and `check:theme`.)

- [ ] **Step 2: Re-sync from the new source and confirm vendored files are byte-identical**

```bash
cd /Users/tim/code/gh/undef-games/undef-admin/frontend
npm run sync:theme
git diff --stat src/vendor/scanlines-system/
```
Expected: `sync:theme` succeeds. `git diff --stat` shows **no file content changes** except possibly `VENDOR_MANIFEST.json`'s `sourceSha` line (the new repo's HEAD sha) — that is acceptable.

- [ ] **Step 3: Verify the drift check passes**

```bash
npm run check:theme
```
Expected: `scanlines vendor OK`, exit 0.

- [ ] **Step 4: Run the admin suites (unit + e2e harness)**

```bash
npm run test
npm run e2e
```
Expected: unit suite green (~274 tests); e2e green (5 specs — toggle, console, telemetry).

- [ ] **Step 5: Commit**

```bash
git add frontend/package.json frontend/src/vendor/scanlines-system/
git -c commit.gpgsign=false commit -m "build: source scanlines vendor from extracted repo"
```

---

### Task 9: Repoint undef-account vendor sync (+ verify auth contract)

Same repoint for account; also confirm the selector-contract channel
(undef-auth + account) is satisfied by the moved script from Task 5.

**Files:**
- Modify: `/Users/tim/code/gh/undef-games/undef-account/frontend/package.json:14-15`

**Interfaces:**
- Consumes: `../../scanlines-system/scripts/sync-scanlines.mjs` (Task 1); the moved `sync_selector_contract.py` (Task 5).

- [ ] **Step 1: Repoint the `sync:theme` and `check:theme` scripts**

Change both occurrences of:
```
../../undef-logos/packages/scanlines-system/scripts/sync-scanlines.mjs
```
to:
```
../../scanlines-system/scripts/sync-scanlines.mjs
```

- [ ] **Step 2: Re-sync and confirm byte-identical vendored files**

```bash
cd /Users/tim/code/gh/undef-games/undef-account/frontend
npm run sync:theme
git diff --stat src/vendor/scanlines-system/
```
Expected: no content changes beyond an optional `VENDOR_MANIFEST.json` `sourceSha` update.

- [ ] **Step 3: Verify drift check + selector contract**

```bash
npm run check:theme
python /Users/tim/code/gh/undef-games/scanlines-system/scripts/sync_selector_contract.py
git -C /Users/tim/code/gh/undef-games/undef-auth diff --stat
git diff --stat vendor/scanlines-system/selector-contract.ts
```
Expected: `scanlines vendor OK`; the selector-contract sync reports no changes in undef-auth or account (already verified in Task 5; re-confirmed here).

- [ ] **Step 4: Run the account suites (unit + e2e)**

```bash
npm run test
npm run e2e
```
Expected: unit green (~135 tests); e2e green (theme hydration + signal-color specs).

- [ ] **Step 5: Commit**

```bash
git add frontend/package.json frontend/src/vendor/scanlines-system/
git -c commit.gpgsign=false commit -m "build: source scanlines vendor from extracted repo"
```

---

### Task 10: Decommission the package from undef-logos

Every consumer now sources from the sibling. Remove the original package and the
monorepo-only tooling that referenced it, and prove undef-logos still builds.

**Files:**
- Delete: `/Users/tim/code/gh/undef-games/undef-logos/packages/scanlines-system/` (whole dir)
- Delete: `/Users/tim/code/gh/undef-games/undef-logos/scripts/check_scanlines_system_boundary.sh`
- Delete: `/Users/tim/code/gh/undef-games/undef-logos/scripts/sync_selector_contract.py`
- Modify: `/Users/tim/code/gh/undef-games/undef-logos/Makefile`

**Interfaces:**
- Consumes: nothing new; this is removal. All builds must still pass sourcing from the sibling.

- [ ] **Step 1: Remove the package directory and the moved/obsolete scripts**

```bash
cd /Users/tim/code/gh/undef-games/undef-logos
git rm -r packages/scanlines-system
git rm scripts/check_scanlines_system_boundary.sh scripts/sync_selector_contract.py
```
Expected: files staged for deletion. (If `packages/` is now empty, it disappears.)

- [ ] **Step 2: Simplify the Makefile** — remove the three targets that referenced the package/boundary/python script and their prerequisites

Edit `Makefile`:
- `.PHONY` line: remove `check-system-boundary typecheck-system sync-selector-contract`.
- Delete the `check-system-boundary:` target (lines 18–19).
- Delete the `typecheck-system:` target (lines 21–22).
- Delete the `sync-selector-contract:` target (lines 59–60).
- Change `typecheck:` to drop the `typecheck-system` prerequisite:
  ```make
  typecheck: ## Run lab TypeScript checks
  	@npm --prefix lab run typecheck
  ```
- Change `test:` to drop the `check-system-boundary` prerequisite:
  ```make
  test: install-lab ## Run lab unit tests
  	@npm --prefix lab run test:run
  ```

- [ ] **Step 3: Verify undef-logos still typechecks, tests, and builds (from the sibling only)**

```bash
cd /Users/tim/code/gh/undef-games/undef-logos
make typecheck
make test
make build
test ! -d packages/scanlines-system && echo "package removed — OK"
```
Expected: all three `make` targets pass with no reference to `packages/scanlines-system`; `package removed — OK`. The homepage build still renders the scanline effects (sourced from the sibling).

- [ ] **Step 4: Commit**

```bash
git add -A
git -c commit.gpgsign=false commit -m "chore: remove scanlines-system package after extraction to its own repo"
```

---

## Final verification (whole-branch)

After Task 10, run the four consumer gates once more to confirm the extraction
is invisible to behavior:

```bash
# new repo
cd /Users/tim/code/gh/undef-games/scanlines-system && npm run typecheck && npm run coverage && npm run check:dist
# undef-logos
cd /Users/tim/code/gh/undef-games/undef-logos && make typecheck && make test && make build
# admin
cd /Users/tim/code/gh/undef-games/undef-admin/frontend && npm run check:theme && npm test && npm run e2e
# account
cd /Users/tim/code/gh/undef-games/undef-account/frontend && npm run check:theme && npm test && npm run e2e
```

Extraction is correct iff every gate is green and the flagship homepage still
renders.
