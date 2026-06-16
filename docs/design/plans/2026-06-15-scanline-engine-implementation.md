# Scanline Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a layered scanline engine to the lab so scanlines can use straight, sine, audit, broken, and pulse behaviors with up to 13 stackable layers, while preserving the current baseline preset and theme persistence.

**Architecture:** Keep page-wide scanline textures and existing `graph`/`crt`/`glitch` overlays in CSS, but add a new scanline-engine state model and render waveform behaviors in the Pixi hero scene. Expose a compact `Scanlines` summary plus a dedicated `Scanline engine` editing surface that persists into lab theme state and presets.

**Tech Stack:** React, TypeScript, PixiJS, localStorage-backed theme persistence, Vitest, Playwright.

---

## File Map

### Existing files to modify

- `lab/src/station/effects-config.ts`
  - Extend `EffectsSettings` and preset defaults with scanline engine defaults.
- `lab/src/store/persistence.ts`
  - Persist scanline engine state and migrate existing saved state safely.
- `lab/src/station/effects-style.ts`
  - Surface any new CSS variables needed for scanline UI or legacy texture behavior.
- `lab/src/station/effects-controls.tsx`
  - Add the `Scanline engine` control surface.
- `lab/src/app/app-shell.tsx`
  - Thread scanline engine state through the app shell and update handlers.
- `lab/src/station/station-signal-scene.tsx`
  - Render the new scanline waveform engine in Pixi.
- `tests/e2e/logo-lab.spec.ts`
  - Add end-to-end coverage for the new controls and persisted behavior.

### Existing tests to modify

- `lab/src/store/persistence.test.ts`
  - Add persistence and migration coverage for scanline engine state.
- `lab/src/app/app-shell.test.tsx`
  - Add lab state wiring coverage for scanline engine defaults and updates.
- `lab/src/station/station-signal-scene.test.tsx`
  - Add scene planning and renderer mode coverage for waveform variants.

### New files to create

- `lab/src/station/scanline-engine.ts`
  - Core scanline engine types, defaults, layer helpers, cap enforcement.
- `lab/src/station/scanline-engine.test.ts`
  - Unit tests for layer add/remove/duplicate/reorder/cap behavior.
- `lab/src/station/scanline-engine-controls.tsx`
  - Focused UI for `base pattern`, layer list, and advanced/simple layer editing.
- `lab/src/station/scanline-engine-controls.test.tsx`
  - Unit tests for UI behavior, layer caps, and mixed advanced/simple editing.
- `lab/src/station/scanline-renderer.ts`
  - Pixi waveform planning and drawing helpers, separate from the scene shell.
- `lab/src/station/scanline-renderer.test.ts`
  - Unit tests for waveform planning and deterministic layer output.

## Task 1: Define the scanline engine state model

**Files:**
- Create: `lab/src/station/scanline-engine.ts`
- Test: `lab/src/station/scanline-engine.test.ts`

- [ ] **Step 1: Write the failing unit tests for engine defaults and layer cap**

```ts
import { describe, expect, it } from 'vitest'
import {
  MAX_SCANLINE_ENGINE_LAYERS,
  addScanlineLayer,
  createDefaultScanlineEngine,
  duplicateScanlineLayer,
  removeScanlineLayer,
} from './scanline-engine'

describe('scanline engine', () => {
  it('starts with the baseline carrier and no modulation layers', () => {
    const engine = createDefaultScanlineEngine()
    expect(engine.basePattern).toBe('straight')
    expect(engine.layers).toEqual([])
  })

  it('caps the layer stack at thirteen entries', () => {
    let engine = createDefaultScanlineEngine()
    for (let index = 0; index < MAX_SCANLINE_ENGINE_LAYERS + 2; index += 1) {
      engine = addScanlineLayer(engine, index < 3 ? 'sine' : 'pulse')
    }
    expect(engine.layers).toHaveLength(MAX_SCANLINE_ENGINE_LAYERS)
  })

  it('duplicates and removes a layer by id without mutating the rest of the stack', () => {
    let engine = addScanlineLayer(createDefaultScanlineEngine(), 'audit')
    const originalId = engine.layers[0].id
    engine = duplicateScanlineLayer(engine, originalId)
    expect(engine.layers).toHaveLength(2)
    expect(engine.layers[0].kind).toBe('audit')
    expect(engine.layers[1].kind).toBe('audit')

    engine = removeScanlineLayer(engine, originalId)
    expect(engine.layers).toHaveLength(1)
  })
})
```

