# TODO v5-01

> **Status: design-complete (2026-04-21).** All design ideas from this document have been incorporated into the canonical docs under `docs/` and the design_story command prompt under `pipeline/commands/`. Sections 1–3 below are preserved as the reasoning trail; the load-bearing statements now live in the docs listed in the status block. This file remains the home for implementation phasing, open questions, and forward-looking work.

> **Scope note.** v5 is the next version of simplified-framework, which can be considered as v4.  This is the first todo list of this v5, hence named v5/todo-01.md

> **Relationship to CLAUDE.md.** CLAUDE.md describes the current (simplified-framework or v4) version. This document describes v5 as the next version.  CLAUDE.md should not be viewed as holding ground truths and requirements that this document has to subscribe to.

## Current Status (2026-04-21)

v5 is in **design lock** with design complete. Every design decision in Sections 1–3 has been incorporated into the canonical docs. Implementation has started: `pipeline/commands/design_story.md` is drafted. Remaining command prompts, agent prompts, validators, and app updates are pending.

**Design-to-doc mapping:**

| Section in this file | Canonical home |
|---|---|
| §1 Story Design (persuasive thread, design frame, audience fit) | `docs/architecture.md` §2.1, `docs/instructional-design.md` §3, `pipeline/commands/design_story.md` |
| §2 Detection (five criteria, weakness/strength notes, revision policy) | `docs/architecture.md` §2.3 + §4 invariants, `docs/instructional-design.md` §4 |
| §3 Quiz Redesign (three-step flow, feedback policy, progressive reveal) | `docs/architecture.md` §2.4–2.5, `docs/instructional-design.md` §5 |
| Lens-reasoning-item relationship | `docs/architecture.md` §2.2, `docs/instructional-design.md` §2 |
| Narrator convention | `docs/instructional-design.md` §3.5, `schemas/transcript.yaml` |

**Design docs in place:**

- [`README.md`](README.md) — orientation and doc index
- [`docs/architecture.md`](docs/architecture.md) — four-layer data model, three-command / four-agent pipeline, invariants
- [`docs/instructional-design.md`](docs/instructional-design.md) — pedagogy: story-design frame, detection, three-step quiz, student journey, narrator role
- [`docs/operator-workflow.md`](docs/operator-workflow.md) — operator-facing workflow and approval gates
- [`reference/reasoning-taxonomy.yaml`](reference/reasoning-taxonomy.yaml) — six items × {weak, strong} across three lenses (to be drafted)
- [`schemas/`](schemas/) — four artifact shape contracts (story, transcript, reasoning-proposals, lesson_package)
- [`pipeline/commands/design_story.md`](pipeline/commands/design_story.md) — interactive multi-phase co-design command

**Major architectural shift from earlier drafts:** story design and episode planning are now a single interactive command (`/design_story`) handled by the main orchestrator, producing a single `story.yaml` that carries per-episode blocks. The separate `episode-plan.yaml` and `showrunner-projection.yaml` artifacts, the `showrunner` and `story_designer` subagents, and `/create_episodes` as a distinct command are all removed.

**Next implementation step:** remaining command prompts (`create_transcript`, `create_lesson_package`), four agent prompts, validators, bootstrap script, and app updates. See §Implementation Phases below.

## Executive Summary

v4 (simplified-framework) improved workflow, artifact boundaries, and operator approval surfaces.

v5 should improve the quality of what the system authors and teaches.

The next phase has three linked concerns:

1. story design
2. detection of strong and weak reasoning
3. teaching of reasoning recognition

These are related but distinct design layers.

- story design determines whether episodes naturally generate teachable argument
- reasoning detection determines whether the pipeline identifies the right turns as teaching anchors — weak or strong, treated as peers
- teaching design determines whether those turns become clear and useful lessons for students

## Why v5 Exists

The current system can now save, review, revise, and approve artifacts in a clearer way. That solved an important workflow problem.

But the recent review surfaced a deeper instructional issue:

