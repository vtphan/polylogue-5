#!/usr/bin/env python3
"""Validate a simplified transcript.yaml artifact."""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

from _common import load_yaml, print_result, require_list, require_mapping, require_nonempty_string


TURN_ID_RE = re.compile(r"^t\d{2,}$")

ALLOWED_TRANSCRIPT_KEYS = {
    "story_id",
    "episode_id",
    "title",
    "characters",
    "turns",
    "setting_note",
    "previously",
}

ALLOWED_TURN_KEYS = {"turn_id", "speaker", "text"}

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


def validate_transcript(path: str) -> int:
    errors: list[str] = []
    try:
        data = load_yaml(path)
    except Exception as exc:  # noqa: BLE001
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1

    transcript = require_mapping(data, "transcript.yaml", errors)

    extra_top = sorted(set(transcript.keys()) - ALLOWED_TRANSCRIPT_KEYS)
    if extra_top:
        errors.append(f"transcript.yaml has disallowed keys: {extra_top}")

    require_nonempty_string(transcript.get("story_id"), "story_id", errors)
    require_nonempty_string(transcript.get("episode_id"), "episode_id", errors)
    require_nonempty_string(transcript.get("title"), "title", errors)

    characters = require_list(transcript.get("characters"), "characters", errors)
    if not characters:
        errors.append("characters must contain at least one character id")
    character_ids = set()
    for index, character in enumerate(characters, start=1):
        cid = require_nonempty_string(character, f"characters[{index}]", errors)
        if cid:
            character_ids.add(cid.lower())

    turns = require_list(transcript.get("turns"), "turns", errors)
    if not turns:
        errors.append("turns must contain at least one turn")

    flaw_ids = load_flaw_ids()

    seen_ids: set[str] = set()
    previous_number = 0
    for index, turn in enumerate(turns, start=1):
        entry = require_mapping(turn, f"turns[{index}]", errors)

        extra_turn = sorted(set(entry.keys()) - ALLOWED_TURN_KEYS)
        if extra_turn:
            errors.append(f"turns[{index}] has disallowed keys: {extra_turn}")

        turn_id = require_nonempty_string(entry.get("turn_id"), f"turns[{index}].turn_id", errors)
        speaker = require_nonempty_string(entry.get("speaker"), f"turns[{index}].speaker", errors)
        text = require_nonempty_string(entry.get("text"), f"turns[{index}].text", errors)

        if text and flaw_ids:
            for flaw_id in flaw_ids:
                if flaw_id in text:
                    errors.append(
                        f"turns[{index}].text leaks framework flaw id '{flaw_id}'"
                    )

        if turn_id:
            if not TURN_ID_RE.match(turn_id):
                errors.append(f"turns[{index}].turn_id must look like t01, t02, ...")
            if turn_id in seen_ids:
                errors.append(f"duplicate turn_id: {turn_id}")
            seen_ids.add(turn_id)
            try:
                number = int(turn_id[1:])
                if number <= previous_number:
                    errors.append("turn_id values must increase strictly")
                previous_number = number
            except ValueError:
                pass

        if speaker and character_ids and speaker.lower() not in character_ids and speaker.lower() not in {
            cid.replace("_", " ") for cid in character_ids
        }:
            pass

    return print_result(errors)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Validate a simplified transcript.yaml artifact")
    parser.add_argument("path", help="Path to transcript.yaml")
    args = parser.parse_args()
    sys.exit(validate_transcript(args.path))
