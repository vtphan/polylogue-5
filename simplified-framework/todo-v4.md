# TODO v4

> **Status (2026-04-20):** Complete. Closed in favor of `todo-v5.md` for the next phase of design work.

> **Status (2026-04-19):** Task 0 + Tasks 1–7 landed. Tasks 1–3 renamed `episode_planner` to `showrunner`, `screenwriter` to `staff_writer`, and `flaw_injector` to `script_doctor`; removed `flaw_reviewer`; swept active references; and re-ran `initialize_polylogue.py`. Tasks 4–5 added `transcript_structurer`, rewrote `create_transcript.md` around the raw-draft and flaw-proposal checkpoints plus the post-doctor spot-check, and introduced the pipeline-only intermediate artifact flow. Tasks 6–7 rewrote lesson-package generation around `flaw-proposals.yaml` `approved_anchors`, bumped the lesson-package contract to `simplified_v4`, and updated the app and validator surfaces for variable-length turn-anchored quizzes and dynamic star totals.

> **2026-04-19.** Supersedes `todo-v3.md` (verification signed off 2026-04-19). v4 reshapes the simplified pipeline that turns `story.yaml` + `episode-plan.yaml` into `transcript.yaml`. The main changes are prompt-level and workflow-level, plus a small set of new **pipeline-only intermediate artifacts** used for operator review and external orchestration. v4 also includes a contained app and validator contract revision so approved teaching anchors are turn-based, variable-length, and operator-controlled rather than scene-constrained or count-constrained.

Agent identifiers in this doc use snake_case for role names, filenames, and command references.

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

v4 exists to improve story quality mainly by changing how the pipeline works, while making a contained app and validator contract revision around variable-length teaching anchors.

The creative goal is to make transcripts more likely to:

- read as real middle-grade stories on first pass, not as reasoning demos;
- carry interior, friendship texture, subtext, and breathing room;
- surface teachable flawed turns where they genuinely emerge in dialogue, without forcing an exact quota or fixed spread.

These are design goals and review aims, not technical acceptance criteria. They are guiding tendencies for prompts and review, not checklist requirements that every episode must satisfy literally. The final quality gate for story quality is operator judgment.

## Technical Success Criteria

v4 is technically successful when:

1. `create_episodes` writes both `episode-plan.yaml` and `showrunner-projection.yaml`.
2. `create_transcript` writes `transcript.raw.yaml` before any flaw-application step.
3. the operator reviews `transcript.raw.yaml` as a story draft before any flaw-application step.
4. `transcript.raw.yaml` carries concise summaries of operator feedback for each revision round.
5. after raw-draft approval, `script_doctor` writes `flaw-proposals.yaml` from the approved raw draft.
6. `flaw-proposals.yaml` carries concise summaries of operator feedback for each revision round.
7. `script_doctor` proposes up to 5 candidate teaching anchors by default, including suggested flaw labels and expression-strength judgments.
8. the operator can iterate on both checkpoints through CLI chat until approval.
9. `script_doctor` applies only the latest approved proposal set and then emits `transcript.post-doctor.yaml`, a final dialog-only story draft before reader scaffolding is added.
10. the operator can spot-check `transcript.post-doctor.yaml` for faithful application before transcript structuring continues.
11. a later transcript-structuring pass reads `transcript.post-doctor.yaml`, adds scene boundaries and scene summaries, and writes the app-facing transcript artifact.
12. approved teaching anchors remain attached to selected `turn_id`s rather than depending on scene boundaries.
13. `create_lesson_package` builds from the latest approved structured `transcript.yaml` plus the persisted approved teaching anchors in `flaw-proposals.yaml`.
14. the workflow remains externally reviewable, resumable, and scriptable through saved intermediate artifacts plus their feedback history.
15. the app, docs, and validators are updated so scene scaffolding and teaching-anchor selection are treated as separate concerns, while preserving the single-active-quiz-panel reader model.
16. intermediate artifacts remain pipeline-only and do not become app inputs.

If a design or implementation choice does not clearly serve these criteria, it is out of scope.

## Workflow Summary

This is the operational source of truth. Future agents should validate implementation work against this flow.

1. `create_story` produces `stories/{story_id}/story.yaml`.
2. `create_episodes` produces `episode-plan.yaml` and also saves `showrunner-projection.yaml` for each episode.
3. `create_transcript` invokes the `staff_writer` from `showrunner-projection.yaml` and saves `transcript.raw.yaml`.
4. The operator reviews `transcript.raw.yaml` as a story draft before any flaw editing.
5. After story-draft approval, `script_doctor` becomes the first explicit flaw-aware stage, reads `transcript.raw.yaml` plus `reference/flaw-taxonomy.yaml`, and writes `flaw-proposals.yaml`.
6. `flaw-proposals.yaml` contains a candidate set of flawed turns, suggested flaw labels, suggested expression strengths, and any proposed edits or new beats.
7. By default, the first proposal set contains up to 5 candidate teaching anchors so the operator has a practical review surface rather than a forced full inventory.
8. The operator chooses which candidates to approve, reject, relabel, tone down, or revise, and may ask for more than the default 5 through CLI chat.
9. Only then does `script_doctor` apply the accepted proposals and emit `transcript.post-doctor.yaml`, the final dialog-only story draft.
10. The operator spot-checks `transcript.post-doctor.yaml` for faithful application before structuring continues.
11. A later transcript-structuring pass reads `transcript.post-doctor.yaml`, segments the approved story draft into app-facing scenes, and writes scene summaries into `transcript.yaml`.
12. `create_lesson_package` builds from accepted `transcript.yaml` plus the approved teaching anchors recorded in `flaw-proposals.yaml` and writes `lesson_package.yaml`.
13. The app consumes only final contract artifacts, not the intermediate review files.

If a proposed implementation change breaks this operator-led approval chain, reintroduces a machine-only approval layer, or makes the intermediate artifacts unavailable as review surfaces, it is out of alignment with v4.

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
- else if `transcript.post-doctor.yaml` exists and is parseable YAML with the required top-level keys for a post-doctor draft, branch on its `status` field:
  - if `status` is `approved`, resume by invoking the transcript-structuring pass directly without re-prompting
  - if `status` is `pending_review`, resume at the post-application operator spot-check
  - if `status` is `needs_revision`, consult `flaw-proposals.yaml` `status` to pick the revision mode:
    - if `flaw-proposals.yaml` is missing or its `status` is `needs_revision`, resume at checkpoint-2 proposal review
    - if `flaw-proposals.yaml` `status` is `approved`, resume at re-application only (do not re-open proposal drafting)
- else if `flaw-proposals.yaml` exists and is parseable YAML with the required top-level keys for a proposal set, then:
  - if `status` is `approved`, resume at the apply-approved-proposals step, even if `approved_anchors` is empty
  - else resume at checkpoint 2 proposal review
- else if `transcript.raw.yaml` exists and is parseable YAML with the required top-level keys for a raw draft, branch on its `status` field:
  - if `status` is `approved`, resume by invoking `script_doctor` to write `flaw-proposals.yaml`
  - else resume at checkpoint 1 raw-draft review