- [ ] **Step 2: Run the unit test to verify it fails**

Run:

```bash
cd /Users/tim/code/gh/undef-games/undef-logos/lab
npm run test:run -- src/station/scanline-engine.test.ts
```

Expected: FAIL because `scanline-engine.ts` does not exist yet.

- [ ] **Step 3: Implement the engine types and helpers**

Create `lab/src/station/scanline-engine.ts` with:

```ts
export const MAX_SCANLINE_ENGINE_LAYERS = 13 as const

export type ScanlinePattern = 'straight' | 'sine' | 'audit' | 'broken' | 'pulse'
export type ScanlineBlendMode = 'add' | 'screen' | 'soft-light' | 'difference'

export type ScanlineLayerBase = {
  id: string
  enabled: boolean
  kind: ScanlinePattern
  opacity: number
  speed: number
  amplitude: number
  verticalOffset: number
  phase: number
}

export type AdvancedScanlineLayer = ScanlineLayerBase & {
  role: 'advanced'
  blendMode: ScanlineBlendMode
  spacingInfluence: number
  frequency: number
  thickness: number
  jitter: number
  dashLength: number
  gapLength: number
  stepSharpness: number
  scrollCoupling: number
  pointerCoupling: number
}

export type SupportingScanlineLayer = ScanlineLayerBase & {
  role: 'support'
  intensity: number
}

export type ScanlineLayer = AdvancedScanlineLayer | SupportingScanlineLayer

export type ScanlineEngineState = {
  basePattern: Exclude<ScanlinePattern, 'pulse'>
  layers: ScanlineLayer[]
}
```

Also implement:

- `createDefaultScanlineEngine()`
- `createScanlineLayer(kind, index)`
- `addScanlineLayer(engine, kind)`
- `duplicateScanlineLayer(engine, id)`
- `removeScanlineLayer(engine, id)`
- `moveScanlineLayer(engine, id, direction)`
- `updateScanlineLayer(engine, id, patch)`

Rules:

- layers `0..2` are `role: 'advanced'`
- layers `3..12` are `role: 'support'`
- `pulse` is allowed only as a layer kind, not as `basePattern`
- cap at 13 layers
- all helpers return fresh objects

- [ ] **Step 4: Run the engine unit tests**

Run:

```bash
cd /Users/tim/code/gh/undef-games/undef-logos/lab
npm run test:run -- src/station/scanline-engine.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lab/src/station/scanline-engine.ts lab/src/station/scanline-engine.test.ts
git commit -m "feat: add scanline engine state model"
```

## Task 2: Persist the scanline engine in theme state

**Files:**
- Modify: `lab/src/store/persistence.ts`
- Test: `lab/src/store/persistence.test.ts`
- Read: `lab/src/station/scanline-engine.ts`

- [ ] **Step 1: Write the failing persistence tests**

Add tests like:

```ts
it('creates default theme state with the default scanline engine', () => {
  const theme = createDefaultThemeState()
  expect(theme.scanlineEngine.basePattern).toBe('straight')
  expect(theme.scanlineEngine.layers).toEqual([])
})

it('hydrates saved scanline engine state and falls back safely for older saves', () => {
  const saved = {
    version: 1,
    activeTone: 'dark',
    tones: createDefaultThemeState().tones,
    scanlineLayers: { graph: true, crt: false, glitch: false },
    sectionEffects: createDefaultThemeState().sectionEffects,
    scanlineEngine: {
      basePattern: 'audit',
      layers: [{ id: 'layer-1', enabled: true, kind: 'sine', role: 'advanced', opacity: 1, speed: 1, amplitude: 1, verticalOffset: 0, phase: 0, blendMode: 'screen', spacingInfluence: 1, frequency: 1, thickness: 1, jitter: 0, dashLength: 0, gapLength: 0, stepSharpness: 0.5, scrollCoupling: 1, pointerCoupling: 1 }],
    },
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(saved))
  expect(readThemeState()?.scanlineEngine.basePattern).toBe('audit')
  expect(readThemeState()?.scanlineEngine.layers).toHaveLength(1)
})
```

- [ ] **Step 2: Run the persistence test to verify it fails**

Run:

```bash
cd /Users/tim/code/gh/undef-games/undef-logos/lab
npm run test:run -- src/store/persistence.test.ts
```

Expected: FAIL because `ThemeState` has no `scanlineEngine`.

- [ ] **Step 3: Extend theme persistence and migration**

