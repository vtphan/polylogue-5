# `episode-plan.yaml` Spec

`episode-plan.yaml` is the bridge artifact between story design and transcript writing.

## Required Fields

- `story_id`
- `episode_id`
- `title`
- `episode_goal`
- `flaws`
- `student_takeaway`

Each `flaws[]` entry must include:

- `id`
- `amplification`

Optional per flaw entry:

- `scene_note`

Allowed amplification values:

- `unmistakable`
- `showcased`
- `heightened`

## Planning Rule

Write one `flaws[]` entry per intended flaw moment, not one per flaw type.

If the same flaw should appear in four different turns, write four entries with separate `scene_note` values.

Target roughly 5 to 7 intended flaw moments per episode, aligned to `episode-composition.md`.

## Useful Optional Fields

- `scene_design`
- `flaw_embedding_guidance`
- `target_teachable_moments`
- `warmup_candidate_goal`
- `level_candidate_goal`
- `character_beats`

## Scope Rule

`episode-plan.yaml` should guide transcript writing and later package generation. It should not contain scripted dialogue or app-ready teaching objects.

## Source Of Truth

The validator in `pipeline/scripts/validate_episode_plan.py` is the structural source of truth. `schemas/episode-plan.yaml` is a human-readable sketch.

