# undef-logos Agent Guide

## Project Purpose

`undef-logos` is the production landing page for `undef games` plus a mounted
interactive logo lab. The site at `/` is a Hugo build. The lab at `/lab/` is a
Vite, React, and PixiJS application that ships inside the same Cloudflare Pages
artifact.

The production Hugo site uses the private local theme at `themes/scanlines`.
Keep that theme local to this repository. Do not make it a public dependency,
move it to a package registry, or replace it with a remote theme without an
explicit product decision.

The current canonical migration notes are in:

- `docs/design/specs/2026-06-15-hugo-scanlines-migration.md`
- `docs/design/plans/2026-06-15-hugo-scanlines-migration.md`
- `docs/design/specs/2026-06-13-undef-logos-design.md`
- `docs/design/specs/2026-06-14-static-station-id.md`
- `docs/design/specs/2026-06-14-playable-logo-instruments.md`
- `docs/design/specs/initial-style-guide.md`

Treat the migration spec and the initial style guide as the baseline before
making visual or structural changes.

## Layout

- `hugo.toml` configures the Hugo production site, including `theme =
  "scanlines"` and the lab route parameter `/lab/`.
- `content/_index.md` is the Hugo home page content entry.
- `data/site/home.json` provides structured home-page copy and product data.
- `themes/scanlines/` contains the private Hugo theme layouts, CSS, and
  JavaScript for the production landing page at `/`.
- `lab/` contains the Vite, React, PixiJS logo lab. Keep the lab in this
  subdirectory; do not move it back to the repository root.
- `tests/e2e/` contains Playwright coverage for the Hugo landing page and the
  mounted lab.
- `terraform/` contains Cloudflare Pages, domain, and DNS infrastructure.
- `scripts/stamp_build.sh` writes build metadata to `data/build.json` during
  builds.

## Core Commands

Run these from the repository root unless noted otherwise.

- `make install-root` installs root tooling with `npm ci`.
- `make install-lab` installs lab dependencies with `npm --prefix lab ci`.
- `make build` builds the complete deployable artifact.
- `make serve` runs Hugo locally at `http://127.0.0.1:1780`.
- `make test` runs the lab unit test suite.
- `make typecheck` runs lab TypeScript checks.
- `make e2e` builds the site and runs Playwright tests.
- `make deploy-preview` builds and deploys a staging preview to Cloudflare
  Pages using branch `staging`.
- `make deploy` builds and deploys production to Cloudflare Pages using branch
  `main`.

Root `npm` scripts are thin wrappers around these Make targets. Prefer the Make
targets in documentation and automation so future agents see the full Hugo plus
lab workflow.

## Build Artifact Shape

The build has two separate producers and one final artifact:

1. `make build-hugo` runs the Hugo build and writes `public/`.
2. `make build-lab` runs the Vite lab build and writes `lab/dist/`.
3. `make build-lab` then copies `lab/dist/.` into `public/lab/`.

Cloudflare Pages receives `public/` as the deploy directory. The expected final
artifact has the Hugo landing page at the root and the lab files under
`public/lab/`.

Do not commit generated build output:

- `public/`
- `lab/dist/`
- `data/build.json`

## Terraform And Deployment

Terraform lives in `terraform/` and manages Cloudflare infrastructure for the
Pages project, custom domains, and DNS records:

- Pages project: `undef-logos`
- Primary logos domain: `logos.undef.games`
- Apex domain: `undef.games`
- Production branch: `main`
- Pages build command metadata: `make build`
- Pages output metadata: `public`

Terraform does not deploy site artifacts. Artifact deployment is done by
Wrangler through `make deploy-preview` and `make deploy`.

Use this deployment sequence:

1. Apply or validate Terraform first when infrastructure has changed.
2. Deploy preview or staging with `make deploy-preview`.
3. Verify the preview URL, including `/` and `/lab/`.
4. Deploy production from `main` with `make deploy`.
5. Verify `https://logos.undef.games/`, `https://logos.undef.games/lab/`,
   `https://undef.games/`, and `https://undef.games/lab/`.

Do not commit `.terraform/`, local Terraform state files, or saved plan files.
Do commit `terraform/.terraform.lock.hcl` when provider selections change.

## Editing Guardrails

- Own only the files needed for the current task. This repository may have
  parallel work in progress.
- Do not revert changes made by others. Inspect unexpected diffs before
  deciding whether they are related to your task.
- Do not make the private `themes/scanlines` theme public.
- Do not move the lab back to the repository root.
- Do not commit generated `public/`, `lab/dist/`, `.terraform/`,
  `terraform/terraform.tfstate*`, `terraform/tfplan`, or `data/build.json`.
- Do commit `terraform/.terraform.lock.hcl` when Terraform provider locks are
  intentionally updated.
- Keep Hugo templates, theme CSS/JS, lab source, Terraform, package files,
  tests, and deployment config untouched unless the task explicitly asks for
  those changes.

## Visual And UX Guardrails

- The production site should keep the scanlines background as a defining visual
  field.
- Logo presence should remain dim, frosted, and atmospheric outside intentional
  identity lockups. Avoid placing a hard logo symbol in the center of the hero.
- The lab keeps its right-rail control model. Controls should stay dense,
  operational, and readable rather than becoming generic floating cards.
- Presets, effects, logo instruments, and interactive experimentation are
  lab-controlled. Do not duplicate lab-only controls into Hugo templates.
- Product examples should remain concrete and tied to `undef games`.
- Scanline, graph-paper, CRT, and glitch effects should remain independently
  understandable and independently controllable where the lab exposes them.

## Testing Expectations

Before pushing or deploying documentation-only changes, run at least:

```sh
git diff --check
```

For source, layout, styling, interaction, or deployment workflow changes, run
the narrowest relevant checks first, then broaden before claiming completion:

```sh
make typecheck
make test
make e2e
```

Run the full `make e2e` before deployment or when changing shared layout,
routes, Hugo templates, scanline behavior, lab mounting, presets, section toys,
or Pixi behavior. When changing labels, controls, CSS variables, baseline
colors, routes, or artifact paths, update the tests that protect those
decisions instead of weakening assertions.

If Playwright local server binding is blocked by the sandbox, request the
normal local-server approval path. Do not change app ports or tests to work
around sandbox limits.

## Git Checklist

Before committing:

```sh
git status --short
git diff --check
```

Confirm the diff contains only intentional files. If the task is documentation
only and the diff is limited to `AGENTS.md` and/or `README.md`, a build is not
needed.
