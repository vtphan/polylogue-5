#!/usr/bin/env python3
"""Initialize the Reasoning Lab application pipeline.

Syncs shared upstream commands/agents from framework/pipeline/ and
Reasoning Lab commands/agents from apps/reasoning-lab/pipeline/ into .claude/.
Verifies reference data, schemas, and registry.

Usage:
    python3 apps/reasoning-lab/pipeline/initialize_polylogue.py [--project-root <path>]

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
    "framework/schemas/scenario_plan.yaml",
    "framework/schemas/validation_output.yaml",
    "framework/schemas/dialog_writer_input.yaml",
    "framework/schemas/transcript_pre.yaml",
    "framework/schemas/transcript.yaml",
    "framework/schemas/analysis.yaml",
    "framework/schemas/facilitation.yaml",
]

# Reasoning Lab-specific schemas
APP_SCHEMAS = [
    "apps/reasoning-lab/schemas/scoring.yaml",
    "apps/reasoning-lab/schemas/competition_facilitation.yaml",
    "apps/reasoning-lab/schemas/session.yaml",
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

    # --- Sync Reasoning Lab commands ---
    app_commands = glob.glob(
        os.path.join(project_root, "apps", "reasoning-lab", "pipeline", "commands", "*.md")
    )
    for src in app_commands:
        dst = os.path.join(commands_dest, os.path.basename(src))
        shutil.copy2(src, dst)

    total_commands = len(framework_commands) + len(app_commands)
    print(f"Commands: synced {total_commands} files to .claude/commands/ "
          f"({len(framework_commands)} shared + {len(app_commands)} Reasoning Lab)")

    # --- Sync shared upstream agents (framework) ---
    framework_agents = glob.glob(
        os.path.join(project_root, "framework", "pipeline", "agents", "*.md")
    )
    for src in framework_agents:
        dst = os.path.join(agents_dest, os.path.basename(src))
        shutil.copy2(src, dst)

    # --- Sync Reasoning Lab agents ---
    app_agents = glob.glob(
        os.path.join(project_root, "apps", "reasoning-lab", "pipeline", "agents", "*.md")
    )
    for src in app_agents:
        dst = os.path.join(agents_dest, os.path.basename(src))
        shutil.copy2(src, dst)

    total_agents = len(framework_agents) + len(app_agents)
    print(f"Agents: synced {total_agents} files to .claude/agents/ "
          f"({len(framework_agents)} shared + {len(app_agents)} Reasoning Lab)")

    # --- Verify reference data ---
    ref_dir = os.path.join(project_root, "framework", "reference")
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

    # --- Verify schemas ---
    all_schemas = FRAMEWORK_SCHEMAS + APP_SCHEMAS
    schema_ok = True
    for schema in all_schemas:
        path = os.path.join(project_root, schema)
        if not os.path.exists(path):
            print(f"  MISSING: {schema}", file=sys.stderr)
            schema_ok = False
    if schema_ok:
        print(f"Schemas: {len(all_schemas)} files verified "
              f"({len(FRAMEWORK_SCHEMAS)} shared + {len(APP_SCHEMAS)} Reasoning Lab)")
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
        print("\nReasoning Lab pipeline initialized. Run /create_scenario to begin.")
    else:
        print("\nERROR: Missing files — see above.", file=sys.stderr)

    return ok


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Initialize the Reasoning Lab application pipeline"
    )
    parser.add_argument(
        "--project-root", default=os.getcwd(),
        help="Project root directory (default: current directory)"
    )
    args = parser.parse_args()
    ok = initialize(args.project_root)
    sys.exit(0 if ok else 1)
