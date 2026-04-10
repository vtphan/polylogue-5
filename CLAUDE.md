# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **Pipeline status (2026-04-09).** The system described in this file is **v1 (currently live)**. A v2 pipeline redesign is in flight — the downstream half (`/analyze_transcript` + `/design_scaffolding`) will be replaced by a single `/build_assistive_package` command with four authoring agents, and `/configure_session` / `/configure_competition` will move out of the pipeline and into the app layer. See `framework/docs/pipeline-v1-to-v2-migration.md` for the authoritative v1→v2 diff, and `framework/docs/pipeline-architecture.md` / `pipeline-revision-plan.md` / `pipeline-revision-implementation.md` for the target design. Until v2 ships, this file and the per-app `RUNNING.md` files describe the live v1 system.

## Project Overview

Polylogue is a research project for teaching critical thinking to middle school students (grades 6-8). The system has three layers:

1. **Conceptual framework** (`framework/`) — The application-agnostic theory: three evaluative lenses (Logic, Evidence, Scope), a hidden structural layer of ten facets, two explanatory variables (cognitive patterns, social dynamics), and a perspectival learning model.

2. **Applications** (`apps/{app-id}/`) — Each application realizes the framework through a specific student experience. Each has:
   - **(a) A Claude Code pipeline** that generates artifacts (YAML files) from operator prompts
   - **(b) A student-facing / teacher-facing app** that consumes the generated artifacts at runtime

3. **Story design** (`framework/docs/story-design.md`) — Operator guidance for authoring a Polylogue story (cast, arc, coverage contract). Each authored story is captured as a prose design document at `framework/stories/{story_id}.md` plus per-episode drafts at `framework/stories/{story_id}/episode_{NN}.md`. The full rationale for the story-based pipeline lives in `framework/docs/story-pipeline-revision.md`; the end-to-end authoring runbook is at `framework/docs/operator-manual.md`.

For the full architecture, see `framework/docs/system-architecture.md`. The **Operator Role** section of that file documents who does what during a pipeline run — the operator owns authorship at the boundaries (Phase 6 prose authoring of the story design doc and per-episode drafts; `/configure_session`, `/configure_competition`); the middle commands run autonomously, with reviewer subagents as the quality gates.

### Applications

| Application | Status | Description |
|---|---|---|
| **Lens** | Pipeline complete (story-based), app not yet built | Students read AI-generated discussions and evaluate passages through lenses. Reflective, writing-centered. |
| **Reasoning Lab** | Pipeline complete (story-based), experimental | Forensic investigation metaphor with competitive scoring. Teams use scanner tools (lenses); rare findings score triple. |

Lens is the priority. Reasoning Lab is experimental.

## System Structure

Top-level layout: `framework/` (docs, reference data, shared schemas, shared pipeline), `apps/{lens,reasoning-lab}/` (app-specific docs, schemas, pipeline, `RUNNING.md`), `artifacts/` (story + episode artifacts — the new system output). `registry/`, `configs/`, and `docs/` at the repo root are **frozen historical reference** from the legacy disposable-persona system — not maintained, not a migration target. See `framework/docs/system-architecture.md` for the full directory breakdown.

## Pipeline Flow

A story is authored as prose in Phase 6 (the story design doc plus per-episode drafts), then each episode runs through the shared upstream and one app-specific downstream in Phase 7. Every episode-stage command takes `<story_id> <episode_number>` as its arguments.

```
STORY (Phase 6, once per story, authored as prose by the operator):
  framework/stories/{story_id}.md          (story design doc + frontmatter)
  framework/stories/{story_id}/            (per-episode drafts)
    episode_01.md, episode_02.md, ...
  Validators: validate_story.py + story_consistency_reviewer

EPISODE (Phase 7, per episode in the story):
  SHARED:  /create_episode → /create_transcript → /analyze_transcript
                                                          │
             ┌────────────────────────────────────────────┤
             ↓                                            ↓
  LENS:    /design_scaffolding → /configure_session  REASONING LAB:
                                                     /design_scoring_rubric → /configure_competition
```

## Artifact Storage

The story-based pipeline writes to `artifacts/{story_id}/episodes/episode_{NN}/...`. The story design doc and per-episode drafts live under `framework/stories/{story_id}/` (authored, committed as source). The legacy `registry/` directory is **not** a migration target — no artifact equivalence is required between the legacy and new systems for either Lens or Reasoning Lab.

```
framework/stories/{story_id}.md          # Story design doc (frontmatter + prose body)
framework/stories/{story_id}/            # Per-episode drafts directory
    episode_01.md
    episode_02.md
    ...
framework/stories/archive/v1/            # Frozen v1-pipeline stories (historical reference only)
    saving-the-maker-space.md            #   — the v1 pilot
    saving-the-maker-space/episode_*.md
    the-overton-park-sightings.md
    the-overton-park-sightings/episode_*.md
    README.md                            # Archive policy
framework/stories/v1-storylines/         # Creative briefs extracted from frozen v1 stories
    {v1_story_id}.md                     #   — premise + arc only; no targets/signals. Live content.
framework/stories/validation/{story_id}-validation-report-{YYYYMMDD-HHMMSS}.yaml   # Sidecar audit from validate_story.py (gitignored)

artifacts/{story_id}/episodes/
    └── episode_{NN}/
        ├── episode.yaml         # Shared (stage 1 — produced by /create_episode)
        ├── transcript.yaml      # Shared (stage 2)
        ├── analysis.yaml        # Shared (stage 3)
        ├── facilitation.yaml    # Shared (stage 3)
        ├── intermediates/
        │   └── episode_writer_input.yaml   # Barrier-safe projection consumed by dialog_writer
        ├── lens/
        │   ├── scaffolding.yaml
        │   ├── facilitation.yaml            # Enriched version
        │   └── session.yaml
        └── reasoning-lab/
            ├── scoring.yaml
            ├── competition-facilitation.yaml
            └── session.yaml

artifacts/archive/v1/                    # Frozen v1-pipeline artifacts (historical reference only)
    saving-the-maker-space/episodes/...  #   — the v1 pilot's generated artifacts
    README.md                            # Archive policy
```

