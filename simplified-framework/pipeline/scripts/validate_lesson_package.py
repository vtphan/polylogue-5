#!/usr/bin/env python3
"""Validate a simplified lesson package artifact."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from _common import (
    load_yaml,
    print_result,
    require_int,
    require_list,
    require_mapping,
    require_nonempty_string,
    require_readability,
    warn_word_cap,
)


# P1: levels are capped at exactly 3 per episode. No transition period; existing
# artifacts with a different count are being archived.
REQUIRED_LEVEL_COUNT = 3

# v2 soft word caps for scaffolding prose.
EPISODE_SUMMARY_CAP = 60
EPISODE_PREVIOUSLY_CAP = 40
LEVEL_TAKEAWAY_CAP = 20

SCHEMA_VERSION = "simplified_v2"

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


def load_transcript_turn_map(package_path: str) -> dict[str, str]:
    transcript_path = Path(package_path).with_name("transcript.yaml")
    transcript = load_yaml(str(transcript_path))
    if not isinstance(transcript, dict):
        raise ValueError("paired transcript.yaml must be a mapping/object")
    scenes = transcript.get("scenes")
    if not isinstance(scenes, list):
        raise ValueError("paired transcript.yaml must contain scenes[]")
    turn_map: dict[str, str] = {}
    for scene in scenes:
        if not isinstance(scene, dict):
            continue
        scene_id = scene.get("scene_id")
        turns = scene.get("turns")
        if not isinstance(scene_id, str) or not isinstance(turns, list):
            continue
        for turn in turns:
            if not isinstance(turn, dict):
                continue
            turn_id = turn.get("turn_id")
            if isinstance(turn_id, str) and turn_id.strip():
                turn_map[turn_id.strip()] = scene_id.strip()
    return turn_map


def validate_answer_options(options: object, label: str, errors: list[str]) -> list[str]:
    option_list = require_list(options, label, errors)
    option_ids: list[str] = []
    for index, option in enumerate(option_list, start=1):
        entry = require_mapping(option, f"{label}[{index}]", errors)
        option_id = require_nonempty_string(entry.get("option_id"), f"{label}[{index}].option_id", errors)
        require_nonempty_string(entry.get("text"), f"{label}[{index}].text", errors)
        require_nonempty_string(entry.get("kind"), f"{label}[{index}].kind", errors)
        if option_id:
            option_ids.append(option_id)
    return option_ids


def validate_feedback(feedback: object, label: str, option_ids: list[str], errors: list[str]) -> None:
    feedback_map = require_mapping(feedback, label, errors)
    correct = require_mapping(feedback_map.get("correct"), f"{label}.correct", errors)
    ids = require_list(correct.get("option_ids"), f"{label}.correct.option_ids", errors)
    if not ids:
        errors.append(f"{label}.correct.option_ids must contain at least one option id")
    for idx, option_id in enumerate(ids, start=1):
        value = require_nonempty_string(option_id, f"{label}.correct.option_ids[{idx}]", errors)
        if value and value not in option_ids:
            errors.append(f"{label}.correct.option_ids[{idx}] references unknown option_id '{value}'")
    correct_text = require_nonempty_string(correct.get("text"), f"{label}.correct.text", errors)
    if correct_text:
        require_readability(f"{label}.correct.text", correct_text, errors)

    by_option = require_mapping(feedback_map.get("by_option"), f"{label}.by_option", errors)
    correct_ids = {
        value.strip() for value in ids
        if isinstance(value, str) and value.strip()
    }
    for option_id in option_ids:
        if option_id in correct_ids:
            continue
        if option_id not in by_option:
            errors.append(f"{label}.by_option is missing feedback for option_id '{option_id}'")
            continue
        feedback_text = require_nonempty_string(
            by_option.get(option_id), f"{label}.by_option.{option_id}", errors
        )
        if feedback_text:
            require_readability(f"{label}.by_option.{option_id}", feedback_text, errors)


def validate_episode_block(episode: dict, episode_number: int | None, errors: list[str]) -> None:
    """P3 + P4: episode.summary required, episode.previously required on ep 2+."""
    require_nonempty_string(episode.get("title"), "episode.title", errors)

    summary = require_nonempty_string(episode.get("summary"), "episode.summary", errors)
    if summary:
        warn_word_cap("episode.summary", summary, EPISODE_SUMMARY_CAP)
        require_readability("episode.summary", summary, errors)

    # P4: previously is required on ep 2+, forbidden on ep 1.
    # Forbidden = the key must not appear at all on ep 1 (an empty string is
    # still a field, not an absence).
    if episode_number is not None and episode_number > 1:
        previously_text = require_nonempty_string(
            episode.get("previously"), "episode.previously", errors
        )
        if previously_text:
            warn_word_cap(
                "episode.previously", previously_text, EPISODE_PREVIOUSLY_CAP
            )
            require_readability("episode.previously", previously_text, errors)
    elif episode_number is not None and episode_number == 1 and "previously" in episode:
        errors.append(
            "episode.previously must not be present on episode 1; omit the key entirely"
        )

    # Legacy field guard — student_intro has been renamed to summary.
    if "student_intro" in episode:
        errors.append(
            "episode.student_intro is no longer a valid field; rename to episode.summary"
        )

    flaws = require_list(episode.get("flaws"), "episode.flaws", errors)
    if not flaws:
        errors.append("episode.flaws must contain at least one flaw")
    for index, flaw in enumerate(flaws, start=1):
        require_nonempty_string(flaw, f"episode.flaws[{index}]", errors)
    final_takeaway = require_nonempty_string(
        episode.get("final_takeaway"), "episode.final_takeaway", errors
    )
    if final_takeaway:
        require_readability("episode.final_takeaway", final_takeaway, errors)


def validate_levels(
    levels: list,
    errors: list[str],
    allowed_flaw_ids: set[str],
) -> list[str]:
    """Validate levels[]; return turn_ids in order."""
    # P1: hard equality on level count.
    if len(levels) != REQUIRED_LEVEL_COUNT:
        errors.append(
            f"levels must contain exactly {REQUIRED_LEVEL_COUNT} entries (got {len(levels)})"
        )

    seen_level_ids: set[str] = set()
    level_turn_ids: list[str] = []
    expected_sequence = 1

    for index, level in enumerate(levels, start=1):
        entry = require_mapping(level, f"levels[{index}]", errors)
        if not entry:
            continue

        level_id = require_nonempty_string(entry.get("level_id"), f"levels[{index}].level_id", errors)
        if level_id:
            if level_id in seen_level_ids:
                errors.append(f"duplicate level_id: {level_id}")
            seen_level_ids.add(level_id)
        seq = require_int(entry.get("sequence_index"), f"levels[{index}].sequence_index", errors)
        if seq is not None and seq != expected_sequence:
            errors.append(f"levels[{index}].sequence_index must be {expected_sequence}")
        expected_sequence += 1

        turn_id = require_nonempty_string(entry.get("turn_id"), f"levels[{index}].turn_id", errors)
        if turn_id:
            level_turn_ids.append(turn_id)

        require_nonempty_string(entry.get("title"), f"levels[{index}].title", errors)
        focus_flaw = require_nonempty_string(
            entry.get("focus_flaw"), f"levels[{index}].focus_flaw", errors
        )
        if focus_flaw and allowed_flaw_ids and focus_flaw not in allowed_flaw_ids:
            errors.append(
                f"levels[{index}].focus_flaw must reference a canonical flaw id, got '{focus_flaw}'"
            )
        prompt = require_nonempty_string(entry.get("prompt"), f"levels[{index}].prompt", errors)
        if prompt:
            require_readability(f"levels[{index}].prompt", prompt, errors)

        option_ids = validate_answer_options(
            entry.get("answer_options"), f"levels[{index}].answer_options", errors
        )

        # P6: best_answer_id is optional on levels (runtime uses feedback.correct.option_ids).
        if "best_answer_id" in entry and entry.get("best_answer_id") not in (None, ""):
            best = require_nonempty_string(
                entry.get("best_answer_id"), f"levels[{index}].best_answer_id", errors
            )
            if best and option_ids and best not in option_ids:
                errors.append(
                    f"levels[{index}].best_answer_id must match one of the answer option ids"
                )

        # Level hint is optional per the authoring contract. If present it must
        # be a non-empty string — an empty string is not a valid hint shape.
        if "hint" in entry and entry.get("hint") is not None:
            hint = require_nonempty_string(entry.get("hint"), f"levels[{index}].hint", errors)
            if hint:
                require_readability(f"levels[{index}].hint", hint, errors)
        takeaway = require_nonempty_string(entry.get("takeaway"), f"levels[{index}].takeaway", errors)
        if takeaway:
            warn_word_cap(f"levels[{index}].takeaway", takeaway, LEVEL_TAKEAWAY_CAP)
            require_readability(f"levels[{index}].takeaway", takeaway, errors)
        validate_feedback(entry.get("feedback"), f"levels[{index}].feedback", option_ids, errors)

    return level_turn_ids


def validate_lesson_package(path: str) -> int:
    errors: list[str] = []
    try:
        data = load_yaml(path)
    except Exception as exc:  # noqa: BLE001
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1

    package = require_mapping(data, "lesson_package.yaml", errors)

    package_meta = require_mapping(package.get("package_meta"), "package_meta", errors)
    require_nonempty_string(package_meta.get("story_id"), "package_meta.story_id", errors)
    episode_number = require_int(
        package_meta.get("episode_number"), "package_meta.episode_number", errors
    )
    if episode_number is not None and episode_number <= 0:
        errors.append("package_meta.episode_number must be greater than 0")
    schema_version = require_nonempty_string(
        package_meta.get("schema_version"), "package_meta.schema_version", errors
    )
    if schema_version and schema_version != SCHEMA_VERSION:
        errors.append(
            f"package_meta.schema_version must be '{SCHEMA_VERSION}'; v1 -> v2 migration required"
        )

    episode = require_mapping(package.get("episode"), "episode", errors)
    validate_episode_block(episode, episode_number, errors)

    if "warmups" in package:
        errors.append("warmups is not allowed in simplified_v2; practice lives in practice_package.yaml")

    allowed_flaw_ids = load_flaw_ids()
    levels = require_list(package.get("levels"), "levels", errors)
    level_turn_ids = validate_levels(levels, errors, allowed_flaw_ids)

    try:
        turn_map = load_transcript_turn_map(path)
    except Exception as exc:  # noqa: BLE001
        errors.append(f"paired transcript lookup failed: {exc}")
        turn_map = {}

    seen_scene_ids: dict[str, str] = {}
    for index, turn_id in enumerate(level_turn_ids, start=1):
        label = f"levels[{index}].turn_id"
        if turn_id not in turn_map:
            errors.append(f"{label} references unknown turn_id '{turn_id}' in paired transcript")
            continue
        scene_id = turn_map[turn_id]
        if scene_id in seen_scene_ids:
            errors.append(
                f"levels may not target two turns in the same scene; {seen_scene_ids[scene_id]} and levels[{index}] both resolve to scene_id '{scene_id}'"
            )
        else:
            seen_scene_ids[scene_id] = f"levels[{index}]"

    return print_result(errors)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Validate a simplified lesson package artifact")
    parser.add_argument("path", help="Path to lesson_package.yaml")
    args = parser.parse_args()
    sys.exit(validate_lesson_package(args.path))
