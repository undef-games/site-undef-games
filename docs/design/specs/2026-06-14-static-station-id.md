# Static Station ID Design

## Goal

Replace the three weak logo prototypes with one focused interactive broadcast identity for `undef games`: a clean station ID found inside dead-channel static.

## Visual Thesis

A precise station identity emerges from dead air. The surface should read as broadcast graphics first, game-brand specimen second, and abstract generative art never.

Current baseline: `station-scanfield-v0.1`, documented in `docs/design/specs/initial-style-guide.md`.

## Experience

- The first screen is a full-bleed transmission surface.
- Initial state is `NO SIGNAL`: static, scanlines, channel metadata, and a degraded `undef.games` signal.
- The user tunes the signal with a large control, pointer movement, or scene click.
- As tuning increases, static collapses into a clean station ID: `undef games`, `CH 00`, `LOCKED`, signal bars, and a compact channel bug.
- The final tuned state exposes a usable identity system:
  - primary station lockup
  - compact channel bug
  - no-signal badge
  - live/tuned state readout

## Interaction Model

- `tune` increases signal strength from 0 to 100.
- `detune` decreases signal strength.
- `reset` returns to no signal.
- Pointer movement adds visible interference in the PixiJS scene, but durable identity state is the explicit signal strength.

## Implementation

- Add a pure `station-state` module for signal strength and derived status.
- Replace `AppShell` with the static station surface.
- Add a PixiJS `StationSignalScene` for animated static, scanlines, and signal depth.
- Add flat SVG identity components for station ID, channel bug, and no-signal badge.
- Remove old concept rails and prototype controls from the rendered experience.

## Verification

- Unit tests cover signal-state transitions and derived labels.
- React tests cover rendering, tuning, detuning, reset, and identity specimen output.
- E2E tests cover the main tuning loop and mobile overflow.
