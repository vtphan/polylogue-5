# Polylogue v5 Architecture

## Relationship to v4

v4 (`simplified-framework/`) established the workflow: multiple human-in-the-loop commands, specialized subagents, persistent intermediate artifacts, and explicit operator approval gates between stages. That shape largely works. v5 inherits it — but with a tighter authoring surface.

v5 changes what the system authors and teaches, and also tightens how it authors. Four pivots:

1. **Taxonomy shape.** v4's flat flaw list is replaced by a reasoning taxonomy: six reasoning items across three lenses, each item carrying both a weak and a strong face. Weak-reasoning and strong-reasoning anchors become peers in the pipeline instead of "flaw" vs. "not-a-flaw."
2. **Audience fit enforced upstream, once.** Grade-level appropriateness is a story-design constraint authored into `story.yaml`. Downstream agents inherit it and do not re-check per turn.
3. **Anchor-turn revision authority.** `script_doctor` may revise the wording of a selected anchor turn so its reasoning move is audible in the line itself. The "transcripts are source dialogue, not analytic containers" rule is relaxed — but only for selected anchors, and only to make reasoning quality perceptible.
4. **Story and episode design merged into one interactive command.** v4 split story design (`/create_story`) from episode planning (`/create_episodes`). v5 merges them into `/design_story`, an interactive multi-phase session driven by the main orchestrator in co-design with the operator. Episode planning lives inside `story.yaml`; there is no separate `episode-plan.yaml`.

Additionally, v5 replaces the lesson package's flat single-question quiz with a three-step flow (claim → judgment → why) per anchor.

The remainder of this document describes v5 on its own terms.

---

## 1. Overview

Polylogue v5 is the next iteration of the simplified framework for teaching critical thinking to middle-school students. The system authors stories, transcripts, and lesson packages through a human-in-the-loop pipeline, then renders them in a deterministic student-facing app with no runtime LLM calls.

### Pipeline at a glance

```
STORY DESIGN ────────→ DETECTION ─────→ TEACHING ─────→ APP

/design_story          /create_         /create_lesson_    student
 (Phases A–D,           transcript      package            runtime
  main orchestrator,    (3 approval
  single story.yaml     gates)
  artifact)

                       staff_writer     lesson_package_    progressive
                       script_doctor    builder            reveal quiz
                       transcript_
                       structurer
```

Three commands. Four subagents. Four approval gates total (one at Phase D of `/design_story`, three inside `/create_transcript`).

### Path convention

All paths in this document are relative to the `v5/` directory at the repository root unless otherwise qualified. For example, `stories/{story_id}/story.yaml` refers to `v5/stories/{story_id}/story.yaml`. The top-level subdirectories under `v5/` are `docs/`, `reference/`, `schemas/`, `pipeline/`, `stories/`, `artifacts/`, and `app/`. The full directory map is in §5.4.

### Glossary

- **Lens** — broad family of reasoning concern: `logic`, `evidence`, `scope`.
- **Reasoning item** — specific reasoning dimension within a lens (e.g. `conclusion_support`).
- **Polarity** — which side of the dimension an anchor is on: `weak` or `strong`.
- **Anchor** — a transcript turn selected as a teaching moment. Each anchor resolves to a `(reasoning_item_id, polarity)` pair and carries an articulated `intended_claim`.
- **Claim** — what the speaker is trying to get others to believe or do.
- **Episode** — the instructional unit: one episode block in `story.yaml`, realized downstream as one transcript plus one lesson package.
- **Episode block** — the per-episode entry inside `story.yaml` carrying the operator's commitments for one episode.

---

## 2. Data Architecture

Four layers. Each layer owns a set of artifacts and a contract with the next layer.

### 2.1 Story-Design Layer

Establishes the world, the characters, and what each episode is *about*. Authoring is interactive; serialization produces a single artifact.

**Artifacts:**

- `stories/{story_id}/story.yaml` — the sole story-design artifact. Carries story-level design (premise, characters with voice hooks) and an ordered list of per-episode blocks. Each episode block holds the operator's commitments: `episode_id`, `title`, `episode_synopsis`, `reading_time_minutes`, `final_takeaway`, plus `word_count_range` (derived from `reading_time_minutes` at serialize time; see below). See `schemas/story.yaml`.
- `stories/{story_id}/story-design-review.md` — Phase D operator approval artifact. Transcript drafting may not start until `Status: approved` is present.

