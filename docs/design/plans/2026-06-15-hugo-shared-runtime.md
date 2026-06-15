# Hugo Shared Runtime Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Hugo `/` mount the actual lab React/Pixi station runtime in production mode, without the lab control panel.

**Architecture:** `lab/src/app/app-shell.tsx` becomes a shared shell with a `surface` prop. The lab entry renders `surface="lab"` and a new site entry renders `surface="site"`. Hugo references deterministic Vite output under `/lab/assets/`.

**Tech Stack:** Hugo, Vite 8, React 19, PixiJS 8, TypeScript, Playwright, Vitest.

---

### Task 1: Add AppShell Production Mode

**Files:**
- Modify: `lab/src/app/app-shell.tsx`
- Modify: `lab/src/app/App.tsx`
- Modify: `lab/src/app/app-shell.test.tsx`

- [ ] Add `type AppShellSurface = 'lab' | 'site'`.
- [ ] Add an optional `surface?: AppShellSurface` prop to `AppShell`.
- [ ] Keep the default surface as `lab`.
- [ ] Use `surface === 'site'` to hide the entire `station-sidebar`.
- [ ] Add class `station-shell--site` to the root shell in site mode.
- [ ] Use initial signal `50` in site mode so the production surface is alive without controls.
- [ ] Change the first hero action to `/lab/` with label `Open lab` in site mode.
- [ ] Keep `/lab/` behavior unchanged through `App`.
- [ ] Add tests that site mode hides `station tools and identity`, hides `effects controls`, keeps the Pixi scene, and exposes `Open lab`.

### Task 2: Add Site Runtime Entry

**Files:**
- Create: `lab/src/site-main.tsx`
- Modify: `lab/vite.config.ts`

- [ ] Create `site-main.tsx` that imports the same reset/tokens/fonts/app CSS as `main.tsx`.
- [ ] Render `<AppShell surface="site" />` into `#scanlines-root`.
- [ ] Configure Vite with two inputs: the existing lab `index.html` and the site entry.
- [ ] Emit deterministic Vite filenames for entry scripts and shared CSS so Hugo can reference `/lab/assets/site.js` and `/lab/assets/style.css`.
- [ ] Keep the lab base as `/lab/`.

### Task 3: Convert Hugo Theme To Runtime Host

**Files:**
- Modify: `themes/scanlines/layouts/_default/baseof.html`
- Modify: `themes/scanlines/layouts/index.html`
- Modify: `themes/scanlines/layouts/partials/head.html`
- Modify: `themes/scanlines/static/css/scanlines.css`
- Modify or remove: `themes/scanlines/static/js/scanlines.js`
- Modify: `tests/e2e/site.spec.ts`

- [ ] Replace the static partial-composed homepage with a semantic fallback inside `<div id="scanlines-root">`.
- [ ] Load `/lab/assets/style.css` from the Hugo head.
- [ ] Load `/lab/assets/site.js` as a module at the end of the body.
- [ ] Keep lightweight theme fallback CSS only for no-JS content and mounting.
- [ ] Remove the old pointer-scroll static `scan-*` behavior where it conflicts with the runtime.
- [ ] Update Playwright root test to assert the shared runtime mounts, the Pixi scene exists, and effects controls are absent on `/`.
- [ ] Keep `/lab/` test asserting effects controls are visible.

### Task 4: Verify And Deploy

**Files:**
- No planned source edits unless verification reveals a defect.

- [ ] Run `make typecheck`.
- [ ] Run `make test`.
- [ ] Run `make e2e`.
- [ ] Run browser verification for `/` and `/lab/`.
- [ ] Merge to `main`.
- [ ] Deploy preview first if production behavior changed materially.
- [ ] Deploy production after preview verification.
- [ ] Verify `https://logos.undef.games/`, `https://logos.undef.games/lab/`, `https://undef.games/`, and `https://undef.games/lab/`.

