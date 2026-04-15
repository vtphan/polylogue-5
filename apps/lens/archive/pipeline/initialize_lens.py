#!/usr/bin/env python3
"""Initialize the Lens application pipeline.

Syncs shared upstream commands/agents from framework/pipeline/ and
Lens-specific commands/agents from apps/lens/pipeline/ into .claude/.
Verifies reference data, schemas, and artifacts directory.

Usage:
    python3 apps/lens/pipeline/initialize_polylogue.py [--project-root <path>]

If --project-root is not specified, uses the current working directory.
"""

import argparse
import glob
import os
import shutil
import sys
import yaml


# Shared upstream schemas (framework)
FRAMEWORK_SCHEMAS = [
    "framework/schemas/lenses.yaml",
    "framework/schemas/facet_inventory.yaml",
    "framework/schemas/explanatory_variables.yaml",
    "framework/schemas/episode_plan.yaml",
    "framework/schemas/validation_output.yaml",
    "framework/schemas/episode_writer_input.yaml",
    "framework/schemas/transcript_pre.yaml",
    "framework/schemas/transcript.yaml",
    "framework/schemas/analysis.yaml",
    "framework/schemas/facilitation.yaml",
]

# Lens-specific schemas
LENS_SCHEMAS = [
    "apps/lens/schemas/scaffolding.yaml",
    "apps/lens/schemas/session.yaml",
    "apps/lens/schemas/student_annotations.yaml",
]


def initialize(project_root):
    ok = True

    # --- Clean .claude/ to prevent leakage between applications ---
    claude_dir = os.path.join(project_root, ".claude")
    commands_dest = os.path.join(claude_dir, "commands")
    agents_dest = os.path.join(claude_dir, "agents")
    for d in [commands_dest, agents_dest]:
        if os.path.isdir(d):
            shutil.rmtree(d)
    os.makedirs(commands_dest, exist_ok=True)
    os.makedirs(agents_dest, exist_ok=True)

    # --- Sync shared upstream commands (framework) ---
    framework_commands = glob.glob(
        os.path.join(project_root, "framework", "pipeline", "commands", "*.md")
    )
    for src in framework_commands:
        dst = os.path.join(commands_dest, os.path.basename(src))
        shutil.copy2(src, dst)

    # --- Sync Lens-specific commands ---
    lens_commands = glob.glob(
        os.path.join(project_root, "apps", "lens", "pipeline", "commands", "*.md")
    )
    for src in lens_commands:
        dst = os.path.join(commands_dest, os.path.basename(src))
        shutil.copy2(src, dst)

    total_commands = len(framework_commands) + len(lens_commands)
    print(f"Commands: synced {total_commands} files to .claude/commands/ "
          f"({len(framework_commands)} shared + {len(lens_commands)} Lens)")

    # --- Sync shared upstream agents (framework) ---
    framework_agents = glob.glob(
        os.path.join(project_root, "framework", "pipeline", "agents", "*.md")
    )
    for src in framework_agents:
        dst = os.path.join(agents_dest, os.path.basename(src))
        shutil.copy2(src, dst)

    # --- Sync Lens-specific agents ---
    lens_agents = glob.glob(
        os.path.join(project_root, "apps", "lens", "pipeline", "agents", "*.md")
    )
    for src in lens_agents:
        dst = os.path.join(agents_dest, os.path.basename(src))
        shutil.copy2(src, dst)

    total_agents = len(framework_agents) + len(lens_agents)
    print(f"Agents: synced {total_agents} files to .claude/agents/ "
          f"({len(framework_agents)} shared + {len(lens_agents)} Lens)")

    # --- Verify reference data ---
    ref_dir = os.path.join(project_root, "framework", "reference")
    ref_files = [
        "lenses.yaml",
        "facet_inventory.yaml",
        "explanatory_variables.yaml",
    ]
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

    # --- Verify Lens-specific reference data ---
    lens_ref_dir = os.path.join(project_root, "apps", "lens", "reference")
    lens_ref_files = ["default_instructions.yaml"]
    for fname in lens_ref_files:
        path = os.path.join(lens_ref_dir, fname)
        if not os.path.exists(path):
            print(f"  MISSING: {path}", file=sys.stderr)
            ok = False
        else:
            with open(path) as f:
                yaml.safe_load(f)
    print(f"Lens reference data: {len(lens_ref_files)} files verified")

    # --- Verify schemas ---
    all_schemas = FRAMEWORK_SCHEMAS + LENS_SCHEMAS
    schema_ok = True
    for schema in all_schemas:
        path = os.path.join(project_root, schema)
        if not os.path.exists(path):
            print(f"  MISSING: {schema}", file=sys.stderr)
            schema_ok = False
    if schema_ok:
        print(f"Schemas: {len(all_schemas)} files verified "
              f"({len(FRAMEWORK_SCHEMAS)} shared + {len(LENS_SCHEMAS)} Lens)")
    else:
        ok = False

    # --- Verify artifacts ---
    artifacts = os.path.join(project_root, "artifacts")
    if os.path.isdir(artifacts):
        print("Artifacts: exists")
    else:
        os.makedirs(artifacts)
        print("Artifacts: created")

    # --- Report ---
    if ok:
        print("\nLens pipeline initialized. Run /create_episode <story_id> <episode_number> to begin.")
    else:
        print("\nERROR: Missing files — see above.", file=sys.stderr)

    return ok


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Initialize the Lens application pipeline"
    )
    parser.add_argument(
        "--project-root", default=os.getcwd(),
        help="Project root directory (default: current directory)"
    )
    args = parser.parse_args()
    ok = initialize(args.project_root)
    sys.exit(0 if ok else 1)
