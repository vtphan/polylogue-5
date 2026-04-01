#!/usr/bin/env python3
"""Structural review of a transcript against its scenario plan.

Checks: turn count, sentences per turn, word count, speaker names, turn order.

Usage:
    python3 review_transcript.py <transcript_path> <plan_path>

The plan_path can be either the full scenario.yaml or the stripped
dialog_writer_input.yaml — both have personas and turn_outline.

Exit code 0 = all checks pass, 1 = issues found.
"""

import sys
import yaml


def review_transcript(transcript_path, plan_path):
    with open(transcript_path) as f:
        transcript = yaml.safe_load(f)
    with open(plan_path) as f:
        plan = yaml.safe_load(f)

    issues = []
    warnings = []

    turns = transcript.get("turns", [])

    # Turn count: 10-14
    turn_count = len(turns)
    if turn_count < 10:
        issues.append(f"Turn count too low: {turn_count} (minimum 10)")
    elif turn_count > 14:
        issues.append(f"Turn count too high: {turn_count} (maximum 14)")

    # Sentences per turn: 1-3
    for i, turn in enumerate(turns, 1):
        sentence_count = len(turn.get("sentences", []))
        if sentence_count < 1:
            issues.append(f"Turn {i}: no sentences")
        elif sentence_count > 3:
            issues.append(f"Turn {i}: {sentence_count} sentences (maximum 3)")

    # Word count: under 400
    total_words = 0
    for turn in turns:
        for s in turn.get("sentences", []):
            total_words += len(s.get("text", "").split())
    if total_words > 400:
        issues.append(f"Word count too high: {total_words} (maximum 400)")
    elif total_words > 350:
        warnings.append(f"Word count approaching limit: {total_words}/400")

    # Speaker names match plan
    plan_names = {p["name"] for p in plan.get("personas", [])}
    transcript_names = {t["speaker"] for t in turns}
    if plan_names != transcript_names:
        missing = plan_names - transcript_names
        extra = transcript_names - plan_names
        if missing:
            issues.append(f"Missing speakers: {missing}")
        if extra:
            issues.append(f"Extra speakers not in plan: {extra}")

    # Turn order matches outline
    outline = plan.get("turn_outline", [])
    outline_speakers = [t["speaker"] for t in outline]
    transcript_speakers = [t["speaker"] for t in turns]

    if len(outline_speakers) != len(transcript_speakers):
        issues.append(
            f"Turn count mismatch: outline has {len(outline_speakers)}, "
            f"transcript has {len(transcript_speakers)}"
        )
    else:
        for i, (expected, actual) in enumerate(
            zip(outline_speakers, transcript_speakers), 1
        ):
            if expected != actual:
                issues.append(
                    f"Turn {i}: expected {expected} (from outline), "
                    f"got {actual}"
                )

    # Report
    print(f"Transcript review: {transcript_path}")
    print(f"  Turns: {turn_count}")
    print(f"  Words: {total_words}")
    print(f"  Speakers: {transcript_names}")

    if warnings:
        for w in warnings:
            print(f"  WARNING: {w}")

    if issues:
        print(f"\n  ISSUES ({len(issues)}):")
        for issue in issues:
            print(f"    - {issue}")
        return False
    else:
        print("  PASS: All structural checks passed")
        return True


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print(f"Usage: {sys.argv[0]} <transcript_path> <plan_path>",
              file=sys.stderr)
        sys.exit(1)
    ok = review_transcript(sys.argv[1], sys.argv[2])
    sys.exit(0 if ok else 1)