- else if `showrunner-projection.yaml` exists and is parseable YAML with the required top-level keys for a showrunner brief, resume by invoking `staff_writer` from that saved brief
- else restart the episode flow from `create_episodes`

A missing `showrunner-projection.yaml` is a hard restart from `create_episodes`, not a silent regeneration from `episode-plan.yaml`. The projection carries content fields (`narrative_synopsis`, `hypothesis_pursued`, `disproof_event`) that `episode-plan.yaml` is not guaranteed to carry, so regeneration would invent content and diverge from the brief `staff_writer` actually received. The plan remains a human-editable planning artifact; it is not a recovery source.

Artifact presence alone is not approval state, except where v4 explicitly persists operator approval outcomes in artifact fields. In v4, review artifacts must persist operator review state separately from the selected turn set so an operator-approved zero-anchor outcome can still resume deterministically. Resume from the latest saved artifact and its persisted approval fields, then require explicit operator approval in chat for any later checkpoint not already captured in those fields.

Intermediate pipeline-only artifacts do not need dedicated validator files, but they do need a minimal resumability guard. A file counts as present for resume purposes only if it parses as YAML and contains the required top-level keys named in this doc. A half-written, empty, or structurally incomplete intermediate artifact must be treated as missing and regenerated from the prior checkpoint.

`transcript.yaml` does not gain pipeline-only review-state fields in v4. Once `transcript.yaml` exists and validates, the transcript stage is treated as complete for resumability. If the operator later wants scene-summary-only adjustments, that is an explicit rerun of the transcript-structuring pass rather than a resumable pending-review checkpoint on the app-facing artifact.

In v4, this resumability ladder is defined per episode. Cross-episode orchestration rules are out of scope for this plan and may be handled independently by the calling workflow.

Files are the working review surfaces. CLI chat is the approval channel.

### Intermediate artifacts

Persist these files under `artifacts/{story_id}/{episode_id}/`:

- `showrunner-projection.yaml` — stripped brief passed to `staff_writer`
- `transcript.raw.yaml` — pre-flaw story draft awaiting operator review
- `flaw-proposals.yaml` — `script_doctor` candidate set and edit proposals awaiting operator review
- `transcript.post-doctor.yaml` — post-application dialog-only draft awaiting operator spot-check before transcript structuring
- `transcript.yaml` — final approved transcript

These are pipeline-only orchestration surfaces. The app continues to care only about final contract artifacts.

`flaw-proposals.yaml` remains a required pipeline input to `create_lesson_package` in v4 because it is the persisted source of truth for the operator-approved teaching anchors. In v4, the file must carry both explicit proposal approval state and the selected turn set so approval is not inferred from whether the set is empty. That does not reintroduce a second machine approval layer; it only preserves the operator's approved decision in a durable file artifact.

### Artifact policy

- No persisted `designer-report.yaml`
- No persisted `flaw-review.md`
- No new schemas
- No new validator files
- A shared shape-check helper (e.g. `pipeline/scripts/_intermediate_guards.py`) is acceptable to keep the resumability ladder honest across implementations; it is not a validator file and may only verify that the required top-level keys named in this doc are present and parseable, plus the `tNN` format on `turn_id`s in raw and post-doctor drafts since the stability rule depends on pre-validation id shape. It must not encode semantic rules.
- Commands invoke the helper via bash the same way they invoke validators (e.g. `python3 pipeline/scripts/_intermediate_guards.py <path>`); the initializer does not need to distribute it.
- Only Task 5's pipeline steps flip `status` fields on `transcript.raw.yaml`, `flaw-proposals.yaml`, and `transcript.post-doctor.yaml`. Operator chat feedback does not directly edit status fields; the command writes them in tandem with the artifact update that earned the status. This keeps the cross-artifact branches of the resumability ladder coherent.
- Existing validators may be amended to remove fixed-count, fixed-band, and scene-distinctness constraints that conflict with the v4 variable-length teaching-anchor contract

### Raw-draft and proposal-file shape

The new intermediate artifacts are pipeline-only, but their minimum shapes must still be explicit so different implementations do not drift.

`showrunner-projection.yaml` must be a mapping with:

- `story_id`
- `episode_id`
- `title`
- `narrative_synopsis`
- `hypothesis_pursued`
- `disproof_event`
- `character_beats`
- `running_threads`
- `plot_obligations`

For transcript generation, `showrunner-projection.yaml` is the sole content-bearing brief for `staff_writer`. `episode-plan.yaml` may still exist as a human-editable planning artifact, but `create_transcript` must not merge story content from both files at write time, and a missing projection is a hard restart from `create_episodes` rather than a silent regeneration from the plan.

In v4, `create_transcript` may still read `story.yaml` and `episode-plan.yaml` for identity checks, operator-facing context, artifact existence checks, and resume branching, but only `showrunner-projection.yaml` may be passed downstream as narrative brief content to `staff_writer`. This preserves deterministic recovery and prevents silent prompt drift from hidden plan fields.

`transcript.raw.yaml` must be a mapping with:

- `story_id`
- `episode_id`
- `title`
- `characters`
- `turns`
- `revision_history`
- `status`

On this artifact, `status` records the operator's review decision for checkpoint 1. Allowed values are `pending_review`, `approved`, `needs_revision`. The field must be present from the first save (start at `pending_review`) so the resumability ladder can read it without inferring approval from the presence of `flaw-proposals.yaml`.

`transcript.post-doctor.yaml` must use the same top-level shape as `transcript.raw.yaml`, except its `revision_history` records the approved application rounds that produced the current post-doctor draft.

For both raw-draft files, `turns` is a flat ordered list of dialog turns before scene structuring. Each turn must minimally include:

- `turn_id`
- `speaker`
- `text`

`turn_id` stability is a hard v4 contract. In v4, each `turn_id` must use the existing transcript-validator format `tNN`, with at least two digits after the `t`. Within an episode transcript, ids must be globally unique. Dialog order is given by list position in `turns[]` (and by scene/turn position after structuring), not by `turn_id` arithmetic — code paths that compute chronology from the numeric tail of `turn_id` are out of contract. Once `transcript.raw.yaml` is first saved, later steps must preserve every existing `turn_id` unchanged through `transcript.post-doctor.yaml` and final `transcript.yaml`. If `script_doctor` inserts a new beat anywhere in the dialog, it must assign a fresh unused validator-compatible `turn_id` (numerically larger than any existing id is fine; renumbering existing ids is forbidden) and place the new turn at the correct list position. The strictly-increasing-id check in `validate_transcript.py:202-211` is dropped as part of Task 7; uniqueness and `tNN` format are preserved.

For both raw-draft files, each `revision_history` entry should minimally include:

- `round`
- `feedback_summary`
- `revision_note`

`feedback_summary` and `revision_note` should each stay under ~40 words, in plain narrative voice, with no per-turn analytic markup. They are review-surface scaffolding, not authored prose.

`transcript.post-doctor.yaml` must also include:

- `applied_from_proposal_round`
- `applied_turn_ids`
- `status`