There is no separate episode-plan.yaml and no showrunner-projection.yaml. Episode design is authored into the `episodes[]` array of `story.yaml` during `/design_story` Phase C; `/create_transcript` reads `story.yaml` and selects the target episode block by id.

**Lean-schema discipline.** Each episode block holds three operator-authored fields (`episode_synopsis`, `reading_time_minutes`, `final_takeaway`) in addition to `episode_id` and `title`. `word_count_range` is derived from `reading_time_minutes` by the orchestrator at serialize time (150 WPM × ±1 minute tolerance) and stored as staff_writer's drafting guideline — the operator does not author it directly. Fields that tempted mechanical checklist authoring in v4 — per-episode flaw labels, lens declarations, plot-obligation lists, hypothesis labels, character beats — were intentionally trimmed. The discipline those fields once enforced now lives in the `/design_story` command doctrine and in the interactive conversation with the operator.

**Audience-fit constraint.** Student-facing text in `story.yaml` — `premise` and `final_takeaway` — is authored at 6th-grade reading level and rendered directly in the app. Story `title` and per-episode `title` are also student-facing (they render on selection screens and in scene chrome) and are held to a lighter bar: no adult-specialized vocabulary and no curriculum-label wording (for example, "Confirmation bias, pt. 1") — creative flair and in-world references are permitted. The `episode_synopsis`, though staff_writer-facing and never shown to students, is bounded by the same middle-school subject matter so the resulting dialogue inherits audience fit. Scene summaries in `transcript.yaml` (authored by `transcript_structurer`) and the episode summary and `previously` recap in `lesson_package.yaml` (authored by `lesson_package_builder`) are also student-facing and inherit the 6th-grade pitch. Enforcement is upstream at `/design_story` Phase D; downstream stages do not re-check per turn.

**Persuasive-thread discipline.** Every `episode_synopsis` must embed a persuasive thread — one character actively promoting an argument, intention, or position that others can examine, push back on, or extend. Without this pressure, reasoning stays latent and teaching anchors have to be manufactured after the fact. This is enforced conversationally during Phase C; it is not a schema field.

### 2.2 Reference Layer

**Artifact:** `reference/reasoning-taxonomy.yaml`.

**Shape:** six reasoning items organized under three lenses. Each item carries a `weak` face and a `strong` face of the same dimension.

```
lens: logic      →  conclusion_support, correlation_vs_causation
lens: evidence   →  evidence_sufficiency, source_credibility
lens: scope      →  perspective_consideration, conditions_and_consequences
```

Strong-reasoning anchors gain a real classification instead of being defined negatively. Every downstream stage that names reasoning quality resolves to a `(reasoning_item_id, polarity)` pair from this file.

### 2.3 Detection Layer

Identifies transcript turns that genuinely perform meaningful reasoning — weak or strong — and sharpens them into teaching-ready anchors.

**Artifacts (in stage order):**

- `artifacts/{sid}/{eid}/transcript.raw.yaml` — flat ordered turn list drafted by `staff_writer` from `story.yaml`, targeting the target episode's `word_count_range` as a soft length guideline. Source dialogue; no reasoning labels. Turns may use the literal string `narrator` as speaker for scene-setting and cohesion; most turns are character dialogue.
- `artifacts/{sid}/{eid}/reasoning-proposals.yaml` — anchor proposals from `script_doctor`. Per proposal:
  - `source_turn_ref` — pointer into the raw draft
  - `reasoning_item_id` and `polarity`
  - `intended_claim` — articulated by `script_doctor`
  - `revised_text` (optional) — sharpened wording when the anchor turn needs revision
  - five-criterion justification (argumentative / not-expressive / claim-clear / reasoning-audible / taxonomy-fit)
- `artifacts/{sid}/{eid}/transcript.post-doctor.yaml` — raw draft with operator-approved revisions applied in-place. Same flat-turn-list shape as the raw draft; turns whose text was revised additionally carry `original_text` (the pre-revision wording from the raw draft) and `source_proposal_id` (pointer into `reasoning-proposals.yaml`). Non-revised turns are byte-identical to their raw counterparts. Shape contract: `schemas/transcript-intermediate.yaml`, shared with the raw draft.
- `artifacts/{sid}/{eid}/transcript.yaml` — final app-facing transcript: segmented into 3+ scenes with summaries, produced by `transcript_structurer`.

