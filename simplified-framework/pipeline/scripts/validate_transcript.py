#!/usr/bin/env python3
"""Validate a simplified transcript.yaml artifact."""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

from _common import (
    load_yaml,
    print_result,
    require_list,
    require_mapping,
    require_nonempty_string,
    require_readability,
    warn_readability,
    warn_word_cap,
    word_count,
)


TURN_ID_RE = re.compile(r"^t\d{2,}$")

ALLOWED_TRANSCRIPT_KEYS = {
    "story_id",
    "episode_id",
    "title",
    "characters",
    "scenes",
}

ALLOWED_SCENE_KEYS = {"scene_id", "summary", "turns"}

ALLOWED_TURN_KEYS = {"turn_id", "speaker", "text"}

SCENE_SUMMARY_WORD_CAP = 30

MIN_SCENES = 3

# Per-scene dialog readability stays warning-only in v2, and only once the
# scene has at least the shared 30-word minimum sample.
FK_MIN_DIALOG_WORDS_PER_SCENE = 30

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
    character_ids: set[str] = set()
    for index, character in enumerate(characters, start=1):
        cid = require_nonempty_string(character, f"characters[{index}]", errors)
        if cid:
            character_ids.add(cid.lower())

    scenes = require_list(transcript.get("scenes"), "scenes", errors)
    if not scenes:
        errors.append("scenes must contain at least one scene")
    elif len(scenes) < MIN_SCENES:
        errors.append(
            f"scenes must contain at least {MIN_SCENES} entries (got {len(scenes)})"
        )

    flaw_ids = load_flaw_ids()

    seen_scene_ids: set[str] = set()
    seen_turn_ids: set[str] = set()

    for scene_index, scene in enumerate(scenes, start=1):
        entry = require_mapping(scene, f"scenes[{scene_index}]", errors)
        if not entry:
            continue

        extra_scene = sorted(set(entry.keys()) - ALLOWED_SCENE_KEYS)
        if extra_scene:
            errors.append(
                f"scenes[{scene_index}] has disallowed keys: {extra_scene}"
            )

        scene_id = require_nonempty_string(
            entry.get("scene_id"), f"scenes[{scene_index}].scene_id", errors
        )
        if scene_id:
            if scene_id in seen_scene_ids:
                errors.append(f"duplicate scene_id: {scene_id}")
            seen_scene_ids.add(scene_id)

        summary = require_nonempty_string(
            entry.get("summary"), f"scenes[{scene_index}].summary", errors
        )
        if summary:
            warn_word_cap(
                f"scenes[{scene_index}].summary",
                summary,
                SCENE_SUMMARY_WORD_CAP,
            )
            require_readability(f"scenes[{scene_index}].summary", summary, errors)

        turns = require_list(entry.get("turns"), f"scenes[{scene_index}].turns", errors)
        if not turns:
            errors.append(f"scenes[{scene_index}].turns must contain at least one turn")

        scene_dialog_parts: list[str] = []

        for turn_index, turn in enumerate(turns, start=1):
            turn_entry = require_mapping(
                turn, f"scenes[{scene_index}].turns[{turn_index}]", errors
            )
            if not turn_entry:
                continue

            extra_turn = sorted(set(turn_entry.keys()) - ALLOWED_TURN_KEYS)
            if extra_turn:
                errors.append(
                    f"scenes[{scene_index}].turns[{turn_index}] has disallowed keys: "
                    f"{extra_turn}"
                )

            turn_id = require_nonempty_string(
                turn_entry.get("turn_id"),
                f"scenes[{scene_index}].turns[{turn_index}].turn_id",
                errors,
            )
            if "kind" in turn_entry:
                errors.append(
                    f"scenes[{scene_index}].turns[{turn_index}].kind is not allowed; turns are dialog-only"
                )
            text = require_nonempty_string(
                turn_entry.get("text"),
                f"scenes[{scene_index}].turns[{turn_index}].text",
                errors,
            )

            speaker = require_nonempty_string(
                turn_entry.get("speaker"),
                f"scenes[{scene_index}].turns[{turn_index}].speaker",
                errors,
            )

            if text and flaw_ids:
                for flaw_id in flaw_ids:
                    if flaw_id in text:
                        errors.append(
                            f"scenes[{scene_index}].turns[{turn_index}].text leaks "
                            f"framework flaw id '{flaw_id}'"
                        )

            if text:
                scene_dialog_parts.append(text)

            if turn_id:
                if not TURN_ID_RE.match(turn_id):
                    errors.append(
                        f"scenes[{scene_index}].turns[{turn_index}].turn_id must look "
                        f"like t01, t02, ..."
                    )
                if turn_id in seen_turn_ids:
                    errors.append(
                        f"duplicate turn_id '{turn_id}' at "
                        f"scenes[{scene_index}].turns[{turn_index}]; turn_ids must "
                        f"be unique across the whole transcript"
                    )
                seen_turn_ids.add(turn_id)

            if speaker and character_ids:
                # kept permissive: speaker may render as display name vs. id
                pass

        # Dialog stays warning-only in v2, but scene summaries remain
        # hard-error checked above.
        scene_dialog_text = " ".join(scene_dialog_parts)
        if word_count(scene_dialog_text) >= FK_MIN_DIALOG_WORDS_PER_SCENE:
            warn_readability(
                f"scenes[{scene_index}] (scene_id={scene_id or '?'}) dialog",
                scene_dialog_text,
            )

    return print_result(errors)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Validate a simplified transcript.yaml artifact")
    parser.add_argument("path", help="Path to transcript.yaml")
    args = parser.parse_args()
    sys.exit(validate_transcript(args.path))
