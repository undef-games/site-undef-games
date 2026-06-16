#!/usr/bin/env bash

set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

status=0

if rg -n "from ['\"](\\.{2}/)+packages/scanlines-system/src|import ['\"](\\.{2}/)+packages/scanlines-system/src" \
  lab/src themes/scanlines/assets/ts tests -g '*.ts' -g '*.tsx' >/tmp/scanlines-system-direct-imports.txt 2>/dev/null; then
  echo "Direct source imports from packages/scanlines-system/src are not allowed:"
  cat /tmp/scanlines-system-direct-imports.txt
  status=1
fi

if rg -n "from ['\"].*lab/src|import ['\"].*lab/src" \
  packages/scanlines-system/src -g '*.ts' -g '*.tsx' >/tmp/scanlines-system-lab-imports.txt 2>/dev/null; then
  echo "packages/scanlines-system must not import from lab/src:"
  cat /tmp/scanlines-system-lab-imports.txt
  status=1
fi

exit "$status"
