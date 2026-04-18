# TODO v2 — Two Modes (Practice + Read-a-Story), Inline Quizzes, Star Scoring

> **ACTIVE — opened 2026-04-17.** Supersedes `todo.md` (frozen). Design locked in discussion on 2026-04-17; work items below drive implementation.

## Contents

1. [Motivation](#motivation)
2. [Architecture — two modes](#architecture--two-modes)
3. [Practice mode](#practice-mode)
4. [Read-a-story mode](#read-a-story-mode)
5. [Quiz mechanic + star scoring](#quiz-mechanic--star-scoring)
6. [UI / display spec](#ui--display-spec)
7. [Artifact contract changes](#artifact-contract-changes)
8. [Pipeline agents + authoring guidelines](#pipeline-agents--authoring-guidelines)
9. [App changes](#app-changes)
10. [Migration + end-to-end verification](#migration--end-to-end-verification)
11. [Sequencing](#sequencing)
12. [Explicitly out of scope](#explicitly-out-of-scope)

---

## Motivation

The current app runs students through separate `read → warmup → level → complete` phases. Two problems this design addresses:

- **Passive reading load dominates before any reasoning begins.** Students read the whole transcript first, then reason in a second phase.
- **Warm-ups and levels jump across the transcript** in an order students have to reconstruct from memory. High cognitive load, poor narrative continuity.

Two levers:

1. **Separate practice from reading.** Practice is a tutorial surface students visit once or twice; embedding it into every episode as warm-ups bloats every lesson package with the same scaffolding.
2. **Inline quizzes inside the story.** Students read a scene linearly. Turns that carry a reasoning flaw are marked with an icon. Tapping the icon opens the quiz in place; the student never leaves the scene. Skipping a quiz is fine — a student can just read the story. Stars are the reward for engaging with quizzes.

---

## Architecture — two modes

**Opening page** offers two choices:

- **Practice** — the tutorial library. Student picks a flaw, works through a short exercise. Shared across all stories; authored once.
- **Read a story** — pick an episode; read it scene by scene with inline quizzes on flagged turns.

The old reading phase, warm-up phase, and level phase all go away. The runtime phase state machine collapses into a single scene loop inside the story mode.

---

## Practice mode

### Shape

- **One practice package, shared by all stories.** Lives at `simplified-framework/artifacts/practice/practice_package.yaml`.
- **One exercise per canonical flaw** (5 exercises total, matching `reference/flaw-taxonomy.yaml`).
- **Entry UI: picker.** Student sees 5 flaws listed, picks one, completes that exercise, returns to the picker.
- **Each exercise is a mini-scenario** (a very short snippet of dialog or a situation) that exhibits the flaw clearly, with a prompt + options + worked explanation + takeaway.
- **Completion-tracked, not star-scored.** No stars in practice. The app records which flaws the student has completed; that's it.
- **Re-enterable.** A student can redo a practice exercise any time; it is not locked.

### Simpler click-through

Practice should feel lighter than story quizzes. Two-click flow:

1. **Tap an option** — auto-submits. Feedback, worked explanation, and takeaway render inline below the selected option.
2. **Tap "Done"** — returns to the picker.

No separate Submit, no separate Reveal, no per-step Next. The hint is always free to view in practice mode (no lifeline, no cost) and appears as an "Hint" pill the student can tap before choosing.

### Authoring

- One YAML file with 5 entries keyed by `flaw_id`.
- Each entry holds a short scenario, a prompt, options, feedback, worked explanation, and a takeaway.
- Authored once against the canonical taxonomy; revised rarely.
- The file is not tied to any story; updating a story does not touch it.

---

## Read-a-story mode

### Scene structure

- Transcript has `scenes[]` with length **≥ 3**. Upper bound stays soft (pacing, not schema).
- Each scene has `scene_id`, a plain-language `summary` (≤ 30 words), and `turns[]`.
- Authoring principle unchanged: break scenes at shifts in location, time, topic, or conversational mode. Aim ~3–5 turns per scene.

### Flagged turns and inline quizzes

- Each episode has **exactly 3 quizzes** (renamed from "levels" at the UI layer, though the lesson package may still call them `levels[]` — see contract). The 3-quiz amplification mix (`unmistakable` / `showcased` / `heightened`) is unchanged.
- Each quiz is bound to one `turn_id`. That turn renders with a small icon indicating a flaw is present.
- Multiple quizzes may live in the same scene if the narrative asks for it; scenes without a flagged turn are allowed.
- **Tapping the icon opens the quiz inline, below the flagged turn.** The student never navigates away from the scene.
- **Skipping is fine.** A student can read past a flagged turn without engaging. The icon remains clickable.
- **Each quiz names its target flaw.** `focus_flaw` on each level is a required **canonical flaw_id** from `reference/flaw-taxonomy.yaml` (e.g. `trusting_a_source_too_quickly`). Upstream pipeline agents (episode planner → flaw reviewer → lesson package builder) fill this field; the validator enforces it. The app uses it to render the right icon and attribute earned stars to a specific flaw.

### Navigation and re-reading

- Students can move **forward and backward between scenes freely**. Nothing is gated.
- Students can re-read an episode any number of times; the episode is never locked.
- **One persistent run per (student, episode).** Re-reads reuse the same run row. Attempted-quiz locks, star tallies, completion state, and bonus state all live in that single run and are never reset. There is no "start a new run" affordance.
- **Attempted quizzes freeze.** After submission, the student's answer and feedback are visible on all subsequent reads, but the quiz cannot be re-attempted. This is intentional — the result becomes a durable record useful for off-app discussions.
- **Untried quizzes stay live.** On re-reads, a quiz the student skipped earlier is still tappable and still worth stars.

### Completion

- An episode is considered **complete when the student advances into the final scene** — i.e., taps Next on scene N-1. Scrolling within the final scene is not required, and no end-of-scene confirmation is needed. Zero quizzes attempted is a valid finish.
- Stars accumulate across sittings. A student can earn all 9 over several reads and still receive the 10th bonus star; the bonus fires at the moment the 9th star is earned, whenever that happens.
- Completion is a one-way latch on the run (see run lifecycle below): once marked complete, the run stays complete on every subsequent re-read, even if the student earns additional stars.

---

## Quiz mechanic + star scoring

### Per-quiz mechanic

- **Two attempts maximum.** After a wrong first attempt, the chosen option is grayed out; the student picks from the remaining options.
- **One hint available per quiz**, viewable at any time before the final submit (before first attempt, or between first and second attempt).
- **No global lifeline pool** — the lifeline mechanic is retired in v2. Hints are per-quiz.

### Star scoring (per quiz)

| First attempt | Hint used | Result | Stars |
|---|---|---|---|
| Correct | No | — | **3 ⭐** |
| Correct | Yes | — | **2 ⭐** |
| Wrong | No | Second attempt correct | **2 ⭐** |
| Wrong | Yes | Second attempt correct | **1 ⭐** |
| Wrong | — | Second attempt wrong | **0 ⭐** |

Rule of thumb: start at 3 stars; each cost (hint or extra attempt) subtracts one; zero if the second attempt is still wrong.

### Episode scoring

- **9 stars** available across the 3 quizzes (3 × 3).
- **1 bonus star** awarded on reaching 9/9 on the episode. Accumulation across multiple sittings counts — the bonus is about having all 9, not about earning them in one go.
- **Maximum per episode: 10 stars.**

### Practice scoring

- **None.** Practice is completion-tracked.

### Engagement-invariant positioning

Stars in v2 are **badge-style per-quiz recognition**, not a running score. They are scoped to a single episode; they do not sum into a cumulative number anywhere in the UI, and there is no leaderboard, ranking, streak, timer, or inter-student comparison. The home screen's per-episode grid displays the same 10-star layout for every episode — a visual record of what was earned on that episode, never a total. This preserves the intent of the `CLAUDE.md` restrained-engagement invariant ("no points, streaks, timers, leaderboards, or public rankings") even though the mechanism has moved from a single lifeline-bonus badge to per-quiz stars with a bonus. `CLAUDE.md` is updated in this batch to rephrase the invariant list accordingly.

---

## UI / display spec

### Opening / home page

- Two primary actions: **Practice** and **Read a story**.
- Below the actions: **per-episode grid.** Each episode is a small card: title + a row of 10 stars (filled for earned, hollow for unearned), visually grouped as 3-3-3 + bonus (see below).
- **Remove every other stat** currently shown on the home screen (counts, times, completion percentages).

### Inline quiz panel (story mode)

Opens below the flagged turn; does not navigate away from the scene. Three sub-states:

1. **Ask** — prompt + options + optional [Hint] button. (Prompt is just the question — see "Prompt rewrite" below.)
2. **Reveal** — right/wrong indicator, correct answer highlighted, feedback text, takeaway. The student's selected option remains visible so they see their choice alongside the response.
3. **Closed** — collapsed chip under the turn ("Answered ✓ — tap to review"). Opening it re-shows the Reveal state; the quiz does not become re-playable.

No page transitions. One scroll position.

### End-of-episode screen

- Shows **only the 10 stars for this episode**, large, grouped as **3-3-3 + bonus** with a visible gap between the level stars and the bonus.
- Two actions: **Read again** and **Home**.
- Nothing else — no time, no correct-answer count, no comparisons.

### Bottom nav bar

- **During an episode:** a compact row of the current episode's 10 stars, same 3-3-3 + bonus grouping, filled/hollow. Updates live as quizzes are answered.
- **On the home screen:** nav bar hides or collapses — no star row, since no episode is active.
- **Never a numeric tally** (no "7/10", no "3 ⭐"). Visual-only.

### Bonus star

- **Always visible**, always in position as the 10th slot, hollow until earned.
- Visually separated from the 9 level stars (gap + slightly different frame).
- Fills with a **subtle** animation on earn — not a confetti moment.

### Prompt rewrite

- Today's level prompts quote the flagged turn's text inline. This is redundant because the flagged turn is right there above the quiz panel.
- **New rule:** quiz prompts drop the quoted-turn preamble and ask the question directly. Saves ~40–60 words per level; removes duplication.
- Example: `"What is Cam doing with his source?"` instead of `"Cam says: '... [full quote] ...'. What is Cam doing with his source?"`.

---

## Artifact contract changes

### `lesson_package.yaml`

- **Bump `package_meta.schema_version` from `simplified_v1` to `simplified_v2`.** The new contract is incompatible with v1 (warmups removed, `focus_flaw` required, prompt rewrite, new `kind: action` turn affordance in the paired transcript). `validate_lesson_package.py` rejects any package whose `schema_version` is not `simplified_v2`. No in-place migration shim; the one existing v1 package (`the-white-squirrel/episode_01`) is hand-migrated as the fixture.
- **Remove the `warmups:` block entirely.** Warm-ups are replaced by practice mode, which lives outside the story artifact.
- **Keep `levels[]`**, exactly 3 entries. Each level keeps `turn_id`, options, feedback, hint, takeaway.
- **Add required `focus_flaw`** (canonical flaw_id from the taxonomy) to every level.
- **Drop the quoted-turn preamble** from each level's `prompt` per the new rule.
- `episode.summary`, `episode.previously`, `episode.final_takeaway` remain.

### `transcript.yaml`

- `scenes[]` length **≥ 3** (no hard upper bound in v2; 3–5 recommended for pacing).
- Each scene keeps `scene_id`, `summary`, `turns[]`.
- `turn_id` remains globally unique within the transcript.
- **New: non-dialog beats allowed inside `turns[]`.** Add a `kind` field with values `dialog` (default) or `action`. An action turn has no `speaker`; its `text` is a short stage/texture line (e.g. `"[James steps aside, comes back two minutes later.]"`). Action turns carry a `turn_id` like any other turn but are never the target of a level's `turn_id` reference. This is a schema affordance for the narrative-texture guidelines in §8 — not a requirement to use it on every turn.

### `episode-plan.yaml`

- Drop the warm-up planning fields (`warmup_candidate_goal` etc.).
- Still required to call out 3 primary-flaw moments with the amplification mix.
- Still required to emit per-level `focus_flaw` so downstream agents have a target.

### New: `practice_package.yaml`

- Lives at `simplified-framework/artifacts/practice/practice_package.yaml`.
- One entry per canonical flaw (5 entries total).
- Each entry: scenario (short), prompt, options, hint (always-free), worked explanation, takeaway.
- Own validator: `pipeline/scripts/validate_practice_package.py`.

### Validators

- `validate_transcript.py` — `len(scenes) ≥ 3` (no upper bound enforcement), scene-shape unchanged.
- `validate_lesson_package.py` — `len(levels) == 3`, `warmups` block forbidden, `focus_flaw` required and must resolve to the taxonomy.
- `validate_episode_plan.py` — drop warm-up candidate quotas; keep amplification-mix assertion; require `focus_flaw` per planned moment.
- `validate_practice_package.py` — new; 5 entries keyed by taxonomy.

### Pipeline agents

See [§ 8 Pipeline agents + authoring guidelines](#pipeline-agents--authoring-guidelines) for the full redesign. In brief: transcript writing splits into a narrative screenwriter pass and a flaw-injection pass; all agents inherit a shared register + narrative-texture guideline; the episode planner, flaw reviewer, and lesson package builder are updated to carry `focus_flaw` canonically, drop warm-up sections, and produce level prompts in the no-quoted-turn form.

---

## Pipeline agents + authoring guidelines

### Motivation

Two quality problems with generated content today:

1. **Register drifts above 6th grade** — scaffolding prose compresses ideas into abstract compound phrases (`"a certainty word doing work the source cannot back up"`, `"frames acceptance"`, `"credentialed in the right thing"`), and above-grade words sneak into dialog unflagged (`"dissertation"`).
2. **Stories read dry** — scenes have no sensory grounding, no non-dialog beats, no friction, pivots are undramatized, characters have voices but no bodies, and story-level running threads (Chekhov seeds, recurring gags) are sometimes never planted.

Both are agent-prompt problems, not schema problems. This section locks the agent contract and the guidelines they enforce.

### Two-pass transcript writing

The current `dialog_writer` juggles voice, plot, and flaw engineering at once; flaw engineering wins when they conflict. Split the job into two passes, same final artifact:

**Pass 1 — Screenwriter.**
- Input: a **projection** of `episode-plan.yaml` carrying plot, character arcs, scene intent, the wrong hypothesis the group pursues in this episode, running-thread obligations, and all sensory/pacing/voice notes.
- **Withheld from input:** flaw IDs, amplification labels, the canonical taxonomy, moment-placement hints. The screenwriter does not know the word "flaw" exists.
- Brief: narrative craft only — voice differentiation, friction, sensory grounding, scene beats, stakes, running threads. Produces a clean narrative draft: scenes with turns (dialog + action beats).
- Output is **ephemeral** — lives in the agent's working context, not on disk. No intermediate `narrative-draft.yaml` artifact.

**Pass 2 — Flaw injector.**
- Input: the screenwriter's draft + the full flaw target (primary `flaw_id`, required amplification mix of 1 `unmistakable` + 1 `showcased` + 1 `heightened`, supporting flaws).
- **Authorized to revise turns**, not just annotate. Strengthen a wobbly moment into `unmistakable`, nudge a second turn toward `heightened`, add or cut turns to land the mix.
- **Not authorized to reorder scene boundaries.** Scenes are the screenwriter's call; turn-level edits inside scenes are fair game.
- Output: final `transcript.yaml` + a moment-map in its context for the reviewer.

**Barrier.**
- Enforced by input projection only (no separate validator). The screenwriter agent's spec prohibits loading `reference/flaw-taxonomy.yaml`; the episode-plan projection given to the screenwriter has all flaw fields stripped.
- Simpler than the shared framework's two-agent-plus-projection-reviewer setup. The simplified framework does not need literal-scan enforcement because the screenwriter has no reason to emit flaw vocabulary in the first place.

**Flaw reviewer.** Contract unchanged. Still reads the plan + transcript and emits `flaw-review.md` with a go/no-go on whether each planned moment actually landed at the stated amplification. In the new flow, its acceptance rate should go up — the injector is specifically trying to satisfy it.

### Register / vocabulary guidelines

Applies to every agent that produces student-facing text (screenwriter, flaw injector, lesson package builder).

1. **Anchor at 6th grade; paraphrase borderline words in place, not later.** A student should not have to hold an abstract word in memory until a later scaffold unpacks it.
2. **No unflagged technical word.** Any above-grade noun in dialog must be flagged by a character as unfamiliar (*"bio-what?"*) or paraphrased by another character within the same turn cluster. Applies to any domain — scientific, medical, legal, technical.
3. **Dictionary text requires a kid-voice echo.** If a character reads a definition aloud, another character paraphrases it in plain words within 1–2 turns. Don't let formal phrasing stand alone.
4. **Scaffolding prose avoids compressed metaphors.** One clause per idea. Rewrite *"a certainty word doing work the source cannot back up"* as *"'basically proves' sounds strong, but the source can't back that up."*
5. **A load-bearing scaffold word cannot repeat without paraphrase.** If the 3 levels all hinge on one borderline concept word, rotate through paraphrases so the student meets it three different ways.

### Narrative-texture guidelines

Applies to the screenwriter; the flaw injector must preserve these when revising.

1. **Every scene has at least one sensory anchor.** Weather, light, sound, an object, a bodily sensation. One line somewhere in the scene, not every turn.
2. **Transitions are felt.** A scene change requires a visible shift — a time-jump line, a setting line, or an action beat. Cuts without a beat are disorienting.
3. **Non-dialog beats belong in the transcript.** Use the `kind: action` turn affordance. One beat per 3–5 turns is a healthy floor; more is fine when the scene asks for it.
4. **Friction every 3–4 turns.** A long run of agreement or compliance dries out the scene. Plant a push-back, a doubt, a joke, a tangent — any voice that resists the current direction.
5. **Pivots get a beat.** When evidence turns or a hypothesis deflates, the next turn is not the next argument — it is a pause, a reaction line, or a short physical beat. Half a second of air makes the reversal feel real.
6. **Characters have bodies and props.** Each main character carries one physical handle — a phone they wave, a hoodie string they pull, a water bottle, a notebook. Cheap to plant, high return on voice differentiation.
7. **Stakes visible in scene 1.** Within the first two or three turns, something plants why these particular characters care. Not exposition — a throwaway mention that reveals motive.
8. **Running threads land where promised.** Story-level engagement threads (seeds, callbacks, gags, easter eggs) must appear in the episode transcript where the story design calls for them. Missing a planted seed is a craft miss, not a choice.

### Readability pass (tightened)

- FK warning threshold drops from **grade 7 to grade 6**.
- **Scaffolding prose is upgraded from warning to hard error** on grade-above-6. The student-facing scaffolds cannot regress to the current state.
- Dialog stays on warning — register is primarily handled by the screenwriter guidelines, not a grade-level number.
- Min-sample guard from Phase 1 (skip short scenes / short scaffolding blocks) unchanged.

### Agent surface

Concretely, `pipeline/agents/` changes:

- **`screenwriter.md`** — new. Takes the projection of `episode-plan.yaml`, outputs a scene-structured draft. Carries the narrative-texture guidelines in its spec.
- **`flaw_injector.md`** — new. Takes draft + flaw target, outputs final `transcript.yaml`.
- **`dialog_writer.md`** — retired.
- **`episode_planner.md`** — updated to emit a projection for the screenwriter with all flaw fields stripped, alongside the full plan for the injector and reviewer.
- **`flaw_reviewer.md`** — unchanged contract.
- **`lesson_package_builder.md`** — updated to emit `focus_flaw` canonically, drop warm-ups, and produce prompts without the quoted-turn preamble.

### Small things pinned

1. **Screenwriter sees the wrong hypothesis the group pursues** — yes. It's plot, not flaw. The plan should phrase the hypothesis in story terms (*"the group pursues the alien-biosignature explanation"*), not flaw terms (*"the group over-trusts a credentialed source"*).
2. **Injector cannot reorder scene boundaries** — correct. Turn-level edits only.
3. **Narrative draft is ephemeral** — correct. No intermediate artifact on disk.

---

## App changes

### Route layout

- **Remove:** `/runs/[runId]/read`, `/runs/[runId]/warmup`, `/runs/[runId]/level/...`.
- **Add:**
  - `/` — home (practice / read-a-story picker + per-episode star grid).
  - `/practice` — picker over the 5 flaws.
  - `/practice/[flaw_id]` — single practice exercise (2-click flow).
  - `/runs/[runId]/scene/[n]` — story reader for scene n, with inline quizzes on flagged turns.
  - `/runs/[runId]/complete` — end-of-episode star screen.

### Phase state machine

- Collapses from `read → warmup → level → complete` to `scene_01 → … → scene_N → complete`.
- Practice is not a run phase; it's its own top-level surface.

### Prisma state

- **New `Student` entity.** The current Prisma schema is run-centric; practice completion is per-student across runs, which requires a student primary key that does not exist today. Add a `Student` entity and make `Run` and `PracticeAttempt` children of it. This is a known piece of new infrastructure in this batch.
- **Per-run:** one row per `(student_id, episode_id)`. Holds per-quiz attempts, hint-used flag, earned stars, bonus-earned flag, completion flag, current scene index, scene-high-water-mark. Never duplicated — re-reads reuse the same row per the run lifecycle rule in § 4.
- **Per-student (cross-run):** practice completion per flaw (`flaw_id → completed_at?`).
- Re-read semantics live in per-run state: attempted quizzes carry a `locked_at` timestamp; untried ones remain open.

### Components to build / replace

- **Home dashboard** — practice/read picker + per-episode star grid.
- **Practice picker + exercise surface** — new.
- **Scene reader** — replaces `ReadingSurface` + `LessonWorkspace`; renders turns chat-style with icons on flagged turns, supports previous/next scene navigation.
- **Inline quiz panel** — three sub-states (Ask, Reveal, Closed), as described in UI spec.
- **Star row component** — shared between home grid, end-of-episode screen, and nav bar. Always visual, never numeric.
- **Bottom nav bar** — star row when an episode is open; collapsed on home.

### Components to delete

- `src/app/runs/[runId]/read/*`, `warmup/*`, `level/*`.
- Reading-phase orientation components built in Phase 3 of the frozen todo (the shell can be reused; the phase plumbing cannot).

---

## Migration + end-to-end verification

### Fixture: `the-white-squirrel` ep 1

- Ep 1's current transcript already has 3 scenes and 3 levels — close to the new shape.
- Migrate it:
  - Remove the `warmups:` block from `lesson_package.yaml`.
  - Add `focus_flaw: trusting_a_source_too_quickly` to each of the 3 levels.
  - Rewrite level prompts to drop the quoted-turn preamble.
  - Keep scenes, turns, IDs, feedback, options untouched.
- This is the app-test fixture for the new UI.

### Practice package authoring

- Author the practice package from scratch: 5 mini-exercises, one per flaw, aligned to `reference/flaw-taxonomy.yaml`.
- Reuse phrasing from existing `worked_explanation` fields where appropriate, but keep each exercise self-contained.

### New 3-episode story (fresh verification)

- Premise TBD — agree before authoring.
- Run the full pipeline: `story.yaml` → 3 × `episode-plan.yaml` → 3 × `transcript.yaml` → 3 × `flaw-review.md` → 3 × `lesson_package.yaml`.
- Verify each artifact against the updated validators.
- Load into the new app; complete the full student flow end-to-end (practice first, then read all three episodes).

### Archive

- Move existing `artifacts/strangers-in-the-old-forest/` and `artifacts/the-white-squirrel/episode_0{2,3}` stubs (if any) into `artifacts/archive/`.
- `the-white-squirrel` ep 1 stays live as the migration fixture.

---

## Sequencing

1. **Contract first.** Update schemas, validators, and agent specs. No app or authoring work yet. Land the practice-package validator, the `focus_flaw` requirement, the `kind: action` turn affordance, and the `warmups` removal together. In the same step, split `dialog_writer` into `screenwriter` + `flaw_injector`, update the episode-plan projection, and tighten the readability pass to grade 6 per § 8.
2. **Migrate ep 1 fixture.** Convert `the-white-squirrel` ep 1 to the new contract by hand. Validate.
3. **Author the practice package.** 5 flaw exercises. Validate.
4. **App rebuild.** Build the new routes and components against the migrated ep 1 + practice package. Delete the old reading / warmup / level routes.
5. **New 3-episode story.** Design premise, author all three episodes through the updated pipeline. End-to-end smoke test in the app.

Parallelism: steps 2 and 3 can run alongside each other once step 1 ships. Step 4 depends on step 2 for a visual fixture; step 3 unlocks the practice surface independently. Step 5 depends on step 1 only — it can start as soon as the contract is frozen.

---

## Explicitly out of scope

- Teacher-facing dashboard.
- Cross-episode mixed-flaw review / interlude episodes.
- Adaptive re-attempts or replay variation.
- TTS / read-aloud.
- Any point/streak/timer mechanics beyond the 10-star scheme.
- Second-pass visual polish (micro-animations, theming) — land the star system + inline quiz shape first, tune later.
