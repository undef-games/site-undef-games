# undef-logos Design Spec

Date: 2026-06-13
Status: Draft for review

## Goal

Create `undef-logos`, a new Vite/React repository for an interactive HTML5 logo lab for `undef games`.

The first version is a design instrument, not a finished marketing site. It should let the user explore 13 distinct logo directions through one continuous interactive Three.js environment, then resolve each direction into a tighter full logo system with a primary lockup, symbol-only mark, and compact variant.

## Product Definition

`undef games` is the umbrella identity for a studio and systems lab that builds game-related software across several adjacent surfaces:

- multiplayer party games
- 3D dice and simulation tooling
- pixel-art composition engines
- tabletop/random-table tools
- retro terminal/BBS/game infrastructure

The brand should feel systems-first, exploratory, a little retro, and technically intentional without reading as nostalgia cosplay.

## Core Experience

The app is a hybrid of three interaction modes at once:

1. Gallery-like:
   users can browse 13 logo directions as clearly distinct concept states.
2. Simulation-like:
   the logo language emerges from one live generative system rather than static thumbnails.
3. Instrument-like:
   the user can tune parameters and mutate each concept inside bounded ranges.

The dominant structure is:

- `B > A` for landing emphasis:
  one core system first, with gallery legibility second.
- `B` for concept transitions:
  selecting a concept retunes the same environment instead of moving to separate scenes.

## Scope

The first implementation should include:

- one single-page app
- one continuous shared Three.js scene
- 13 concept presets
- real curated typography
- full logo system outputs per concept
- live mutation controls
- concept comparison tray
- local persistence for current concept and pins

The first implementation should not include:

- backend or accounts
- CMS
- AI image generation
- multi-page site structure
- production export pipeline beyond basic capture/download

## Technical Baseline

Use latest-by-default packages verified against the npm registry on 2026-06-13:

- `react` `19.2.7`
- `react-dom` `19.2.7`
- `vite` `8.0.16`
- `@vitejs/plugin-react` `6.0.2`
- `typescript` `6.0.3`
- `three` `0.184.0`
- `@react-three/fiber` `9.6.1`
- `@react-three/drei` `10.7.7`
- `zustand` `5.0.14`
- `framer-motion` `12.40.0`

Registry sources:

- https://registry.npmjs.org/react/latest
- https://registry.npmjs.org/react-dom/latest
- https://registry.npmjs.org/vite/latest
- https://registry.npmjs.org/@vitejs/plugin-react/latest
- https://registry.npmjs.org/typescript/latest
- https://registry.npmjs.org/three/latest
- https://registry.npmjs.org/@react-three/fiber/latest
- https://registry.npmjs.org/@react-three/drei/latest
- https://registry.npmjs.org/zustand/latest
- https://registry.npmjs.org/framer-motion/latest

Compatibility notes:

- `vite@8.0.16` requires Node `^20.19.0 || >=22.12.0`
- `@react-three/fiber@9.6.1` peers on React `>=19 <19.3`

This spec assumes exact-pinned current versions unless a newer compatible version is verified at implementation time.

## Architecture

The app should be structured as five cooperating parts.

### 1. Scene runtime

Owns:

- React Three Fiber scene
- camera rig
- post-processing
- pointer and keyboard response
- motion loop
- world-state transitions between concepts

This layer presents one continuous environment. Concept selection retunes it in place.

### 2. Concept registry

Owns:

- the 13 concept definitions
- prompt text
- tags
- color tokens
- typography pairings
- geometry presets
- motion presets
- logo resolution rules

This is typed configuration, not ad hoc component logic.

### 3. Symbol generator

Owns the reusable visual primitives and mutation logic used to produce abstract mark candidates. The same generator family is reused across all concepts so the app feels coherent as one studio system.

Primitive families should include:

- grids
- nodes
- rings
- shards
- warp paths
- cursor/prompt forms
- pixel clusters
- dice-like volumes
- tiled anomalies

### 4. Logo resolver

Owns the transition from live generative scene state into cleaner logo outputs.

This layer should use SVG and DOM composition for the final resolved systems rather than forcing production legibility out of the raw 3D scene.

Outputs per concept:

- primary logo lockup
- symbol-only mark
- compact combination

### 5. Control and comparison layer

Owns:

- concept selector rail
- prompt/detail panel
- live tuning controls
- pinning
- side-by-side comparison tray
- persistence of user state

## UX Flow

### Landing

The app opens directly into a full-bleed live scene. No marketing hero, no explanatory landing page. The environment must feel alive immediately.

### Discovery

The 13 concepts are browseable from a secondary navigation system such as:

- concept rail
- orbit indicators
- keyboard cycling
- hover preview states

The gallery must remain legible, but it should not visually dominate the central simulation.

### Retune

Selecting a concept morphs the current environment into a new state:

- palette shifts
- geometry behavior changes
- particle rules change
- camera posture adjusts
- typography treatment changes

This is a mode morph, not a page transition.

### Resolve

