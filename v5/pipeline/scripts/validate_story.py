#!/usr/bin/env python3
"""Validate v5 story.yaml against its schema contract.

Canonical shape checks for v5 story-design output. Accepts one or more
story.yaml paths. Exits 0 on pass, 1 on any validation failure, 2 on
usage / environment errors.

Usage:
  python3 v5/pipeline/scripts/validate_story.py <path-to-story.yaml> [<more>]

Reference: v5/schemas/story.yaml (descriptive contract),
           v5/docs/story-design-doctrine.md §1 (output contract).
"""

from __future__ import annotations

import re
import sys
from pathlib import Path
from typing import Any

try:
    import yaml
except ImportError:
    print("error: PyYAML not installed. Run `pip install pyyaml`.", file=sys.stderr)
    sys.exit(2)


SNAKE_CASE = re.compile(r"^[a-z][a-z0-9_]*$")

REQUIRED_TOP = ("story_id", "title", "premise", "characters", "episodes")
REQUIRED_CHARACTER = ("character_id", "name", "voice_hook")
REQUIRED_EPISODE = (
    "episode_id",
    "title",
    "episode_synopsis",
    "reading_time_minutes",
    "word_count_range",
    "final_takeaway",
)


def _is_int(v: Any) -> bool:
    return isinstance(v, int) and not isinstance(v, bool)


def validate(story: Any) -> list[str]:
    errors: list[str] = []

    if not isinstance(story, dict):
        return ["story.yaml must be a top-level mapping"]

    for f in REQUIRED_TOP:
        if f not in story:
            errors.append(f"missing required top-level field: {f}")

    sid = story.get("story_id")
    if isinstance(sid, str) and not SNAKE_CASE.match(sid):
        errors.append(f'story_id must be snake_case (got "{sid}")')
    elif "story_id" in story and not isinstance(sid, str):
        errors.append("story_id must be a string")

    if "title" in story and not isinstance(story["title"], str):
        errors.append("title must be a string")
    if "premise" in story and not isinstance(story["premise"], str):
        errors.append("premise must be a string")

    characters = story.get("characters")
    if isinstance(characters, list):
        if not characters:
            errors.append("characters[] must not be empty")
        for i, c in enumerate(characters):
            if not isinstance(c, dict):
                errors.append(f"characters[{i}] must be a mapping")
                continue
            for f in REQUIRED_CHARACTER:
                if f not in c:
                    errors.append(f"characters[{i}] missing field: {f}")
            cid = c.get("character_id")
            if isinstance(cid, str) and not SNAKE_CASE.match(cid):
                errors.append(
                    f'characters[{i}].character_id must be snake_case (got "{cid}")'
                )
    elif "characters" in story:
        errors.append("characters must be an array")

    episodes = story.get("episodes")
    if isinstance(episodes, list):
        if not episodes:
            errors.append("episodes[] must not be empty")
        for i, ep in enumerate(episodes):
            if not isinstance(ep, dict):
                errors.append(f"episodes[{i}] must be a mapping")
                continue
            for f in REQUIRED_EPISODE:
                if f not in ep:
                    errors.append(f"episodes[{i}] missing field: {f}")

            eid = ep.get("episode_id")
            if isinstance(eid, str) and not SNAKE_CASE.match(eid):
                errors.append(
                    f'episodes[{i}].episode_id must be snake_case (got "{eid}")'
                )

            rtm = ep.get("reading_time_minutes")
            if "reading_time_minutes" in ep:
                if not _is_int(rtm):
                    errors.append(
                        f"episodes[{i}].reading_time_minutes must be an integer"
                    )
                elif not 6 <= rtm <= 12:
                    errors.append(
                        f"episodes[{i}].reading_time_minutes out of range 6-12 (got {rtm})"
                    )

            wcr = ep.get("word_count_range")
            if "word_count_range" in ep:
                if not isinstance(wcr, dict):
                    errors.append(f"episodes[{i}].word_count_range must be a mapping")
                else:
                    wmin = wcr.get("min")
                    wmax = wcr.get("max")
                    if "min" not in wcr:
                        errors.append(f"episodes[{i}].word_count_range missing field: min")
                    elif not _is_int(wmin):
                        errors.append(
                            f"episodes[{i}].word_count_range.min must be an integer"
                        )
                    if "max" not in wcr:
                        errors.append(f"episodes[{i}].word_count_range missing field: max")
                    elif not _is_int(wmax):
                        errors.append(
                            f"episodes[{i}].word_count_range.max must be an integer"
                        )
                    if _is_int(wmin) and _is_int(wmax) and wmin >= wmax:
                        errors.append(
                            f"episodes[{i}].word_count_range.min ({wmin}) must be less than max ({wmax})"
                        )
    elif "episodes" in story:
        errors.append("episodes must be an array")

    return errors


def validate_path(path: Path) -> list[str]:
    if not path.exists():
        return [f"file not found: {path}"]
    try:
        with path.open("r", encoding="utf-8") as f:
            story = yaml.safe_load(f)
    except yaml.YAMLError as e:
        return [f"YAML parse error: {e}"]
    return validate(story)


def main(argv: list[str]) -> int:
    if len(argv) < 2:
        print(
            "usage: validate_story.py <path-to-story.yaml> [<more>]",
            file=sys.stderr,
        )
        return 2

    any_errors = False
    for arg in argv[1:]:
        path = Path(arg)
        errors = validate_path(path)
        if errors:
            any_errors = True
            print(f"{path}: FAIL")
            for e in errors:
                print(f"  - {e}")
            print(f"  {len(errors)} error(s).")
        else:
            print(f"{path}: OK")

    return 1 if any_errors else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
