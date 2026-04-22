---
name: create_lesson_package
description: Author one episode's lesson package — episode chrome plus the three-step quiz per approved anchor — from an accepted transcript and approved reasoning proposals.
---

# /create_lesson_package

`/create_lesson_package {story_id} {episode_id}` produces `v5/artifacts/{story_id}/{episode_id}/lesson_package.yaml` — the deterministic, app-facing teaching artifact for one episode. One subagent (`lesson_package_builder`), one review gate, one validator.

This command owns `lesson_package.yaml` and nothing else. It reads but never modifies `story.yaml`, `story-design-review.md`, `transcript.yaml`, or `reasoning-proposals.yaml`.

## Arguments

```
/create_lesson_package {story_id} {episode_id}
```

Both arguments are required and positional.

- `{story_id}` must match a directory under `v5/stories/` containing a `story.yaml` whose top-level `story_id` equals `{story_id}`.
- `{episode_id}` must exist in that story's `episodes[]` array.

Episode ids (`episode_01`, `episode_02`, …) are not globally unique across stories, which is why both are required.

## Reads at session start

- `v5/stories/{story_id}/story.yaml` — whole story. The target episode block (selected by `{episode_id}`) provides `title` + `final_takeaway` as chrome and `episode_synopsis` as orientation. Prior episode synopses provide recap material for `previously`.
- `v5/stories/{story_id}/story-design-review.md` — must contain `Status: approved`.
- `v5/artifacts/{story_id}/{episode_id}/transcript.yaml` — final app-facing transcript. Must validate.
- `v5/artifacts/{story_id}/{episode_id}/reasoning-proposals.yaml` — must have top-level `status: approved`; `approved_anchors[]` is the source of truth for levels (may be empty).
- `v5/reference/reasoning-taxonomy.yaml` — taxonomy faces used when authoring Step 3 feedback and per-level takeaways.

## Writes (owned artifacts)

- `v5/artifacts/{story_id}/{episode_id}/lesson_package.yaml`

## Entry checks

Run these in order on invocation; stop at the first failure.

1. **Story exists.** `v5/stories/{story_id}/story.yaml` exists and its top-level `story_id` equals `{story_id}`. If not, report and list available stories.
2. **Episode exists.** `{episode_id}` is present in that `story.yaml`'s `episodes[]` array. If not, report and list that story's available `episode_id`s.
3. **Upstream approval (story).** `v5/stories/{story_id}/story-design-review.md` exists and contains a line `Status: approved`.
4. **Transcript ready.** `v5/artifacts/{story_id}/{episode_id}/transcript.yaml` exists and passes `python3 v5/pipeline/scripts/validate_transcript.py`. If it fails, refuse to run — the transcript is the source of turn text; authoring a lesson package on a broken transcript is meaningless.
5. **Proposals approved.** `v5/artifacts/{story_id}/{episode_id}/reasoning-proposals.yaml` exists and its top-level `status` is `approved`. `approved_anchors[]` may be empty.
6. **Owned-artifact rerun check.** If `lesson_package.yaml` already exists for this `{story_id}/{episode_id}`:
   - report that it exists
   - ask the operator to confirm a fresh run
   - on confirmation, delete it and proceed
   - on refusal, stop — there is no cross-session resume ladder in v5

If `approved_anchors[]` is empty, inform the operator that the package will carry episode chrome only and confirm they want to proceed. The builder will produce a valid package with `levels: []`.

## Single checkpoint — Package review

1. Invoke `lesson_package_builder` with:
   - `{story_id}`, `{episode_id}`
   - `v5/stories/{story_id}/story.yaml`
   - `v5/artifacts/{story_id}/{episode_id}/transcript.yaml`
   - `v5/artifacts/{story_id}/{episode_id}/reasoning-proposals.yaml`
   - `v5/reference/reasoning-taxonomy.yaml`
2. The agent authors the whole package in one pass: `package_meta`, `episode` chrome (`title`, `summary`, optional `previously`, `final_takeaway`), and one level per approved anchor in transcript-appearance order. Step 1 and Step 3 each carry 3 options (1 correct + 2 distractors) with per-choice feedback. Step 2 carries the fixed two options and optional `routing_text` only.
3. Run `python3 v5/pipeline/scripts/validate_lesson_package.py <path>`. The validator auto-discovers `transcript.yaml` and `reasoning-proposals.yaml` alongside and enforces:
   - schema shape (including `schema_version: v5`)
   - `episode.previously` gating on `episode_number`
   - Step 2 options limited to `yes_strong` / `no_unsure`, no feedback
   - `feedback.correct.option_ids` references valid `option_id`s in that step
   - `feedback.by_option` is wrong-answer-only
   - level `turn_id`s exist in `transcript.yaml` and appear in `approved_anchors[]`
   - level `reasoning_item_id`, `polarity`, `intended_claim` match the approved anchor
   - levels ordered by anchor-appearance order in `transcript.yaml`
   
   If validation fails, do **not** show the operator the broken package. Re-invoke the builder with the validator output as feedback and loop until it passes.
4. Report the path and a compact summary: level count, per-level `(turn_id, reasoning_item_id, polarity)` triples, whether `previously` was authored, and any soft-cap warnings from the validator.
5. Operator reviews the whole package. Two outcomes:
   - **Targeted revision.** The operator flags specific levels or chrome fields for rework. Re-invoke the builder with a condensed feedback summary naming what to change and by `level_id`. The builder keeps unflagged levels intact and re-authors only the flagged material. Re-run the validator. Loop until the operator approves.
   - **Approval.** The operator accepts the package. Stop. Do not auto-chain into anything else.

There is no second checkpoint. Revision is intra-run.

## What this command must not do

- infer approval from artifact presence alone
- auto-resume from a partial prior run across sessions
- regenerate or modify `story.yaml`, `story-design-review.md`, `transcript.yaml`, or `reasoning-proposals.yaml`
- show the operator a validator-failing package
- author levels for turns that are not in `approved_anchors[]`
- author a Step 2 with per-choice feedback
- continue past the review gate without explicit operator approval

The operator is the judge of whether the package is good enough. This command's job is to sequence the agent, enforce artifact invariants, and run the validator.

## References

- `v5/docs/architecture.md` §2.4 (teaching layer), §3.1 (command ownership), §3.2 (agent responsibilities), §4.11 (claim-identification binding)
- `v5/docs/instructional-design.md` §5 (three-step quiz)
- `v5/docs/operator-workflow.md` §3 Step 3 (typical workflow), §4 "Approval Gates in Detail" (review targets)
- `v5/schemas/lesson_package.yaml` (output shape)
- `v5/pipeline/agents/lesson_package_builder.md` (authoring doctrine)
- `v5/reference/reasoning-taxonomy.yaml` (weak/strong faces)
