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
    warn_readability,
    warn_word_cap,
)


# P1: levels are capped at exactly 3 per episode. No transition period; existing
# artifacts with a different count are being archived.
REQUIRED_LEVEL_COUNT = 3

# P5 word caps for scaffolding prose. Warnings in Phase 1; promoted to hard
# errors after `the-white-squirrel` ep 1 lands (Phase 4).
EPISODE_SUMMARY_CAP = 60
EPISODE_PREVIOUSLY_CAP = 40
WARMUP_WORKED_EXPLANATION_CAP = 60
WARMUP_BEST_ANSWER_TEXT_CAP = 40
WARMUP_TAKEAWAY_CAP = 20


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
        warn_readability(f"{label}.correct.text", correct_text)

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
            warn_readability(f"{label}.by_option.{option_id}", feedback_text)


def validate_episode_block(episode: dict, episode_number: int | None, errors: list[str]) -> None:
    """P3 + P4: episode.summary required, episode.previously required on ep 2+."""
    require_nonempty_string(episode.get("title"), "episode.title", errors)

    summary = require_nonempty_string(episode.get("summary"), "episode.summary", errors)
    if summary:
        warn_word_cap("episode.summary", summary, EPISODE_SUMMARY_CAP)
        warn_readability("episode.summary", summary)

    # P4: previously is required on ep 2+, forbidden on ep 1.
    has_previously = "previously" in episode and episode.get("previously") not in (None, "")
    if episode_number is not None and episode_number > 1:
        if not has_previously:
            errors.append("episode.previously is required when package_meta.episode_number > 1")
        else:
            previously_text = require_nonempty_string(
                episode.get("previously"), "episode.previously", errors
            )
            if previously_text:
                warn_word_cap(
                    "episode.previously", previously_text, EPISODE_PREVIOUSLY_CAP
                )
                warn_readability("episode.previously", previously_text)
    elif episode_number is not None and episode_number == 1 and has_previously:
        errors.append("episode.previously must not be set on episode 1")

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
        warn_readability("episode.final_takeaway", final_takeaway)


def validate_warmup(
    warmup: dict, warmup_name: str, errors: list[str]
) -> str | None:
    """Validate one warm-up block; return its turn_id if present."""
    label = f"warmups.{warmup_name}"
    require_nonempty_string(warmup.get("warmup_id"), f"{label}.warmup_id", errors)
    turn_id = require_nonempty_string(warmup.get("turn_id"), f"{label}.turn_id", errors)
    require_nonempty_string(warmup.get("title"), f"{label}.title", errors)
    require_nonempty_string(warmup.get("focus_move"), f"{label}.focus_move", errors)
    require_nonempty_string(warmup.get("prompt"), f"{label}.prompt", errors)
    require_nonempty_string(warmup.get("best_answer_id"), f"{label}.best_answer_id", errors)

    best_answer_text = require_nonempty_string(
        warmup.get("best_answer_text"), f"{label}.best_answer_text", errors
    )
    if best_answer_text:
        warn_word_cap(
            f"{label}.best_answer_text", best_answer_text, WARMUP_BEST_ANSWER_TEXT_CAP
        )
        warn_readability(f"{label}.best_answer_text", best_answer_text)

    worked_explanation = require_nonempty_string(
        warmup.get("worked_explanation"), f"{label}.worked_explanation", errors
    )
    if worked_explanation:
        warn_word_cap(
            f"{label}.worked_explanation",
            worked_explanation,
            WARMUP_WORKED_EXPLANATION_CAP,
        )
        warn_readability(f"{label}.worked_explanation", worked_explanation)

    takeaway = require_nonempty_string(warmup.get("takeaway"), f"{label}.takeaway", errors)
    if takeaway:
        warn_word_cap(f"{label}.takeaway", takeaway, WARMUP_TAKEAWAY_CAP)
        warn_readability(f"{label}.takeaway", takeaway)

    if warmup_name == "guided":
        option_ids = validate_answer_options(
            warmup.get("answer_options"), f"{label}.answer_options", errors
        )
        best = require_nonempty_string(warmup.get("best_answer_id"), f"{label}.best_answer_id", errors)
        if best and option_ids and best not in option_ids:
            errors.append(f"{label}.best_answer_id must match one of the guided answer option ids")
        if "hint" in warmup:
            require_nonempty_string(warmup.get("hint"), f"{label}.hint", errors)

    return turn_id or None


def validate_levels(
    levels: list, errors: list[str]
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
        require_nonempty_string(entry.get("focus_move"), f"levels[{index}].focus_move", errors)
        prompt = require_nonempty_string(entry.get("prompt"), f"levels[{index}].prompt", errors)
        if prompt:
            warn_readability(f"levels[{index}].prompt", prompt)

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

        hint = require_nonempty_string(entry.get("hint"), f"levels[{index}].hint", errors)
        if hint:
            warn_readability(f"levels[{index}].hint", hint)
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
    require_nonempty_string(package_meta.get("schema_version"), "package_meta.schema_version", errors)

    episode = require_mapping(package.get("episode"), "episode", errors)
    validate_episode_block(episode, episode_number, errors)

    warmups = require_mapping(package.get("warmups"), "warmups", errors)
    warmup_turn_ids: list[tuple[str, str]] = []
    for warmup_name in ("modeled", "guided"):
        warmup = require_mapping(warmups.get(warmup_name), f"warmups.{warmup_name}", errors)
        if warmup:
            turn_id = validate_warmup(warmup, warmup_name, errors)
            if turn_id:
                warmup_turn_ids.append((f"warmups.{warmup_name}", turn_id))

    levels = require_list(package.get("levels"), "levels", errors)
    level_turn_ids = validate_levels(levels, errors)

    # P11: the 2 warm-up + 3 level turn_ids must be pairwise distinct. Reuse
    # would collapse amplification progression into "same moment, asked twice."
    all_slots: list[tuple[str, str]] = list(warmup_turn_ids) + [
        (f"levels[{index + 1}]", turn_id) for index, turn_id in enumerate(level_turn_ids)
    ]
    seen: dict[str, str] = {}
    for slot_label, turn_id in all_slots:
        if turn_id in seen:
            errors.append(
                f"turn_id '{turn_id}' reused across {seen[turn_id]} and {slot_label}; "
                f"warm-up and level slots must reference distinct turns"
            )
        else:
            seen[turn_id] = slot_label

    return print_result(errors)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Validate a simplified lesson package artifact")
    parser.add_argument("path", help="Path to lesson_package.yaml")
    args = parser.parse_args()
    sys.exit(validate_lesson_package(args.path))
