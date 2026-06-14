# undef games Initial Style Guide

Date: 2026-06-14
Status: Active baseline
Baseline tag: `station-scanfield-v0.2`

## Current Best Direction

The strongest direction so far is the static station identity with the Maze Gate U Cut logo kept out of the main canvas. The interactive surface should read as a transmission field: sharp scanlines, sparse signal metadata, restrained terminal typography, and a clean `undef games` station lockup.

This baseline replaces the previous abstract symbol explorations. It should be treated as the comparison point for future visual changes until a stronger direction is explicitly tagged.

Prior saved baseline: `station-scanfield-v0.1`, the clean landing page with scan-field background, right-hand identity rail, and frosted background mark.

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
- `Station ID` header with locked/scan state
- primary Maze Gate U Cut lockup beside `undef games`
- compact `UG 00` channel bug
- `SCAN` / `LOCKED` specimen badge

The rail should feel operational and dense. It should support the landing page without becoming a generic sidebar card stack.

## Interactive Surface

- Background mode: `scan-field`.
- Renderer: PixiJS.
- Motion language: horizontal scanlines, signal sweep, subtle noise, and pointer-influenced drift.
- Tuning behavior: scanline density and brightness increase with signal strength.
- Landing behavior: scanlines respond to mouse position and page scroll.
- Toy behavior: channel chips change the scan field mode, scope readout, and packet drift layer.
- Scroll behavior: lower sections carry subtle scan toys so the page keeps feeling interactive past the hero.
- Locked state: signal can resolve to `LOCKED`, but the scene should not add a central emblem when locked.
- Resize behavior: canvas must remain fitted to the scene bounds without stretching, offsetting, or leaving stale render areas.
- Background mark: a very dim, blurred, frosted Maze Gate U Cut may sit behind the landing hero content, but it must not read as the main centered logo.

## Visual Rules

- Keep the screen utilitarian and broadcast-like, not decorative.
- Use the neon signal color as an operational state color, not a generic glow treatment.
- Avoid abstract marks that do not explain themselves.
- Avoid centered symbolic forms in the canvas unless they become a clearly approved logo direction.
- Favor legibility, strong contrast, and purposeful metadata over ornamental motion.

## Implementation Tag

This baseline is represented in code by:

- `src/station/station-identity.tsx` for the Maze Gate U Cut lockup.
- `src/station/station-signal-scene.tsx` with `data-field-shape="scan-field"`.
- `src/station/station-signal-scene.tsx` with `hasCenterMark: false`.
