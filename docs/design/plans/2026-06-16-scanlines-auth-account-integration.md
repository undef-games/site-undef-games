# Scanlines Auth and Account Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `packages/scanlines-system` the shared visual source of truth for `undef.games`, `undef-auth`, and `undef-account`, while keeping each repo on its own worktree and preserving the dedicated auth/account product boundaries.

**Architecture:** Expand `scanlines-system` from a site runtime package into a full shared UI system with tokens, shell variants, primitives, and restrained surface profiles for `site`, `auth`, and `account`. Migrate `undef-account/frontend` first because it is already a React/Vite consumer, then migrate `undef-auth` by replacing inline style ownership with shared shell and template helpers.

**Tech Stack:** Hugo, TypeScript, React, Vite, PixiJS, Vitest, Playwright, Cloudflare Workers, Hono

---

## File Structure

### Coordination repo: `undef-logos`

- `docs/design/specs/2026-06-16-scanlines-auth-account-integration.md`
  - approved design spec
- `docs/design/plans/2026-06-16-scanlines-auth-account-integration.md`
  - this implementation plan
- `packages/scanlines-system/src/theme/`
  - shared token resolution, tone helpers, storage contract
- `packages/scanlines-system/src/shell/`
  - shared header shell, brand mark, nav primitives, surface variants
- `packages/scanlines-system/src/primitives/`
  - button, input, panel, notice, pill, field-group primitives
- `packages/scanlines-system/src/styles/`
  - shared CSS entrypoints and surface-variant styles
- `packages/scanlines-system/src/index.ts`
  - package exports consumed by site, auth, and account

### Consumer repo: `undef-account`

- `frontend/package.json`
  - local package dependency on `@undef/scanlines-system`
- `frontend/src/main.tsx`
  - shared theme initialization and stylesheet imports
- `frontend/src/App.tsx`
  - account shell consumption, account nav integration
- `frontend/src/theme.ts`
  - reduced or removed in favor of shared package
- `frontend/src/styles.css`
  - reduced to account-specific layout/workflow CSS
- `frontend/src/App.test.tsx`
  - account-shell and nav expectations
- `frontend/src/theme.test.ts`
  - shared theme hydration compatibility checks

### Consumer repo: `undef-auth`

- `package.json`
  - local package dependency on `@undef/scanlines-system`
- `src/ui.ts`
  - stop owning inline source-of-truth CSS; compose auth pages from shared shell/templates
- `src/defaults.ts`
  - auth host/site link defaults if needed by shared shell
- `src/index.ts`
  - package wiring if shared helpers need export surfacing
- `src/*.test.ts`
  - auth template rendering and route shell expectations

### Worktree layout

Implementation should happen in separate worktrees, not on checked-out mains:

- `undef-logos/.worktrees/scanlines-auth-account-system`
- `undef-account/.worktrees/scanlines-account-integration`
- `undef-auth/.worktrees/scanlines-auth-integration`

If those exact worktrees already exist, reuse them only if clean and dedicated to this effort. Otherwise create fresh ones with clear branch names.

---

### Task 1: Create dedicated worktrees for the three-repo rollout

**Files:**
- Modify: no source files yet
- Test: `git worktree list` in each repo

- [ ] **Step 1: Create the `undef-logos` worktree**

Run:

```bash
cd /Users/tim/code/gh/undef-games/undef-logos
git worktree add .worktrees/scanlines-auth-account-system -b feat/scanlines-auth-account-system main
```

Expected:
- a new clean worktree at `undef-logos/.worktrees/scanlines-auth-account-system`

- [ ] **Step 2: Create the `undef-account` worktree**

Run:

```bash
cd /Users/tim/code/gh/undef-games/undef-account
git worktree add .worktrees/scanlines-account-integration -b feat/scanlines-account-integration main
```

Expected:
- a new clean worktree at `undef-account/.worktrees/scanlines-account-integration`

- [ ] **Step 3: Create the `undef-auth` worktree**

Run:

```bash
cd /Users/tim/code/gh/undef-games/undef-auth
git worktree add .worktrees/scanlines-auth-integration -b feat/scanlines-auth-integration main
```

Expected:
- a new clean worktree at `undef-auth/.worktrees/scanlines-auth-integration`

- [ ] **Step 4: Verify all three worktrees are isolated**

Run:

```bash
git -C /Users/tim/code/gh/undef-games/undef-logos worktree list
git -C /Users/tim/code/gh/undef-games/undef-account worktree list
git -C /Users/tim/code/gh/undef-games/undef-auth worktree list
```

Expected:
- each repo shows the new worktree and branch

- [ ] **Step 5: Commit nothing here**

