# Scanlines System Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move shared production/runtime TypeScript out of `lab/` into `packages/scanlines-system`, keep Hugo entrypoints thin under `themes/scanlines/assets/ts`, and leave `lab/` as a separate Vite app that consumes the shared system.

**Architecture:** Create a shared internal package for site, station, and theme runtime logic. Hugo theme entrypoints become small wrappers that mount the shared site runtime, while the lab app imports the same shared modules plus its own lab-only UI. Keep the persisted theme contract stable so the site and lab continue to share state during the migration.

**Tech Stack:** Hugo, TypeScript, React, Vite, PixiJS, Vitest, Playwright, Cloudflare Pages

---

## File Structure

### New shared package

- `packages/scanlines-system/package.json`
  - private workspace package metadata
- `packages/scanlines-system/tsconfig.json`
  - package-local TS config
- `packages/scanlines-system/src/index.ts`
  - explicit public exports
- `packages/scanlines-system/src/site/`
  - shared site shell, copy loader, site bootstrap
- `packages/scanlines-system/src/station/`
  - scanline scene, engine, renderer, station primitives
- `packages/scanlines-system/src/theme/`
  - persistence, theme hydration helpers, shared state types
- `packages/scanlines-system/src/styles/`
  - shared runtime CSS imported by site and lab entrypoints

### Hugo theme entrypoints

- `themes/scanlines/assets/ts/site.ts`
  - thin production site entrypoint
- `themes/scanlines/assets/ts/theme-hydrate.ts`
  - thin hydration entrypoint or wrapper

### Lab app

- `lab/src/main.tsx`
  - lab app entrypoint
- `lab/src/`
  - lab-only controls and experiments remain here

### Build / config

- `package.json`
  - root scripts, workspace wiring if needed
- `Makefile`
  - build commands updated to compile the new shared package through Hugo/lab entrypoints
- `lab/vite.config.*` or existing Vite config file
  - resolve shared package imports for lab

### Tests

- move shared tests alongside moved shared modules under `packages/scanlines-system/src/**`
- keep Hugo/site e2e under `tests/e2e/`
- keep lab-only tests under `lab/src/**`

---

### Task 1: Create the shared `scanlines-system` package scaffold

**Files:**
- Create: `packages/scanlines-system/package.json`
- Create: `packages/scanlines-system/tsconfig.json`
- Create: `packages/scanlines-system/src/index.ts`
- Modify: `package.json`
- Test: `make build`

- [ ] **Step 1: Add a failing build assertion by importing the package before it exists**

Add a temporary import in a future consumer task only after the package exists on disk. For this scaffold task, the failing check is the package resolution itself via a dry typecheck step.

Run:

```bash
cd /Users/tim/code/gh/undef-games/undef-logos/.worktrees/main-verify
npm --prefix lab exec tsc --noEmit
```

Expected:
- current baseline may pass or fail for unrelated worktree reasons
- note current state; do not “fix” unrelated issues here

- [ ] **Step 2: Add package metadata**

Create `packages/scanlines-system/package.json`:

```json
{
  "name": "@undef/scanlines-system",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "exports": {
    ".": "./src/index.ts"
  }
}
```

- [ ] **Step 3: Add package TS config**

Create `packages/scanlines-system/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2024",
    "lib": ["DOM", "DOM.Iterable", "ES2024"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true,
    "types": ["node", "vitest/globals", "@testing-library/jest-dom"]
  },
  "include": ["src"]
}
```

- [ ] **Step 4: Add explicit empty package exports**

Create `packages/scanlines-system/src/index.ts`:

```ts
export {}
```

- [ ] **Step 5: Wire root metadata if needed**

If root `package.json` needs workspace metadata, add the minimal field:

```json
{
  "workspaces": ["packages/*"]
}
```

Only add this if the current toolchain needs it for package resolution.

- [ ] **Step 6: Run the repo build**

Run:

```bash
cd /Users/tim/code/gh/undef-games/undef-logos/.worktrees/main-verify
make build
```

Expected:
- PASS

- [ ] **Step 7: Commit**

```bash
git add package.json packages/scanlines-system/package.json packages/scanlines-system/tsconfig.json packages/scanlines-system/src/index.ts
git commit -m "chore: add scanlines system package scaffold"
```

---

### Task 2: Move shared theme state and site copy loader into the package

**Files:**
- Create: `packages/scanlines-system/src/theme/persistence.ts`
- Create: `packages/scanlines-system/src/site/site-copy-loader.ts`
- Modify: `packages/scanlines-system/src/index.ts`
- Modify: `lab/src/store/persistence.ts`
- Modify: `lab/src/app/site-copy-site.ts`
- Test: moved unit tests for persistence/site-copy loader

