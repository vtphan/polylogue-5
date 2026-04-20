#!/usr/bin/env python3
"""Validate a simplified flaw-proposals.yaml artifact."""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

from _common import (
    load_yaml,
    print_result,
    require_int,
    require_list,
    require_mapping,
    require_nonempty_string,
)


TURN_ID_RE = re.compile(r"^t\d{2,}$")

ALLOWED_STATUSES = {"pending_review", "approved", "needs_revision"}
ALLOWED_EXPRESSIONS = {"strongly_expressed", "moderately_expressed"}
ALLOWED_PROPOSAL_TYPES = {"tweak", "replace", "add_beat"}


def load_flaw_ids() -> set[str]:
    taxonomy_path = (
        Path(__file__).resolve().parent.parent.parent
        / "reference"
        / "flaw-taxonomy.yaml"
    )
    data = load_yaml(str(taxonomy_path))
    if not isinstance(data, dict):
        return set()
    flaws = data.get("flaws")
    if not isinstance(flaws, list):
        return set()
    ids: set[str] = set()
    for entry in flaws:
        if isinstance(entry, dict):
            flaw_id = entry.get("id")
            if isinstance(flaw_id, str) and flaw_id.strip():
                ids.add(flaw_id.strip())
    return ids


def validate_turn_id(value: object, label: str, errors: list[str]) -> str:
    text = require_nonempty_string(value, label, errors)
    if text and not TURN_ID_RE.match(text):
        errors.append(f"{label} must look like t01, t02, ... (got {text!r})")
    return text


def validate_enum(
    value: object,
    label: str,
    allowed: set[str],
    errors: list[str],
) -> str:
    text = require_nonempty_string(value, label, errors)
    if text and text not in allowed:
        errors.append(
            f"{label} must be one of {sorted(allowed)} (got {text!r})"
        )
    return text


def validate_flaw_id(
    value: object,
    label: str,
    taxonomy_ids: set[str],
    errors: list[str],
) -> str:
    text = require_nonempty_string(value, label, errors)
    if text and taxonomy_ids and text not in taxonomy_ids:
        errors.append(
            f"{label} must be a canonical flaw id from "
            f"reference/flaw-taxonomy.yaml (got {text!r})"
        )
    return text


def validate_candidate_turns(
    turns: list[object],
    taxonomy_ids: set[str],
    errors: list[str],
) -> None:
    seen: set[str] = set()
    for index, raw in enumerate(turns, start=1):
        entry = require_mapping(raw, f"candidate_turns[{index}]", errors)
        turn_id = validate_turn_id(
            entry.get("turn_id"), f"candidate_turns[{index}].turn_id", errors
        )
        if turn_id:
            if turn_id in seen:
                errors.append(
                    f"candidate_turns contains duplicate turn_id {turn_id!r}"
                )
            seen.add(turn_id)
        validate_flaw_id(
            entry.get("suggested_flaw"),
            f"candidate_turns[{index}].suggested_flaw",
            taxonomy_ids,
            errors,
        )
        validate_enum(
            entry.get("expression_strength"),
            f"candidate_turns[{index}].expression_strength",
            ALLOWED_EXPRESSIONS,
            errors,
        )
        require_nonempty_string(
            entry.get("rationale"),
            f"candidate_turns[{index}].rationale",
            errors,
        )


def validate_recommended_turn_ids(
    ids: list[object],
    candidate_ids: set[str],
    errors: list[str],
) -> None:
    for index, raw in enumerate(ids, start=1):
        turn_id = validate_turn_id(
            raw, f"recommended_turn_ids[{index}]", errors
        )
        if turn_id and candidate_ids and turn_id not in candidate_ids:
            errors.append(
                f"recommended_turn_ids[{index}] = {turn_id!r} is not present "
                "in candidate_turns"
            )


def validate_approved_anchors(
    anchors: list[object],
    taxonomy_ids: set[str],
    errors: list[str],
) -> None:
    seen: set[str] = set()
    for index, raw in enumerate(anchors, start=1):
        entry = require_mapping(raw, f"approved_anchors[{index}]", errors)
        turn_id = validate_turn_id(
            entry.get("turn_id"), f"approved_anchors[{index}].turn_id", errors
        )
        if turn_id:
            if turn_id in seen:
                errors.append(
                    f"approved_anchors contains duplicate turn_id {turn_id!r}"
                )
            seen.add(turn_id)
        validate_flaw_id(
            entry.get("focus_flaw"),
            f"approved_anchors[{index}].focus_flaw",
            taxonomy_ids,
            errors,
        )
        validate_enum(
            entry.get("expression_strength"),
            f"approved_anchors[{index}].expression_strength",
            ALLOWED_EXPRESSIONS,
            errors,
        )


