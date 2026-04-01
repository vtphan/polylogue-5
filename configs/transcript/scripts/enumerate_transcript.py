#!/usr/bin/env python3
"""Assign sequential turn and sentence IDs to a pre-enumeration transcript.

Transforms a transcript_pre.yaml (no IDs) into a transcript.yaml (with IDs).
Turn IDs: turn_01, turn_02, ...
Sentence IDs: turn_01.s01, turn_01.s02, ...

Usage:
    python3 enumerate_transcript.py <input_path> <output_path>

Example:
    python3 enumerate_transcript.py \
        registry/ocean-vs-deforestation/intermediates/transcript_polished.yaml \
        registry/ocean-vs-deforestation/transcript.yaml
"""

import sys
import yaml


def enumerate_transcript(input_path, output_path):
    with open(input_path) as f:
        transcript = yaml.safe_load(f)

    for ti, turn in enumerate(transcript["turns"], 1):
        turn_id = f"turn_{ti:02d}"
        turn["turn_id"] = turn_id
        for si, sentence in enumerate(turn["sentences"], 1):
            sentence["sentence_id"] = f"{turn_id}.s{si:02d}"

    # Verify all IDs are unique
    all_ids = []
    for turn in transcript["turns"]:
        all_ids.append(turn["turn_id"])
        for s in turn["sentences"]:
            all_ids.append(s["sentence_id"])

    if len(all_ids) != len(set(all_ids)):
        print("ERROR: Duplicate IDs detected", file=sys.stderr)
        sys.exit(1)

    with open(output_path, "w") as f:
        yaml.dump(transcript, f, default_flow_style=False, allow_unicode=True,
                  width=100, sort_keys=False)

    turn_count = len(transcript["turns"])
    sentence_count = sum(len(t["sentences"]) for t in transcript["turns"])
    print(f"Enumerated: {input_path} -> {output_path}")
    print(f"  {turn_count} turns, {sentence_count} sentences, {len(all_ids)} IDs")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print(f"Usage: {sys.argv[0]} <input_path> <output_path>",
              file=sys.stderr)
        sys.exit(1)
    enumerate_transcript(sys.argv[1], sys.argv[2])
