# Instructional Design

This document defines the conceptual framework, the episode-level pedagogy, and the instructional approach as implemented in the simplified-framework app. It is the primary reference for anyone evaluating how effectively the app teaches, or designing new lesson content.

For code layout, data model, and runtime contracts, see `tech-reference.md`.

> **In-flight revisions.** `simplified-framework/todo.md` scopes a planned revision that will change several sections here (level count, reading-phase scaffolds, word caps, language guide, gate minimums) and will collapse the current 8-episode story into a new 3-episode story `the-white-squirrel`. When the prose here conflicts with the planned changes in `todo.md`, treat `todo.md` as the forward direction and this doc as the current state.

## 1. Conceptual Model

The framework teaches a single student-facing layer: **reasoning flaws**, named in plain language.

The canonical flaw set (from `simplified-framework/reference/flaw-taxonomy.yaml`):

- jumping to a conclusion
- not enough evidence
- ignoring another perspective
- trusting a source too quickly
- missing important conditions or consequences

These labels stay plain, concrete, and teachable. Richer analytic structure may exist for authoring, review, or analytics, but students never need it.

Each episode primarily teaches **one main flaw**. Supporting flaws are used sparingly; repetition on one flaw is more valuable than covering many. Each flaw has three amplification bands — `unmistakable`, `showcased`, `heightened` — that let authors scaffold from obvious to subtle across a story.

## 2. Instructional Setting

The framework is designed for middle-school classrooms where students work in small groups of 3–5, spend 15–20 minutes per session, and use discussion — not just app completion — as part of the learning. Verbal peer explanation in plain language is the preferred proof of understanding.

## 3. Learning Goals

By the end of an episode, a student should be able to:

1. notice a weak reasoning move inside a specific turn
2. name the flaw in plain language
3. explain to peers, out loud, why the move is weak
4. recognize the same flaw again in a later turn
5. leave with one transferable habit of mind

The goal is usable reasoning practice, not taxonomy mastery.

## 4. Student Journey

A plain-prose walk-through from the student's point of view. For state-machine and persistence detail, see §5 (Episode Loop) and `tech-reference.md`.

1. **Arrival.** The student picks their group and their name from a short list and lands in a workspace showing their name and group at the top.

2. **Reading the conversation.** The episode title and a short intro frame who the characters are and what just happened. The transcript follows — a peer dialogue rendered as ordered turns with speaker labels. The student reads it once and continues when ready.

3. **Watching an example.** The app points at one specific turn and asks *"What is this character doing with their reasoning?"* Before the student answers anything, it walks them through the turn in three stages: what to notice in plain language, the reasoning chain step by step with signal phrases called out, and a one-sentence transferable takeaway. This is explicit instruction, not a quiz.

4. **Trying one with support.** A different turn with the same flaw. The student picks from a short list of options — including an "I'm not sure yet" choice — with one optional hint. On submit, the app shows the staged reveal (what to notice, worked explanation, takeaway) alongside their pick.

5. **Trying on their own.** Three independent questions about different turns. Amplification ramps: the first is obvious, the second harder, the third more subtle. Every option has its own feedback. A first wrong answer on a retry-eligible level earns a second try after the student reads the feedback; the first-picked option is disabled. Correct answers (first try or retry) earn a correct-answer medal.

6. **Finishing.** The completion screen shows the episode's final takeaway, the correct-answer medals earned, and — if lifelines remain — a bonus medal for each. The student can replay or return to the group picker.

The journey is deterministic and restrained. No points, streaks, timers, leaderboards, public rankings, or real-time LLM calls. Correct-answer medals and the lifeline-gated bonus are the only game mechanics.

## 5. Episode Loop

Every episode runs a fixed staged loop. Phase names match the runtime state: `read` → `warmup` → `level` → `complete`.

### 5.1 Read

The student sees the full transcript — a peer dialogue in which the target flaw appears naturally, unlabeled. Title, a short `episode.summary`, and (on episode 2+) a short `episode.previously` recap frame the conversation. The transcript is authored as **2–4 scenes with nested turns**; each scene has a plain-language `summary`. Turns render in order with speaker labels.

A single Continue action moves the run from `read` to `warmup`. The runtime persists `reading_complete = true`.

### 5.2 Modeled warm-up

The app walks the student through one specific turn in three staged reveals:

1. **Show me what to notice** — reveals `best_answer_text`, naming the move directly.
2. **Walk me through it** — reveals `worked_explanation`, tracing the reasoning chain step by step.
3. **What's the takeaway?** — reveals `takeaway`, a one-sentence habit of mind.

The answer is shown *before* the student is asked to act. This is explicit instruction, not a quiz. Continue marks `modeled_complete = true` and advances to the guided warm-up.

### 5.3 Guided warm-up

The same flaw surfaces in a different turn. The student picks from authored multiple-choice options (including an "I'm not sure yet" option by convention) with one optional `hint` available. Opening the hint is recorded (`guided_used_hint = true`) but does not block progression.

