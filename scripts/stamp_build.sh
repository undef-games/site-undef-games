#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR=$(cd "$(dirname "$0")/.." && pwd -P)
cd "$ROOT_DIR"

SHA=$(git rev-parse --short HEAD 2>/dev/null || echo "local")
DATE_UTC=$(date -u +%Y.%m.%d)
ISO_UTC=$(date -u +%Y-%m-%dT%H:%M:%SZ)

mkdir -p data
cat > data/build.json <<EOF
{
  "version": "v${DATE_UTC}.${SHA}",
  "sha": "${SHA}",
  "date": "${DATE_UTC}",
  "iso": "${ISO_UTC}"
}
EOF

echo "build stamp: v${DATE_UTC}.${SHA} (${ISO_UTC})"
