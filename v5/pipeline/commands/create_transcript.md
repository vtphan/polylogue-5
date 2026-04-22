---
name: create_transcript
description: Produce one episode's final transcript through staff_writer → script_doctor (propose, apply) → transcript_structurer, with three operator approval gates.
---

# /create_transcript

`/create_transcript {story_id} {episode_id}` drives one episode of the v5 pipeline through three specialized subagents and three operator approval gates. It owns four artifacts under `v5/artifacts/{story_id}/{episode_id}/`:

- `transcript.raw.yaml`
- `reasoning-proposals.yaml`
- `transcript.post-doctor.yaml`
- `transcript.yaml`

It reads but never modifies `v5/stories/{story_id}/story.yaml` or `v5/stories/{story_id}/story-design-review.md`.

## Arguments

```
/create_transcript {story_id} {episode_id}
```

Both arguments are required and positional.

- `{story_id}` must match a directory under `v5/stories/` containing a `story.yaml` whose top-level `story_id` field equals `{story_id}`. If no match, stop and list available stories.
- `{episode_id}` must exist in that story's `episodes[]` array. If no match, stop and list available episode ids for that story.

Episode ids (`episode_01`, `episode_02`, …) are not globally unique across stories — that's why `{story_id}` is required.

## Reads at session start

- `v5/stories/{story_id}/story.yaml` — the whole story is read; agents decide what they need.
- `v5/stories/{story_id}/story-design-review.md` — must contain `Status: approved`.
- `v5/reference/reasoning-taxonomy.yaml` — passed through to `script_doctor` only.

## Writes (owned artifacts)

All under `v5/artifacts/{story_id}/{episode_id}/`:

- `transcript.raw.yaml` — produced by `staff_writer`
- `reasoning-proposals.yaml` — produced by `script_doctor` (propose mode)
- `transcript.post-doctor.yaml` — produced by `script_doctor` (apply mode)
- `transcript.yaml` — produced by `transcript_structurer`

## Entry checks

Run these in order on invocation; stop at the first failure.

1. **Story exists.** `v5/stories/{story_id}/story.yaml` exists and its top-level `story_id` equals `{story_id}`. If not, report and list directories under `v5/stories/` whose `story.yaml` parses cleanly.
2. **Episode exists.** `{episode_id}` is present in that `story.yaml`'s `episodes[]` array. If not, report and list that story's available `episode_id`s.
3. **Upstream approval.** `v5/stories/{story_id}/story-design-review.md` exists and contains a line `Status: approved` (leading/trailing whitespace permitted). If not, refuse to run — direct the operator to complete `/design_story` Phase D.
4. **Owned-artifact rerun check.** If any of the four owned artifacts already exist for this `{story_id}/{episode_id}`:
   - report which exist
   - warn that `v5/artifacts/{story_id}/{episode_id}/lesson_package.yaml`, if present, may become stale
   - ask the operator to confirm a fresh run
   - on confirmation, delete the owned artifacts and proceed
   - on refusal, stop — there is no cross-session resume ladder in v5

Within a single run, the operator may loop at any gate as many times as they like — that is intra-run iteration, not resume.

## Three-checkpoint sequence

### Checkpoint 1 — Raw draft

1. Invoke `staff_writer` with `{story_id}`, `{episode_id}`, and the path `v5/stories/{story_id}/story.yaml`. The agent reads the whole story, selects the target episode block by id, and drafts `transcript.raw.yaml`.
2. Report path and a brief summary to the operator (number of turns, rough word count, whether narrator is used).
3. Operator reviews and either approves, asks for a targeted revision, or asks for a full redraft.
4. On revision: re-invoke `staff_writer` with a condensed operator feedback summary; preserve unchanged `turn_id`s across drafts. Loop until the operator approves.
5. On approval: keep `transcript.raw.yaml` as-is (the schema carries no `status` field) and proceed to Checkpoint 2.

Review prompts for this gate live in `v5/docs/operator-workflow.md` §4 under "Gate: raw-draft review."

### Checkpoint 2 — Reasoning proposals

