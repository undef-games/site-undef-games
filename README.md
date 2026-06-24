# undef-logos

Production landing page for `undef games`, built with Hugo and the private
local `themes/scanlines` theme. The interactive Vite, React, and PixiJS logo
lab lives in `lab/` and is mounted at `/lab/` in the built site.

## Requires the `scanlines-system` sibling repo

The theme and `lab/` consume `@undef-games/scanlines-system` from a **sibling
checkout** (a `file:../../scanlines-system` link + Vite alias), not an in-repo
package. Clone it next to this repo before building:

```bash
git clone https://github.com/undef-games/scanlines-system.git ../scanlines-system
```

Without it, `make install-lab` / `make build` cannot resolve
`@undef-games/scanlines-system`.

Useful commands:

- `make install-root` and `make install-lab`
- `make build`
- `make serve`
- `make test`, `make typecheck`, and `make e2e`
- `make deploy-preview` and `make deploy`

Terraform configuration in `terraform/` manages the Cloudflare Pages project,
custom domains, and DNS. Wrangler deploys the built `public/` artifact.
