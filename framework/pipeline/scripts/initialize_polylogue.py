#!/usr/bin/env python3
"""Initialize the Polylogue pipeline for a target application.

Clears .claude/commands/ and .claude/agents/ (preventing cross-app leakage),
then syncs shared upstream commands/agents from framework/pipeline/ plus
app-specific commands/agents from apps/<app>/pipeline/. Verifies reference
data, schemas, and the artifacts directory.

Usage:
    python3 framework/pipeline/scripts/initialize_polylogue.py --app lens
    python3 framework/pipeline/scripts/initialize_polylogue.py --app reasoning-lab
    python3 framework/pipeline/scripts/initialize_polylogue.py  # shared only

If --app is omitted, only shared upstream commands and agents are synced
(sufficient for Phase 6 authoring and /validate_story).
"""

import argparse
import glob
import os
import shutil
import sys
import yaml


APPS = {
    "lens": {
        "label": "Lens",
        "schemas": [
            "apps/lens/schemas/scaffolding.yaml",
            "apps/lens/schemas/session.yaml",
            "apps/lens/schemas/student_annotations.yaml",
        ],
        "reference": [
            "apps/lens/reference/default_instructions.yaml",
        ],
    },
    "reasoning-lab": {
        "label": "Reasoning Lab",
        "schemas": [
            "apps/reasoning-lab/schemas/scoring.yaml",
            "apps/reasoning-lab/schemas/competition_facilitation.yaml",
            "apps/reasoning-lab/schemas/session.yaml",
        ],
        "reference": [],
    },
}

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
    # v2 assistive package schemas
    "framework/schemas/ground_truth.yaml",
    "framework/schemas/diagnostic.yaml",
    "framework/schemas/prose.yaml",
    "framework/schemas/discussion.yaml",
    "framework/schemas/assistive_package.yaml",
]

FRAMEWORK_REFERENCE = [
    "lenses.yaml",
    "facet_inventory.yaml",
    "explanatory_variables.yaml",
    "wrestling_gates.yaml",
]


def sync_glob(pattern, dest_dir):
    """Copy all files matching pattern into dest_dir. Return count."""
    sources = sorted(glob.glob(pattern))
    for src in sources:
        shutil.copy2(src, os.path.join(dest_dir, os.path.basename(src)))
    return len(sources)


def verify_files(project_root, paths, parse_yaml=False):
    """Check that all paths exist (relative to project_root). Return list of missing."""
    missing = []
    for rel in paths:
        full = os.path.join(project_root, rel)
        if not os.path.exists(full):
            missing.append(rel)
        elif parse_yaml:
            with open(full) as f:
                yaml.safe_load(f)
    return missing


def initialize(project_root, app_id):
    ok = True
    app = APPS.get(app_id) if app_id else None
    label = app["label"] if app else "shared-only"

    # --- Clean .claude/ to prevent leakage between applications ---
    claude_dir = os.path.join(project_root, ".claude")
    commands_dest = os.path.join(claude_dir, "commands")
    agents_dest = os.path.join(claude_dir, "agents")
    for d in [commands_dest, agents_dest]:
        if os.path.isdir(d):
            shutil.rmtree(d)
        os.makedirs(d, exist_ok=True)

    # --- Sync commands ---
    n_fw_cmd = sync_glob(
        os.path.join(project_root, "framework", "pipeline", "commands", "*.md"),
        commands_dest,
    )
    n_app_cmd = 0
    if app_id:
        n_app_cmd = sync_glob(
            os.path.join(project_root, "apps", app_id, "pipeline", "commands", "*.md"),
            commands_dest,
        )
    print(f"Commands: synced {n_fw_cmd + n_app_cmd} files to .claude/commands/ "
          f"({n_fw_cmd} shared + {n_app_cmd} {label})")

    # --- Sync agents ---
    n_fw_agt = sync_glob(
        os.path.join(project_root, "framework", "pipeline", "agents", "*.md"),
        agents_dest,
    )
    n_app_agt = 0
    if app_id:
        n_app_agt = sync_glob(
            os.path.join(project_root, "apps", app_id, "pipeline", "agents", "*.md"),
            agents_dest,
        )
    print(f"Agents:   synced {n_fw_agt + n_app_agt} files to .claude/agents/ "
          f"({n_fw_agt} shared + {n_app_agt} {label})")

    # --- Verify framework reference data ---
    ref_dir = os.path.join(project_root, "framework", "reference")
    ref_missing = verify_files(
        ref_dir,
        FRAMEWORK_REFERENCE,
        parse_yaml=True,
    )
    if ref_missing:
        for m in ref_missing:
            print(f"  MISSING: framework/reference/{m}", file=sys.stderr)
        ok = False
    else:
        print(f"Reference data: {len(FRAMEWORK_REFERENCE)} framework files verified")

    # --- Verify app-specific reference data ---
    if app and app["reference"]:
        app_ref_missing = verify_files(project_root, app["reference"], parse_yaml=True)
        if app_ref_missing:
            for m in app_ref_missing:
                print(f"  MISSING: {m}", file=sys.stderr)
            ok = False
        else:
            print(f"Reference data: {len(app['reference'])} {label} files verified")

    # --- Verify schemas ---
    schema_list = list(FRAMEWORK_SCHEMAS)
    if app:
        schema_list += app["schemas"]
    schema_missing = verify_files(project_root, schema_list)
    if schema_missing:
        for m in schema_missing:
            print(f"  MISSING: {m}", file=sys.stderr)
        ok = False
    else:
        n_app_schema = len(app["schemas"]) if app else 0
        print(f"Schemas:  {len(schema_list)} files verified "
              f"({len(FRAMEWORK_SCHEMAS)} shared + {n_app_schema} {label})")

    # --- Ensure artifacts directory ---
    artifacts = os.path.join(project_root, "artifacts")
    if os.path.isdir(artifacts):
        print("Artifacts: exists")
    else:
        os.makedirs(artifacts)
        print("Artifacts: created")

    # --- Report ---
    if ok:
        if app_id:
            print(f"\n{label} pipeline initialized. "
                  f"Run /create_episode <story_id> <episode_number> to begin.")
        else:
            print("\nShared pipeline initialized (no app downstream). "
                  "Sufficient for Phase 6 authoring and /validate_story.")
    else:
        print("\nERROR: Missing files — see above.", file=sys.stderr)

    return ok


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Initialize the Polylogue pipeline for a target application"
    )
    parser.add_argument(
        "--app", choices=list(APPS.keys()), default=None,
        help="Target application (omit for shared-only initialization)"
    )
    parser.add_argument(
        "--project-root", default=os.getcwd(),
        help="Project root directory (default: current directory)"
    )
    args = parser.parse_args()
    ok = initialize(args.project_root, args.app)
    sys.exit(0 if ok else 1)