- [ ] **Step 1: Write failing import-based tests for shared theme and copy loader modules**

Add or move tests so they import from the future package paths, for example:

```ts
import { readSiteSurfaceCopy } from '@undef/scanlines-system'
```

and

```ts
import { createDefaultThemeState } from '@undef/scanlines-system'
```

- [ ] **Step 2: Run the focused tests and verify module-resolution failure**

Run:

```bash
cd /Users/tim/code/gh/undef-games/undef-logos/.worktrees/main-verify/lab
npm run test:run -- src/app/site-copy.test.ts src/store/persistence.test.ts
```

Expected:
- FAIL because shared exports do not exist yet

- [ ] **Step 3: Move shared implementation**

Move the implementation bodies from:

- `lab/src/store/persistence.ts`
- `lab/src/app/site-copy-site.ts`

into:

- `packages/scanlines-system/src/theme/persistence.ts`
- `packages/scanlines-system/src/site/site-copy-loader.ts`

Keep interfaces the same where possible.

- [ ] **Step 4: Add package exports**

Update `packages/scanlines-system/src/index.ts`:

```ts
export * from './site/site-copy-loader'
export * from './theme/persistence'
```

- [ ] **Step 5: Convert old lab paths into thin re-exports**

Replace moved lab modules with wrappers:

```ts
export * from '@undef/scanlines-system'
```

If a wrapper would be too broad, export only the module-specific symbols.

- [ ] **Step 6: Run focused tests green**

Run:

```bash
cd /Users/tim/code/gh/undef-games/undef-logos/.worktrees/main-verify/lab
npm run test:run -- src/app/site-copy.test.ts src/store/persistence.test.ts
```

Expected:
- PASS

- [ ] **Step 7: Commit**

```bash
git add packages/scanlines-system/src/index.ts packages/scanlines-system/src/site/site-copy-loader.ts packages/scanlines-system/src/theme/persistence.ts lab/src/app/site-copy-site.ts lab/src/store/persistence.ts
git commit -m "refactor: move shared theme and copy loader into system package"
```

---

### Task 3: Move shared station runtime into the package

**Files:**
- Create: `packages/scanlines-system/src/station/*`
- Modify: existing imports in site/lab consumers
- Modify: moved tests for station modules
- Test: `lab/src/station/*.test.ts*`

- [ ] **Step 1: Pick the first moved station module and write a failing import update**

Start with the lowest-level shared modules:

- `scanline-engine.ts`
- `scanline-renderer.ts`
- `station-state.ts`

Update one focused test file to import from `@undef/scanlines-system`.

- [ ] **Step 2: Run the focused station tests and verify failure**

Run:

```bash
cd /Users/tim/code/gh/undef-games/undef-logos/.worktrees/main-verify/lab
npm run test:run -- src/station/scanline-engine.test.ts src/station/scanline-renderer.test.ts src/station/station-state.test.ts
```

Expected:
- FAIL on unresolved package exports

- [ ] **Step 3: Move low-level station modules**

Move:

- `lab/src/station/scanline-engine.ts`
- `lab/src/station/scanline-renderer.ts`
- `lab/src/station/station-state.ts`

into:

- `packages/scanlines-system/src/station/scanline-engine.ts`
- `packages/scanlines-system/src/station/scanline-renderer.ts`
- `packages/scanlines-system/src/station/station-state.ts`

- [ ] **Step 4: Move higher-level shared station modules**

Move:

- `lab/src/station/station-signal-scene.tsx`
- `lab/src/station/station-identity.tsx`
- `lab/src/station/station-controls.tsx`
- `lab/src/station/station-toys.tsx`
- `lab/src/station/effects-config.ts`
- `lab/src/station/effects-style.ts`

Only move modules actually shared by site and lab. Leave lab-only control composition in lab if it is not needed by site.

- [ ] **Step 5: Convert old lab module paths into wrappers or update imports**

Use thin re-export wrappers temporarily where needed to keep the migration incremental.

- [ ] **Step 6: Export shared station modules from the package**

Update `packages/scanlines-system/src/index.ts` with explicit station exports.

- [ ] **Step 7: Run focused station tests green**

Run:

```bash
cd /Users/tim/code/gh/undef-games/undef-logos/.worktrees/main-verify/lab
npm run test:run -- src/station/scanline-engine.test.ts src/station/scanline-renderer.test.ts src/station/station-signal-scene.test.tsx src/station/station-state.test.ts
```

Expected:
- PASS

- [ ] **Step 8: Commit**

```bash
git add packages/scanlines-system/src/index.ts packages/scanlines-system/src/station lab/src/station
git commit -m "refactor: move shared station runtime into system package"
```

