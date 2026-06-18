# Accessibility and Test ID Standardization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Standardize accessibility semantics and conditional `data-testid` support across the shared scanlines shell, auth flows, and account portal.

**Architecture:** The shared accessibility and selector contract starts in `undef-logos` and is applied to consumer surfaces in `undef-auth` and `undef-account`. The implementation adds small, explicit helpers for conditional `data-testid` emission, upgrades auth form semantics and state wiring, and normalizes shared shell/account control semantics without changing the visual design.

**Tech Stack:** Hugo templates, TypeScript, React, worker-rendered HTML templates, Vitest, Playwright, npm

---

## File Structure

### `undef-logos`

- Modify: `themes/scanlines/layouts/partials/header.html`
  - Add stable shared-shell `data-testid` hooks and preserve existing landmarks.
- Modify: `themes/scanlines/layouts/partials/lab-link.html`
  - Add shared utility control semantics and `data-testid` hooks.
- Modify: `themes/scanlines/assets/ts/theme-hydrate.ts`
  - Expose theme-toggle pressed state and keep label updates in sync.
- Create or modify: `themes/scanlines/layouts/partials/testid.html` or equivalent helper location
  - Provide Hugo-side conditional test-id emission helper.
- Test: `tests/e2e/site.spec.ts`
  - Verify new ARIA state and test-id behavior.

### `undef-auth`

- Modify: `src/ui.ts`
  - Add auth test-id helper.
  - Add explicit labels/ids for form fields.
  - Wire errors with `aria-describedby` and `aria-invalid`.
  - Upgrade password toggle accessibility.
  - Add stable shell and scanline-field test ids.
- Test: `tests/oidc-routes.test.ts`
  - Verify auth HTML contains accessible labels, describedby wiring, and conditional test ids.

### `undef-account`

- Modify: `frontend/src/App.tsx`
  - Add conditional test-id helper usage.
  - Normalize grouped control semantics.
  - Add stable test ids to nav, auth-error CTA, theme swatches, and key actions.
- Modify: `frontend/src/theme.ts` or runtime config surface if needed
  - Add simple environment-driven test-id flag if the helper needs a shared source.
- Test: `frontend/src/App.test.tsx`
  - Verify semantics and test-id output for loading, auth-error, nav, and theme controls.

---

### Task 1: Shared Site Shell Accessibility Contract

**Files:**
- Modify: `undef-logos/.worktrees/scanlines-auth-account-system/themes/scanlines/layouts/partials/header.html`
- Modify: `undef-logos/.worktrees/scanlines-auth-account-system/themes/scanlines/layouts/partials/lab-link.html`
- Modify: `undef-logos/.worktrees/scanlines-auth-account-system/themes/scanlines/assets/ts/theme-hydrate.ts`
- Create: `undef-logos/.worktrees/scanlines-auth-account-system/themes/scanlines/layouts/partials/testid.html`
- Test: `undef-logos/.worktrees/scanlines-auth-account-system/tests/e2e/site.spec.ts`

- [ ] **Step 1: Write the failing site assertions**

Add checks to `tests/e2e/site.spec.ts` for:

```ts
await expect(page.getByTestId('site-theme-toggle')).toHaveAttribute('aria-pressed', 'false')
await expect(page.getByTestId('site-login-link')).toBeVisible()
await expect(page.getByTestId('site-lab-link')).toBeVisible()
```

Also add a negative-path test for the no-test-id mode if the site exposes a flag-controlled build fixture.

- [ ] **Step 2: Run the focused site test and verify failure**

Run:

```bash
cd /Users/tim/code/gh/undef-games/undef-logos/.worktrees/scanlines-auth-account-system
npm exec playwright test tests/e2e/site.spec.ts
```

Expected: FAIL because the test ids and `aria-pressed` are not present yet.

- [ ] **Step 3: Add a Hugo helper for conditional test ids**

Create `themes/scanlines/layouts/partials/testid.html` with a helper like:

```gotemplate
{{- $value := .value -}}
{{- $enabled := default false site.Params.enable_test_ids -}}
{{- if $enabled -}} data-testid="{{ $value }}"{{- end -}}
```

If site params already expose a staging/debug flag, reuse it instead of inventing a second one.

- [ ] **Step 4: Add site shell test ids and utility grouping semantics**

Update header and utility partials along these lines:

```html
<a class="site-header__brand" href="/" aria-label="{{ site.Params.site_name }} home" {{ partial "testid.html" (dict "value" "site-brand-home") | safeHTMLAttr }}>
```

```html
<button class="theme-quick-toggle" type="button" aria-label="Switch to light mode" aria-pressed="false" data-theme-toggle {{ partial "testid.html" (dict "value" "site-theme-toggle") | safeHTMLAttr }}>
```

