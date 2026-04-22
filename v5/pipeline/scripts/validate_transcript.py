#!/usr/bin/env python3
"""Validate v5 transcript.yaml against its schema contract.

Canonical shape checks for the final app-facing transcript produced by
transcript_structurer inside /create_transcript. Accepts one or more
transcript.yaml paths. Exits 0 on pass, 1 on any validation failure, 2
on usage / environment errors.

Enforced rules:
  - 3+ scenes
  - every scene has scene_id, summary, turns[]
  - turns[] non-empty per scene
  - turn_id matches tNN
  - turn_id unique across the whole transcript
  - transcript.yaml is polarity-free: reasoning_item_id / polarity /
    source_proposal_id / original_text are NOT permitted on turns here
    (reasoning classification lives on reasoning-proposals.yaml)

Usage:
  python3 v5/pipeline/scripts/validate_transcript.py <path> [<more>]

Reference: v5/schemas/transcript.yaml (descriptive contract),
           v5/docs/architecture.md §2.3 (transcript-authority invariant).
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


TURN_ID = re.compile(r"^t\d{2,}$")
SCENE_ID = re.compile(r"^s\d+$")

REQUIRED_TOP = ("story_id", "episode_id", "title", "characters", "scenes")
REQUIRED_SCENE = ("scene_id", "summary", "turns")
REQUIRED_TURN = ("turn_id", "speaker", "text")

# Fields that belong on transcript.post-doctor.yaml or reasoning-proposals.yaml
# but must NOT leak into the final transcript.yaml.
FORBIDDEN_TURN_FIELDS = (
    "reasoning_item_id",
    "polarity",
    "original_text",
    "source_proposal_id",
    "intended_claim",
)

SUMMARY_SOFT_CAP = 30  # words; warn, don't fail


def _is_nonempty_str(v: Any) -> bool:
    return isinstance(v, str) and bool(v.strip())


def validate(doc: Any) -> tuple[list[str], list[str]]:
    errors: list[str] = []
    warnings: list[str] = []

    if not isinstance(doc, dict):
        return ["transcript.yaml must be a top-level mapping"], warnings

    for f in REQUIRED_TOP:
        if f not in doc:
            errors.append(f"missing required top-level field: {f}")

    for f in ("story_id", "episode_id", "title"):
        if f in doc and not _is_nonempty_str(doc[f]):
            errors.append(f"{f} must be a non-empty string")

    characters = doc.get("characters")
    if "characters" in doc:
        if not isinstance(characters, list):
            errors.append("characters must be an array")
        elif not characters:
            errors.append("characters[] must not be empty")

    scenes = doc.get("scenes")
    all_turn_ids: list[tuple[int, int, str]] = []  # (scene_idx, turn_idx, turn_id)

    if isinstance(scenes, list):
        if len(scenes) < 3:
            errors.append(f"scenes[] must have at least 3 entries (got {len(scenes)})")
        seen_scene_ids: set[str] = set()
        for si, scene in enumerate(scenes):
            if not isinstance(scene, dict):
                errors.append(f"scenes[{si}] must be a mapping")
                continue
            for f in REQUIRED_SCENE:
                if f not in scene:
                    errors.append(f"scenes[{si}] missing field: {f}")

            scid = scene.get("scene_id")
            if isinstance(scid, str):
                if not SCENE_ID.match(scid):
                    errors.append(
                        f'scenes[{si}].scene_id should match s<n> (got "{scid}")'
                    )
                if scid in seen_scene_ids:
                    errors.append(f"scenes[{si}].scene_id duplicated: {scid}")
                seen_scene_ids.add(scid)
            elif "scene_id" in scene:
                errors.append(f"scenes[{si}].scene_id must be a string")

            summary = scene.get("summary")
            if "summary" in scene:
                if not _is_nonempty_str(summary):
                    errors.append(f"scenes[{si}].summary must be a non-empty string")
                else:
                    word_count = len(summary.split())
                    if word_count > SUMMARY_SOFT_CAP:
                        warnings.append(
                            f"scenes[{si}].summary is {word_count} words "
                            f"(soft cap {SUMMARY_SOFT_CAP})"
                        )

            turns = scene.get("turns")
            if isinstance(turns, list):
                if not turns:
                    errors.append(f"scenes[{si}].turns[] must not be empty")
                for ti, turn in enumerate(turns):
                    if not isinstance(turn, dict):
                        errors.append(f"scenes[{si}].turns[{ti}] must be a mapping")
                        continue
                    for f in REQUIRED_TURN:
                        if f not in turn:
                            errors.append(
                                f"scenes[{si}].turns[{ti}] missing field: {f}"
                            )

                    tid = turn.get("turn_id")
                    if isinstance(tid, str):
                        if not TURN_ID.match(tid):
                            errors.append(
                                f'scenes[{si}].turns[{ti}].turn_id must match tNN (got "{tid}")'
                            )
                        all_turn_ids.append((si, ti, tid))
                    elif "turn_id" in turn:
                        errors.append(
                            f"scenes[{si}].turns[{ti}].turn_id must be a string"
                        )

                    if "speaker" in turn and not _is_nonempty_str(turn["speaker"]):
                        errors.append(
                            f"scenes[{si}].turns[{ti}].speaker must be a non-empty string"
                        )

                    if "text" in turn and not _is_nonempty_str(turn["text"]):
                        errors.append(
                            f"scenes[{si}].turns[{ti}].text must be a non-empty string"
                        )

                    for forbidden in FORBIDDEN_TURN_FIELDS:
                        if forbidden in turn:
                            errors.append(
                                f"scenes[{si}].turns[{ti}] carries forbidden field "
                                f"'{forbidden}' — transcript.yaml must stay polarity-free"
                            )
            elif "turns" in scene:
                errors.append(f"scenes[{si}].turns must be an array")
    elif "scenes" in doc:
        errors.append("scenes must be an array")

    if all_turn_ids:
        seen: dict[str, tuple[int, int]] = {}
        for si, ti, tid in all_turn_ids:
            if tid in seen:
                prev_si, prev_ti = seen[tid]
                errors.append(
                    f"turn_id {tid} duplicated: scenes[{prev_si}].turns[{prev_ti}] "
                    f"and scenes[{si}].turns[{ti}]"
                )
            else:
                seen[tid] = (si, ti)

    return errors, warnings


def validate_path(path: Path) -> tuple[list[str], list[str]]:
    if not path.exists():
        return [f"file not found: {path}"], []
    try:
        with path.open("r", encoding="utf-8") as f:
            doc = yaml.safe_load(f)
    except yaml.YAMLError as e:
        return [f"YAML parse error: {e}"], []
    return validate(doc)


def main(argv: list[str]) -> int:
    if len(argv) < 2:
        print(
            "usage: validate_transcript.py <path> [<more>]",
            file=sys.stderr,
        )
        return 2

    any_errors = False
    for arg in argv[1:]:
        path = Path(arg)
        errors, warnings = validate_path(path)
        for w in warnings:
            print(f"{path}: warn: {w}")
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