---

### Task 4: Move shared site shell into the package

**Files:**
- Create: `packages/scanlines-system/src/site/app-shell.tsx`
- Create: `packages/scanlines-system/src/site/site-main.tsx`
- Modify: `lab/src/app/app-shell.tsx`
- Modify: `lab/src/site-main.tsx`
- Modify: `lab/src/app/app-shell.test.tsx`
- Test: `lab/src/app/app-shell.test.tsx`

- [ ] **Step 1: Update one `AppShell` test import to the shared package path**

Change the test to import the future shared site shell.

- [ ] **Step 2: Run the focused `AppShell` test file and verify failure**

Run:

```bash
cd /Users/tim/code/gh/undef-games/undef-logos/.worktrees/main-verify/lab
npm run test:run -- src/app/app-shell.test.tsx
```

Expected:
- FAIL because the shared site shell export does not exist yet

- [ ] **Step 3: Move `AppShell` and site bootstrap into the package**

Move:

- `lab/src/app/app-shell.tsx`
- `lab/src/site-main.tsx`

into:

- `packages/scanlines-system/src/site/app-shell.tsx`
- `packages/scanlines-system/src/site/site-main.tsx`

- [ ] **Step 4: Keep lab-specific app entry separate**

Do not move:

- `lab/src/main.tsx`
- lab-only app composition

They should import the shared site shell/system where needed.

- [ ] **Step 5: Convert old lab site-shell paths into wrappers or update imports**

Use thin wrappers if needed:

```ts
export { AppShell } from '@undef/scanlines-system'
```

- [ ] **Step 6: Export site modules from the package**

Update package exports for:

- `AppShell`
- `readSiteSurfaceCopy`
- site bootstrap helpers

- [ ] **Step 7: Run focused `AppShell` tests green**

Run:

```bash
cd /Users/tim/code/gh/undef-games/undef-logos/.worktrees/main-verify/lab
npm run test:run -- src/app/app-shell.test.tsx
```

Expected:
- PASS

- [ ] **Step 8: Commit**

```bash
git add packages/scanlines-system/src/site lab/src/app/app-shell.tsx lab/src/site-main.tsx lab/src/app/app-shell.test.tsx
git commit -m "refactor: move shared site shell into system package"
```

---

### Task 5: Add Hugo-owned TypeScript entrypoints

**Files:**
- Create: `themes/scanlines/assets/ts/site.ts`
- Modify: `themes/scanlines/assets/ts/theme-hydrate.ts`
- Modify: Hugo partials/head includes if needed
- Test: `make build`

- [ ] **Step 1: Add a failing Hugo site entry import**

Create `themes/scanlines/assets/ts/site.ts` that imports the shared site bootstrap.

- [ ] **Step 2: Run build and verify entry wiring failure if present**

Run:

```bash
cd /Users/tim/code/gh/undef-games/undef-logos/.worktrees/main-verify
make build
```

Expected:
- FAIL if Hugo or Vite wiring does not yet know about the new theme-owned entrypoint

- [ ] **Step 3: Implement thin Hugo entrypoints**

Create:

```ts
import { mountSite } from '@undef/scanlines-system'

mountSite()
```

Adapt exact exported names to the shared package.

- [ ] **Step 4: Keep `theme-hydrate.ts` thin**

If hydration logic now belongs in the package, keep this file as:

```ts
import { hydrateTheme } from '@undef/scanlines-system'

hydrateTheme()
```

- [ ] **Step 5: Update Hugo asset inclusion**

Wire the new theme-owned entrypoint into the Hugo head/foot partials instead of pointing to lab-owned built assets.

- [ ] **Step 6: Run build green**

Run:

```bash
cd /Users/tim/code/gh/undef-games/undef-logos/.worktrees/main-verify
make build
```

Expected:
- PASS
- site assets are generated from `themes/scanlines/assets/ts`

- [ ] **Step 7: Commit**

```bash
git add themes/scanlines/assets/ts themes/scanlines/layouts/partials
git commit -m "refactor: add hugo-owned site entrypoints"
```

---

### Task 6: Move shared runtime styles into the package and keep Hugo CSS boundaries clear

**Files:**
- Create: `packages/scanlines-system/src/styles/*`
- Modify: lab/shared style imports
- Modify: Hugo site entrypoint imports
- Test: focused site and lab rendering tests

- [ ] **Step 1: Identify shared runtime CSS with a failing import relocation**

Start with shared runtime-facing files such as:

- `hero.css`
- `responsive.css`
- `shell.css`
- `section-toys.css`

Do not move Hugo-specific chrome CSS from `themes/scanlines/static/css`.

