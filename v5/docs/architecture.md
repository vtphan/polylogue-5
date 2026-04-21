# Polylogue v5 Architecture

## Relationship to v4

v4 (`simplified-framework/`) established the workflow: four human-in-the-loop commands, six specialized agents, persistent intermediate artifacts, and explicit operator approval gates between stages. That shape works. v5 inherits it.

v5 changes what the system authors and teaches, not how it orchestrates. Three pivots:

1. **Taxonomy shape.** v4's flat flaw list is replaced by a reasoning taxonomy: six reasoning items across three lenses, each item carrying both a weak and a strong face. Weak-reasoning and strong-reasoning anchors become peers in the pipeline instead of "flaw" vs. "not-a-flaw."
2. **Audience fit enforced upstream, once.** Grade-level appropriateness is a story-design constraint authored into `episode-plan.yaml`. Downstream agents inherit it and do not re-check per turn.
3. **Anchor-turn revision authority.** `script_doctor` may revise the wording of a selected anchor turn so its reasoning move is audible in the line itself. The "transcripts are source dialogue, not analytic containers" rule is relaxed — but only for selected anchors, and only to make reasoning quality perceptible.

Additionally, v5 replaces the lesson package's flat single-question quiz with a three-step flow (claim → judgment → why) per anchor.

The remainder of this document describes v5 on its own terms.

---

## 1. Overview

Polylogue v5 is the next iteration of the simplified framework for teaching critical thinking to middle-school students. The system authors stories, transcripts, and lesson packages through a human-in-the-loop pipeline, then renders them in a deterministic student-facing app with no runtime LLM calls.

### Pipeline at a glance

```
STORY DESIGN ────→ REFERENCE ────→ DETECTION ─────→ TEACHING ─────→ APP

/create_story      reasoning-      /create_          /create_lesson_    student
/create_episodes   taxonomy.yaml   transcript        package            runtime
(+design gate)                     (3 approval
                                    gates)

story_designer                     staff_writer      lesson_package_    progressive
showrunner                         script_doctor     builder            reveal quiz
                                   transcript_
                                   structurer
```

### Path convention

All paths in this document are relative to the `v5/` directory at the repository root unless otherwise qualified. For example, `stories/{story_id}/story.yaml` refers to `v5/stories/{story_id}/story.yaml`. The six top-level subdirectories under `v5/` are `docs/`, `reference/`, `schemas/`, `pipeline/`, `stories/`, `artifacts/`, and `app/`. The full directory map is in §5.4.

### Glossary

- **Lens** — broad family of reasoning concern: `logic`, `evidence`, `scope`.
- **Reasoning item** — specific reasoning dimension within a lens (e.g. `conclusion_support`).
- **Polarity** — which side of the dimension an anchor is on: `weak` or `strong`.
- **Anchor** — a transcript turn selected as a teaching moment. Each anchor resolves to a `(reasoning_item_id, polarity)` pair and carries an articulated `intended_claim`.
- **Claim** — what the speaker is trying to get others to believe or do.
- **Projection** — the stripped story brief passed to `staff_writer`, distinct from the operator-facing episode plan.

---

## 2. Data Architecture

Five layers. Each layer owns a set of artifacts and a contract with the next layer.

### 2.1 Story-Design Layer

Establishes what an episode is *about* and what reasoning opportunity it creates.

**Artifacts:**

- `stories/{story_id}/story.yaml` — narrative umbrella: story id, title, student-facing premise, characters, setting, episode map.
- `artifacts/{sid}/{eid}/episode-plan.yaml` — per-episode planning artifact. Required fields:
  - `story_id`, `episode_id`, `title`
  - `episode_goal`, `student_takeaway`
  - `context` — what the episode is generally about (mood, theme, social situation)
  - `argument` — what one character is trying to get others to believe or do
  - `description` — creative episode concept satisfying the above
  - `lenses[]` — one or more of `logic`, `evidence`, `scope` (names match the reasoning taxonomy)
  - `character_beats` (optional)
- `artifacts/{sid}/{eid}/showrunner-projection.yaml` — stripped brief for `staff_writer`. Carries narrative synopsis, hypothesis pursued, disproof event, character beats, running threads, plot obligations, and the episode's `argument`.
- `artifacts/{sid}/{eid}/episode-design-review.md` — operator approval gate. Transcript drafting may not start until this is accepted.

