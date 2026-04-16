# `transcript.yaml` Spec

`transcript.yaml` stores the actual episode dialogue.

## Required Top-Level Fields

- `story_id`
- `episode_id`
- `title`
- `characters`
- `turns`

Optional top-level fields:

- `setting_note`
- `previously`

Each turn must include:

- `turn_id`
- `speaker`
- `text`

## Scope Rule

The transcript is source dialogue only. Do not include:

- flaw labels per turn
- answer keys
- warm-up or level definitions
- package feedback
- hidden analytic annotations

## Source Of Truth

The validator in `pipeline/scripts/validate_transcript.py` is the structural source of truth. `schemas/transcript.yaml` is a human-readable sketch.

