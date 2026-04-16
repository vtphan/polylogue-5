#!/usr/bin/env python3
"""Initialize the simplified Lens pipeline into .claude/.

This is the lightweight equivalent of the older framework initializer.
It prevents command/agent leakage by clearing `.claude/commands/` and
`.claude/agents/`, then syncing the simplified-framework command and agent
specs into those directories.

It also verifies the core simplified-framework references and schemas so the
Claude Code workflow has the minimum required context to operate systematically.

Usage:
    python3 simplified-framework/pipeline/scripts/initialize_polylogue.py
    python3 simplified-framework/pipeline/scripts/initialize_polylogue.py --project-root /path/to/repo
"""

from __future__ import annotations

import argparse
import glob
import os
import shutil
import sys
from pathlib import Path

import yaml


SIMPLIFIED_SCHEMAS = [
    "simplified-framework/schemas/story.yaml",
    "simplified-framework/schemas/episode-plan.yaml",
    "simplified-framework/schemas/transcript.yaml",
    "simplified-framework/schemas/lesson_package.yaml",
]

SIMPLIFIED_REFERENCE = [
    "simplified-framework/reference/flaw-taxonomy.yaml",
]

SIMPLIFIED_DOCS = [
    "simplified-framework/docs/conceptual-model.md",
    "simplified-framework/docs/instructional-model.md",
    "simplified-framework/docs/story-spec.md",
    "simplified-framework/docs/episode-plan-spec.md",
    "simplified-framework/docs/transcript-spec.md",
    "simplified-framework/docs/package-schema.md",
    "simplified-framework/docs/operator-workflow.md",
    "simplified-framework/docs/app-contract.md",
]


def sync_glob(pattern: str, dest_dir: str) -> int:
    sources = [
        src for src in sorted(glob.glob(pattern))
        if os.path.basename(src).lower() != "readme.md"
    ]
    for src in sources:
        shutil.copy2(src, os.path.join(dest_dir, os.path.basename(src)))
    return len(sources)


def verify_files(project_root: str, paths: list[str], parse_yaml: bool = False) -> list[str]:
    missing: list[str] = []
    for rel in paths:
        full = os.path.join(project_root, rel)
        if not os.path.exists(full):
            missing.append(rel)
            continue
        if parse_yaml:
            with open(full, "r", encoding="utf-8") as handle:
                yaml.safe_load(handle)
    return missing


def initialize(project_root: str) -> bool:
    ok = True
    root = Path(project_root)

    claude_dir = root / ".claude"
    commands_dest = claude_dir / "commands"
    agents_dest = claude_dir / "agents"

    for directory in (commands_dest, agents_dest):
        if directory.is_dir():
            shutil.rmtree(directory)
        directory.mkdir(parents=True, exist_ok=True)

    n_cmd = sync_glob(str(root / "simplified-framework" / "pipeline" / "commands" / "*.md"), str(commands_dest))
    n_agents = sync_glob(str(root / "simplified-framework" / "pipeline" / "agents" / "*.md"), str(agents_dest))

    print(f"Commands: synced {n_cmd} files to .claude/commands/")
    print(f"Agents:   synced {n_agents} files to .claude/agents/")

    ref_missing = verify_files(project_root, SIMPLIFIED_REFERENCE, parse_yaml=True)
    if ref_missing:
        for rel in ref_missing:
            print(f"  MISSING: {rel}", file=sys.stderr)
        ok = False
    else:
        print(f"Reference data: {len(SIMPLIFIED_REFERENCE)} files verified")

    schema_missing = verify_files(project_root, SIMPLIFIED_SCHEMAS, parse_yaml=True)
    if schema_missing:
        for rel in schema_missing:
            print(f"  MISSING: {rel}", file=sys.stderr)
        ok = False
    else:
        print(f"Schemas: {len(SIMPLIFIED_SCHEMAS)} files verified")

    docs_missing = verify_files(project_root, SIMPLIFIED_DOCS, parse_yaml=False)
    if docs_missing:
        for rel in docs_missing:
            print(f"  MISSING: {rel}", file=sys.stderr)
        ok = False
    else:
        print(f"Docs: {len(SIMPLIFIED_DOCS)} files verified")

    stories_root = root / "simplified-framework" / "stories"
    if stories_root.is_dir():
        print("Stories: exists")
    else:
        stories_root.mkdir(parents=True, exist_ok=True)
        print("Stories: created")

    artifacts_root = root / "simplified-framework" / "artifacts"
    if artifacts_root.is_dir():
        print("Artifacts: exists")
    else:
        artifacts_root.mkdir(parents=True, exist_ok=True)
        print("Artifacts: created")

    if ok:
        print("\nSimplified Lens pipeline initialized. Use /create_story to begin.")
    else:
        print("\nERROR: Missing files — see above.", file=sys.stderr)

    return ok


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Initialize the simplified Lens pipeline")
    parser.add_argument(
        "--project-root",
        default=os.getcwd(),
        help="Project root directory (default: current directory)",
    )
    args = parser.parse_args()
    success = initialize(args.project_root)
    sys.exit(0 if success else 1)
