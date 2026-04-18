# Tech Reference

This document is the primary technical reference for the simplified-framework app. It is for developer agents adding features, fixing bugs, or modifying existing behavior.

For pedagogy, lesson authoring, and student-journey framing, see `instructional-design.md`. When prose in this doc drifts from code or validators, the code wins and this doc should be updated.

> **In-flight revisions.** `simplified-framework/todo.md` scopes a planned revision that will change several parts of this doc — the transcript schema (new `scenes[]` structure with nested turns), the lesson-package schema (new `episode.summary`, `episode.previously`, 3-level cap), the read-phase route (scene-based UI), and validator behavior. When planning code changes, consult `todo.md` first so new work aligns with the forward direction.

## 1. Stack

- **Framework**: Next.js 16 (App Router) + React 19 + TypeScript
- **Database**: SQLite via Prisma 6
- **Styling**: Tailwind 4 + CSS modules in `globals.css`
- **Schema validation**: Zod 4 (for both artifact loading and action inputs)
- **YAML loading**: `js-yaml`
- **Runtime constraint**: no LLM calls, no external content fetches. Rendering is deterministic from artifacts + Prisma rows.

App root: `simplified-framework/app/`. All runtime paths assume `cwd = simplified-framework/app`.

## 2. Directory Map

```
simplified-framework/
  app/
    prisma/
      schema.prisma                # data model (see §4)
      migrations/                  # ordered SQL migrations
    src/
      app/                         # Next.js App Router
        page.tsx                   # identity: group → student picker
        actions.ts                 # all server actions (see §6)
        layout.tsx, globals.css    # app shell + styles
        groups/[groupId]/page.tsx  # student picker within a selected group
        runs/[runId]/
          _components/
            LessonWorkspace.tsx    # transcript-left / drawer-right shell
          entry/page.tsx           # read-phase landing (post identity)
          read/page.tsx            # full transcript reading surface
          warmup/
            page.tsx               # modeled + guided + guided-reveal
            RevealStages.tsx       # staged reveal button component
          level/page.tsx           # question / retry / feedback / handoff
      lib/
        db.ts                      # Prisma client singleton
        domain.ts                  # Zod schemas + shared types
        config.ts                  # loadActiveConfig, getGroup, getStudent
        content.ts                 # loadTranscript, loadLessonPackage
        paths.ts                   # repoRoot, resolveEpisodeSource
        routing.ts                 # routeForRun(run) — canonical phase router
        runs.ts                    # createOrResumeRun, markReadingComplete
        warmup.ts                  # warm-up state + transitions
        levels.ts                  # level state machine, feedback, retry
        completion.ts              # medal + lifeline derivation
        session-chrome.ts          # student/group chrome aggregator
        transcript.ts              # selectTurnContext helper
      scripts/
        probe_warmup_guards.ts     # dev script for warm-up guard behavior
  configs/                         # runtime config(s)
    episode.json                   # active config (one episode + groups); override path with POLYLOGUE_CONFIG_PATH
  artifacts/{story_id}/{episode_id}/
    transcript.yaml                # source dialogue (consumed at runtime)
    lesson_package.yaml            # app-facing teaching artifact (consumed at runtime)
    episode-plan.yaml              # planning artifact (not runtime-required)
    flaw-review.md                 # operator acceptance gate
  stories/{story_id}/story.yaml    # authored story source
  reference/flaw-taxonomy.yaml     # canonical flaws + amplification bands
  schemas/*.yaml                   # human-readable schema sketches
  pipeline/
    scripts/validate_*.py          # authoritative structural validators
    commands/*.md                  # pipeline workflow contracts
    agents/*.md                    # authoring agent specs
```

## 3. Runtime Config

The app loads exactly one config per process. Resolution order (`src/lib/config.ts`):

1. env var `POLYLOGUE_CONFIG_PATH` (absolute or repo-relative)
2. default: `simplified-framework/configs/episode.json`

Shape (validated by `activeConfigSchema` in `domain.ts`):

```json
{
  "config_id": "white-squirrel-ep01",
  "episode": { "source": "simplified-framework/artifacts/<story>/<episode>" },
  "groups": [
    {
      "group_id": "group-a",
      "name": "Table A",
      "students": [{ "student_id": "ava", "name": "Ava" }]
    }
  ]
}
```

