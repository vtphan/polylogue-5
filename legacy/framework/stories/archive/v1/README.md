# v1 Story Archive

This directory contains story design docs and per-episode drafts authored against the **v1 pipeline** (the pre-runtime-package-restructure authoring model). They are frozen here as historical reference.

## Contents

- `saving-the-maker-space.md` and `saving-the-maker-space/episode_*.md` — the v1 pilot, shipped as the first end-to-end validation of the story-based pipeline. Authored with the now-retired `signal_template` / cast-level design expectations.
- `the-overton-park-sightings.md` and `the-overton-park-sightings/episode_*.md` — the second v1 story, authored as per-episode drafts but never run through Phase 7.

## Policy

- **The v2 pipeline does not read from this directory.** Live pipeline scripts (`validate_story.py`, `story_consistency_reviewer`, `initialize_lens.py`, etc.) exclude archive paths.
- **Do not run pipeline commands against these files.** The pipeline's agent prompts, schemas, and reviewers assume the current (v2) affordance surface; v1 drafts will not align.
- **Do not edit these files.** They are historical artifacts. If you want to evolve a v1 story's premise for v2 use, extract a creative brief into `framework/stories/v1-storylines/` and author a new v2 story with a new story ID.

## Where to look instead

- **Current stories:** `framework/stories/` (excluding this archive).
- **Creative briefs extracted from v1 stories:** `framework/stories/v1-storylines/`.
- **The restructure rationale:** `framework/docs/runtime-package-restructure.md`.
- **The v1→v2 migration narrative:** `framework/docs/pipeline-v1-to-v2-migration.md`.
