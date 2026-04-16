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

    allowed_amplifications = {"unmistakable", "showcased", "heightened"}
    flaws = require_list(plan.get("flaws"), "flaws", errors)
    if not flaws:
        errors.append("flaws must contain at least one flaw")
    for index, flaw in enumerate(flaws, start=1):
        entry = require_mapping(flaw, f"flaws[{index}]", errors)
        if not entry:
            continue
        require_nonempty_string(entry.get("id"), f"flaws[{index}].id", errors)
        amplification = entry.get("amplification")
        require_nonempty_string(amplification, f"flaws[{index}].amplification", errors)
        if isinstance(amplification, str) and amplification not in allowed_amplifications:
            errors.append(
                f"flaws[{index}].amplification must be one of "
                f"{sorted(allowed_amplifications)}, got '{amplification}'"
            )
        if "scene_note" in entry:
            require_nonempty_string(entry.get("scene_note"), f"flaws[{index}].scene_note", errors)

    flaw_count = len(flaws) if isinstance(flaws, list) else 0
    if 0 < flaw_count < 5:
        print(
            f"WARNING: episode-plan.yaml has only {flaw_count} flaw entries; "
            f"target is 5-7 per technical-spec.md. If multiple turns "
            f"are intended to carry the same flaw, write one entry per turn.",
            file=sys.stderr,
        )
    elif flaw_count > 7:
        print(
            f"WARNING: episode-plan.yaml has {flaw_count} flaw entries; "
            f"target is 5-7 per technical-spec.md.",
            file=sys.stderr,
        )

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