Update `lab/src/store/persistence.ts` to:

- add `scanlineEngine: ScanlineEngineState` to `ThemeState`
- seed defaults from `createDefaultScanlineEngine()`
- hydrate `scanlineEngine` if present
- safely fall back to defaults when older saved state has no engine
- keep state version unchanged for now, since the migration is additive and tolerant

Use helpers from `scanline-engine.ts` rather than open-coded fallback objects.

- [ ] **Step 4: Run persistence tests**

Run:

```bash
cd /Users/tim/code/gh/undef-games/undef-logos/lab
npm run test:run -- src/store/persistence.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lab/src/store/persistence.ts lab/src/store/persistence.test.ts
git commit -m "feat: persist scanline engine state"
```

## Task 3: Extend effect settings with scanline engine defaults

**Files:**
- Modify: `lab/src/station/effects-config.ts`
- Modify: `lab/src/app/app-shell.tsx`
- Test: `lab/src/app/app-shell.test.tsx`
- Read: `lab/src/station/scanline-engine.ts`

- [ ] **Step 1: Write the failing app shell wiring test**

Add a test like:

```ts
it('updates the scanline engine through the lab shell state', async () => {
  const user = userEvent.setup()
  render(<AppShell />)

  await user.click(screen.getByRole('button', { name: /add scanline layer/i }))
  expect(screen.getByText(/layer 1/i)).toBeInTheDocument()
})
```

- [ ] **Step 2: Run the shell test to verify it fails**

Run:

```bash
cd /Users/tim/code/gh/undef-games/undef-logos/lab
npm run test:run -- src/app/app-shell.test.tsx
```

Expected: FAIL because the scanline engine controls do not exist yet.

- [ ] **Step 3: Thread scanline engine state through the shell**

Update:

- `EffectsSettings` only for legacy scanline/global controls
- keep `scanlineEngine` separate from `EffectsSettings`
- `AppShell` should read `themeState.scanlineEngine`
- add handlers:
  - `updateScanlineBasePattern`
  - `addScanlineEngineLayer`
  - `duplicateScanlineEngineLayer`
  - `removeScanlineEngineLayer`
  - `moveScanlineEngineLayer`
  - `updateScanlineEngineLayer`

Do not overload `onChange` in `effects-controls.tsx` with engine-layer patches. Keep the new engine API explicit.

- [ ] **Step 4: Re-run the shell tests**

Run:

```bash
cd /Users/tim/code/gh/undef-games/undef-logos/lab
npm run test:run -- src/app/app-shell.test.tsx
```

Expected: still partially failing until Task 4 adds UI, but the shell compiles and new handlers are in place.

- [ ] **Step 5: Commit**

```bash
git add lab/src/station/effects-config.ts lab/src/app/app-shell.tsx lab/src/app/app-shell.test.tsx
git commit -m "refactor: wire scanline engine through app shell"
```

## Task 4: Build the scanline engine controls

**Files:**
- Create: `lab/src/station/scanline-engine-controls.tsx`
- Test: `lab/src/station/scanline-engine-controls.test.tsx`
- Modify: `lab/src/station/effects-controls.tsx`
- Modify: `lab/src/styles/controls.css`

- [ ] **Step 1: Write the failing UI tests**

Create tests that prove:

- base pattern selector renders
- add layer button stops at 13
- first three layers show advanced controls
- later layers show support controls

Example:

```ts
it('renders advanced controls only for the first three layers', () => {
  const engine = {
    basePattern: 'straight',
    layers: Array.from({ length: 4 }, (_, index) => createScanlineLayer(index < 3 ? 'sine' : 'pulse', index)),
  }

  render(<ScanlineEngineControls engine={engine} ...handlers />)

  expect(screen.getAllByText(/blend mode/i)).toHaveLength(3)
  expect(screen.getAllByText(/intensity/i).length).toBeGreaterThan(0)
})
```

- [ ] **Step 2: Run the UI tests to verify they fail**

Run:

```bash
cd /Users/tim/code/gh/undef-games/undef-logos/lab
npm run test:run -- src/station/scanline-engine-controls.test.tsx
```

Expected: FAIL because the control component does not exist yet.

- [ ] **Step 3: Implement `ScanlineEngineControls`**

Create a dedicated component that renders:

- section title: `Scanline engine`
- `Base pattern` select
- layer count indicator
- `Add layer` button
- ordered layer rows
- per-row actions: duplicate, mute, delete, move up, move down
- expanded advanced controls for layers 1-3
- compact support controls for layers 4-13