After retuning, the concept resolves into a tighter panel or overlay showing:

- the primary lockup
- symbol-only mark
- compact variant
- concept name
- prompt
- tags

### Instrument

Users can tune parameters inside a concept without breaking its identity. Candidate controls:

- symmetry
- field intensity
- noise
- segmentation
- geometry density
- accent color
- type weight or spacing where appropriate

### Compare

Users can pin multiple concepts and compare them side by side without leaving the main route.

## Visual Direction

The user referenced `tim.life` as the interaction benchmark. The concrete takeaway is not to copy its style, but to match its posture:

- full-bleed interactive canvas
- system-like motion
- parameterized visual behavior
- immediate visual feedback

The app should feel more like a brand instrument than a static portfolio.

## Logo Concept Organization

Group the 13 prompts into three lanes so the system has internal structure.

### Lane 1: terminal / systems / retro-future

- prompt/cursor
- warp gate
- wireframe star map
- brutalist glitch
- monogram UG

### Lane 2: generative / procedural / simulation

- undefined-to-play
- modular nodes
- procedural tile anomaly
- emergence from chaos
- one system, many mutations

### Lane 3: play / toolmaking / game objects

- dice + pixel + dialogue hybrid
- multiplayer party-game energy
- pixel-to-vector mark
- logo system / app-icon-ready identity

These lane names are organizational and may be refined during implementation, but the intent is fixed: exploratory generative behavior on the way in, clearer brand candidates on the way out.

## Concept Data Model

Each concept should define at least:

- `id`
- `name`
- `prompt`
- `lane`
- `tags`
- `colorTokens`
- `fontPairing`
- `geometryPreset`
- `motionPreset`
- `symbolRules`
- `wordmarkRules`
- `compactLockupRules`
- `mutationRanges`

## Typography

Typography must use real curated fonts in the first pass.

Requirements:

- no system fallback as the intended brand expression
- font choices must support both exploratory and near-usable outputs
- type treatment is part of the concept definition, not a global afterthought

Resolved logo systems should balance two goals:

1. abstract generative candidates
2. near-production brand candidates

The landing and motion language can stay more exploratory. The resolved lockups must be cleaner and more disciplined.

## File Structure

Recommended repository structure:

```text
undef-logos/
  src/
    app/
    scene/
    concepts/
    generator/
    logo/
    store/
    ui/
    styles/
  public/
  docs/
```

Module responsibilities:

- `app/`: shell, top-level layout, view-state orchestration
- `scene/`: Three.js runtime, camera, lighting, transitions
- `concepts/`: typed preset registry
- `generator/`: geometry primitives and mutation logic
- `logo/`: resolved SVG/DOM logo systems
- `store/`: Zustand app state
- `ui/`: control surfaces and comparison UI
- `styles/`: tokens, font setup, layout CSS

## State Model

Global client state should track:

- active concept
- hovered concept
- control values
- pinned concepts
- morph progress
- display mode (`landing`, `resolved`, `compare`)

The registry remains static. The live scene derives from:

- selected concept preset
- bounded runtime overrides

## Error Handling

### Runtime safety

- If WebGL capabilities are weak, degrade effects quality rather than failing the app.
- If a concept mutation exceeds visual stability, clamp to the concept's allowed ranges.
- If fonts fail to load, surface a clear degraded state and avoid layout collapse.

### Interaction safety

- Scene transitions must be interruptible without leaving invalid intermediate state.
- Controls must debounce or smooth expensive recomputations.
- Comparison mode must avoid re-instantiating heavy scene resources for every pinned item.

## Testing

Testing should scale to the real risks:

- unit tests for concept registry shape and mutation clamping
- unit tests for logo resolver outputs where deterministic
- component tests for selector, controls, and compare tray
- Playwright tests for desktop/mobile layout and core interactions
- screenshot-based checks that the scene is nonblank and resolved logos render correctly

Critical test targets:

- concept switching
- persistence of active/pinned state
- bounded control behavior
- resolved panel readability
- responsive layout without overlap

## Performance

Performance targets for v1:

- immediate first visual response
- concept retunes that feel continuous rather than reloaded
- controlled GPU cost on laptop hardware

Approach:

- reuse scene resources where possible
- keep one shared simulation architecture
- use SVG/DOM for crisp resolved outputs
- avoid overbuilding post-processing

## Success Criteria

The first pass is successful if:

1. the app feels alive on load
2. each of the 13 concepts is visually distinct within seconds
3. the resolved logo systems are cleaner than the live scene
4. the typography feels intentional
5. users can explore without breaking the concept families
6. the whole thing reads as one coherent `undef games` lab, not 13 unrelated experiments

## Recommendation

Build the POC as a design instrument with presentable outputs.

That means:

- one shared generative world
- 13 retuned concept states
- resolved logo system panels with curated typography
- bounded user mutation
- comparison workflow

Do not treat v1 as a finished corporate brand site. Treat it as the environment where the future brand system is discovered, evaluated, and narrowed.
