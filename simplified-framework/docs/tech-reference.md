# Tech Reference

This document is the primary technical reference for the v2 simplified-framework app and pipeline contract.

For pedagogy and student-facing design, see `instructional-design.md`.

## 1. Stack

- Next.js App Router + React + TypeScript
- SQLite via Prisma
- Zod for runtime schema validation
- YAML artifacts for authored content

Runtime constraint: no student-time LLM calls. Rendering and grading are deterministic from artifacts plus database state.

## 2. Directory Map

```text
simplified-framework/
  app/
    prisma/schema.prisma
    src/
      app/
      lib/
  stories/{story_id}/story.yaml
  artifacts/
    practice/practice_package.yaml
    {story_id}/{episode_id}/
      episode-plan.yaml
      transcript.yaml
      flaw-review.md
      lesson_package.yaml
  reference/flaw-taxonomy.yaml
  schemas/*.yaml
  pipeline/commands/*.md
  pipeline/agents/*.md
  pipeline/scripts/validate_*.py
```

## 3. Runtime Model

The v2 app has two student-facing modes:

1. `practice`
2. `read a story`

Identity is device-local and selected before the home screen. Story mode stays locked until the active student has completed all 5 practice exercises once.

## 4. Prisma Direction

The v2 data model is centered on student-local progress rather than v1 phase progression.

Key entities:

- `Student`
- catalog rows for story/episode discovery
- `Run` for one persistent `(student, episode)` reader run
- `PracticeAttempt` for per-flaw practice completion

Load-bearing v2 run fields:

- scene position
- per-quiz attempt state
- per-quiz hint state
- earned stars
- `reading_finished_at`
- `bonus_earned_at`

The old terminal-completion latch is retired. A finished run is still open for untried quizzes and review.

## 5. Artifact → Runtime Contract

### 5.1 `practice_package.yaml`

Shared tutorial artifact.

- one exercise per canonical flaw
- validated by `validate_practice_package.py`
- not tied to any story

### 5.2 `transcript.yaml`

Required top-level fields:

- `story_id`
- `episode_id`
- `title`
- `characters`
- `scenes`

Rules:

- `scenes[]` length is at least 3
- each scene has `scene_id`, `summary`, `turns[]`
- turn ids are globally unique and strictly increasing
- turns may be `kind: dialog` or `kind: action`

Readability contract:

- `scenes[].summary` is in hard-error scope
- scene-level dialog readability is warning-only
- action turns are excluded from transcript FK aggregation

### 5.3 `lesson_package.yaml`

Required top-level fields:

- `package_meta`
- `episode`
- `levels`

Rules:

- `package_meta.schema_version = simplified_v2`
- `episode.summary` required
- `episode.previously` required on episode 2+, forbidden on episode 1
- `levels[]` length is exactly 3
- every level carries canonical `focus_flaw`
- no `warmups`
- no `student_intro`
- no two levels may resolve to turns in the same scene
- levels must target dialog turns, not action turns

The runtime grades with `feedback.correct.option_ids`, not `best_answer_id`.
`feedback.correct.text` is a plain string, and `feedback.by_option.{option_id}` maps each wrong option id directly to a plain string.

### 5.4 `episode-plan.yaml`

Planning artifact only.

Rules:

- every `flaws[]` entry carries `focus_flaw`, `amplification`, and `scene_id`
- the primary flaw has exactly 3 quiz-worthy moments
- exactly one each at `unmistakable`, `showcased`, `heightened`
- those 3 moments occupy distinct scenes

## 6. Reader Flow

The v2 reader is scene-based.

Routes conceptually map to:

1. home
2. practice picker / exercise
3. story picker
4. `/runs/[runId]/scene/0` for orientation
5. `/runs/[runId]/scene/[n]` for scenes
6. `/runs/[runId]/complete` for recap

There is no v2 `read`, `warmup`, or `level` phase machine.

## 7. Quiz Mechanics

Each story episode has exactly 3 inline quizzes.

Rules:

- one flagged quiz turn per scene maximum
- 2 attempts maximum per quiz
- 1 optional hint before final submission
- attempted quizzes lock and become reviewable
- untried quizzes remain live on re-entry

Star scoring:

- 3 / 2 / 1 / 0 by hint-use and extra-attempt cost
- 9 stars across the 3 quizzes
- 10th bonus star on reaching 9/9

## 8. Pipeline Contract

Authoring flow:

1. `create_story`
2. `create_episodes`
3. `create_transcript`
4. operator review of `flaw-review.md`
5. `create_lesson_package`

Transcript generation is split:

1. `screenwriter` writes from a stripped projection of the plan
2. `flaw_injector` revises the draft against the full flaw-bearing plan
3. `flaw_reviewer` checks amplification fit, distinct-scene quiz readiness, and promptability

The screenwriter projection is ephemeral and not written to disk.

## 9. Validation Commands

```bash
python3 simplified-framework/pipeline/scripts/validate_story.py <story.yaml>
python3 simplified-framework/pipeline/scripts/validate_episode_plan.py <episode-plan.yaml>
python3 simplified-framework/pipeline/scripts/validate_transcript.py <transcript.yaml>
python3 simplified-framework/pipeline/scripts/validate_lesson_package.py <lesson_package.yaml>
python3 simplified-framework/pipeline/scripts/validate_practice_package.py <practice_package.yaml>
```

Validators are the authoritative source of truth when prose drifts.

## 10. Migration Notes

v2 is not additive on top of v1.

- v1 warm-up surfaces are retired
- v1 completion-state assumptions are retired
- the database is reset on the v2 branch rather than migrated from old student data

Use `todo-v2.md` as the implementation checklist for remaining app work.