1. Invoke `script_doctor` in propose mode on the approved `transcript.raw.yaml`. The agent reads the raw draft plus `v5/reference/reasoning-taxonomy.yaml` **and nothing else** — in particular, it does not read `story.yaml` or the target episode's `episode_synopsis`.
2. Write `reasoning-proposals.yaml` with `status: pending_review`.
3. Run `python3 v5/pipeline/scripts/validate_reasoning_proposals.py <path>`. If validation fails, fix the file (re-invoke `script_doctor` if the shape is structurally off) before showing it to the operator. Do not ask the operator to review an invalid file.
4. Report path, proposal count, and a one-line summary per proposal (`turn_id`, `reasoning_item_id`, `polarity`, whether `revised_text` is proposed).
5. Operator reviews and either approves the set, asks for revision, or rejects individual proposals. Acceptance criteria per proposal live in `v5/docs/instructional-design.md` §4.1.
6. On revision: re-invoke `script_doctor` with condensed feedback and increment the `revision_history` round. Re-run the validator. Loop until the operator approves.
7. On approval: the operator commits the final approved subset in `approved_anchors[]`. `approved_anchors` may be empty — that is a legitimate outcome (no anchors cleanly qualify). Set `reasoning-proposals.yaml` `status: approved` and re-run the validator.

### Checkpoint 3 — Post-doctor spot-check

1. Invoke `script_doctor` in apply mode. The agent reads the approved `reasoning-proposals.yaml` plus the raw draft and writes `transcript.post-doctor.yaml`:
   - every `turn_id` preserved
   - every non-anchor turn byte-identical to its raw counterpart (no `original_text`, no `source_proposal_id`)
   - approved `revised_text` applied in place on anchor turns, with `original_text` and `source_proposal_id` attached
2. Report path and a summary: total turns, number revised, turn-ids of revised turns so the operator can eyeball the diff.
3. Operator spot-checks each revised turn in context.
4. Two possible failure modes:
   - **Application quality is poor, but the approved proposal set still stands.** Leave `reasoning-proposals.yaml` at `status: approved`. Re-invoke `script_doctor` in apply mode with feedback on what read wrong. Loop until the spot-check passes.
   - **The proposal set itself needs to change** (a proposal that looked fine in isolation reads wrong in applied context, or a revision can't be made believable without changing the proposal). Set `reasoning-proposals.yaml` back to `status: needs_revision`, re-run the proposals validator, and reopen Checkpoint 2.
5. On spot-check approval: proceed to the structuring pass. `transcript.post-doctor.yaml` carries no `status` field of its own; its acceptance is the conversational signal to proceed.

### Structuring pass

1. Invoke `transcript_structurer` on the approved `transcript.post-doctor.yaml`.
2. Write `transcript.yaml`.
3. Run `python3 v5/pipeline/scripts/validate_transcript.py <path>`.
4. If validation fails, re-invoke `transcript_structurer` with the validator output as feedback. Loop until it passes. If the problem is structural and not fixable without altering turns, escalate to the operator — do not let `transcript_structurer` edit turn text or turn ids.
5. On validator pass, report the final path and a one-line summary (scene count, total turns, anchor turn-ids for operator reference) and stop. Do not auto-run `/create_lesson_package`.

## What this command must not do

- infer approval from artifact presence alone
- auto-resume from a partial prior run across sessions
- let any subagent other than `script_doctor` revise turn text
- leak `episode_synopsis` or any other story-level field into `script_doctor`'s input
- allow `transcript_structurer` to reorder, renumber, or edit turns
- silently continue into `/create_lesson_package` after the transcript validates

The operator is the judge of whether each gate passes. This command's job is to sequence agents, enforce artifact invariants, and run validators — not to approve on the operator's behalf.

## References

- `v5/docs/architecture.md` §2.3 (detection layer), §3.1 (command ownership), §3.2 (agent responsibilities)
- `v5/docs/instructional-design.md` §3.5 (narrator role), §4 (detection pedagogy)
- `v5/docs/operator-workflow.md` §3 (typical workflow), §4 (per-gate review targets)
- `v5/schemas/transcript-intermediate.yaml` (raw + post-doctor shape)
- `v5/schemas/reasoning-proposals.yaml` (proposals shape)
- `v5/schemas/transcript.yaml` (final transcript shape)
- `v5/reference/reasoning-taxonomy.yaml` (taxonomy — `script_doctor` only)
