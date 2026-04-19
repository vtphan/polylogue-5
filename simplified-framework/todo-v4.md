# TODO v4

> **DRAFT — 2026-04-19.** Supersedes `todo-v3.md` once v3 verification is signed off. v4 reshapes the simplified pipeline that turns `story.yaml` + `episode-plan.yaml` into `transcript.yaml`. The main changes are prompt-level and workflow-level, plus a small set of new **pipeline-only intermediate artifacts** used for operator review and external orchestration. v4 does not require app UI redesign, but it does include a contained app and validator contract revision so quiz anchoring is turn-based rather than scene-constrained.

Agent file naming in this doc uses kebab-case for markdown filenames, even when an agent role is written with underscores in prompt text or schema fields.

## Executive Summary

The current pipeline produces transcripts that are competent but thin. The likely cause is not only prompt quality; it is governance. Too many important story and pedagogy decisions are being made inside agent-to-agent handoffs before the operator has approved the work as a story.

v4 changes that:

- agents draft, diagnose, and propose;
- the operator approves through CLI chat;
- intermediate review surfaces are saved to files;
- story drafting happens before reader-oriented scene scaffolding;
- the app still consumes only final contract artifacts.

The design goal is to improve story thickness and coherence while reducing redundant machine gatekeepers.

## Design Goal

v4 exists to improve story quality by changing how the pipeline works, not by changing the app contract.

The creative goal is to make transcripts more likely to:

- read as real middle-grade stories on first pass, not as reasoning demos;
- carry interior, friendship texture, subtext, and breathing room;
- preserve 3 teachable primary-flaw moments across `unmistakable`, `showcased`, and `heightened`.

These are design goals and review aims, not technical acceptance criteria. They are guiding tendencies for prompts and review, not checklist requirements that every episode must satisfy literally. The final quality gate for story quality is operator judgment.

## Technical Success Criteria

v4 is technically successful when:

1. `create_episodes` writes both `episode-plan.yaml` and `showrunner-projection.yaml`.
2. `create_transcript` writes `transcript.raw.yaml` before any flaw-application step.
3. the operator reviews `transcript.raw.yaml` as a story draft before any flaw-application step.
4. `transcript.raw.yaml` carries concise summaries of operator feedback for each revision round.
5. after raw-draft approval, `script_doctor` writes `flaw-proposals.yaml` from the approved raw draft.
6. `flaw-proposals.yaml` carries concise summaries of operator feedback for each revision round.
7. the operator can iterate on both checkpoints through CLI chat until approval.
8. `script_doctor` applies only the latest approved proposal set and then emits `transcript.post-doctor.yaml`, a final dialog-only story draft before reader scaffolding is added.
9. a later transcript-structuring pass reads `transcript.post-doctor.yaml`, adds scene boundaries and scene summaries, and writes the app-facing transcript artifact.
10. quizzes remain anchored to selected `turn_id`s rather than depending on scene boundaries.
11. `create_lesson_package` builds from the latest approved structured `transcript.yaml`.
12. the workflow remains externally reviewable, resumable, and scriptable through saved intermediate artifacts plus their feedback history.
13. the app, docs, and validators are updated so scene scaffolding and quiz anchoring are treated as separate concerns.
14. intermediate artifacts remain pipeline-only and do not become app inputs.

If a design or implementation choice does not clearly serve these criteria, it is out of scope.

## Workflow Summary

This is the operational source of truth. Future agents should validate implementation work against this flow.

1. `create_story` produces `stories/{story_id}/story.yaml`.
2. `create_episodes` produces `episode-plan.yaml` and also saves `showrunner-projection.yaml` for each episode.
3. `create_transcript` invokes the `staff_writer` from `showrunner-projection.yaml` and saves `transcript.raw.yaml`.
4. The operator reviews `transcript.raw.yaml` as a story draft before any flaw editing.
5. After story-draft approval, the script doctor reads `transcript.raw.yaml` and writes `flaw-proposals.yaml`.
6. `flaw-proposals.yaml` contains a candidate set of primary-flaw moments, usually more than 3 when the draft supports that, plus a recommended final 3 and any proposed edits or new beats.
7. The operator chooses the final 3 primary-flaw turns and gives approval, rejection, or revision guidance through CLI chat.
8. Only then does the script doctor apply the accepted proposals and emit `transcript.post-doctor.yaml`, the final dialog-only story draft.
9. A later transcript-structuring pass reads `transcript.post-doctor.yaml`, segments the approved story draft into app-facing scenes, and writes scene summaries into `transcript.yaml`.
10. `create_lesson_package` builds directly from accepted `transcript.yaml` and writes `lesson_package.yaml`.
11. The app consumes only final contract artifacts, not the intermediate review files.

