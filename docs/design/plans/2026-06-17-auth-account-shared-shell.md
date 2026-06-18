# Auth and Account Shared Shell Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `undef-auth` and `undef-account` consume the same actual shared shell, mark geometry, and theme widgets from `scanlines-system`, with auth keeping the live scanline field and account staying quiet for now.

**Architecture:** Expand the existing `scanlines-system` auth/account shell slice in `undef-logos` so it owns the exact mark geometry, shell geometry, and button/header styling. Then sync that bounded slice into `undef-auth` and `undef-account`, replacing local shell/mark drift while leaving each product’s route and business logic intact.

**Tech Stack:** TypeScript, Hugo-adjacent shared UI system, React/Vite, Cloudflare Workers, Vitest, CSS, sync/vendor workflow across repos.

---

## File Structure

### Source of truth: `undef-logos`

- `packages/scanlines-system/src/shell/`
  - shared auth/account shell components and shell configuration
- `packages/scanlines-system/src/styles/`
  - shared shell CSS
- `packages/scanlines-system/src/station/`
  - shared mark/ghost geometry if the geometry source lives with the station layer
- `docs/design/specs/2026-06-17-auth-account-shared-shell.md`
  - approved design spec
- `docs/design/plans/2026-06-17-auth-account-shared-shell.md`
  - this implementation plan

### Consumer: `undef-auth`

- `src/ui.ts`
  - should stop owning divergent shell geometry and ghost-mark approximation
- `src/vendor/scanlines-system/`
  - synced shared shell output
- `tests/oidc-routes.test.ts`
  - auth shell contract verification

### Consumer: `undef-account`

- `frontend/src/App.tsx`
  - consumes the shared shell
- `frontend/src/styles.css`
  - should stop owning divergent shell treatment
- `frontend/src/vendor/scanlines-system/`
  - synced shared shell output
- `frontend/src/App.test.tsx`
  - account shell verification

---

### Task 1: Define the exact shared auth/account shell slice in `undef-logos`

**Files:**
- Modify: `packages/scanlines-system/src/shell/*`
- Modify: `packages/scanlines-system/src/styles/*`
- Test: package-level shell tests in `undef-logos`

- [ ] **Step 1: Inspect the existing shared shell/mark implementation and identify the exact mark geometry source**

Run:

```bash
cd /Users/tim/code/gh/undef-games/undef-logos/.worktrees/main-merge
rg -n "mark|brand|ghost|header|shell" packages/scanlines-system/src themes/scanlines -g '*.{ts,tsx,css}'
```

Expected:
- exact files that own the real site shell geometry and mark treatment are identified

- [ ] **Step 2: Write a focused shared-shell contract test**

Add a test in the shared shell package asserting:
- auth shell uses the same mark geometry source as the public shell
- account shell uses the same mark geometry source
- auth/account differ only by surface configuration flags

- [ ] **Step 3: Implement or refactor the shared shell slice so it owns**

Required shared responsibilities:
- header inner rail geometry
- brand mark widget
- exact shared mark geometry
- utility button styling
- auth/account shell width/inset rules

- [ ] **Step 4: Verify the shared shell package locally**

Run the package tests/build that cover the shell slice.

- [ ] **Step 5: Commit**

```bash
git add packages/scanlines-system docs/design/specs docs/design/plans
git commit -m "feat: define shared auth account shell slice"
```

### Task 2: Sync the shared shell slice into `undef-auth`

**Files:**
- Modify: `src/ui.ts`
- Modify/Create: `src/vendor/scanlines-system/*`
- Test: `tests/oidc-routes.test.ts`

- [ ] **Step 1: Add or refresh the vendored shared shell slice from `undef-logos`**

Copy the bounded shared shell output into `undef-auth`’s vendor path.

- [ ] **Step 2: Replace the local auth shell/ghost ownership with the synced slice**

Required outcomes:
- auth header geometry comes from the shared shell slice
- auth back button styling comes from the shared shell slice
- auth ghost mark uses the exact shared mark geometry
- auth keeps its live scanline field enabled

- [ ] **Step 3: Update auth tests to assert the shared shell contract**

Tests should prove:
- shared shell markers are present
- the old hand-drawn auth ghost geometry is gone
- the auth surface still retains the live field markers

- [ ] **Step 4: Verify auth locally**

Run:

```bash
cd /Users/tim/code/gh/undef-games/undef-auth/.worktrees/scanlines-auth-sync
npm run lint
npm run typecheck
npm run test -- tests/oidc-routes.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/ui.ts src/vendor/scanlines-system tests/oidc-routes.test.ts
git commit -m "feat: sync shared shell into auth"
```

### Task 3: Sync the shared shell slice into `undef-account`

**Files:**
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/styles.css`
- Modify/Create: `frontend/src/vendor/scanlines-system/*`
- Test: `frontend/src/App.test.tsx`

- [ ] **Step 1: Add or refresh the vendored shared shell slice from `undef-logos`**

Copy the same bounded shared shell output into `undef-account`.

- [ ] **Step 2: Replace the local account shell treatment with the shared slice**

Required outcomes:
- account header geometry comes from the shared shell slice
- account mark geometry matches auth/public exactly
- account uses the shared theme widgets
- account does **not** enable the animated background field yet

- [ ] **Step 3: Update account tests to assert the shared shell contract**

Tests should prove:
- shared shell markers/styles are present
- account keeps a quiet shell-only treatment
- no background field effect is enabled

- [ ] **Step 4: Verify account locally**

Run the account frontend test/type/build commands already used in this repo.

- [ ] **Step 5: Commit**

```bash
git add frontend/src frontend/src/vendor/scanlines-system
git commit -m "feat: sync shared shell into account"
```

### Task 4: Deploy and verify auth/account staging and production

**Files:**
- No required source changes if prior tasks are complete

- [ ] **Step 1: Deploy auth staging and production**

Run the existing deploy flow for:
- `approach.auth.undef.games`
- `auth.undef.games`

Verify the live HTML/body markers for:
- shared shell inner wrapper
- shared mark geometry markers
- auth live field markers

- [ ] **Step 2: Deploy account staging and production**

Run the existing deploy flow for:
- staging account host
- `account.undef.games`

Verify the live HTML/body markers for:
- shared shell inner wrapper
- shared mark geometry markers
- no animated background field markers

- [ ] **Step 3: Smoke-check visual parity**

Confirm:
- auth and account share the same shell geometry
- auth and account share the same mark geometry
- auth remains animated
- account remains quiet

- [ ] **Step 4: Commit only if deploy-tracking artifacts changed**

If no files changed during deploy, skip this step.

---

## Self-Review

- **Spec coverage:** This plan covers the real source-of-truth fix: shared shell slice in `undef-logos`, synced into both auth and account, exact same geometry/widgets, auth animated and account quiet.
- **Placeholder scan:** No placeholders remain; each task has files, intent, and verification.
- **Type consistency:** The source-of-truth repo owns the shell slice; both consumer repos consume it via the existing sync/vendor model rather than ad hoc local ownership.
