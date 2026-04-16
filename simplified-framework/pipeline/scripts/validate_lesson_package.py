#!/usr/bin/env python3
"""Validate a simplified lesson package artifact."""

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
    require_nonempty_string(correct.get("text"), f"{label}.correct.text", errors)

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
        require_nonempty_string(by_option.get(option_id), f"{label}.by_option.{option_id}", errors)


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
    episode_number = require_int(package_meta.get("episode_number"), "package_meta.episode_number", errors)
    if episode_number is not None and episode_number <= 0:
        errors.append("package_meta.episode_number must be greater than 0")
    require_nonempty_string(package_meta.get("schema_version"), "package_meta.schema_version", errors)

    episode = require_mapping(package.get("episode"), "episode", errors)
    require_nonempty_string(episode.get("title"), "episode.title", errors)
    require_nonempty_string(episode.get("student_intro"), "episode.student_intro", errors)
    flaws = require_list(episode.get("flaws"), "episode.flaws", errors)
    if not flaws:
        errors.append("episode.flaws must contain at least one flaw")
    for index, flaw in enumerate(flaws, start=1):
        require_nonempty_string(flaw, f"episode.flaws[{index}]", errors)
    require_nonempty_string(episode.get("final_takeaway"), "episode.final_takeaway", errors)

    warmups = require_mapping(package.get("warmups"), "warmups", errors)
    for warmup_name in ("modeled", "guided"):
        warmup = require_mapping(warmups.get(warmup_name), f"warmups.{warmup_name}", errors)
        require_nonempty_string(warmup.get("warmup_id"), f"warmups.{warmup_name}.warmup_id", errors)
        require_nonempty_string(warmup.get("turn_id"), f"warmups.{warmup_name}.turn_id", errors)
        require_nonempty_string(warmup.get("title"), f"warmups.{warmup_name}.title", errors)
        require_nonempty_string(warmup.get("focus_move"), f"warmups.{warmup_name}.focus_move", errors)
        require_nonempty_string(warmup.get("prompt"), f"warmups.{warmup_name}.prompt", errors)
        require_nonempty_string(warmup.get("best_answer_id"), f"warmups.{warmup_name}.best_answer_id", errors)
        require_nonempty_string(warmup.get("best_answer_text"), f"warmups.{warmup_name}.best_answer_text", errors)
        require_nonempty_string(warmup.get("worked_explanation"), f"warmups.{warmup_name}.worked_explanation", errors)
        require_nonempty_string(warmup.get("takeaway"), f"warmups.{warmup_name}.takeaway", errors)
        if warmup_name == "guided":
            option_ids = validate_answer_options(warmup.get("answer_options"), "warmups.guided.answer_options", errors)
            best = require_nonempty_string(warmup.get("best_answer_id"), "warmups.guided.best_answer_id", errors)
            if best and option_ids and best not in option_ids:
                errors.append("warmups.guided.best_answer_id must match one of the guided answer option ids")
            if "hint" in warmup:
                require_nonempty_string(warmup.get("hint"), "warmups.guided.hint", errors)

    levels = require_list(package.get("levels"), "levels", errors)
    if len(levels) < 1:
        errors.append("levels must contain at least one level")
    seen_level_ids: set[str] = set()
    expected_sequence = 1
    for index, level in enumerate(levels, start=1):
        entry = require_mapping(level, f"levels[{index}]", errors)
        level_id = require_nonempty_string(entry.get("level_id"), f"levels[{index}].level_id", errors)
        if level_id:
            if level_id in seen_level_ids:
                errors.append(f"duplicate level_id: {level_id}")
            seen_level_ids.add(level_id)
        seq = require_int(entry.get("sequence_index"), f"levels[{index}].sequence_index", errors)
        if seq is not None and seq != expected_sequence:
            errors.append(f"levels[{index}].sequence_index must be {expected_sequence}")
        expected_sequence += 1
        require_nonempty_string(entry.get("turn_id"), f"levels[{index}].turn_id", errors)
        require_nonempty_string(entry.get("title"), f"levels[{index}].title", errors)
        require_nonempty_string(entry.get("focus_move"), f"levels[{index}].focus_move", errors)
        require_nonempty_string(entry.get("prompt"), f"levels[{index}].prompt", errors)
        option_ids = validate_answer_options(entry.get("answer_options"), f"levels[{index}].answer_options", errors)
        best = require_nonempty_string(entry.get("best_answer_id"), f"levels[{index}].best_answer_id", errors)
        if best and option_ids and best not in option_ids:
            errors.append(f"levels[{index}].best_answer_id must match one of the answer option ids")
        require_nonempty_string(entry.get("hint"), f"levels[{index}].hint", errors)
        validate_feedback(entry.get("feedback"), f"levels[{index}].feedback", option_ids, errors)

    return print_result(errors)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Validate a simplified lesson package artifact")
    parser.add_argument("path", help="Path to lesson_package.yaml")
    args = parser.parse_args()
    sys.exit(validate_lesson_package(args.path))
