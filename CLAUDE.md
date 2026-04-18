# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **Primary focus (2026-04-16).** `simplified-framework/` is the active area of work. The older shared `framework/`, `apps/`, `lens-app/`, and `artifacts/` are reference context unless a task explicitly targets them. When a request is ambiguous and touches multiple framework variants, default to the simplified framework.

## Project Overview

Polylogue is a research project for teaching critical thinking to middle school students (grades 6–8). Two frameworks currently coexist in the repo:

1. **Simplified framework (primary, active)** — `simplified-framework/`. One student-facing conceptual layer: reasoning flaws, expressed in plain language. Each episode primarily teaches one main flaw. Runtime is deterministic; the app does not call an LLM at student-use time.

2. **Shared framework (reference, older)** — `framework/`, `apps/{lens,reasoning-lab}/`, `lens-app/`, `artifacts/`. Three-lens / ten-facet model with the v2 pipeline producing `assistive_package.yaml` per episode. Retained for reference; not the default for new work.

---

## Simplified Framework (primary)

### Canonical Docs

Active documentation set lives in `simplified-framework/docs/`:

| Document | Purpose |
|---|---|
| `instructional-design.md` | Conceptual framework, student journey, pedagogical mechanics, authoring surface |
| `tech-reference.md` | Stack, directory map, Prisma direction, artifact → runtime contract, reader flow, change notes |
| `operator-workflow.md` | Human-in-the-loop workflow and review cadence |

Archived material lives in `simplified-framework/docs/archived/` (including the former `framework-model.md`, `app-design.md`, and `technical-spec.md`). Do not treat archived docs as current source of truth.

### Source-Of-Truth Precedence

1. Validators in `simplified-framework/pipeline/scripts/`
2. Zod schemas in `simplified-framework/app/src/lib/domain.ts`
3. Artifact files under `simplified-framework/stories/` and `simplified-framework/artifacts/`
4. Prisma schema in `simplified-framework/app/prisma/schema.prisma`
5. `simplified-framework/reference/flaw-taxonomy.yaml`
6. `simplified-framework/docs/tech-reference.md` and `instructional-design.md`
7. Schema sketches in `simplified-framework/schemas/`

If prose in a doc drifts from a validator, the validator wins.

### Student-Facing Flaw Set

Canonical IDs from `simplified-framework/reference/flaw-taxonomy.yaml`:

- `jumping_to_a_conclusion` (student label: "jumping to a conclusion")
- `not_enough_evidence` ("not enough evidence")
- `ignoring_another_perspective` ("ignoring another perspective")
- `trusting_a_source_too_quickly` ("trusting a source too quickly")
- `missing_important_conditions_or_consequences` ("missing important conditions or consequences")

Amplification levels per flaw moment: `unmistakable`, `showcased`, `heightened`.

### Pipeline Flow

```
STORY (once per story):
  simplified-framework/stories/{story_id}/story.yaml

EPISODE (per episode in the story):
  story.yaml
    → episode-plan.yaml
    → transcript.yaml
    → flaw-review.md            (operator acceptance gate)
    → lesson_package.yaml       (only after transcript acceptance)
```

Working principles (from `instructional-design.md` and `tech-reference.md`):

- each episode primarily teaches one main flaw; supporting flaws are used sparingly
- transcripts are source dialogue, not analytic containers — no per-turn flaw labels, no answer keys
- `lesson_package.yaml` is the deterministic, app-facing teaching artifact
- do **not** generate `lesson_package.yaml` until the transcript has been accepted
- v2 lesson packages carry exactly 3 inline quizzes; practice is authored separately in `practice_package.yaml`

### Artifact Storage

```
simplified-framework/
  stories/{story_id}/story.yaml
  artifacts/{story_id}/{episode_id}/
    episode-plan.yaml
    transcript.yaml
    flaw-review.md
    lesson_package.yaml
  reference/flaw-taxonomy.yaml
  schemas/*.yaml
  pipeline/scripts/validate_*.py
  pipeline/commands/*.md
  pipeline/agents/*.md
```

### Dedicated App (simplified-framework/app/)

The app is implemented (Next.js + React + TypeScript, SQLite + Prisma). For current behavior, consult the code and the canonical docs rather than this summary.

- Student journey, teaching mechanics, engagement rules, and the authoring surface live in `simplified-framework/docs/instructional-design.md`.
- Stack, directory map, Prisma direction, scene-reader flow, and artifact contracts live in `simplified-framework/docs/tech-reference.md`.

Load-bearing runtime invariants:

- **No real-time LLM.** Rendering is deterministic from `transcript.yaml`, `lesson_package.yaml`, the active config, and Prisma state.
- **Grading uses `feedback.correct.option_ids`**, not `best_answer_id`.
- **Finished is not frozen.** `reading_finished_at` marks the milestone, but a finished run remains open for untried quizzes and review.
- **Restrained engagement only.** Episode-local stars plus a single bonus star; no points, streaks, timers, leaderboards, cumulative totals, or public rankings.

### Bootstrapping Simplified

```bash
python3 simplified-framework/pipeline/scripts/initialize_polylogue.py
```

This clears `.claude/commands/` and `.claude/agents/` and installs the simplified command set: `create_story`, `create_episodes`, `create_transcript`, `create_lesson_package`.

### Simplified Validators

