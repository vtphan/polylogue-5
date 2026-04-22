#!/usr/bin/env python3
"""Validate v5 reasoning-proposals.yaml against its schema contract.

Canonical shape checks for the detection-layer review surface produced by
script_doctor inside /create_transcript. Accepts one or more
reasoning-proposals.yaml paths. Exits 0 on pass, 1 on any validation
failure, 2 on usage / environment errors.

Usage:
  python3 v5/pipeline/scripts/validate_reasoning_proposals.py <path> [<more>]

Reference: v5/schemas/reasoning-proposals.yaml (descriptive contract),
           v5/docs/architecture.md §2.3 (detection layer),
           v5/docs/instructional-design.md §4.1 (five selection criteria).
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
PROPOSAL_ID = re.compile(r"^p\d{2,}$")
VALID_STATUSES = ("pending_review", "approved", "needs_revision")
VALID_POLARITIES = ("weak", "strong")

REQUIRED_TOP = (
    "story_id",
    "episode_id",
    "source_draft",
    "status",
    "proposals",
    "approved_anchors",
    "revision_history",
)

REQUIRED_PROPOSAL = (
    "proposal_id",
    "source_turn_id",
    "reasoning_item_id",
    "polarity",
    "intended_claim",
    "criteria_justification",
)

REQUIRED_CRITERIA = (
    "argumentative",
    "not_expressive",
    "claim_clear",
    "reasoning_audible",
    "taxonomy_fit",
)

REQUIRED_ANCHOR = (
    "turn_id",
    "reasoning_item_id",
    "polarity",
    "intended_claim",
)

REQUIRED_HISTORY_ENTRY = ("round", "feedback_summary", "revision_note")


def _is_int(v: Any) -> bool:
    return isinstance(v, int) and not isinstance(v, bool)


def _is_nonempty_str(v: Any) -> bool:
    return isinstance(v, str) and bool(v.strip())


def validate(doc: Any) -> list[str]:
    errors: list[str] = []

    if not isinstance(doc, dict):
        return ["reasoning-proposals.yaml must be a top-level mapping"]

    for f in REQUIRED_TOP:
        if f not in doc:
            errors.append(f"missing required top-level field: {f}")

    for f in ("story_id", "episode_id", "source_draft"):
        if f in doc and not _is_nonempty_str(doc[f]):
            errors.append(f"{f} must be a non-empty string")

    status = doc.get("status")
    if "status" in doc:
        if not isinstance(status, str) or status not in VALID_STATUSES:
            errors.append(
                f"status must be one of {list(VALID_STATUSES)} (got {status!r})"
            )

    proposals = doc.get("proposals")
    seen_proposal_ids: set[str] = set()
    if isinstance(proposals, list):
        for i, p in enumerate(proposals):
            if not isinstance(p, dict):
                errors.append(f"proposals[{i}] must be a mapping")
                continue
            for f in REQUIRED_PROPOSAL:
                if f not in p:
                    errors.append(f"proposals[{i}] missing field: {f}")

            pid = p.get("proposal_id")
            if isinstance(pid, str):
                if not PROPOSAL_ID.match(pid):
                    errors.append(
                        f'proposals[{i}].proposal_id must match pNN (got "{pid}")'
                    )
                if pid in seen_proposal_ids:
                    errors.append(f"proposals[{i}].proposal_id duplicated: {pid}")
                seen_proposal_ids.add(pid)
            elif "proposal_id" in p:
                errors.append(f"proposals[{i}].proposal_id must be a string")

            stid = p.get("source_turn_id")
            if isinstance(stid, str) and not TURN_ID.match(stid):
                errors.append(
                    f'proposals[{i}].source_turn_id must match tNN (got "{stid}")'
                )
            elif "source_turn_id" in p and not isinstance(stid, str):
                errors.append(f"proposals[{i}].source_turn_id must be a string")

            rid = p.get("reasoning_item_id")
            if "reasoning_item_id" in p and not _is_nonempty_str(rid):
                errors.append(
                    f"proposals[{i}].reasoning_item_id must be a non-empty string"
                )

            pol = p.get("polarity")
            if "polarity" in p and (not isinstance(pol, str) or pol not in VALID_POLARITIES):
                errors.append(
                    f"proposals[{i}].polarity must be one of {list(VALID_POLARITIES)} (got {pol!r})"
                )

            ic = p.get("intended_claim")
            if "intended_claim" in p and not _is_nonempty_str(ic):
                errors.append(
                    f"proposals[{i}].intended_claim must be a non-empty string"
                )

            if "revised_text" in p and not _is_nonempty_str(p["revised_text"]):
                errors.append(
                    f"proposals[{i}].revised_text, when present, must be a non-empty string"
                )

            cj = p.get("criteria_justification")
            if "criteria_justification" in p:
                if not isinstance(cj, dict):
                    errors.append(
                        f"proposals[{i}].criteria_justification must be a mapping"
                    )
                else:
                    for key in REQUIRED_CRITERIA:
                        if key not in cj:
                            errors.append(
                                f"proposals[{i}].criteria_justification missing field: {key}"
                            )
                        elif not _is_nonempty_str(cj[key]):
                            errors.append(
                                f"proposals[{i}].criteria_justification.{key} must be a non-empty string"
                            )
    elif "proposals" in doc:
        errors.append("proposals must be an array")

    anchors = doc.get("approved_anchors")
    if isinstance(anchors, list):
        seen_anchor_turns: set[str] = set()
        for i, a in enumerate(anchors):
            if not isinstance(a, dict):
                errors.append(f"approved_anchors[{i}] must be a mapping")
                continue
            for f in REQUIRED_ANCHOR:
                if f not in a:
                    errors.append(f"approved_anchors[{i}] missing field: {f}")

            tid = a.get("turn_id")
            if isinstance(tid, str):
                if not TURN_ID.match(tid):
                    errors.append(
                        f'approved_anchors[{i}].turn_id must match tNN (got "{tid}")'
                    )
                if tid in seen_anchor_turns:
                    errors.append(
                        f"approved_anchors[{i}].turn_id duplicated across anchors: {tid}"
                    )
                seen_anchor_turns.add(tid)
            elif "turn_id" in a:
                errors.append(f"approved_anchors[{i}].turn_id must be a string")

            if "reasoning_item_id" in a and not _is_nonempty_str(a["reasoning_item_id"]):
                errors.append(
                    f"approved_anchors[{i}].reasoning_item_id must be a non-empty string"
                )

            pol = a.get("polarity")
            if "polarity" in a and (
                not isinstance(pol, str) or pol not in VALID_POLARITIES
            ):
                errors.append(
                    f"approved_anchors[{i}].polarity must be one of {list(VALID_POLARITIES)} (got {pol!r})"
                )

            if "intended_claim" in a and not _is_nonempty_str(a["intended_claim"]):
                errors.append(
                    f"approved_anchors[{i}].intended_claim must be a non-empty string"
                )

            spid = a.get("source_proposal_id")
            if "source_proposal_id" in a:
                if not isinstance(spid, str) or not PROPOSAL_ID.match(spid):
                    errors.append(
                        f'approved_anchors[{i}].source_proposal_id must match pNN (got "{spid}")'
                    )
                elif seen_proposal_ids and spid not in seen_proposal_ids:
                    errors.append(
                        f"approved_anchors[{i}].source_proposal_id not found in proposals[]: {spid}"
                    )
    elif "approved_anchors" in doc:
        errors.append("approved_anchors must be an array")

    history = doc.get("revision_history")
    if isinstance(history, list):
        for i, h in enumerate(history):
            if not isinstance(h, dict):
                errors.append(f"revision_history[{i}] must be a mapping")
                continue
            for f in REQUIRED_HISTORY_ENTRY:
                if f not in h:
                    errors.append(f"revision_history[{i}] missing field: {f}")
            r = h.get("round")
            if "round" in h and (not _is_int(r) or r < 1):
                errors.append(
                    f"revision_history[{i}].round must be an integer >= 1 (got {r!r})"
                )
            for f in ("feedback_summary", "revision_note"):
                if f in h and not _is_nonempty_str(h[f]):
                    errors.append(
                        f"revision_history[{i}].{f} must be a non-empty string"
                    )
    elif "revision_history" in doc:
        errors.append("revision_history must be an array")

    return errors


def validate_path(path: Path) -> list[str]:
    if not path.exists():
        return [f"file not found: {path}"]
    try:
        with path.open("r", encoding="utf-8") as f:
            doc = yaml.safe_load(f)
    except yaml.YAMLError as e:
        return [f"YAML parse error: {e}"]
    return validate(doc)


def main(argv: list[str]) -> int:
    if len(argv) < 2:
        print(
            "usage: validate_reasoning_proposals.py <path> [<more>]",
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