**Argument vs. hypothesis.** `argument` names the persuasive thread — who is trying to convince whom of what. `hypothesis_pursued` (on the projection) names the wrong explanation the group anchors on as plot. They frequently overlap but are not identical; the exact relationship is an open design question tracked in `todo-01.md`.

**Audience-fit constraint.** The three story-design text fields (`context`, `argument`, `description`) are authored at 6th-grade reading level. Subject matter stays within a middle-schooler's direct experience. Enforcement is upstream; downstream stages inherit.

### 2.2 Reference Layer

**Artifact:** `reference/reasoning-taxonomy.yaml` (to be drafted; forward contract below).

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

- `artifacts/{sid}/{eid}/transcript.raw.yaml` — flat ordered turn list drafted by `staff_writer` from the projection. Source dialogue; no reasoning labels.
- `artifacts/{sid}/{eid}/reasoning-proposals.yaml` — anchor proposals from `script_doctor`. Per proposal:
  - `source_turn_ref` — pointer into the raw draft
  - `reasoning_item_id` and `polarity`
  - `intended_claim` — articulated by `script_doctor`
  - `revised_text` (optional) — sharpened wording when the anchor turn needs revision
  - five-criterion justification (argumentative / not-expressive / claim-clear / reasoning-audible / taxonomy-fit)
- `artifacts/{sid}/{eid}/transcript.post-doctor.yaml` — raw draft with operator-approved revisions applied in-place (still flat turn list, with proposal provenance).
- `artifacts/{sid}/{eid}/transcript.yaml` — final app-facing transcript: segmented into 3+ scenes with summaries, produced by `transcript_structurer`.

**Transcript-authority invariant.** `transcript.yaml` stays polarity-free source dialogue. Reasoning classification lives on `reasoning-proposals.yaml`; revised anchor wording propagates into `transcript.post-doctor.yaml` as applied text. The lesson package is what binds reasoning metadata to the final anchor form.

**Five selection criteria** (all must hold before a turn becomes an anchor candidate):

1. The turn is doing argumentative work.
2. The turn is not merely expressive language (hype, humor, exaggeration).
3. The speaker's claim or intention is clear enough to state.
4. The reasoning quality is strongly expressed in the line itself — or `script_doctor` revises it until it is.
5. The turn maps to a specific `(reasoning_item_id, polarity)` pair.

**Polarity parity.** Weak and strong anchors are peers. A story may lean one way by design, but the pipeline does not privilege either polarity.

### 2.4 Teaching Layer

**Artifact:** `artifacts/{sid}/{eid}/lesson_package.yaml` — fully authored, deterministic content for the app.

**Per-anchor level shape (three-step quiz):**

```
turn_id                                    # references a turn in transcript.yaml
reasoning_item_id, polarity
intended_claim
step_1_claim:         { prompt, options, feedback (correct + per-choice) }
step_2_judgment:      { prompt, options: [yes_strong, no_unsure] }
step_3:
  why_yes:            { prompt, options, feedback }
  why_no:             { prompt, options, feedback }
hint:                 (optional)
takeaway
```

**Anchor text rendering.** The lesson package references the anchor by `turn_id`; the app resolves speaker and text via `transcript.yaml` lookup. Revised anchor wording (if any) lives in the transcript as applied text, so a single lookup returns the final form.

**Authoring principle.** The app does no runtime inference. Every option, branch, and feedback string is pre-authored. Step 3's branch is selected by Step 2's answer — a constant lookup, not a decision.

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

**Engagement rules.** Episode-local stars plus a single bonus star. No streaks, timers, leaderboards, cumulative totals, or public rankings.

---

## 3. Process Architecture

### 3.1 Commands

Four commands. Each is human-in-the-loop. On entry, each command identifies the artifacts it owns, reports any that already exist, asks the operator to confirm removal, and then runs fresh from a deterministic starting state. Ownership boundaries prevent a command from deleting an approved upstream artifact.

#### `/create_story`

- **Owns:** `stories/{sid}/story.yaml`
- **Reads:** operator conversation
- **Agent:** `story_designer`
- **Output:** one story-level source artifact with characters, setting, episode map, and student-facing premise.
- **Validator:** `validate_story.py`

