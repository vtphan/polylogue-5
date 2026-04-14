# Artifacts Generation

This document covers the artifact-generation half of the Polylogue pipeline. It begins after story authoring has produced a validated story and explains how each episode becomes a plan, a transcript, and a final assistive package.

## Episode-Level Pipeline

Once `/validate_story` returns `READY`, each episode runs through three commands in order:

1. `/create_episode <story_id> <NN>`
2. `/create_transcript <story_id> <NN>`
3. `/build_assistive_package <story_id> <NN>`

Each command runs in a fresh conversation. Files on disk are the source of truth between steps.

## Stage 1: Episode Plan

`/create_episode` reads the story design doc and one per-episode draft, then produces:

- `episode.yaml`
- `intermediates/episode_writer_input.yaml`

This stage also enforces the information barrier for the later dialog writer.

## Stage 2: Transcript

`/create_transcript` consumes `episode_writer_input.yaml` and produces:

- `transcript.yaml`

The transcript stage is barrier-sensitive. The dialog writer only sees the projection, not the full plan or the story design doc.

## Stage 3: Assistive Package

`/build_assistive_package` consumes `episode.yaml` and `transcript.yaml`, then produces:

- `ground_truth.yaml`
- `diagnostic.yaml`
- `prose.yaml`
- `discussion.yaml`
- `assistive_package.yaml`

The merged `assistive_package.yaml` is the terminal framework artifact. Applications consume it in the app layer.

## Artifact Roles

- `episode.yaml` — full episode plan with framework terminology
- `episode_writer_input.yaml` — barrier-safe projection for transcript generation
- `transcript.yaml` — enumerated dialog transcript
- `ground_truth.yaml` — analytical source material
- `diagnostic.yaml` — reactive intervention content
- `prose.yaml` — student-facing opening and closure prose
- `discussion.yaml` — group-phase cues and talk moves
- `assistive_package.yaml` — merged runtime package

## Validation Layers

Artifact generation remains strict even after `/validate_story` passes.

- `validate_story` reduces downstream churn at the story level.
- `validate_schema.py` checks each generated artifact against its schema.
- `review_transcript.py` checks transcript structure.
- `merge_assistive_package.py` enforces cross-file integrity.
- reviewer agents judge artifact quality at each stage.

Story validation improves the inputs; it does not replace validation of later transformations.

## Agent Boundaries

The episode pipeline uses distinct agents for distinct jobs:

- `planning_agent`
- `validation_agent`
- `projection_reviewer`
- `dialog_writer`
- `transcript_id`
- `transcript_reviewer`
- `analyst_agent`
- `diagnostic_agent`
- `prose_agent`
- `discussion_agent`
- `package_reviewer`

The four downstream authoring agents each own one file: analyst, diagnostic, prose, and discussion. The merge script is deterministic and runs only after the reviewer accepts the authored package inputs.

## Artifact Storage

Episode artifacts live at:

```text
artifacts/{story_id}/episodes/episode_{NN}/
```

Typical contents:

- `episode.yaml`
- `transcript.yaml`
- `ground_truth_generated.yaml`
- `diagnostic_generated.yaml`
- `prose_generated.yaml`
- `discussion_generated.yaml`
- `assistive_package.yaml`
- `pipeline_log.yaml`
- `intermediates/episode_writer_input.yaml`

## Handoff To Applications

The framework stops at `assistive_package.yaml`. App-specific consumption happens under `apps/{app_id}/` and may define additional contracts, but the framework pipeline does not write app-owned runtime state.