- not every line that sounds broad, forceful, or imprecise is actually a good example of weak reasoning — nor does articulate, confident phrasing automatically indicate strong reasoning
- some selected anchor turns were inadequate because they depend too heavily on context or on adult interpretation

The next phase should focus less on orchestration and more on instructional design quality.

## Section 1: Story Design

### Goal

Episodes should be designed so reasoning worth teaching about — weak or strong — emerges naturally from believable social interaction, rather than being extracted post hoc from dialogue that was never built to teach.

### Current Direction

Each episode should contain at least one persuasive thread in which a character tries to convince another character of:

- a claim
- an explanation
- an interpretation
- or a course of action

That thread creates the conditions for reasoning to become visible and teachable.

### Design Frame

Story and episode design live in a single artifact, `stories/{story_id}/story.yaml`, authored interactively via `/design_story`. Each episode is a block with four required fields:

- `episode_synopsis` (required): one paragraph of story-voice prose. Carries the persuasive thread, plot beats, and episode-specific character action. This is the load-bearing field — it must embed a character actively promoting an argument, intention, or position.
- `reading_time_minutes` (required): operator-set target read length for an average 6th-grader (~4–5 turns per minute heuristic).
- `final_takeaway` (required): student-facing closing line.
- plus `episode_id` and `title`.

Persuasive-thread discipline and lens-coverage awareness are enforced conversationally during `/design_story` Phases C and D, not via schema fields. The earlier drafts of this section required `context`, `argument`, `description`, and `lenses[]` as labeled fields; those were dropped because labeled design fields push toward mechanical checklist authoring and duplicate signal that a rich synopsis already carries.

### Reasoning items are detected, not declared

`story.yaml` carries no per-episode reasoning-item targets, no lens declarations, no flaw labels, no density hints. The operator and main orchestrator hold taxonomy *awareness* during `/design_story` — enough to recognize whether a proposed synopsis will surface genuine reasoning opportunities and to check lens coverage across the story at Phase D. They do not commit specific reasoning items upfront. Reasoning items are chosen by `script_doctor` against the raw transcript.

### Audience Appropriateness

Student-facing text in `story.yaml` — `premise` and every `final_takeaway` — is pitched at a 6th-grade reader. Story `title` and per-episode `title` also render to students and are held to a lighter bar (no adult-specialized vocabulary, no curriculum-label wording; creative flair permitted). `episode_synopsis` is staff_writer-facing and never shown to students, but is bounded by the same middle-school subject matter so the resulting dialogue inherits audience fit. Subject matter stays inside a middle schooler's direct experience or routine media exposure: school, friends, family, sports, games, pets, online life, local community. Adult-specialized topics (finance, law, corporate, academic jargon) are out of bounds unless the story introduces them explicitly in-scene.

Enforcing audience appropriateness at `/design_story` Phase D means downstream stages do not re-check it per turn.

### Lens ↔ Reasoning-Item Relationship (reference)

The reasoning taxonomy organizes teaching content in three levels:

- **Lens** — the broad family of reasoning concern (`logic`, `evidence`, `scope`).
- **Reasoning item** — a specific reasoning dimension within a lens (e.g. `conclusion_support`, `evidence_sufficiency`).
- **Polarity** — which side of the dimension an anchor is on (`weak` or `strong`).

Each reasoning item carries both a weak face and a strong face of the same dimension. The taxonomy replaces v4's flaw-only vocabulary so that strong-reasoning anchors have a genuine classification rather than being defined as "not a flaw."

Mapping (authoritative source: `v5/reference/reasoning-taxonomy.yaml`):

- `logic`: `conclusion_support`, `correlation_vs_causation`
- `evidence`: `evidence_sufficiency`, `source_credibility`
- `scope`: `perspective_consideration`, `conditions_and_consequences`

### Resolved

