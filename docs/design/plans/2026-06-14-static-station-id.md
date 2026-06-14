# Static Station ID Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the multi-prototype logo lab with one strong interactive broadcast station identity.

**Architecture:** A pure `station-state` module derives signal strength, status labels, and specimen visibility. `AppShell` owns the state and composes the PixiJS signal field, tuning controls, and flat identity specimens. The old concept prototype files may remain in source temporarily, but the rendered app and tests move to the station identity.

**Tech Stack:** React 19, Vite 8, TypeScript, PixiJS, Vitest, Testing Library, Playwright.

---

### Task 1: Station State

**Files:**
- Create: `src/station/station-state.ts`
- Create: `src/station/station-state.test.ts`

- [ ] Write tests for `createStationState`, `tuneSignal`, `detuneSignal`, `resetSignal`, and `getStationStatus`.
- [ ] Implement clamped signal strength and derived statuses: `NO SIGNAL`, `SEARCHING`, `SYNCING`, `LOCKED`.
- [ ] Run `npm run test:run -- src/station/station-state.test.ts`.

### Task 2: App Shell Replacement

**Files:**
- Modify: `src/app/app-shell.tsx`
- Modify: `src/app/app-shell.test.tsx`
- Create: `src/station/station-identity.tsx`
- Create: `src/station/station-controls.tsx`

- [ ] Test that the app renders `NO SIGNAL`, tunes to `LOCKED`, detunes, resets, and shows the station lockup.
- [ ] Replace concept rail/prototype panels with one broadcast layout.
- [ ] Run `npm run test:run -- src/app/app-shell.test.tsx`.

### Task 3: PixiJS Signal Scene

**Files:**
- Create: `src/station/station-signal-scene.tsx`
- Modify: `src/scene/logo-lab-scene.test.tsx`

- [ ] Render a PixiJS canvas region labeled `interactive station signal`.
- [ ] Draw animated scan planes and tuning bars from signal strength.
- [ ] Run `npm run test:run -- src/scene/logo-lab-scene.test.tsx`.

### Task 4: Visual System And E2E

**Files:**
- Modify: `src/styles/app.css`
- Modify: `tests/e2e/logo-lab.spec.ts`

- [ ] Restyle the app as a full-bleed station broadcast surface.
- [ ] Update E2E to tune the station to `LOCKED` and verify mobile overflow.
- [ ] Run `npm run typecheck`, `npm run test:run`, `npm run build`, `npm run e2e`, and rendered browser QA.