`episode.source` is the directory that contains `transcript.yaml` and `lesson_package.yaml`. It may be repo-relative (`simplified-framework/...`) or simplified-framework-relative (`artifacts/...`); `resolveEpisodeSource` handles both.

The parsed config is cached in-process after first load.

## 4. Data Model

All tables defined in `prisma/schema.prisma`. Runtime writes flow through helpers in `src/lib/{runs,warmup,levels,completion}.ts` — never write Prisma models directly from a page or action.

### 4.1 `session_runs` — one row per student × episode attempt

Key fields:

- `run_id` (pk, cuid)
- `config_id`, `episode_source`, `group_id`, `student_id` — identity of the attempt
- `status`: `in_progress` | `complete`
- `current_phase`: `read` | `warmup` | `level` | `complete`
- `current_level_id` — set when `current_phase = level`; cleared on completion
- `reading_complete` (boolean)
- `started_at`, `updated_at`, `completed_at`

Uniqueness: at most one `status = 'in_progress'` row per `(config_id, episode_source, group_id, student_id)`. Enforced by a partial unique index (declared in raw SQL in the `20260416194327_allow_multiple_completes` migration; Prisma does not model partial indexes). Completed rows are unbounded, enabling replay.

### 4.2 `warmup_progress` — one row per run

1:1 with `session_runs`. Fields:

- `modeled_complete` (boolean)
- `guided_submitted` (boolean) — locks the guided warm-up after first submission
- `guided_selected_answer_id` (string | null)
- `guided_used_hint` (boolean, monotonic)
- `guided_complete` (boolean) — set when the student continues out of the guided reveal

Derived step (`deriveWarmupStep`): `modeled` → `guided_question` → `guided_reveal` → `done`.

### 4.3 `level_responses` — one row per run × level

Unique on `(run_id, level_id)`. Fields:

- `initial_answer` — first option submitted
- `final_answer` — answer that locked the level (may equal `initial_answer`)
- `used_hint` (boolean, derived at lock time from scaffold events)
- `answer_changed` (boolean) — true when retry produced a different final answer
- `completed_at` (nullable) — null = retry-open; set = locked

Derived step (`deriveLevelStep`): `question` (no row) → `retry` (row with `completed_at = null`) → `feedback` (row with `completed_at` set).

### 4.4 `scaffold_events` — append-only log

Unique on `(run_id, level_id, step_key)`. Fields:

- `step_key` — currently only `LEVEL_HINT_STEP_KEY = "hint"`
- `created_at`

Used to record hint-open durably before submission so reload cannot lose the fact. `levels.used_hint` is derived from these events at lock time.

## 5. Artifact → Runtime Contract

All artifacts are YAML, loaded from `episode_source`, validated by Zod schemas in `domain.ts`. Shapes here are what the runtime requires; validators in `simplified-framework/pipeline/scripts/` are authoritative for authoring.

> **Phase-1-vs-app sync (2026-04-17).** The Python validators now enforce the forward authoring shape (`transcript.scenes[]`, `episode.summary`, `episode.previously`, 3-level cap). The **app has not been updated yet** — `app/src/lib/domain.ts` still accepts top-level `transcript.turns[]` and `episode.student_intro`, and the entry/read pages render those fields. §5.1 and §5.2 below describe the forward contract (the shape the pipeline now produces); the "App still loads" notes flag where the runtime lags. Phase 3 of `simplified-framework/todo.md` (items A1–A4) realigns Zod + pages. Until Phase 3 lands, artifacts authored against the new validators cannot be rendered by the app, and artifacts that render in the app fail the new validators — both conditions are intentional migration state.

### 5.1 `transcript.yaml`

**Authoring contract (enforced by `validate_transcript.py`).** Required top-level: `story_id`, `episode_id`, `title`, `characters[]`, `scenes[]`. No top-level `turns[]`, `setting_note`, or `previously` — recap copy lives in `lesson_package.episode.previously`.

`scenes[]` has length 2–4. Each scene: `scene_id` (unique within the transcript), `summary` (plain-language, ≤ ~30 words; validator warns past the cap), `turns[]` (≥ 1).

Each turn: `turn_id` (string, format `tNN`, globally unique across the whole transcript and strictly increasing), `speaker` (string), `text` (string).