Then mount it from `effects-controls.tsx` below the existing `Scanlines` group.

Keep the existing `Scanlines` group intact for the coarse controls.

- [ ] **Step 4: Add focused styles**

Extend `lab/src/styles/controls.css` with:

- `.scanline-engine-controls`
- `.scanline-layer-list`
- `.scanline-layer-row`
- `.scanline-layer-row--advanced`
- `.scanline-layer-row--support`
- `.scanline-layer-actions`
- `.scanline-layer-grid`

Do not merge this into unrelated control styles if a split is warranted. If the block grows too large, extract to `lab/src/styles/scanline-engine-controls.css` and import it from `app.css`.

- [ ] **Step 5: Run the UI and shell tests**

Run:

```bash
cd /Users/tim/code/gh/undef-games/undef-logos/lab
npm run test:run -- src/station/scanline-engine-controls.test.tsx src/app/app-shell.test.tsx
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lab/src/station/scanline-engine-controls.tsx lab/src/station/scanline-engine-controls.test.tsx lab/src/station/effects-controls.tsx lab/src/styles/controls.css
git commit -m "feat: add scanline engine controls"
```

## Task 5: Extract waveform planning and rendering helpers

**Files:**
- Create: `lab/src/station/scanline-renderer.ts`
- Test: `lab/src/station/scanline-renderer.test.ts`
- Modify: `lab/src/station/station-signal-scene.tsx`
- Modify: `lab/src/station/station-signal-scene.test.tsx`

- [ ] **Step 1: Write the failing renderer tests**

Create tests for deterministic planning helpers, for example:

```ts
it('creates distinct y-displacement plans for straight sine audit and broken patterns', () => {
  const engine = createDefaultScanlineEngine()
  const straight = buildScanlineFrame({ ...engine, basePattern: 'straight' }, seed)
  const sine = buildScanlineFrame({ ...engine, basePattern: 'sine' }, seed)
  const audit = buildScanlineFrame({ ...engine, basePattern: 'audit' }, seed)
  const broken = buildScanlineFrame({ ...engine, basePattern: 'broken' }, seed)

  expect(sine.traces).not.toEqual(straight.traces)
  expect(audit.traces).not.toEqual(sine.traces)
  expect(broken.traces).not.toEqual(audit.traces)
})
```

- [ ] **Step 2: Run the renderer tests to verify they fail**

Run:

```bash
cd /Users/tim/code/gh/undef-games/undef-logos/lab
npm run test:run -- src/station/scanline-renderer.test.ts
```

Expected: FAIL because the renderer module does not exist yet.

- [ ] **Step 3: Implement scanline planning helpers**

Create `scanline-renderer.ts` with pure helpers:

- `buildScanlineFrame(...)`
- `buildBasePatternTraces(...)`
- `buildLayerTraces(...)`
- `sampleStraightTrace(...)`
- `sampleSineTrace(...)`
- `sampleAuditTrace(...)`
- `sampleBrokenTrace(...)`
- `samplePulseTrace(...)`

The helpers should return trace segments or sampled points, not draw directly.

- [ ] **Step 4: Move Pixi drawing to the helper-backed renderer**

Update `station-signal-scene.tsx` so the scene shell keeps:

- Pixi mount/unmount
- pointer tracking
- resize
- ticker hookup

but `drawSignalField` delegates waveform planning to `scanline-renderer.ts`.

Keep existing scan/noise/sweep background behavior unless directly replaced by the new trace output.

- [ ] **Step 5: Run the renderer and scene tests**

Run:

```bash
cd /Users/tim/code/gh/undef-games/undef-logos/lab
npm run test:run -- src/station/scanline-renderer.test.ts src/station/station-signal-scene.test.tsx
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lab/src/station/scanline-renderer.ts lab/src/station/scanline-renderer.test.ts lab/src/station/station-signal-scene.tsx lab/src/station/station-signal-scene.test.tsx
git commit -m "feat: render layered scanline waveforms"
```

## Task 6: Connect engine state to Pixi rendering

**Files:**
- Modify: `lab/src/app/app-shell.tsx`
- Modify: `lab/src/station/station-signal-scene.tsx`
- Test: `lab/src/app/app-shell.test.tsx`

- [ ] **Step 1: Write the failing integration test**

Add a test proving the scene receives engine state:

```ts
it('passes the persisted scanline engine into the station signal scene', () => {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
    ...createDefaultThemeState(),
    scanlineEngine: {
      basePattern: 'audit',
      layers: [],
    },
  }))

  render(<AppShell />)
  expect(screen.getByLabelText(/interactive station signal/i)).toHaveAttribute('data-scanline-base-pattern', 'audit')
})
```

- [ ] **Step 2: Run the integration test to verify it fails**

Run:

```bash
cd /Users/tim/code/gh/undef-games/undef-logos/lab
npm run test:run -- src/app/app-shell.test.tsx
```

Expected: FAIL because the scene does not expose engine metadata yet.

- [ ] **Step 3: Pass engine state into the scene**

Update `StationSignalScene` props to accept:

- `scanlineEngine: ScanlineEngineState`

Expose debug attributes such as:

- `data-scanline-base-pattern`
- `data-scanline-layer-count`

This gives tests a stable handle without asserting Pixi internals.

- [ ] **Step 4: Run the integration test**

Run:

```bash
cd /Users/tim/code/gh/undef-games/undef-logos/lab
npm run test:run -- src/app/app-shell.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lab/src/app/app-shell.tsx lab/src/station/station-signal-scene.tsx lab/src/app/app-shell.test.tsx
git commit -m "feat: connect scanline engine to station scene"
```

## Task 7: Expand Playwright coverage for scanline engine behavior

**Files:**
- Modify: `tests/e2e/logo-lab.spec.ts`

- [ ] **Step 1: Write the failing Playwright tests**

Add focused tests for:

- adding layers up to the cap
- switching base pattern from straight to sine to audit to broken
- persisting the engine after reload
- restoring the baseline preset

Example skeleton:

```ts
test('caps scanline engine layers at thirteen and persists the stack', async ({ page }) => {
  await page.goto('/lab/')
  const addLayer = page.getByRole('button', { name: /add scanline layer/i })

  for (let index = 0; index < 13; index += 1) {
    await addLayer.click()
  }

  await expect(page.getByText(/13 layers/i)).toBeVisible()
  await expect(addLayer).toBeDisabled()

  await page.reload()
  await expect(page.getByText(/13 layers/i)).toBeVisible()
})
```

- [ ] **Step 2: Run the Playwright test to verify it fails**

Run:

```bash
cd /Users/tim/code/gh/undef-games/undef-logos
./node_modules/.bin/playwright test tests/e2e/logo-lab.spec.ts -g "scanline engine"
```

Expected: FAIL because the UI and state wiring are not complete yet.

- [ ] **Step 3: Implement any missing accessibility hooks**

Before rerunning, make sure the UI has stable labels such as:

- `Base pattern`
- `Add scanline layer`
- `Layer 1`
- `Layer 2`
- `Layer 13`

and stable select labels for layer kind and layer parameters.

- [ ] **Step 4: Run the focused Playwright tests**

Run:

```bash
cd /Users/tim/code/gh/undef-games/undef-logos
./node_modules/.bin/playwright test tests/e2e/logo-lab.spec.ts -g "scanline engine"
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add tests/e2e/logo-lab.spec.ts
git commit -m "test: cover scanline engine controls"
```

## Task 8: Verify full regression coverage

**Files:**
- No new files

- [ ] **Step 1: Run typecheck**

```bash
cd /Users/tim/code/gh/undef-games/undef-logos
make typecheck
```

Expected: PASS.

- [ ] **Step 2: Run unit tests**

```bash
cd /Users/tim/code/gh/undef-games/undef-logos
make test
```

Expected: PASS.

- [ ] **Step 3: Run end-to-end tests**

```bash
cd /Users/tim/code/gh/undef-games/undef-logos
make e2e
```

Expected: PASS.

- [ ] **Step 4: Commit final verification-only follow-ups if needed**

```bash
git add -A
git commit -m "fix: finish scanline engine integration"
```

Only create this commit if verification exposes a real issue that required code changes.

## Spec Coverage Check

- Hybrid architecture: covered by Tasks 5 and 6.
- Base pattern plus 13 layers: covered by Tasks 1, 2, 4, and 7.
- Mixed advanced/support layer editing: covered by Task 4.
- Persistence and preset safety: covered by Tasks 2 and 7.
- Pixi waveform rendering for straight, sine, audit, broken, pulse: covered by Task 5.
- Scroll/pointer coupling and smoothness: covered by Tasks 5 and 6, with regression coverage in Task 8.

No uncovered spec sections remain.
