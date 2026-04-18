# Architecture

This document explains how the Polylogue repository is organized and where responsibility shifts between the framework and application layers.

## Layers

- **Framework layer** — shared pedagogy, reference data, schemas, commands, agents, and generated artifact definitions
- **Application layer** — app-specific consumption of the framework artifacts

The framework produces shared artifacts. Applications decide how to use them.

## Framework Layer

Important directories:

- `framework/docs/` — live docs plus `archive/` for historical material
- `framework/reference/` — source-of-truth YAML for lenses, facets, and explanatory variables
- `framework/schemas/` — shared artifact schemas
- `framework/stories/` — story design docs and episode drafts
- `framework/pipeline/agents/` — shared pipeline agents
- `framework/pipeline/commands/` — shared operator-facing commands
- `framework/pipeline/scripts/` — deterministic validators, merge logic, and bootstrap

Story review outputs live in:

- `framework/stories/validation/` — mechanical YAML sidecars from `validate_story.py`
- `framework/stories/calibration/` — persistent Markdown reports from `/validate_story`

## Application Layer

Each app defines how students experience the framework under `apps/{app_id}/`.

Typical app-owned directories:

- `apps/{app_id}/docs/`
- `apps/{app_id}/schemas/`
- `apps/{app_id}/pipeline/`

The framework stops at `assistive_package.yaml`. App-specific runtime behavior belongs to the application layer.

## Artifact Storage

Generated episode artifacts live at:

```text
artifacts/{story_id}/episodes/episode_{NN}/
```

Key files include:

- `episode.yaml`
- `transcript.yaml`
- `assistive_package.yaml`
- `pipeline_log.yaml`
- `intermediates/episode_writer_input.yaml`

## Operator Touchpoints

The operator is involved at the boundaries:

- story authoring and `/validate_story`
- kickoff of each episode via `/create_episode`
- app-specific downstream setup

The middle of the episode pipeline is designed to run autonomously until a reviewer or validator halts it.

## Bootstrap

Use:

```bash
python3 framework/pipeline/scripts/initialize_polylogue.py
```

to sync the full shared framework pipeline. Add `--app <app_id>` when you want
app-specific commands and agents layered on top of the shared pipeline.
