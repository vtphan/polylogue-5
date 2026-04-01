#!/usr/bin/env python3
"""Sync pipeline commands and agents to .claude/ for the current working session.

Copies:
  configs/*/commands/*.md  ->  .claude/commands/
  configs/*/agents/*.md    ->  .claude/agents/

Also verifies that reference data and schema files exist.

Usage:
    python3 sync_configs.py [--project-root <path>]

If --project-root is not specified, uses the current working directory.
"""

import argparse
import glob
import os
import shutil
import sys
import yaml


def sync_configs(project_root):
    commands_dest = os.path.join(project_root, ".claude", "commands")
    agents_dest = os.path.join(project_root, ".claude", "agents")
    os.makedirs(commands_dest, exist_ok=True)
    os.makedirs(agents_dest, exist_ok=True)

    # Sync commands
    command_files = glob.glob(
        os.path.join(project_root, "configs", "*", "commands", "*.md")
    )
    for src in command_files:
        dst = os.path.join(commands_dest, os.path.basename(src))
        shutil.copy2(src, dst)
    print(f"Commands: synced {len(command_files)} files to .claude/commands/")

    # Sync agents
    agent_files = glob.glob(
        os.path.join(project_root, "configs", "*", "agents", "*.md")
    )
    for src in agent_files:
        dst = os.path.join(agents_dest, os.path.basename(src))
        shutil.copy2(src, dst)
    print(f"Agents: synced {len(agent_files)} files to .claude/agents/")

    # Verify reference data
    ref_dir = os.path.join(project_root, "configs", "reference")
    ref_files = ["lenses.yaml", "facet_inventory.yaml", "explanatory_variables.yaml"]
    ref_ok = True
    for fname in ref_files:
        path = os.path.join(ref_dir, fname)
        if not os.path.exists(path):
            print(f"MISSING: {path}", file=sys.stderr)
            ref_ok = False
        else:
            with open(path) as f:
                yaml.safe_load(f)
    if ref_ok:
        print(f"Reference data: {len(ref_files)} files verified")

    # Verify schema files
    schema_files = glob.glob(
        os.path.join(project_root, "configs", "*", "schemas", "*.yaml")
    ) + glob.glob(
        os.path.join(project_root, "configs", "reference", "schemas", "*.yaml")
    )
    # Deduplicate (reference schemas matched by both patterns)
    schema_files = sorted(set(schema_files))
    print(f"Schemas: {len(schema_files)} files found")

    # Verify registry exists
    registry = os.path.join(project_root, "registry")
    if os.path.isdir(registry):
        print(f"Registry: exists")
    else:
        print(f"Registry: MISSING — creating", file=sys.stderr)
        os.makedirs(registry)

    if not ref_ok:
        print("\nERROR: Missing reference data files", file=sys.stderr)
        return False

    print("\nPipeline initialized. Run /create_scenario to begin.")
    return True


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Sync pipeline configs")
    parser.add_argument(
        "--project-root", default=os.getcwd(),
        help="Project root directory (default: current directory)"
    )
    args = parser.parse_args()
    ok = sync_configs(args.project_root)
    sys.exit(0 if ok else 1)
