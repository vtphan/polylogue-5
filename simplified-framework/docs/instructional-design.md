# Instructional Design

This document defines the v2 instructional model for `simplified-framework/`.

For stack, persistence, and runtime contracts, see `tech-reference.md`.

## 1. Conceptual Model

The framework teaches one student-facing layer: **reasoning flaws**, named in plain language.

Canonical flaw set:

- jumping to a conclusion
- not enough evidence
- ignoring another perspective
- trusting a source too quickly
- missing important conditions or consequences

Each episode primarily teaches one main flaw. Supporting flaws may appear, but the lesson package and inline quiz flow stay centered on one clear `focus_flaw` at a time.

## 2. Student Modes

The app has two student-facing modes:

1. **Practice**
2. **Read a story**

Identity selection is a precondition to both modes. The student chooses or creates a local profile first, then lands on the home screen.

### 2.1 Practice

Practice is a shared tutorial library, not a per-episode warm-up surface.

- one shared `practice_package.yaml`
- one exercise per canonical flaw
- completion-tracked only
- re-enterable at any time
- required once for all 5 flaws before story mode unlocks

Practice uses a lighter two-click flow:

1. tap an option to submit
2. tap `Done` to return to the picker

Hints are free in practice. There are no stars, retries, or bonus mechanics here.

### 2.2 Read a Story

Story mode is a scene-based reader with inline quizzes.

- the reader is organized into `scene_00` orientation plus `scene_01..scene_N`
- scene 0 shows `episode.previously` when present, then `episode.summary`
- each episode has exactly 3 authored quizzes
- each quiz is attached to one flagged turn
- at most one authored quiz may live in a scene

Students may move forward and backward freely between scenes. Re-reading is always allowed.

## 3. Story-Mode Loop

The old `read → warmup → level → complete` runtime is retired in v2.

The active loop is:

1. orientation card
2. scene reader
3. optional inline quiz interaction on flagged turns
4. completion recap view once the final scene has been reached

`/complete` is a recap surface, not a terminal phase. A finished run remains writable for untried quizzes and late-earned stars.

## 4. Inline Quiz Mechanic

Each episode has exactly 3 inline quizzes, typically mapped to:

- `unmistakable`
- `showcased`
- `heightened`

Each quiz:

- opens below the flagged turn
- allows up to 2 attempts
- offers 1 optional hint before final submission
- becomes review-only after submission

The prompt asks the question directly. It does not quote or paraphrase the highlighted turn, because the student can already see that turn in the reader.

Reveal copy should be direct:

- best answer explanations say why this is the best answer
- wrong answer explanations say why this is not the best answer

## 5. Stars

Story mode uses per-quiz stars, scoped to one episode.

Per quiz:

- correct first try, no hint: 3 stars
- correct first try, hint used: 2 stars
- wrong first try, correct second try, no hint: 2 stars
- wrong first try, correct second try, hint used: 1 star
- wrong twice: 0 stars

Per episode:

- 9 stars available across the 3 quizzes
- 1 bonus star awarded when the student reaches 9/9
- maximum total: 10 stars

Stars are episode-local recognition only. There are no cumulative totals, streaks, timers, leaderboards, or public rankings.

## 6. Authoring Surface

### 6.1 `episode-plan.yaml`

The plan is a planning artifact, not a runtime artifact.

Required planning shape:

- `story_id`, `episode_id`, `title`, `episode_goal`, `student_takeaway`
- `flaws[]` with one entry per intended planned moment
- each planned moment carries `focus_flaw`, `amplification`, and `scene_id`

Hard gate:

- the primary flaw must have exactly 3 planned quiz-worthy moments
- exactly one each at `unmistakable`, `showcased`, and `heightened`
- those 3 moments must land in distinct scenes

### 6.2 `transcript.yaml`

The transcript is source story text only.

- `scenes[]` length is 3+
- each scene has `scene_id`, `summary`, `turns[]`
- turns use globally unique, increasing `turn_id`s
- turns are dialog-only

The transcript does not contain analytic labels, answer keys, or packaged teaching text.

### 6.3 `lesson_package.yaml`

The lesson package is the deterministic app-facing teaching artifact.

Top-level:

- `package_meta`
- `episode`
- `levels`

Episode frame:

- `episode.title`
- `episode.summary`
- `episode.previously` on episode 2+
- `episode.final_takeaway`

Levels:

- exactly 3 entries
- each with `level_id`, `sequence_index`, `turn_id`, `title`, `focus_flaw`, `prompt`, `answer_options`, `feedback`, `takeaway`
- no `warmups`
- no `student_intro`

The runtime grades with `feedback.correct.option_ids`, never `best_answer_id`.
`feedback.correct.text` is a plain string, and `feedback.by_option.{option_id}` values are also plain strings, not nested objects.

### 6.4 `practice_package.yaml`

This is the shared tutorial artifact for practice mode.

- exactly 5 exercises keyed by canonical `flaw_id`
- each exercise includes a short scenario, prompt, options, hint, feedback, worked explanation, and takeaway
- shared across stories

## 7. Language and Readability

Student-facing language should be plain, direct, and beginner-teachable.

Validator-backed readability rule:

- scaffolding prose hard-fails above grade 6
- dialog text is warning-only
- FK scoring uses a fixed 30-word minimum sample

## 8. Pipeline Roles

Transcript generation is a two-pass flow:

1. **screenwriter**
2. **flaw_injector**

The screenwriter receives a stripped projection of the episode plan with flaw fields removed. The flaw injector receives the draft plus the full plan. The reviewer then checks whether the planned moments actually landed and whether the 3 quiz-ready turns are distinct-scene, beginner-visible, and promptable without restating the turn.

## 9. Related Docs

- `simplified-framework/docs/tech-reference.md`
- `simplified-framework/docs/operator-workflow.md`
- `simplified-framework/reference/flaw-taxonomy.yaml`
- `simplified-framework/todo-v2.md`