These fields are provenance only. They record which approved proposal revision produced the current post-doctor draft so a stopped run can resume deterministically, but they do not themselves grant approval.

Allowed `status` values on `transcript.post-doctor.yaml` are:

- `pending_review`
- `approved`
- `needs_revision`

On this artifact, `status` records the operator's review decision for the post-application spot-check before transcript structuring continues.

`flaw-proposals.yaml` must be a mapping with:

- `story_id`
- `episode_id`
- `source_draft`
- `status`
- `candidate_turns`
- `recommended_turn_ids`
- `approved_anchors`
- `proposals`
- `revision_history`

Each `candidate_turns` entry should minimally include:

- `turn_id`
- `suggested_flaw`
- `expression_strength`
- `rationale`

Allowed `proposal_type` values are `tweak`, `replace`, and `add_beat`. There is no explicit `keep` proposal type in v4. A candidate with no matching `proposals[]` entry is kept as-is if and only if the operator places it in `approved_anchors[]`; otherwise it is rejected. Each `proposals[]` entry must reference a `turn_id` that either appears in `candidate_turns[]` (for `proposal_type` of `tweak` or `replace`) or is a fresh validator-compatible id allocated by `script_doctor` for `add_beat`. `candidate_turns[]` and `proposals[]` are not required to be 1:1: a candidate may appear in `approved_anchors[]` with no matching edit proposal, and an `add_beat` proposal has no preceding candidate.

In v4, approved transcript edits and approved lesson anchors are separate decisions. `approved_anchors[]` is the authoritative kept set for lesson-package generation only; it does not decide whether a transcript edit is applied. `create_transcript` applies the approved proposal set from `proposals[]` after checkpoint-2 approval, while `create_lesson_package` reads only `approved_anchors[]` when deciding which turns become lesson levels.

As a result, a proposal may be approved as a transcript edit without its `turn_id` becoming a lesson anchor. This is especially important for supporting `add_beat` or `replace` edits that improve the surrounding story pressure, setup, or payoff around an anchor without introducing an additional quiz-bearing turn. `approved_anchors[]` must therefore be read as "selected for lesson" rather than "all proposed edits that survived."

Structural proposals must also persist enough placement information to be re-applied deterministically. In particular:

- `tweak` and `replace` operate on an existing `turn_id`
- `add_beat` must include exactly one placement key: `insert_after_turn_id` or `insert_before_turn_id`

v4 does not permit a free-form "insert somewhere around here" application contract. The saved proposal must be specific enough that operator review and later re-application both point to the same location in the dialog.

Each `proposals[]` entry must minimally include:

- `proposal_id`
- `proposal_type`
- `turn_id`
- `rationale`

Additional required fields by `proposal_type`:

- `tweak` or `replace`:
  - `focus_flaw`
  - `expression_strength`
  - `replacement_text`
- `add_beat`:
  - `focus_flaw`
  - `expression_strength`
  - exactly one placement key: `insert_after_turn_id` or `insert_before_turn_id`
  - `new_turn` mapping with:
    - `speaker`
    - `text`

Optional fields such as `before_text`, `operator_note`, or provenance metadata may be included, but these minimum fields are the application contract different implementations must share.

Required top-level keys must always be present as YAML keys, with `candidate_turns: []`, `recommended_turn_ids: []`, `approved_anchors: []`, `proposals: []`, and `revision_history: []` allowed empty before approval.

Allowed `expression_strength` values in v4 are:

- `strongly_expressed`
- `moderately_expressed`

`strongly_expressed` is the preferred default when the flaw is clearly visible and directly teachable. `moderately_expressed` is used when the flaw is present but less overt. These are review aids proposed by `script_doctor`, not required quotas or episode-level distribution targets.

This is the only flaw-strength scale in v4. The legacy `episode-plan.yaml` `amplification` field (`unmistakable | showcased | heightened`) is removed as part of Task 7 along with the rest of `episode-plan.yaml` `flaws[]`; v4 must not maintain two parallel strength vocabularies.

Allowed `status` values on `flaw-proposals.yaml` are:

- `pending_review`
- `approved`
- `needs_revision`

On this artifact, `status` is the persisted review-state field for checkpoint 2. It must be set independently of `approved_anchors` so an operator-approved zero-anchor outcome is still representable and resumable.

`approved_anchors` is the persisted source of truth for the operator-selected turn set used by `create_lesson_package`. It may be empty before approval, and it may also remain empty after approval if the operator intentionally approves a zero-anchor outcome for the episode. The number of approved anchors is variable-length in v4; zero, few, or many are all structurally valid.

Each `approved_anchors` entry should minimally include:

- `turn_id`
- `focus_flaw`
- `expression_strength`

Optional fields such as an operator note or proposal provenance may be included if useful to the implementation, but `approved_anchors` must remain self-sufficient for lesson-package generation. `recommended_turn_ids` is advisory only; `approved_anchors` is authoritative.

These minimum shapes are resumability and implementation contracts, not new app-facing schemas.

## Agent Roles

Identity priming is still important in v4, but role clarity matters more than long prompt prose. The implementation should preserve the following responsibilities.

### Story designer

What it does:

- designs story world, season arc, recurring relationships, and episode progression;
- focuses on narrative potential, not flaw planning;
- does not articulate a flaw inventory in `story.yaml`.

What it does not do:

- plan dialog-level flaw moments;
- assign teaching-anchor counts;
- expose flaw taxonomy language to downstream non-flaw-aware agents.

### Showrunner

Replaces `episode planner`.

What it does:

- plans season arc and per-episode obligations;
- plans private stakes, running threads, and character interior outside the flaw itself;
- writes a prose brief for `staff_writer`.

That brief should encode the story problem through situation design, interpersonal pressure, and episode obligations rather than through direct taxonomy language or explicit quiz-planning instructions.
That brief should encode the story problem through situation design, interpersonal pressure, and episode obligations rather than through direct taxonomy language, explicit quiz-planning instructions, or reader-facing scene scaffolds. It should leave room for `staff_writer` to write a compact, engaging story rather than write toward app-shaped structure.

What it does not do:

- write dialogue;
- choreograph scenes turn by turn;
- decide final teachable moments inside a finished draft;
- plan flaw labels, expression strengths, or anchor counts.

### Staff writer

What it does:

- writes a believable story draft;
- prioritizes voice, subtext, breathing room, and friendship texture;
- uses the showrunner brief, not the flaw taxonomy;
- creates a raw draft rich enough that later flaw selection does not require heavy rewriting;
- assigns stable pre-structuring `turn_id`s in `transcript.raw.yaml` so later proposal review and flaw selection can point to exact dialog turns before app-facing scenes exist;
- uses the same validator-compatible `turn_id` format in the raw draft that the final structured transcript must keep, so later steps do not need to rewrite turn identifiers.

This is a deliberate tradeoff: `staff_writer` should not read the flaw taxonomy directly, and should not be told how many flaws, quizzes, or teaching anchors the app might later render.

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
- preserves dialog order and approved teaching-anchor turns while shaping the reader-facing scaffold.

What it does not do:

- rewrite the story to improve plot or voice;
- move approved teaching anchors just to make sceneing easier;
- treat scene boundaries as the source of truth for flaw selection.

