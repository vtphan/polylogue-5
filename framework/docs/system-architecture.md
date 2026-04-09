# System Architecture

This document describes how the Polylogue system is organized — the relationship between the conceptual framework, the shared pipeline, and the applications that realize the framework for students. For the stage-by-stage pipeline reference, see `pipeline-flow.md`.

## Three-Layer Structure

```
┌─────────────────────────────────────────────────────────────┐
│  FRAMEWORK                                                  │
│  Conceptual foundation: lenses, facets, explanatory         │
│  variables, perspectival learning model, story design       │
│                                                             │
│  framework/                                                 │
│  ├── docs/           Conceptual framework, story design,    │
│  │                   operator manual, stories/              │
│  ├── reference/      Source-of-truth data (YAML)            │
│  ├── schemas/        Shared upstream schemas                │
│  └── pipeline/       Shared upstream agents, commands,      │
│                      scripts (stages 1–3)                   │
└────────────────────────┬────────────────────────────────────┘
                         │ Shared artifacts:
                         │   episode.yaml, transcript.yaml,
                         │   analysis.yaml, facilitation.yaml
                         ▼
┌──────────────────────────────┐  ┌───────────────────────────┐
│  APPLICATION: Lens           │  │  APPLICATION: Reasoning Lab│
│                              │  │                           │
│  apps/lens/                  │  │  apps/reasoning-lab/      │
│  ├── docs/                   │  │  ├── docs/                │
│  ├── schemas/                │  │  ├── schemas/             │
│  └── pipeline/               │  │  └── pipeline/            │
│      agents, commands        │  │      agents, commands     │
│      (stages 4–5)            │  │      (stages 4a–5a)       │
│                              │  │                           │
│  App-specific artifacts:     │  │  App-specific artifacts:  │
│    scaffolding.yaml          │  │    scoring.yaml           │
│    session.yaml              │  │    competition-           │
│                              │  │      facilitation.yaml    │
│                              │  │    session.yaml           │
└──────────────────────────────┘  └───────────────────────────┘
```

## What Each Layer Contains

### Framework (`framework/`)

The framework is application-agnostic. It defines the theory, the shared data, and the upstream pipeline that all applications depend on.

| Directory | Contents | Purpose |
|---|---|---|
| `framework/docs/` | `conceptual-framework.md`, `story-design.md`, `operator-manual.md`, `story-pipeline-revision.md`, `pipeline-flow.md`, `RUNNING-shared-stages.md`, this file, plus `framework/stories/` (story design docs and per-episode drafts) | Theory and shared design |
| `framework/reference/` | `lenses.yaml`, `facet_inventory.yaml`, `explanatory_variables.yaml` | Source-of-truth data. All IDs propagate from here. |
| `framework/schemas/` | Shared upstream schemas (incl. `episode_plan.yaml`, `episode_writer_input.yaml`) | Contracts for shared artifacts |
| `framework/pipeline/agents/` | Shared upstream agents (planning, validation, dialog writer, transcript ID, transcript reviewer, evaluator, analysis reviewer, projection reviewer, story_consistency_reviewer) | Shared upstream agents |
| `framework/pipeline/commands/` | Shared upstream commands (`create_episode`, `brainstorm`, `create_transcript`, `analyze_transcript`) | Shared upstream commands |
| `framework/pipeline/scripts/` | Shared upstream scripts (`validate_schema.py`, `validate_story.py`, `enumerate_transcript.py`, `review_transcript.py`, `check_analysis_invariants.py`, `log_pipeline_event.py`) | Shared upstream scripts |

### Applications (`apps/{app-id}/`)

Each application defines how students experience the framework. An application has two parts: a pipeline that generates app-specific artifacts, and an app that consumes all artifacts at runtime.

| Directory | Contents | Purpose |
|---|---|---|
| `apps/{app-id}/docs/` | Instructional design, pipeline spec, app design, game design | Application-specific documentation |
| `apps/{app-id}/schemas/` | Application-specific artifact schemas | Contracts for app-specific artifacts |
| `apps/{app-id}/pipeline/agents/` | Application-specific agent prompts | Agents for downstream stages |
| `apps/{app-id}/pipeline/commands/` | Application-specific commands | Commands for downstream stages |

## Pipeline Flow

The stage-by-stage reference — shared upstream stages 1–3 plus app-specific stages 4–5 / 4a–5a, with commands, agents, and outputs — lives in `framework/docs/archive/pipeline-flow.md` (v1, pending v2 replacement). Operator runbooks are in `framework/docs/archive/RUNNING-shared-stages.md` (v1 shared, pending v2 replacement) and each app's `RUNNING.md` (app-specific).

## Operator Role

The **operator** (a human running these slash commands inside Claude Code) is involved at the *boundaries* of the pipeline, not in the middle of it. The pipeline is autonomous between operator touchpoints — agents produce artifacts, reviewer subagents gate them, and the operator's attention is conserved for decisions only a human can make.

### Authorship touchpoints (operator MUST be involved)

