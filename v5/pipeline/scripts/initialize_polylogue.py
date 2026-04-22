#!/usr/bin/env python3
"""Bootstrap v5 commands and agents into repo-root .claude/.

Syncs v5/pipeline/commands/ and v5/pipeline/agents/ into .claude/commands/
and .claude/agents/ at the repo root. The destination directories are
cleared first — this is a clean replace, not a merge. Operators run this
once after checking out a v5 version that changed command or agent
definitions.

Usage:
  python3 v5/pipeline/scripts/initialize_polylogue.py
  python3 v5/pipeline/scripts/initialize_polylogue.py --project-root /path
  python3 v5/pipeline/scripts/initialize_polylogue.py --dry-run

Reference: v5/docs/architecture.md §5.3
"""

from __future__ import annotations

import argparse
import shutil
import sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
V5_ROOT = SCRIPT_DIR.parent.parent
DEFAULT_REPO_ROOT = V5_ROOT.parent

COMMANDS_SRC = V5_ROOT / "pipeline" / "commands"
AGENTS_SRC = V5_ROOT / "pipeline" / "agents"


def sync_dir(src: Path, dst: Path, dry_run: bool) -> tuple[int, int, list[str]]:
    cleared: list[str] = []
    copied: list[str] = []

    if dst.exists():
        for entry in sorted(dst.iterdir()):
            if entry.is_file():
                if not dry_run:
                    entry.unlink()
                cleared.append(entry.name)
    elif not dry_run:
        dst.mkdir(parents=True, exist_ok=True)

    if src.exists():
        for entry in sorted(src.iterdir()):
            if entry.is_file() and entry.suffix == ".md":
                if not dry_run:
                    dst.mkdir(parents=True, exist_ok=True)
                    shutil.copy2(entry, dst / entry.name)
                copied.append(entry.name)

    return len(cleared), len(copied), cleared + [f"+ {c}" for c in copied]


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument(
        "--project-root",
        type=Path,
        default=DEFAULT_REPO_ROOT,
        help="Repo root where .claude/ lives (default: parent of v5/)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print what would happen without touching the filesystem",
    )
    args = parser.parse_args(argv)

    repo_root = args.project_root.resolve()
    claude_dir = repo_root / ".claude"

    print(f"v5 source:   {V5_ROOT}")
    print(f"repo root:   {repo_root}")
    print(f".claude dir: {claude_dir}")
    print(f"mode:        {'dry-run' if args.dry_run else 'apply'}")
    print()

    print(f"[commands] source: {COMMANDS_SRC}")
    cmds_cleared, cmds_copied, cmds_detail = sync_dir(
        COMMANDS_SRC, claude_dir / "commands", args.dry_run
    )
    for line in cmds_detail:
        print(f"  {line if line.startswith('+') else '- ' + line}")
    print(f"  cleared {cmds_cleared}, copied {cmds_copied}")
    print()

    print(f"[agents]   source: {AGENTS_SRC}")
    if not AGENTS_SRC.exists():
        print(f"  (skipped — {AGENTS_SRC} does not exist yet)")
    else:
        agents_cleared, agents_copied, agents_detail = sync_dir(
            AGENTS_SRC, claude_dir / "agents", args.dry_run
        )
        for line in agents_detail:
            print(f"  {line if line.startswith('+') else '- ' + line}")
        print(f"  cleared {agents_cleared}, copied {agents_copied}")
    print()

    if args.dry_run:
        print("Dry run — no files changed.")
    else:
        print("Sync complete.")

    return 0


if __name__ == "__main__":
    sys.exit(main())
