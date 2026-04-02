#!/usr/bin/env python3
"""Strip target_facets and discussion_dynamic from a scenario plan to produce dialog writer input.

This is the information barrier's enforcement mechanism. The dialog writer
must never see target_facets, discussion_dynamic, facet IDs, lens names, or explanatory variables.

Usage:
    python3 strip_scenario.py <scenario_path> <output_path>

Example:
    python3 strip_scenario.py registry/ocean-vs-deforestation/scenario.yaml \
        registry/ocean-vs-deforestation/intermediates/dialog_writer_input.yaml
"""

import sys
import yaml


BARRIER_FIELDS = ["target_facets", "discussion_dynamic"]

# Terms that should NOT appear in the stripped output's weaknesses/accomplishes
FRAMEWORK_TERMS = [
    "facet", "lens", "logic", "evidence", "scope",
    "source_credibility", "source_diversity", "relevance", "sufficiency",
    "inferential_validity", "internal_consistency", "reasoning_completeness",
    "perspective_breadth", "consequence_consideration", "condition_sensitivity",
    "counter_argument_engagement",
    "confirmation_bias", "tunnel_vision", "overgeneralization", "false_cause",
    "uncritical_acceptance", "black_and_white_thinking", "egocentric_thinking",
    "false_certainty",
    "conformity", "conflict_avoidance", "authority_deference", "groupthink",
]


def strip_scenario(scenario_path, output_path):
    with open(scenario_path) as f:
        plan = yaml.safe_load(f)

    for field in BARRIER_FIELDS:
        if field in plan:
            del plan[field]

    # Verify no barrier fields remain
    for field in BARRIER_FIELDS:
        if field in plan:
            print(f"ERROR: {field} still present after stripping", file=sys.stderr)
            sys.exit(1)

    # Warn if framework terms appear in barrier-crossing fields
    warnings = []
    for persona in plan.get("personas", []):
        weaknesses = persona.get("weaknesses", "").lower()
        for term in FRAMEWORK_TERMS:
            if term.replace("_", " ") in weaknesses or term in weaknesses:
                warnings.append(
                    f"  WARNING: '{term}' found in {persona['name']}'s weaknesses"
                )
    for i, turn in enumerate(plan.get("turn_outline", [])):
        accomplishes = turn.get("accomplishes", "").lower()
        for term in FRAMEWORK_TERMS:
            if term.replace("_", " ") in accomplishes or term in accomplishes:
                warnings.append(
                    f"  WARNING: '{term}' found in turn {i+1} accomplishes"
                )

    if warnings:
        print("Framework terminology warnings:", file=sys.stderr)
        for w in warnings:
            print(w, file=sys.stderr)

    with open(output_path, "w") as f:
        yaml.dump(plan, f, default_flow_style=False, allow_unicode=True,
                  width=100, sort_keys=False)

    print(f"Stripped: {scenario_path} -> {output_path}")
    if warnings:
        print(f"  {len(warnings)} warning(s) — review barrier-crossing fields")
    else:
        print("  No framework terminology detected in barrier-crossing fields")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print(f"Usage: {sys.argv[0]} <scenario_path> <output_path>",
              file=sys.stderr)
        sys.exit(1)
    strip_scenario(sys.argv[1], sys.argv[2])
