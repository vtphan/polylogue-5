# System Architecture

How the Polylogue system is organized — the relationship between the conceptual framework, the shared pipeline, and the applications that realize the framework for students.

## Three-Layer Structure

```
┌─────────────────────────────────────────────────────────────┐
│  FRAMEWORK                                                  │
│  Conceptual foundation: lenses, facets, explanatory         │
│  variables, perspectival learning model, story design       │
│                                                             │
│  framework/                                                 │
│  ├── docs/           Conceptual framework, story design,    │
│  │                   pipeline architecture, operator manual │
│  ├── reference/      Source-of-truth data (YAML)            │
│  ├── schemas/        Shared schemas                         │
│  ├── stories/        Story design docs + per-episode drafts │
│  └── pipeline/       Shared agents, commands, scripts       │
└────────────────────────┬────────────────────────────────────┘
                         │ Shared artifacts:
                         │   episode.yaml, transcript.yaml,
                         │   assistive_package.yaml
                         ▼
┌──────────────────────────────┐  ┌───────────────────────────┐
│  APPLICATION: Lens           │  │  APPLICATION: Reasoning Lab│
│                              │  │                           │
│  apps/lens/                  │  │  apps/reasoning-lab/      │
│  ├── docs/                   │  │  ├── docs/                │
│  ├── schemas/                │  │  ├── schemas/             │
│  └── pipeline/               │  │  └── pipeline/            │
│      agents, commands        │  │      agents, commands     │
│                              │  │                           │
│  (app-layer consumption of   │  │  (app-layer consumption   │
│   assistive_package.yaml)    │  │   of assistive_package)   │
└──────────────────────────────┘  └───────────────────────────┘
```

## What Each Layer Contains

### Framework (`framework/`)

The framework is application-agnostic. It defines the theory, the shared data, and the pipeline that all applications depend on.

| Directory | Contents |
|---|---|
| `framework/docs/` | `conceptual-framework.md`, `story-design.md`, `pipeline-architecture.md`, `operator-manual.md`, `system-architecture.md`, `capability-flags.md`, `probe-record-handoff.md` |
| `framework/stories/{story_id}.md` | Story design docs (authored prose with YAML frontmatter) |
| `framework/stories/{story_id}/episode_{NN}.md` | Per-episode drafts (authored prose with YAML frontmatter) |
| `framework/stories/archive/v1/` | Frozen v1-pipeline stories — historical reference, not read by the pipeline |
| `framework/stories/v1-storylines/` | Creative briefs extracted from v1 stories — premise + arc only, live content |
| `framework/stories/validation/` | Gitignored sidecar reports from `validate_story.py` |
| `framework/reference/` | `lenses.yaml`, `facet_inventory.yaml`, `explanatory_variables.yaml` — source-of-truth data; all IDs propagate from here |
| `framework/schemas/` | Shared schemas (`episode_plan.yaml`, `episode_writer_input.yaml`, `transcript.yaml`, etc.) |
| `framework/pipeline/agents/` | Shared agents: planning, validation, dialog writer, transcript ID/reviewer, projection reviewer, story consistency reviewer, analyst, diagnostic, prose, discussion, package reviewer |
| `framework/pipeline/commands/` | Shared commands: `create_episode`, `create_transcript`, `build_assistive_package`, `brainstorm`, `validate_story` |
| `framework/pipeline/scripts/` | `validate_schema.py`, `validate_story.py`, `enumerate_transcript.py`, `review_transcript.py`, `merge_assistive_package.py`, `log_pipeline_event.py`, `initialize_polylogue.py` |

### Applications (`apps/{app-id}/`)

Each application defines how students experience the framework. The universal pipeline ends at `assistive_package.yaml`; anything an app does with it happens in the app layer.

| Directory | Contents |
|---|---|
| `apps/{app-id}/docs/` | Instructional design, game design, pipeline spec |
| `apps/{app-id}/schemas/` | Application-specific artifact schemas |
| `apps/{app-id}/pipeline/` | Application-specific agents and commands |

## Pipeline Flow

Three shared stages, run per episode in order:

```
/create_episode  →  /create_transcript  →  /build_assistive_package
```

See `pipeline-architecture.md` §3.8 for the command table (agents, scripts, outputs per stage) and `operator-manual.md` for the full runbook.

## Operator Role

The **operator** is involved at the *boundaries* of the pipeline, not in the middle. The pipeline is autonomous between operator touchpoints.

### Authorship touchpoints (operator MUST be involved)

| Touchpoint | What the operator does |
|---|---|
| **Story design** (Phase 6) | Authors story design doc and per-episode drafts |
| **Kickoff** (`/create_episode`) | Runs the command — the per-episode draft IS the operator prompt |
| **App finalization** | App-specific session configuration (app-layer, per Rule 12) |

### Autonomous touchpoints (no operator intervention)

The middle commands — `/create_transcript` and `/build_assistive_package` — run end-to-end with autonomous reviewer gates. Each has bounded retry budgets. If exhausted, the command halts and the operator decides: edit and resume, accept as-is, or restart upstream.

### Failure-mode escape hatch

When a command halts, it provides: the latest artifact version, the latest reviewer report, and the intermediates directory. The operator decides the recovery path. See `operator-manual.md` for the re-planning loop.

## Artifact Storage

```
artifacts/{story_id}/episodes/episode_{NN}/
├── episode.yaml                        # Stage 1 (/create_episode)
├── transcript.yaml                     # Stage 2 (/create_transcript)
├── ground_truth_generated.yaml         # Stage 3 (/build_assistive_package)
├── diagnostic_generated.yaml           # Stage 3
├── prose_generated.yaml                # Stage 3
├── discussion_generated.yaml           # Stage 3
├── assistive_package.yaml              # Stage 3 (merged — the runtime artifact)
├── pipeline_log.yaml                   # Audit trail
└── intermediates/
    └── episode_writer_input.yaml       # Barrier-safe projection
```

## Bootstrap

```bash
# Phase 6 authoring only
python3 framework/pipeline/scripts/initialize_polylogue.py

# Full pipeline with an app downstream
python3 framework/pipeline/scripts/initialize_polylogue.py --app lens
```

The script clears `.claude/commands/` and `.claude/agents/`, then syncs shared pipeline files plus (when `--app` is given) app-specific files. Re-run after editing pipeline files or switching applications.

## Path Conventions

| Reference | Path Pattern |
|---|---|
| Framework reference data | `framework/reference/{file}.yaml` |
| Framework schemas | `framework/schemas/{schema}.yaml` |
| Shared agent prompts | `framework/pipeline/agents/{agent}.md` |
| Shared scripts | `framework/pipeline/scripts/{script}.py` |
| App-specific artifacts | `apps/{app-id}/pipeline/` |
| Generated artifacts | `artifacts/{story_id}/episodes/episode_{NN}/` |

No pipeline file references `configs/` or `registry/` — those are frozen historical reference from the legacy system.
