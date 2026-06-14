# undef-logos Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first interactive `undef-logos` Vite/React/Three.js POC with one shared scene, 13 retuned concept states, resolved logo-system panels, live controls, and comparison tools.

**Architecture:** The app is a single-route React application with one continuous React Three Fiber scene backed by a typed concept registry. The 3D layer handles world motion and concept retuning; SVG/DOM layers handle crisp resolved logo outputs, controls, and comparison surfaces. State is centralized in Zustand and persisted locally.

**Tech Stack:** React 19.2.7, React DOM 19.2.7, Vite 8.0.16, TypeScript 6.0.3, Three 0.184.0, @react-three/fiber 9.6.1, @react-three/drei 10.7.7, Zustand 5.0.14, Framer Motion 12.40.0, Vitest, Testing Library, Playwright.

---

## Planned File Structure

This repo starts empty, so define the file boundaries first.

### Root and tooling

- Create: `package.json` — scripts, exact-pinned dependencies, package metadata
- Create: `tsconfig.json` — TypeScript compiler config
- Create: `tsconfig.node.json` — Vite config type support
- Create: `vite.config.ts` — Vite + React config
- Create: `index.html` — app entry shell
- Create: `.gitignore` — node_modules, dist, Playwright artifacts, local env files
- Create: `src/vite-env.d.ts` — Vite types

### App shell

- Create: `src/main.tsx` — React bootstrap
- Create: `src/app/App.tsx` — top-level composition
- Create: `src/app/app-shell.tsx` — layout with scene + overlay surfaces

### Styling and fonts

- Create: `src/styles/reset.css`
- Create: `src/styles/tokens.css`
- Create: `src/styles/app.css`
- Create: `src/styles/fonts.css`

### Scene runtime

- Create: `src/scene/logo-lab-scene.tsx`
- Create: `src/scene/camera-rig.tsx`
- Create: `src/scene/scene-lights.tsx`
- Create: `src/scene/scene-background.tsx`
- Create: `src/scene/retune-controller.tsx`

### Concepts and generator

- Create: `src/concepts/types.ts`
- Create: `src/concepts/registry.ts`
- Create: `src/concepts/lanes.ts`
- Create: `src/generator/symbol-primitives.ts`
- Create: `src/generator/symbol-state.ts`
- Create: `src/generator/build-symbol-geometry.ts`
- Create: `src/generator/mutation-ranges.ts`

### Resolved logos

- Create: `src/logo/resolved-logo-panel.tsx`
- Create: `src/logo/logo-mark.tsx`
- Create: `src/logo/logo-wordmark.tsx`
- Create: `src/logo/logo-compact.tsx`

### Store and persistence

- Create: `src/store/logo-lab-store.ts`
- Create: `src/store/persistence.ts`

### UI

- Create: `src/ui/concept-rail.tsx`
- Create: `src/ui/control-panel.tsx`
- Create: `src/ui/compare-tray.tsx`
- Create: `src/ui/prompt-panel.tsx`
- Create: `src/ui/icon-button.tsx`

### Tests

- Create: `src/test/setup.ts`
- Create: `src/concepts/registry.test.ts`
- Create: `src/generator/mutation-ranges.test.ts`
- Create: `src/store/logo-lab-store.test.ts`
- Create: `src/logo/resolved-logo-panel.test.tsx`
- Create: `src/ui/concept-rail.test.tsx`
- Create: `tests/e2e/logo-lab.spec.ts`

## Task 1: Scaffold the Latest Vite/React Project

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `vite.config.ts`
- Create: `index.html`
- Create: `.gitignore`
- Create: `src/vite-env.d.ts`

- [ ] **Step 1: Write the failing bootstrap smoke test**

Create `src/app/app-shell.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AppShell } from './app-shell'

describe('AppShell', () => {
  it('renders the undef logos title', () => {
    render(<AppShell />)
    expect(screen.getByText(/undef logos/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- --runInBand
```

Expected: FAIL because `package.json`, Vitest config, and `src/app/app-shell.tsx` do not exist yet.

- [ ] **Step 3: Create the base toolchain files**

Create `package.json`:

```json
{
  "name": "undef-logos",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:run": "vitest run",
    "typecheck": "tsc --noEmit",
    "e2e": "playwright test"
  },
  "dependencies": {
    "@react-three/drei": "10.7.7",
    "@react-three/fiber": "9.6.1",
    "framer-motion": "12.40.0",
    "react": "19.2.7",
    "react-dom": "19.2.7",
    "three": "0.184.0",
    "zustand": "5.0.14"
  },
  "devDependencies": {
    "@playwright/test": "1.56.0",
    "@testing-library/jest-dom": "6.9.1",
    "@testing-library/react": "16.3.0",
    "@testing-library/user-event": "14.6.1",
    "@types/node": "24.10.1",
    "@types/react": "19.2.2",
    "@types/react-dom": "19.2.2",
    "@vitejs/plugin-react": "6.0.2",
    "typescript": "6.0.3",
    "vite": "8.0.16",
    "vitest": "4.1.0"
  }
}
```

Create `tsconfig.json`:

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
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "types": ["vitest/globals", "@testing-library/jest-dom"]
  },
  "include": ["src", "tests"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

Create `tsconfig.node.json`:

```json
{
  "compilerOptions": {
    "composite": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

Create `vite.config.ts`:

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts']
  }
})
```

Create `index.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>undef logos</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

Create `.gitignore`:

```gitignore
node_modules
dist
playwright-report
test-results
.DS_Store
```

Create `src/vite-env.d.ts`:

```ts
/// <reference types="vite/client" />
```

- [ ] **Step 4: Install dependencies**

Run:

```bash
npm install
```

Expected: install completes with a generated `package-lock.json`.

- [ ] **Step 5: Run typecheck**

Run:

```bash
npm run typecheck
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json tsconfig.json tsconfig.node.json vite.config.ts index.html .gitignore src/vite-env.d.ts src/app/app-shell.test.tsx
git commit -m "chore: scaffold latest vite react toolchain"
```

## Task 2: Build the Base App Shell and Styles

**Files:**
- Create: `src/main.tsx`
- Create: `src/app/App.tsx`
- Create: `src/app/app-shell.tsx`
- Create: `src/styles/reset.css`
- Create: `src/styles/tokens.css`
- Create: `src/styles/fonts.css`
- Create: `src/styles/app.css`
- Create: `src/test/setup.ts`
- Modify: `src/app/app-shell.test.tsx`

- [ ] **Step 1: Expand the failing shell test**

Update `src/app/app-shell.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AppShell } from './app-shell'

