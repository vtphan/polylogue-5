#!/usr/bin/env python3
"""Validate v5 transcript.post-doctor.yaml against its schema contract
and revision-provenance invariants.

Checks the post-doctor draft's basic shape plus three v5-specific
invariants on revision provenance:

  (I1) original_text present  ⟺  source_proposal_id present
       Each half of the pair implies the other.

  (I2) if both present, text != original_text
       A "revision" whose wording equals the original is spurious — it
       corrupts the signal that downstream stages (operator spot-check,
       lesson_package_builder) rely on to distinguish "sharpened anchor"
       from "anchor that landed as written."

  (I3) if neither is present, the turn is byte-identical to its raw
       counterpart (same turn_id → same speaker, same text)
       This is the "non-anchor turns are not subject to revision" rule
       — and by extension, anchors whose proposal carried no
       revised_text must also be byte-identical to raw.

I3 requires the raw draft. If --raw is not passed, the validator
auto-discovers `transcript.raw.yaml` next to the post-doctor file; if
not found, I3 is skipped and a warning is printed.

Exits 0 on pass, 1 on any validation failure, 2 on usage / environment
errors.

Usage:
  python3 v5/pipeline/scripts/validate_transcript_post_doctor.py <post-doctor-path>
  python3 v5/pipeline/scripts/validate_transcript_post_doctor.py <post-doctor-path> --raw <raw-path>

Reference: v5/schemas/transcript-intermediate.yaml (descriptive contract),
           v5/pipeline/agents/script_doctor.md (apply-mode doctrine),
           v5/docs/architecture.md §2.3 (detection layer).
"""

from __future__ import annotations

import argparse
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
PROPOSAL_ID = re.compile(r"^p\d{2,}$")

REQUIRED_TOP = ("story_id", "episode_id", "title", "turns")
REQUIRED_TURN = ("turn_id", "speaker", "text")


def _is_nonempty_str(v: Any) -> bool:
    return isinstance(v, str) and bool(v.strip())


def validate_shape(doc: Any) -> list[str]:
    """Validate local shape + invariants I1 and I2."""
    errors: list[str] = []

    if not isinstance(doc, dict):
        return ["transcript.post-doctor.yaml must be a top-level mapping"]

    for f in REQUIRED_TOP:
        if f not in doc:
            errors.append(f"missing required top-level field: {f}")

    for f in ("story_id", "episode_id", "title"):
        if f in doc and not _is_nonempty_str(doc[f]):
            errors.append(f"{f} must be a non-empty string")

    turns = doc.get("turns")
    if not isinstance(turns, list):
        if "turns" in doc:
            errors.append("turns must be an array")
        return errors
    if not turns:
        errors.append("turns[] must not be empty")

    seen_ids: set[str] = set()
    for i, t in enumerate(turns):
        if not isinstance(t, dict):
            errors.append(f"turns[{i}] must be a mapping")
            continue
        for f in REQUIRED_TURN:
            if f not in t:
                errors.append(f"turns[{i}] missing field: {f}")

        tid = t.get("turn_id")
        if isinstance(tid, str):
            if not TURN_ID.match(tid):
                errors.append(f'turns[{i}].turn_id must match tNN (got "{tid}")')
            if tid in seen_ids:
                errors.append(f"turns[{i}].turn_id duplicated: {tid}")
            seen_ids.add(tid)
        elif "turn_id" in t:
            errors.append(f"turns[{i}].turn_id must be a string")

        if "speaker" in t and not _is_nonempty_str(t["speaker"]):
            errors.append(f"turns[{i}].speaker must be a non-empty string")
        if "text" in t and not _is_nonempty_str(t["text"]):
            errors.append(f"turns[{i}].text must be a non-empty string")

        has_orig = "original_text" in t
        has_spid = "source_proposal_id" in t

        # I1: original_text ⟺ source_proposal_id
        if has_orig and not has_spid:
            errors.append(
                f"turns[{i}] ({tid}) has original_text but no source_proposal_id "
                f"— both must be present together [I1]"
            )
        if has_spid and not has_orig:
            errors.append(
                f"turns[{i}] ({tid}) has source_proposal_id but no original_text "
                f"— both must be present together [I1]"
            )

        if has_spid and not PROPOSAL_ID.match(t.get("source_proposal_id", "")):
            errors.append(
                f'turns[{i}] ({tid}).source_proposal_id must match pNN '
                f"(got {t.get('source_proposal_id')!r})"
            )

        if has_orig and not _is_nonempty_str(t["original_text"]):
            errors.append(
                f"turns[{i}] ({tid}).original_text must be a non-empty string"
            )

        # I2: when both present, text must differ from original_text
        if has_orig and has_spid and "text" in t:
            if t["text"] == t["original_text"]:
                errors.append(
                    f"turns[{i}] ({tid}) carries revision provenance but "
                    f"text == original_text — spurious revision marker [I2]"
                )

    return errors


