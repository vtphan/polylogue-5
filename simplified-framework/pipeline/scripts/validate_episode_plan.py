#!/usr/bin/env python3
"""Validate a simplified episode-plan.yaml artifact."""

from __future__ import annotations

import argparse
import sys

from _common import (
    load_yaml,
    print_result,
    require_int,
    require_list,
    require_mapping,
    require_nonempty_string,
)


def validate_episode_plan(path: str) -> int:
    errors: list[str] = []
    try:
        data = load_yaml(path)
    except Exception as exc:  # noqa: BLE001
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1

    plan = require_mapping(data, "episode-plan.yaml", errors)
    require_nonempty_string(plan.get("story_id"), "story_id", errors)
    require_nonempty_string(plan.get("episode_id"), "episode_id", errors)
    require_nonempty_string(plan.get("title"), "title", errors)
    require_nonempty_string(plan.get("episode_goal"), "episode_goal", errors)
    require_nonempty_string(plan.get("student_takeaway"), "student_takeaway", errors)

    flaws = require_list(plan.get("flaws"), "flaws", errors)
    if not flaws:
        errors.append("flaws must contain at least one flaw")
    for index, flaw in enumerate(flaws, start=1):
        require_nonempty_string(flaw, f"flaws[{index}]", errors)

    if "scene_design" in plan:
        scene = require_mapping(plan.get("scene_design"), "scene_design", errors)
        for field in ("opening", "turn", "close"):
            if field in scene:
                require_nonempty_string(scene.get(field), f"scene_design.{field}", errors)

    if "character_beats" in plan:
        beats = require_list(plan.get("character_beats"), "character_beats", errors)
        for index, beat in enumerate(beats, start=1):
            entry = require_mapping(beat, f"character_beats[{index}]", errors)
            require_nonempty_string(entry.get("character_id"), f"character_beats[{index}].character_id", errors)
            require_nonempty_string(entry.get("beat"), f"character_beats[{index}].beat", errors)

    if "flaw_embedding_guidance" in plan:
        guidance = require_mapping(plan.get("flaw_embedding_guidance"), "flaw_embedding_guidance", errors)
        for field in ("must_include", "avoid"):
            if field in guidance:
                items = require_list(guidance.get(field), f"flaw_embedding_guidance.{field}", errors)
                for item_index, item in enumerate(items, start=1):
                    require_nonempty_string(item, f"flaw_embedding_guidance.{field}[{item_index}]", errors)

    for field in ("target_teachable_moments", "warmup_candidate_goal", "level_candidate_goal"):
        if field in plan:
            value = require_int(plan.get(field), field, errors)
            if value is not None and value <= 0:
                errors.append(f"{field} must be greater than 0")

    return print_result(errors)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Validate a simplified episode-plan.yaml artifact")
    parser.add_argument("path", help="Path to episode-plan.yaml")
    args = parser.parse_args()
    sys.exit(validate_episode_plan(args.path))
