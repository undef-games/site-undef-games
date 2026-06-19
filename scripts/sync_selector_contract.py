#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path
import shutil


REPO_ROOT = Path(__file__).resolve().parents[1]
MONOREPO_ROOT = REPO_ROOT.parents[2]
SOURCE = REPO_ROOT / "packages" / "scanlines-system" / "src" / "testing" / "selector-contract.ts"
TARGETS = [
    MONOREPO_ROOT / "undef-auth" / "vendor" / "scanlines-system" / "selector-contract.ts",
    MONOREPO_ROOT / "undef-account" / "frontend" / "vendor" / "scanlines-system" / "selector-contract.ts",
]


def main() -> int:
    if not SOURCE.exists():
        raise SystemExit(f"missing source contract: {SOURCE}")

    for target in TARGETS:
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(SOURCE, target)
        print(f"synced {SOURCE} -> {target}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