- **Single planning artifact.** `story.yaml` carries both story-level design and per-episode blocks. There is no separate `episode-plan.yaml` and no `showrunner-projection.yaml`.
- **Single interactive design command.** `/design_story` handles world, arc, per-episode co-design, and review in one multi-phase session driven by the main orchestrator. `showrunner` and `story_designer` subagents are retired.
- **Lean per-episode fields.** Four required (episode_id, title, episode_synopsis, reading_time_minutes, final_takeaway). No labeled argument, no lens_hints, no reasoning-item targets, no plot obligations, no running threads, no character beats.
- **Reasoning items detected, not declared.** Load-bearing invariant: the operator commits to persuasive threads during design; `script_doctor` chooses reasoning items at detection.
- **Taxonomy shape.** Reasoning is modeled as six items × {weak, strong} across three lenses. This replaces v4's flaw-only taxonomy.
- **Anchor resolution.** Every anchor resolves to a `(reasoning_item_id, polarity)` pair from `v5/reference/reasoning-taxonomy.yaml`. Weak and strong anchors are peers.
- **Narrator convention.** Transcripts may use the literal string `narrator` as a speaker for lightweight scene-setting and cohesion. The narrator does not define vocabulary, explain reasoning, or moralize.

## Section 2: Detection Of Strong And Weak Reasoning

### Goal

`script_doctor` should identify turns that genuinely perform meaningful reasoning, distinguish stronger from weaker moves, and select the best reasoning turns as teaching anchors. Weak-polarity and strong-polarity anchors are peers at the detection level; neither is privileged.

### Selection Criteria

Anchor candidates should satisfy all five criteria:

1. The turn is doing argumentative work.
The speaker is trying to support, justify, persuade, reject, or conclude something.

2. The turn is not merely expressive language.
It is not just hype, emotion, humor, or conversational exaggeration.

3. The speaker's claim or intention is clear.
A reviewer and downstream artifact should be able to state what the speaker is trying to get others to believe — whether the claim is stated directly in the turn, or the turn is driving toward it through setup, invitation, or implication. If the intention can't be articulated as a specific claim, the turn fails this criterion.

4. The reasoning quality is clear and strongly expressed in the line itself.
The turn shows meaningfully strong or weak reasoning without heavy reconstruction or interpretation. If it does not, `script_doctor` should revise the turn so it does.

5. The turn maps to a specific `(reasoning_item_id, polarity)` pair from `v5/reference/reasoning-taxonomy.yaml`.
The reasoning move in the turn matches one reasoning item clearly enough to name it without speculation. If multiple items apply, `script_doctor` selects the primary one; secondary items may be recorded but do not drive the lesson.

Audience appropriateness (6th-grade accessibility) is not a detection-stage criterion — it is a story-design constraint enforced upstream in Section 1. If the episode's context and argument are pitched correctly, any turn that passes the five criteria will be usable with the target audience.

### Detection Notes

Weakness should be in the reasoning move, not merely in:

- casual wording
- conversational compression
- ordinary exaggeration
- lack of courtroom-level explicitness

Strength should likewise be in the reasoning move, not merely in:

- formal-sounding vocabulary
- articulate or confident delivery
- conventional politeness or caution
- invoking sources or terms without actually using them to reason

The system should not require speakers to state every premise out loud. The question is whether the support offered fits the conclusion drawn — strong enough to justify it, or weak relative to it.

Anchor selection treats weak-reasoning and strong-reasoning turns as peers. A story built around a character making careful, well-supported arguments is as legitimate a source of anchors as one built around a character making shaky ones. Individual episodes may lean one way or the other by design, but that lean is a story-level choice, not a pipeline-level default.

Unlike `todo-v4.md`, v5 should prefer candidate turns where the reasoning move is explicitly expressed in the line itself. It is not enough that a reasoning move can be inferred after explanation. For primary anchors, the reasoning quality — weak or strong — should be audible in the line itself, or made audible through revision.

### Dialogue Revision Policy

v5 explicitly allows reasoning-motivated dialogue edits. `script_doctor` may revise the wording of a candidate anchor turn so its reasoning move becomes audible in the line itself.

This is a deliberate departure from v4 and from the current CLAUDE.md rule that "transcripts are source dialogue, not analytic containers." That rule is relaxed *only* for selected anchor turns, and *only* to make reasoning quality perceptible.