On submission the runtime locks `guided_selected_answer_id` and moves to a reveal view: the student sees their selection alongside the staged reveal of `best_answer_text` → `worked_explanation` → `takeaway`. Continue marks `guided_complete = true`, sets `current_phase = level`, and points `current_level_id` at the lowest `sequence_index` in `levels[]`.

### 5.4 Levels

The student independently identifies the same flaw in new turns — **exactly 3 levels per episode**, played in `sequence_index` order. The amplification ramp is `unmistakable → showcased → heightened`. Each level has:

- an authored `prompt` about a specific `turn_id`
- `answer_options` (one `best_fit`, others `partial` / `off_target`, plus an `uncertain` option by convention)
- an optional single `hint`
- `feedback.correct.text` shown when the student picks any id in `feedback.correct.option_ids`
- `feedback.by_option` mapping every non-correct option id to tailored feedback

**Bounded retry.** A level is retry-eligible when it has ≥3 answer options and exactly one correct option id. On the first submission:

- Correct first answer → level locks immediately, correct-answer medal awarded.
- Wrong first answer on a retry-eligible level → the level enters a retry-open state. The student sees deterministic feedback for their wrong pick (`feedback.by_option[initial_answer]`), and the retry view re-renders with the wrong option disabled. A second submission locks the level regardless of correctness.
- Wrong first answer on an ineligible level → locks on the wrong answer with no second attempt.

On lock, Continue advances `current_level_id` to the next level. After the final level, the run transitions to `current_phase = complete`, `status = complete`, and `completed_at` is set.

### 5.5 Complete

The completion surface shows:

- the episode's `final_takeaway`
- earned correct-answer medals, one per level where the student's final (possibly retry) answer is correct
- bonus medals doubled if any lifelines remain (see §7)
- options to replay or return to student selection

## 6. Authoring Surface

A lesson package (`lesson_package.yaml`) is the only artifact that controls what a student sees and is graded on at runtime. Everything below is authored per episode.

### 6.1 Episode frame

- `episode.title`
- `episode.summary` — plain-language orientation shown at the top of Read (≤ ~60 words; validator warns past the cap)
- `episode.previously` — short recap shown above the summary on episode 2+ (≤ ~40 words; validator warns past the cap). Forbidden on episode 1; required on ep 2+.
- `episode.final_takeaway` — the habit of mind reinforced at completion
- `episode.flaws` (optional) — display-level flaw list for the completion surface

### 6.2 Warm-ups

Exactly one modeled and one guided warm-up per episode.

Modeled:

- `turn_id`, `title`, `prompt`
- `best_answer_text` — what the student should notice, stated plainly
- `worked_explanation` — the reasoning chain step by step, with signal phrases called out
- `takeaway` — a one-sentence transferable rule

Guided: everything in the modeled shape plus

- `answer_options[]` with `option_id`, `text`, `kind` (`best_fit`, `partial`, `off_target`, `uncertain`)
- `best_answer_id` — which option is correct
- `hint` (optional) — a directive, not the answer

### 6.3 Levels

**Exactly 3 levels** per episode, each with:

- `level_id`, `sequence_index` (1, 2, 3 — lowest plays first), `turn_id`, `title`, `prompt`
- `answer_options[]`
- `best_answer_id` (optional authoring-time metadata; the runtime does not consult this for grading — it uses `feedback.correct.option_ids`)
- `hint` (optional)
- `feedback.correct.option_ids` and `feedback.correct.text`
- `feedback.by_option[option_id]` for every non-correct option

All 5 slots (modeled warm-up, guided warm-up, level 1, level 2, level 3) must reference **pairwise-distinct** `turn_id`s. The conventional mapping is `unmistakable` → modeled warm-up (and/or level 1), `showcased` → level 2, `heightened` → level 3, with the guided warm-up drawing from a spare `unmistakable` or `showcased` moment.

### 6.4 Transcript composition targets

Transcripts are source dialogue, not analytic containers. They contain no per-turn flaw labels, no answer keys, no analytic annotations.

Working structure for each episode:

- **2–4 scenes** with nested turns (each scene has `scene_id`, a ≤ 30-word plain-language `summary`, and ≥ 1 turn)
- preferred turn range across the whole transcript: **10–16 turns**, hard cap 20 unless there is a strong reason
- **≥ 5 primary-flaw moments**, one at each of `unmistakable`, `showcased`, `heightened`, with two more usable for warm-ups. Additional moments at the author's discretion when they serve the story.
- not every turn needs a flaw — leave connective dialogue so the conversation feels natural
- supporting flaws are optional; use them only when they strengthen the scene

### 6.5 Authoring levers that shape the teaching

- **Amplification progression.** Order `sequence_index` so early levels use `unmistakable` turns and later levels use `showcased` or `heightened` — this is how difficulty ramps inside an episode.
- **Signal-phrase noticing.** Call signal phrases out explicitly in `worked_explanation` ("count the 'so's", "notice 'definitely'", "watch for 'has to be'"). These transfer across levels.
- **Contrastive distractors.** Each non-correct `answer_option` should model a plausible confusion (tone, volume, repetition, source-distrust, topic-confusion). `feedback.by_option` should name why that confusion is tempting and pivot back to the flaw's actual shape.
- **Retry as reteach.** On retry-eligible levels, the wrong-option feedback is the second chance to teach. Write it as instruction, not judgment.
- **Takeaway that travels.** Both warm-up `takeaway` and `episode.final_takeaway` should be actionable outside this story ("When you hear a chain of 'so's ending in 'that proves it,' slow down").

