# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **Pipeline status (2026-04-10).** The v2 pipeline is **live**. The shared upstream (`/create_episode` → `/create_transcript` → `/build_assistive_package`) produces a single `assistive_package.yaml` per episode. App-specific downstream (`/configure_session`, `/configure_competition`) has moved out of the pipeline and into the app layer.

## Project Overview

Polylogue is a research project for teaching critical thinking to middle school students (grades 6-8). The system has three layers:

1. **Conceptual framework** (`framework/`) — The application-agnostic theory: three evaluative lenses (Logic, Evidence, Scope), a hidden structural layer of ten facets, two explanatory variables (cognitive patterns, social dynamics), and a perspectival learning model.

2. **Applications** (`apps/{app-id}/`) — Each application realizes the framework through a specific student experience. Each has:
   - **(a) A Claude Code pipeline** that generates artifacts (YAML files) from operator prompts
   - **(b) A student-facing / teacher-facing app** that consumes the generated artifacts at runtime

3. **Story design** (`framework/docs/story-design.md`) — Operator guidance for authoring a Polylogue story (cast, arc, coverage contract, pipeline design guidance). Each authored story is captured as a prose design document at `framework/stories/{story_id}.md` plus per-episode drafts at `framework/stories/{story_id}/episode_{NN}.md`. The end-to-end authoring runbook is at `framework/docs/operator-manual.md`.

For the full architecture, see `framework/docs/system-architecture.md`. The **Operator Role** section of that file documents who does what during a pipeline run — the operator owns authorship at the boundaries (Phase 6 prose authoring of the story design doc and per-episode drafts); the pipeline commands run autonomously, with reviewer subagents as the quality gates.

### Applications

| Application | Status | Description |
|---|---|---|
| **Lens** | Pipeline complete (story-based), app not yet built | Students read AI-generated discussions and evaluate passages through lenses. Reflective, writing-centered. |
| **Reasoning Lab** | Pipeline complete (story-based), experimental | Forensic investigation metaphor with competitive scoring. Teams use scanner tools (lenses); rare findings score triple. |

Lens is the priority. Reasoning Lab is experimental.

## System Structure

Top-level layout: `framework/` (docs, reference data, shared schemas, shared pipeline), `apps/{lens,reasoning-lab}/` (app-specific docs, schemas, pipeline, `RUNNING.md`), `artifacts/` (story + episode artifacts). `registry/`, `configs/`, and `docs/` at the repo root are **frozen historical reference** from the legacy disposable-persona system — not maintained. See `framework/docs/system-architecture.md` for the full directory breakdown.

## Documentation

| Document | Purpose |
|---|---|
| `framework/docs/conceptual-framework.md` | The reasoning quality ontology |
| `framework/docs/story-design.md` | Story authoring guidance — cast, coverage, drafts, pipeline design guidance, per-episode template |
| `framework/docs/pipeline-architecture.md` | Pipeline spec — assistive package schemas, agent architecture, governance rules |
| `framework/docs/operator-manual.md` | End-to-end runbook — Phase 6 authoring + Phase 7 execution |
| `framework/docs/system-architecture.md` | System structure — three-layer model, directory layout, conventions |
| `framework/docs/capability-flags.md` | Story-level capability flag reference |
| `framework/docs/probe-record-handoff.md` | Pipeline-to-app handoff contract |

## Pipeline Flow

A story is authored as prose in Phase 6 (the story design doc plus per-episode drafts), then each episode runs through the shared pipeline in Phase 7. Every command takes `<story_id> <episode_number>` as its arguments.

```
STORY (Phase 6, once per story, authored as prose by the operator):
  framework/stories/{story_id}.md          (story design doc + frontmatter)
  framework/stories/{story_id}/            (per-episode drafts)
    episode_01.md, episode_02.md, ...
  Validators: validate_story.py + story_consistency_reviewer

EPISODE (Phase 7, per episode in the story):
  /create_episode → /create_transcript → /build_assistive_package
  (episode plan)    (discussion script)   (analyst → diagnostic →
                                           prose → discussion →
                                           reviewer → merge)
```