There should be no source changes yet. This task only establishes isolation.

---

### Task 2: Expand `scanlines-system` into a shared shell and primitives package

**Files:**
- Create: `packages/scanlines-system/src/shell/header.tsx`
- Create: `packages/scanlines-system/src/shell/nav.tsx`
- Create: `packages/scanlines-system/src/shell/brand-mark.tsx`
- Create: `packages/scanlines-system/src/shell/surface-config.ts`
- Create: `packages/scanlines-system/src/primitives/button.tsx`
- Create: `packages/scanlines-system/src/primitives/panel.tsx`
- Create: `packages/scanlines-system/src/primitives/field.tsx`
- Create: `packages/scanlines-system/src/primitives/notice.tsx`
- Create: `packages/scanlines-system/src/styles/shell-auth.css`
- Create: `packages/scanlines-system/src/styles/shell-account.css`
- Modify: `packages/scanlines-system/src/index.ts`
- Modify: `packages/scanlines-system/src/styles/site.css`
- Modify: `packages/scanlines-system/package.json`
- Test: new unit tests under `packages/scanlines-system/src/**/*.test.tsx`

- [ ] **Step 1: Write failing tests for shared shell variants and primitives**

Create `packages/scanlines-system/src/shell/header.test.tsx` with:

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ScanlinesHeader } from './header'

