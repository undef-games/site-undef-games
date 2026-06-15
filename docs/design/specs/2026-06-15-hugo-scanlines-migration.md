# Hugo Scanlines Migration Design

Date: 2026-06-15
Status: Approved direction, pending implementation plan

## Goal

Convert `undef-logos` from a Vite-first React/Pixi app into an idiomatic Hugo site while preserving the current interactive logo lab as a production-accessible experience at `/lab/`.

The public site should use a private local Hugo theme named `scanlines`. The theme is not intended for publication as a reusable public theme. It is a project-internal presentation system for the `undef games` identity, landing page, right-rail visual language, scanline overlays, and related pages.

## Inspiration From Existing Site Repos

The migration should follow the maintainability pattern used by the existing Hugo/deploy sites:

- `provide-io/site-octowright-com`
- `provide-io/site-uterm-io`
- `provide-io/site-pyvider-com`

Relevant conventions to carry forward:

- Hugo site root with `hugo.toml`, `content/`, `data/`, `layouts/` or `themes/`, `static/`, `public/`, `terraform/`, `scripts/`, and a `Makefile`.
- Simple build/deploy commands: `make build`, `make serve`, `make deploy`, and preview deployment where useful.
- Cloudflare Pages as the deployment target.
- Terraform owns the Pages project, custom domain, and DNS posture.
- Build stamping through `scripts/stamp_build.sh` and `data/build.json`.
- Content/data separation where homepage copy, product links, and route metadata live outside templates.
- Static assets and small browser scripts are committed and served directly, rather than routed through a framework runtime.

## Selected Architecture

Use one repo and one deploy artifact:

```text
undef-logos/
  hugo.toml
  Makefile
  content/
  data/
  static/
  themes/
    scanlines/
      layouts/
      assets/
      static/
  lab/
    package.json
    src/
    tests/
    vite.config.ts
  public/
  terraform/
```

Hugo owns the main site at `/`. The existing Vite/React/Pixi lab moves under `lab/` and builds to `public/lab/`.

This keeps team ownership clean:

- Site/content/theme work happens in Hugo paths.
- Interactive Pixi/React work happens in `lab/`.
- Deployment and infrastructure stay shared.
- The public domain stays single-source: `https://logos.undef.games/` plus `https://logos.undef.games/lab/`.

## Routing

Primary routes:

- `/` - Hugo landing page using the `scanlines` theme.
- `/lab/` - Current interactive Vite/React/Pixi logo lab, preserved as-is conceptually.
- `/identity/` or `/style-guide/` - Optional Hugo-rendered identity notes if useful during migration.

The main Hugo page should be a landing page, not the settings-heavy lab. It should still preserve the current visual language: scanlines, terminal/station identity, Maze Gate U Cut, product links, and the transmission-field feel.

The lab remains reachable and can keep its right-hand controls, presets, scanline layers, and section effect toys.

## Theme Boundary

`themes/scanlines` is private and repo-local.

It should include:

- Base templates and partials.
- Scanline/station CSS.
- Hugo partials for hero, product routes, footer, nav/rail elements, and identity lockup.
- Minimal JavaScript for scroll/pointer scanline effects on Hugo-rendered pages.
- Theme assets that belong to the visual system.

It should not include:

- Vite app source.
- React/Pixi implementation details.
- Published theme metadata or external module assumptions.
- Generic reusable theme abstractions that make local work harder.

## Lab Boundary

The lab should remain a Vite app under `lab/`.

It should retain:

- PixiJS signal field.
- Right-hand lab controls.
- Effect presets.
- Graph paper, CRT monitor, and glitch scanline layers.
- Current E2E behavior coverage where practical.

The lab build must be configured with a `/lab/` base path so assets resolve correctly when deployed below the Hugo site root.

## Data And Content

Move landing-page content into Hugo data/content:

- Product examples: WARP, Undef Dice, Taybols.
- Hero copy and CTA labels.
- Identity lockup text.
- Footer/build metadata.
- Optional preset summaries if the main site references lab capabilities.

The active baseline remains documented in `docs/design/specs/initial-style-guide.md`.

## Build Pipeline

The build should be deterministic and simple:

1. `make stamp` writes `data/build.json`.
2. `make build-hugo` builds Hugo into `public/`.
3. `make build-lab` installs/builds the Vite app under `lab/`.
4. `make build` runs both and writes lab output into `public/lab/`.
5. `make serve` serves Hugo locally and either builds or proxies the lab in the simplest reliable way.
6. `make deploy` deploys `public/` to Cloudflare Pages.

Expected Cloudflare Pages output directory: `public`.

## Terraform And Deployment

Keep Cloudflare Pages and DNS in `terraform/`, but revise names and commands to match the Hugo setup:

- Pages project remains `undef-logos` unless there is a concrete reason to rename it.
- Custom domain remains `logos.undef.games`.
- Build command becomes `make build` or equivalent Hugo/lab build command.
- Output directory becomes `public`.
- Avoid Terraform local-exec installs unless still explicitly needed; prefer Makefile and Wrangler for direct deployment, following the `site-*` repos.

## Testing

Testing should cover both halves without coupling them unnecessarily:

- Hugo build succeeds.
- Main site renders expected landing content and product links.
- `/lab/` loads the Vite app assets correctly.
- Existing lab unit tests continue to cover station state, effects, logo pieces, and Pixi-facing logic.
- Playwright verifies the main landing route and the `/lab/` route.
- Terraform validation remains available for infrastructure changes.

The first implementation plan should preserve existing behavior before improving the Hugo landing page.

## Non-Goals

- Do not publish `scanlines` as a public Hugo theme.
- Do not split the lab into a separate repo unless future ownership makes it a standalone product.
- Do not remove the interactive lab.
- Do not replace PixiJS during this migration.
- Do not redesign the identity baseline during the Hugo conversion.

## Risks

- Asset paths can break when moving the Vite app to `/lab/`; configure Vite base path and test deployed-like output.
- Duplicating CSS between Hugo and lab can drift; share design tokens deliberately, but do not prematurely over-abstract.
- The main Hugo landing page can become too static; keep scanline/pointer/scroll effects where they add value without rebuilding the full lab.
- Build scripts can become fragile if Hugo and npm dependency work are interleaved unclearly; keep Make targets small and explicit.

## Acceptance Criteria

- `logos.undef.games/` is generated by Hugo using private theme `scanlines`.
- `logos.undef.games/lab/` serves the current interactive lab concept.
- One repo produces one deploy artifact.
- `make build` creates a complete `public/` tree.
- `make deploy` deploys the complete site to Cloudflare Pages.
- Tests verify both `/` and `/lab/`.
- The active style guide records that Hugo is the main site layer and the lab is a mounted production route.
