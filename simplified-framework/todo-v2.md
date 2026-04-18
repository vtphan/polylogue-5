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
12. [Implementation plan](#implementation-plan)
13. [Explicitly out of scope](#explicitly-out-of-scope)

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

**Entry flow.** Identity selection is a precondition to the home screen, not a peer of the two primary actions. On a fresh install (no `active_student_id` cookie on the origin), the app opens a device-local name picker — "Who are you?" — which creates or selects a `Student` row (see § 9). Once a profile is active, the home screen renders; switching or adding a profile from the home screen is done via the active-profile chip at the top of the page (see § 6). The name picker does not reappear on every visit; it is gated on the presence of the cookie.

**Home screen** offers two choices:

- **Practice** — the tutorial library. Student picks a flaw, works through a short exercise. Shared across all stories; authored once.
- **Read a story** — pick an episode; read it scene by scene with inline quizzes on flagged turns. **Locked until all 5 practice exercises are completed once.**

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
- **Story-mode prerequisite.** A student must complete all 5 canonical practice exercises once before story mode unlocks. Replays remain available after unlock; the unlock condition is "5 of 5 completed_at present," not "most recently completed."
- **Same pattern, lighter surface.** Practice should clearly feel like the training version of a story quiz: same basic pattern of prompt → options → feedback → takeaway, but simpler and more explicit. It teaches the interaction pattern and flaw vocabulary before students meet the in-story version.

### Simpler click-through

Practice should feel lighter than story quizzes. Two-click flow:

1. **Tap an option** — auto-submits. Feedback, worked explanation, and takeaway render inline below the selected option.
2. **Tap "Done"** — returns to the picker.

No separate Submit, no separate Reveal, no per-step Next. The hint is always free to view in practice mode (no lifeline, no cost) and appears as an "Hint" pill the student can tap before choosing.

Practice intentionally does **not** mirror story quizzes 100%:

- **Keep:** the same basic answer shape, flaw naming, feedback pattern, and takeaway structure students will meet later in story mode.
- **Simplify:** one attempt only, free hint, no stars, shorter scenarios, and a slightly more explicit worked explanation than story quizzes use.
- **Avoid:** retry logic, score pressure, or dense narrative context. Practice teaches the pattern; story quizzes ask students to use that pattern inside the story.

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

### Orientation card (pre-scene)

- Before scene 1, the reader shows a single orientation card rendering `episode.previously` (present on ep 2+ only) followed by `episode.summary`. One **Continue** affordance advances to scene 1.
- Addressed as `scene_00` in the URL (e.g., `/runs/[runId]/scene/0`) for routing consistency, but it is **not** a scene in the phase machine — the phase machine still iterates `scene_01 → … → scene_N`. The orientation card is an introductory page before `scene_01`.
- Reachable from any scene via a "Back to start" affordance in the scene nav. On re-entry to an unfinished run, the reader lands on the student's last scene, not the orientation card; on re-entry to a finished run, the reader lands on `/complete` per § 4.
- `reading_finished_at` is unaffected by the orientation card — only advancing into scene N sets it.

### Flagged turns and inline quizzes

- Each episode has **exactly 3 quizzes** (renamed from "levels" at the UI layer, though the lesson package may still call them `levels[]` — see contract). The 3-quiz amplification mix (`unmistakable` / `showcased` / `heightened`) is unchanged.
- Each quiz is bound to one `turn_id`. That turn renders with a small icon indicating a flaw is present.
- **At most one quiz may live in a scene.** Scenes without a flagged turn are allowed, but no scene may hold two flagged turns that both target authored quizzes.
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

- **Completion is a milestone, not a terminal state.** Reaching the final scene sets `reading_finished_at` on the run. Writes to quiz state, stars, and the bonus-star flag continue afterward — the run is never closed or made read-only by completion. There is no v2 equivalent of the current terminal-completion latch.
- The milestone fires when the student **advances into the final scene** — i.e., taps Next on scene N-1. Scrolling within the final scene is not required, and no end-of-scene confirmation is needed. Zero quizzes attempted is a valid finish.
- Stars accumulate across sittings. A student can earn all 9 over several reads and still receive the 10th bonus star; the bonus fires at the moment the 9th star is earned, whenever that happens — before or after `reading_finished_at`.
- **`/complete` is a view, not a state transition.** The phase state machine (§ 9) never leaves scene-indexing; there is no "complete" phase node. `/complete` is an end-of-episode recap surface (the big 10-star screen with Read again / Home) that is reachable at any time from a finished run via an explicit affordance, and is the **default landing view** on re-entry to a finished run. The student can return from `/complete` to any scene — the scene reader remains interactive with untried quizzes still tappable.
- **Current terminal-completion paths must be reworked.** `app/src/lib/runs.ts` and `app/src/lib/routing.ts` today treat a completed run as frozen and route it to handoff. v2's "finished" is a durable flag on an open run, not a lock on writes. Named as a Step-4 obligation in § 11.

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

- **Active profile chip at top.** Shows the current student's name with an affordance to switch or add a profile (opens the device-local name picker — see § 9).
- Two primary actions: **Practice** and **Read a story**.
- Below the actions: **per-episode grid.** Each episode is a small card: title + a row of 10 stars (filled for earned, hollow for unearned), visually grouped as 3-3-3 + bonus (see below).
- **Grid ordering:** stories ordered by `story_id` ascending; within each story, episodes ordered by `episode_id` ascending (authored sequence). No completion-based reordering; the grid stays stable across re-entries so students can count on finding episodes in the same place.
- **Remove every other stat** currently shown on the home screen (counts, times, completion percentages).

### Story picker

- The **Read a story** primary action opens the story picker.
- If practice is incomplete, tapping **Read a story** redirects to `/practice` instead of opening the picker.
- Flat list, grouped under story headings. Each story heading shows the story title (from `story.yaml.title`). Below it, the story's episodes are listed in authored sequence, with the same 10-star progress row as the home grid and a tap target that opens or resumes the episode.
- Ordering matches the home grid (stories by `story_id`, episodes by `episode_id`). Stable across re-entries.
- Untouched episodes show an empty star row; in-progress episodes show accumulated stars and a "Resume" affordance; finished episodes show their full star state and open directly onto `/complete`.
- No search, filter, or favorites in v2 — the catalog is short enough to not need them.

### Inline quiz panel (story mode)

Opens below the flagged turn; does not navigate away from the scene. Three sub-states:

1. **Ask** — prompt + options + optional [Hint] button. (Prompt is just the question — see "Prompt rewrite" below.)
2. **Reveal** — right/wrong indicator, correct answer highlighted, direct explanation text, takeaway. The student's selected option remains visible immediately beside its explanation so they do not have to scan elsewhere to connect "what I picked" with "why it was or was not the best choice."
3. **Closed** — collapsed chip under the turn ("Answered ✓ — tap to review"). Opening it re-shows the Reveal state; the quiz does not become re-playable.

No page transitions. One scroll position.

Story quizzes should feel like the in-context version of Practice, not a different game. They reuse the same core reasoning pattern, but stay leaner and less explanatory because Practice has already taught the interaction model.

**Reveal copy rule:** the UI should use direct student-facing language, not abstract labels. Avoid generic section labels like "Feedback." Prefer copy in the shape of:

- **Best-answer explanation:** "This is the best answer because..."
- **Wrong-answer explanation:** "This is not the best answer because..."

Equivalent plain-language phrasing is fine, but the rule is the same: name the status directly and explain it in one move.

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
- **Hard authoring rule:** do not paste or paraphrase the flagged turn into the prompt. The turn is already highlighted in the reading column, so repeating it in the prompt makes the quiz more verbose without adding meaning.
- Example: `"What is Cam doing with his source?"` instead of `"Cam says: '... [full quote] ...'. What is Cam doing with his source?"`.

---

## Artifact contract changes

### `lesson_package.yaml`

- **Bump `package_meta.schema_version` from `simplified_v1` to `simplified_v2`.** The new contract is incompatible with v1 (warmups removed, `focus_flaw` required, prompt rewrite, new `kind: action` turn affordance in the paired transcript). `validate_lesson_package.py` rejects any package whose `schema_version` is not `simplified_v2`. No in-place migration shim; the one existing v1 package (`the-white-squirrel/episode_01`) is hand-migrated as the fixture.
- **Remove the `warmups:` block entirely.** Warm-ups are replaced by practice mode, which lives outside the story artifact.
- **Keep `levels[]`**, exactly 3 entries. Each level keeps `turn_id`, options, feedback, hint, and a required `takeaway`.
- **Add required `focus_flaw`** (canonical flaw_id from the taxonomy) to every level.
- **Drop the quoted-turn preamble** from each level's `prompt` per the new rule.
- **No two levels may target turns in the same scene.** `validate_lesson_package.py` cross-checks the paired transcript and rejects any package where two `turn_id`s resolve to the same `scene_id`.
- `episode.summary`, `episode.previously`, `episode.final_takeaway` remain.

### `transcript.yaml`

- `scenes[]` length **≥ 3** (no hard upper bound in v2; 3–5 recommended for pacing).
- Each scene keeps `scene_id`, `summary`, `turns[]`.
- `turn_id` remains globally unique within the transcript.
- **New: non-dialog beats allowed inside `turns[]`.** Add a `kind` field with values `dialog` (default) or `action`. An action turn has no `speaker`; its `text` is a short stage/texture line (e.g. `"[James steps aside, comes back two minutes later.]"`). Action turns carry a `turn_id` like any other turn but are never the target of a level's `turn_id` reference. This is a schema affordance for the narrative-texture guidelines in §8 — not a requirement to use it on every turn.

### `episode-plan.yaml`

- Drop the warm-up planning fields (`warmup_candidate_goal` etc.).
- Still required to call out 3 primary-flaw moments with the amplification mix.
- Still required to emit canonical `focus_flaw` on each planned flaw moment so downstream agents have a target. `episode-plan.yaml` does not use a separate `flaw_id` field for these moments; `focus_flaw` is the single canonical field name from plan → reviewer → lesson package.

### New: `practice_package.yaml`

- Lives at `simplified-framework/artifacts/practice/practice_package.yaml`.
- Exactly 5 exercises, one per canonical `flaw_id` in `reference/flaw-taxonomy.yaml`. Keyed by `flaw_id` in the `exercises` map. No more, no fewer.
- **Schema sketch:**
  ```yaml
  package_meta:
    schema_version: simplified_v2
  exercises:
    trusting_a_source_too_quickly:
      exercise_id: practice_trusting_a_source_too_quickly
      flaw_id: trusting_a_source_too_quickly
      title: <short, ≤ 6 words>
      scenario: >-
        <Self-contained mini-scenario. 2–4 turns of dialog OR one short
        situation paragraph. ≤ 80 words. Must not reference any story.>
      prompt: <One question. ≤ 30 words.>
      options:
        - option_id: p1a
          text: <best_fit>
          kind: best_fit
        - option_id: p1b
          text: <partial>
          kind: partial
        - option_id: p1c
          text: <off_target>
          kind: off_target
        - option_id: p1d
          text: I'm not sure yet.
          kind: uncertain
      hint: <≤ 30 words. Always free in practice — no star/lifeline cost.>
      feedback:
        correct:
          option_ids: [p1a]
          text: <≤ 50 words>
        by_option:
          p1b: <≤ 40 words>
          p1c: <≤ 40 words>
          p1d: <≤ 40 words>
      worked_explanation: >-
        <≤ 60 words. Plain-language unpack; lands after a correct answer
         in the Reveal state.>
      takeaway: <≤ 20 words. Single sentence.>
    # repeat the shape for the remaining 4 flaws
  ```
- **Validator: `pipeline/scripts/validate_practice_package.py`** enforces:
  - `package_meta.schema_version == "simplified_v2"`.
  - `exercises` map contains **exactly** the 5 canonical flaw_ids from the taxonomy.
  - Each exercise's top-level `flaw_id` matches its map key.
  - `options[]` contains exactly one `best_fit`, exactly one `uncertain`, ≥ 1 `partial`, ≥ 1 `off_target`.
  - `feedback.correct.option_ids` references the single `best_fit`.
  - `feedback.by_option` covers every non-`best_fit` option_id.
  - Word-cap warnings on the soft caps named in the schema sketch.
  - FK readability hard-error on scaffolding fields: `scenario`, `prompt`, `hint`, `feedback.correct.text`, every value in `feedback.by_option`, `worked_explanation`, `takeaway`.
- **Completion semantics.** An exercise is marked `completed_at` the first time the student submits an option (correct or not) and advances past the Reveal state via the Done affordance. Re-entering a completed exercise is always allowed; re-attempts do **not** update `completed_at`. No star state is tracked in practice.

### Validators

- `validate_transcript.py` — `len(scenes) ≥ 3` (no upper bound enforcement), scene-shape unchanged.
- `validate_lesson_package.py` — `len(levels) == 3`, `warmups` block forbidden, `focus_flaw` required and must resolve to the taxonomy, no two levels in the same scene.
- `validate_episode_plan.py` — drop warm-up candidate quotas; keep amplification-mix assertion; require `focus_flaw` per planned moment.
- `validate_practice_package.py` — new; 5 entries keyed by taxonomy.

### Catalog contract (new)

The current runtime is single-episode — one `episode.source` per active config (`app/src/lib/config.ts`). v2's home screen surfaces multiple episodes, which requires a catalog concept the runtime does not have today.

- **Source of truth: filesystem.** At app startup, scan `simplified-framework/artifacts/{story_id}/{episode_id}/` directories and register episodes in a new `CatalogEpisode` Prisma table keyed by `(story_id, episode_id)`.
- **Story-title source of truth:** `stories/{story_id}/story.yaml`. The scan reads each story's `story.yaml.title` once and stores it alongside the episode rows (or in a sibling `CatalogStory` table if that proves cleaner in Prisma). The home grid and story picker do not parse story YAML at request time.
- **Eligibility for registration: the full runnable artifact pair.** An episode is registered only if its directory contains **both** `lesson_package.yaml` (with `schema_version: simplified_v2`) **and** `transcript.yaml`. Either file missing → the episode is skipped and does not appear on the home screen. A package without its paired transcript is a pipeline-in-progress, not a shippable episode; the home screen must never list an episode that cannot actually open. Boot performs a structural parse only (valid YAML, required top-level keys present); the authoritative correctness check remains the Python validators in `pipeline/scripts/`, which run before artifacts land on disk.
- **Rescan triggers (spelled out):**
  - **Production / runtime:** boot-only. The scan runs once when the Next.js process starts; rows are upserted into Prisma and that set is authoritative until restart. New episodes require a redeploy. Acceptable because story content is authored offline and shipped via redeploy.
  - **Dev mode:** a file watcher on `simplified-framework/artifacts/**/{lesson_package,transcript}.yaml` re-runs the eligibility check and upserts or removes the affected `CatalogEpisode` row on change. Covers both runtime artifacts so eligibility transitions in either direction (adding a missing `transcript.yaml` to a previously skipped directory, or removing one from a registered episode) are picked up without a dev-server restart. Makes authoring iteration tight.
  - **No request-time rescan.** Home-page loads do not touch the filesystem; they read Prisma only.
- **Home page reads from Prisma.** The star grid and "Read a story" picker query `CatalogEpisode` joined to the student's `Run` rows. YAML is read once at boot, not on every page load.
- **Retire `configs/episode.json`.** Its fields (display title, opener text, etc.) move into the lesson package itself. The active-config loader goes away; there is no longer a notion of a single "active episode" at runtime.
- **Validator scope unchanged.** Discovery is a runtime concern; `validate_lesson_package.py` stays focused on artifact correctness.

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
- Input: a projection of `episode-plan.yaml` with all flaw fields stripped. Built by the `episode_planner` as a sibling output of the full plan; passed to the screenwriter in-context. Ephemeral — not written to disk. Exact shape:
  ```yaml
  story_id: <str>
  episode_id: <str>
  title: <str>
  narrative_synopsis: >-
    <episode_goal rewritten in plot and texture terms only, no flaw
     vocabulary. What happens, to whom, where, why it matters.>
  hypothesis_pursued: >-
    <the wrong explanation the group anchors on this episode, phrased as
     a plot anchor — e.g., "the group anchors on the alien-biosignature
     explanation.">
  disproof_event: >-
    <the visible beat that wobbles or disproves the hypothesis — e.g.,
     "Cam looks up biosignature and finds it is about microbial life on
     other planets.">
  scene_design:
    opening: <prose>
    turn: <prose>
    close: <prose>
  character_beats:
    - character_id: <id>
      beat: <voice, prop, physicality, and arc notes. Flaw references
             removed.>
  running_threads:
    - <story-level thread this episode must plant or pay off, in plot
       terms. e.g., "James dramatically names the squirrel Luminaria once.">
  plot_obligations:
    - <vocabulary-flagging obligations and must-happen beats, e.g., "the
       word biosignature appears in dialog, flagged by a character as
       unfamiliar, never narrator-explained.">
  scene_count_target: { min: 3, max: 5 }
  ```
- **Withheld from input:** `flaws[]` (IDs and amplification), `student_takeaway`, `flaw_embedding_guidance.must_include` / `.avoid`, `target_teachable_moments`, `warmup_candidate_goal`, `level_candidate_goal`, and `reference/flaw-taxonomy.yaml`. The screenwriter agent spec forbids loading the taxonomy. The screenwriter does not know the word "flaw" exists.
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
6. **Quiz prompts do not restate the highlighted turn.** The turn is already visible in the reader. Prompt text should ask the question directly, not quote, summarize, or repackage the turn again.

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
- **Fields that count as scaffolding prose (hard-error scope):**
  - `lesson_package.yaml`: `episode.summary`, `episode.previously`, `episode.final_takeaway`; each level's `prompt`, `hint`, `feedback.correct.text`, every value in `feedback.by_option`, and `takeaway`.
  - `transcript.yaml`: `scenes[].summary` (scene summary prose only — not the dialog turns).
  - `practice_package.yaml`: every exercise's `scenario`, `prompt`, `hint`, `feedback.correct.text`, every value in `feedback.by_option`, `worked_explanation`, `takeaway`.
- Dialog (`transcript.yaml scenes[].turns[].text` for turns with `kind: dialog`) stays on **warning only** — register there is primarily handled by the screenwriter guidelines, not a grade-level number.
- Action beats (turns with `kind: action`) are **exempt** from FK — they are terse stage lines, not prose.
- Min-sample guard from Phase 1 (skip short scenes / short scaffolding blocks under ~20 words) unchanged.

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
  - `/runs/[runId]/scene/[n]` — story reader for scene n (0 = orientation card, 1..N = scenes), with inline quizzes on flagged turns.
  - `/runs/[runId]/complete` — end-of-episode star screen.

### Cookie-precondition guard

- Next.js middleware reads the `active_student_id` cookie (§ 9). Requests to `/practice/*` or `/runs/*` without the cookie **redirect to `/`**, where the name picker renders. The home screen (`/`) is the single surface that handles the no-cookie case directly; every other student-facing route assumes an active profile.
- Story routes have a second guard: with `active_student_id` present but practice incomplete, requests to `/runs/*` redirect to `/practice`. The story-open server action applies the same guard before creating or resuming a run.

### Phase state machine

- Collapses from `read → warmup → level → complete` to scene-indexing only: `scene_01 → scene_02 → … → scene_N`. There is no terminal "complete" node in the phase machine.
- `reading_finished_at` is a timestamp milestone on the run (§ 4), not a phase. It is set when the student first enters scene N; the student remains in scene N after that until they navigate elsewhere.
- `/runs/[runId]/complete` is a **view**, reachable at any time from a finished run and the default landing on re-entry. It is not a phase and does not close the run.
- Practice is not a run phase; it's its own top-level surface.

### Prisma state

- **New `Student` entity.** The current schema is run-centric; practice completion is per-student across runs, which requires a student primary key that does not exist today. Add a `Student` entity and make `Run` and `PracticeAttempt` children of it.
- **Student model: device-local, multi-profile, no authentication.** A device may carry N `Student` rows. On a fresh install the home screen shows "Who are you?" with a single text-input affordance; submitting creates a `Student` row. On a device with existing profiles, the home screen shows the existing names with a "+ New" affordance. No password, no recovery, no network identity — students on two devices are two different `Student` rows. This preserves the shared-classroom-device use case without introducing auth. See § 12 for what is out of scope (network-synced accounts).
- **Active-profile transport: `active_student_id` cookie.** The selected `Student.id` is written to a non-HttpOnly cookie on the origin so that both Next.js server components / server actions (via `cookies()`) and the client profile chip (via `document.cookie`) read the same value. Not signed — identity selection is not authentication, and impersonation is not a threat model on a shared classroom device. The cookie is the single source of truth for "who is currently active." `localStorage` is not used for identity.
- **Product decision, explicit.** v2 replaces the current config-driven single-identity model with this device-local multi-profile picker. This is a product call, not just a schema move.
- **New `CatalogEpisode` entity.** Mirrors a v2 lesson package at `(story_id, episode_id)`, populated by the boot-time filesystem scan in § 7. Home-screen queries join `Student × CatalogEpisode × Run` for the per-episode star grid.
- **Per-run:** one row per `(student_id, story_id, episode_id)`. Holds per-quiz attempts, hint-used flag, earned stars, `bonus_earned_at`, `reading_finished_at`, current scene index, scene-high-water-mark. Never duplicated — re-reads reuse the same row per § 4. **No terminal / closed state.** The current `Run.state = completed` model is replaced by the `reading_finished_at` timestamp milestone.
- **Run row creation timing.** A `Run` row is created by a dedicated open-or-resume server action that already knows `(student_id, story_id, episode_id)`. Tapping an episode card on the home grid or in the story picker posts those ids; the server action looks up the existing run for that tuple or creates it, then redirects to `/runs/[runId]/scene/0` (orientation) or `/runs/[runId]/complete` when `reading_finished_at` is already set. The `/runs/[runId]/scene/*` route itself never creates a run from bare `runId`; if the `runId` is unknown, it 404s. There is no explicit Start button, but there is also no route-time inference from `runId` alone.
- **Per-student (cross-run):** practice completion per flaw (`flaw_id → completed_at?`).
- **Practice-unlock derivation:** story mode unlocks when all 5 canonical `PracticeAttempt.completed_at` values are present for the active student. No separate `practice_complete` boolean is required unless a later performance pass proves it necessary.
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

### Main-branch safety

v2 is not a set of additive changes. Step 1 removes schema affordances (`warmups`) the current runtime hard-requires (`app/src/lib/domain.ts`), Step 2 migrates the live fixture into a form the current app cannot load, and Step 4 swaps the phase state machine entirely. **All v2 work happens on a dedicated `v2` feature branch.** `main` stays on v1 until the full contract + migration + app flip land together in a single atomic merge. No half-migrated state on `main` — intermediate breakage lives on the branch only.

### v1 database state on the v2 branch

The v2 Prisma schema is incompatible with v1 (`Student`, `CatalogEpisode`, `reading_finished_at` milestone, no `Run.state` completion). **Dev-only reset, no migration script.** The v2 branch runs `prisma migrate reset` against a fresh database when brought up; no production student data exists yet, so a hard reset is the right move. If the v2 branch needs to rebase against new v1 work during development, reset again — do not attempt to preserve v1 `Run` rows.

---

## Implementation plan

Organized by the five phases in § 11. Medium granularity — each item is a 1–3 hour chunk with explicit **Entry**, **Work**, **Exit**, and **Files** fields. Intended as the executable checklist once work starts. Steps run sequentially within a phase; cross-phase parallelism follows the rules in § 11.

### Step 1 — Contract first (pipeline only, no app changes)

**1.1. Bump `schema_version` to `simplified_v2` in lesson_package validator.**
- *Entry:* v2 branch created; `main` current.
- *Work:* `validate_lesson_package.py` accepts only `simplified_v2`; rejects `simplified_v1` with a helpful "v1 → v2 migration required" error.
- *Exit:* running the validator on the current ep 1 package fails cleanly with the migration message.
- *Files:* `pipeline/scripts/validate_lesson_package.py`, `schemas/lesson_package.yaml`.

**1.2. Remove `warmups` block from lesson_package schema + validator.**
- *Entry:* 1.1.
- *Work:* delete `warmups` from the schema sketch; validator rejects any package containing a `warmups:` key; add required `levels[].takeaway` to the v2 lesson-package contract so the inline Reveal state can render authored takeaways without fallback text.
- *Exit:* v2-shaped fixture validates; any package with `warmups:` fails with a named-field error.
- *Files:* same as 1.1.

**1.3. Require `focus_flaw` on every level.**
- *Entry:* 1.2.
- *Work:* validator asserts `focus_flaw` is present on every level and resolves to a canonical id in `reference/flaw-taxonomy.yaml`.
- *Exit:* missing or invalid `focus_flaw` fails with the offending level named.
- *Files:* same as 1.1.

**1.4. Add `kind: action` turn affordance to transcript.**
- *Entry:* 1.1.
- *Work:* `validate_transcript.py` accepts `kind` on turns (`dialog` default; `action` allowed with no `speaker`); preserves global `turn_id` uniqueness; `validate_lesson_package.py` cross-checks the paired transcript and rejects any level whose `turn_id` points at an action turn.
- *Exit:* transcript with action beats validates; a lesson package referencing an action turn fails with a clear error.
- *Files:* `pipeline/scripts/validate_transcript.py`, `schemas/transcript.yaml`, `pipeline/scripts/validate_lesson_package.py`.

**1.5. Enforce transcript `len(scenes) ≥ 3`.**
- *Entry:* 1.4.
- *Work:* `validate_transcript.py` hard-fails fewer than 3 scenes; no upper bound. In the same validator batch, `validate_lesson_package.py` enforces that no two authored levels resolve to turns in the same scene.
- *Exit:* a 2-scene transcript fails; 3–5-scene transcripts pass.
- *Files:* `pipeline/scripts/validate_transcript.py`.

**1.6. Create `validate_practice_package.py` + schema.**
- *Entry:* 1.3.
- *Work:* new validator per § 7 spec (schema_version, exactly 5 exercises keyed by flaw_id, options shape, feedback coverage, word-cap warnings).
- *Exit:* validator rejects malformed practice packages with specific errors; well-formed one passes.
- *Files:* `pipeline/scripts/validate_practice_package.py` (new), `schemas/practice_package.yaml` (new).

**1.7. Tighten FK readability pass (grade 6 hard-error on scaffolding prose).**
- *Entry:* 1.3, 1.4, 1.6.
- *Work:* move FK threshold to grade 6; promote to hard error on the field list in § 8; wire into all three validators. Dialog stays on warning; action beats exempt; min-sample guard unchanged.
- *Exit:* a known above-grade scaffolding phrase hard-fails; an above-grade dialog phrase only warns.
- *Files:* `pipeline/scripts/_common.py`, `validate_lesson_package.py`, `validate_transcript.py`, `validate_practice_package.py`.

**1.8. Prune episode-plan validator.**
- *Entry:* 1.1.
- *Work:* drop `warmup_candidate_goal` check; keep amplification-mix assertion; add a requirement that every planned flaw moment in `flaws[]` carries an explicit canonical `focus_flaw`.
- *Exit:* existing ep 1 plan re-validates after a minor edit; new plans without warm-up fields pass.
- *Files:* `pipeline/scripts/validate_episode_plan.py`, `schemas/episode-plan.yaml`.

**1.9. Split `dialog_writer.md` into `screenwriter.md` + `flaw_injector.md`.**
- *Entry:* 1.1–1.8.
- *Work:* author the screenwriter spec (narrative-texture guidelines, barrier-safe projection input per § 8) and the flaw-injector spec (revise-turns authority, no scene-boundary edits); delete `dialog_writer.md`.
- *Exit:* both specs in `pipeline/agents/`; a test invocation on the ep-1 projection runs cleanly.
- *Files:* `pipeline/agents/screenwriter.md` (new), `pipeline/agents/flaw_injector.md` (new), `pipeline/agents/dialog_writer.md` (deleted).

**1.10. Update `episode_planner.md` to emit the screenwriter projection.**
- *Entry:* 1.9.
- *Work:* planner spec documents both outputs — full `episode-plan.yaml` and the in-context projection (field list per § 8).
- *Exit:* invoking the planner on the existing ep 1 produces both outputs.
- *Files:* `pipeline/agents/episode_planner.md`.

**1.11. Update `lesson_package_builder.md` for v2.**
- *Entry:* 1.3.
- *Work:* spec emits `focus_flaw` canonically, emits required per-level `takeaway`, omits warmups, drops the quoted-turn preamble from level prompts, and explicitly forbids quoting or paraphrasing the highlighted turn inside the prompt text.
- *Exit:* a builder run on the migrated ep 1 transcript produces a v2-valid package.
- *Files:* `pipeline/agents/lesson_package_builder.md`.

**1.12. Sync `CLAUDE.md` and `docs/` to v2.**
- *Entry:* 1.1–1.11.
- *Work:* reword the `CLAUDE.md` engagement-invariant list to reflect stars + bonus (replacing the lifeline-bonus language); update `docs/instructional-design.md` to the new phase model; update `docs/tech-reference.md` for the Prisma additions and routing changes.
- *Exit:* docs reference v2 shapes only; no stale v1 vocabulary.
- *Files:* `CLAUDE.md`, `simplified-framework/docs/instructional-design.md`, `simplified-framework/docs/tech-reference.md`.

### Step 2 — Migrate ep 1 fixture

**2.1. Migrate `the-white-squirrel/episode_01/lesson_package.yaml` to v2.**
- *Entry:* Step 1 complete.
- *Work:* bump `schema_version`; remove the `warmups` block; add `focus_flaw` and required `takeaway` to each level; rewrite level prompts to drop the quoted-turn preamble.
- *Exit:* `validate_lesson_package.py` passes on the migrated file.
- *Files:* `artifacts/the-white-squirrel/episode_01/lesson_package.yaml`.

**2.2. Spot-check the paired transcript.**
- *Entry:* 2.1.
- *Work:* confirm `validate_transcript.py` passes; optionally insert one `kind: action` beat to exercise the new affordance and anchor the narrative-texture guidelines against real content.
- *Exit:* transcript validates.
- *Files:* `artifacts/the-white-squirrel/episode_01/transcript.yaml`.

### Step 3 — Author the practice package

**3.1. Author `practice_package.yaml`.**
- *Entry:* Step 1 complete.
- *Work:* write five exercises (one per canonical flaw) per the schema in § 7. Reuse phrasing patterns from the existing v1 worked-explanations where they are already in-register.
- *Exit:* `validate_practice_package.py` passes with no warnings; the file is sufficient to unlock story mode once a student has completed all 5 exercises.
- *Files:* `artifacts/practice/practice_package.yaml` (new).

### Step 4 — App rebuild

**4.1. Prisma schema migration.**
- *Entry:* Steps 1–2 complete.
- *Work:* add `Student`, `CatalogEpisode`, `PracticeAttempt`; reshape `Run` per § 9 (remove `state = completed`; add `reading_finished_at`, `bonus_earned_at`, per-quiz attempt fields, `locked_at`, scene indexes); make `Run` and `PracticeAttempt` children of `Student`; `prisma migrate reset`.
- *Exit:* schema compiles; fresh dev DB seeds cleanly.
- *Files:* `app/prisma/schema.prisma`.

**4.2. Filesystem-scan catalog + dev watcher.**
- *Entry:* 4.1.
- *Work:* boot-time scan of `simplified-framework/artifacts/**` for eligible artifact pairs plus `stories/{story_id}/story.yaml` for display titles; upsert `CatalogEpisode` (and `CatalogStory` if used); dev watcher on `{lesson_package,transcript}.yaml` and story YAML in dev mode.
- *Exit:* app boot populates `CatalogEpisode` with ep 1; dev-mode file add/remove reflects without restart.
- *Files:* `app/src/lib/catalog.ts` (new), `app/src/instrumentation.ts`.

**4.3. Cookie-based identity middleware + name picker.**
- *Entry:* 4.1.
- *Work:* Next.js middleware redirects `/practice/*` and `/runs/*` without `active_student_id` to `/`; with `active_student_id` present but incomplete practice, `/runs/*` redirects to `/practice`; home renders the name picker when cookie missing; submission creates a `Student` row and sets the cookie.
- *Exit:* deep links without cookie redirect to home; creating a profile lands on the home grid.
- *Files:* `app/src/middleware.ts` (new), `app/src/app/page.tsx`, `app/src/lib/students.ts` (new).

**4.4. Home screen shell.**
- *Entry:* 4.2, 4.3.
- *Work:* profile chip, two primary actions (Practice / Read a story), per-episode star grid ordered by `(story_id, episode_id)`; Read a story is visibly locked until the active student has completed all 5 practice exercises.
- *Exit:* home renders ep 1's empty star row for a fresh student and shows the story action as locked before practice completion.
- *Files:* `app/src/app/page.tsx`, `app/src/app/_components/ProfileChip.tsx` (new), `app/src/app/_components/StarRow.tsx` (new).

**4.5. Story picker route.**
- *Entry:* 4.4.
- *Work:* flat list grouped by story heading, with Resume/Open targets that post `(story_id, episode_id)` to the open-or-resume server action and redirect from the server to the existing run or a newly created one; the action first checks the active student's 5-of-5 practice completion and redirects to `/practice` if story mode is still locked.
- *Exit:* tapping an ep 1 card resolves the canonical run and redirects to `/runs/[runId]/scene/0` for a fresh run or `/runs/[runId]/complete` for a finished run.
- *Files:* `app/src/app/stories/page.tsx` (new).

**4.6. Scene reader with orientation card.**
- *Entry:* 4.5.
- *Work:* `/runs/[runId]/scene/[n]`; n=0 renders the orientation card (previously + summary); n≥1 renders dialog + action beats chat-style with icons on flagged turns; bottom nav bar carries the live star row; Previous/Next affordances.
- *Exit:* ep 1 navigates from scene 0 through scene 3 with flagged-turn icons visible and nav bar updating.
- *Files:* `app/src/app/runs/[runId]/scene/[n]/page.tsx` (new), `app/src/app/runs/[runId]/_components/SceneReader.tsx` (new).

**4.7. Inline quiz panel.**
- *Entry:* 4.6.
- *Work:* Ask / Reveal / Closed sub-states; 2-attempt + 1-hint mechanic; 3-star scoring per § 5; wrong-option lockout; collapsed chip after submission; untried quizzes remain live on re-reads.
- *Exit:* completing a quiz awards the correct stars and persists; re-entry shows the locked Reveal.
- *Files:* `app/src/app/runs/[runId]/_components/QuizPanel.tsx` (new).

**4.8. End-of-episode view `/complete`.**
- *Entry:* 4.6, 4.7.
- *Work:* large 10-star layout (3-3-3 + bonus); Read again / Home actions; accessible at any time from a finished run (not a terminal state).
- *Exit:* advancing into the final scene sets `reading_finished_at`; visiting `/complete` shows the correct star state; returning to `/scene/[n]` works.
- *Files:* `app/src/app/runs/[runId]/complete/page.tsx` (new).

**4.9. Practice picker + exercise routes.**
- *Entry:* 4.3, Step 3 complete.
- *Work:* `/practice` lists 5 flaws with completion marks and the remaining unlock count; `/practice/[flaw_id]` runs the 2-click exercise; records `completed_at` on first submit past Reveal.
- *Exit:* completing one exercise persists; picker shows a check on return; completing all 5 unlocks story mode immediately for the active student.
- *Files:* `app/src/app/practice/page.tsx` (new), `app/src/app/practice/[flaw_id]/page.tsx` (new).

**4.10. Retire v1 routes and components.**
- *Entry:* 4.6–4.9 functional.
- *Work:* delete `/runs/[runId]/{read,warmup,level/*}`; delete `ReadingSurface`, `LessonWorkspace`, warmup components; rework `routing.ts` and `runs.ts` to the milestone model (no terminal `completed` state, no handoff-routing of finished runs).
- *Exit:* `tsc` clean; `next build` clean; no stale imports; no references to the old phase names.
- *Files:* `app/src/app/runs/[runId]/{read,warmup,level}/*` (delete), `app/src/lib/routing.ts`, `app/src/lib/runs.ts`.

**4.11. End-to-end smoke test on ep 1.**
- *Entry:* 4.10.
- *Work:* start the dev server, create a profile, verify story mode is locked, complete all 5 practice exercises, verify story mode unlocks, then complete ep 1 end-to-end; verify all 10 stars reachable including the bonus; verify re-entry to the finished run lands on `/complete` and allows scene re-reads.
- *Exit:* full flow works in the browser without errors or console warnings.
- *Files:* none (manual test).

### Step 5 — New 3-episode story (can start in parallel with Step 4 once Step 1 is frozen)

**5.1. Design the new story.**
- *Entry:* Step 1 complete.
- *Work:* use the `create_story` skill interactively with the operator; produce `story.yaml`.
- *Exit:* `validate_story.py` passes.
- *Files:* `stories/<new_story_id>/story.yaml`.

**5.2. Produce 3 episode plans.**
- *Entry:* 5.1.
- *Work:* `create_episodes` flow per episode; each plan carries canonical `focus_flaw` per planned moment and the amplification mix.
- *Exit:* 3× `validate_episode_plan.py` pass.
- *Files:* `artifacts/<new_story_id>/episode_0{1,2,3}/episode-plan.yaml`.

**5.3. Produce 3 transcripts via the two-pass agents.**
- *Entry:* 5.2.
- *Work:* for each episode invoke the screenwriter on its projection, then the flaw_injector on the draft; operator reviews texture and flaw placement; `flaw_reviewer` emits a go signal per episode.
- *Exit:* 3× `validate_transcript.py` pass; 3× `flaw-review.md` accepted.
- *Files:* `artifacts/<new_story_id>/episode_0{1,2,3}/{transcript.yaml,flaw-review.md}`.

**5.4. Produce 3 lesson packages.**
- *Entry:* 5.3.
- *Work:* `create_lesson_package` per episode.
- *Exit:* 3× `validate_lesson_package.py` pass.
- *Files:* `artifacts/<new_story_id>/episode_0{1,2,3}/lesson_package.yaml`.

**5.5. End-to-end verification in the app.**
- *Entry:* 5.4 and Step 4 complete.
- *Work:* restart dev app; new story appears in catalog + picker; complete practice + all 3 new episodes end-to-end.
- *Exit:* all artifacts render; all quizzes score correctly; all 10 stars per episode reachable; no console errors.
- *Files:* none (manual test).

---

## Explicitly out of scope

- **Network-synced student accounts across devices.** v2 supports multiple local `Student` profiles per device (see § 9) but does not authenticate them, sync them between devices, or offer password/recovery. A student on two devices is two separate rows. Revisit when a deployment context requires cross-device identity.
- Teacher-facing dashboard.
- Cross-episode mixed-flaw review / interlude episodes.
- Adaptive re-attempts or replay variation.
- TTS / read-aloud.
- Any point/streak/timer mechanics beyond the 10-star scheme.
- Second-pass visual polish (micro-animations, theming) — land the star system + inline quiz shape first, tune later.