describe('ScanlinesHeader', () => {
  it('renders site navigation on the site surface', () => {
    render(
      <ScanlinesHeader
        surface="site"
        brandLabel="undef games"
        navItems={[
          { href: '/games/', label: 'Games' },
          { href: '/logs/', label: 'Logs' },
          { href: '/about/', label: 'About' },
        ]}
      />,
    )

    expect(screen.getByRole('link', { name: 'Games' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Logs' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'About' })).toBeInTheDocument()
  })

  it('renders a back-to-site utility on the auth surface', () => {
    render(
      <ScanlinesHeader
        surface="auth"
        brandLabel="undef games"
        utilityAction={{ href: 'https://undef.games/', label: 'Back to site' }}
      />,
    )

    expect(screen.getByRole('link', { name: 'Back to site' })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run:

```bash
cd /Users/tim/code/gh/undef-games/undef-logos/.worktrees/scanlines-auth-account-system
npm --prefix lab run test:run -- ../packages/scanlines-system/src/shell/header.test.tsx
```

Expected:
- FAIL because `ScanlinesHeader` and related modules do not exist yet

- [ ] **Step 3: Add the shared shell config**

Create `packages/scanlines-system/src/shell/surface-config.ts`:

```ts
export type ScanlinesSurface = 'site' | 'auth' | 'account'

export interface ScanlinesNavItem {
  href: string
  label: string
  current?: boolean
}

export interface ScanlinesUtilityAction {
  href: string
  label: string
}
```

- [ ] **Step 4: Implement the shared header and brand mark**

Create `packages/scanlines-system/src/shell/header.tsx` and `brand-mark.tsx` with a focused API:

```tsx
import type { ReactNode } from 'react'
import { BrandMark } from './brand-mark'
import type { ScanlinesNavItem, ScanlinesSurface, ScanlinesUtilityAction } from './surface-config'

export function ScanlinesHeader({
  surface,
  brandLabel,
  navItems = [],
  utilityAction,
  accountSlot,
}: {
  surface: ScanlinesSurface
  brandLabel: string
  navItems?: ScanlinesNavItem[]
  utilityAction?: ScanlinesUtilityAction
  accountSlot?: ReactNode
}) {
  return (
    <header className={`scanlines-header scanlines-header--${surface}`}>
      <a className="scanlines-header__brand" href="/">
        <BrandMark />
        <span>{brandLabel}</span>
      </a>
      <nav className="scanlines-header__nav" aria-label={`${surface} navigation`}>
        {navItems.map((item) => (
          <a key={item.href} href={item.href} aria-current={item.current ? 'page' : undefined}>
            {item.label}
          </a>
        ))}
      </nav>
      <div className="scanlines-header__utilities">
        {utilityAction ? <a href={utilityAction.href}>{utilityAction.label}</a> : null}
        {accountSlot}
      </div>
    </header>
  )
}
```

- [ ] **Step 5: Add shared primitive components and CSS entrypoints**

Create minimal shared primitives:

```tsx
// packages/scanlines-system/src/primitives/button.tsx
export function ScanlinesButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} className={['scanlines-button', props.className].filter(Boolean).join(' ')} />
}
```

```tsx
// packages/scanlines-system/src/primitives/panel.tsx
import type { ReactNode } from 'react'

export function ScanlinesPanel({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="scanlines-panel">
      {title ? <h2>{title}</h2> : null}
      {children}
    </section>
  )
}
```

Add shared CSS imports in `packages/scanlines-system/src/styles/site.css`:

```css
@import './tokens.css';
@import './reset.css';
@import './shell.css';
@import './shell-auth.css';
@import './shell-account.css';
```

- [ ] **Step 6: Export the new package surface**

Update `packages/scanlines-system/src/index.ts`:

```ts
export * from './shell/header'
export * from './shell/brand-mark'
export * from './shell/surface-config'
export * from './primitives/button'
export * from './primitives/panel'
export * from './primitives/field'
export * from './primitives/notice'
```

- [ ] **Step 7: Run focused and package-wide verification**

Run:

```bash
cd /Users/tim/code/gh/undef-games/undef-logos/.worktrees/scanlines-auth-account-system
make typecheck-system
make test
```

Expected:
- PASS

- [ ] **Step 8: Commit**

```bash
git add packages/scanlines-system
git commit -m "feat: add shared scanlines shell primitives"
```

---

### Task 3: Migrate `undef-account/frontend` to consume `scanlines-system`

**Files:**
- Modify: `frontend/package.json`
- Modify: `frontend/src/main.tsx`
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/theme.ts`
- Modify: `frontend/src/styles.css`
- Modify: `frontend/src/theme.test.ts`
- Modify: `frontend/src/App.test.tsx`
- Test: `frontend/src/App.test.tsx`, `frontend/src/theme.test.ts`

- [ ] **Step 1: Write a failing account-shell test**

Update `frontend/src/App.test.tsx` with:

```tsx
it('renders account-native nav plus back-to-site in the shared header', async () => {
  render(<App />)
  expect(await screen.findByRole('link', { name: 'Overview' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Security' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Back to site' })).toBeInTheDocument()
})
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run:

```bash
cd /Users/tim/code/gh/undef-games/undef-account/.worktrees/scanlines-account-integration/frontend
npm run test -- src/App.test.tsx
```

Expected:
- FAIL because the shared header is not wired into account yet

- [ ] **Step 3: Add the shared package dependency**

Update `frontend/package.json`:

```json
{
  "dependencies": {
    "@undef/scanlines-system": "file:../../undef-logos/packages/scanlines-system"
  }
}
```

Adjust the relative path to point at the `undef-logos` repo root from the account worktree.

- [ ] **Step 4: Replace local theme ownership with shared imports**

Update `frontend/src/main.tsx` to use:

```tsx
import '@undef/scanlines-system/styles/site.css'
import './styles.css'
```

Update `frontend/src/theme.ts` to become a thin wrapper or remove it entirely in favor of:

```ts
export {
  THEME_STORAGE_KEY,
  applyThemeFromStorage,
  getSignalColor,
  saveSignalColor,
} from '@undef/scanlines-system'
```

- [ ] **Step 5: Refactor `App.tsx` to use shared shell primitives**

Replace locally owned header/brand structures with shared components:

```tsx
import {
  ScanlinesHeader,
  ScanlinesPanel,
  ScanlinesButton,
} from '@undef/scanlines-system'
```

Use:

```tsx
<ScanlinesHeader
  surface="account"
  brandLabel="undef games"
  navItems={[
    { href: '#summary', label: 'Overview' },
    { href: '#profile', label: 'Profile' },
    { href: '#security', label: 'Security' },
    { href: '#sessions', label: 'Sessions' },
    { href: '#apps', label: 'Apps' },
  ]}
  utilityAction={{ href: 'https://undef.games/', label: 'Back to site' }}
/>
```

Keep account-specific workflow layout local in `styles.css`, but remove duplicated tokens, brand mark visuals, button primitives, and scanline theme ownership.

- [ ] **Step 6: Run account verification**

Run:

```bash
cd /Users/tim/code/gh/undef-games/undef-account/.worktrees/scanlines-account-integration/frontend
npm install
npm run typecheck
npm run test
npm run build
```

Expected:
- PASS

- [ ] **Step 7: Commit**

```bash
git add frontend/package.json frontend/src/main.tsx frontend/src/App.tsx frontend/src/theme.ts frontend/src/styles.css frontend/src/App.test.tsx frontend/src/theme.test.ts
git commit -m "refactor: adopt scanlines system in account frontend"
```

---

### Task 4: Migrate `undef-auth` to shared shell and primitive ownership

**Files:**
- Modify: `package.json`
- Modify: `src/ui.ts`
- Modify: `src/defaults.ts`
- Test: `src/ui.test.ts` or existing auth UI tests if present

- [ ] **Step 1: Add a failing auth template test**

Create `src/ui.test.ts` if needed with:

```ts
import { describe, expect, it } from 'vitest'
import { loginTemplate } from './ui'

describe('loginTemplate', () => {
  it('renders the shared auth shell with a back-to-site link', () => {
    const html = loginTemplate()
    expect(html).toContain('Back to site')
    expect(html).toContain('scanlines-header')
  })
})
```

- [ ] **Step 2: Run the focused auth UI test and verify it fails**

Run:

```bash
cd /Users/tim/code/gh/undef-games/undef-auth/.worktrees/scanlines-auth-integration
npm run test -- src/ui.test.ts
```

Expected:
- FAIL because auth still owns inline shell/style composition

- [ ] **Step 3: Add the shared package dependency**

Update `package.json`:

```json
{
  "dependencies": {
    "@undef/scanlines-system": "file:../undef-logos/packages/scanlines-system"
  }
}
```

Adjust the path if the worktree-relative layout requires it.

- [ ] **Step 4: Replace inline style ownership with shared helpers**

Refactor `src/ui.ts` so that:

- theme hydration script generation comes from the shared package
- header shell markup comes from the shared package
- auth page wrappers come from the shared package
- page-specific forms remain local

Target composition shape:

```ts
import {
  renderAuthShell,
  renderBrandMark,
  authThemeHydrationScript,
} from '@undef/scanlines-system'
```

Then auth-specific templates provide only:

- title
- body copy
- form markup
- route-specific scripts

The long `baseStyles` source-of-truth string in `src/ui.ts` should be reduced to auth-only exceptions or removed.

- [ ] **Step 5: Keep auth flow logic local**

Do not move:

- `fetch("/auth/sign-in/email", ...)`
- MFA verification logic
- forgot/reset flow logic
- consent flow logic

Only replace shell and visual ownership.

- [ ] **Step 6: Run auth verification**

Run:

```bash
cd /Users/tim/code/gh/undef-games/undef-auth/.worktrees/scanlines-auth-integration
npm install
npm run typecheck
npm run test
```

Expected:
- PASS

- [ ] **Step 7: Commit**

```bash
git add package.json src/ui.ts src/defaults.ts src/ui.test.ts
git commit -m "refactor: adopt scanlines system in auth ui"
```

---

### Task 5: Add cross-repo verification notes and integration checks in `undef-logos`

**Files:**
- Modify: `docs/design/specs/2026-06-16-scanlines-auth-account-integration.md` if implementation clarifications are needed
- Modify: `AGENTS.md` if cross-repo dependency guidance belongs there
- Create: `docs/design/specs` or `docs/design/plans` follow-up notes only if necessary

- [ ] **Step 1: Add a cross-repo verification checklist to the plan consumer notes**

Document exact checks to run after the three branches are ready:

```bash
cd /Users/tim/code/gh/undef-games/undef-logos/.worktrees/scanlines-auth-account-system
make typecheck
make test
make build
npm exec playwright test

cd /Users/tim/code/gh/undef-games/undef-account/.worktrees/scanlines-account-integration/frontend
npm run typecheck
npm run test
npm run build

cd /Users/tim/code/gh/undef-games/undef-auth/.worktrees/scanlines-auth-integration
npm run typecheck
npm run test
```

- [ ] **Step 2: Verify theme contract consistency explicitly**

Check that all three codebases use:

```ts
const THEME_STORAGE_KEY = 'undef-logos-theme'
```

and that no service redefines conflicting palette defaults after migration.

- [ ] **Step 3: Commit only if repo docs changed**

```bash
git add AGENTS.md docs/design/specs docs/design/plans
git commit -m "docs: add cross repo scanlines verification notes"
```

Skip this commit if no docs changed during execution.

---

### Task 6: Land the three branches in order

**Files:**
- Modify: no source files in this task
- Test: final verification on merged branches

- [ ] **Step 1: Merge `undef-logos` first**

Run:

```bash
cd /Users/tim/code/gh/undef-games/undef-logos/.worktrees/scanlines-auth-account-system
git status --short
git log --oneline -3
```

Expected:
- clean tree
- branch commits ready for merge

Merge into `main` only after package verification is green.

- [ ] **Step 2: Merge `undef-account` second**

Merge the account consumer after the shared package branch is available locally and verified.

- [ ] **Step 3: Merge `undef-auth` third**

Merge auth last so the final shared shell contract is already stable.

- [ ] **Step 4: Run final cross-repo verification**

Run the full verification commands from Task 5 after all three branches are merged locally.

- [ ] **Step 5: Push/deploy only after explicit approval**

Do not deploy `undef.games`, `auth.undef.games`, or `account.undef.games` from this plan automatically. Deployment remains a separate, explicit step after merged verification.
