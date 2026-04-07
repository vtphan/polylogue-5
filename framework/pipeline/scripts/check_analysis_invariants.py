#!/usr/bin/env python3
"""Check cross-field invariants on analysis.yaml that the descriptive
schema cannot express.

`validate_schema.py` enforces field presence, types, enums, list lengths,
and regex patterns — but it has no conditional-required mechanism. The
analysis schema has several invariants that depend on cross-field state:

  1. Strong annotations must carry a contrastive_explanation.
     (See system-evaluation-20260406.md suggestion E.)

  2. Strong annotations must have null cognitive_pattern and social_dynamic
     under explanatory_variables. The framework has no positive explanatory
     variables — strengths are explained contrastively, not by assigning
     positive cog/social variables to the strength itself.

  3. Every entry in the episode plan's target_strengths must appear as
     at least one strong, was_targeted=true annotation in the analysis.
     (Otherwise the doctrinally-required strength signal was silently
     dropped between scenario design and analysis.) This check is
     skipped if the episode plan is not provided.

Exits 1 on any violation. Report is always printed in full so the
operator can see all problems at once, not just the first.

Usage:
    python3 framework/pipeline/scripts/check_analysis_invariants.py \\
        <analysis_path> [<episode_path>]
"""

import sys

import yaml


def load_yaml(path):
    with open(path) as f:
        return yaml.safe_load(f)


def check(analysis_path, episode_path=None):
    analysis = load_yaml(analysis_path) or {}
    episode = load_yaml(episode_path) if episode_path else None

    issues = []
    strong_targeted_facets = set()

    passages = analysis.get("passage_analyses") or []
    for passage in passages:
        pid = passage.get("passage_id", "<unknown passage>")
        for ann in passage.get("facet_annotations") or []:
            facet = ann.get("facet_id", "<unknown facet>")
            quality = (ann.get("quality_level") or "").strip().lower()
            where = f"{pid}:{facet}"

            if quality == "strong":
                contrastive = (ann.get("contrastive_explanation") or "").strip()
                if not contrastive:
                    issues.append(
                        f"{where}: strong annotation missing "
                        f"contrastive_explanation (required by suggestion E)"
                    )

                ev = ann.get("explanatory_variables") or {}
                if ev.get("cognitive_pattern") is not None:
                    issues.append(
                        f"{where}: strong annotation has non-null "
                        f"explanatory_variables.cognitive_pattern "
                        f"({ev.get('cognitive_pattern')!r}); strengths must "
                        f"have null cog/social variables"
                    )
                if ev.get("social_dynamic") is not None:
                    issues.append(
                        f"{where}: strong annotation has non-null "
                        f"explanatory_variables.social_dynamic "
                        f"({ev.get('social_dynamic')!r}); strengths must "
                        f"have null cog/social variables"
                    )

                if ann.get("was_targeted") is True:
                    strong_targeted_facets.add(facet)

    # Cross-check against the episode plan if available.
    if episode is not None:
        planned_strengths = episode.get("target_strengths") or []
        for entry in planned_strengths:
            facet = entry.get("facet_id")
            if not facet:
                continue
            if facet not in strong_targeted_facets:
                issues.append(
                    f"target_strengths:{facet}: planned strength has no "
                    f"matching strong+was_targeted annotation in analysis "
                    f"(doctrinal mixed-valence requirement)"  # noqa
                )

    print(f"Checking analysis invariants: {analysis_path}")
    if episode_path:
        print(f"  Cross-checking against episode plan: {episode_path}")

    if not issues:
        print("  PASS: all invariants hold")
        return 0

    print(f"\n  ISSUES ({len(issues)}):")
    for issue in issues:
        print(f"    - {issue}")
    return 1


def main():
    if len(sys.argv) not in (2, 3):
        print(
            "Usage: check_analysis_invariants.py <analysis_path> "
            "[<episode_path>]",
            file=sys.stderr,
        )
        return 2
    return check(sys.argv[1], sys.argv[2] if len(sys.argv) == 3 else None)


if __name__ == "__main__":
    sys.exit(main())