Scene summaries are still authored student-facing text, but they are constrained scaffolding rather than a second story-writing pass. They should stay short, plain, and faithful to the approved draft rather than adding new interpretation.

### Script doctor

Replaces `flaw_injector`.

What it does:

- reads the operator-approved raw draft;
- proposes a candidate set of flawed turns from the actual dialog;
- suggests flaw labels and expression strengths for those turns;
- returns up to 5 candidate teaching anchors by default in the first proposal set, unless the operator asks for more;
- proposes minimal edits, replacements, or new beats when needed;
- applies approved proposals only after operator approval.

What it does not do:

- silently rewrite the story;
- apply changes without operator approval;
- manufacture flaws in characters who should remain corrective;
- act as a second hidden approver after the operator;
- force a quota, band mix, or scene distribution onto the operator-approved set.

### Human operator

What the operator does:

- approves the raw story draft as a story;
- reviews candidate flawed turns proposed by `script_doctor`;
- decides which teaching anchors to approve, reject, relabel, tone down, or revise;
- may ask for more than the default 5 candidates;
- decides the practical instructional scope for the actual learner context.

What the operator does not need the app or validators to do:

- enforce pedagogical quotas;
- enforce a prescribed flaw mix;
- second-guess whether the approved set is instructionally optimal.

## Implementation Tasks

## Task 0 — Archive v3 And Prepare `story.yaml` For v4

Task 0 is a preparatory pass on the story layer, executed before the agent/pipeline/contract tasks below. It is not a new design — it only migrates `story.yaml` and its authoring surfaces to match v4's `story_designer` principle of not authoring a flaw inventory, and it establishes the v3 archive used later by the Ordering regeneration step.

### Scope

1. Archive the current v3 `story.yaml` inline as `stories/{story_id}/story.v3.yaml`. The live file at `stories/{story_id}/story.yaml` is overwritten by the v4 rewrite in the same batch.
2. Rewrite `story.yaml` to the v4 shape:
   - `premise` — field name retained for app/catalog/Prisma continuity. Content becomes a short student-facing overview (see §Premise Guidance in `create_story.md` / `story_designer.md`). No spoilers, no flaw taxonomy language, no per-episode plot detail.
   - `episodes[].summary` — new per-episode field carrying showrunner-facing narrative detail (hypothesis pursued, disproof, episode lead, recurring beats). This is what `create_episodes` reads when it builds `episode-plan.yaml`. Not rendered to students. Required in v4.
   - Strip `episodes[].flaws`. This field is removed from `story.yaml` in v4.
   - Keep `episodes[].final_takeaway` required end-to-end; it remains authored in `story.yaml` and carried downstream into `lesson_package.yaml` by `lesson_package_builder`.
   - Keep `characters[]` (with `voice_notes`) unchanged. Character voice remains showrunner/`staff_writer` fuel and is not student-facing.
3. Update `validate_story.py`:
   - Drop the `episodes[].flaws` required-check.
   - Require `episodes[].summary` as a non-empty string (the `create_episodes` contract depends on it).
   - Reject a stray `flaws` key on any episode with a v4-specific error ("flaw inventories are no longer authored in story.yaml"). This is the enforcement point that prevents silent reuse of v3 `story.yaml` files.
4. Update `pipeline/commands/create_story.md` and `pipeline/agents/story_designer.md`:
   - Remove flaw-authoring instructions and any directive to read `reference/flaw-taxonomy.yaml` during story design.
   - Add premise guidance: student-facing, no spoilers, no taxonomy, short.
   - Add episode-summary guidance: showrunner-facing, per-episode narrative intent, allowed to carry concrete plot detail, not flaw taxonomy.
5. No schema-sketch change: `schemas/story.yaml` already omits `flaws` from its properties list and treats `episodes` as an unshaped array.
6. No app-side changes: the `premise` field name is retained, so `catalog.ts`, `stories/page.tsx`, `schema.prisma`, and existing Prisma migrations are unaffected by Task 0. Any future app surfacing of `episodes[].summary` (e.g., teacher view) would be a separate decision outside Task 0.

### Artifact policy for archived `story.v3.yaml`

The archived file is retained as a qualitative-regression baseline alongside the v2 artifact archive. It is not a supported pipeline input under v4:

- the v4 validator hard-rejects it (because `episodes[].flaws` is present).
- `listCatalogEpisodes` and other runtime reads are filename-matched against `story.yaml`, not `story.v3.yaml`, so catalog loading is unaffected.
- do not edit `story.v3.yaml` after Task 0 lands. If the v3 artifact needs correcting, correct the archive via a fresh commit and explain the reason.

### Notes on `./artifacts/`

As of 2026-04-19, `./artifacts/` contains only `archive/` and `practice/` — no live episode directories. The Ordering step that archives `artifacts/the-white-squirrel/ep0{1..3}/` to `artifacts/archive/the-white-squirrel-v3-prev/` reduces to a no-op on Task 0 entry. If live v3 episode directories reappear before Task 0 lands, archive them in the same task.

### Success criteria

- `python3 pipeline/scripts/validate_story.py stories/the-white-squirrel/story.yaml` → `OK`.
- `python3 pipeline/scripts/validate_story.py stories/the-white-squirrel/story.v3.yaml` → rejects with the v4 errors (`episodes[].summary` missing and `flaws is not allowed`).
- `/stories` rendering shows the new student-facing premise (not the v3 synopsis wall), without any app code changes.
- `episodes[].summary` is present for every episode and carries the per-episode authorial intent `create_episodes` needs.
- No downstream agent is instructed to read `reference/flaw-taxonomy.yaml` at the story-design stage.

### Out of scope for Task 0

- `stories/strangers-in-the-old-forest/` is legacy and untouched by Task 0. It still carries `episodes[].flaws` and lacks `episodes[].summary`, so it fails the v4 validator. That is acceptable: no live pipeline work targets it. If it is ever re-used, it should be migrated as a separate Task 0-style pass or archived outright.

## Task 1 — Rename And Rewrite `episode-planner` As `showrunner`

### File changes

- move `pipeline/agents/episode-planner.md` to `pipeline/agents/showrunner.md`
- update references in command specs, docs, and initializer logic

### Behavioral changes

- keep the existing writer barrier
- delete `flaws[]` (and its child `amplification` field) from `episode-plan.yaml` entirely; the showrunner does not author a flaw inventory in v4. Validator and schema surgery is tracked in Task 7.
- make the projection more prose-forward and less choreographic
- remove scene-based planning requirements from the showrunner stage so the brief can focus on story quality rather than reader scaffolding
- use `narrative_synopsis` and `character_beats` to encourage private stakes, offscreen life, and non-mystery life where they strengthen the episode
- keep the plan focused on storyline design rather than flaw inventory
- make "short reading exercise for 6th graders" an explicit guidance target for episode scope, clarity, and language

### New artifact

- save `showrunner-projection.yaml` under the episode artifact directory

This file is not app-facing. It exists so operators and external tools can inspect exactly what brief `staff_writer` received.