## 7. Feedback and Engagement Rules

These rules are enforced by the runtime; an instructional designer relies on them rather than restating them in content.

### 7.1 Feedback

- Deterministic from authored text. No runtime LLM call.
- Immediate on submission. Every option — correct or wrong — has dedicated feedback.
- Short, specific, tied to the actual turn, explanatory rather than judgmental.
- Correct feedback uses `feedback.correct.text`. Wrong feedback uses `feedback.by_option[selected_option_id]`.
- Bounded retry surfaces the *same* wrong feedback again on the retry-open view — the student studies it, then picks again.

### 7.2 Medals (correct-answer badges)

- Single badge category: `correct_answer`.
- Awarded per level whose final (possibly retry) answer is in `feedback.correct.option_ids`. Retry-correct still earns the medal.
- Labels are derived deterministically from `level.sequence_index` and `level.title` in `completion.ts::deriveEarnedBadges`. There is no per-level authored label (no `badge_label` field); a "medal label voice pass" is tracked as future work.
- No streaks, no points, no public ranking, no time pressure.

### 7.3 Lifelines

A small fixed help-token budget per run, spent when the student opens a **level** hint. Warm-up hints do not cost a lifeline.

- Initial budget: `max(1, levels.length - 1)`. One hint never costs the bonus outright; the minimum of 1 keeps the mechanic visible on short episodes.
- Cost: one lifeline per level on which the student opened the hint (set-based — multiple opens on the same level still count as one).
- Effect at completion: if any lifelines remain, every correct-answer medal earns a second "bonus medal" on the completion surface.

### 7.4 Scope rules

- One student per device at a time; internet required.
- Cross-device resume is supported; the database is the source of truth for run state.
- No game mechanics beyond restrained badges + the lifeline-gated bonus.

## 8. What the Runtime Captures

Every element below is persisted and available for evaluation or analytics. See `tech-reference.md` §4 for the Prisma schema.

| Signal | Where it lives | What it tells you |
|---|---|---|
| Phase transitions | `session_runs.current_phase`, `updated_at`, `completed_at` | Pacing through read → warmup → level → complete |
| Reading completion | `session_runs.reading_complete` | Student marked transcript read |
| Modeled warm-up completion | `warmup_progress.modeled_complete` | Student walked through the worked example |
| Guided warm-up answer | `warmup_progress.guided_selected_answer_id` | Which option the student picked |
| Guided hint use | `warmup_progress.guided_used_hint` | Whether the student opened the warm-up hint before submitting |
| Level first answer | `level_responses.initial_answer` | Pre-retry attempt |
| Level final answer | `level_responses.final_answer` | Post-retry (or only) attempt that locked the level |
| Level answer changed | `level_responses.answer_changed` | True if retry produced a different final answer |
| Level hint use | `level_responses.used_hint` (derived at lock from scaffold events) | Whether the student opened the level's hint |
| Hint-open events | `scaffold_events` (append-only, one per `run_id + level_id + step_key`) | Exact moment a hint was opened |
| Level completion timestamp | `level_responses.completed_at` | When the level locked |

From these fields an instructional designer can derive:

- where students most often pick which wrong option (miss patterns)
- which levels convert wrong → right on retry vs. lock on wrong (retry efficacy)
- which levels trigger hints (difficulty calibration)
- whether lifelines and bonus medals are actually a reachable reward on this episode length

## 9. Authoring Constraints

A flaw moment is suitable for beginner instruction when an ordinary reader can see that something is off, the flaw can be named in plain language and explained in one or two sentences, and the turn supports a short app interaction plus follow-on discussion.

Feedback on any answer should be short, specific, tied to the actual turn, and explanatory rather than judgmental. The final takeaway should reinforce a habit of mind, not summarize the plot.

Operational limits enforced by the validators and runtime:

- every package `turn_id` must exist in the transcript
- each level's `feedback.by_option` must cover every non-correct option id
- `levels` order is determined by `sequence_index`, not array position
- levels with fewer than 3 options or more than one correct option lock on first submission (no retry)

## 10. Related Docs

- `simplified-framework/todo.md` — in-flight revision plan (reading-phase scaffolds, level cap, word caps, language guide, gate minimums, 3-episode story collapse)
- `simplified-framework/docs/tech-reference.md` — stack, data model, runtime contracts, change recipes
- `simplified-framework/docs/operator-workflow.md` — human-in-the-loop authoring cadence
- `simplified-framework/reference/flaw-taxonomy.yaml` — canonical flaw set with amplification bands

Historical context: `simplified-framework/docs/archived/framework-model.md`, `app-design.md`, and `technical-spec.md` hold the build-time design record.
