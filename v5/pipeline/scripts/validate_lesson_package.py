#!/usr/bin/env python3
"""Validate v5 lesson_package.yaml against its schema contract.

Canonical shape checks for the deterministic, app-facing teaching
artifact produced by /create_lesson_package. Accepts one lesson
package path at a time so cross-file invariants can be resolved
against sibling artifacts (transcript.yaml and reasoning-
proposals.yaml in the same directory).

Enforced rules (local shape):
  - package_meta.schema_version == "v5"
  - episode.previously required iff episode_number > 1, forbidden on
    episode 1
  - levels may be empty
  - per level: level_id (lNN), sequence_index starts at 1 and
    increments by 1, turn_id (tNN), polarity ∈ {weak, strong}
  - step_1_claim + step_3 branches require feedback; step_2_judgment
    must NOT carry feedback and its options are fixed to exactly two
    entries with option_id ∈ {yes_strong, no_unsure}
  - every feedback.correct.option_ids[] references a valid option_id
    in the same step's options[]
  - feedback.by_option keys reference valid option_ids in the same
    step and do NOT include the correct option_ids (by_option is
    wrong-answer-only)

Soft warnings (non-fatal):
  - episode.summary word count > 60
  - episode.previously word count > 40
  - step_1_claim.options and each step_3 branch.options not equal to
    3 (v5 convention: 1 correct + 2 distractors)

Cross-file invariants (when sibling artifacts are present in the
lesson package's directory, or passed via --transcript / --proposals):
  - every level.turn_id appears in transcript.yaml
  - every level.turn_id appears in reasoning-proposals.yaml
    approved_anchors[]
  - level.reasoning_item_id, polarity, intended_claim match the
    corresponding approved anchor
  - levels are ordered by anchor appearance order in transcript.yaml

Exits 0 on pass, 1 on any validation failure, 2 on usage / environment
errors.

Usage:
  python3 v5/pipeline/scripts/validate_lesson_package.py <path>
  python3 v5/pipeline/scripts/validate_lesson_package.py <path> \\
      --transcript <path> --proposals <path>

Reference: v5/schemas/lesson_package.yaml (descriptive contract),
           v5/docs/architecture.md §2.4 (teaching layer),
           v5/docs/instructional-design.md §5 (three-step quiz).
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
LEVEL_ID = re.compile(r"^l\d{2,}$")

EXPECTED_SCHEMA_VERSION = "v5"
VALID_POLARITIES = ("weak", "strong")
STEP_2_OPTION_IDS = ("yes_strong", "no_unsure")

SUMMARY_SOFT_CAP = 60
PREVIOUSLY_SOFT_CAP = 40
OPTIONS_CONVENTION = 3  # 1 correct + 2 distractors


def _is_int(v: Any) -> bool:
    return isinstance(v, int) and not isinstance(v, bool)


def _is_nonempty_str(v: Any) -> bool:
    return isinstance(v, str) and bool(v.strip())


def _word_count(s: str) -> int:
    return len(s.split())


def validate_feedback(
    loc: str, feedback: Any, option_ids: set[str]
) -> list[str]:
    errors: list[str] = []
    if not isinstance(feedback, dict):
        return [f"{loc}.feedback must be a mapping"]

    if "correct" not in feedback:
        errors.append(f"{loc}.feedback missing field: correct")
    else:
        correct = feedback["correct"]
        if not isinstance(correct, dict):
            errors.append(f"{loc}.feedback.correct must be a mapping")
        else:
            if "option_ids" not in correct:
                errors.append(f"{loc}.feedback.correct missing field: option_ids")
            else:
                cids = correct["option_ids"]
                if not isinstance(cids, list) or not cids:
                    errors.append(
                        f"{loc}.feedback.correct.option_ids must be a non-empty array"
                    )
                else:
                    for cid in cids:
                        if not isinstance(cid, str):
                            errors.append(
                                f"{loc}.feedback.correct.option_ids entries must be strings"
                            )
                        elif cid not in option_ids:
                            errors.append(
                                f'{loc}.feedback.correct.option_ids references '
                                f'unknown option_id "{cid}"'
                            )
            if "text" not in correct:
                errors.append(f"{loc}.feedback.correct missing field: text")
            elif not _is_nonempty_str(correct["text"]):
                errors.append(f"{loc}.feedback.correct.text must be a non-empty string")

    if "by_option" not in feedback:
        errors.append(f"{loc}.feedback missing field: by_option")
    else:
        by_option = feedback["by_option"]
        if not isinstance(by_option, dict):
            errors.append(f"{loc}.feedback.by_option must be a mapping")
        else:
            correct_set = set()
            if isinstance(feedback.get("correct"), dict):
                cids = feedback["correct"].get("option_ids")
                if isinstance(cids, list):
                    correct_set = {c for c in cids if isinstance(c, str)}
            for key, val in by_option.items():
                if not isinstance(key, str):
                    errors.append(
                        f"{loc}.feedback.by_option keys must be strings"
                    )
                    continue
                if key not in option_ids:
                    errors.append(
                        f'{loc}.feedback.by_option references unknown option_id "{key}"'
                    )
                if key in correct_set:
                    errors.append(
                        f'{loc}.feedback.by_option keys must be wrong-answer only; '
                        f'got correct option_id "{key}"'
                    )
                if not isinstance(val, str):
                    errors.append(
                        f'{loc}.feedback.by_option["{key}"] must be a plain string '
                        f"(got {type(val).__name__})"
                    )
                elif not val.strip():
                    errors.append(
                        f'{loc}.feedback.by_option["{key}"] must be a non-empty string'
                    )

    return errors


def validate_options(loc: str, options: Any) -> tuple[set[str], list[str]]:
    errors: list[str] = []
    ids: set[str] = set()
    if not isinstance(options, list):
        errors.append(f"{loc}.options must be an array")
        return ids, errors
    if not options:
        errors.append(f"{loc}.options[] must not be empty")
        return ids, errors
    for i, opt in enumerate(options):
        if not isinstance(opt, dict):
            errors.append(f"{loc}.options[{i}] must be a mapping")
            continue
        if "option_id" not in opt:
            errors.append(f"{loc}.options[{i}] missing field: option_id")
        elif not _is_nonempty_str(opt["option_id"]):
            errors.append(f"{loc}.options[{i}].option_id must be a non-empty string")
        else:
            if opt["option_id"] in ids:
                errors.append(
                    f'{loc}.options[{i}].option_id duplicated: "{opt["option_id"]}"'
                )
            ids.add(opt["option_id"])
        if "text" not in opt:
            errors.append(f"{loc}.options[{i}] missing field: text")
        elif not _is_nonempty_str(opt["text"]):
            errors.append(f"{loc}.options[{i}].text must be a non-empty string")
    return ids, errors


def validate_shape(doc: Any) -> tuple[list[str], list[str]]:
    errors: list[str] = []
    warnings: list[str] = []

    if not isinstance(doc, dict):
        return ["lesson_package.yaml must be a top-level mapping"], warnings

    # package_meta
    pm = doc.get("package_meta")
    if "package_meta" not in doc:
        errors.append("missing required top-level field: package_meta")
    elif not isinstance(pm, dict):
        errors.append("package_meta must be a mapping")
    else:
        for f in ("story_id", "episode_id", "schema_version"):
            if f not in pm:
                errors.append(f"package_meta missing field: {f}")
            elif not _is_nonempty_str(pm[f]):
                errors.append(f"package_meta.{f} must be a non-empty string")
        en = pm.get("episode_number")
        if "episode_number" not in pm:
            errors.append("package_meta missing field: episode_number")
        elif not _is_int(en) or en < 1:
            errors.append(
                f"package_meta.episode_number must be an integer >= 1 (got {en!r})"
            )
        if "schema_version" in pm and isinstance(pm["schema_version"], str):
            if pm["schema_version"] != EXPECTED_SCHEMA_VERSION:
                errors.append(
                    f'package_meta.schema_version must equal "{EXPECTED_SCHEMA_VERSION}" '
                    f'(got "{pm["schema_version"]}")'
                )

    # episode
    ep = doc.get("episode")
    episode_number = None
    if isinstance(pm, dict):
        episode_number = pm.get("episode_number") if _is_int(pm.get("episode_number")) else None

    if "episode" not in doc:
        errors.append("missing required top-level field: episode")
    elif not isinstance(ep, dict):
        errors.append("episode must be a mapping")
    else:
        for f in ("title", "summary", "final_takeaway"):
            if f not in ep:
                errors.append(f"episode missing field: {f}")
            elif not _is_nonempty_str(ep[f]):
                errors.append(f"episode.{f} must be a non-empty string")

        # previously gating
        if episode_number is not None:
            has_prev = "previously" in ep and _is_nonempty_str(ep.get("previously", ""))
            if episode_number == 1 and has_prev:
                errors.append(
                    "episode.previously is forbidden on episode 1 "
                    "(package_meta.episode_number == 1)"
                )
            if episode_number > 1 and not has_prev:
                errors.append(
                    "episode.previously is required when package_meta.episode_number > 1"
                )

        # soft caps
        if _is_nonempty_str(ep.get("summary", "")):
            wc = _word_count(ep["summary"])
            if wc > SUMMARY_SOFT_CAP:
                warnings.append(
                    f"episode.summary is {wc} words (soft cap {SUMMARY_SOFT_CAP})"
                )
        if _is_nonempty_str(ep.get("previously", "")):
            wc = _word_count(ep["previously"])
            if wc > PREVIOUSLY_SOFT_CAP:
                warnings.append(
                    f"episode.previously is {wc} words (soft cap {PREVIOUSLY_SOFT_CAP})"
                )

    # levels
    levels = doc.get("levels")
    if "levels" not in doc:
        errors.append("missing required top-level field: levels")
        return errors, warnings

    if not isinstance(levels, list):
        errors.append("levels must be an array")
        return errors, warnings

    seen_level_ids: set[str] = set()
    seen_turn_ids: set[str] = set()
    for i, lvl in enumerate(levels):
        loc = f"levels[{i}]"
        if not isinstance(lvl, dict):
            errors.append(f"{loc} must be a mapping")
            continue

        for f in (
            "level_id",
            "sequence_index",
            "turn_id",
            "reasoning_item_id",
            "polarity",
            "intended_claim",
            "step_1_claim",
            "step_2_judgment",
            "step_3",
            "takeaway",
        ):
            if f not in lvl:
                errors.append(f"{loc} missing field: {f}")

        lid = lvl.get("level_id")
        if "level_id" in lvl and not isinstance(lid, str):
            errors.append(f"{loc}.level_id must be a string")
        elif isinstance(lid, str):
            if not LEVEL_ID.match(lid):
                errors.append(f'{loc}.level_id must match lNN (got "{lid}")')
            if lid in seen_level_ids:
                errors.append(f"{loc}.level_id duplicated: {lid}")
            seen_level_ids.add(lid)

        si = lvl.get("sequence_index")
        expected_si = i + 1
        if "sequence_index" in lvl:
            if not _is_int(si) or si < 1:
                errors.append(
                    f"{loc}.sequence_index must be an integer >= 1 (got {si!r})"
                )
            elif si != expected_si:
                errors.append(
                    f"{loc}.sequence_index must equal position+1 "
                    f"(got {si}, expected {expected_si})"
                )

        tid = lvl.get("turn_id")
        if "turn_id" in lvl and not isinstance(tid, str):
            errors.append(f"{loc}.turn_id must be a string")
        elif isinstance(tid, str):
            if not TURN_ID.match(tid):
                errors.append(f'{loc}.turn_id must match tNN (got "{tid}")')
            if tid in seen_turn_ids:
                errors.append(f"{loc}.turn_id duplicated across levels: {tid}")
            seen_turn_ids.add(tid)

        if "reasoning_item_id" in lvl and not _is_nonempty_str(lvl["reasoning_item_id"]):
            errors.append(f"{loc}.reasoning_item_id must be a non-empty string")

        pol = lvl.get("polarity")
        if "polarity" in lvl and (not isinstance(pol, str) or pol not in VALID_POLARITIES):
            errors.append(
                f"{loc}.polarity must be one of {list(VALID_POLARITIES)} (got {pol!r})"
            )

        if "intended_claim" in lvl and not _is_nonempty_str(lvl["intended_claim"]):
            errors.append(f"{loc}.intended_claim must be a non-empty string")

        if "takeaway" in lvl and not _is_nonempty_str(lvl["takeaway"]):
            errors.append(f"{loc}.takeaway must be a non-empty string")

        if "hint" in lvl and not _is_nonempty_str(lvl["hint"]):
            errors.append(f"{loc}.hint, when present, must be a non-empty string")

        # Step 1
        s1 = lvl.get("step_1_claim")
        if isinstance(s1, dict):
            s1_loc = f"{loc}.step_1_claim"
            if "prompt" not in s1 or not _is_nonempty_str(s1.get("prompt", "")):
                errors.append(f"{s1_loc}.prompt must be a non-empty string")
            ids_s1, opt_errs = validate_options(s1_loc, s1.get("options"))
            errors.extend(opt_errs)
            if isinstance(s1.get("options"), list) and len(s1["options"]) != OPTIONS_CONVENTION:
                warnings.append(
                    f"{s1_loc}.options has {len(s1['options'])} entries "
                    f"(v5 convention: {OPTIONS_CONVENTION})"
                )
            if "feedback" in s1:
                errors.extend(validate_feedback(s1_loc, s1["feedback"], ids_s1))
            else:
                errors.append(f"{s1_loc}.feedback is required")
        elif "step_1_claim" in lvl:
            errors.append(f"{loc}.step_1_claim must be a mapping")

        # Step 2
        s2 = lvl.get("step_2_judgment")
        if isinstance(s2, dict):
            s2_loc = f"{loc}.step_2_judgment"
            if "prompt" not in s2 or not _is_nonempty_str(s2.get("prompt", "")):
                errors.append(f"{s2_loc}.prompt must be a non-empty string")
            if "feedback" in s2:
                errors.append(
                    f"{s2_loc}.feedback is forbidden — Step 2 is a reflection prompt, "
                    f"not a correctness test (use optional routing_text instead)"
                )
            if "routing_text" in s2 and not _is_nonempty_str(s2["routing_text"]):
                errors.append(
                    f"{s2_loc}.routing_text, when present, must be a non-empty string"
                )
            opts = s2.get("options")
            if isinstance(opts, list):
                if len(opts) != 2:
                    errors.append(
                        f"{s2_loc}.options must have exactly 2 entries (got {len(opts)})"
                    )
                seen_s2: set[str] = set()
                for oi, opt in enumerate(opts):
                    if not isinstance(opt, dict):
                        errors.append(f"{s2_loc}.options[{oi}] must be a mapping")
                        continue
                    oid = opt.get("option_id")
                    if oid not in STEP_2_OPTION_IDS:
                        errors.append(
                            f'{s2_loc}.options[{oi}].option_id must be one of '
                            f'{list(STEP_2_OPTION_IDS)} (got {oid!r})'
                        )
                    if oid in seen_s2:
                        errors.append(f"{s2_loc}.options[{oi}].option_id duplicated: {oid}")
                    seen_s2.add(oid)
                    if not _is_nonempty_str(opt.get("text", "")):
                        errors.append(f"{s2_loc}.options[{oi}].text must be a non-empty string")
                missing = set(STEP_2_OPTION_IDS) - seen_s2
                if missing:
                    errors.append(
                        f"{s2_loc}.options must include both "
                        f"{list(STEP_2_OPTION_IDS)} (missing: {sorted(missing)})"
                    )
            elif "options" in s2:
                errors.append(f"{s2_loc}.options must be an array")
        elif "step_2_judgment" in lvl:
            errors.append(f"{loc}.step_2_judgment must be a mapping")

        # Step 3
        s3 = lvl.get("step_3")
        if isinstance(s3, dict):
            for branch_name in ("why_yes", "why_no"):
                b_loc = f"{loc}.step_3.{branch_name}"
                if branch_name not in s3:
                    errors.append(f"{loc}.step_3 missing field: {branch_name}")
                    continue
                branch = s3[branch_name]
                if not isinstance(branch, dict):
                    errors.append(f"{b_loc} must be a mapping")
                    continue
                if "prompt" not in branch or not _is_nonempty_str(branch.get("prompt", "")):
                    errors.append(f"{b_loc}.prompt must be a non-empty string")
                ids_b, opt_errs = validate_options(b_loc, branch.get("options"))
                errors.extend(opt_errs)
                if isinstance(branch.get("options"), list) and len(branch["options"]) != OPTIONS_CONVENTION:
                    warnings.append(
                        f"{b_loc}.options has {len(branch['options'])} entries "
                        f"(v5 convention: {OPTIONS_CONVENTION})"
                    )
                if "feedback" in branch:
                    errors.extend(validate_feedback(b_loc, branch["feedback"], ids_b))
                else:
                    errors.append(f"{b_loc}.feedback is required")
        elif "step_3" in lvl:
            errors.append(f"{loc}.step_3 must be a mapping")

    return errors, warnings


def _load_yaml(path: Path) -> tuple[Any, list[str]]:
    if not path.exists():
        return None, [f"file not found: {path}"]
    try:
        with path.open("r", encoding="utf-8") as f:
            return yaml.safe_load(f), []
    except yaml.YAMLError as e:
        return None, [f"YAML parse error ({path}): {e}"]


def validate_cross_refs(
    doc: Any,
    transcript: Any,
    proposals: Any,
) -> list[str]:
    errors: list[str] = []

    # Build transcript turn order
    tx_turn_order: list[str] = []
    if isinstance(transcript, dict):
        scenes = transcript.get("scenes")
        if isinstance(scenes, list):
            for scene in scenes:
                if isinstance(scene, dict):
                    for turn in scene.get("turns", []):
                        if isinstance(turn, dict) and isinstance(turn.get("turn_id"), str):
                            tx_turn_order.append(turn["turn_id"])
    tx_turns = set(tx_turn_order)

    # Build approved-anchor map
    anchors: dict[str, dict] = {}
    if isinstance(proposals, dict):
        aa = proposals.get("approved_anchors")
        if isinstance(aa, list):
            for a in aa:
                if isinstance(a, dict) and isinstance(a.get("turn_id"), str):
                    anchors[a["turn_id"]] = a

    levels = doc.get("levels") if isinstance(doc, dict) else None
    if not isinstance(levels, list):
        return errors

    level_turn_order = [
        lvl.get("turn_id") for lvl in levels
        if isinstance(lvl, dict) and isinstance(lvl.get("turn_id"), str)
    ]

    # Each level.turn_id must exist in transcript and proposals
    for i, lvl in enumerate(levels):
        if not isinstance(lvl, dict):
            continue
        tid = lvl.get("turn_id")
        if not isinstance(tid, str):
            continue
        if tx_turns and tid not in tx_turns:
            errors.append(
                f"levels[{i}].turn_id {tid} not found in transcript.yaml"
            )
        if anchors and tid not in anchors:
            errors.append(
                f"levels[{i}].turn_id {tid} not found in reasoning-proposals.yaml "
                f"approved_anchors[]"
            )
            continue
        if anchors and tid in anchors:
            anchor = anchors[tid]
            for field in ("reasoning_item_id", "polarity", "intended_claim"):
                if lvl.get(field) != anchor.get(field):
                    errors.append(
                        f"levels[{i}].{field} does not match approved anchor for "
                        f"turn_id {tid} (level: {lvl.get(field)!r} vs "
                        f"anchor: {anchor.get(field)!r})"
                    )

    # Levels must be ordered by anchor appearance in transcript
    if tx_turn_order and level_turn_order:
        known_levels = [t for t in level_turn_order if t in tx_turns]
        expected_order = [t for t in tx_turn_order if t in set(level_turn_order)]
        if known_levels != expected_order:
            errors.append(
                f"levels must be ordered by anchor appearance in transcript.yaml — "
                f"got {known_levels}, expected {expected_order}"
            )

    return errors


def resolve_sibling(package_path: Path, override: Path | None, name: str) -> Path | None:
    if override is not None:
        return override if override.exists() else None
    candidate = package_path.parent / name
    return candidate if candidate.exists() else None


def validate_path(
    package_path: Path,
    transcript_override: Path | None,
    proposals_override: Path | None,
) -> tuple[list[str], list[str], list[str]]:
    errors: list[str] = []
    warnings: list[str] = []
    notes: list[str] = []

    doc, load_errs = _load_yaml(package_path)
    if load_errs:
        return load_errs, warnings, notes

    shape_errors, shape_warnings = validate_shape(doc)
    errors.extend(shape_errors)
    warnings.extend(shape_warnings)

    tx_path = resolve_sibling(package_path, transcript_override, "transcript.yaml")
    pr_path = resolve_sibling(package_path, proposals_override, "reasoning-proposals.yaml")

    transcript = None
    proposals = None

    if tx_path is None:
        notes.append(
            "transcript.yaml not found — turn_id existence and ordering checks skipped"
        )
    else:
        transcript, tx_errs = _load_yaml(tx_path)
        errors.extend(tx_errs)

    if pr_path is None:
        notes.append(
            "reasoning-proposals.yaml not found — approved-anchor match checks skipped"
        )
    else:
        proposals, pr_errs = _load_yaml(pr_path)
        errors.extend(pr_errs)

    if transcript is not None or proposals is not None:
        errors.extend(validate_cross_refs(doc, transcript, proposals))

    return errors, warnings, notes


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Validate a v5 lesson_package.yaml file."
    )
    parser.add_argument("path", type=Path, help="Path to lesson_package.yaml")
    parser.add_argument(
        "--transcript",
        type=Path,
        default=None,
        help="Optional path to sibling transcript.yaml (auto-discovered alongside if omitted)",
    )
    parser.add_argument(
        "--proposals",
        type=Path,
        default=None,
        help=(
            "Optional path to sibling reasoning-proposals.yaml "
            "(auto-discovered alongside if omitted)"
        ),
    )
    args = parser.parse_args(argv)

    errors, warnings, notes = validate_path(
        args.path, args.transcript, args.proposals
    )

    for w in warnings:
        print(f"{args.path}: warn: {w}")
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