def validate_proposal_entry(
    entry: dict,
    label: str,
    taxonomy_ids: set[str],
    errors: list[str],
) -> None:
    require_nonempty_string(entry.get("proposal_id"), f"{label}.proposal_id", errors)
    proposal_type = validate_enum(
        entry.get("proposal_type"),
        f"{label}.proposal_type",
        ALLOWED_PROPOSAL_TYPES,
        errors,
    )
    validate_turn_id(entry.get("turn_id"), f"{label}.turn_id", errors)
    require_nonempty_string(entry.get("rationale"), f"{label}.rationale", errors)
    validate_flaw_id(
        entry.get("focus_flaw"), f"{label}.focus_flaw", taxonomy_ids, errors
    )
    validate_enum(
        entry.get("expression_strength"),
        f"{label}.expression_strength",
        ALLOWED_EXPRESSIONS,
        errors,
    )

    if proposal_type in {"tweak", "replace"}:
        require_nonempty_string(
            entry.get("replacement_text"), f"{label}.replacement_text", errors
        )
        for forbidden in ("insert_after_turn_id", "insert_before_turn_id", "new_turn"):
            if forbidden in entry:
                errors.append(
                    f"{label}.{forbidden} is only allowed on proposal_type "
                    f"add_beat (saw on {proposal_type})"
                )
    elif proposal_type == "add_beat":
        if "replacement_text" in entry:
            errors.append(
                f"{label}.replacement_text is not allowed on proposal_type "
                "add_beat"
            )
        placement_keys = [
            key
            for key in ("insert_after_turn_id", "insert_before_turn_id")
            if key in entry
        ]
        if len(placement_keys) != 1:
            errors.append(
                f"{label} must include exactly one of insert_after_turn_id "
                f"or insert_before_turn_id (saw {placement_keys})"
            )
        for key in placement_keys:
            validate_turn_id(entry.get(key), f"{label}.{key}", errors)
        new_turn = entry.get("new_turn")
        if new_turn is None:
            errors.append(f"{label}.new_turn is required for add_beat proposals")
        else:
            new_turn_map = require_mapping(new_turn, f"{label}.new_turn", errors)
            require_nonempty_string(
                new_turn_map.get("speaker"), f"{label}.new_turn.speaker", errors
            )
            require_nonempty_string(
                new_turn_map.get("text"), f"{label}.new_turn.text", errors
            )


def validate_proposals(
    proposals: list[object],
    taxonomy_ids: set[str],
    errors: list[str],
) -> None:
    seen_ids: set[str] = set()
    for index, raw in enumerate(proposals, start=1):
        entry = require_mapping(raw, f"proposals[{index}]", errors)
        validate_proposal_entry(entry, f"proposals[{index}]", taxonomy_ids, errors)
        proposal_id = entry.get("proposal_id")
        if isinstance(proposal_id, str) and proposal_id.strip():
            if proposal_id in seen_ids:
                errors.append(
                    f"proposals contains duplicate proposal_id "
                    f"{proposal_id!r}"
                )
            seen_ids.add(proposal_id)


def validate_revision_history(history: list[object], errors: list[str]) -> None:
    seen_rounds: set[int] = set()
    for index, raw in enumerate(history, start=1):
        entry = require_mapping(raw, f"revision_history[{index}]", errors)
        round_value = require_int(
            entry.get("round"), f"revision_history[{index}].round", errors
        )
        if round_value is not None:
            if round_value < 1:
                errors.append(
                    f"revision_history[{index}].round must be >= 1"
                )
            if round_value in seen_rounds:
                errors.append(
                    f"revision_history contains duplicate round {round_value}"
                )
            seen_rounds.add(round_value)
        require_nonempty_string(
            entry.get("feedback_summary"),
            f"revision_history[{index}].feedback_summary",
            errors,
        )
        require_nonempty_string(
            entry.get("revision_note"),
            f"revision_history[{index}].revision_note",
            errors,
        )


def validate_flaw_proposals(path: str) -> int:
    errors: list[str] = []
    try:
        data = load_yaml(path)
    except Exception as exc:  # noqa: BLE001
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1

    try:
        taxonomy_ids = load_flaw_ids()
    except Exception as exc:  # noqa: BLE001
        print(f"ERROR: could not load flaw taxonomy: {exc}", file=sys.stderr)
        return 1

    top = require_mapping(data, "flaw-proposals.yaml", errors)
    require_nonempty_string(top.get("story_id"), "story_id", errors)
    require_nonempty_string(top.get("episode_id"), "episode_id", errors)
    require_nonempty_string(top.get("source_draft"), "source_draft", errors)
    validate_enum(top.get("status"), "status", ALLOWED_STATUSES, errors)

    candidate_turns = require_list(
        top.get("candidate_turns"), "candidate_turns", errors
    )
    validate_candidate_turns(candidate_turns, taxonomy_ids, errors)
    candidate_ids = {
        entry.get("turn_id")
        for entry in candidate_turns
        if isinstance(entry, dict) and isinstance(entry.get("turn_id"), str)
    }

    recommended = require_list(
        top.get("recommended_turn_ids"), "recommended_turn_ids", errors
    )
    validate_recommended_turn_ids(recommended, candidate_ids, errors)

    approved_anchors = require_list(
        top.get("approved_anchors"), "approved_anchors", errors
    )
    validate_approved_anchors(approved_anchors, taxonomy_ids, errors)

    proposals = require_list(top.get("proposals"), "proposals", errors)
    validate_proposals(proposals, taxonomy_ids, errors)

    history = require_list(
        top.get("revision_history"), "revision_history", errors
    )
    validate_revision_history(history, errors)

    status = top.get("status") if isinstance(top.get("status"), str) else ""
    if status == "approved" and approved_anchors:
        for index, anchor in enumerate(approved_anchors, start=1):
            if not isinstance(anchor, dict):
                continue
            turn_id = anchor.get("turn_id")
            if (
                isinstance(turn_id, str)
                and candidate_ids
                and turn_id not in candidate_ids
            ):
                errors.append(
                    f"approved_anchors[{index}].turn_id = {turn_id!r} is not "
                    "present in candidate_turns"
                )

    return print_result(errors)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Validate a simplified flaw-proposals.yaml artifact"
    )
    parser.add_argument("path", help="Path to flaw-proposals.yaml")
    args = parser.parse_args()
    sys.exit(validate_flaw_proposals(args.path))
