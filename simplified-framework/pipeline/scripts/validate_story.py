#!/usr/bin/env python3
"""Validate a simplified story.yaml artifact."""

from __future__ import annotations

import argparse
import sys

from _common import load_yaml, print_result, require_list, require_mapping, require_nonempty_string


def validate_story(path: str) -> int:
    errors: list[str] = []
    try:
        data = load_yaml(path)
    except Exception as exc:  # noqa: BLE001
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1

    story = require_mapping(data, "story.yaml", errors)
    require_nonempty_string(story.get("story_id"), "story_id", errors)
    require_nonempty_string(story.get("title"), "title", errors)
    require_nonempty_string(story.get("premise"), "premise", errors)

    characters = require_list(story.get("characters"), "characters", errors)
    if not characters:
        errors.append("characters must contain at least one character")
    for index, character in enumerate(characters, start=1):
        entry = require_mapping(character, f"characters[{index}]", errors)
        require_nonempty_string(entry.get("id"), f"characters[{index}].id", errors)
        require_nonempty_string(entry.get("name"), f"characters[{index}].name", errors)
        require_nonempty_string(entry.get("voice_notes"), f"characters[{index}].voice_notes", errors)

    episodes = require_list(story.get("episodes"), "episodes", errors)
    if not episodes:
        errors.append("episodes must contain at least one episode")
    for index, episode in enumerate(episodes, start=1):
        entry = require_mapping(episode, f"episodes[{index}]", errors)
        require_nonempty_string(entry.get("episode_id"), f"episodes[{index}].episode_id", errors)
        require_nonempty_string(entry.get("title"), f"episodes[{index}].title", errors)
        require_nonempty_string(entry.get("summary"), f"episodes[{index}].summary", errors)
        if "final_takeaway" in entry:
            require_nonempty_string(entry.get("final_takeaway"), f"episodes[{index}].final_takeaway", errors)
        if "flaws" in entry:
            errors.append(
                f"episodes[{index}].flaws is not allowed in v4; flaw inventories are no longer authored in story.yaml"
            )

    return print_result(errors)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Validate a simplified story.yaml artifact")
    parser.add_argument("path", help="Path to story.yaml")
    args = parser.parse_args()
    sys.exit(validate_story(args.path))