```html
<a class="site-header__login" href="{{ site.Params.login_url }}" {{ partial "testid.html" (dict "value" "site-login-link") | safeHTMLAttr }}>
```

Use `role="group"` on the utility cluster if it remains a generic container.

- [ ] **Step 5: Keep the toggle state synchronized in the hydration script**

Update `theme-hydrate.ts` so the existing tone switch code also updates:

```ts
toggle.setAttribute('aria-pressed', activeTone === 'dark' ? 'true' : 'false')
```

and still updates the label text correctly.

- [ ] **Step 6: Run the focused site test to verify pass**

Run:

```bash
cd /Users/tim/code/gh/undef-games/undef-logos/.worktrees/scanlines-auth-account-system
npm exec playwright test tests/e2e/site.spec.ts
```

Expected: PASS

- [ ] **Step 7: Commit**

```bash
cd /Users/tim/code/gh/undef-games/undef-logos/.worktrees/scanlines-auth-account-system
git add themes/scanlines/layouts/partials/header.html \
  themes/scanlines/layouts/partials/lab-link.html \
  themes/scanlines/layouts/partials/testid.html \
  themes/scanlines/assets/ts/theme-hydrate.ts \
  tests/e2e/site.spec.ts
git commit -m "feat: add accessible site shell test hooks"
```

### Task 2: Auth Form Accessibility and Test IDs

**Files:**
- Modify: `undef-auth/src/ui.ts`
- Test: `undef-auth/tests/oidc-routes.test.ts`

- [ ] **Step 1: Write failing auth HTML assertions**

Add assertions like:

```ts
expect(html).toContain('data-testid="auth-login-form"')
expect(html).toContain('for="auth-login-email"')
expect(html).toContain('id="auth-login-email"')
expect(html).toContain('aria-describedby="auth-login-error"')
expect(html).toContain('data-testid="auth-back-button"')
expect(html).toContain('data-testid="auth-scanline-field"')
```

- [ ] **Step 2: Run the focused auth tests and verify failure**

Run:

```bash
cd /Users/tim/code/gh/undef-games/undef-auth
npm run test -- tests/oidc-routes.test.ts
```

Expected: FAIL because the auth HTML does not yet contain the labels and ids.

- [ ] **Step 3: Add a tiny auth-side test-id helper**

In `src/ui.ts`, add a helper like:

```ts
function testIdAttr(value: string): string {
  return process.env.ENABLE_TEST_IDS === "true" ? ` data-testid="${value}"` : "";
}
```

If auth already has a runtime/debug env helper, route through it instead of reading `process.env` directly in multiple places.

- [ ] **Step 4: Convert placeholder-only auth fields into explicitly labelled controls**

Update templates from:

```html
<input name="email" type="email" autocomplete="email" placeholder="Email" required>
```

to a labelled structure like:

```html
<label for="auth-login-email">Email</label>
<input id="auth-login-email" name="email" type="email" autocomplete="email" placeholder="Email" required aria-describedby="auth-login-error">
```

Repeat for signup, forgot-password, reset, MFA, TOTP setup, and password fields.

- [ ] **Step 5: Wire error state and password toggle semantics**

Update the auth error element and field behavior:

```html
<p class="error" id="auth-login-error" role="alert" hidden></p>
```

And in the inline script:

```js
emailInput.setAttribute('aria-invalid', 'true')
passwordInput.setAttribute('aria-invalid', 'true')
```

When errors clear:

```js
emailInput.removeAttribute('aria-invalid')
passwordInput.removeAttribute('aria-invalid')
```

Also update the password toggle:

```html
<button type="button" class="pw-toggle" aria-label="Show password" aria-pressed="false" aria-controls="auth-login-password" data-pw-toggle>
```

And toggle:

```js
pwToggle.setAttribute('aria-pressed', show ? 'true' : 'false')
```

- [ ] **Step 6: Add auth shell and scanline field test ids**

Add stable hooks for:

```html
<main data-testid="auth-main">
<form data-testid="auth-login-form" ...>
<button ... data-testid="auth-login-submit">
<a ... data-testid="auth-back-button">
<div ... data-testid="auth-scanline-field">
```

Use the same `surface-element-action` convention everywhere.

- [ ] **Step 7: Run auth verification**

Run:

```bash
cd /Users/tim/code/gh/undef-games/undef-auth
npm run test -- tests/oidc-routes.test.ts
npm run lint
npm run typecheck
```

Expected: PASS

- [ ] **Step 8: Commit**

```bash
cd /Users/tim/code/gh/undef-games/undef-auth
git add src/ui.ts tests/oidc-routes.test.ts
git commit -m "feat: add accessible auth form contracts"
```

### Task 3: Account Semantics and Test Hooks