## Artifact Storage

The pipeline writes to `artifacts/{story_id}/episodes/episode_{NN}/...`. The story design doc and per-episode drafts live under `framework/stories/{story_id}/` (authored, committed as source).

```
framework/stories/{story_id}.md          # Story design doc (frontmatter + prose body)
framework/stories/{story_id}/            # Per-episode drafts directory
    episode_01.md
    episode_02.md
    ...
framework/stories/archive/v1/            # Frozen v1-pipeline stories (historical reference only)
framework/stories/v1-storylines/         # Creative briefs extracted from frozen v1 stories
framework/stories/validation/            # Sidecar audit from validate_story.py (gitignored)

artifacts/{story_id}/episodes/
    └── episode_{NN}/
        ├── episode.yaml                    # Stage 1 (/create_episode)
        ├── transcript.yaml                 # Stage 2 (/create_transcript)
        ├── ground_truth_generated.yaml     # Stage 3 (/build_assistive_package — analyst)
        ├── diagnostic_generated.yaml       # Stage 3 (diagnostic)
        ├── prose_generated.yaml            # Stage 3 (prose)
        ├── discussion_generated.yaml       # Stage 3 (discussion)
        ├── assistive_package.yaml          # Stage 3 (merged — the runtime artifact)
        ├── pipeline_log.yaml               # Audit trail
        └── intermediates/
            └── episode_writer_input.yaml   # Barrier-safe projection consumed by dialog_writer

artifacts/archive/v1/                    # Frozen v1-pipeline artifacts (historical reference only)
```

**V1 archive policy.** `framework/stories/archive/v1/` and `artifacts/archive/v1/` hold frozen v1-pipeline content. The pipeline does not read from these paths. `validate_story.py` rejects `archive` and `validation` as story IDs. When evolving a v1 story's premise, extract a creative brief into `framework/stories/v1-storylines/` and author a new story with a new story ID.

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

The legacy disposable-persona system (`configs/`, `docs/`, `registry/`) remains frozen indefinitely as historical reference. The story-based pipeline is a clean break — no migration is performed, no artifact equivalence is required.

## Critical Design Constraints

### Information Barrier
The dialog writer must never see facet IDs, lens names, cognitive patterns, or social dynamics. In the story pipeline this is enforced by a barrier-safe **projection**: `planning_agent` reads the per-episode draft and the story design doc, and writes both `episode.yaml` (with framework terminology, for reviewers) and `episode_writer_input.yaml` (a stripped narrative slice). `dialog_writer` runs in a fresh context with no Read tool and consumes only that projection inline. Two enforcement mechanisms run on every projection: a literal scan in `validate_schema.py` (catches reserved IDs) and the `projection_reviewer` agent (catches paraphrased framework leakage). Neither alone is sufficient.

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
- **No new pipeline file references `configs/` or `registry/`.** The system uses `framework/`, `apps/{app-id}/`, and `artifacts/` exclusively.
- **The directory key is `{story_id}/episodes/episode_{NN}/`.** The episode plan filename is `episode.yaml`.

### Canonical IDs

- Lenses (3): `logic`, `evidence`, `scope`
- Facets (10): `source_credibility`, `source_diversity`, `relevance`, `sufficiency`, `inferential_validity`, `internal_consistency`, `reasoning_completeness`, `perspective_engagement`, `consequence_consideration`, `condition_sensitivity`
- Cognitive patterns (8): `confirmation_bias`, `tunnel_vision`, `overgeneralization`, `false_cause`, `uncritical_acceptance`, `black_and_white_thinking`, `egocentric_thinking`, `false_certainty`
- Social dynamics (3): `group_pressure`, `conflict_avoidance`, `authority_deference`