**Speaker convention.** Character turns use the `character_id` from `story.yaml`'s `characters[]` roster as the `speaker` field. Narrator turns use the literal string `narrator`, which is not registered in the `characters[]` roster — the narrator is a voice, not a character. Turn ids follow the pattern `tNN` (`t01`, `t02`, ...) and are preserved verbatim across raw → post-doctor → final passes.

**Transcript-authority invariant.** `transcript.yaml` stays polarity-free source dialogue. Reasoning classification lives on `reasoning-proposals.yaml`; revised anchor wording propagates into `transcript.post-doctor.yaml` as applied text and is preserved verbatim by `transcript_structurer` into `transcript.yaml`. The lesson package is what binds reasoning metadata to the final anchor form.

**Five selection criteria** (all must hold before a turn becomes an anchor candidate):

1. The turn is doing argumentative work.
2. The turn is not merely expressive language (hype, humor, exaggeration).
3. The speaker's claim or intention is clear enough to state — it may be implied rather than literally stated in the line.
4. The reasoning quality is strongly expressed in the line itself — or `script_doctor` revises it until it is.
5. The turn maps to a specific `(reasoning_item_id, polarity)` pair.

**Polarity parity.** Weak and strong anchors are peers. A story may lean one way by design, but the pipeline does not privilege either polarity.

### 2.4 Teaching Layer

**Artifact:** `artifacts/{sid}/{eid}/lesson_package.yaml` — fully authored, deterministic content for the app.

**Episode chrome.** Each `lesson_package.yaml` carries an `episode` block with `title` (copied from `story.yaml`), `summary` (student-facing orientation shown before the transcript, soft cap ~60 words), `previously` (short recap, required when `episode_number > 1`, forbidden on episode 1), and `final_takeaway` (copied from `story.yaml`). `lesson_package_builder` authors `summary` and `previously` from the target episode's synopsis and — for `previously` — the prior episodes' synopses in `story.yaml`. `package_meta.episode_number` is derived from the target episode's 1-based index in `story.yaml`'s `episodes[]` array.

**Per-anchor level shape (three-step quiz):**

```
turn_id                                    # references a turn in transcript.yaml
reasoning_item_id, polarity
intended_claim
step_1_claim:         { prompt, options, feedback (correct + per-choice) }
step_2_judgment:      { prompt, options: [yes_strong, no_unsure], routing_text (optional) }
step_3:
  why_yes:            { prompt, options, feedback }
  why_no:             { prompt, options, feedback }
hint:                 (optional)
takeaway
```

**Anchor text rendering.** The lesson package references the anchor by `turn_id`; the app resolves speaker and text via `transcript.yaml` lookup. Revised anchor wording (if any) lives in the transcript as applied text, so a single lookup returns the final form.

**Authoring principle.** The app does no runtime inference. Every option, branch, and feedback string is pre-authored. Step 3's branch is selected by Step 2's answer — a constant lookup, not a decision. Step 2 may carry light `routing_text` (one sentence framing either choice) but does not have correctness feedback; the judgment is a reflection prompt, not a right/wrong test.

**Claim-identification binding.** Step 1's correct option is a close paraphrase of the anchor's `intended_claim`; distractors are plausible but distinct readings of the turn. This binds detection's claim articulation to the student-facing quiz — see Invariant §4.11.

### 2.5 App Layer

The student-facing app is a Next.js + React + TypeScript runtime with SQLite + Prisma. v5 changes only the quiz panel's internal behavior; the scene-reader flow, progress model, and engagement rules are otherwise unchanged.

**Per-anchor interaction** — one quiz panel, progressive reveal:

```
show anchor turn
  → reveal Step 1 → answered
  → reveal Step 2 → answered (yes | no)
  → reveal matching Step 3 branch → answered
  → show feedback and takeaway
```

**Grading.** Per-step, using `feedback.correct.option_ids` on each step.

**Runtime invariants:**

- **No real-time LLM.** Rendering is deterministic from `transcript.yaml`, `lesson_package.yaml`, the active config, and Prisma state.
- **Grading uses `feedback.correct.option_ids`**, not a scalar `best_answer_id`.
- **Finished is not frozen.** `reading_finished_at` marks the milestone, but a finished run remains open for untried quizzes and review. There is no "locked" state after completion.

