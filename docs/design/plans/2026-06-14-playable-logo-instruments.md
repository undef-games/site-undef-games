# Playable Logo Instruments Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the three logo prototypes into playable instruments where user actions generate the logo state.

**Architecture:** A pure play-state module owns progress and phase derivation. `AppShell` holds that state and passes concept-specific handlers into the scene, specimen, and controls. Three.js renders from progress rather than a generic click counter.

**Tech Stack:** React, TypeScript, Vite, Three.js, React Three Fiber, Vitest, Testing Library, Playwright.

---

### Task 1: Play-State Reducer

**Files:**
- Create: `src/logo/logo-play-state.ts`
- Test: `src/logo/logo-play-state.test.ts`

- [ ] Add tests proving rule, command, and board progress derive correct phases.
- [ ] Implement `createInitialLogoPlayState`, `advanceConcept`, `submitConsoleCommand`, `resetConcept`, `getConceptProgress`, and `getConceptPhase`.
- [ ] Run `npm run test:run -- src/logo/logo-play-state.test.ts`.

### Task 2: React Interaction Loops

**Files:**
- Modify: `src/app/app-shell.tsx`
- Modify: `src/ui/control-panel.tsx`
- Test: `src/app/app-shell.test.tsx`

- [ ] Add tests that click visible controls for all three concepts and observe progress text.
- [ ] Wire `AppShell` to the reducer and preserve progress across concept switches.
- [ ] Replace generic phase controls with concept-specific controls.
- [ ] Run `npm run test:run -- src/app/app-shell.test.tsx`.

### Task 3: Logo And Scene Rendering

**Files:**
- Modify: `src/scene/logo-lab-scene.tsx`
- Modify: `src/logo/logo-mark.tsx`
- Modify: `src/logo/logo-wordmark.tsx`
- Modify: `src/logo/resolved-logo-panel.tsx`
- Test: `src/scene/logo-lab-scene.test.tsx`

- [ ] Render marks and Three.js scenes from progress and command/board state.
- [ ] Keep scene click/tap as the fast path for the active concept.
- [ ] Run `npm run test:run -- src/scene/logo-lab-scene.test.tsx`.

### Task 4: Visual Layout And E2E

**Files:**
- Modify: `src/styles/app.css`
- Modify: `tests/e2e/logo-lab.spec.ts`

- [ ] Make the canvas the dominant workspace and reduce panel noise.
- [ ] Update E2E for the new interaction loops and mobile smoke.
- [ ] Run `npm run typecheck`, `npm run test:run`, `npm run build`, and rendered browser QA.
