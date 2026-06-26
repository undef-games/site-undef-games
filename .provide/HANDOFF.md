# HANDOFF — coverage gating, button theme, deploy + theme-toggle a11y

**Date:** 2026-06-26
**Repos:** `undef-logos` (this repo — Hugo site + Vite lab) and its sibling `scanlines-system` (the extracted theme/scene package, consumed via `lab/node_modules/@undef-games/scanlines-system → ../../../../scanlines-system`).

## Problem / request

A multi-thread continuation session driven by the standing policy: **all code 100% tested (gated, not just "tests exist") and dependencies on the latest major/minor/patch (fail-forward)**. On top of that, follow-on UI work (a reusable button theme), a production deploy, and an accessibility fix to the live theme toggle.

## Changes requested + completed

1. **Coverage push — all three first-party TS surfaces are now 100% gated** (logic/React-DOM gated at 100%; Pixi/canvas shells excluded + verified by a lab scene e2e):
   - `scanlines-system` (the package) — flipped the vitest gate from an opt-in **allow-list** to an all-`src` **exclude-list** so new files can't silently slip the gate. Merged @ `b960402`.
   - `undef-logos/lab` — added a coverage gate (it had none); **de-duped 9 station re-export shims** so the lab imports the package directly; filled real holes (one file was 0% — its test never imported the source). Merged @ `c063f04`.
   - `themes/scanlines/assets/ts` (the 2 hugo glue files) — stood up a **new root `vitest.config.ts`** (the repo had none) and unit-tested them with the package **mocked**; added a `make test-assets` target. Merged @ `3aadba0`.
2. **Dependency bumps** to latest; **`npm audit fix`** on the lab resolved a high-severity `undici` advisory (transitive via `jsdom`, a devDep). Now 0 vulns across all three package roots. Last commit `8ecd929`.
3. **Reusable button-variant theme** — added a `variant` prop to the package's `ScanlinesButton` (`primary | ghost | warning | danger | success`, CSS-var-driven, themeable per tone). Applied across the lab controls via one central `lab/src/ui/control-variants.ts` map; reset buttons read red `danger`. Fixed a CSS specificity bug where the lab's container button styles were overriding the variant classes (scoped them `:not(.scanlines-button)`), and tuned contrast for both dark and light. Package merged @ `678a0fd`; lab merged into `8ecd929`.
4. **Deploy + theme-toggle a11y** — deployed `public/` to Cloudflare Pages production (`undef.games`); fixed `theme-hydrate.ts` so the toggle's `aria-label`/`aria-pressed` track the active tone (was static). Verified live. WARP (`warp.undef.games`) was checked — it has **no** scanlines theme toggle (separate app).

## Reasoning for approach

- **Logic/visual rule:** unit-testing Pixi against mocks tests the mock, not the render — so canvas shells (`site-app.tsx`, `station-signal-scene.tsx`) are excluded from the unit gate and covered by `tests/e2e/scene-smoke.spec.ts`; their computational logic lives in separate, fully-gated files.
- **Exclude-list over allow-list:** an allow-list silently ungates new files (this exact gap shipped once). The exclude-list + `coverage.all` means a new untested file fails CI by default.
- **Mock the package for the hugo glue:** the package logic is already 100% gated in `scanlines-system`; the glue tests assert *its own* orchestration (which package fn is called, the DOM/event it produces), not the package.
- **Button variants live in the package** so the site, lab, and resets all draw from one reusable, themeable source.

## Summary of work done (current state)

- `scanlines-system` main @ **`678a0fd`** (pushed) — entrance widget + 100% gate + button variants + contrast.
- `undef-logos` working branch `chore/main-local` @ **`8ecd929`** == `origin/main` (pushed) — extraction + lab gate + hugo gate + button variants/danger resets + theme-toggle aria fix + undici audit fix. Local `main` branch refreshed to match.
- **undef.games is live, deployed @ `450b401`** (the theme-toggle fix). The one newer commit `8ecd929` (undici fix) is **dev-only and not in the shipped bundle** → prod is functionally current; a redeploy would only bump the build-stamp SHA (deliberately skipped).
- All five SDD plan docs stamped `✅ Complete`. SDD progress ledgers live at `.superpowers/sdd/progress.md` in each repo (gitignored scratch).

## Detailed checklist for next session

**Key facts (read first):**
- **Deploy is manual + local:** `make deploy` (= `make build` then `wrangler pages deploy public --project-name=undef-logos --branch=main`). **No CI/auto-deploy** — pushing `main` publishes nothing. `wrangler` is authed locally.
- The package is consumed via **`file:../../scanlines-system`** (sibling symlink) — builds use the *local* package checkout; that's why deploys are local (a CI runner has no sibling repo).
- Standing policies (see `~/.claude/.../memory/`): **100% gated coverage**; **deps on latest, fail-forward, discuss incompatibilities** (`testing-and-dependency-policy`). The lab boots at CH 00 / signal 0 (sandbox) vs home CH 13 / signal 50 — "lab scanlines slow" is **by-design**, not a bug (`lab-vs-home-signal-defaults`).
- Git: no rollbacks; no AI mention in commit messages; sign with `git -c commit.gpgsign=false`.

**Open / optional (none blocking):**
- [ ] (optional) Extend button variants to the site's **CTA links** — they're `<a>`, not `<button>`, so `ScanlinesButton` doesn't apply directly; would need a shared variant class or a link variant.
- [ ] (optional) Add a root `tsconfig` so the **hugo TS assets get `tsc`-typechecked** (today they're transpiled + unit-gated, but not type-checked).
- [ ] (optional) Reconcile the lab's divergent **`station-signal-scene.tsx`** (325 lines) vs the package scene (387) — the lab kept its own variant; scanline speed math is byte-identical, so this is cosmetic/maintenance only.
- [ ] Housekeeping: an **orphaned Octowright browser window** may still be open (its MCP dropped repeatedly mid-session) — close manually or it clears on reconnect.
- [ ] If redeploying: prod stamp is `450b401`; nothing user-facing pending.