- [ ] **Step 2: Run a focused test or build check and verify missing-style/import failure**

Run:

```bash
cd /Users/tim/code/gh/undef-games/undef-logos/.worktrees/main-verify
make build
```

Expected:
- FAIL if imports still point at old lab-only style locations

- [ ] **Step 3: Move shared styles**

Move only styles required by both site and lab runtime into:

- `packages/scanlines-system/src/styles/`

- [ ] **Step 4: Update imports**

Ensure:

- Hugo site entrypoint imports shared styles
- lab app imports shared styles plus lab-only styles

- [ ] **Step 5: Run focused checks green**

Run:

```bash
cd /Users/tim/code/gh/undef-games/undef-logos/.worktrees/main-verify
make build
./node_modules/.bin/playwright test tests/e2e/site.spec.ts -g "renders the refreshed homepage copy and logs navigation"
./node_modules/.bin/playwright test tests/e2e/logo-lab.spec.ts -g "keeps the Pixi canvas fitted after viewport resize"
```

Expected:
- PASS

- [ ] **Step 6: Commit**

```bash
git add packages/scanlines-system/src/styles lab/src/styles
git commit -m "refactor: move shared runtime styles into system package"
```

---

### Task 7: Slim `lab/` to lab-only ownership

**Files:**
- Modify: remaining `lab/src/**`
- Test: `lab` build/tests

- [ ] **Step 1: Audit remaining production-owned modules still under `lab/src`**

Use:

```bash
cd /Users/tim/code/gh/undef-games/undef-logos/.worktrees/main-verify
rg -n "site-main|AppShell|station-signal-scene|readSiteSurfaceCopy|createDefaultThemeState" lab/src
```

Expected:
- only lab-owned consumers or thin wrappers remain

- [ ] **Step 2: Remove obsolete wrappers where safe**

Delete wrappers that are no longer needed after imports are updated.

- [ ] **Step 3: Re-run lab test/build**

Run:

```bash
cd /Users/tim/code/gh/undef-games/undef-logos/.worktrees/main-verify/lab
npm run typecheck
npm run test:run
npm run build
```

Expected:
- PASS

- [ ] **Step 4: Commit**

```bash
git add lab/src
git commit -m "refactor: slim lab to lab-only modules"
```

---

### Task 8: Full verification and deployment

**Files:**
- Verify only

- [ ] **Step 1: Run full repo build**

```bash
cd /Users/tim/code/gh/undef-games/undef-logos/.worktrees/main-verify
make build
```

Expected:
- PASS

- [ ] **Step 2: Run lab unit tests**

```bash
cd /Users/tim/code/gh/undef-games/undef-logos/.worktrees/main-verify
make test
```

Expected:
- PASS

- [ ] **Step 3: Run lab typecheck**

```bash
cd /Users/tim/code/gh/undef-games/undef-logos/.worktrees/main-verify
make typecheck
```

Expected:
- PASS

- [ ] **Step 4: Run focused site and lab e2e**

```bash
cd /Users/tim/code/gh/undef-games/undef-logos/.worktrees/main-verify
./node_modules/.bin/playwright test tests/e2e/site.spec.ts
./node_modules/.bin/playwright test tests/e2e/logo-lab.spec.ts
```

Expected:
- PASS

- [ ] **Step 5: Confirm no Hugo dependency on `lab/` for site runtime**

Run:

```bash
cd /Users/tim/code/gh/undef-games/undef-logos/.worktrees/main-verify
rg -n "lab/src|lab/dist|site-main|app-shell" themes/scanlines
```

Expected:
- no production site dependency on `lab/src`

- [ ] **Step 6: Deploy preview**

```bash
cd /Users/tim/code/gh/undef-games/undef-logos/.worktrees/main-verify
make deploy-preview
```

Expected:
- Cloudflare preview deploy succeeds

- [ ] **Step 7: Deploy production**

```bash
cd /Users/tim/code/gh/undef-games/undef-logos/.worktrees/main-verify
make deploy
```

Expected:
- production deploy succeeds

---

## Self-Review

- Spec coverage:
  - shared package creation: Task 1
  - shared theme/site/runtime migration: Tasks 2-4
  - Hugo-owned thin entrypoints: Task 5
  - shared style ownership: Task 6
  - lab kept separate and slimmed: Task 7
  - verification and deploy: Task 8
- Placeholder scan:
  - no TBD/TODO placeholders remain
  - each task has concrete file paths and commands
- Type consistency:
  - package name is consistently `@undef/scanlines-system`
  - Hugo entrypoint path is consistently `themes/scanlines/assets/ts/site.ts`
  - shared package path is consistently `packages/scanlines-system`
