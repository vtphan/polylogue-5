# System Architecture

This document describes how the Polylogue system is organized — the relationship between the conceptual framework, the shared pipeline, and the applications that realize the framework for students.

## Three-Layer Structure

```
┌─────────────────────────────────────────────────────────────┐
│  FRAMEWORK                                                  │
│  Conceptual foundation: lenses, facets, explanatory         │
│  variables, perspectival learning model, scenario sequence   │
│                                                             │
│  framework/                                                 │
│  ├── docs/           Conceptual framework, scenario sequence│
│  ├── reference/      Source-of-truth data (YAML)            │
│  ├── schemas/        Shared upstream schemas                │
│  └── pipeline/       Shared upstream agents, commands,      │
│                      scripts (stages 1–3)                   │
└────────────────────────┬────────────────────────────────────┘
                         │ Shared artifacts:
                         │   scenario.yaml, transcript.yaml,
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
| `framework/docs/` | `conceptual-framework.md`, `scenario-sequence.md`, this file | Theory and shared design |
| `framework/reference/` | `lenses.yaml`, `facet_inventory.yaml`, `explanatory_variables.yaml` | Source-of-truth data. All IDs propagate from here. |
| `framework/schemas/` | 10 schemas (3 reference + 7 upstream pipeline) | Contracts for shared artifacts |
| `framework/pipeline/agents/` | 7 agent prompts (planning, validation, dialog writer, transcript ID, transcript reviewer, evaluator, analysis reviewer) | Shared upstream agents |
| `framework/pipeline/commands/` | 4 commands (`create_scenario`, `brainstorm`, `create_transcript`, `analyze_transcript`) | Shared upstream commands |
| `framework/pipeline/scripts/` | 4 scripts (enumerate, review, strip, validate_schema) | Shared upstream scripts |

### Applications (`apps/{app-id}/`)

Each application defines how students experience the framework. An application has two parts: a pipeline that generates app-specific artifacts, and an app that consumes all artifacts at runtime.

| Directory | Contents | Purpose |
|---|---|---|
| `apps/{app-id}/docs/` | Instructional design, pipeline spec, app design, game design | Application-specific documentation |
| `apps/{app-id}/schemas/` | Application-specific artifact schemas | Contracts for app-specific artifacts |
| `apps/{app-id}/pipeline/agents/` | Application-specific agent prompts | Agents for downstream stages |
| `apps/{app-id}/pipeline/commands/` | Application-specific commands | Commands for downstream stages |

## Pipeline Flow

The pipeline runs in two phases: shared upstream (stages 1–3) and application-specific downstream (stages 4–5).

### Shared Upstream Pipeline (Framework)

All applications share these stages. Run once per scenario.

```
/create_scenario  →  /create_transcript  →  /analyze_transcript
       ↓                     ↓                      ↓
  scenario.yaml        transcript.yaml         analysis.yaml
                                               facilitation.yaml
```

| Stage | Command | Agents | Output |
|---|---|---|---|
| 1. Create Scenario | `/create_scenario` | Planning agent, validation agent | `scenario.yaml` |
| 2. Create Transcript | `/create_transcript` | Dialog writer, transcript ID, transcript reviewer | `transcript.yaml` |
| 3. Analyze Transcript | `/analyze_transcript` | Evaluator, analysis reviewer | `analysis.yaml`, `facilitation.yaml` |

### Application-Specific Downstream Pipeline

Run once per scenario per application. Consumes shared artifacts and produces app-specific artifacts.

**Lens (stages 4–5):**

```
/design_scaffolding  →  /configure_session
        ↓                       ↓
  scaffolding.yaml         session.yaml
  facilitation.yaml (enriched)
```

| Stage | Command | Agents | Output |
|---|---|---|---|
| 4. Design Scaffolding | `/design_scaffolding` | Scaffolding ID, scaffolding reviewer | `scaffolding.yaml`, enriched `facilitation.yaml` |
| 5. Configure Session | `/configure_session` | (script) | `session.yaml` |

**Reasoning Lab (stages 4a–5a):**

```
/design_scoring_rubric  →  /configure_competition
        ↓                          ↓
  scoring.yaml                session.yaml
  competition-facilitation.yaml
```

| Stage | Command | Agents | Output |
|---|---|---|---|
| 4a. Design Scoring Rubric | `/design_scoring_rubric` | Scoring rubric agent | `scoring.yaml`, `competition-facilitation.yaml` |
| 5a. Configure Competition | `/configure_competition` | (script) | `session.yaml` |

## Operator Role

The **operator** (a human running these slash commands inside Claude Code) is involved at the *boundaries* of the pipeline, not in the middle of it. The pipeline is autonomous between operator touchpoints — agents produce artifacts, reviewer subagents gate them, and the operator's attention is conserved for decisions only a human can make.

### Authorship touchpoints (operator MUST be involved)

| Touchpoint | What the operator does |
|---|---|
| **Brainstorm** (`/brainstorm`) | Co-designs the 6-field operator prompt with Claude — explores topic, pedagogical intent, target facets |
| **Kickoff** (`/create_scenario`) | Provides the validated 6-field prompt as input |
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
- A pointer to `artifacts/{scenario_id}/intermediates/` for stage-by-stage debugging

The operator then decides:
- **Edit and resume** — manually adjust the failing artifact and re-run downstream commands
- **Accept as-is** — save the latest version and proceed despite reviewer concerns
- **Restart upstream** — return to an earlier stage (e.g., `/create_scenario`) if the failure indicates a structural problem with the input

### Inspection (optional, anytime)

Everything in `artifacts/{scenario_id}/` is YAML on disk. The operator can inspect any artifact at any time, before or after completion. Intermediate working files are preserved in `artifacts/{scenario_id}/intermediates/` for stage-by-stage review.

### Why this design

An earlier version of the pipeline interleaved operator gates between each producer and the next stage. Those gates were redundant with the reviewer subagents and put the operator in a continuous-attention role. The autonomous design separates concerns cleanly: **operator owns authorship; agents own production and QA**. The operator's attention is conserved for the touchpoints where their judgment is irreplaceable.

## Artifact Storage

Generated artifacts live in `artifacts/{scenario_id}/`. Shared and app-specific artifacts are separated by subdirectory:

```
artifacts/{scenario_id}/
├── scenario.yaml                    # Shared (stage 1)
├── transcript.yaml                  # Shared (stage 2)
├── analysis.yaml                    # Shared (stage 3)
├── facilitation.yaml                # Shared (stage 3, enriched by Lens stage 4)
├── intermediates/                   # Pipeline working files
├── lens/                            # Lens-specific artifacts
│   ├── scaffolding.yaml             # Stage 4
│   └── session.yaml                 # Stage 5
└── reasoning-lab/                   # Reasoning Lab-specific artifacts
    ├── scoring.yaml                 # Stage 4a
    ├── competition-facilitation.yaml # Stage 4a
    └── session.yaml                 # Stage 5a
```

This structure allows both applications to share the same scenario and transcript while producing their own downstream artifacts without collision.

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
| Generated artifacts (shared) | `artifacts/{scenario_id}/{artifact}.yaml` |
| Generated artifacts (app) | `artifacts/{scenario_id}/{app-id}/{artifact}.yaml` |

No pipeline file should reference `configs/`. The `configs/` directory is the legacy system and will be retired after migration.
