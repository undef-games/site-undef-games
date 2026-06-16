# Hugo Homepage Copy Source of Truth

## Goal

Make Hugo the single source of truth for production homepage copy on `undef.games`, and stop the hydrated shared runtime from maintaining a duplicate set of homepage messaging.

## Problem

The current homepage has two production copy sources:

1. Hugo content/templates render the server-side homepage copy.
2. The shared lab runtime hydrates over that page using `lab/src/app/site-copy.ts`.

This creates copy drift. The server-rendered page can say one thing while the hydrated runtime replaces it with stale text. That is exactly what happened with the lingering `Responsive by design, not by decoration.` section headline after the rest of the production copy had already been updated.

This is a production architecture problem, not a one-off content bug.

## Decision

Hugo owns all production homepage copy.

The runtime must not define independent production homepage messaging. Instead, Hugo will serialize the homepage copy into a structured JSON payload embedded in the page, and the hydrated runtime will read that payload on the `site` surface.

For lab-only behavior:

- the lab runtime may keep lab-local copy defaults for `/lab/`
- but those defaults must not control `https://undef.games/`

## Recommended Approach

Embed a structured JSON payload in the Hugo homepage and make the shared runtime consume it for the `site` surface.

### Why this approach

- It gives the production page one copy authority.
- It avoids DOM scraping and fragile selector coupling.
- It keeps the runtime interactive without making it responsible for authored content.
- It is explicit, testable, and easy to inspect in generated HTML.

## Alternatives Considered

### 1. DOM scraping

The runtime could read text from the existing rendered DOM.

Rejected because:

- it is brittle
- it couples runtime behavior to markup structure
- nested link/button copy becomes awkward
- tests become less precise

### 2. Shared TypeScript copy module for Hugo and runtime

The site and runtime could both consume one shared code/data module.

Rejected for production because:

- Hugo should own site content
- authored site copy belongs in content/front matter, not in the app runtime
- it still treats authored content as application data instead of site content

### 3. Runtime fetches a JSON file after load

Rejected because:

- it adds a network hop
- it complicates hydration timing
- it solves a build-time problem with runtime complexity

## Architecture

### Source ownership

Production homepage copy should live in Hugo-managed content/front matter or Hugo data consumed by the homepage template.

That source should include:

- hero support copy
- hero actions
- status line
- section kickers
- section titles
- section body copy
- product labels, descriptions, and URLs
- closing CTA

### Runtime contract

The Hugo homepage template should emit a serialized JSON payload in the rendered page, for example:

```html
<script id="site-copy-data" type="application/json">
  { ...homepage copy payload... }
</script>
```

The shared runtime should:

- read this payload only when `surface === "site"`
- validate the payload shape
- use it instead of `lab/src/app/site-copy.ts` for production homepage text

The lab surface should continue to use local defaults where appropriate.

### Failure behavior

If the payload is missing or invalid on the production surface:

- the runtime must not replace the page with stale fallback messaging
- the page should remain readable from Hugo-rendered HTML
- runtime copy hydration should degrade safely

This is important because production content should never regress due to runtime content defaults.

## Data Shape

The payload should mirror the runtime’s current needs closely enough to avoid transformation noise.

Recommended shape:

```json
{
  "hero": {
    "support": "...",
    "primaryAction": { "href": "...", "label": "..." },
    "secondaryAction": { "href": "...", "label": "..." },
    "statusLabel": "..."
  },
  "projects": [
    {
      "className": "...",
      "description": "...",
      "href": "...",
      "label": "...",
      "tag": "..."
    }
  ],
  "sections": {
    "signal": { "kicker": "...", "title": "...", "body": "..." },
    "projects": { "kicker": "...", "title": "..." },
    "warp": { "kicker": "...", "title": "...", "body": "...", "linkLabel": "...", "href": "..." },
    "dice": { "kicker": "...", "title": "...", "body": "...", "linkLabel": "...", "href": "..." },
    "taybols": { "kicker": "...", "title": "...", "body": "...", "linkLabel": "...", "href": "..." },
    "identity": { "kicker": "...", "title": "...", "body": "..." },
    "closing": { "kicker": "...", "title": "...", "action": "..." }
  }
}
```

Exact naming can adapt to current runtime code, but the contract must stay explicit and versionable.

## File and Responsibility Boundaries

### Hugo side

- homepage content/front matter owns production copy
- homepage template/partial renders visible content
- homepage template/partial serializes the matching JSON payload

### Runtime side

- `site-copy.ts` should stop being the production source
- a small runtime reader/parser module should load and validate Hugo JSON
- `AppShell` should consume parsed site copy when `surface === "site"`
- lab-only defaults should stay isolated from production site copy

## Testing Requirements

### Hugo/build tests

Add a test that the generated homepage HTML contains the serialized payload and that expected strings appear in that payload.

### Runtime tests

Add a test that the `site` surface reads embedded JSON and renders that content instead of local defaults.

Add a failure-path test that missing or invalid JSON does not reintroduce stale production defaults.

### Regression guard

Add a regression check specifically covering the previous failure mode:

- production homepage must not hydrate to `Responsive by design, not by decoration.`

## Migration Rules

1. Keep the current homepage behavior visually intact.
2. Move production copy authority into Hugo.
3. Wire the runtime to Hugo JSON for `site`.
4. Preserve lab behavior for `/lab/`.
5. Remove duplicated production copy ownership from the runtime path.

## Non-Goals

- Redesigning homepage layout
- Rewriting scanline interactions
- Changing project routing
- Refactoring unrelated Hugo or lab systems

## End State

After this change:

- editing production homepage copy means editing Hugo content only
- hydrated homepage text matches server-rendered text
- lab content can evolve separately without mutating production messaging
- this class of copy drift bug is structurally removed
