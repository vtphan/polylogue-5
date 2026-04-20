#!/usr/bin/env python3
"""Minimal shape checks for v4 pipeline-only intermediate artifacts."""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

from _common import load_yaml, print_result, require_list, require_mapping


TURN_ID_RE = re.compile(r"^t\d{2,}$")

REQUIRED_TOP_LEVEL_KEYS = {
    "showrunner-projection.yaml": {
        "story_id",
        "episode_id",
        "title",
        "narrative_synopsis",
        "hypothesis_pursued",
        "disproof_event",
        "character_beats",
        "running_threads",
        "plot_obligations",
    },
    "transcript.raw.yaml": {
        "story_id",
        "episode_id",
        "title",
        "characters",
        "turns",
        "revision_history",
        "status",
    },
    "transcript.post-doctor.yaml": {
        "story_id",
        "episode_id",
        "title",
        "characters",
        "turns",
        "revision_history",
        "status",
        "applied_from_proposal_round",
        "applied_turn_ids",
    },
    "flaw-proposals.yaml": {
        "story_id",
        "episode_id",
        "source_draft",
        "status",
        "candidate_turns",
        "recommended_turn_ids",
        "approved_anchors",
        "proposals",
        "revision_history",
    },
}


def validate_turn_ids(data: dict[str, object], label: str, errors: list[str]) -> None:
    turns = require_list(data.get("turns"), f"{label}.turns", errors)
    seen: set[str] = set()
    for index, turn in enumerate(turns, start=1):
        entry = require_mapping(turn, f"{label}.turns[{index}]", errors)
        turn_id = entry.get("turn_id")
        if not isinstance(turn_id, str) or not TURN_ID_RE.match(turn_id):
            errors.append(
                f"{label}.turns[{index}].turn_id must look like t01, t02, ..."
            )
            continue
        if turn_id in seen:
            errors.append(f"{label} contains duplicate turn_id '{turn_id}'")
            continue
        seen.add(turn_id)


def validate_intermediate(path: str) -> int:
    errors: list[str] = []
    filename = Path(path).name

    required = REQUIRED_TOP_LEVEL_KEYS.get(filename)
    if required is None:
        print(
            "ERROR: unsupported artifact for _intermediate_guards.py: "
            f"{filename}",
            file=sys.stderr,
        )
        return 1

    try:
        data = load_yaml(path)
    except Exception as exc:  # noqa: BLE001
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1

    mapping = require_mapping(data, filename, errors)
    missing = sorted(required - set(mapping.keys()))
    if missing:
        errors.append(f"{filename} is missing required top-level keys: {missing}")

    if filename in {"transcript.raw.yaml", "transcript.post-doctor.yaml"}:
        validate_turn_ids(mapping, filename, errors)

    return print_result(errors)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Minimal shape checks for v4 pipeline-only intermediate artifacts"
    )
    parser.add_argument("path", help="Path to an intermediate artifact")
    args = parser.parse_args()
    sys.exit(validate_intermediate(args.path))