## Task 2 — Rename And Update `screenwriter.md` As `staff_writer`

### File changes

- move `pipeline/agents/screenwriter.md` to `pipeline/agents/staff_writer.md`
- sweep references across command specs, docs, and initializer logic

This task uses `staff_writer` for both the role name and the file name (`staff_writer.md`).

### Behavioral changes

- rename the agent uniformly from `screenwriter` to `staff_writer`
- keep the current writer barrier and story-first stance
- add stronger emphasis on breathing turns, subtext, private stakes, and offscreen life as story-enriching guidance rather than mandatory beat quotas
- discourage episodes that rely only on civic-register stakes when private stakes would make the story stronger
- let the writer draft continuous story flow first rather than writing to app-shaped scenes
- do not expose flaw taxonomy or app quiz-count assumptions to the writer

### New artifact

- save the assembled pre-flaw draft as `transcript.raw.yaml`

This is the operator-reviewable story draft. It is not app-facing.

The minimum shape is a flat ordered `turns` list plus top-level metadata, `revision_history`, and `status`, not app-facing `scenes[]`.

## Task 3 — Rename And Rewrite `flaw_injector` As `script_doctor`

### File changes

- move `pipeline/agents/flaw_injector.md` to `pipeline/agents/script_doctor.md`
- remove `pipeline/agents/flaw-reviewer.md`
- sweep references across command specs, docs, and initializer logic

This task uses `script_doctor` for both the role name and the file name (`script_doctor.md`).

### Behavioral changes

- change the role from direct reviser to proposer-analyst
- read the approved raw draft first, not an unreviewed story draft
- produce a candidate set of flaw-carrying turns, not a fixed-count episode template
- suggest flaw labels and expression strengths for each candidate
- return up to 5 candidates by default in the first proposal set
- prefer the smallest viable edits
- propose new beats only when the draft genuinely lacks the needed flaw landing

### New artifact

- save proposals as `flaw-proposals.yaml`

That file should capture:

- candidate flawed turns
- suggested flaw labels and expression strengths
- an optional recommended subset when useful, without forcing a fixed count
- proposed changes with `proposal_type` drawn from `tweak`, `replace`, `add_beat` (there is no `keep` proposal type; unproposed candidates are kept only if placed in `approved_anchors[]`)
- before/after text when applicable
- a one-sentence reason for each proposal
- escalation notes when a new beat is needed
- a `revision_history` section that records each operator-feedback round as an append-only log with a concise feedback summary and the resulting proposal revision note

Each `revision_history` entry should minimally include `round`, `feedback_summary`, and `revision_note`. A timestamp may be included if useful to the implementation.

The top-level proposal set should reflect the current latest state. Rejected or superseded proposals do not need to remain active in the current set, but each revision round should still be represented in `revision_history`.

Proposal references should use the stable pre-structuring `turn_id`s from `transcript.raw.yaml` or `transcript.post-doctor.yaml`. The structuring pass must preserve those `turn_id`s when it wraps the approved draft into scenes.

If `script_doctor` proposes `add_beat`, the new beat must receive a fresh unused validator-compatible `turn_id` in the post-application draft (numerically larger than any existing id is the safe default), and the new turn must be inserted at its correct list position; existing turn identifiers must not be renumbered or rewritten. See the canonical `turn_id` contract in §Raw-draft and proposal-file shape.

Before and after the apply step, proposal review remains anchored against the stable `turn_id`s present in the approved draft state. `transcript.post-doctor.yaml` becomes the source of truth only because it is the latest approved dialog draft, not because turn identifiers changed. The transcript structurer must preserve those `turn_id`s exactly.

## Task 4 — Add A Transcript-Structuring Pass After Story Approval

### Goal

Move scene segmentation and scene-summary writing to a later scaffold pass so story drafting is not constrained by app-facing scene boundaries.

### File changes

- add `pipeline/agents/transcript-structurer.md` — the initializer's glob in `pipeline/scripts/initialize_polylogue.py:64-71,100-101` syncs new agent files automatically, so no initializer code change is required
- wire command-spec references so `create_transcript.md` can invoke the transcript structurer explicitly

### Behavioral changes

- read the final approved story draft after `script_doctor` application
- segment the draft into app-facing scenes for reading support
- add scene summaries as scaffolding for the reader
- keep approved teaching anchors attached to selected `turn_id`s rather than to scene planning
- preserve dialog order and approved teaching-anchor turns while structuring the transcript
- satisfy the current transcript validator floor, including at least 3 scenes in final `transcript.yaml`

### Output

- write final app-facing `transcript.yaml`

This pass is a reader-scaffolding step, not a story-rewriting step.
If the operator wants a scene-summary adjustment after reviewing `transcript.yaml`, the workflow may send the transcript structurer back for a summary-only revision pass without reopening story-draft or flaw-proposal approval.

That summary-only revision path is an explicit rerun from the latest approved `transcript.post-doctor.yaml`, not a resumable pending-review state on `transcript.yaml`. The rerun overwrites `transcript.yaml` after the structurer finishes. v4 does not add review-state fields to the app-facing transcript artifact.

## Task 5 — Rewrite `create_transcript.md` Around Two Operator Checkpoints Plus Structuring

### Checkpoint 1 — raw story draft

`create_transcript` should:

1. read `story.yaml` for identity and operator context only
2. read `episode-plan.yaml` for identity and operator context only
3. read `showrunner-projection.yaml` as the sole content-bearing brief for `staff_writer`
4. invoke the `staff_writer`
5. save `transcript.raw.yaml` with `status: pending_review`
6. alert the operator in CLI chat to review it
7. on each revision round, re-invoke `staff_writer` with the existing raw draft plus the operator's chat feedback condensed as a new `revision_history` entry; the writer revises in place and preserves all existing `turn_id`s
8. revise until the operator approves the raw draft as a story draft, then set `status` on `transcript.raw.yaml` to `approved`

### Checkpoint 2 — flaw proposals

After raw-draft approval, `create_transcript` should:

1. invoke `script_doctor` on `transcript.raw.yaml`
2. save `flaw-proposals.yaml`
3. alert the operator in CLI chat to review it
4. let the operator approve, reject, relabel, tone down, or request revisions on the current candidate set
5. on each revision round, update `flaw-proposals.yaml` so it includes a concise summary of the latest operator feedback
6. iterate until the operator approves the proposals
7. on approval, persist the operator-approved teaching anchors in `flaw-proposals.yaml` as `approved_anchors`
8. set `status` on `flaw-proposals.yaml` to `approved` when the operator approves the proposal set, even if `approved_anchors` is empty
9. ask `script_doctor` to apply only the latest approved proposal set from `proposals[]` and save `transcript.post-doctor.yaml`, including its proposal provenance fields; `approved_anchors[]` controls lesson selection later, not whether an approved transcript edit is applied
10. set `status` on `transcript.post-doctor.yaml` to `pending_review`
11. alert the operator in CLI chat with a concise post-application summary so they can spot-check `transcript.post-doctor.yaml` for faithful application before structuring continues
12. if that spot-check fails, the operator's chat feedback indicates one of two cases: (a) proposal-set issue — set `flaw-proposals.yaml` `status` back to `needs_revision`, set `transcript.post-doctor.yaml` `status` to `needs_revision`, and reopen checkpoint 2; or (b) application-quality issue — leave `flaw-proposals.yaml` `status` as `approved`, set `transcript.post-doctor.yaml` `status` to `needs_revision`, and re-invoke `script_doctor` to re-apply only. Either way, require the operator to explicitly re-approve the relevant artifact state in chat before proceeding to structuring.
13. once the operator passes the spot-check, set `status` on `transcript.post-doctor.yaml` to `approved`
14. invoke the transcript-structuring pass on `transcript.post-doctor.yaml`
15. save final `transcript.yaml`
16. run `validate_transcript.py`