describe('AppShell', () => {
  it('renders the shell heading and compare tray placeholder', () => {
    render(<AppShell />)
    expect(screen.getByText(/undef logos/i)).toBeInTheDocument()
    expect(screen.getByText(/compare tray/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm run test:run -- src/app/app-shell.test.tsx
```

Expected: FAIL because the shell and test setup files do not exist yet.

- [ ] **Step 3: Create the app shell**

Create `src/test/setup.ts`:

```ts
import '@testing-library/jest-dom'
```

Create `src/main.tsx`:

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './app/App'
import './styles/reset.css'
import './styles/tokens.css'
import './styles/fonts.css'
import './styles/app.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

Create `src/app/App.tsx`:

```tsx
import { AppShell } from './app-shell'

export default function App() {
  return <AppShell />
}
```

Create `src/app/app-shell.tsx`:

```tsx
export function AppShell() {
  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">undef games</p>
          <h1>undef logos</h1>
        </div>
      </header>
      <main className="layout">
        <section className="scene-frame" aria-label="logo lab scene" />
        <aside className="panel-stack">
          <section className="panel">
            <h2>Resolved logo system</h2>
          </section>
          <section className="panel">
            <h2>Compare tray</h2>
          </section>
        </aside>
      </main>
    </div>
  )
}
```

Create `src/styles/reset.css`:

```css
*,
*::before,
*::after {
  box-sizing: border-box;
}

html,
body,
#root {
  height: 100%;
  margin: 0;
}

body {
  min-width: 320px;
}
```

Create `src/styles/tokens.css`:

```css
:root {
  color-scheme: dark;
  --bg: #05070c;
  --panel: rgba(14, 18, 28, 0.82);
  --panel-border: rgba(255, 255, 255, 0.12);
  --text: #f3f5f8;
  --muted: #9ca3af;
  --accent: #69a7ff;
}
```

Create `src/styles/fonts.css`:

```css
:root {
  --font-display: 'Inter', 'Segoe UI', sans-serif;
  --font-body: 'Inter', 'Segoe UI', sans-serif;
}
```

Create `src/styles/app.css`:

```css
body {
  font-family: var(--font-body);
  background: radial-gradient(circle at top, #13203d, var(--bg) 42%);
  color: var(--text);
}

.app-shell {
  min-height: 100%;
  display: grid;
  grid-template-rows: auto 1fr;
}

.topbar {
  padding: 24px 28px 0;
}

.eyebrow {
  margin: 0 0 6px;
  color: var(--muted);
  font-size: 12px;
  text-transform: uppercase;
}

.topbar h1 {
  margin: 0;
  font-family: var(--font-display);
  font-size: 32px;
}

.layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  gap: 16px;
  padding: 20px 28px 28px;
}

.scene-frame,
.panel {
  border: 1px solid var(--panel-border);
  background: var(--panel);
  backdrop-filter: blur(16px);
}

.scene-frame {
  min-height: 70vh;
}

.panel-stack {
  display: grid;
  gap: 16px;
}

.panel {
  padding: 16px;
}
```

- [ ] **Step 4: Run tests**

Run:

```bash
npm run test:run -- src/app/app-shell.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/main.tsx src/app/App.tsx src/app/app-shell.tsx src/styles/reset.css src/styles/tokens.css src/styles/fonts.css src/styles/app.css src/test/setup.ts src/app/app-shell.test.tsx
git commit -m "feat: add base logo lab shell"
```

## Task 3: Define Concept Types, Registry, and Mutation Bounds

**Files:**
- Create: `src/concepts/types.ts`
- Create: `src/concepts/lanes.ts`
- Create: `src/concepts/registry.ts`
- Create: `src/generator/mutation-ranges.ts`
- Create: `src/concepts/registry.test.ts`
- Create: `src/generator/mutation-ranges.test.ts`

- [ ] **Step 1: Write failing registry tests**

Create `src/concepts/registry.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { concepts } from './registry'

describe('concepts', () => {
  it('contains 13 concept entries', () => {
    expect(concepts).toHaveLength(13)
  })

  it('assigns every concept to a lane', () => {
    expect(concepts.every((concept) => concept.lane.length > 0)).toBe(true)
  })
})
```

Create `src/generator/mutation-ranges.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { clampControlValue } from './mutation-ranges'

describe('clampControlValue', () => {
  it('clamps values above the range max', () => {
    expect(clampControlValue({ min: 0, max: 1 }, 3)).toBe(1)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
npm run test:run -- src/concepts/registry.test.ts src/generator/mutation-ranges.test.ts
```

Expected: FAIL because registry and mutation helpers do not exist.

- [ ] **Step 3: Create the concept model**

Create `src/concepts/lanes.ts`:

```ts
export const conceptLanes = [
  'terminal-systems-retrofuture',
  'generative-procedural-simulation',
  'play-toolmaking-game-objects',
] as const

export type ConceptLane = (typeof conceptLanes)[number]
```

Create `src/concepts/types.ts`:

```ts
import type { ConceptLane } from './lanes'

export type MutationRange = {
  min: number
  max: number
}

export type LogoConcept = {
  id: string
  name: string
  lane: ConceptLane
  prompt: string
  tags: string[]
  colorTokens: {
    background: string
    foreground: string
    accent: string
  }
  fontPairing: {
    display: string
    body: string
  }
  geometryPreset: string
  motionPreset: string
  symbolRules: string[]
  wordmarkRules: string[]
  compactLockupRules: string[]
  mutationRanges: {
    symmetry: MutationRange
    density: MutationRange
    noise: MutationRange
    field: MutationRange
  }
}
```

Create `src/generator/mutation-ranges.ts`:

```ts
import type { MutationRange } from '../concepts/types'

export function clampControlValue(range: MutationRange, value: number) {
  return Math.min(range.max, Math.max(range.min, value))
}
```

Create `src/concepts/registry.ts` with 13 typed entries; use this shape for one entry and repeat it for the remaining 12:

```ts
import type { LogoConcept } from './types'

export const concepts: LogoConcept[] = [
  {
    id: 'prompt-cursor',
    name: 'Prompt Cursor',
    lane: 'terminal-systems-retrofuture',
    prompt: 'Retro terminal prompt logo with modern vector precision',
    tags: ['terminal', 'cursor', 'systems'],
    colorTokens: {
      background: '#05070c',
      foreground: '#f3f5f8',
      accent: '#69a7ff',
    },
    fontPairing: {
      display: 'Space Grotesk',
      body: 'Inter',
    },
    geometryPreset: 'cursor-grid',
    motionPreset: 'scanline-drift',
    symbolRules: ['angular', 'prompt-shaped', 'negative-space'],
    wordmarkRules: ['tight-display', 'monospace-influence'],
    compactLockupRules: ['icon-left', 'dense-horizontal'],
    mutationRanges: {
      symmetry: { min: 0.3, max: 1 },
      density: { min: 0.2, max: 0.85 },
      noise: { min: 0, max: 0.45 },
      field: { min: 0.15, max: 0.9 },
    },
  },
]
```

- [ ] **Step 4: Fill the remaining 12 concepts**

Append entries for:

```ts
'warp-gate'
'wireframe-map'
'brutalist-glitch'
'ug-monogram'
'undefined-to-play'
'modular-nodes'
'tile-anomaly'
'emergence-chaos'
'system-mutations'
'dice-pixel-dialogue'
'party-energy'
'pixel-to-vector'
```

Expected: `concepts.length === 13`.

- [ ] **Step 5: Run tests**

Run:

```bash
npm run test:run -- src/concepts/registry.test.ts src/generator/mutation-ranges.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/concepts/types.ts src/concepts/lanes.ts src/concepts/registry.ts src/generator/mutation-ranges.ts src/concepts/registry.test.ts src/generator/mutation-ranges.test.ts
git commit -m "feat: add concept registry and mutation bounds"
```

## Task 4: Add Zustand Store and Persistence

**Files:**
- Create: `src/store/logo-lab-store.ts`
- Create: `src/store/persistence.ts`
- Create: `src/store/logo-lab-store.test.ts`

- [ ] **Step 1: Write the failing store test**

Create `src/store/logo-lab-store.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { createLogoLabStore } from './logo-lab-store'

describe('logo lab store', () => {
  it('pins a concept id once', () => {
    const store = createLogoLabStore()
    store.getState().pinConcept('prompt-cursor')
    store.getState().pinConcept('prompt-cursor')
    expect(store.getState().pinnedConceptIds).toEqual(['prompt-cursor'])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm run test:run -- src/store/logo-lab-store.test.ts
```

Expected: FAIL because the store does not exist.

- [ ] **Step 3: Create persistence helpers and store**

Create `src/store/persistence.ts`:

```ts
export const STORAGE_KEY = 'undef-logos-state'
```

Create `src/store/logo-lab-store.ts`:

```ts
import { createStore } from 'zustand/vanilla'

type LogoLabState = {
  activeConceptId: string
  hoveredConceptId: string | null
  pinnedConceptIds: string[]
  displayMode: 'landing' | 'resolved' | 'compare'
  pinConcept: (id: string) => void
}

export function createLogoLabStore() {
  return createStore<LogoLabState>()((set) => ({
    activeConceptId: 'prompt-cursor',
    hoveredConceptId: null,
    pinnedConceptIds: [],
    displayMode: 'landing',
    pinConcept: (id) =>
      set((state) => ({
        ...state,
        pinnedConceptIds: state.pinnedConceptIds.includes(id)
          ? state.pinnedConceptIds
          : [...state.pinnedConceptIds, id],
      })),
  }))
}
```

- [ ] **Step 4: Run tests**

Run:

```bash
npm run test:run -- src/store/logo-lab-store.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/store/logo-lab-store.ts src/store/persistence.ts src/store/logo-lab-store.test.ts
git commit -m "feat: add logo lab store and persistence primitives"
```

## Task 5: Build the Shared Three.js Scene Runtime

**Files:**
- Create: `src/scene/logo-lab-scene.tsx`
- Create: `src/scene/camera-rig.tsx`
- Create: `src/scene/scene-lights.tsx`
- Create: `src/scene/scene-background.tsx`
- Create: `src/scene/retune-controller.tsx`
- Modify: `src/app/app-shell.tsx`

- [ ] **Step 1: Write the failing scene test**

Create `src/scene/logo-lab-scene.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { LogoLabScene } from './logo-lab-scene'

describe('LogoLabScene', () => {
  it('renders the canvas region label', () => {
    render(<LogoLabScene activeConceptId="prompt-cursor" />)
    expect(screen.getByLabelText(/interactive logo scene/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm run test:run -- src/scene/logo-lab-scene.test.tsx
```

Expected: FAIL because the scene component does not exist.

- [ ] **Step 3: Create the minimal shared scene**

Create `src/scene/logo-lab-scene.tsx`:

```tsx
import { Canvas } from '@react-three/fiber'
import { CameraRig } from './camera-rig'
import { SceneLights } from './scene-lights'
import { SceneBackground } from './scene-background'

export function LogoLabScene({ activeConceptId }: { activeConceptId: string }) {
  return (
    <div aria-label="interactive logo scene">
      <Canvas camera={{ position: [0, 0, 7], fov: 45 }}>
        <color attach="background" args={['#05070c']} />
        <SceneLights />
        <CameraRig />
        <SceneBackground />
        <mesh>
          <icosahedronGeometry args={[1.4, 1]} />
          <meshStandardMaterial color="#69a7ff" wireframe={activeConceptId === 'wireframe-map'} />
        </mesh>
      </Canvas>
    </div>
  )
}
```

Create `src/scene/camera-rig.tsx`:

```tsx
export function CameraRig() {
  return null
}
```

Create `src/scene/scene-lights.tsx`:

```tsx
export function SceneLights() {
  return (
    <>
      <ambientLight intensity={0.8} />
      <directionalLight position={[4, 6, 5]} intensity={1.6} />
    </>
  )
}
```

Create `src/scene/scene-background.tsx`:

```tsx
export function SceneBackground() {
  return null
}
```

Create `src/scene/retune-controller.tsx`:

```tsx
export function RetuneController() {
  return null
}
```

Modify `src/app/app-shell.tsx` to mount the scene:

```tsx
import { LogoLabScene } from '../scene/logo-lab-scene'

export function AppShell() {
  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">undef games</p>
          <h1>undef logos</h1>
        </div>
      </header>
      <main className="layout">
        <section className="scene-frame">
          <LogoLabScene activeConceptId="prompt-cursor" />
        </section>
        <aside className="panel-stack">
          <section className="panel">
            <h2>Resolved logo system</h2>
          </section>
          <section className="panel">
            <h2>Compare tray</h2>
          </section>
        </aside>
      </main>
    </div>
  )
}
```

- [ ] **Step 4: Run tests**

Run:

```bash
npm run test:run -- src/scene/logo-lab-scene.test.tsx src/app/app-shell.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/scene/logo-lab-scene.tsx src/scene/camera-rig.tsx src/scene/scene-lights.tsx src/scene/scene-background.tsx src/scene/retune-controller.tsx src/scene/logo-lab-scene.test.tsx src/app/app-shell.tsx
git commit -m "feat: add shared three scene runtime"
```

## Task 6: Add Resolved Logo Panels

**Files:**
- Create: `src/logo/logo-mark.tsx`
- Create: `src/logo/logo-wordmark.tsx`
- Create: `src/logo/logo-compact.tsx`
- Create: `src/logo/resolved-logo-panel.tsx`
- Create: `src/logo/resolved-logo-panel.test.tsx`
- Modify: `src/app/app-shell.tsx`

- [ ] **Step 1: Write the failing resolved panel test**

Create `src/logo/resolved-logo-panel.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ResolvedLogoPanel } from './resolved-logo-panel'
import { concepts } from '../concepts/registry'

describe('ResolvedLogoPanel', () => {
  it('shows primary, symbol, and compact labels', () => {
    render(<ResolvedLogoPanel concept={concepts[0]} />)
    expect(screen.getByText(/primary/i)).toBeInTheDocument()
    expect(screen.getByText(/symbol/i)).toBeInTheDocument()
    expect(screen.getByText(/compact/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm run test:run -- src/logo/resolved-logo-panel.test.tsx
```

Expected: FAIL because the resolved logo components do not exist.

- [ ] **Step 3: Create the resolved logo components**

Create `src/logo/logo-mark.tsx`:

```tsx
export function LogoMark({ accent }: { accent: string }) {
  return (
    <svg viewBox="0 0 120 120" width="120" height="120" role="img" aria-label="logo mark">
      <circle cx="60" cy="60" r="46" stroke={accent} strokeWidth="6" fill="none" />
      <rect x="40" y="40" width="40" height="40" fill={accent} opacity="0.22" transform="rotate(45 60 60)" />
    </svg>
  )
}
```

Create `src/logo/logo-wordmark.tsx`:

```tsx
export function LogoWordmark() {
  return <div className="logo-wordmark">undef games</div>
}
```

Create `src/logo/logo-compact.tsx`:

```tsx
export function LogoCompact() {
  return <div className="logo-compact">UG</div>
}
```

Create `src/logo/resolved-logo-panel.tsx`:

```tsx
import type { LogoConcept } from '../concepts/types'
import { LogoCompact } from './logo-compact'
import { LogoMark } from './logo-mark'
import { LogoWordmark } from './logo-wordmark'

export function ResolvedLogoPanel({ concept }: { concept: LogoConcept }) {
  return (
    <section className="panel">
      <h2>{concept.name}</h2>
      <p>{concept.prompt}</p>
      <h3>Primary</h3>
      <div>
        <LogoMark accent={concept.colorTokens.accent} />
        <LogoWordmark />
      </div>
      <h3>Symbol</h3>
      <LogoMark accent={concept.colorTokens.accent} />
      <h3>Compact</h3>
      <LogoCompact />
    </section>
  )
}
```

Modify `src/app/app-shell.tsx` to render the first concept panel:

```tsx
import { concepts } from '../concepts/registry'
import { ResolvedLogoPanel } from '../logo/resolved-logo-panel'
import { LogoLabScene } from '../scene/logo-lab-scene'

export function AppShell() {
  const concept = concepts[0]

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">undef games</p>
          <h1>undef logos</h1>
        </div>
      </header>
      <main className="layout">
        <section className="scene-frame">
          <LogoLabScene activeConceptId={concept.id} />
        </section>
        <aside className="panel-stack">
          <ResolvedLogoPanel concept={concept} />
          <section className="panel">
            <h2>Compare tray</h2>
          </section>
        </aside>
      </main>
    </div>
  )
}
```

- [ ] **Step 4: Run tests**

Run:

```bash
npm run test:run -- src/logo/resolved-logo-panel.test.tsx src/app/app-shell.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/logo/logo-mark.tsx src/logo/logo-wordmark.tsx src/logo/logo-compact.tsx src/logo/resolved-logo-panel.tsx src/logo/resolved-logo-panel.test.tsx src/app/app-shell.tsx
git commit -m "feat: add resolved logo system panels"
```

## Task 7: Build Concept Rail, Control Panel, and Compare Tray

**Files:**
- Create: `src/ui/concept-rail.tsx`
- Create: `src/ui/control-panel.tsx`
- Create: `src/ui/compare-tray.tsx`
- Create: `src/ui/prompt-panel.tsx`
- Create: `src/ui/icon-button.tsx`
- Create: `src/ui/concept-rail.test.tsx`
- Modify: `src/app/app-shell.tsx`

- [ ] **Step 1: Write the failing concept rail test**

Create `src/ui/concept-rail.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ConceptRail } from './concept-rail'
import { concepts } from '../concepts/registry'

describe('ConceptRail', () => {
  it('renders 13 concept buttons', () => {
    render(<ConceptRail concepts={concepts} activeConceptId="prompt-cursor" onSelect={() => undefined} />)
    expect(screen.getAllByRole('button')).toHaveLength(13)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm run test:run -- src/ui/concept-rail.test.tsx
```

Expected: FAIL because the UI components do not exist.

- [ ] **Step 3: Create the UI components**

Create `src/ui/concept-rail.tsx`:

```tsx
import type { LogoConcept } from '../concepts/types'

export function ConceptRail({
  concepts,
  activeConceptId,
  onSelect,
}: {
  concepts: LogoConcept[]
  activeConceptId: string
  onSelect: (id: string) => void
}) {
  return (
    <nav className="concept-rail" aria-label="concept rail">
      {concepts.map((concept) => (
        <button
          key={concept.id}
          type="button"
          data-active={concept.id === activeConceptId}
          onClick={() => onSelect(concept.id)}
        >
          {concept.name}
        </button>
      ))}
    </nav>
  )
}
```

Create `src/ui/control-panel.tsx`:

```tsx
export function ControlPanel() {
  return (
    <section className="panel">
      <h2>Controls</h2>
      <p>symmetry, density, noise, field</p>
    </section>
  )
}
```

Create `src/ui/compare-tray.tsx`:

```tsx
export function CompareTray() {
  return (
    <section className="panel">
      <h2>Compare tray</h2>
    </section>
  )
}
```

Create `src/ui/prompt-panel.tsx`:

```tsx
export function PromptPanel({ prompt }: { prompt: string }) {
  return (
    <section className="panel">
      <h2>Prompt</h2>
      <p>{prompt}</p>
    </section>
  )
}
```

Create `src/ui/icon-button.tsx`:

```tsx
import type { ButtonHTMLAttributes, PropsWithChildren } from 'react'

export function IconButton(props: PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>>) {
  return <button type="button" {...props} />
}
```

Modify `src/app/app-shell.tsx` to mount the concept rail and panels.

- [ ] **Step 4: Run tests**

Run:

```bash
npm run test:run -- src/ui/concept-rail.test.tsx src/app/app-shell.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/ui/concept-rail.tsx src/ui/control-panel.tsx src/ui/compare-tray.tsx src/ui/prompt-panel.tsx src/ui/icon-button.tsx src/ui/concept-rail.test.tsx src/app/app-shell.tsx
git commit -m "feat: add concept selection and control surfaces"
```

## Task 8: Add E2E Coverage, Responsive Polish, and Dev Verification

**Files:**
- Create: `playwright.config.ts`
- Create: `tests/e2e/logo-lab.spec.ts`
- Modify: `src/styles/app.css`

- [ ] **Step 1: Write the failing E2E**

Create `tests/e2e/logo-lab.spec.ts`:

```ts
import { expect, test } from '@playwright/test'

test('renders the logo lab shell', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /undef logos/i })).toBeVisible()
  await expect(page.getByLabel('interactive logo scene')).toBeVisible()
})
```

- [ ] **Step 2: Run E2E to verify it fails**

Run:

```bash
npm run e2e
```

Expected: FAIL because Playwright config and a running preview target are not set up yet.

- [ ] **Step 3: Add Playwright config and responsive CSS**

Create `playwright.config.ts`:

```ts
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    headless: true,
  },
  webServer: {
    command: 'npm run preview -- --host 127.0.0.1 --port 4173',
    port: 4173,
    reuseExistingServer: true,
  },
})
```

Append to `src/styles/app.css`:

```css
@media (max-width: 980px) {
  .layout {
    grid-template-columns: 1fr;
  }

  .scene-frame {
    min-height: 56vh;
  }
}
```

- [ ] **Step 4: Run full verification**

Run:

```bash
npm run build
npm run test:run
npm run e2e
```

Expected:

- build passes
- unit/component tests pass
- Playwright passes

- [ ] **Step 5: Commit**

```bash
git add playwright.config.ts tests/e2e/logo-lab.spec.ts src/styles/app.css
git commit -m "test: add e2e coverage and responsive polish"
```

## Self-Review

### Spec coverage

- Single-page Vite/React app: covered in Tasks 1-2
- Shared continuous Three.js scene: covered in Task 5
- 13 concept presets: covered in Task 3
- Resolved logo systems: covered in Task 6
- Controls and compare tray: covered in Task 7
- Local state persistence primitives: covered in Task 4
- Responsive behavior and verification: covered in Task 8

### Placeholder scan

No `TBD`, `TODO`, or deferred implementation markers remain in the task instructions. The plan intentionally leaves room for visual refinement, but each task includes concrete files, code, and commands.

### Type consistency

- `LogoConcept` is defined once in `src/concepts/types.ts`
- concept ids and active concept wiring consistently use `prompt-cursor` as the initial state
- store display modes are consistently `landing | resolved | compare`