If a proposed implementation change breaks this operator-led approval chain, reintroduces a machine-only approval layer, tries to move approval state into files, or makes the intermediate artifacts unavailable as review surfaces, it is out of alignment with v4.

## Review And Approval Model

### Review artifacts

- Agents save intermediate artifacts so the operator can inspect them externally.
- Agents alert the operator in CLI chat with a concise summary and the artifact path.
- The operator gives approval, rejection, or revision guidance through CLI chat.
- Agents revise the relevant saved artifact based on that chat feedback.
- `transcript.raw.yaml` and `flaw-proposals.yaml` must carry concise summaries of operator feedback for each revision round.
- Iteration continues until the operator says approve or proceed.

### Resumability rule

Resuming a stopped run should be artifact-driven rather than chat-state-driven:

- if `transcript.yaml` exists and validates, treat the transcript stage as complete
- else if `transcript.post-doctor.yaml` exists and is parseable YAML with the required top-level keys for a post-doctor draft, resume at transcript structuring
- else if `flaw-proposals.yaml` exists and is parseable YAML with the required top-level keys for a proposal set, resume at checkpoint 2 proposal review
- else if `transcript.raw.yaml` exists and is parseable YAML with the required top-level keys for a raw draft, resume at checkpoint 1 raw-draft review
- else if `showrunner-projection.yaml` exists and is parseable YAML with the required top-level keys for a showrunner brief, resume by invoking the staff writer from that saved brief
- else if `episode-plan.yaml` exists, regenerate only `showrunner-projection.yaml` from the saved plan and then continue
- else restart the episode flow from `create_episodes`

Artifact presence alone is not approval state. Resume from the latest saved artifact, then require explicit operator approval in chat before advancing past the relevant checkpoint.

Intermediate pipeline-only artifacts do not need dedicated validator files, but they do need a minimal resumability guard. A file counts as present for resume purposes only if it parses as YAML and contains the required top-level keys named in this doc. A half-written, empty, or structurally incomplete intermediate artifact must be treated as missing and regenerated from the prior checkpoint.

In v4, this resumability ladder is defined per episode. Cross-episode orchestration rules are out of scope for this plan and may be handled independently by the calling workflow.

Files are the working review surfaces. CLI chat is the approval channel.

### Intermediate artifacts

Persist these files under `artifacts/{story_id}/{episode_id}/`:

- `showrunner-projection.yaml` — stripped brief passed to the staff writer
- `transcript.raw.yaml` — pre-flaw story draft awaiting operator review
- `flaw-proposals.yaml` — script-doctor candidate set and edit proposals awaiting operator review
- `transcript.post-doctor.yaml` — approved dialog-only post-edit draft awaiting transcript structuring
- `transcript.yaml` — final approved transcript

These are pipeline-only orchestration surfaces. The app continues to care only about final contract artifacts.

### Artifact policy

- No persisted `designer-report.yaml`
- No persisted `flaw-review.md`
- No new schemas
- No new validator files
- Existing validators may be amended to remove scene-distinctness constraints that conflict with the v4 turn-anchored quiz contract

### Raw-draft and proposal-file shape

The new intermediate artifacts are pipeline-only, but their minimum shapes must still be explicit so different implementations do not drift.

`transcript.raw.yaml` must be a mapping with:

- `story_id`
- `episode_id`
- `title`
- `characters`
- `turns`
- `revision_history`

`transcript.post-doctor.yaml` must use the same top-level shape as `transcript.raw.yaml`, except its `revision_history` records the approved application rounds that produced the current post-doctor draft.

For both raw-draft files, `turns` is a flat ordered list of dialog turns before scene structuring. Each turn must minimally include:

- `turn_id`
- `speaker`
- `text`

For both raw-draft files, each `revision_history` entry should minimally include:

- `round`
- `feedback_summary`
- `revision_note`

`flaw-proposals.yaml` must be a mapping with:

- `story_id`
- `episode_id`
- `source_draft`
- `candidate_turns`
- `recommended_turn_ids`
- `proposals`
- `revision_history`

These minimum shapes are resumability and implementation contracts, not new app-facing schemas.

## Agent Roles

Identity priming is still important in v4, but role clarity matters more than long prompt prose. The implementation should preserve the following responsibilities.

### Showrunner

Replaces `episode planner`.

What it does:

- plans season arc and per-episode obligations;
- plans private stakes, running threads, and character interior outside the flaw itself;
- preserves the episode's intended teaching shape without turning the brief into a pedagogy checklist;
- writes a prose brief for the staff writer.

That brief should encode the teaching signal indirectly through situation design, interpersonal pressure, and episode obligations rather than through direct taxonomy language or explicit quiz-planning instructions.
The brief should also be rich enough that a strong story draft would plausibly surface at least three candidate primary-flaw turns without requiring heavy corrective rewriting later.

What it does not do:

- write dialogue;
- choreograph scenes turn by turn;
- decide final teachable moments inside a finished draft.

### Staff writer

What it does:

- writes a believable story draft;
- prioritizes voice, subtext, breathing room, and friendship texture;
- uses the showrunner brief, not the flaw taxonomy;
- creates a raw draft rich enough that later flaw selection does not require heavy rewriting;
- assigns stable pre-structuring `turn_id`s in `transcript.raw.yaml` so later proposal review and flaw selection can point to exact dialog turns before app-facing scenes exist;
- uses the same validator-compatible `turn_id` format in the raw draft that the final structured transcript must keep, so later steps do not need to rewrite turn identifiers.

This is a deliberate tradeoff: the staff writer should not read the flaw taxonomy directly, so the showrunner brief must carry enough implicit teaching signal to make later flaw selection feasible without turning the raw draft into a pedagogy-first outline.

The raw draft is intentionally not scene-shaped. It should be written as a continuous dialog flow in a flat `turns` list, with sceneing deferred to the later transcript-structuring pass.

What it does not do:

- read the full flaw-bearing plan or taxonomy;
- optimize directly for quiz coverage;
- self-censor story texture for pedagogy.

### Transcript structurer

What it does:

- reads the final approved story draft after flaw application;
- segments it into app-facing scenes for reading support;
- writes concise scene summaries to reduce reading friction without restating the full plot;
- preserves dialog order and selected quiz turns while shaping the reader-facing scaffold.

What it does not do:

- rewrite the story to improve plot or voice;
- move quiz anchors just to make sceneing easier;
- treat scene boundaries as the source of truth for flaw selection.

Scene summaries are still authored student-facing text, but they are constrained scaffolding rather than a second story-writing pass. They should stay short, plain, and faithful to the approved draft rather than adding new interpretation.

### Script doctor

Replaces `flaw_injector`.

What it does:

- reads the operator-approved raw draft;
- identifies a candidate set of primary-flaw turns;
- recommends a final 3 across `unmistakable`, `showcased`, and `heightened`;
- proposes minimal edits, replacements, or new beats when needed;
- applies approved proposals only after operator approval.

What it does not do:

- silently rewrite the story;
- apply changes without operator approval;
- manufacture flaws in characters who should remain corrective;
- act as a second hidden approver after the operator.

## Implementation Tasks

## Task 1 — Rename And Rewrite `episode-planner` As `showrunner`

### File changes

- move `pipeline/agents/episode-planner.md` to `pipeline/agents/showrunner.md`
- update references in command specs, docs, and initializer logic

### Behavioral changes

- keep the existing writer barrier
- keep `episode-plan.yaml` unchanged except for relaxing the meaning of `flaws[*].scene_id`
- make the projection more prose-forward and less choreographic
- treat `scene_design` as obligation-shaping, not beat-scripting
- use `narrative_synopsis` and `character_beats` to encourage private stakes, offscreen life, and non-mystery life where they strengthen the episode
- treat `flaws[*].scene_id` as a required planning label or provisional beat bucket rather than as a required final scene identifier that must survive into `transcript.yaml`

### New artifact

- save `showrunner-projection.yaml` under the episode artifact directory

This file is not app-facing. It exists so operators and external tools can inspect exactly what brief the staff writer received.

## Task 2 — Rename And Update `screenwriter.md` As `staff_writer`

### File changes