```bash
python3 simplified-framework/pipeline/scripts/validate_story.py          <path-to-story.yaml>
python3 simplified-framework/pipeline/scripts/validate_episode_plan.py   <path-to-episode-plan.yaml>
python3 simplified-framework/pipeline/scripts/validate_transcript.py     <path-to-transcript.yaml>
python3 simplified-framework/pipeline/scripts/validate_lesson_package.py <path-to-lesson_package.yaml>
python3 simplified-framework/pipeline/scripts/validate_practice_package.py <path-to-practice_package.yaml>
```

---

## Shared Framework (reference context)

The older shared system still lives in the tree:

- `framework/` — shared pipeline, docs, reference data, schemas
- `apps/{lens,reasoning-lab}/` — app-specific docs, schemas, optional post-pipeline commands
- `apps/artifacts-viewer/` — small Next.js viewer for framework artifacts
- `lens-app/` — current Lens Next.js runtime app (not to be confused with the simplified-framework dedicated app)
- `artifacts/{story_id}/episodes/episode_{NN}/` — shared-pipeline outputs
- `legacy/` — archived pre-v2 disposable-persona material

### Shared Pipeline Flow

```
STORY (once per story, authored):
  framework/stories/{story_id}.md                     (design doc + frontmatter)
  framework/stories/{story_id}/episode_{NN}.md        (per-episode drafts)
  Review gate: /validate_story

EPISODE (per episode):
  /create_episode → /create_transcript → /build_assistive_package
  (episode plan)    (discussion script)   (analyst → diagnostic →
                                           prose → discussion →
                                           reviewer → merge)

OUTPUTS:
  artifacts/{story_id}/episodes/episode_{NN}/
    episode.yaml, transcript.yaml,
    ground_truth_generated.yaml, diagnostic_generated.yaml,
    prose_generated.yaml, discussion_generated.yaml,
    assistive_package.yaml, pipeline_log.yaml,
    intermediates/episode_writer_input.yaml
```

### Shared Framework Bootstrapping

```bash
# Shared pipeline only
python3 framework/pipeline/scripts/initialize_polylogue.py

# Shared pipeline + app-specific commands
python3 framework/pipeline/scripts/initialize_polylogue.py --app lens
python3 framework/pipeline/scripts/initialize_polylogue.py --app reasoning-lab
```

Shared commands: `brainstorm_story`, `brainstorm_episode`, `validate_story`, `create_episode`, `create_transcript`, `build_assistive_package`. `.claude/commands/` and `.claude/agents/` are gitignored and are cleared by any initializer, so the two pipelines do not coexist — switch by re-running the appropriate initializer.

### Shared Framework Design Constraints

**Information barrier.** `dialog_writer` must never see facet IDs, lens names, cognitive patterns, or social dynamics. `planning_agent` writes both `episode.yaml` (framework-visible, reviewer-facing) and `episode_writer_input.yaml` (barrier-safe projection). `dialog_writer` runs in a fresh context with no Read tool and consumes the projection inline. Enforcement: literal scan in `validate_schema.py` + `projection_reviewer` agent. Neither alone is sufficient.

**Discussion constraints.** 10–14 turns, 1–3 sentences per turn, <400 words total, natural 6th-grade language with distinct persona voices, genuine disagreement, readable in 3 minutes.

**AI perspective (unified).** Single integrated AI perspective block per passage — per-lens observations combined with an explanation of why characters reasoned this way. Written as perspective, not verdict.

**Unified scaffold sequence (Lens).** Graduated hints → AI perspective as final entry. Hints cost lifelines; AI perspective is free after assessment.

### Shared Framework Canonical IDs

Used only in the shared pipeline; not present in the simplified framework.

- Lenses (3): `logic`, `evidence`, `scope`
- Facets (10): `source_credibility`, `source_diversity`, `relevance`, `sufficiency`, `inferential_validity`, `internal_consistency`, `reasoning_completeness`, `perspective_engagement`, `consequence_consideration`, `condition_sensitivity`
- Cognitive patterns (8): `confirmation_bias`, `tunnel_vision`, `overgeneralization`, `false_cause`, `uncritical_acceptance`, `black_and_white_thinking`, `egocentric_thinking`, `false_certainty`
- Social dynamics (3): `group_pressure`, `conflict_avoidance`, `authority_deference`

### V1 Archive Policy (shared framework)

`framework/stories/archive/v1/` and `artifacts/archive/v1/` hold frozen v1-pipeline content. The pipeline does not read from these paths. `validate_story.py` rejects `archive` and `validation` as story IDs. When evolving a v1 story's premise, extract a creative brief into `framework/stories/v1-storylines/` and author a new story under a new story ID.

---

## Legacy System

The pre-v2 disposable-persona system (`legacy/configs/`, `legacy/docs/`, `legacy/registry/`) is retained only as historical reference. No new pipeline file should reference `legacy/configs/` or `legacy/registry/`.

---

## Conventions

- **All artifacts are YAML.** Schemas are descriptive YAML (human-readable contracts).
- **Canonical IDs use snake_case.** IDs propagate from reference files into every schema, prompt, and artifact — from `simplified-framework/reference/flaw-taxonomy.yaml` in the simplified framework, and from `framework/reference/` in the shared framework.
- **Reference data files are the source of truth** — not schema definitions, not docs.
- **Python scripts** use pure Python + PyYAML. Scripts accept file paths as arguments; no hardcoded paths.
- **Simplified directory key:** `{story_id}/{episode_id}/`. Package filename: `lesson_package.yaml`.
- **Shared directory key:** `{story_id}/episodes/episode_{NN}/`. Plan filename: `episode.yaml`.
- **No new pipeline file references `legacy/configs/` or `legacy/registry/`.**