#### `/create_episodes`

- **Owns:** `artifacts/{sid}/{eid}/episode-plan.yaml`, `showrunner-projection.yaml`, `episode-design-review.md` (for every episode in the story)
- **Reads:** `stories/{sid}/story.yaml`
- **Agent:** `showrunner`
- **Output:** full episode-plan set in one run, each with its paired projection.
- **Approval gate (end of command):** operator reviews the episode designs and signs off via `episode-design-review.md`. Transcript drafting may not start until this is accepted.
- **Validator:** `validate_episode_plan.py`

#### `/create_transcript`

- **Owns:** `transcript.raw.yaml`, `reasoning-proposals.yaml`, `transcript.post-doctor.yaml`, `transcript.yaml`
- **Reads:** `story.yaml`, `episode-plan.yaml`, `showrunner-projection.yaml`, `episode-design-review.md`, `reasoning-taxonomy.yaml`
- **Agents:** `staff_writer`, `script_doctor`, `transcript_structurer`
- **Output:** final app-facing transcript with approved reasoning anchors recorded in proposals.

Internal flow with three operator approval gates:

1. `staff_writer` drafts `transcript.raw.yaml` from the projection → **Gate: raw-draft review**
2. `script_doctor` proposes anchors → `reasoning-proposals.yaml` → **Gate: proposal review**
3. `script_doctor` applies approved proposals → `transcript.post-doctor.yaml` → **Gate: post-doctor spot-check**
4. `transcript_structurer` segments into scenes → `transcript.yaml`

Intra-run revision loops (operator rejects a draft, requests another) re-invoke the relevant agent within the same run.

- **Validators:** `validate_reasoning_proposals.py`, `validate_transcript.py`

#### `/create_lesson_package`

- **Owns:** `lesson_package.yaml`
- **Reads:** `story.yaml`, `transcript.yaml`, `reasoning-proposals.yaml`, `reasoning-taxonomy.yaml`
- **Agent:** `lesson_package_builder`
- **Output:** deterministic three-step quiz package per approved anchor.
- **Validator:** `validate_lesson_package.py`

### 3.2 Agents

Six specialized agents. Each has a narrow scope and explicit reference-file access rules.

| Agent | Reads | Writes | Taxonomy access |
|---|---|---|---|
| `story_designer` | operator chat | `story.yaml` | none — story is plain student voice |
| `showrunner` | `story.yaml` | `episode-plan.yaml`, `showrunner-projection.yaml` | lens names only (`logic`, `evidence`, `scope`) |
| `staff_writer` | `showrunner-projection.yaml` | `transcript.raw.yaml` | none |
| `script_doctor` | `transcript.raw.yaml`, `reasoning-taxonomy.yaml` | `reasoning-proposals.yaml`, `transcript.post-doctor.yaml` | full taxonomy |
| `transcript_structurer` | `transcript.post-doctor.yaml` | `transcript.yaml` | none; must preserve revised anchor wording exactly |
| `lesson_package_builder` | `transcript.yaml`, `reasoning-proposals.yaml`, `reasoning-taxonomy.yaml`, `story.yaml` | `lesson_package.yaml` | full taxonomy (both faces per item) |

**Key responsibilities:**

- **`story_designer`** — conversational story-level drafting. Stays in student-facing voice.
- **`showrunner`** — drafts episode plans for the entire story in one run. Authors `context`, `argument`, `description`, declares `lenses[]` per episode. Never sees specific reasoning items.
- **`staff_writer`** — drafts raw dialogue from the projection. Picks up `argument` from the projection so the persuasive thread is authored by design. Never reads the taxonomy.
- **`script_doctor`** — identifies anchor candidates via the five criteria, articulates the `intended_claim`, classifies each as `(reasoning_item_id, polarity)`, and may revise anchor wording when reasoning quality is not audible in the line itself. Applies approved proposals to produce the post-doctor draft.
- **`transcript_structurer`** — segments the post-doctor draft into scenes with summaries. Preserves all `turn_id`s and revised anchor wording without modification.
- **`lesson_package_builder`** — authors the three-step quiz per approved anchor: claim question, judgment question, both why branches, per-choice feedback, optional hint, takeaway.

### 3.3 Pipeline Flow