- move `pipeline/agents/screenwriter.md` to `pipeline/agents/staff-writer.md`
- sweep references across command specs, docs, and initializer logic

This task uses `staff_writer` for the role name and `staff-writer.md` for the file name.

### Behavioral changes

- rename the agent uniformly from `screenwriter` to `staff_writer`
- keep the current writer barrier and story-first stance
- add stronger emphasis on breathing turns, subtext, private stakes, and offscreen life as story-enriching guidance rather than mandatory beat quotas
- discourage episodes that rely only on civic-register stakes when private stakes would make the story stronger
- let the writer draft continuous story flow first rather than writing to app-shaped scenes

### New artifact

- save the assembled pre-flaw draft as `transcript.raw.yaml`

This is the operator-reviewable story draft. It is not app-facing.

The minimum shape is a flat ordered `turns` list plus top-level metadata and `revision_history`, not app-facing `scenes[]`.

## Task 3 — Rename And Rewrite `flaw_injector` As `script_doctor`

### File changes

- move `pipeline/agents/flaw_injector.md` to `pipeline/agents/script-doctor.md`
- remove `pipeline/agents/flaw-reviewer.md`
- sweep references across command specs, docs, and initializer logic

This task uses `script_doctor` for the role name and `script-doctor.md` for the file name.

### Behavioral changes

- change the role from direct reviser to proposer-analyst
- read the approved raw draft first, not an unreviewed story draft
- produce a candidate set of flaw-carrying turns, not just exactly 3
- recommend a best final 3
- prefer the smallest viable edits
- propose new beats only when the draft genuinely lacks the needed flaw landing

### New artifact

- save proposals as `flaw-proposals.yaml`

That file should capture:

- candidate primary-flaw turns, usually more than 3 when supported by the draft
- a recommended final 3
- proposed changes with `proposal_type` such as `keep`, `tweak`, `replace`, `add_beat`
- before/after text when applicable
- a one-sentence reason for each proposal
- escalation notes when a new beat is needed
- a `revision_history` section that records each operator-feedback round as an append-only log with a concise feedback summary and the resulting proposal revision note

Each `revision_history` entry should minimally include `round`, `feedback_summary`, and `revision_note`. A timestamp may be included if useful to the implementation.

The top-level proposal set should reflect the current latest state. Rejected or superseded proposals do not need to remain active in the current set, but each revision round should still be represented in `revision_history`.

Proposal references should use the stable pre-structuring `turn_id`s from `transcript.raw.yaml` or `transcript.post-doctor.yaml`. The structuring pass must preserve those `turn_id`s when it wraps the approved draft into scenes.

If `script_doctor` proposes `add_beat`, the new beat must still receive a normal validator-compatible numeric `turn_id` in the post-application draft. v4 therefore permits a full renumber of the raw draft turn stream only at the moment the latest approved proposal set is applied. If such a renumber happens, the apply step must rewrite every affected turn reference consistently across the emitted `transcript.post-doctor.yaml` and the final latest-state contents of `flaw-proposals.yaml` before structuring continues.

Before that apply step, proposal review must anchor against the stable `turn_id`s present in the current approved `transcript.raw.yaml`. After that apply step, `transcript.post-doctor.yaml` becomes the new source of truth for turn references. The transcript structurer must preserve the post-doctor `turn_id`s exactly.

## Task 4 — Add A Transcript-Structuring Pass After Story Approval

### Goal

Move scene segmentation and scene-summary writing to a later scaffold pass so story drafting is not constrained by app-facing scene boundaries.

### File changes

- add `pipeline/agents/transcript-structurer.md`
- register the transcript structurer in `pipeline/scripts/initialize_polylogue.py`
- wire command-spec references so `create_transcript.md` can invoke the transcript structurer explicitly

### Behavioral changes

- read the final approved story draft after script-doctor application
- segment the draft into app-facing scenes for reading support
- add scene summaries as scaffolding for the reader
- keep quizzes anchored to selected `turn_id`s rather than to scene planning
- preserve dialog order and selected flaw turns while structuring the transcript
- satisfy the current transcript validator floor, including at least 3 scenes in final `transcript.yaml`

### Output

- write final app-facing `transcript.yaml`

This pass is a reader-scaffolding step, not a story-rewriting step.
If the operator wants a scene-summary adjustment after reviewing `transcript.yaml`, the workflow may send the transcript structurer back for a summary-only revision pass without reopening story-draft or flaw-proposal approval.