### Important rule

The command remains human-in-the-loop. It must not silently continue from transcript generation into lesson-package generation.

## Task 6 — Rewrite `create_lesson_package.md` And `lesson_package_builder.md`

### File changes

- remove `flaw-review.md` from `create_lesson_package.md`
- remove `flaw-review.md` from `lesson_package_builder.md`

### Behavioral changes

- build from accepted `transcript.yaml` plus the explicit persisted operator-approved turn anchors in `flaw-proposals.yaml`
- do not introduce a second machine-authored approval layer
- treat the latest approved `transcript.yaml` as the sole transcript text source of truth for package generation
- treat `flaw-proposals.yaml` `approved_anchors` as the sole persisted source of truth for which turns become lesson levels
- preserve the runtime's deterministic rendering and grading contract, but remove fixed-count assumptions from package generation
- keep per-quiz scoring at `3 / 2 / 1 / 0`, but make total available stars dynamic as `3 * levels.length`
- explicitly allow `levels: []` when the operator approved zero anchors; the package is still considered complete for runtime ingestion
- remove `episode.flaws` from `lesson_package.yaml` entirely in v4 rather than deriving or backfilling it from `approved_anchors`
- keep `episode.final_takeaway` required end-to-end, authored once in `story.yaml` and carried into `lesson_package.yaml` by `lesson_package_builder`. v4 does not relax this contract. This field survives the zero-anchor case (an episode may have no lesson levels and still have a narrative final takeaway)
- remove the fixed 10th bonus star from the v2 contract rather than redefining it for variable-length episodes
- update `syncRunStars` in `app/src/lib/quiz.ts:39-60` to drop the +1 bonus and stop writing `bonusEarnedAt`; `starsEarned` becomes the simple sum of quiz stars and total possible is computed in the recap UI as `3 * levels.length`, not stored on `Run`
- retain the `bonusEarnedAt` column on `Run` in Prisma as a deprecated, no-write, no-read field in v4. Removal is deferred to a follow-up cleanup. Pre-v4 rows may carry stale bonus-inflated `starsEarned` values; recap UI behavior is to re-sync `Run.starsEarned` from `QuizAttempt.starsEarned` sums on next interaction so inflated values self-correct on touch, and to derive total possible from `levels.length` regardless of stored values
- `expression_strength` on `approved_anchors` is authoring guidance for prompt/feedback tone and does not propagate into `lesson_package.yaml`; the app-facing package carries `focus_flaw`, prompt text, and scaffolding only
- keep episode completion tied to reaching the end of the transcript; quiz count no longer determines completion semantics
- emit canonical `focus_flaw`, direct prompts, and short scaffolding for each approved anchor

This is not a lesson-package redesign. It is a simplification of the authoring chain.

For avoidance of doubt, the star-layout migration is app-wide, not recap-only. Any UI surface that renders stars must receive the dynamic total derived from the current episode's `levels.length`, and star UI should render nothing when `levels.length === 0`.

## Task 7 — Revise The App And Validator Contract So Quiz Anchoring Is Turn-Based

### Goal

Separate reader scenes from teaching-anchor selection without redesigning the reader into a multi-quiz surface.

### Behavioral changes

- treat `turn_id` as the teaching-anchor key in the app and lesson package
- allow more than one approved teaching anchor to live in the same scene when the story structure warrants it
- keep scenes and scene summaries as reading scaffolds rather than quiz containers
- preserve the current semantic model that the app presents at most one active quiz panel at a time
- stop using scene distinctness as a hard planning or validation requirement for teaching-anchor selection
- the min-3-scenes floor in `validate_transcript.py:40` is preserved as a reader-pacing rule and is unrelated to anchor distribution; the rule being dropped is "lesson levels must target distinct scenes" in `validate_lesson_package.py:284-296` and `catalog.ts:108-134`
- remove assumptions that the app will always receive exactly 3 quizzes or any other fixed count
- stop treating planning artifacts as the source of truth for runtime teaching-anchor distribution

### Validator and schema surgery

- bump `package_meta.schema_version` from `simplified_v2` to `simplified_v4` and apply it uniformly across validators, Zod runtime parsing, catalog ingestion, and generated artifacts in the same sweep; see §Schema-Version Migration for the full touchpoint list and the archived-artifact policy. Mixed old/new episode directories must fail cleanly rather than being partially accepted under one label.
- drop `REQUIRED_LEVEL_COUNT` in `validate_lesson_package.py:24,174-178`; accept `len(levels) >= 0`
- drop the same-scene rejection in `validate_lesson_package.py:284-296`
- remove `episode.flaws` requirements from `validate_lesson_package.py` and `schemas/lesson_package.yaml`
- drop the strictly-increasing-id check in `validate_transcript.py:202-211`; preserve the `tNN` format and uniqueness checks
- delete `flaws[]` validation from `validate_episode_plan.py:60-142`; tolerate a stray `flaws[]` on archived plans by ignoring it rather than rejecting it
- change `app/src/lib/domain.ts:103` `lessonPackageSchema.levels` from `.length(3)` to an unconstrained `z.array(...)`; the existing uniqueness / sequence-index superRefine stays
- drop the same-scene rejection branch from `isEligibleEpisodePair` in `app/src/lib/catalog.ts:108-134`

### Descriptive schemas

- `schemas/transcript.yaml`: retain `scenes[]`/`turns[]` shape but drop "quiz container" framing from the prose
- `schemas/lesson_package.yaml`: document `levels[]` as variable-length (≥0); drop fixed-count language
- `schemas/episode-plan.yaml`: remove the `flaws[]` block and any amplification-band language

### Reader interaction model with multi-anchor scenes

When a scene contains two or more flagged turns:

- each flagged turn renders an in-line indicator at its turn position, not a per-scene single indicator
- selecting one indicator opens that turn's quiz in the right-rail scaffold panel approved 2026-04-18
- selecting a different flagged turn replaces the panel content; only one quiz panel is mounted at a time
- closing the panel returns the reader to plain reading without losing scroll position
- when `levels.length === 0` for an episode, no in-line indicators are rendered and the right-rail panel is never mounted; the recap omits the star summary and treats completion as "transcript finished" only

Per the 2026-04-18 UI freeze approval gate, any visible reader change still requires explicit operator sign-off before edits land.

