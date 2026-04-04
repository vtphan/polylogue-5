# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Polylogue 5 is a research project for teaching critical thinking to middle school students (grades 6-8) through evaluation of AI-generated group discussions. It consists of a **generation pipeline** (this repo, built first) and a **Lens app** (built separately after the pipeline).

Students examine scripted discussions through three lenses (Logic, Evidence, Scope), articulating what they see and considering why characters reasoned the way they did — using cognitive patterns and social dynamics as explanatory tools. A hidden structural layer — **facets** — connects lenses to explanatory variables but is never shown to students.

## Architecture

The pipeline takes an operator prompt (6 named fields: topic, context, instructional goals, target complexity, target facets with signal mechanisms, and discussion dynamic) as input and produces 6 YAML artifacts per scenario through 5 stages orchestrated by Claude Code slash commands:

```
create_scenario → create_transcript → analyze_transcript → design_scaffolding → configure_session
```

### Directory Structure

```
configs/
├── reference/          # Source-of-truth data files (lenses, facets, explanatory variables) + schemas
├── scenario/           # create_scenario command, planning + validation agents
├── transcript/         # create_transcript command, dialog writer + transcript ID agents
├── analysis/           # analyze_transcript command, evaluator agent
├── scaffolding/        # design_scaffolding command, scaffolding ID agent
├── session/            # configure_session command
├── system/             # initialize_polylogue command, sync script
└── shared/             # Cross-cutting scripts (validate_schema, etc.)
registry/               # Generated outputs: registry/{scenario_id}/ per scenario
docs/                   # Design documents (conceptual framework, specs, user stories)
references/             # External reference materials (PBL curriculum docs)
```

### Key Design Documents

- `docs/polylogue-v5-6.md` — Conceptual framework + facet inventory (lenses, facets, explanatory variables, perspectival learning model, 10 facets, coverage tables)
- `docs/pipeline-spec.md` — Technical specification (6 artifacts, 5 stages, 9 agents, 13 schemas)
- `docs/pipeline-alignment-plan.md` — v5-5 → v5-6 alignment tracking (schemas, agents, commands)

### Pipeline Artifacts (per scenario)

| Artifact | File | Consumer |
|---|---|---|
| Scenario plan | `scenario.yaml` | Pipeline only |
| Discussion transcript | `transcript.yaml` | App (student-facing) |
| Expert analysis | `analysis.yaml` | App (AI perspective, unified) |
| Facilitation guide | `facilitation.yaml` | Teacher (includes whole-class debrief) |
| Scaffolding materials | `scaffolding.yaml` | App (hints, rubrics, misreading redirects) |
| Session configuration | `session.yaml` | App (session setup) |

### 9 Pipeline Agents

1. **Planning agent** — Translates facet targets into natural-language persona descriptions
2. **Validation agent** — Checks facet detectability, barrier compliance, anti-patterns, signal mechanism fidelity
3. **Dialog writer** — Operates behind the information barrier; sees only character traits, not framework
4. **Transcript instructional designer** — Refines signal clarity without adding/removing content
5. **Evaluator** — Produces analysis + facilitation guide (including whole-class debrief); writes AI perspectives as perspectives, not verdicts
6. **Scaffolding instructional designer** — Produces scaffolding (including common misreading redirects) + enriches facilitation guide
7. **Transcript reviewer** — Reviews transcript quality: naturalness, facet signal subtlety, barrier integrity, persona voices
8. **Analysis reviewer** — Reviews analysis accuracy: facet annotations, unified AI perspective, diversity metadata, facilitation guide
9. **Scaffolding reviewer** — Reviews scaffolding calibration: hint specificity, rubric differentiation, misreading plausibility, cross-artifact coherence

## Critical Design Constraints

### Information Barrier
The dialog writer must never see facet IDs, lens names, cognitive patterns, or social dynamics. The `target_facets` and `discussion_dynamic` fields are stripped from the scenario plan before passing to the dialog writer. The `weaknesses` and `accomplishes` fields use natural language only.

### Discussion Constraints
- 10-14 turns, 1-3 sentences per turn, <400 words total
- Natural 6th-grade language with distinct persona voices
- Personas must have genuine disagreement
- Readable in 3 minutes

### AI Perspective (Unified)
The expert analysis has a single integrated AI perspective block per passage — per-lens observations combined with an explanation of why the characters may have reasoned this way. Written as perspective, not verdict. The AI perspective is the final entry in the unified scaffold sequence.

### Unified Scaffold Sequence
Each passage has a graduated scaffold sequence: one or more hints (each costing a lifeline) followed by the AI perspective (free after group submits assessment). Hints direct attention to *where* to look, not *what* to see. Rubrics have three differentiation levels per entry.

## Conventions

- **All artifacts are YAML.** Schemas are descriptive YAML (human-readable contracts).
- **Canonical IDs use snake_case.** All IDs propagate from `configs/reference/` into every schema, prompt, and artifact.
- **Reference data files are the source of truth** — not schema definitions. Schemas describe structure.
- **Python scripts** use pure Python + PyYAML. Scripts accept file paths as arguments, no hardcoded paths.
- **Implementation is phased:** Foundation → Schemas → Agent Prompts → Commands → Review → End-to-End Run → Scripts

### Canonical IDs

- Lenses (3): `logic`, `evidence`, `scope`
- Facets (10): `source_credibility`, `source_diversity`, `relevance`, `sufficiency`, `inferential_validity`, `internal_consistency`, `reasoning_completeness`, `perspective_engagement`, `consequence_consideration`, `condition_sensitivity`
- Cognitive patterns (8): `confirmation_bias`, `tunnel_vision`, `overgeneralization`, `false_cause`, `uncritical_acceptance`, `black_and_white_thinking`, `egocentric_thinking`, `false_certainty`
- Social dynamics (3): `group_pressure`, `conflict_avoidance`, `authority_deference`

## Session Structure

One integrated flow with a per-passage state machine. No phase separation between evaluation and explanation — students articulate what they see and consider why in one response.

```
Per passage (asynchronous, ordered easy → hard):
  DIAGNOSE → DISCUSS → REVIEWING AI → SUBMIT ASSESSMENT
  (individual)  (group)    (via lifeline     (group, revisable)
                            or free after
                            assessment)
```

Four sources of perspective in sequence: Individual → Peer → AI voice → Teacher (whole-class debrief).

- Students write diagnoses (individual), discuss and produce assessments (group), engage with AI perspective, revise as needed
- Chat-style interaction: messages in a thread, no editing, append to update
- Teacher role is minimal during session; leads whole-class debrief at the end
- Target audience: 6th graders, 50-minute class period, 2-4 students per group (minimum 2)

## Lens App

The app (to be built separately) consumes pipeline artifacts. Tech stack: Next.js (App Router) + SQLite/Prisma + TypeScript + shadcn/ui + Tailwind.

Three roles: Researcher (admin, framework explorer, scenario import), Teacher (class/session management, monitoring, facilitation), Student (tablet, touch-first, gamified dashboard).

App design document to be written against v5-6 framework. See `docs/archived/app-design-v5-5.md` for the prior version.
