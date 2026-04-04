#!/usr/bin/env python3
"""Initialize the Polylogue 5 pipeline.

Creates .claude/commands/ and .claude/agents/ from configs/, verifies
reference data, schema files, and registry. Run this before any slash
commands — it bootstraps the environment.

Usage:
    python3 configs/initialize_polylogue.py [--project-root <path>]

If --project-root is not specified, uses the current working directory.
"""

import argparse
import glob
import os
import shutil
import sys
import yaml


# The 13 schema files that must exist for the pipeline to function.
REQUIRED_SCHEMAS = [
    "configs/reference/schemas/lenses.yaml",
    "configs/reference/schemas/facet_inventory.yaml",
    "configs/reference/schemas/explanatory_variables.yaml",
    "configs/scenario/schemas/scenario_plan.yaml",
    "configs/scenario/schemas/validation_output.yaml",
    "configs/transcript/schemas/dialog_writer_input.yaml",
    "configs/transcript/schemas/transcript_pre.yaml",
    "configs/transcript/schemas/transcript.yaml",
    "configs/analysis/schemas/analysis.yaml",
    "configs/analysis/schemas/facilitation.yaml",
    "configs/scaffolding/schemas/scaffolding.yaml",
    "configs/session/schemas/session.yaml",
    "configs/session/schemas/student_annotations.yaml",
]


def initialize(project_root):
    ok = True

    # --- Sync commands ---
    commands_dest = os.path.join(project_root, ".claude", "commands")
    agents_dest = os.path.join(project_root, ".claude", "agents")
    os.makedirs(commands_dest, exist_ok=True)
    os.makedirs(agents_dest, exist_ok=True)

    command_files = glob.glob(
        os.path.join(project_root, "configs", "*", "commands", "*.md")
    )
    for src in command_files:
        dst = os.path.join(commands_dest, os.path.basename(src))
        shutil.copy2(src, dst)
    print(f"Commands: synced {len(command_files)} files to .claude/commands/")

    # --- Sync agents ---
    agent_files = glob.glob(
        os.path.join(project_root, "configs", "*", "agents", "*.md")
    )
    for src in agent_files:
        dst = os.path.join(agents_dest, os.path.basename(src))
        shutil.copy2(src, dst)
    print(f"Agents: synced {len(agent_files)} files to .claude/agents/")

    # --- Verify reference data ---
    ref_dir = os.path.join(project_root, "configs", "reference")
    ref_files = ["lenses.yaml", "facet_inventory.yaml", "explanatory_variables.yaml"]
    ref_ok = True
    for fname in ref_files:
        path = os.path.join(ref_dir, fname)
        if not os.path.exists(path):
            print(f"  MISSING: {path}", file=sys.stderr)
            ref_ok = False
        else:
            with open(path) as f:
                yaml.safe_load(f)
    if ref_ok:
        print(f"Reference data: {len(ref_files)} files verified")
    else:
        ok = False

    # --- Verify schema files (by name, not glob) ---
    schema_ok = True
    for schema in REQUIRED_SCHEMAS:
        path = os.path.join(project_root, schema)
        if not os.path.exists(path):
            print(f"  MISSING: {schema}", file=sys.stderr)
            schema_ok = False
    if schema_ok:
        print(f"Schemas: {len(REQUIRED_SCHEMAS)} files verified")
    else:
        ok = False

    # --- Verify registry ---
    registry = os.path.join(project_root, "registry")
    if os.path.isdir(registry):
        print("Registry: exists")
    else:
        os.makedirs(registry)
        print("Registry: created")

    # --- Report ---
    if ok:
        print("\nPipeline initialized. Run /create_scenario to begin.")
    else:
        print("\nERROR: Missing files — see above.", file=sys.stderr)

    return ok


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Initialize the Polylogue 5 pipeline"
    )
    parser.add_argument(
        "--project-root", default=os.getcwd(),
        help="Project root directory (default: current directory)"
    )
    args = parser.parse_args()
    ok = initialize(args.project_root)
    sys.exit(0 if ok else 1)
