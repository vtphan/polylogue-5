#!/usr/bin/env python3
"""Check coverage of generated scenarios against the planned scenario sequence.

Reads the planned sequence from framework/reference/scenario_sequence.yaml
and compares it against generated artifacts/<scenario_id>/scenario.yaml files.

Reports:
  - Which planned scenarios are present / missing / unexpected
  - Per-scenario: do the actual target_facets / cognitive_patterns /
    social_dynamics match the plan?
  - Aggregate coverage of facets, cognitive patterns, and social dynamics
    across all present scenarios vs. the plan's coverage_targets.

Exit code is 0 if everything in the plan is covered, 1 otherwise. The
report is always printed in full so the operator can see partial progress.

Usage:
    python3 framework/pipeline/scripts/check_coverage.py \
        [--sequence framework/reference/scenario_sequence.yaml] \
        [--artifacts artifacts]
"""

import argparse
import glob
import os
import sys

import yaml


def load_yaml(path):
    with open(path) as f:
        return yaml.safe_load(f)


def collect_actual(scenario_yaml):
    """Pull the comparable fields from a scenario.yaml.

    Tolerates absent fields — a partially generated scenario should still
    show up in the report rather than crashing the script.

    The episode_plan.yaml schema stores cognitive_pattern and social_dynamic
    as singular, nullable fields nested inside designed_explanation on each
    target_facets entry — not as top-level lists. See
    framework/schemas/episode_plan.yaml.

    NOTE: This script is part of the legacy disposable-scenario coverage
    flow. It is preserved in Phase 5 and will be deleted in Phase 8 step
    43 along with framework/reference/scenario_sequence.yaml. Story-based
    coverage is now checked by validate_story.py.
    """
    plan = scenario_yaml or {}

    targets = plan.get("target_facets") or []

    facets = sorted({
        t.get("facet_id") for t in targets if t.get("facet_id")
    })

    patterns = set()
    dynamics = set()
    for t in targets:
        de = t.get("designed_explanation") or {}
        cp = de.get("cognitive_pattern")
        sd = de.get("social_dynamic")
        if cp:
            patterns.add(cp)
        if sd:
            dynamics.add(sd)

    strengths = plan.get("target_strengths") or []
    strength_count = len([s for s in strengths if s.get("facet_id")])

    return {
        "target_facets": facets,
        "cognitive_patterns": sorted(patterns),
        "social_dynamics": sorted(dynamics),
        "strength_count": strength_count,
    }


def diff(label, planned, actual):
    """Return (missing, extra) lists for a single category."""
    pset, aset = set(planned), set(actual)
    return sorted(pset - aset), sorted(aset - pset)


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument(
        "--sequence",
        default="framework/reference/scenario_sequence.yaml",
        help="Path to the planned scenario sequence YAML.",
    )
    ap.add_argument(
        "--artifacts",
        default="artifacts",
        help="Root directory of generated scenario artifacts.",
    )
    args = ap.parse_args()

    if not os.path.exists(args.sequence):
        print(f"ERROR: sequence file not found: {args.sequence}", file=sys.stderr)
        return 2
    seq = load_yaml(args.sequence) or {}
    planned = seq.get("sequence") or []
    targets = seq.get("coverage_targets") or {}
    excluded = seq.get("intentionally_excluded") or {}

    planned_by_id = {p["scenario_id"]: p for p in planned}

    # Discover generated scenarios
    found_paths = sorted(glob.glob(os.path.join(args.artifacts, "*", "scenario.yaml")))
    found_by_id = {}
    for path in found_paths:
        sid = os.path.basename(os.path.dirname(path))
        try:
            found_by_id[sid] = load_yaml(path)
        except Exception as e:
            print(f"WARN: failed to load {path}: {e}", file=sys.stderr)

    print("=" * 64)
    print("Scenario Coverage Report")
    print("=" * 64)
    print(f"Plan: {args.sequence}")
    print(f"Artifacts root: {args.artifacts}")
    print()

    # --- Per-scenario status ---
    print("Planned scenarios:")
    print("-" * 64)
    all_ok = True
    for entry in planned:
        sid = entry["scenario_id"]
        pos = entry.get("position", "?")
        if sid not in found_by_id:
            print(f"  [{pos}] {sid:30s}  MISSING")
            all_ok = False
            continue

        actual = collect_actual(found_by_id[sid])
        problems = []
        for label, key in [
            ("facets", "target_facets"),
            ("cog patterns", "cognitive_patterns"),
            ("soc dynamics", "social_dynamics"),
        ]:
            missing, extra = diff(label, entry.get(key, []), actual[key])
            if missing:
                problems.append(f"{label} missing: {','.join(missing)}")
            if extra:
                problems.append(f"{label} extra: {','.join(extra)}")

        # Doctrinal: every scenario must have ≥1 target_strengths entry
        # (mixed-valence requirement from suggestion A — see
        # framework/schemas/episode_plan.yaml).
        if actual["strength_count"] < 1:
            problems.append(
                "target_strengths missing — mixed-valence is doctrinal "
                "(every scenario needs ≥1 designed strength)"
            )

        status = "OK" if not problems else "DRIFT"
        if problems:
            all_ok = False
        print(f"  [{pos}] {sid:30s}  {status}")
        for p in problems:
            print(f"        - {p}")

    # --- Unexpected scenarios ---
    unexpected = sorted(set(found_by_id) - set(planned_by_id))
    if unexpected:
        print()
        print("Unexpected scenarios (present but not in plan):")
        for sid in unexpected:
            print(f"  ? {sid}")

    # --- Aggregate coverage ---
    print()
    print("Aggregate coverage vs. plan targets:")
    print("-" * 64)

    aggregates = {
        "facets": set(),
        "cognitive_patterns": set(),
        "social_dynamics": set(),
    }
    for sid, sc in found_by_id.items():
        a = collect_actual(sc)
        aggregates["facets"].update(a["target_facets"])
        aggregates["cognitive_patterns"].update(a["cognitive_patterns"])
        aggregates["social_dynamics"].update(a["social_dynamics"])

    for category in ("facets", "cognitive_patterns", "social_dynamics"):
        planned_set = set(targets.get(category) or [])
        covered = aggregates[category] & planned_set
        missing = planned_set - aggregates[category]
        extras = aggregates[category] - planned_set - set(excluded.get(category) or [])
        print(f"  {category}: {len(covered)}/{len(planned_set)} covered")
        if missing:
            print(f"    missing: {', '.join(sorted(missing))}")
            all_ok = False
        if extras:
            print(f"    unplanned: {', '.join(sorted(extras))}")

    print()
    if all_ok and len(found_by_id) >= len(planned_by_id):
        print("Result: PLAN FULLY COVERED")
        return 0
    if all_ok:
        print("Result: in progress — no drift in generated scenarios so far")
        return 1
    print("Result: COVERAGE GAPS — see above")
    return 1


if __name__ == "__main__":
    sys.exit(main())
