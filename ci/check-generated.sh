#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR=$(cd "$(dirname "$0")/.." && pwd -P)
cd "$ROOT_DIR"

# Regenerate lab/src/app/site-copy.ts from data/site/*.json.
node scripts/gen-site-copy.mjs

# Fail (and print the diff) if the regenerated file drifted from what's committed.
if ! git diff --exit-code -- lab/src/app/site-copy.ts; then
  echo "error: lab/src/app/site-copy.ts is stale — run 'make gen-site-copy' and commit the result" >&2
  exit 1
fi

echo "check-generated: lab/src/app/site-copy.ts is up to date"