**Engagement rules.** Episode-local stars only. No bonus stars, streaks, timers, leaderboards, cumulative totals, or public rankings.

---

## 3. Process Architecture

### 3.1 Commands

Three commands. Each is human-in-the-loop. On entry, each command identifies the artifacts it owns, reports any that already exist, asks the operator to confirm removal, and then runs fresh from a deterministic starting state. Ownership boundaries prevent a command from deleting an approved upstream artifact.

#### `/design_story`

- **Owns:** `stories/{sid}/story.yaml`, `stories/{sid}/story-design-review.md`
- **Reads:** operator conversation, `reference/reasoning-taxonomy.yaml`, `schemas/story.yaml`, `docs/instructional-design.md`
- **Handled by:** main orchestrator directly (no subagent)
- **Output:** a single story.yaml carrying story-level design and all per-episode blocks, plus a story-design-review.md capturing Phase D findings and operator sign-off.
- **Approval gate (Phase D):** operator approves lens coverage, persuasive threads per episode, audience fit, reading-time sanity, and the revisited premise wording. `Status: approved` in the review file is the load-bearing signal `/create_transcript` checks.
- **Validator:** `validate_story.py`

Phases (see `pipeline/commands/design_story.md` for the full doctrine):

- **Phase A** — world and voice: premise, characters with voice hooks
- **Phase B** — arc: episode map with narrative seeds
- **Phase C** — per-episode co-design: synopsis, reading time, final takeaway (with persuasive-thread and audience-fit discipline)
- **Phase D** — review and serialize: lens-coverage check, persuasive-thread check, audience-fit check, reading-time sanity, premise revisit (tighten the Phase A premise now that the episode arc is known), validator pass, sign-off

#### `/create_transcript`

- **Owns:** `transcript.raw.yaml`, `reasoning-proposals.yaml`, `transcript.post-doctor.yaml`, `transcript.yaml`
- **Reads:** `story.yaml` (whole), `story-design-review.md` (verifies approval), `reasoning-taxonomy.yaml`
- **Agents:** `staff_writer`, `script_doctor`, `transcript_structurer`
- **Arguments:** `{story_id} {episode_id}` — the story directory under `stories/` and the target episode block inside that story's `story.yaml`. Both required; episode ids are not globally unique across stories.
- **Output:** final app-facing transcript for that episode with approved reasoning anchors recorded in proposals.

Internal flow with three operator approval gates:

1. `staff_writer` drafts `transcript.raw.yaml` from `story.yaml` (the target episode block, with full story available for cross-episode context) → **Gate: raw-draft review**
2. `script_doctor` proposes anchors → `reasoning-proposals.yaml` → **Gate: proposal review**
3. `script_doctor` applies approved proposals → `transcript.post-doctor.yaml` → **Gate: post-doctor spot-check**
4. `transcript_structurer` segments into scenes → `transcript.yaml`

Intra-run revision loops (operator rejects a draft, requests another) re-invoke the relevant agent within the same run.

- **Validators:** `validate_reasoning_proposals.py`, `validate_transcript.py`

#### `/create_lesson_package`

- **Owns:** `lesson_package.yaml`
- **Reads:** `story.yaml` (episode metadata: title, final_takeaway), `transcript.yaml`, `reasoning-proposals.yaml`, `reasoning-taxonomy.yaml`
- **Agent:** `lesson_package_builder`
- **Arguments:** `{episode_id}`
- **Output:** deterministic three-step quiz package per approved anchor.
- **Validator:** `validate_lesson_package.py`

### 3.2 Agents

Four specialized subagents. The main orchestrator handles `/design_story` directly; no design subagent exists. Each subagent has a narrow scope and explicit reference-file access rules.

| Agent | Reads | Writes | Taxonomy access |
|---|---|---|---|
| `staff_writer` | `story.yaml` (target episode block + whole-story context) | `transcript.raw.yaml` | none |
| `script_doctor` | `transcript.raw.yaml`, `reasoning-taxonomy.yaml` | `reasoning-proposals.yaml`, `transcript.post-doctor.yaml` | full taxonomy |
| `transcript_structurer` | `transcript.post-doctor.yaml` | `transcript.yaml` | none; must preserve revised anchor wording exactly |
| `lesson_package_builder` | `transcript.yaml`, `reasoning-proposals.yaml`, `reasoning-taxonomy.yaml`, `story.yaml` | `lesson_package.yaml` | full taxonomy (both faces per item) |