```
/create_story
  └─ story_designer
      └─ stories/{sid}/story.yaml                          ✓ validate_story

/create_episodes
  └─ showrunner
      ├─ artifacts/{sid}/{eid}/episode-plan.yaml           ✓ validate_episode_plan
      ├─ artifacts/{sid}/{eid}/showrunner-projection.yaml
      └─ GATE: episode-design-review.md                    ← operator approval

/create_transcript
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

/create_lesson_package
  └─ lesson_package_builder
      └─ lesson_package.yaml                               ✓ validate_lesson_package
```

---

## 4. Invariants

These properties hold across all stages of v5. They are load-bearing.

1. **The taxonomy is the single pivot.** Every anchor in the system — proposal, post-doctor application, lesson level — resolves to a `(reasoning_item_id, polarity)` pair from `reference/reasoning-taxonomy.yaml`. No ad-hoc labels.

2. **Transcript stays polarity-free.** `transcript.yaml` is source dialogue for reader-facing rendering. Reasoning classification and revised anchor wording live on `reasoning-proposals.yaml`. The lesson package is what binds them.

3. **Deterministic runtime.** The app makes no LLM calls at student-time. Every quiz option, branch, and feedback string is authored upstream. Step 3 branch selection is a constant lookup on Step 2's answer, not a decision.

4. **Audience fit is an upstream constraint.** Enforced at `episode-plan.yaml` authoring. Downstream agents do not re-check per turn.

5. **Weak and strong anchors are peers.** Selection, authoring, and rendering are symmetric across polarities. A story may lean one way by design; the pipeline does not.

6. **Revision authority is scoped.** `script_doctor` may revise only turns it selects as anchors, only to make reasoning quality audible. Non-anchor turns remain source dialogue and are not subject to revision.

7. **Commands own their outputs.** On entry, each command clears only artifacts it owns, after operator confirmation. An approved upstream artifact is never deleted by a downstream command.

8. **Engagement is restrained.** Episode-local stars plus one bonus star. No streaks, timers, leaderboards, cumulative totals, or public rankings.

---

## 5. Operational Appendix

### 5.1 Validators

All under `pipeline/scripts/`. Pure Python + PyYAML, no external deps.

| Script | Validates |
|---|---|
| `validate_story.py` | `story.yaml` |
| `validate_episode_plan.py` | `episode-plan.yaml` — requires `context`, `argument`, `description`, `lenses[]` |
| `validate_transcript.py` | `transcript.yaml` |
| `validate_reasoning_proposals.py` | `reasoning-proposals.yaml` — requires `reasoning_item_id`, `polarity`, `intended_claim`, five-criterion justifications; optional `revised_text` |
| `validate_lesson_package.py` | `lesson_package.yaml` — three-step quiz shape per level |

### 5.2 Schemas

All under `schemas/`. Descriptive YAML contracts.

- `story.yaml`
- `episode-plan.yaml`
- `showrunner-projection.yaml`
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
  reference/
    reasoning-taxonomy.yaml
  schemas/
    story.yaml
    episode-plan.yaml
    showrunner-projection.yaml
    transcript.yaml
    reasoning-proposals.yaml
    lesson_package.yaml
  pipeline/
    commands/
      create_story.md
      create_episodes.md
      create_transcript.md
      create_lesson_package.md
    agents/
      story_designer.md
      showrunner.md
      staff_writer.md
      script_doctor.md
      transcript_structurer.md
      lesson_package_builder.md
    scripts/
      _common.py
      initialize_polylogue.py
      validate_story.py
      validate_episode_plan.py
      validate_transcript.py
      validate_reasoning_proposals.py
      validate_lesson_package.py
  stories/
    {story_id}/
      story.yaml
  artifacts/
    {story_id}/
      {episode_id}/
        episode-plan.yaml
        showrunner-projection.yaml
        episode-design-review.md
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

- §2.1 Story-Design Layer — the precise relationship between `argument` and `hypothesis_pursued` is flagged as an open design question.
- §2.2 Reference Layer — `reasoning-taxonomy.yaml` drafting is deferred; the file shape sketched here is the forward contract.
- §2.4 Teaching Layer — per-step vs. per-panel scoring for the three-step quiz is deferred to pilot regeneration.