Implementation note: the reader model must no longer collapse scene quiz state to a single per-scene level. The safe v4 contract is a per-turn lookup keyed by `turn_id` (or an equivalent `flaggedLevels[]` collection resolved per scene) so multiple anchors in one scene remain representable without changing the single-active-panel behavior.

### Required surfaces

- update the reader so it can surface multiple flagged turns within the same scene without assuming one quiz per scene
- keep the reader on a single-active-quiz model: selecting one flagged turn opens that turn's quiz in the shared panel and does not require showing multiple quiz panels at once
- update lesson-package validation to stop rejecting multiple quiz turns in the same scene or a variable number of levels
- update catalog eligibility checks to stop rejecting same-scene quiz targets
- update episode-plan validation and authoring guidance to stop requiring flaw inventories, band mixes, or distinct-scene quiz moments
- update docs so scenes are described as reading scaffolds and teaching anchors are described as turn-anchored and variable-length
- update app scoring and recap logic to derive total possible stars from `levels.length` and to drop the fixed bonus-star assumption
- update every star-rendering surface, not only recap logic, so card rows, in-reader star displays, and any hero/summary star rows all use the same dynamic total and omit star UI entirely for zero-level episodes
- surface each episode's `final_takeaway` on the `/stories` page inside its story section when every episode in that story has a completed run; takeaways stay hidden until story completion so they read as a closing narrative beat rather than a spoiler. Render all takeaways together (one per episode, in episode order) inside the existing per-story `<section>`. This is a net-new reader-visible surface and requires UI-freeze sign-off before implementation

## Required Migration Sweep

The implementation should explicitly update all surfaces that still describe the old flow, not just the agent files.

The scoring migration follows Task 6: `bonusEarnedAt` is retained in Prisma as a deprecated, no-write, no-read column during v4 and is scheduled for removal in a follow-up cleanup. Schema, docs, and code changes in this sweep must match that decision rather than re-litigate it.

The artifact-version migration is carried through this same sweep per §Schema-Version Migration below. Validators, Zod runtime parsing, catalog eligibility checks, docs, and artifact generation all flip in the same rollout so partial upgrades fail loudly rather than misloading content.

### Schema-Version Migration

In v4 the lesson-package label moves from `simplified_v2` to `simplified_v4`. The decision skips `simplified_v3` intentionally — v3 was a narrow shape cleanup (removing `kind: action` turns) that did not alter the lesson-package contract, and bumping the label only now, when variable-length `levels[]`, turn-based anchoring, removal of `episode.flaws`, and the bonus-star retirement all break the old contract, keeps label changes aligned with real contract breaks.

**Label bump applies to `lesson_package.yaml` only.** Three independent decisions govern the sweep:

1. **Label.** `package_meta.schema_version` on `lesson_package.yaml` becomes `simplified_v4`. All of the following must flip together in the same rollout:
   - `SCHEMA_VERSION` constant in `pipeline/scripts/validate_lesson_package.py`
   - `z.literal("simplified_v2")` in `app/src/lib/domain.ts:95` → `z.literal("simplified_v4")`
   - every newly generated `artifacts/{story_id}/{episode_id}/lesson_package.yaml`
   - authoring guidance in `pipeline/agents/lesson_package_builder.md`
   - label references in `docs/tech-reference.md` and any doc describing the package contract
   - the descriptive schema in `schemas/lesson_package.yaml`
2. **Archived `simplified_v2` packages → hard reject.** Existing archived packages under `artifacts/archive/**` are not migrated, not re-labeled, and not accepted by the new validator. `syncCatalogFromFilesystem` already scopes to `artifacts/{story_id}/` excluding the archive, so rejection does not affect catalog loading. The archive remains a human-readable qualitative-regression baseline; it does not need to validate under v4.
3. **Practice package stays at `simplified_v2`.** `practice_package.yaml`, `validate_practice_package.py`, and `schemas/practice_package.yaml` are untouched by v4. Practice is explicitly out of scope, practice and lesson validators are independent, and the labels live in separate `package_meta` fields on separate artifacts, so no conflict arises from the lesson bump alone.

Half-applied migrations are a hard failure mode: a v4-era `lesson_package.yaml` still labeled `simplified_v2`, or a `simplified_v4` package that still carries `episode.flaws` or exactly 3 levels, must be rejected by the validator rather than silently accepted. The Task 7 validator and Zod edits are the enforcement point for this.

At minimum, sweep:

- `pipeline/commands/create_episodes.md`
- `pipeline/commands/create_transcript.md`
- `pipeline/commands/create_lesson_package.md`
- `pipeline/commands/create_story.md` *(Task 0)*
- `pipeline/agents/story_designer.md` *(Task 0)*
- `pipeline/agents/lesson_package_builder.md`
- `pipeline/agents/README.md`
- `pipeline/reference/language-guide.md`
- `pipeline/scripts/_intermediate_guards.py` (new helper, not a validator; see Artifact policy)
- `pipeline/scripts/validate_story.py` *(Task 0)*
- `pipeline/scripts/validate_episode_plan.py`
- `pipeline/scripts/validate_transcript.py`
- `pipeline/scripts/validate_lesson_package.py`
- `pipeline/scripts/initialize_polylogue.py`
- `schemas/transcript.yaml`
- `schemas/lesson_package.yaml`
- `schemas/episode-plan.yaml`
- `app/src/lib/domain.ts`
- `app/src/lib/catalog.ts`
- `app/src/lib/quiz.ts`
- `app/src/app/_components/StarRow.tsx`
- `app/src/app/page.tsx`
- `app/src/app/stories/page.tsx`
- `app/src/app/runs/[runId]/_components/ContinuousSceneReader.tsx`
- `app/src/app/runs/[runId]/_components/QuizPanel.tsx`
- `app/src/app/runs/[runId]/scene/[n]/page.tsx`
- `app/src/lib/content.ts`
- `app/prisma/schema.prisma`
- `docs/tech-reference.md`
- `docs/instructional-design.md`
- `docs/operator-workflow.md`

### Per-file scope notes

To make the sweep actionable rather than a checklist:

- `pipeline/commands/create_*.md` — rewrite around the showrunner→`staff_writer`→`script_doctor`→`transcript_structurer` chain plus the two checkpoints; remove screenwriter-projection language. `create_story.md` (Task 0) drops `reference/flaw-taxonomy.yaml` as an input, removes flaw-inventory authoring, and adds student-facing premise guidance
- `pipeline/agents/story_designer.md` (Task 0) — drop the "story-level flaw palette" and "flaw progression" responsibilities; rename what the designer authors to `story_id`, `title`, `premise` (student-facing), `setting`, `characters`, and `episodes[]` with only `episode_id`, `title`, `final_takeaway`
- `pipeline/agents/lesson_package_builder.md` — drop `flaw-review.md` input, source approved anchors from `flaw-proposals.yaml` `approved_anchors`, allow zero-level packages
- `pipeline/agents/README.md` — re-enumerate the agent set
- `pipeline/reference/language-guide.md` — drop amplification vocabulary; keep only `expression_strength` strong/moderate language
- `pipeline/scripts/_intermediate_guards.py` — new shape-check helper for the four intermediate artifacts; verifies presence/parseability of required top-level keys only, no semantic rules
- `schemas/transcript.yaml`, `schemas/lesson_package.yaml`, `schemas/episode-plan.yaml` — see Task 7 §Descriptive schemas
- `pipeline/scripts/validate_story.py` (Task 0) — drop the `episodes[].flaws` required-check; reject a stray `flaws` key on any episode with a v4-specific error ("flaw inventories are no longer authored in story.yaml"). Keep `final_takeaway` optional-but-validated; it is authored per-episode and required at the `lesson_package.yaml` stage
- `pipeline/scripts/validate_*.py` — see Task 7 §Validator and schema surgery for line-level edits
- `docs/instructional-design.md` — update student-journey wording so scenes are reading scaffolds and teaching anchors are turn-based
- `docs/operator-workflow.md` — replace the screenwriter→flaw_injector→flaw_reviewer narrative with the four-stage v4 chain plus the two checkpoints; retain human-judgment final-quality language
- `docs/tech-reference.md` — update the artifact map to add `showrunner-projection.yaml`, `transcript.raw.yaml`, `flaw-proposals.yaml`, `transcript.post-doctor.yaml` and mark them pipeline-only
- `app/src/lib/domain.ts` — drop `levels.length(3)`; runtime contract changes per Task 7 §Validator and schema surgery
- `app/src/lib/quiz.ts` — see Task 6 `syncRunStars` change
- `app/src/app/_components/StarRow.tsx` — render variable-length stars; render nothing when `levels.length === 0`
- `app/src/lib/content.ts` and reader/page call sites — propagate `levels.length`-derived star totals into every `StarRow` use so the UI does not keep the old fixed 10-star presentation by default
- `app/src/app/runs/[runId]/_components/ContinuousSceneReader.tsx` and `QuizPanel.tsx` — see Task 7 §Reader interaction model with multi-anchor scenes
- `app/src/app/runs/[runId]/scene/[n]/page.tsx` — surface multiple anchors per scene without changing the route shape
- `app/src/app/stories/page.tsx` — when every episode in a story has a completed run, render each episode's `final_takeaway` inside that story's section (ordered by episode). Needs a completion check against student runs and a per-episode takeaway read from `lesson_package.yaml`; extend the existing render-time blurb read or add a takeaway to the same read path. Hidden until full-story completion
- `app/src/lib/catalog.ts:108-134` — drop the same-scene rejection in `isEligibleEpisodePair`
- `pipeline/scripts/initialize_polylogue.py` — typically no edits needed; the agent/command globs auto-pick up renames. Re-run after the rename sweep.

The current repo still describes:

- ephemeral projection handoffs
- `screenwriter`
- `flaw_injector`
- `flaw_reviewer`
- required `flaw-review.md`
- scenes as quiz-distribution containers
- exact-three quiz requirements
- fixed-band amplification requirements
- distinct-scene quiz requirements
- descriptive schema text that still explains scenes as quiz containers or requires same-scene rejection behavior

All of those references need to move to the v4 model together.

## App And Validator Impact

App/runtime impact is no longer purely prompt-level. v4 now includes a contained app and validator contract revision.

- no Prisma migration
- the app should continue to consume final `transcript.yaml` and `lesson_package.yaml`
- transcript structuring remains upstream of the app and does not introduce runtime generation
- teaching-anchor selection stays `turn_id`-based, but the current one-quiz-per-scene assumption must be removed from reader and validator logic while preserving a single active quiz panel in the UI
- the app must not assume a fixed number of levels; zero, few, or many are structurally valid
- when `levels.length === 0`, the recap omits the star summary, no in-line quiz indicators are rendered, and `QuizPanel` is never mounted; completion is purely transcript-finished
- runtime scoring must stay per-quiz but derive total possible stars from the actual number of lesson levels, with no fixed bonus-star rule
- completion remains tied to finishing the transcript reader rather than to any fixed quiz cardinality
- `bonusEarnedAt` is retained in Prisma as a deprecated no-write, no-read column per Task 6; v4 runtime logic must neither write nor read it. Pre-v4 rows with inflated `Run.starsEarned` self-correct on next `syncRunStars` touch.
- catalog eligibility (`syncCatalogFromFilesystem` / `isEligibleEpisodePair` in `app/src/lib/catalog.ts:108-134`) drops the same-scene rejection; an empty `levels[]` returns vacuously eligible
- "pipeline-only" means consumed by other pipeline commands and operator review surfaces, not by the runtime app or its catalog. Intermediate artifacts must not become runtime inputs.
- the Zod runtime contract in `app/src/lib/domain.ts` must be updated in the same sweep as the validators and prose docs

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
4. re-run `python3 simplified-framework/pipeline/scripts/initialize_polylogue.py` so `.claude/agents/` and `.claude/commands/` pick up the renames before any further task uses them
5. add the transcript-structuring pass that scenes the approved draft for the reader
6. rewrite `create_transcript.md` around the two operator checkpoints plus structuring
7. rewrite `create_lesson_package.md` and `lesson_package_builder.md` to stop depending on `flaw-review.md`
8. revise the app and validator contract so quizzes are anchored by turn, not constrained by scenes
9. sweep docs and initializer references
10. archive existing `flaw-review.md` files under `artifacts/archive/` (they retain historical reviewer notes useful for the qualitative comparison) and move current `artifacts/the-white-squirrel/ep0{1..3}/` into `artifacts/archive/the-white-squirrel-v3-prev/` before regenerating, so the v2 archive stays untouched and the v3 baseline is preserved
11. regenerate `the-white-squirrel` ep01–03 end to end and compare qualitatively against `artifacts/archive/the-white-squirrel-v2/`

Final sign-off is human judgment, not just validator green status.

## Operator Review Standard

The operator is the final quality gate for story quality.

At checkpoint 1, the operator is approving `transcript.raw.yaml` as a story draft.

At checkpoint 2, the operator is approving the proposal set for final teaching-anchor selection, flaw labeling, expression-strength judgment, and edits.

The later transcript-structuring pass is not a second creative approval gate. It is a reader-scaffolding step that should preserve the approved story and selected teaching-anchor turns. Its scene summaries are still student-facing authored text, but they are constrained scaffolding and should be reviewed only for faithfulness, clarity, and brevity rather than as a new story-quality checkpoint.

Review guidance should prioritize:

- whether the draft reads like a believable story rather than a reasoning demo;
- whether character voice, subtext, private stakes, and breathing room are strong enough for this episode, without treating any single heuristic as a required checkbox;
- whether the proposed or applied teaching anchors are genuinely teachable for the actual learner context;
- whether the resulting `transcript.yaml` is strong enough for `create_lesson_package` to build direct, short, deterministic app-facing prompts without guesswork.

## Out Of Scope

- broad app UI redesign
- lesson-package runtime redesign
- flaw taxonomy changes
- story-format changes
- new flaw types or quiz types
- practice-package changes
- multi-episode mechanics beyond existing planning
- any LLM-at-runtime feature
- broadening file-based review-state semantics beyond the explicit v4 `status` plus `approved_anchors` contracts on the checkpoint artifacts