**Key responsibilities:**

- **`staff_writer`** — drafts raw dialogue from the target episode block in `story.yaml`, with the full story available for cross-episode context (character voice, earlier plants, later payoffs). Picks up the persuasive thread from the episode_synopsis prose. Drafts toward the target episode's `word_count_range` as a soft guideline — strong story momentum takes precedence over exact length. Never reads the taxonomy. Permitted to use a lightweight `narrator` speaker for scene-setting and cohesion; most turns are character dialogue.
- **`script_doctor`** — identifies anchor candidates via the five criteria, articulates the `intended_claim`, classifies each as `(reasoning_item_id, polarity)`, and may revise anchor wording when reasoning quality is not audible in the line itself. Applies approved proposals to produce the post-doctor draft.
- **`transcript_structurer`** — segments the post-doctor draft into scenes with summaries. Preserves all `turn_id`s and revised anchor wording without modification.
- **`lesson_package_builder`** — authors the three-step quiz per approved anchor: claim question, judgment question, both why branches, per-choice feedback, optional hint, takeaway.

**Taxonomy access for the main orchestrator.** During `/design_story`, the main orchestrator reads `reasoning-taxonomy.yaml` for awareness — to recognize whether proposed episode synopses surface genuine reasoning opportunities and to check lens coverage at Phase D. It does not author reasoning items into `story.yaml`; reasoning items are detected by `script_doctor`, not declared at design time.

### 3.3 Pipeline Flow

```
/design_story                                              (main orchestrator)
  ├─ Phases A–D (interactive co-design)
  ├─ stories/{sid}/story.yaml                              ✓ validate_story
  └─ GATE: story-design-review.md (Phase D)                ← operator approval

/create_transcript {sid} {eid}
  ├─ staff_writer
  │     └─ transcript.raw.yaml
  │        GATE: raw-draft review                          ← operator approval
  ├─ script_doctor (propose)
  │     └─ reasoning-proposals.yaml                        ✓ validate_reasoning_proposals
  │        GATE: proposal review                           ← operator approval
  ├─ script_doctor (apply)
  │     └─ transcript.post-doctor.yaml
  │        GATE: post-doctor spot-check                    ← operator approval
  └─ transcript_structurer
        └─ transcript.yaml                                 ✓ validate_transcript

/create_lesson_package {eid}
  └─ lesson_package_builder
      └─ lesson_package.yaml                               ✓ validate_lesson_package
```

---

## 4. Invariants

These properties hold across all stages of v5. They are load-bearing.

1. **The taxonomy is the single pivot.** Every anchor in the system — proposal, post-doctor application, lesson level — resolves to a `(reasoning_item_id, polarity)` pair from `reference/reasoning-taxonomy.yaml`. No ad-hoc labels.

2. **Reasoning items are detected, not declared.** The operator commits to persuasive threads and story design at `/design_story`; reasoning items are chosen by `script_doctor` against the raw transcript. `story.yaml` does not carry per-episode reasoning-item targets or lens declarations. This is the load-bearing rule that keeps authoring story-first and detection honest.

3. **Transcript stays polarity-free.** `transcript.yaml` carries source dialogue only — no `reasoning_item_id`, no `polarity`, no classification metadata. Reasoning classification lives on `reasoning-proposals.yaml`. Revised anchor wording originates there as `revised_text`, is applied into `transcript.post-doctor.yaml`, and is preserved verbatim by `transcript_structurer` into `transcript.yaml`, so a single `turn_id` lookup returns the rendered line. The lesson package binds classification to the transcript-resident anchor.

4. **Deterministic runtime.** The app makes no LLM calls at student-time. Every quiz option, branch, and feedback string is authored upstream. Step 3 branch selection is a constant lookup on Step 2's answer, not a decision.

5. **Audience fit is an upstream constraint.** Enforced at `/design_story` Phase D on `story.yaml`'s student-facing fields. Downstream agents do not re-check per turn.

6. **Weak and strong anchors are peers.** Selection, authoring, and rendering are symmetric across polarities. A story may lean one way by design; the pipeline does not.

7. **Revision authority is scoped.** `script_doctor` may revise only turns it selects as anchors, only to make reasoning quality audible. Non-anchor turns remain source dialogue and are not subject to revision.