Every `turn_id` referenced by `lesson_package.yaml` must exist in the transcript. Turn lookups cross scenes; the `turn_id` is the canonical key.

**App still loads:** the pre-Phase-1 shape — top-level `turns[]` with optional `setting_note`/`previously`, no `scenes[]`. See `app/src/lib/domain.ts::transcriptSchema` and `app/src/lib/transcript.ts`. Phase 3 (A3 in `todo.md`) updates the Zod schema and turn-lookup helper to consume `scenes[]`.

### 5.2 `lesson_package.yaml`

**Authoring contract (enforced by `validate_lesson_package.py`).** Top-level sections: `package_meta`, `episode`, `warmups`, `levels[]`.

- `package_meta`: `story_id`, `episode_number`, `schema_version`
- `episode`: `title`, `summary`, `previously` (required when `episode_number > 1`; forbidden on episode 1), `flaws[]` (optional), `final_takeaway`
- `warmups.modeled`: `warmup_id`, `turn_id`, `title`, `prompt`, `best_answer_text`, `worked_explanation`, `takeaway`, `focus_move`, `best_answer_id` (required).
- `warmups.guided`: modeled shape plus `answer_options[]`, `best_answer_id` (required), `hint` (optional).
- `levels[]` — **exactly 3 entries**: `level_id`, `sequence_index` (1, 2, 3; runtime plays lowest first), `turn_id`, `title`, `prompt`, `answer_options[]`, `best_answer_id` (optional — runtime uses `feedback.correct.option_ids` for grading), `hint` (optional), `feedback`.

All 5 slots (modeled warm-up, guided warm-up, levels 1–3) must reference **pairwise-distinct** `turn_id`s.

Validator also emits soft-cap warnings on scaffolding prose length (`episode.summary` ~60, `episode.previously` ~40, warm-up `best_answer_text` ~40, `worked_explanation` ~60, `takeaway` ~20) and a Flesch-Kincaid readability warning when a scaffolding block or feedback string scores above grade 7. Warnings are advisory; they do not block validation.

Each `answer_option`: `option_id`, `text`, `kind?` (conventional values: `best_fit`, `partial`, `off_target`, `uncertain`).

`feedback`:

- `correct.option_ids[]` — source of truth for grading
- `correct.text`
- `by_option[option_id]` — must cover every non-correct option id (Zod `superRefine` enforces this)

The runtime **must not** consult `best_answer_id` to decide correctness; use `feedback.correct.option_ids`.

**App still loads:** the pre-Phase-1 shape — `episode.student_intro` (not `summary`), no `previously`, and `levels[]` of length 1+ (not capped at 3). See `app/src/lib/domain.ts::lessonPackageSchema` and `app/src/app/runs/[runId]/entry/page.tsx`. Phase 3 (A1, A3, A4 in `todo.md`) renames the Zod field, adds optional `previously`, and optionally adds a runtime-side 3-level guard.

### 5.3 Canonical read paths

Runtime reads only two files per session:

- `${episode_source}/transcript.yaml` via `loadTranscript`
- `${episode_source}/lesson_package.yaml` via `loadLessonPackage`

`episode-plan.yaml`, `flaw-review.md`, and `story.yaml` are not consumed at runtime.

## 6. Server Actions and Phase State Machine

All mutations flow through server actions in `src/app/actions.ts`. Each action guards the current phase before writing. Direct POST bypass is rejected.

Phase transitions (driven by `routeForRun` in `src/lib/routing.ts`):

```
identity → read (createOrResumeRun)
read → warmup (markReadingComplete)
warmup → warmup (completeModeledWarmup, submitGuidedWarmup, hint open)
warmup → level (continueFromGuidedWarmup; sets current_level_id = firstLevelId)
level → level (submitLevelAnswer, hint open, retry-open → lock)
level → level (continueFromLevelFeedback when nextLevel exists)
level → complete (continueFromLevelFeedback on final level; sets status = complete, completed_at)
```

### 6.1 Actions (all in `src/app/actions.ts`)

