#!/usr/bin/env python3
"""Validate a simplified episode-plan.yaml artifact."""

from __future__ import annotations

import argparse
import sys
from collections import Counter
from pathlib import Path

from _common import (
    load_yaml,
    print_result,
    require_int,
    require_list,
    require_mapping,
    require_nonempty_string,
)


ALLOWED_AMPLIFICATIONS = {"unmistakable", "showcased", "heightened"}

REQUIRED_PRIMARY_AMPLIFICATIONS = ("unmistakable", "showcased", "heightened")

TAXONOMY_PATH = (
    Path(__file__).resolve().parent.parent.parent / "reference" / "flaw-taxonomy.yaml"
)


def load_flaw_ids() -> set[str]:
    try:
        taxonomy = load_yaml(str(TAXONOMY_PATH))
    except Exception:
        return set()
    flaws = taxonomy.get("flaws", []) if isinstance(taxonomy, dict) else []
    ids: set[str] = set()
    for flaw in flaws:
        if isinstance(flaw, dict):
            flaw_id = flaw.get("id")
            if isinstance(flaw_id, str) and flaw_id.strip():
                ids.add(flaw_id.strip())
    return ids


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

    allowed_flaw_ids = load_flaw_ids()

    # Build per-flaw planned moment inventory while validating entry shapes.
    flaw_entries_by_id: dict[str, list[tuple[str, str]]] = {}
    for index, flaw in enumerate(flaws, start=1):
        entry = require_mapping(flaw, f"flaws[{index}]", errors)
        if not entry:
            continue
        flaw_id = require_nonempty_string(
            entry.get("focus_flaw"), f"flaws[{index}].focus_flaw", errors
        )
        scene_id = require_nonempty_string(
            entry.get("scene_id"), f"flaws[{index}].scene_id", errors
        )
        amplification = entry.get("amplification")
        require_nonempty_string(amplification, f"flaws[{index}].amplification", errors)
        if flaw_id and allowed_flaw_ids and flaw_id not in allowed_flaw_ids:
            errors.append(
                f"flaws[{index}].focus_flaw must reference a canonical flaw id, got '{flaw_id}'"
            )
        if isinstance(amplification, str) and amplification not in ALLOWED_AMPLIFICATIONS:
            errors.append(
                f"flaws[{index}].amplification must be one of "
                f"{sorted(ALLOWED_AMPLIFICATIONS)}, got '{amplification}'"
            )
        if "scene_note" in entry:
            require_nonempty_string(entry.get("scene_note"), f"flaws[{index}].scene_note", errors)
        if (
            flaw_id
            and scene_id
            and isinstance(amplification, str)
            and amplification in ALLOWED_AMPLIFICATIONS
        ):
            flaw_entries_by_id.setdefault(flaw_id, []).append((amplification, scene_id))

    # v2 exact gate: the primary flaw is the only flaw planned across all three
    # quiz bands, and it must do so exactly once each in distinct scenes.
    if flaw_entries_by_id:
        primary_candidates = [
            flaw_id
            for flaw_id, moments in flaw_entries_by_id.items()
            if set(amp for amp, _scene_id in moments) == set(REQUIRED_PRIMARY_AMPLIFICATIONS)
        ]
        if not primary_candidates:
            errors.append(
                "flaws must identify one primary focus_flaw with exactly one planned "
                "moment at each amplification: unmistakable, showcased, heightened."
            )
        elif len(primary_candidates) > 1:
            errors.append(
                "flaws has multiple primary-flaw candidates; only one focus_flaw may "
                "span unmistakable, showcased, and heightened."
            )
        else:
            primary_id = primary_candidates[0]
            primary_moments = flaw_entries_by_id[primary_id]
            primary_band_counts = Counter(amp for amp, _scene_id in primary_moments)
            if len(primary_moments) != len(REQUIRED_PRIMARY_AMPLIFICATIONS):
                errors.append(
                    f"primary flaw '{primary_id}' must have exactly 3 planned quiz moments "
                    f"(one each at {', '.join(REQUIRED_PRIMARY_AMPLIFICATIONS)}); got {len(primary_moments)}"
                )

            duplicate_bands = [
                band for band in REQUIRED_PRIMARY_AMPLIFICATIONS
                if primary_band_counts[band] != 1
            ]
            if duplicate_bands:
                errors.append(
                    f"primary flaw '{primary_id}' must have exactly one moment at each "
                    f"required amplification; bad counts for {duplicate_bands}"
                )

            scene_ids = [scene_id for _amp, scene_id in primary_moments]
            if len(set(scene_ids)) != len(scene_ids):
                errors.append(
                    f"primary flaw '{primary_id}' must land its 3 quiz moments in distinct scenes; "
                    f"got scene_ids {scene_ids}"
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

    for field in ("target_teachable_moments",):
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