**V1 archive policy.** `framework/stories/archive/v1/` and `artifacts/archive/v1/` hold frozen v1-pipeline content (two stories: `saving-the-maker-space` and `the-overton-park-sightings`). The v2 pipeline does not read from these paths. `validate_story.py` rejects `archive` and `validation` as story IDs. When evolving a v1 story's premise for v2 use, extract a creative brief into `framework/stories/v1-storylines/` and author a new v2 story with a new story ID — never overwrite the archive. See `framework/docs/runtime-package-restructure.md` and `framework/docs/pipeline-v1-to-v2-migration.md` for the rationale.

## Bootstrapping

Before running slash commands, initialize the pipeline:

```bash
# Phase 6 authoring only (shared commands, no app downstream)
python3 framework/pipeline/scripts/initialize_polylogue.py

# Full pipeline with an app downstream
python3 framework/pipeline/scripts/initialize_polylogue.py --app lens
python3 framework/pipeline/scripts/initialize_polylogue.py --app reasoning-lab
```

The script clears `.claude/commands/` and `.claude/agents/` (preventing cross-app leakage), then syncs shared commands/agents from `framework/pipeline/` plus app-specific commands/agents when `--app` is provided. Omitting `--app` syncs only shared upstream commands and agents, which is sufficient for Phase 6 authoring and `/validate_story`. `.claude/commands/` and `.claude/agents/` are gitignored.

## Legacy System

The legacy disposable-persona system (`configs/`, `docs/`, `registry/`) remains frozen indefinitely as historical reference. The story-based pipeline is a clean break — no migration is performed, no artifact equivalence is required between legacy and new, and no legacy directory is removed by the new pipeline. See `framework/docs/story-pipeline-revision.md` Part 1 for the rationale.

The legacy scenario-sequence files (`framework/reference/scenario_sequence.yaml`, `framework/docs/scenario-sequence.md`) and the legacy `check_coverage` script and command were removed in Phase 8 closeout (2026-04-07) after the first story shipped. Story-based coverage is now checked by `validate_story.py`.

## Critical Design Constraints

### Information Barrier
The dialog writer must never see facet IDs, lens names, cognitive patterns, or social dynamics. In the story pipeline this is enforced by a barrier-safe **projection**: `planning_agent` reads the per-episode draft (`framework/stories/{story_id}/episode_{NN}.md`), the story design doc (`framework/stories/{story_id}.md`), and writes both `episode.yaml` (with framework terminology, for reviewers) and `episode_writer_input.yaml` (a stripped narrative slice with no facet IDs, no lens names, no cognitive_pattern or social_dynamic IDs, and no signal fields). `dialog_writer` runs in a fresh context with no Read tool and consumes only that projection inline. Two enforcement mechanisms run on every projection: a literal scan in `validate_schema.py` (catches reserved IDs) and the `projection_reviewer` agent (catches paraphrased framework leakage). Neither alone is sufficient.

The prose-first authoring loop (Phase 6) is operator + AI in conversation; there is no `/design_story` drafting command. Per-episode drafts are committed Markdown files. Character consistency across episodes is enforced by `story_consistency_reviewer` (prose-on-prose review), not by a structural validator.

### Discussion Constraints
- 10-14 turns, 1-3 sentences per turn, <400 words total
- Natural 6th-grade language with distinct persona voices
- Personas must have genuine disagreement
- Readable in 3 minutes

### AI Perspective (Unified)
Single integrated AI perspective block per passage — per-lens observations combined with an explanation of why characters reasoned this way. Written as perspective, not verdict.

### Unified Scaffold Sequence (Lens)
Graduated hints → AI perspective as final entry. Hints cost lifelines; AI perspective is free after assessment.

## Conventions

- **All artifacts are YAML.** Schemas are descriptive YAML (human-readable contracts).
- **Canonical IDs use snake_case.** All IDs propagate from `framework/reference/` into every schema, prompt, and artifact.
- **Reference data files are the source of truth** — not schema definitions.
- **Python scripts** use pure Python + PyYAML. Scripts accept file paths as arguments, no hardcoded paths.
- **No new pipeline file references `configs/` or `registry/`.** The new system uses `framework/`, `apps/{app-id}/`, and `artifacts/` exclusively. Legacy directories are frozen historical reference, not maintained code.
- **The directory key is `{story_id}/episodes/episode_{NN}/`,** not `{scenario_id}/`. The episode plan filename is `episode.yaml`. `scenario_id` survives as a field inside `episode.yaml` for traceability and pipeline log lines, but the on-disk addressing is by story and episode number.

### Canonical IDs

- Lenses (3): `logic`, `evidence`, `scope`
- Facets (10): `source_credibility`, `source_diversity`, `relevance`, `sufficiency`, `inferential_validity`, `internal_consistency`, `reasoning_completeness`, `perspective_engagement`, `consequence_consideration`, `condition_sensitivity`
- Cognitive patterns (8): `confirmation_bias`, `tunnel_vision`, `overgeneralization`, `false_cause`, `uncritical_acceptance`, `black_and_white_thinking`, `egocentric_thinking`, `false_certainty`
- Social dynamics (3): `group_pressure`, `conflict_avoidance`, `authority_deference`
