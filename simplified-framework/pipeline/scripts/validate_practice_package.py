#!/usr/bin/env python3
"""Validate a simplified practice_package.yaml artifact."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from _common import (
    load_yaml,
    print_result,
    require_list,
    require_mapping,
    require_nonempty_string,
    require_readability,
    warn_word_cap,
)


SCHEMA_VERSION = "simplified_v2"
TITLE_CAP = 6
SCENARIO_CAP = 80
PROMPT_CAP = 30
HINT_CAP = 30
CORRECT_FEEDBACK_CAP = 50
WRONG_FEEDBACK_CAP = 40
WORKED_EXPLANATION_CAP = 60
TAKEAWAY_CAP = 20

TAXONOMY_PATH = (
    Path(__file__).resolve().parent.parent.parent / "reference" / "flaw-taxonomy.yaml"
)


def load_flaw_ids() -> list[str]:
    try:
        taxonomy = load_yaml(str(TAXONOMY_PATH))
    except Exception:
        return []
    flaws = taxonomy.get("flaws", []) if isinstance(taxonomy, dict) else []
    ids: list[str] = []
    for flaw in flaws:
        if isinstance(flaw, dict):
            flaw_id = flaw.get("id")
            if isinstance(flaw_id, str) and flaw_id.strip():
                ids.append(flaw_id.strip())
    return ids


def validate_practice_package(path: str) -> int:
    errors: list[str] = []
    try:
        data = load_yaml(path)
    except Exception as exc:  # noqa: BLE001
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1

    package = require_mapping(data, "practice_package.yaml", errors)
    package_meta = require_mapping(package.get("package_meta"), "package_meta", errors)
    schema_version = require_nonempty_string(
        package_meta.get("schema_version"), "package_meta.schema_version", errors
    )
    if schema_version and schema_version != SCHEMA_VERSION:
        errors.append(f"package_meta.schema_version must be '{SCHEMA_VERSION}'")

    exercises = require_mapping(package.get("exercises"), "exercises", errors)
    expected_flaw_ids = load_flaw_ids()
    if expected_flaw_ids:
        actual_keys = sorted(exercises.keys())
        if sorted(expected_flaw_ids) != actual_keys:
            errors.append(
                "exercises must contain exactly the canonical flaw ids from reference/flaw-taxonomy.yaml"
            )

    for flaw_id in expected_flaw_ids:
        entry = require_mapping(exercises.get(flaw_id), f"exercises.{flaw_id}", errors)
        if not entry:
            continue

        require_nonempty_string(entry.get("exercise_id"), f"exercises.{flaw_id}.exercise_id", errors)
        entry_flaw_id = require_nonempty_string(entry.get("flaw_id"), f"exercises.{flaw_id}.flaw_id", errors)
        if entry_flaw_id and entry_flaw_id != flaw_id:
            errors.append(f"exercises.{flaw_id}.flaw_id must match its map key")

        title = require_nonempty_string(entry.get("title"), f"exercises.{flaw_id}.title", errors)
        if title:
            warn_word_cap(f"exercises.{flaw_id}.title", title, TITLE_CAP)

        scenario = require_nonempty_string(entry.get("scenario"), f"exercises.{flaw_id}.scenario", errors)
        if scenario:
            warn_word_cap(f"exercises.{flaw_id}.scenario", scenario, SCENARIO_CAP)
            require_readability(f"exercises.{flaw_id}.scenario", scenario, errors)

        prompt = require_nonempty_string(entry.get("prompt"), f"exercises.{flaw_id}.prompt", errors)
        if prompt:
            warn_word_cap(f"exercises.{flaw_id}.prompt", prompt, PROMPT_CAP)
            require_readability(f"exercises.{flaw_id}.prompt", prompt, errors)

        options = require_list(entry.get("options"), f"exercises.{flaw_id}.options", errors)
        option_ids: list[str] = []
        kind_counts = {"best_fit": 0, "uncertain": 0, "partial": 0, "off_target": 0}
        best_fit_id = None
        for index, option in enumerate(options, start=1):
            option_entry = require_mapping(option, f"exercises.{flaw_id}.options[{index}]", errors)
            option_id = require_nonempty_string(
                option_entry.get("option_id"),
                f"exercises.{flaw_id}.options[{index}].option_id",
                errors,
            )
            require_nonempty_string(
                option_entry.get("text"),
                f"exercises.{flaw_id}.options[{index}].text",
                errors,
            )
            kind = require_nonempty_string(
                option_entry.get("kind"),
                f"exercises.{flaw_id}.options[{index}].kind",
                errors,
            )
            if option_id:
                option_ids.append(option_id)
            if kind in kind_counts:
                kind_counts[kind] += 1
                if kind == "best_fit":
                    best_fit_id = option_id
            else:
                errors.append(
                    f"exercises.{flaw_id}.options[{index}].kind must be one of {sorted(kind_counts)}"
                )

        if kind_counts["best_fit"] != 1:
            errors.append(f"exercises.{flaw_id}.options must contain exactly one best_fit")
        if kind_counts["uncertain"] != 1:
            errors.append(f"exercises.{flaw_id}.options must contain exactly one uncertain")
        if kind_counts["partial"] < 1:
            errors.append(f"exercises.{flaw_id}.options must contain at least one partial")
        if kind_counts["off_target"] < 1:
            errors.append(f"exercises.{flaw_id}.options must contain at least one off_target")

        hint = require_nonempty_string(entry.get("hint"), f"exercises.{flaw_id}.hint", errors)
        if hint:
            warn_word_cap(f"exercises.{flaw_id}.hint", hint, HINT_CAP)
            require_readability(f"exercises.{flaw_id}.hint", hint, errors)

        feedback = require_mapping(entry.get("feedback"), f"exercises.{flaw_id}.feedback", errors)
        correct = require_mapping(feedback.get("correct"), f"exercises.{flaw_id}.feedback.correct", errors)
        correct_ids = require_list(
            correct.get("option_ids"),
            f"exercises.{flaw_id}.feedback.correct.option_ids",
            errors,
        )
        if len(correct_ids) != 1:
            errors.append(f"exercises.{flaw_id}.feedback.correct.option_ids must contain exactly one option id")
        elif best_fit_id and correct_ids[0] != best_fit_id:
            errors.append(
                f"exercises.{flaw_id}.feedback.correct.option_ids must reference the single best_fit option"
            )
        correct_text = require_nonempty_string(
            correct.get("text"),
            f"exercises.{flaw_id}.feedback.correct.text",
            errors,
        )
        if correct_text:
            warn_word_cap(f"exercises.{flaw_id}.feedback.correct.text", correct_text, CORRECT_FEEDBACK_CAP)
            require_readability(f"exercises.{flaw_id}.feedback.correct.text", correct_text, errors)

        by_option = require_mapping(
            feedback.get("by_option"),
            f"exercises.{flaw_id}.feedback.by_option",
            errors,
        )
        for option_id in option_ids:
            if option_id == best_fit_id:
                continue
            text = require_nonempty_string(
                by_option.get(option_id),
                f"exercises.{flaw_id}.feedback.by_option.{option_id}",
                errors,
            )
            if text:
                warn_word_cap(
                    f"exercises.{flaw_id}.feedback.by_option.{option_id}",
                    text,
                    WRONG_FEEDBACK_CAP,
                )
                require_readability(
                    f"exercises.{flaw_id}.feedback.by_option.{option_id}",
                    text,
                    errors,
                )

        worked_explanation = require_nonempty_string(
            entry.get("worked_explanation"),
            f"exercises.{flaw_id}.worked_explanation",
            errors,
        )
        if worked_explanation:
            warn_word_cap(
                f"exercises.{flaw_id}.worked_explanation",
                worked_explanation,
                WORKED_EXPLANATION_CAP,
            )
            require_readability(
                f"exercises.{flaw_id}.worked_explanation",
                worked_explanation,
                errors,
            )

        takeaway = require_nonempty_string(entry.get("takeaway"), f"exercises.{flaw_id}.takeaway", errors)
        if takeaway:
            warn_word_cap(f"exercises.{flaw_id}.takeaway", takeaway, TAKEAWAY_CAP)
            require_readability(f"exercises.{flaw_id}.takeaway", takeaway, errors)

    return print_result(errors)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Validate a simplified practice_package.yaml artifact")
    parser.add_argument("path", help="Path to practice_package.yaml")
    args = parser.parse_args()
    sys.exit(validate_practice_package(args.path))
