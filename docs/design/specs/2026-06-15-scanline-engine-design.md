# Scanline Engine Design

## Purpose

Expand the existing scanline system from a small set of global sliders and
texture overlays into a configurable signal engine that can:

- change the location and travel of scanlines
- support shaped scanline behaviors such as sine waves and audit-style traces
- layer multiple behaviors at once
- persist the whole configuration inside the lab theme state
- keep the current baseline look available as an exact preset

The result should feel like a tunable signal instrument rather than a fixed
background treatment.

## Scope

This design covers the interactive lab runtime under `/lab/`.

It does not attempt to make Hugo production pages support the full advanced
layer engine. Production should continue to hydrate the saved theme palette and
baseline scanline texture behavior, while the advanced stacked waveform engine
remains a lab capability.

## Current State

The current scanline model is split across:

- CSS-driven field and section scanline textures
- optional texture layers: `graph`, `crt`, `glitch`
- broad tuning controls such as opacity, spacing, speed, scroll impact, and
  inertia
- a Pixi scene that renders the main animated signal field

What is missing is a notion of scanline shape. The system can tune density and
motion, but it cannot express “make the lines behave like a sine wave”, “offset
the scanline location”, or “stack several different waveform traces together”.

## Architecture

Use a hybrid engine.

### Why hybrid

Pure CSS is good for texture, continuity, and cheap background layering, but it
is the wrong abstraction for the waveform behaviors now being requested.
Pure Pixi would make the lab strong, but it would force too much of the existing
page texture behavior into the scene and reduce maintainability.

The hybrid model keeps responsibilities clear:

- CSS remains responsible for page-wide scanline texture continuity behind text
  and sections
- existing `graph`, `crt`, and `glitch` remain texture layers
- Pixi becomes responsible for shaped scanline behaviors and layer stacking in
  the hero signal field

This preserves the current visual baseline while creating room for a real
signal engine.

## Engine Model

Add a new scanline engine model to lab theme state.

### Base Pattern

The engine has a single `basePattern` that defines the underlying carrier field.
This is separate from the layer stack.

Initial base patterns:

- `straight`
- `sine`
- `audit`
- `broken`

### Layer Stack

Allow up to `13` simultaneous scanline behavior layers.

Each layer has:

- `id`
- `enabled`
- `kind`
- `opacity`
- `speed`
- `amplitude`
- `verticalOffset`
- `phase`

Advanced layers 1 through 3 also expose:

- `blendMode`
- `spacingInfluence`
- `frequency`
- `thickness`
- `jitter`
- `dashLength`
- `gapLength`
- `stepSharpness`
- `scrollCoupling`
- `pointerCoupling`

Supporting layers 4 through 13 remain simpler and expose:

- `kind`
- `intensity`
- `speed`
- `amplitude`
- `verticalOffset`
- `enabled`

The layer cap is hard. The UI should prevent adding a 14th layer.

## Scanline Kinds

The first implementation should support five scanline kinds.

### `straight`

Classic horizontal carrier lines with controllable position drift, banding, and
travel.

### `sine`

Smooth oscillating traces across the width of the scene.

### `audit`

A stepped, harsher waveform that reads like instrumentation or a telemetry
trace rather than decorative motion.

### `broken`

Fragmented trace behavior with intentional gaps, phase jumps, and interrupted
segments.

### `pulse`

A narrow burst or accent layer intended as a supporting modulation layer rather
than the main field.

## UI Design

Keep the current `Scanlines` group for broad feel controls:

- scan opacity
- scan spacing
- scan speed
- scan scroll impact
- sweep strength

Add a dedicated `Scanline engine` section beneath it.

### Compact Section

The compact surface should show:

- `Base pattern` select
- layer count
- add layer button
- a summary of active texture layers

### Advanced Section

The advanced surface should show:

- ordered layer list
- add / duplicate / mute / delete controls
- reorder controls
- expanded editor for layers 1 to 3
- compact editor rows for layers 4 to 13, with optional expansion if needed

This is intentionally mixed complexity:

- the first three layers are full signal-design tools
- the remaining ten layers are supporting modulation tools

That balance keeps the system expressive without turning the rail into noise.

## Interaction Rules

### Scroll

Scroll should bias travel and sweep, but it must stay smooth and continuous. It
must not produce dramatic snapping or re-centering of scanlines.

### Pointer

Pointer movement should be able to increase local wake, emphasis, or coupling
for eligible layers. It should bias the field, not hijack it.

### Vertical Placement

Each layer can originate from a different vertical band so stacked layers do not
collapse into the same stripe region.

### Blend Behavior

Blend modes are only exposed on the first three layers. Initial supported blend
modes:

- `add`
- `screen`
- `soft-light`
- `difference`

## Persistence

The full scanline engine state should persist with the existing theme state.

Presets must capture:

- base pattern
- all scanline layers
- legacy scanline controls
- existing texture-layer toggles

The first preset remains the exact current baseline. Selecting that preset must
reproduce the current system behavior as closely as possible.

## Rendering Responsibilities

### CSS Responsibilities

- page-wide scanline continuity behind content
- section scanline textures
- optional texture layers: `graph`, `crt`, `glitch`
- tone-sensitive visibility adjustments for dark and light themes

### Pixi Responsibilities

- waveform path generation
- vertical drift and band motion
- stacked layer rendering
- pointer and scroll coupling for scanline behaviors
- shaped traces such as sine, audit, broken, and pulse

## Testing

Add or update tests for:

- persistence of base pattern and layer stack
- hard cap of 13 layers
- compact vs advanced layer control rendering
- baseline preset restoring the current system
- visually distinct waveform modes in the Pixi field
- stable behavior under scroll and resize

Playwright coverage should verify at least:

- layer addition up to the cap
- distinct mode switching between straight, sine, audit, and broken
- persisted engine state after reload
- no regression to current baseline preset

## Risks

### UI sprawl

Thirteen layers can easily overwhelm the rail. The mixed editing model is the
main mitigation.

### Rendering complexity

Waveform generation and stacking in Pixi introduces more moving parts. The
engine needs bounded defaults and a hard layer cap.

### Preset compatibility

Existing presets were authored against a simpler scanline system. They will need
default engine values so old presets hydrate into a sensible baseline rather
than an empty engine.

## Recommendation

Implement the scanline engine as a hybrid system:

- keep CSS scanline textures and texture overlays
- add a real Pixi waveform engine
- store the full engine in theme state
- expose the first three layers as full design tools and layers four through
  thirteen as simpler supporting layers

This is the narrowest design that can support the requested behavior without
fighting the existing architecture.
