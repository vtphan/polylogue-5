# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **Primary focus (2026-04-18).** `simplified-framework/` is the only active framework in this repository. Repo-root `.claude/` is the canonical command sync target. Older roots live under `legacy/` as reference context only.

## Project Overview

Polylogue is a research project for teaching critical thinking to middle school students (grades 6–8).

The active implementation is `simplified-framework/`: one student-facing conceptual layer built around reasoning flaws, with a deterministic runtime and no student-time LLM calls.

Older shared-framework and app-specific roots are retained under `legacy/` as historical reference only.

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
cd ~/Development/polylogue-5
python3 simplified-framework/pipeline/scripts/initialize_polylogue.py
```

This clears repo-root `.claude/commands/` and `.claude/agents/` and installs the simplified command set: `create_story`, `create_episodes`, `create_transcript`, `create_lesson_package`.

If you are already inside `simplified-framework/`, pass the repo root explicitly:

```bash
python3 pipeline/scripts/initialize_polylogue.py --project-root ~/Development/polylogue-5
```

### Simplified Validators

```bash
python3 simplified-framework/pipeline/scripts/validate_story.py          <path-to-story.yaml>
python3 simplified-framework/pipeline/scripts/validate_episode_plan.py   <path-to-episode-plan.yaml>
python3 simplified-framework/pipeline/scripts/validate_transcript.py     <path-to-transcript.yaml>
python3 simplified-framework/pipeline/scripts/validate_flaw_proposals.py <path-to-flaw-proposals.yaml>
python3 simplified-framework/pipeline/scripts/validate_lesson_package.py <path-to-lesson_package.yaml>
python3 simplified-framework/pipeline/scripts/validate_practice_package.py <path-to-practice_package.yaml>
```

---

## Legacy Material

Older shared-framework, app-specific, and archived roots live under `legacy/`. They are not part of the active simplified-framework workflow and should not be treated as current source of truth.

---

## Conventions

- **All artifacts are YAML.** Schemas are descriptive YAML (human-readable contracts).
- **Canonical IDs use snake_case.** IDs propagate from `simplified-framework/reference/flaw-taxonomy.yaml` into every schema, prompt, and artifact.
- **Reference data files are the source of truth** — not schema definitions, not docs.
- **Python scripts** use pure Python + PyYAML. Scripts accept file paths as arguments; no hardcoded paths.
- **Simplified directory key:** `{story_id}/{episode_id}/`. Package filename: `lesson_package.yaml`.
- **No new active pipeline file should depend on legacy roots outside `simplified-framework/`.**
