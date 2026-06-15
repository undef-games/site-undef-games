# undef games Initial Style Guide

Date: 2026-06-14
Status: Active baseline
Baseline tag: `station-effects-rail-v0.3`

## Current Best Direction

The strongest direction so far is the static station identity with the Maze Gate U Cut logo kept out of the main canvas. The interactive surface should read as a transmission field: sharp scanlines, sparse signal metadata, restrained terminal typography, and a clean `undef games` station lockup.

This baseline replaces the previous abstract symbol explorations. It should be treated as the comparison point for future visual changes until a stronger direction is explicitly tagged.

Prior saved baselines:

- `station-scanfield-v0.2`, the landing page with the fixed right-hand identity rail, Pixi scan field, page scroll toys, and tumbling identity rectangles.
- `station-scanfield-v0.1`, the clean landing page with scan-field background, right-hand identity rail, and frosted background mark.

## Logo System

- Primary mark: Maze Gate U Cut.
- Primary lockup: Maze Gate U Cut beside `undef games`.
- Mark placement: logo/sidebar/identity lockup only.
- Canvas placement: no center logo mark, no upside-down T, no mast, no symbolic echo in the middle of the scene.
- Wordmark: lowercase `undef games`, heavy, direct, readable over the scan field.

## Right-Hand Identity Rail

The right-hand side is part of the baseline, not a throwaway settings panel. Preserve it as a compact identity rail that contains:

- signal controls for tuning, detuning, and reset
- signal meter and station status readout
- channel toys for `CH 00`, `CH 13`, `CH ??`, and `UG`
- compact signal scope reacting to scroll, tuning, and selected channel
- effects presets and parameters for scanlines, interference, scene effects, rectangles, and palette
- `Station ID` header with locked/scan state
- primary Maze Gate U Cut lockup beside `undef games`
- compact `UG 00` channel bug
- `SCAN` / `LOCKED` specimen badge

The rail should feel operational and dense. It should support the landing page without becoming a generic sidebar card stack.

The first effects preset, `Current baseline`, is the canonical baseline. Its values are multiplier defaults and should preserve the current look exactly: dark page, bright signal green, dim page scanlines, Pixi scan field, frosted background mark, and visible tumbling identity rectangles. Its three support colors intentionally match the primary signal green so the baseline remains single-signal. Other presets are for exploration only. Keep the preset list in a dropdown so the rail can support 30+ visually distinct directions without turning into a button grid.

## Interactive Surface

- Background mode: `scan-field`.
- Renderer: PixiJS.
- Motion language: horizontal scanlines, signal sweep, subtle noise, and pointer-influenced drift.
- Tuning behavior: scanline density and brightness increase with signal strength.
- Landing behavior: scanlines respond to mouse position and page scroll.
- Page scanline behavior: the scanline effect should read as one continuous background field traversing the entire page from top to bottom. Scrolling should reveal/move through that field continuously, with text, panels, rectangles, and other layers dimming or masking it as they overlap.
- Rejected scanline interpretation: do not treat "follow the location" as aligning a current scanline band to the center of the browser viewport. That viewport-centered targeting effect is useful as a known contrast, but it is not the intended scanline behavior.
- Toy behavior: channel chips change the scan field mode, scope readout, and packet drift layer.
- Scroll behavior: lower sections carry subtle scan toys so the page keeps feeling interactive past the hero.
- Header scan behavior: section/header scan fragments may tumble left with scroll, but they must keep fixed fragment sizes and stay behind section text.
- Locked state: signal can resolve to `LOCKED`, but the scene should not add a central emblem when locked.
- Resize behavior: canvas must remain fitted to the scene bounds without stretching, offsetting, or leaving stale render areas.
- Background mark: a very dim, blurred, frosted Maze Gate U Cut may sit behind the landing hero content, but it must not read as the main centered logo.
- Effects behavior: the right rail may tune scan opacity, spacing, speed, sweep, noise, jitter, pointer wake, scroll boost, glow, frost, drift, occlusion, rectangle opacity, travel, spin, pulse, fill, border, glow, and palette. Palette includes primary signal, muted, glow, and three supporting colors that can drive multi-color scanlines, scope bars, sweep accents, and section toys. Keep these controls behind the content hierarchy; they are lab controls, not landing page copy.

## Product Examples

The landing page should not stay abstract. It should show concrete routes for the current undef games surface:

- `TradeWars: WARP Agent Runtime Platform` at `https://warp.undef.games`
- `Undef Dice` at `https://undefdice.com`
- `Taybols` at `https://taybols.undef.games`

Keep these examples visually integrated with the transmission system. Product rows and individual product bands may use signal/support colors from the active preset so the lower page does not collapse into identical black sections.

## Visual Rules

- Keep the screen utilitarian and broadcast-like, not decorative.
- Use the neon signal color as an operational state color, not a generic glow treatment.
- Avoid abstract marks that do not explain themselves.
- Avoid centered symbolic forms in the canvas unless they become a clearly approved logo direction.
- Favor legibility, strong contrast, and purposeful metadata over ornamental motion.

## Implementation Tag

This baseline is represented in code by:

- `src/station/station-identity.tsx` for the Maze Gate U Cut lockup.
- `src/station/effects-config.ts` for the right-rail baseline preset and effect CSS variables.
- `src/station/effects-controls.tsx` for the right-rail preset and parameter controls.
- `src/station/station-signal-scene.tsx` with `data-field-shape="scan-field"`.
- `src/station/station-signal-scene.tsx` with `hasCenterMark: false`.
