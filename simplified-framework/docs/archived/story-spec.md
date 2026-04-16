# `story.yaml` Spec

`story.yaml` is the canonical story-source artifact for the simplified framework.

## Required Fields

- `story_id`
- `title`
- `premise`
- `characters`
- `episodes`

Each character should include:

- `id`
- `name`
- `voice_notes`

Each episode should include:

- `episode_id`
- `title`
- `flaws`

Optional but useful:

- `final_takeaway`
- `setting`
- `audience`

## Scope Rule

`story.yaml` should stay compact. It should define the story world, recurring characters, and episode-level flaw progression.

It should not contain:

- turn-level planning
- app questions
- answer options
- feedback

## Source Of Truth

The validator in `pipeline/scripts/validate_story.py` is the structural source of truth. `schemas/story.yaml` is a human-readable sketch.