Guardrails:

- the revised line must still sound like a believable middle school character in the episode, not a didactic narrator
- revisions must preserve the speaker's voice, stance, and social position in the scene
- revisions may sharpen the claim or the support, but must not invent new plot or new information
- non-anchor turns remain source dialogue and are not subject to reasoning-motivated revision
- the operator reviews revised anchor turns as part of acceptance; revisions that read as scripted should be rejected

In compact form:

- analyze lines as reasoning when they are trying to function as reasons
- do not confuse figure of speech with weak reasoning
- do not confuse articulate or formal delivery with strong reasoning
- only anchor turns where the intended claim and reasoning quality are both clear and explicitly expressed in the line itself

Absolute language and superlatives are not weakness triggers by themselves. Terms like `best`, `always`, `never`, `everywhere`, and `all of it` can be figure of speech, emphasis, or shorthand. They become reasoning-relevant when they are being used to support or close off an argument.

### Implications For `script_doctor`

`script_doctor` should:

- detect turns that are actually making or defending a claim
- avoid false positives from superlatives, hyperbole, or ordinary shorthand
- avoid false positives from articulate delivery or formal-sounding vocabulary that doesn't reflect real reasoning strength
- articulate what the speaker is trying to get others to believe
- identify whether those turns are stronger or weaker reasoning moves
- select anchors across both polarities, treating weak-reasoning and strong-reasoning turns as peers
- prefer candidate turns where the reasoning move is audible in the line itself
- revise candidate turns so the reasoning move — weak or strong — is more explicit when those turns are intended as lesson anchors

### Open Questions

- Should `script_doctor` score candidates on "argumentativeness" before evaluating reasoning quality?
- Should `script_doctor` explicitly classify a turn as expressive, descriptive, reflective, or argumentative before proposing it as an anchor?
- How should the intended claim be persisted so downstream lesson generation can use it directly?
- What is the target mix of weak-polarity and strong-polarity anchors per episode — fixed, story-declared, or emergent from detection?
- How aggressive should revision be when a turn is story-natural but its reasoning quality is not strongly expressed?

### Resolved

- **Anchor polarity parity.** Weak-reasoning and strong-reasoning anchors are peers at the detection level. `script_doctor` selects across both polarities; neither is privileged. A story may lean one way or the other by design, but that lean is a story-level choice, not a pipeline-level default.

## Section 3: Redesigning Reasoning Quizzes

### Goal

The goal is to redesign reasoning quizzes so they follow the natural order of reasoning analysis while staying simple enough for a middle school reader.

### Why This Change Helps

Students often struggle with reasoning questions because they do not first identify what the speaker is trying to get others to believe.

If the intended claim is unclear to the student, the later reasoning question becomes guesswork.

This first step should help students:

- identify the claim before judging the reasoning
- distinguish argument from expression
- understand what the speaker is trying to prove
- answer the later reasoning-quality question with less guessing

### Proposed Quiz Flow

The same three-step structure applies to both weak-reasoning anchors and strong-reasoning anchors. In the strong case, Step 2 resolves to "Yes, this is a strong argument," and Step 3 asks what makes it strong. In the weak case, Step 2 resolves to "No, I am not completely convinced," and Step 3 asks why it falls short.

The canonical flow should be a compact three-step quiz inside one anchor panel:

1. Claim
Question: What is this character trying to get the others to believe?

2. Judgment
Question: Do you buy this character's argument?

Core choices:

- Yes, this is a strong argument.
- No, I am not completely convinced.

3. Why
If the student chose `Yes`, ask what makes the argument strong.
If the student chose `No`, ask why the argument is not convincing.

This matches the natural sequence:

- identify the claim
- decide whether you buy it
- explain why

### Canonical Quiz Components

The redesigned quiz should borrow and reorganize these functions from the current scaffold:

- anchored turn
- claim-identification question
- buy / not-buy judgment question
- branch-specific reason question
- optional hint
- feedback
- takeaway