**Files:**
- Modify: `undef-account/frontend/src/App.tsx`
- Modify: `undef-account/frontend/src/theme.ts`
- Test: `undef-account/frontend/src/App.test.tsx`

- [ ] **Step 1: Write failing account tests**

Add tests asserting:

```tsx
expect(screen.getByTestId('account-nav-overview')).toBeInTheDocument()
expect(screen.getByTestId('account-theme-signal-blue')).toHaveAttribute('aria-pressed', 'true')
expect(screen.getByTestId('account-auth-cta')).toBeInTheDocument()
```

Also verify group semantics where applicable.

- [ ] **Step 2: Run the focused account tests and verify failure**

Run:

```bash
cd /Users/tim/code/gh/undef-games/undef-account/frontend
npm run test -- src/App.test.tsx
```

Expected: FAIL because test ids and group semantics are not present yet.

- [ ] **Step 3: Add a React-side helper for conditional test ids**

In a small local helper or existing theme/runtime config file, add:

```ts
export function testIdProps(value: string): Record<string, string> {
  return import.meta.env.VITE_ENABLE_TEST_IDS === "true" ? { "data-testid": value } : {};
}
```

Keep it small and local to the frontend app if there is no shared frontend utility file yet.

- [ ] **Step 4: Normalize grouped control semantics**

Where plain labelled `div`s represent grouped controls, use:

```tsx
<div className="theme-swatches" role="group" aria-label="Signal color">
```

and similar updates for other interactive clusters if they are not already semantically grouped.

- [ ] **Step 5: Add stable test ids to account shell and primary controls**

Use the helper to add selectors such as:

```tsx
<nav aria-label="Account sections" {...testIdProps("account-nav")}>
```

```tsx
<button {...testIdProps("account-nav-security")}>
```

```tsx
<button {...testIdProps("account-auth-cta")}>
```

```tsx
<button {...testIdProps("account-theme-signal-blue")}>
```

- [ ] **Step 6: Run account verification**

Run:

```bash
cd /Users/tim/code/gh/undef-games/undef-account/frontend
npm run test -- src/App.test.tsx src/theme.test.ts
npm run typecheck
npm run build
```

Expected: PASS

- [ ] **Step 7: Commit**

```bash
cd /Users/tim/code/gh/undef-games/undef-account
git add frontend/src/App.tsx frontend/src/theme.ts frontend/src/App.test.tsx
git commit -m "feat: add account accessibility test hooks"
```

### Task 4: Cross-Repo Verification and Deployment

**Files:**
- Verify only across the existing changed files in all three repos

- [ ] **Step 1: Run full shared-site verification**

Run:

```bash
cd /Users/tim/code/gh/undef-games/undef-logos/.worktrees/scanlines-auth-account-system
make build
make test
npm exec playwright test
```

Expected: PASS

- [ ] **Step 2: Run full auth verification**

Run:

```bash
cd /Users/tim/code/gh/undef-games/undef-auth
npm run test
npm run lint
npm run typecheck
```

Expected: PASS, or document any unrelated pre-existing failures clearly before deploy.

- [ ] **Step 3: Run full account verification**

Run:

```bash
cd /Users/tim/code/gh/undef-games/undef-account/frontend
npm run test
npm run typecheck
npm run build
```

Also run any targeted backend/account entry checks already used in prior deployments if the auth redirect path is affected.

- [ ] **Step 4: Deploy all three surfaces to staging**

Run the existing project deploy commands for:

```bash
undef-logos -> staging.undef-logos.pages.dev
undef-auth -> approach.auth.undef.games
undef-account -> approach.account.undef.games
```

Expected: successful staging deploy identifiers returned for each environment.

- [ ] **Step 5: Smoke-check staging for semantics and selectors**

Verify the staged surfaces expose:

```text
site-theme-toggle
auth-login-form
auth-back-button
account-nav
```

and that auth labels and toggle states are present in the rendered HTML.

- [ ] **Step 6: Deploy production**

Run the existing production deploy commands for:

```bash
undef.games
auth.undef.games
account.undef.games
```

Expected: successful production deploy identifiers returned for each environment.

- [ ] **Step 7: Commit any final deployment-safe config changes**

If any environment flag files or runtime-config artifacts changed as part of the rollout, commit them with:

```bash
git add <exact files>
git commit -m "chore: enable accessibility test hook rollout"
```

Only commit real source/config changes, not generated deployment noise.

## Self-Review

- Spec coverage: the plan covers shared shell semantics, auth form accessibility, account semantics, conditional `data-testid` helpers, verification, and staging/production deployment for each surface.
- Placeholder scan: no `TBD` or deferred implementation placeholders remain.
- Type consistency: the plan uses one naming convention throughout, `surface-element-action`, and one flag idea per surface rather than multiple competing contracts.