8. **Commands own their outputs.** On entry, each command clears only artifacts it owns, after operator confirmation. An approved upstream artifact is never deleted by a downstream command.

9. **Finished is not frozen.** A finished episode run remains open for retry of untried quizzes and review. No locked state after completion.

10. **Engagement is restrained.** Episode-local stars only. No bonus stars, streaks, timers, leaderboards, cumulative totals, or public rankings.

11. **Claim-identification binding.** On every teaching level, Step 1's correct option is a close paraphrase of the anchor's `intended_claim` as approved in `reasoning-proposals.yaml`; distractors are plausible but distinct readings of the turn. This is the load-bearing link between detection's claim articulation and the student-facing quiz — without it, `intended_claim` becomes decorative and Step 1 drifts away from the reading the operator approved.

---

## 5. Operational Appendix

### 5.1 Validators

All under `pipeline/scripts/`. Pure Python + PyYAML, no external deps.

| Script | Validates |
|---|---|
| `validate_story.py` | `story.yaml` — story-level fields plus per-episode blocks (episode_id, title, episode_synopsis, reading_time_minutes, final_takeaway) |
| `validate_transcript.py` | `transcript.yaml` — final app-facing transcript; 3+ scenes, global tNN uniqueness, polarity-free (rejects leakage of any reasoning/provenance fields onto turns) |
| `validate_reasoning_proposals.py` | `reasoning-proposals.yaml` — requires `reasoning_item_id`, `polarity`, `intended_claim`, five-criterion justifications; optional `revised_text` |
| `validate_transcript_post_doctor.py` | `transcript.post-doctor.yaml` — revision-provenance invariants: `original_text` ⟺ `source_proposal_id`; when both present, `text != original_text`; unrevised turns byte-identical to `transcript.raw.yaml` (raw-compare auto-discovered alongside, overridable via `--raw`) |
| `validate_lesson_package.py` | `lesson_package.yaml` — schema shape (three-step quiz per level, `schema_version: v5`, `previously` gating on `episode_number`), option/feedback integrity, and cross-refs against sibling `transcript.yaml` and `reasoning-proposals.yaml` (turn-id existence, approved-anchor match, anchor-appearance ordering) |

`story-design-review.md` is operator-authored prose and not a machine-checkable artifact.

### 5.2 Schemas

All under `schemas/`. Descriptive YAML contracts.

- `story.yaml`
- `transcript-intermediate.yaml` (shared by `transcript.raw.yaml` and `transcript.post-doctor.yaml`)
- `transcript.yaml`
- `reasoning-proposals.yaml`
- `lesson_package.yaml`

### 5.3 Bootstrap

`pipeline/scripts/initialize_polylogue.py` syncs `pipeline/commands/` and `pipeline/agents/` into repo-root `.claude/commands/` and `.claude/agents/`. Clears and replaces — does not merge. Operators run this once after checking out a v5 version that changed command or agent definitions.

### 5.4 Directory Map

```
v5/
  docs/
    architecture.md                    (this document)
    instructional-design.md
    operator-workflow.md
  reference/
    reasoning-taxonomy.yaml
  schemas/
    story.yaml
    transcript-intermediate.yaml
    transcript.yaml
    reasoning-proposals.yaml
    lesson_package.yaml
  pipeline/
    commands/
      design_story.md
      create_transcript.md
      create_lesson_package.md
    agents/
      staff_writer.md
      script_doctor.md
      transcript_structurer.md
      lesson_package_builder.md
    scripts/
      initialize_polylogue.py
      validate_story.py
      validate_transcript.py
      validate_reasoning_proposals.py
      validate_transcript_post_doctor.py
      validate_lesson_package.py
  stories/
    {story_id}/
      story.yaml
      story-design-review.md
  artifacts/
    {story_id}/
      {episode_id}/
        transcript.raw.yaml
        reasoning-proposals.yaml
        transcript.post-doctor.yaml
        transcript.yaml
        lesson_package.yaml
  app/                                 (student-facing runtime)
```

---

## 6. Phasing and Open Questions

Phasing, immediate next steps, and open design questions live in `todo-01.md` (sibling to this file's parent — `v5/todo-01.md`). This document describes what v5 *is*; `todo-01.md` describes how the team gets there.

Cross-references:

- §2.4 Teaching Layer — per-step vs. per-panel scoring for the three-step quiz is deferred to pilot regeneration.