The issue is not the ideas in the current scaffold. The issue is that they are organized as a one-question quiz instead of a staged reasoning flow.

### Feedback Policy

v5 should keep per-choice feedback, but only where it does real instructional work.

Recommended default:

- Step 1 `claim`: keep per-choice feedback
- Step 2 `buy / not-buy`: no per-choice feedback, or only very light routing text
- Step 3 `why`: keep per-choice feedback

This keeps the judgment step lightweight while preserving detailed teaching on the claim-identification and final reasoning-analysis steps.

### Visual And Interaction Model

To minimize extraneous cognitive load, the quiz should use progressive reveal rather than showing every branch at once.

Recommended interaction:

- show the target turn
- show Step 1 only
- after Step 1 is answered, reveal Step 2
- after Step 2 is answered, reveal only the matching Step 3 branch
- after Step 3, show feedback and takeaway

This keeps the panel focused and avoids making the student scan irrelevant options.

### Lesson-Package Implication

To support this flow deterministically, the lesson package should carry enough authored data for all three steps.

At minimum, each selected anchor may need:

- a `reasoning_item_id` and `polarity` from `v5/reference/reasoning-taxonomy.yaml`
- the speaker's intended claim
- a claim-identification question with answer options
- a judgment question with the buy / not-buy choices
- a `why_yes` branch with answer options and feedback
- a `why_no` branch with answer options and feedback
- per-choice feedback for the claim-identification step
- optional hint text
- a takeaway

This would simplify the app because it would not need to infer the claim at runtime. It would simply render authored quiz content already present in `lesson_package.yaml`.

### App Logistics

The app should still treat the quiz as one anchored panel, but the inside of that panel should become a short staged flow rather than a single flat question.

That means the app can preserve:

- one quiz panel per anchor
- deterministic authored options
- optional hinting
- final feedback
- final takeaway

While changing the inside of the panel to:

- Step 1: claim
- Step 2: buy / not buy
- Step 3: branch-specific explanation

This is logically cleaner, visually lighter, and easier to follow than presenting all possible reasoning choices at once.

### Upstream Authoring Implication

This quiz change pushes one requirement upstream:

- `script_doctor` or a later lesson-building step must articulate the speaker's intended claim for each selected anchor
- upstream authored content must provide the branch-specific questions, options, and feedback rather than leaving the app to infer them

That strengthens anchor quality because turns should only be selected when the intended claim is clear enough to author into the lesson package.

### Open Questions

- Should this three-step flow appear on every anchor or only selected anchors?
- What is the best 6th-grade wording for the first question:
  - "What is this character trying to prove?"
  - "What is this character trying to get the others to believe?"
  - "What point is this character trying to make?"
- What is the best wording for the judgment question:
  - "Do you buy this argument?"
  - "Do you believe this character?"
  - "Is this a strong argument?"
- Should the claim, judgment, and branch question each have their own scoring, or should the panel score only once at the end?
- What is the minimum lesson-package shape change needed to support this without overcomplicating the app?

### Resolved

- **Anchor parity.** Weak-reasoning and strong-reasoning anchors use the same three-step structure (claim → judgment → why). Branches differ; the scaffold does not.
- **Strong-anchor identity.** Strong anchors are not "not-flaws" — they carry a real classification. Both weak and strong anchors resolve to a `(reasoning_item_id, polarity)` pair in `v5/reference/reasoning-taxonomy.yaml`, and each reasoning item supplies both faces (`weak` and `strong`) of the same dimension.

## Proposed v5 Outcome

v5 should produce clearer design guidance for three stages of the system:

1. design episodes so teachable argument naturally emerges
2. detect and revise strong and weak reasoning turns more accurately
3. redesign reasoning quizzes around a compact claim -> judgment -> explanation flow

If successful, v5 should reduce false positives, improve anchor quality, and make the lesson layer feel more legitimate to both operators and students.

## Implementation Phases

### Phase 0: Lock The Design

