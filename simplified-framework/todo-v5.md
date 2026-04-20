# TODO v5

> **Status (2026-04-20):** Draft. Open planning document for the next phase after `todo-v4.md`.

> **Scope note.** v5 is not primarily a pipeline-mechanics revision. It is a design pass on how the system creates teachable reasoning episodes, detects strong and weak reasoning turns, and teaches students to recognize reasoning quality.

> **Relationship to CLAUDE.md.** CLAUDE.md describes the current (v4) version. This document describes v5 as the next version. Where v5 conflicts with current CLAUDE.md invariants — notably "transcripts are source dialogue, not analytic containers" and "v2 lesson packages carry exactly 3 inline quizzes" — v5 supersedes them once shipped. CLAUDE.md will be updated as part of v5 implementation.

## Executive Summary

v4 improved workflow, artifact boundaries, and operator approval surfaces.

v5 should improve the quality of what the system authors and teaches.

The next phase has three linked concerns:

1. story design
2. detection of strong and weak reasoning
3. teaching of reasoning recognition

These are related but distinct design layers.

- story design determines whether episodes naturally generate teachable argument
- reasoning detection determines whether the pipeline identifies the right turns as weak anchors and strong contrasts
- teaching design determines whether those turns become clear and useful lessons for students

## Why v5 Exists

The current system can now save, review, revise, and approve artifacts in a clearer way. That solved an important workflow problem.

But the recent review surfaced a deeper instructional issue:

- not every line that sounds broad, forceful, or imprecise is actually a good reasoning-flaw example
- some selected anchor turns are weak because they depend too heavily on context or on adult interpretation

The next phase should focus less on orchestration and more on instructional design quality.

## Section 1: Story Design

### Goal

Episodes should be designed so flawed reasoning emerges naturally from believable social interaction, rather than from post hoc extraction from dialogue that was never built to teach.

### Current Direction

Each episode should contain at least one persuasive thread in which a character tries to convince another character of:

- a claim
- an explanation
- an interpretation
- or a course of action

That thread creates the conditions for reasoning to become visible and teachable.

### Design Frame

The emerging episode-design frame is:

- `context` (required): what the episode is generally about, including mood, theme, and social situation
- `argument` (required): what one character is trying to get others to believe or do
- `description` (required): a creative episode concept that satisfies the instructional conditions above
- one or more lenses (optional, at least one recommended):
  - `logical_lens`: whether the reasoning path is strong enough to support the point
  - `evidence_lens`: whether the speaker has enough relevant evidence for the point
  - `scope_lens`: whether the claim is framed at the right size and under the right conditions

The three lenses are a shared vocabulary available to episode design, not a checklist every episode must fill. An episode may foreground one lens, combine two, or use all three — the choice is driven by what the `argument` naturally exposes.

### Working Hypothesis

This structure should likely live inside `story_design` so the creative-writing stage begins from explicit instructional constraints rather than vague hopes that flaws will emerge later.

The operator should approve the episode design before transcript drafting.

### Open Questions

- Where should this structure live canonically: `story.yaml`, `episode-plan.yaml`, or a new episode-design shape inside existing artifacts?
- How explicit should the argument and lens fields be in operator-facing files?
- How much freedom should the creative-writing agent have inside `description` before the plot stops matching the instructional design?

### Resolved

- **Lens obligation.** An episode specifies one or more lenses. The three-lens vocabulary is available but not required per episode.

## Section 2: Detection Of Strong And Weak Reasoning

### Goal

`script_doctor` should identify turns that genuinely perform meaningful reasoning, distinguish stronger from weaker moves, and select the best weak-reasoning turns as teaching anchors.

### Selection Criteria

Anchor candidates should satisfy all five criteria:

1. The turn is doing argumentative work.
The speaker is trying to support, justify, persuade, reject, or conclude something.

2. The turn is not merely expressive language.
It is not just hype, emotion, humor, or conversational exaggeration.

3. The speaker's intended claim is clear.
A reviewer and downstream artifact should be able to state what the speaker is trying to get others to believe.

4. The reasoning quality is clear and strongly expressed in the line itself.
The turn shows meaningfully strong or weak reasoning without heavy reconstruction or interpretation. If it does not, `script_doctor` should revise the turn so it does.

5. The turn is instructionally usable.
A middle school student should be able to understand the claim and discuss why the reasoning is strong or weak.

### Detection Notes

Weakness should be in the reasoning move, not merely in:

- casual wording
- conversational compression
- ordinary exaggeration
- lack of courtroom-level explicitness

The system should not require speakers to state every premise out loud. The question is whether the support offered is meaningfully stronger or weaker than the conclusion drawn.

Primary lesson anchors should usually be turns that perform weak reasoning in real time. Nearby stronger reasoning is still useful as contrast, resistance, or a better alternative.

Unlike `todo-v4.md`, v5 should prefer strongly expressed reasoning turns. It is not enough that a flaw or strong move can be inferred after explanation. For primary anchors, the reasoning weakness or strength should be audible in the line itself, or made audible through revision.

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
- only anchor turns where the intended claim and reasoning quality are both clear and strongly expressed

Absolute language and superlatives are not flaw triggers by themselves. Terms like `best`, `always`, `never`, `everywhere`, and `all of it` can be figure of speech, emphasis, or shorthand. They become reasoning-relevant when they are being used to support or close off an argument.

### Implications For `script_doctor`

`script_doctor` should:

- detect turns that are actually making or defending a claim
- avoid false positives from superlatives, hyperbole, or ordinary shorthand
- articulate what the speaker is trying to get others to believe
- identify whether those turns are stronger or weaker reasoning moves
- focus primary anchor selection on turns that perform weak reasoning in real time
- notice nearby stronger reasoning turns that can serve as contrast or support
- prefer candidate turns where the reasoning move is audible in the line itself
- revise candidate turns so weak or strong reasoning is more explicit when those turns are intended as lesson anchors

### Open Questions

- Should `script_doctor` score candidates on "argumentativeness" before evaluating reasoning strength?
- Should `script_doctor` explicitly classify a turn as expressive, descriptive, reflective, or argumentative before proposing it as an anchor?
- How should the intended claim be persisted so downstream lesson generation can use it directly?
- Should `script_doctor` also persist nearby stronger counter-turns or only the primary weak anchors?
- How aggressive should revision be when a turn is story-natural but its reasoning quality is not strongly expressed?

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

- update upstream story-design prompts or artifacts
- require each episode design to carry:
  - `context`
  - `argument`
  - `description`
- allow each episode design to specify one or more of (optional, at least one recommended):
  - `logical_lens`
  - `evidence_lens`
  - `scope_lens`
- add an operator approval gate for episode design before transcript drafting, analogous to `flaw-review.md`
  - define the review artifact (e.g. `episode-design-review.md`) and its acceptance contract
  - transcript drafting must not start until the episode design is accepted

### Phase 2: Reasoning Detection

- update `script_doctor` and related review stages
- require them to:
  - detect strong and weak reasoning
  - enforce the five anchor criteria
  - articulate the intended claim
  - revise turns until reasoning quality is strongly expressed
- decide whether `flaw-proposals.yaml` needs a shape update to persist this reasoning scaffold

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

1. Finish Phase 0 design decisions inside this document.
2. Decide the minimum lesson-package shape change needed for the three-step quiz flow.
3. Translate Section 1 and Section 2 into prompt-level guidance for upstream authoring and `script_doctor`.
4. Decide which v5 outputs are docs-only and which require prompt, artifact, validator, or app changes.