## Task 5 — Rewrite `create_transcript.md` Around Two Operator Checkpoints Plus Structuring

### Checkpoint 1 — raw story draft

`create_transcript` should:

1. read `story.yaml`
2. read `episode-plan.yaml`
3. read `showrunner-projection.yaml`
4. invoke the `staff_writer`
5. save `transcript.raw.yaml`
6. alert the operator in CLI chat to review it
7. on each revision round, update `transcript.raw.yaml` so it includes a `revision_history` entry with a concise summary of the latest operator feedback and the resulting draft revision note
8. revise until the operator approves the raw draft as a story draft

### Checkpoint 2 — flaw proposals

After raw-draft approval, `create_transcript` should:

1. invoke the script doctor on `transcript.raw.yaml`
2. save `flaw-proposals.yaml`
3. alert the operator in CLI chat to review it
4. let the operator approve the current final 3, reject them, or request revisions
5. on each revision round, update `flaw-proposals.yaml` so it includes a concise summary of the latest operator feedback
6. iterate until the operator approves the proposals
7. ask the script doctor to apply only the latest approved proposal set and save `transcript.post-doctor.yaml`
8. alert the operator in CLI chat with a concise post-application summary so they can spot-check `transcript.post-doctor.yaml` for faithful application before structuring continues
9. if that spot-check fails, return to script-doctor revision work rather than continuing to structuring; the implementation may update either `flaw-proposals.yaml` or `transcript.post-doctor.yaml` as needed, but the operator must explicitly re-approve the proposal/application state in chat before proceeding
10. invoke the transcript-structuring pass on `transcript.post-doctor.yaml`
11. save final `transcript.yaml`
12. run `validate_transcript.py`

### Important rule

The command remains human-in-the-loop. It must not silently continue from transcript generation into lesson-package generation.

## Task 6 — Rewrite `create_lesson_package.md` And `lesson-package-builder.md`

### File changes

- remove `flaw-review.md` from `create_lesson_package.md`
- remove `flaw-review.md` from `lesson-package-builder.md`

### Behavioral changes

- build directly from accepted `transcript.yaml`
- do not introduce a second machine-authored approval layer
- treat the latest approved `transcript.yaml` as the sole transcript source of truth for package generation
- preserve the current lesson-package validator and runtime contract:
  - exactly 3 levels
  - canonical `focus_flaw`
  - direct prompts
  - short scaffolding

This preservation clause is subject to Task 7's turn-anchoring revision. "Preserve the current lesson-package validator and runtime contract" does not include preserving the old same-scene rejection logic.

This is not a lesson-package redesign. It is a simplification of the authoring chain.

## Task 7 — Revise The App And Validator Contract So Quiz Anchoring Is Turn-Based

### Goal

Separate reader scenes from quiz anchoring.

### Behavioral changes

- treat `turn_id` as the quiz anchor in the app and lesson package
- allow more than one selected quiz turn to live in the same scene when the story structure warrants it
- keep scenes and scene summaries as reading scaffolds rather than quiz containers
- stop using scene distinctness as a hard planning or validation requirement for quiz selection
- stop treating `episode-plan.yaml` `scene_id`s as final app-scene identifiers; if retained, they are planning hints only
- keep `flaws[*].scene_id` required as a non-empty planning label unless and until a separate contract change removes it; validators and docs should describe it as a planning bucket, not as a runtime scene binding

### Required surfaces

- update the reader so it can surface flagged turns without assuming one quiz per scene
- update lesson-package validation to stop rejecting multiple quiz turns in the same scene
- update catalog eligibility checks to stop rejecting same-scene quiz targets
- update episode-plan validation and authoring guidance to stop requiring primary-flaw quiz moments in distinct scenes
- update docs so scenes are described as reading scaffolds and quizzes are described as turn-anchored

## Required Migration Sweep

The implementation should explicitly update all surfaces that still describe the old flow, not just the agent files.

At minimum, sweep:

- `pipeline/commands/create_episodes.md`
- `pipeline/commands/create_transcript.md`
- `pipeline/commands/create_lesson_package.md`
- `pipeline/commands/create_story.md`
- `pipeline/agents/lesson-package-builder.md`
- `pipeline/agents/README.md`
- `pipeline/reference/language-guide.md`
- `schemas/transcript.yaml`
- `schemas/lesson_package.yaml`
- `schemas/episode-plan.yaml`
- `pipeline/scripts/validate_lesson_package.py`
- `pipeline/scripts/validate_episode_plan.py`
- `docs/instructional-design.md`
- `docs/operator-workflow.md`
- `docs/tech-reference.md`
- `app/src/app/runs/[runId]/_components/ContinuousSceneReader.tsx`
- `app/src/app/runs/[runId]/_components/QuizPanel.tsx`
- `app/src/app/runs/[runId]/scene/[n]/page.tsx`
- `app/src/lib/catalog.ts`
- `pipeline/scripts/initialize_polylogue.py`

The current repo still describes:

- ephemeral projection handoffs
- `screenwriter`
- `flaw_injector`
- `flaw_reviewer`
- required `flaw-review.md`
- scenes as quiz-distribution containers
- distinct-scene quiz requirements
- descriptive schema text that still explains scenes as quiz containers or requires same-scene rejection behavior

All of those references need to move to the v4 model together.

## App And Validator Impact

App/runtime impact is no longer purely prompt-level. v4 now includes a contained app and validator contract revision.

- no Prisma migration
- the app should continue to consume final `transcript.yaml` and `lesson_package.yaml`
- transcript structuring remains upstream of the app and does not introduce runtime generation
- quiz anchoring stays `turn_id`-based, but the current one-quiz-per-scene assumption must be removed from reader and validator logic
- intermediate artifacts are pipeline-only and must not become runtime inputs

Validation remains the current simplified/v2 validator set:

- `validate_story.py`
- `validate_episode_plan.py`
- `validate_transcript.py`
- `validate_lesson_package.py`
- `validate_practice_package.py`

One cheap verification when v4 lands:

- confirm `syncCatalogFromFilesystem` in `app/src/lib/catalog.ts` is strictly filename-matched to final runtime artifacts and does not accidentally start treating intermediate files as app content

Qualitative regression against the v2 archive remains a human judgment step rather than a scored benchmark. The purpose of that comparison is to catch obvious story-thinning or pedagogy regressions, not to require a deterministic pass/fail rubric.

## Ordering

1. rename/rewrite `episode-planner` as `showrunner`
2. rename/rewrite `screenwriter` as `staff_writer` and shift the draft toward continuous story flow
3. rename/rewrite `flaw_injector` as `script_doctor` and remove `flaw_reviewer`
4. add the transcript-structuring pass that scenes the approved draft for the reader
5. rewrite `create_transcript.md` around the two operator checkpoints plus structuring
6. rewrite `create_lesson_package.md` and `lesson-package-builder.md` to stop depending on `flaw-review.md`
7. revise the app and validator contract so quizzes are anchored by turn, not constrained by scenes
8. sweep docs and initializer references
9. regenerate `the-white-squirrel` ep01–03 end to end and compare qualitatively against `artifacts/archive/the-white-squirrel-v2/`

Final sign-off is human judgment, not just validator green status.

## Operator Review Standard

The operator is the final quality gate for story quality.

At checkpoint 1, the operator is approving `transcript.raw.yaml` as a story draft.

At checkpoint 2, the operator is approving the proposal set for final flaw selection and edits.

The later transcript-structuring pass is not a second creative approval gate. It is a reader-scaffolding step that should preserve the approved story and selected quiz turns. Its scene summaries are still student-facing authored text, but they are constrained scaffolding and should be reviewed only for faithfulness, clarity, and brevity rather than as a new story-quality checkpoint.

Review guidance should prioritize:

- whether the draft reads like a believable story rather than a reasoning demo;
- whether character voice, subtext, private stakes, and breathing room are strong enough for this episode, without treating any single heuristic as a required checkbox;
- whether the proposed or applied primary-flaw turns support the intended `unmistakable`, `showcased`, and `heightened` spread, regardless of how later reader scenes are segmented;
- whether the resulting `transcript.yaml` is strong enough for `create_lesson_package` to build direct, short, deterministic app-facing prompts without guesswork.

## Out Of Scope

- broad app UI redesign
- lesson-package runtime redesign
- flaw taxonomy changes
- story-format changes
- new flaws, amplifications, or quiz types
- practice-package changes
- multi-episode mechanics beyond existing planning
- any LLM-at-runtime feature
- file-based approval semantics
