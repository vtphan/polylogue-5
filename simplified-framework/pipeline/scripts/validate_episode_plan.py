#!/usr/bin/env python3
"""Validate a simplified episode-plan.yaml artifact."""

from __future__ import annotations

import argparse
import sys
from collections import Counter

from _common import (
    load_yaml,
    print_result,
    require_int,
    require_list,
    require_mapping,
    require_nonempty_string,
)


ALLOWED_AMPLIFICATIONS = {"unmistakable", "showcased", "heightened"}

# P11 net minimum: 5 primary-flaw moments total, covering all three
# amplification bands. This guarantees enough material for 2 warm-ups + 3
# levels with a valid amplification progression downstream.
PRIMARY_FLAW_MIN_MOMENTS = 5


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

    # Build (id, amplification) inventory while validating entry shapes.
    flaw_entries: list[tuple[str, str]] = []
    for index, flaw in enumerate(flaws, start=1):
        entry = require_mapping(flaw, f"flaws[{index}]", errors)
        if not entry:
            continue
        flaw_id = require_nonempty_string(entry.get("id"), f"flaws[{index}].id", errors)
        amplification = entry.get("amplification")
        require_nonempty_string(amplification, f"flaws[{index}].amplification", errors)
        if isinstance(amplification, str) and amplification not in ALLOWED_AMPLIFICATIONS:
            errors.append(
                f"flaws[{index}].amplification must be one of "
                f"{sorted(ALLOWED_AMPLIFICATIONS)}, got '{amplification}'"
            )
        if "scene_note" in entry:
            require_nonempty_string(entry.get("scene_note"), f"flaws[{index}].scene_note", errors)
        if flaw_id and isinstance(amplification, str) and amplification in ALLOWED_AMPLIFICATIONS:
            flaw_entries.append((flaw_id, amplification))

    # P11: plan-level amplification-mix assertion on the primary flaw.
    # Primary flaw is the most frequent id in flaws[] (ties broken by first
    # occurrence). The plan must carry ≥1 entry at each amplification band and
    # ≥5 moments total for the primary flaw, matching the 2 warm-ups + 3 levels
    # that the downstream lesson package requires.
    if flaw_entries:
        counts = Counter(entry[0] for entry in flaw_entries)
        top = counts.most_common(1)[0][1]
        # Preserve first-occurrence order among ties.
        tied_ids = [fid for fid in dict.fromkeys(entry[0] for entry in flaw_entries) if counts[fid] == top]
        primary_id = tied_ids[0]
        primary_amps = [amp for fid, amp in flaw_entries if fid == primary_id]
        primary_band_counts = Counter(primary_amps)

        missing_bands = [
            band for band in ("unmistakable", "showcased", "heightened")
            if primary_band_counts[band] < 1
        ]
        if missing_bands:
            errors.append(
                f"primary flaw '{primary_id}' is missing required amplification bands: "
                f"{missing_bands}. Plan must carry ≥1 moment at each of "
                f"unmistakable, showcased, heightened."
            )
        if len(primary_amps) < PRIMARY_FLAW_MIN_MOMENTS:
            errors.append(
                f"primary flaw '{primary_id}' has only {len(primary_amps)} moments; "
                f"plan must carry ≥{PRIMARY_FLAW_MIN_MOMENTS} (2 warm-ups + 3 levels)."
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
