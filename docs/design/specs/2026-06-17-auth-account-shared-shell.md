# Auth and Account Shared Shell Alignment

## Goal

Make `auth.undef.games` and `account.undef.games` consume the same actual shell, mark geometry, theme widgets, and CSS from the `scanlines-system` source of truth, with surface-level differences controlled by configuration instead of hand-maintained forks.

## Problem

The current auth/account surfaces are still structurally wrong:

- `undef-auth` hand-rolls parts of the shell and ghost-mark rendering
- `undef-account` has its own shell treatment and theme behavior
- the saved mark geometry is not actually shared, which is why the auth ghost mark can drift into the wrong shape
- “less candy” is currently implemented by different code, not by shared configuration

That creates visible drift:

- wrong `U` geometry on auth
- header framing that does not fully track the main site
- account and auth evolving independently instead of inheriting the same system

## Product Direction

The desired end state is:

- `undef.games` remains the flagship public surface
- `auth.undef.games` and `account.undef.games` use the same shell primitives and mark geometry
- auth and account differ by enabled effects, not by separate shell implementations

### Auth

- same shared shell and mark geometry
- live scanline field stays enabled
- quieter than the public homepage

### Account

- same shared shell and mark geometry
- no animated background effects for now
- same theme tokens and chrome treatment
- animation can be turned on later without reworking the shell

## Source of Truth

`packages/scanlines-system` in `undef-logos` is the only source of truth for:

- header shell geometry
- brand mark geometry
- back-button styling
- auth/account shell CSS
- shared theme token behavior
- shell-level utility interactions

`undef-auth` and `undef-account` should consume synced output from that source, not own separate geometry or shell implementations.

## Shared Pieces

The shared auth/account shell slice should include:

- header container and inner rail geometry
- brand mark widget
- brand text treatment
- utility button treatment
- shell width/inset contract
- shared theme CSS variables and token expectations
- ghost-mark geometry definition

This slice should be usable in both auth and account with configuration for:

- `surface = "auth"` or `surface = "account"`
- `scanlineField = on/off`
- `ghostMark = on/off`
- `motionProfile = quiet/live/none`

## Surface Rules

### Auth surface

`undef-auth` uses:

- shared shell
- shared exact mark geometry
- shared back-button styling
- live scanline field enabled
- dim, blurred ghost mark enabled

### Account surface

`undef-account` uses:

- shared shell
- shared exact mark geometry
- shared theme widgets
- no animated background field for now
- no extra “candy” beyond the shell/chrome treatment

## Geometry Requirement

The ghost `U` / mark geometry must come from the same actual source as the saved site mark.

No hand-drawn approximation in auth or account is acceptable.

If the public site mark changes later, auth and account should inherit the same geometry through the shared shell slice.

## Integration Model

This remains a sync/vendor model for now, not a published package rollout across repos.

That means:

- `undef-logos` owns the canonical shared shell slice
- `undef-auth` consumes a synced copy of the shared auth shell output
- `undef-account` consumes a synced copy of the shared account shell output

This is acceptable as long as:

- the source of truth is singular
- the synced slice is clearly bounded
- consumers stop editing shell geometry/styles independently

## Non-Goals

This change does not include:

- replacing the sync/vendor model with a published package
- turning on animated account backgrounds
- changing auth/account business logic
- changing the public site nav model

## Acceptance Criteria

This work is correct when:

- auth and account use the same header shell geometry
- auth and account use the same mark geometry
- auth no longer contains a hand-drawn ghost-mark approximation
- account no longer owns a divergent shell treatment
- auth keeps the live scanline field
- account keeps only shell/theme elements for now
- deploy verification shows both surfaces serving the new shared shell slice