| Touchpoint | What the operator does |
|---|---|
| **Story design** (prose authoring) | Authors `framework/stories/{story_id}.md` (the story design doc) and `framework/stories/{story_id}/episode_{NN}.md` (per-episode drafts). See `framework/docs/archive/operator-manual.md` (v1, pending v2 replacement). `/brainstorm` is an optional conversational helper for the per-episode draft. |
| **Kickoff** (`/create_episode`) | Runs the command with `<story_id> <episode_number>`. The per-episode draft IS the operator prompt — there is no inline input. |
| **Finalize Lens** (`/configure_session`) | Authors student-facing onboarding strings, per-state instructions, lifeline pool size, reference-list visibility toggles |
| **Finalize Reasoning Lab** (`/configure_competition`) | Analogous content decisions for the competitive format |

These encode pedagogical intent that no agent can infer.

### Autonomous touchpoints (operator does NOT intervene mid-flow)

The middle commands — `/create_transcript`, `/analyze_transcript`, `/design_scaffolding`, `/design_scoring_rubric` — run end-to-end without operator gates. Each command's reviewer subagent (`validation_agent`, `transcript_reviewer`, `analysis_reviewer`, `scaffolding_reviewer`) is the structural quality gate. The operator does not second-guess reviewers in flow.

Each producer/reviewer pair has a bounded retry budget (typically 1 revise pass, plus a small regeneration limit on `/create_transcript`). If the budget is exhausted, the command halts — see the escape hatch below.

### Failure-mode escape hatch (reactive, not routine)

If a reviewer's retry budget is exhausted, the command halts with:
- The latest version of the artifact(s) it was producing
- The latest reviewer report
- A pointer to `artifacts/{story_id}/episodes/episode_{NN}/intermediates/` for stage-by-stage debugging

The operator then decides:
- **Edit and resume** — manually adjust the failing artifact and re-run downstream commands
- **Accept as-is** — save the latest version and proceed despite reviewer concerns
- **Restart upstream** — return to an earlier stage (e.g., `/create_episode`) if the failure indicates a structural problem with the input. If the failure is structural at the story level (the same signal fails to land across two episodes), return to prose authoring and revise the per-episode draft, or the story design doc if the drift is character-level.

### Inspection (optional, anytime)

Everything in `artifacts/{story_id}/episodes/episode_{NN}/` is YAML on disk. The operator can inspect any artifact at any time, before or after completion. Intermediate working files are preserved in `artifacts/{story_id}/episodes/episode_{NN}/intermediates/` for stage-by-stage review.

### Why this design

An earlier version of the pipeline interleaved operator gates between each producer and the next stage. Those gates were redundant with the reviewer subagents and put the operator in a continuous-attention role. The autonomous design separates concerns cleanly: **operator owns authorship; agents own production and QA**. The operator's attention is conserved for the touchpoints where their judgment is irreplaceable.

## Artifact Storage

Generated artifacts live in `artifacts/{story_id}/episodes/episode_{NN}/`. Shared and app-specific artifacts are separated by subdirectory:

```
artifacts/{story_id}/episodes/episode_{NN}/
├── episode.yaml                     # Shared (stage 1)
├── transcript.yaml                  # Shared (stage 2)
├── analysis.yaml                    # Shared (stage 3)
├── facilitation.yaml                # Shared (stage 3, enriched by Lens stage 4)
├── intermediates/                   # Pipeline working files (incl. episode_writer_input.yaml)
├── lens/                            # Lens-specific artifacts
│   ├── scaffolding.yaml             # Stage 4
│   └── session.yaml                 # Stage 5
└── reasoning-lab/                   # Reasoning Lab-specific artifacts
    ├── scoring.yaml                 # Stage 4a
    ├── competition-facilitation.yaml # Stage 4a
    └── session.yaml                 # Stage 5a
```

This structure allows both applications to share the same episode and transcript while producing their own downstream artifacts without collision.

## Bootstrap and Initialization

Each application has an initialization script that syncs pipeline commands and agents to `.claude/` so Claude Code can execute them as slash commands.

The initialization script:
1. **Clears** `.claude/commands/` and `.claude/agents/` (prevents leakage between applications)
2. **Copies** shared upstream commands and agents from `framework/pipeline/`
3. **Copies** application-specific commands and agents from `apps/{app-id}/pipeline/`
4. **Verifies** reference data in `framework/reference/`
5. **Verifies** schemas in `framework/schemas/` and `apps/{app-id}/schemas/`
6. **Verifies** the artifacts directory exists

To initialize for a specific application:
```bash
python3 apps/lens/pipeline/initialize_lens.py
# or
python3 apps/reasoning-lab/pipeline/initialize_reasoning_lab.py
```

Each script sources from its own application plus the shared framework. Running one clears and replaces the previous application's commands.

## Path Conventions

All pipeline commands and agent prompts use paths relative to the project root:

| Reference | Path Pattern |
|---|---|
| Framework reference data | `framework/reference/{file}.yaml` |
| Framework schemas | `framework/schemas/{schema}.yaml` |
| Shared agent prompts | `framework/pipeline/agents/{agent}.md` |
| Shared scripts | `framework/pipeline/scripts/{script}.py` |
| App-specific schemas | `apps/{app-id}/schemas/{schema}.yaml` |
| App-specific agent prompts | `apps/{app-id}/pipeline/agents/{agent}.md` |
| Generated artifacts (shared) | `artifacts/{story_id}/episodes/episode_{NN}/{artifact}.yaml` |
| Generated artifacts (app) | `artifacts/{story_id}/episodes/episode_{NN}/{app-id}/{artifact}.yaml` |

No new pipeline file references `configs/` or `registry/` — those are frozen historical reference from the legacy system and are not maintained.