- finalize the episode-design frame in Section 1
- finalize the five selection criteria in Section 2
- finalize the three-step quiz model in Section 3
- decide the minimum `lesson_package.yaml` shape change needed for v5

### Phase 1: Story-Design Inputs

- author `/design_story` command file (done: `pipeline/commands/design_story.md`)
- ensure `story.yaml` schema carries per-episode blocks with four required fields (done: `schemas/story.yaml`)
- operator approval gate lives in `story-design-review.md` at end of Phase D; transcript drafting must not start until `Status: approved` is set
- no separate episode-plan or projection artifact; no `showrunner` / `story_designer` subagents

### Phase 2: Reasoning Detection

- update `script_doctor` and related review stages
- require them to:
  - detect strong and weak reasoning
  - enforce the five anchor criteria
  - articulate the intended claim
  - classify each anchor as a `(reasoning_item_id, polarity)` pair from `v5/reference/reasoning-taxonomy.yaml`
  - revise turns until reasoning quality is strongly expressed
- update the upstream proposals artifact (currently `flaw-proposals.yaml`; likely renamed `reasoning-proposals.yaml`) to persist, per anchor:
  - `reasoning_item_id` and `polarity`
  - intended claim
  - any revised wording
  - the source turn reference

### Phase 3: Lesson-Package Redesign

- redesign level internals around the three-step quiz flow
- preserve:
  - anchored turn
  - optional hinting
  - per-choice feedback for Step 1 and Step 3
  - takeaway
- remove the assumption that a level is one flat prompt with one flat option set

### Phase 4: App Implementation

- update app domain types and content loading
- update the quiz panel to support progressive reveal
- preserve one anchored quiz panel per level
- implement:
  - Step 1 claim question with per-choice feedback
  - Step 2 buy / not-buy routing
  - Step 3 branch-specific reasoning question with per-choice feedback
  - final takeaway
- decide how attempts, routing, and scoring work across the three steps

### Phase 5: Validation And Pilot Regeneration

- update `validate_lesson_package.py` and any related contract checks
- update schema/version markers if needed
- regenerate one pilot story, likely `the-white-squirrel`
- review whether the new anchors and quizzes are actually clear in practice

### Phase 6: Review And Tightening

- review generated episodes for:
  - anchor quality
  - claim clarity
  - quiz clarity
  - cognitive load
- tighten prompts and package shape based on real examples
- defer richer feedback or additional hint layers to v6 unless they prove necessary during pilot review

## Immediate Next Steps

Phase 0 (design lock) is substantially complete. The remaining design-level items are minor and can be resolved during implementation drafting:

- Finalize the exact wording of Step 1 and Step 2 quiz prompts (open question in §3 below); final wording lives in the `lesson_package_builder` prompt.
- Decide anchor-polarity mix per episode (§2 open questions): fully emergent from detection, or lightly guided in the `/design_story` Phase D review.

Next is implementation, in this order:

1. **Remaining command prompts** — draft `/create_transcript` and `/create_lesson_package` under `pipeline/commands/` (`/design_story` is done).
2. **Agent prompts** — draft the four agents under `pipeline/agents/`: `staff_writer`, `script_doctor`, `transcript_structurer`, `lesson_package_builder`. Each agent prompt derives its contract from the schemas, its pedagogy from `instructional-design.md`, and its pipeline role from `architecture.md`.
3. **Validators** — write `pipeline/scripts/validate_*.py` for the four artifact types (story, transcript, reasoning-proposals, lesson_package).
4. **Reasoning taxonomy** — draft `reference/reasoning-taxonomy.yaml` with the six items × {weak, strong}.
5. **Bootstrap** — write `initialize_polylogue.py` to sync v5 commands/agents into repo-root `.claude/`.
6. **Pilot regeneration** — run the pipeline end-to-end on one pilot story (likely `the-white-squirrel`).
7. **App updates** — adapt the simplified-framework Next.js app to render the three-step quiz with progressive reveal.

Validation and tightening happen against the pilot, not against hypothetical coverage.
