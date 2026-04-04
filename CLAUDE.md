# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Polylogue is a research project for teaching critical thinking to middle school students (grades 6-8). The system has three layers:

1. **Conceptual framework** (`framework/`) — The application-agnostic theory: three evaluative lenses (Logic, Evidence, Scope), a hidden structural layer of ten facets, two explanatory variables (cognitive patterns, social dynamics), and a perspectival learning model.

2. **Applications** (`apps/{app-id}/`) — Each application realizes the framework through a specific student experience. Each has:
   - **(a) A Claude Code pipeline** that generates artifacts (YAML files) from operator prompts
   - **(b) A student-facing / teacher-facing app** that consumes the generated artifacts at runtime

3. **Scenario sequence** (`framework/docs/scenario-sequence.md`) — Shared progression design: which facets, cognitive patterns, and social dynamics to introduce across scenarios.

For the full architecture, see `framework/docs/system-architecture.md`.

### Applications

| Application | Status | Description |
|---|---|---|
| **Lens** | Pipeline complete, app not yet built | Students read AI-generated discussions and evaluate passages through lenses. Reflective, writing-centered. |
| **Reasoning Lab** | Pipeline complete, experimental | Forensic investigation metaphor with competitive scoring. Teams use scanner tools (lenses); rare findings score triple. |

Lens is the priority. Reasoning Lab is experimental.

## System Structure

```
framework/
├── docs/                    # Conceptual framework, scenario sequence, system architecture
├── reference/               # Source-of-truth data (lenses, facets, explanatory variables)
├── schemas/                 # Shared upstream schemas (10 files)
└── pipeline/                # Shared upstream pipeline (stages 1–3)
    ├── agents/              # 7 agents (planning, validation, dialog writer, etc.)
    ├── commands/            # 4 commands (create_scenario, brainstorm, create_transcript, analyze_transcript)
    └── scripts/             # 4 scripts (enumerate, review, strip, validate_schema)

apps/lens/
├── docs/                    # Instructional design, pipeline spec
├── schemas/                 # Lens-specific schemas (3: scaffolding, session, student_annotations)
├── pipeline/
│   ├── agents/              # 2 agents (scaffolding_id, scaffolding_reviewer)
│   ├── commands/            # 2 commands (design_scaffolding, configure_session)
│   └── initialize_lens.py   # Bootstrap: clears .claude/, syncs shared + Lens pipeline
└── RUNNING.md               # Step-by-step runbook

apps/reasoning-lab/
├── docs/                    # Game design
├── schemas/                 # Reasoning Lab schemas (3: scoring, competition_facilitation, session)
├── pipeline/
│   ├── agents/              # 1 agent (scoring_rubric_agent)
│   ├── commands/            # 2 commands (design_scoring_rubric, configure_competition)
│   └── initialize_reasoning_lab.py
└── RUNNING.md               # Step-by-step runbook

registry/                    # Generated artifacts per scenario
configs/                     # Legacy system (operational, preserved until migration verified)
docs/                        # Legacy design documents
```

## Pipeline Flow

Shared upstream (stages 1–3), then app-specific downstream:

```
SHARED:  /create_scenario → /create_transcript → /analyze_transcript
                                                        |
         ┌──────────────────────────────────────────────┤
         ↓                                              ↓
LENS:    /design_scaffolding → /configure_session    REASONING LAB:
                                                     /design_scoring_rubric → /configure_competition
```

## Artifact Storage

```
registry/{scenario_id}/
├── scenario.yaml              # Shared (stage 1)
├── transcript.yaml            # Shared (stage 2)
├── analysis.yaml              # Shared (stage 3)
├── facilitation.yaml          # Shared (stage 3)
├── intermediates/             # Pipeline working files
├── lens/                      # Lens-specific artifacts
│   ├── scaffolding.yaml
│   ├── facilitation.yaml      # Enriched version
│   └── session.yaml
└── reasoning-lab/             # Reasoning Lab-specific artifacts
    ├── scoring.yaml
    ├── competition-facilitation.yaml
    └── session.yaml
```

## Bootstrapping

Before running slash commands, initialize for the target application:

```bash
python3 apps/lens/pipeline/initialize_lens.py
# or
python3 apps/reasoning-lab/pipeline/initialize_reasoning_lab.py
```

Each script clears `.claude/commands/` and `.claude/agents/` (preventing cross-app leakage), then syncs shared commands/agents from `framework/pipeline/` plus app-specific commands/agents. `.claude/commands/` and `.claude/agents/` are gitignored.

## Legacy System

The original system (`configs/`, `docs/`) is preserved and operational. **Do not move, rename, or delete these directories until the new system produces identical Lens artifacts.**

- `configs/initialize_polylogue.py` — Legacy bootstrap (sources from `configs/`)
- `docs/polylogue-v5-6.md` — Monolithic source document (now decomposed into `framework/docs/` + `apps/lens/docs/`)
- `docs/pipeline-spec.md` — Full pipeline spec (copied to `apps/lens/docs/`)

## Critical Design Constraints

### Information Barrier
The dialog writer must never see facet IDs, lens names, cognitive patterns, or social dynamics. The `target_facets` and `discussion_dynamic` fields are stripped from the scenario plan before passing to the dialog writer.

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
- **No pipeline file references `configs/`.** The new system uses `framework/` and `apps/{app-id}/` paths exclusively.

### Canonical IDs

- Lenses (3): `logic`, `evidence`, `scope`
- Facets (10): `source_credibility`, `source_diversity`, `relevance`, `sufficiency`, `inferential_validity`, `internal_consistency`, `reasoning_completeness`, `perspective_engagement`, `consequence_consideration`, `condition_sensitivity`
- Cognitive patterns (8): `confirmation_bias`, `tunnel_vision`, `overgeneralization`, `false_cause`, `uncritical_acceptance`, `black_and_white_thinking`, `egocentric_thinking`, `false_certainty`
- Social dynamics (3): `group_pressure`, `conflict_avoidance`, `authority_deference`
