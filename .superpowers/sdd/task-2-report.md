# Task 2 Report: Behavioral tests for lab logo system

## Status: DONE

## Commit

`3f0fb9d` — test(lab): cover logo system, marks, lab-entrance-config, lanes

## Per-file coverage (scoped runs)

| File | Stmts | Branch | Funcs | Lines |
|---|---|---|---|---|
| `lab/src/logo/logo-system.ts` | 100% (2/2) | 100% (2/2) | 100% (1/1) | 100% (2/2) |
| `lab/src/logo/logo-mark.tsx` | 100% (13/13) | 100% (50/50) | 100% (5/5) | 100% (13/13) |
| `lab/src/logo/logo-wordmark.tsx` | 100% (3/3) | 100% (2/2) | 100% (1/1) | 100% (3/3) |
| `lab/src/logo/logo-compact.tsx` | 100% (2/2) | 100% (0/0) | 100% (1/1) | 100% (2/2) |
| `lab/src/app/lab-entrance-config.ts` | 100% (1/1) | 100% (0/0) | 100% (0/0) | 100% (1/1) |
| `lab/src/concepts/lanes.ts` | 100% (1/1) | 100% (0/0) | 100% (0/0) | 100% (1/1) |

## Per-file branches/props covered

### logo-system.ts
- `getLogoSystem` for all 3 known concept ids: `define-the-game`, `command-console`, `rule-board`
- Unknown/unmapped concept id → fallback to `define-the-game` (the `??` branch)
- All fields asserted per concept (id, wordmark, compact, descriptor, layout, scene, phases)

### logo-mark.tsx
- `decorative=false` (default): role=img, aria-label set, aria-hidden absent
- `decorative=true`: aria-hidden=true, role absent, aria-label absent
- Custom `accessibleLabel` value asserted
- `data-concept` attribute per concept
- **define-the-game glyph**: phase 0 (squiggly path, no border), phase 1 (border at strokeWidth=2), phase 2 (filled triangle, border at strokeWidth=4); progress 0/1/2/3 controls circle r=3 vs r=6 counts; `progress` defaults to `phase`
- **command-console glyph**: border rect present; progress 0 → narrow (w=16) dim lines; progress 1 → first line widened (w=34, accent); progress 2 → second line widened (w=42, accent); phase 0 → short bottom path; phase 2 → arrow path
- **rule-board glyph**: 9 tiles; progress 0 → 1 active tile (index 4); progress 1 → 2 active; progress 2 → 4 active; route path `d` value at progress 0/2/3

### logo-wordmark.tsx
- Wordmark text per concept (3 concepts)
- `data-concept` and `data-layout` per concept
- Phase name lookup at phase 0/1/2 for define-the-game (`undefined`/`resolving`/`playable`)
- Phase modulo wrapping (phase=3 → `undefined`)
- `progress` shown independently from phase
- `progress` defaults to `phase`

### logo-compact.tsx
- Compact text per concept (3 concepts: `??/>`, `>_`, `R-6`)
- `data-concept` and `data-layout` per concept

### lab-entrance-config.ts
- Every field asserted individually and as a combined `toEqual` snapshot

### concepts/lanes.ts
- Length exactly 3
- Each lane value at each index
- Full ordered tuple assertion

## Lab suite result

16 test files, 122 tests — all passed. Duration ~2.8s.

## v8 ignores

None. No dead branches identified.

## Files changed

| File | Change |
|---|---|
| `lab/src/logo/logo-system.test.ts` | Created (5 tests) |
| `lab/src/logo/logo-mark.test.tsx` | Created (28 tests) |
| `lab/src/logo/logo-wordmark.test.tsx` | Created (11 tests) |
| `lab/src/logo/logo-compact.test.tsx` | Created (5 tests) |
| `lab/src/app/lab-entrance-config.test.ts` | Created (9 tests) |
| `lab/src/concepts/lanes.test.ts` | Created (5 tests) |

## Concerns

None.

## Review fix note (feat/lab-coverage)

Four review findings addressed:

1. **phase-1 path exercised** — `logo-mark.test.tsx`: "renders the short bottom path at phase 0 and 1" now rerenders with `phase={1}` and asserts the same `d='M64 88h20'`, making the description accurate and the phase-1 branch exercised.
2. **Rule-board tile discrimination** — strengthened the 9-tile count test to also assert that the 8 inactive tiles each carry `opacity='0.42'` (from source) alongside the 1 active tile at `opacity='1'`, so active vs inactive opacity branches are both verified.
3. **Unfilled dot fill asserted** — the `progress=0` circle test now also asserts `fill=defineConcept.colorTokens.foreground` (`'#f6f2e8'`) on each unfilled dot, matching the filled-side `fill=accent` check.
4. **Redundant test pruned** — removed the "not the same object" test from `logo-system.test.ts`; its `id/wordmark/layout` inequality assertions were fully redundant with the exact-value tests above it.

Coverage post-fix: logo-mark.tsx 100% stmts/branches/funcs/lines; logo-system.ts 100% stmts/branches/funcs/lines. Full suite: 16 files, 121 tests, all passed.