def validate_against_raw(
    post_doctor_turns: list[dict], raw_turns: list[dict]
) -> list[str]:
    """Validate I3: unrevised turns must be byte-identical to raw."""
    errors: list[str] = []

    raw_by_id = {t.get("turn_id"): t for t in raw_turns if isinstance(t, dict)}
    raw_order = [t.get("turn_id") for t in raw_turns if isinstance(t, dict)]
    pd_order = [t.get("turn_id") for t in post_doctor_turns if isinstance(t, dict)]

    if pd_order != raw_order:
        errors.append(
            "turn order diverges between raw and post-doctor drafts — "
            "script_doctor must preserve order exactly"
        )

    for i, pt in enumerate(post_doctor_turns):
        if not isinstance(pt, dict):
            continue
        tid = pt.get("turn_id")
        if tid not in raw_by_id:
            errors.append(
                f"turns[{i}] ({tid}) has no counterpart in raw draft — "
                f"script_doctor must not add or remove turns"
            )
            continue
        rt = raw_by_id[tid]

        has_orig = "original_text" in pt
        if has_orig:
            # revised turn: original_text should match raw.text
            if pt.get("original_text") != rt.get("text"):
                errors.append(
                    f"turns[{i}] ({tid}).original_text does not match raw text — "
                    f"provenance is incorrect"
                )
            if pt.get("speaker") != rt.get("speaker"):
                errors.append(
                    f"turns[{i}] ({tid}) speaker changed between raw and post-doctor — "
                    f"script_doctor may revise text, never speaker"
                )
        else:
            # unrevised turn: must be byte-identical (speaker + text)
            if pt.get("speaker") != rt.get("speaker"):
                errors.append(
                    f"turns[{i}] ({tid}) is unrevised but speaker diverges from raw [I3]"
                )
            if pt.get("text") != rt.get("text"):
                errors.append(
                    f"turns[{i}] ({tid}) is unrevised but text diverges from raw — "
                    f"only turns with approved revised_text may change [I3]"
                )

    return errors


def resolve_raw_path(post_doctor_path: Path, raw_override: Path | None) -> Path | None:
    if raw_override is not None:
        return raw_override if raw_override.exists() else None
    candidate = post_doctor_path.parent / "transcript.raw.yaml"
    return candidate if candidate.exists() else None


def validate_path(
    post_doctor_path: Path, raw_override: Path | None
) -> tuple[list[str], list[str]]:
    """Returns (errors, notes)."""
    errors: list[str] = []
    notes: list[str] = []

    if not post_doctor_path.exists():
        return [f"file not found: {post_doctor_path}"], notes

    try:
        with post_doctor_path.open("r", encoding="utf-8") as f:
            pd = yaml.safe_load(f)
    except yaml.YAMLError as e:
        return [f"YAML parse error: {e}"], notes

    errors.extend(validate_shape(pd))

    pd_turns = pd.get("turns") if isinstance(pd, dict) else None
    raw_path = resolve_raw_path(post_doctor_path, raw_override)

    if raw_path is None:
        notes.append(
            "I3 (byte-identical unrevised turns) skipped — no raw draft found "
            "(pass --raw <path> or place transcript.raw.yaml alongside)"
        )
    elif isinstance(pd_turns, list):
        try:
            with raw_path.open("r", encoding="utf-8") as f:
                raw = yaml.safe_load(f)
        except yaml.YAMLError as e:
            errors.append(f"raw YAML parse error ({raw_path}): {e}")
        else:
            raw_turns = raw.get("turns") if isinstance(raw, dict) else None
            if not isinstance(raw_turns, list):
                errors.append(f"raw draft at {raw_path} has no turns[] array")
            else:
                errors.extend(validate_against_raw(pd_turns, raw_turns))

    return errors, notes


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Validate a v5 transcript.post-doctor.yaml file."
    )
    parser.add_argument("path", type=Path, help="Path to transcript.post-doctor.yaml")
    parser.add_argument(
        "--raw",
        type=Path,
        default=None,
        help="Optional path to transcript.raw.yaml for I3 check "
        "(auto-discovered alongside if omitted)",
    )
    args = parser.parse_args(argv)

    errors, notes = validate_path(args.path, args.raw)

    for n in notes:
        print(f"{args.path}: note: {n}")

    if errors:
        print(f"{args.path}: FAIL")
        for e in errors:
            print(f"  - {e}")
        print(f"  {len(errors)} error(s).")
        return 1

    print(f"{args.path}: OK")
    return 0


if __name__ == "__main__":
    sys.exit(main())