| Action | Precondition | Effect |
|---|---|---|
| `selectStudentAction` | valid group + student in active config | Creates or resumes a run; redirects via `routeForRun` |
| `finishReadingAction` | run exists (terminal-state safe) | Sets `reading_complete = true`, `current_phase = warmup`; redirects |
| `completeModeledWarmupAction` | `current_phase = warmup` | Sets `warmup_progress.modeled_complete = true` (idempotent) |
| `openGuidedHintAction` | `current_phase = warmup` | Sets `guided_used_hint = true` (monotonic) |
| `submitGuidedWarmupAction` | `current_phase = warmup`, modeled complete | Atomic conditional write: locks `guided_submitted = true` + `guided_selected_answer_id` |
| `continueFromGuidedWarmupAction` | guided submitted, selected answer still valid | Sets `guided_complete`, transitions run to `level` phase with `current_level_id = firstLevelId` |
| `openLevelHintAction` | `current_phase = level`, matches `current_level_id` | Upserts `scaffold_events` row (idempotent) |
| `submitLevelAnswerAction` | `current_phase = level` | Branches: lock existing row, finalize retry-open, create retry-open, or lock on first submit |
| `continueFromLevelFeedbackAction` | `current_phase = level`, current level locked | Advances `current_level_id` to next, OR completes the run |

### 6.2 Level submit branches (`submitLevelAnswer`)

1. Locked row (`completed_at` set) → idempotent return.
2. Retry-open row + different answer → guarded `updateMany` finalizes with `answer_changed = true`.
3. Retry-open row + same answer → reject (returns row unchanged); UI also disables the first-picked option.
4. No row + wrong answer + retry-eligible level → create retry-open row.
5. No row + (correct OR ineligible) → create locked row.

Retry eligibility: `answer_options.length >= 3 && feedback.correct.option_ids.length === 1`.

### 6.3 Concurrency

- First-submit races on a level: resolved by the unique `(run_id, level_id)` index; loser catches Prisma P2002 and returns the canonical row.
- Second-submit races on a retry-open row: a `completedAt IS NULL` guard in `updateMany` ensures only one caller's finalize lands; losers re-fetch.
- Warm-up guided submit: atomic conditional `updateMany` on `modeled_complete = true AND guided_submitted = false`; subsequent hint-flag merge is idempotent.

Treat these as load-bearing; do not replace guarded updates with check-then-act patterns.

## 7. Completion, Medals, and Lifelines

All derived in `src/lib/completion.ts` from persisted rows. No writes happen on render of a completed run.

- `deriveEarnedBadges(inputs, pkg, { bonusMedals })` — one badge per level where `final_answer ∈ feedback.correct.option_ids`. With `bonusMedals: true`, each correct level yields a second "bonus medal" row.
- `deriveLifelineState(inputs, pkg)`:
  - Initial budget: `max(1, pkg.levels.length - 1)`
  - Used: count of distinct `level_id`s with a `stepKey = "hint"` scaffold event
  - Remaining: `max(0, initial - used)`
- Session chrome (`src/lib/session-chrome.ts`) aggregates student name + group name + badge counts + lifelines + phase progress for the workspace header.

The completion surface renders on the level route when `status = complete` or `current_phase = complete`.

## 8. Validators

Authoring correctness is enforced by pure-Python validators (PyYAML only):

```bash
python3 simplified-framework/pipeline/scripts/validate_story.py          <path>
python3 simplified-framework/pipeline/scripts/validate_episode_plan.py   <path>
python3 simplified-framework/pipeline/scripts/validate_transcript.py     <path>
python3 simplified-framework/pipeline/scripts/validate_lesson_package.py <path>
```

Runtime also re-validates `transcript.yaml` and `lesson_package.yaml` via Zod on every load. Zod is the last line of defense before a page renders.

## 9. Source Of Truth Precedence

1. Validators in `simplified-framework/pipeline/scripts/`
2. Zod schemas in `src/lib/domain.ts`
3. Artifact files under `stories/` and `artifacts/`
4. Prisma schema in `prisma/schema.prisma`
5. `reference/flaw-taxonomy.yaml`
6. This document
7. Human-readable schema sketches in `schemas/`

## 10. Change Recipes

Starting points for common modifications. Each recipe names the files that must change together.

### 10.1 Swap a challenge level in an episode

The level count is fixed at 3 per episode. To change difficulty, replace one of the existing level entries rather than adding a fourth.

