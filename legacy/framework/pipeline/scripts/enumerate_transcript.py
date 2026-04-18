#!/usr/bin/env python3
"""Assign sequential turn and sentence IDs to a pre-enumeration transcript,
and inject identifier + persona metadata from the sibling episode.yaml.

Transforms a transcript_polished.yaml (no IDs, no identifiers) into a
transcript.yaml (with IDs, identifiers, and persona metadata).

Turn IDs: turn_01, turn_02, ...
Sentence IDs: turn_01.s01, turn_01.s02, ...

Identifier + persona injection:
    The pre-enumeration transcript is written by dialog_writer, which
    runs inside the information barrier and cannot read episode.yaml.
    The post-enumeration transcript needs story_id, episode_number,
    scenario_id (legacy), and a personas block for app rendering. This
    script reads the sibling episode.yaml (located in the same directory
    as <output_path>) and injects those fields at the top of the output.

Usage:
    python3 enumerate_transcript.py <input_path> <output_path>

Example:
    python3 enumerate_transcript.py \\
        artifacts/{story_id}/episodes/episode_01/intermediates/transcript_polished.yaml \\
        artifacts/{story_id}/episodes/episode_01/transcript.yaml
"""

import sys
from pathlib import Path
import yaml


def load_episode_metadata(output_path):
    """Read the sibling episode.yaml and extract metadata for injection.

    The sibling episode.yaml is expected to live in the same directory as
    <output_path>. Returns a dict with story_id, episode_number,
    scenario_id (if present), and personas (name + perspective only).
    """
    episode_yaml = Path(output_path).parent / "episode.yaml"
    if not episode_yaml.exists():
        print(
            f"ERROR: sibling episode.yaml not found at {episode_yaml} — "
            "cannot inject identifiers/personas",
            file=sys.stderr,
        )
        sys.exit(1)

    with open(episode_yaml) as f:
        ep = yaml.safe_load(f)

    metadata = {}
    if "story_id" not in ep or "episode_number" not in ep:
        print(
            f"ERROR: {episode_yaml} missing story_id or episode_number — "
            "cannot inject primary identifiers",
            file=sys.stderr,
        )
        sys.exit(1)
    metadata["story_id"] = ep["story_id"]
    metadata["episode_number"] = ep["episode_number"]
    if "scenario_id" in ep:
        metadata["scenario_id"] = ep["scenario_id"]
    metadata["personas"] = [
        {"name": p["name"], "perspective": p["perspective"]}
        for p in ep.get("personas", [])
    ]
    return metadata


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

    # Inject identifier + persona metadata from sibling episode.yaml.
    # Build a fresh dict so the identifier fields land at the top of the
    # output file in the order story_id, episode_number, scenario_id,
    # personas, turns.
    metadata = load_episode_metadata(output_path)
    out = {}
    out["story_id"] = metadata["story_id"]
    out["episode_number"] = metadata["episode_number"]
    if "scenario_id" in metadata:
        out["scenario_id"] = metadata["scenario_id"]
    out["personas"] = metadata["personas"]
    out["turns"] = transcript["turns"]
    # Preserve any other top-level keys the writer may have added,
    # without overriding the injected ones.
    for k, v in transcript.items():
        if k not in out:
            out[k] = v

    with open(output_path, "w") as f:
        yaml.dump(out, f, default_flow_style=False, allow_unicode=True,
                  width=100, sort_keys=False)

    turn_count = len(out["turns"])
    sentence_count = sum(len(t["sentences"]) for t in out["turns"])
    print(f"Enumerated: {input_path} -> {output_path}")
    print(f"  {turn_count} turns, {sentence_count} sentences, {len(all_ids)} IDs")
    print(f"  Injected: story_id={out['story_id']}, episode_number={out['episode_number']}"
          + (f", scenario_id={out['scenario_id']}" if 'scenario_id' in out else ""))


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print(f"Usage: {sys.argv[0]} <input_path> <output_path>",
              file=sys.stderr)
        sys.exit(1)
    enumerate_transcript(sys.argv[1], sys.argv[2])
