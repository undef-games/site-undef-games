# Hugo Shared Runtime Production Surface

## Goal

The Hugo production homepage at `/` must feel almost exactly like the interactive lab surface, but without the lab control panel. The production page should not be a separate simplified `scan-*` marketing layout.

## Decision

Use the actual lab React/Pixi runtime for the production root where practical. The shared runtime renders the same station broadcast, Pixi scanline field, ghost Maze Gate mark, packet drift, product sections, and section toys used by `/lab/`. The lab route keeps the full right-hand control panel. The Hugo root hides the entire right rail and expands the station surface to full width.

## Production Behavior

- `/` renders a Hugo fallback shell with enough semantic content for no-JS and crawlers.
- Once JavaScript loads, React mounts a shared `AppShell` in production mode.
- Production mode:
  - uses the same Pixi signal scene as the lab;
  - uses the same landing sections and section toy effects as the lab;
  - omits the full `station-sidebar`, including controls, channel buttons, effects controls, scope, and identity specimens;
  - uses a full-width station broadcast instead of reserving `360px` for a rail;
  - keeps an `Open lab` action that points to `/lab/`;
  - keeps `View projects` pointing to `#projects`.
- `/lab/` remains the full lab with the control panel and all existing controls.

## Build Shape

The lab Vite build owns the shared runtime bundle. It emits:

- the existing `/lab/` app;
- a deterministic production-root entry, loaded from Hugo as `/lab/assets/site.js`;
- a deterministic shared stylesheet, loaded from Hugo as `/lab/assets/style.css`.

Hugo can reference those deterministic files before the lab build runs because `make build` builds Hugo first and then copies the lab output into `public/lab/`.

## Theme Role

The private Hugo theme `scanlines` remains the production theme. Its job changes from recreating the lab visuals in static CSS to bootstrapping and hosting the shared TypeScript runtime. Theme-specific CSS should be limited to no-JS fallback, mounting, and non-runtime page chrome.

## Testing

Tests must prove:

- `AppShell` production mode renders without the right rail/control panel.
- Production mode exposes an `Open lab` link and keeps the Pixi scene.
- Hugo `/` loads the shared runtime script and stylesheet.
- Built `/` renders the shared runtime and has no effects controls.
- `/lab/` still renders the full controls.