1. Edit `artifacts/{story_id}/{episode_id}/lesson_package.yaml` — replace a `levels[]` entry, keeping `sequence_index` 1/2/3 intact. Include `answer_options`, optional `best_answer_id`, `hint` (optional), full `feedback.correct` and `feedback.by_option`. The new `turn_id` must be distinct from the other 4 slots (modeled + guided warm-ups + other two levels).
2. Run `python3 simplified-framework/pipeline/scripts/validate_lesson_package.py <path>`.
3. No code change needed. The runtime picks levels by `sequence_index`; `nextLevel`/`firstLevelId` handle ordering.

### 10.2 Change medal labeling

- Labels are generated in `src/lib/completion.ts::deriveEarnedBadges`. Edit the template string there; labels are deterministic from `level.sequence_index` + `level.title`. There is no authored per-level override — the former `badge_label` field has been withdrawn and is not read by the runtime.
- The category system is pluggable: adding a new `BadgeCategory` means extending `Badge`, `countBadgesByCategory`, `groupBadgesByCategory`, and the chip set in `LessonWorkspace.tsx`.

### 10.3 Add a new scaffold kind (e.g., a second hint tier)

1. Define a new `step_key` constant in `src/lib/levels.ts` alongside `LEVEL_HINT_STEP_KEY`.
2. Add a matching record-action pattern (see `recordLevelHintOpened`) that upserts a `scaffold_events` row. Uniqueness on `(run_id, level_id, step_key)` makes it idempotent.
3. Update `deriveLevelStep` + the level page to surface the new scaffold in the UI.
4. Decide whether this scaffold should count toward lifeline spend; if yes, update `deriveLifelineState` to include its `step_key`.

### 10.4 Add a new phase

This is a structural change. Touchpoints:

1. `RunPhase` enum in `src/lib/domain.ts` and `session_runs.current_phase` in `prisma/schema.prisma` (plus a migration).
2. `routeForRun` in `src/lib/routing.ts` — add the route case.
3. Phase guards in `src/app/actions.ts` (`requireWarmupRun`-style helpers).
4. A transition action analogous to `continueFromGuidedWarmup` or `continueFromLevelFeedback`.
5. A new `src/app/runs/[runId]/<phase>/page.tsx` that gates on phase and reads from `loadLessonPackage` / `loadTranscript`.

### 10.5 Swap to a new episode

Edit `simplified-framework/configs/episode.json` (or set `POLYLOGUE_CONFIG_PATH`) and point `episode.source` at a directory that contains valid `transcript.yaml` + `lesson_package.yaml`. No code change required.

### 10.6 Add a new runtime field to the lesson package

1. Extend the appropriate Zod schema in `src/lib/domain.ts`.
2. Add a matching rule (if structural) to the Python validator in `simplified-framework/pipeline/scripts/validate_lesson_package.py`.
3. Update the schema sketch in `simplified-framework/schemas/` for author reference.
4. Update `instructional-design.md` §6 "Authoring Surface" so designers see the new field.

### 10.7 Evolve the Prisma schema

1. Edit `prisma/schema.prisma`.
2. `npx prisma migrate dev --name <short_name>` from `simplified-framework/app/`. Commit the generated SQL under `prisma/migrations/`.
3. Update the affected helper in `src/lib/*.ts`. Keep derived-state helpers (`deriveWarmupStep`, `deriveLevelStep`) as the single read path for pages.
4. If adding a partial unique index, declare it in raw SQL inside the migration — Prisma does not model partial indexes in `schema.prisma`.

## 11. Local Development

```bash
cd simplified-framework/app
npm install
npx prisma migrate dev                 # first-time DB setup
POLYLOGUE_CONFIG_PATH=$(pwd)/../configs/episode.json npm run dev
```

SQLite file path comes from `DATABASE_URL` in `.env` (conventionally `file:./dev.db` under `prisma/`).

## 12. Related Docs

- `simplified-framework/todo.md` — in-flight revision plan (schema revamp, reading-phase UI, validators, 3-episode story collapse)
- `simplified-framework/docs/instructional-design.md` — conceptual framework, student journey, authoring surface
- `simplified-framework/docs/operator-workflow.md` — human-in-the-loop authoring cadence
- `simplified-framework/reference/flaw-taxonomy.yaml` — canonical flaw set

Historical context for design decisions lives in `simplified-framework/docs/archived/app-design.md` and `archived/technical-spec.md`.
