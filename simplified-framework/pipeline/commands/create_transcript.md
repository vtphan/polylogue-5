---
description: Generate one episode transcript through the v4 raw-draft review, flaw-proposal review, post-doctor spot-check, and transcript-structuring flow
---

# Create Transcript

Generate one transcript at a time for the simplified Lens pipeline.

This command is human-in-the-loop.

It must not silently move from transcript generation into package generation.

Files are the working review surfaces. CLI chat is the approval channel.

## Final Output Target

The final app-facing transcript artifact is:

- `artifacts/{story_id}/{episode_id}/transcript.yaml`

This should follow:

- `schemas/transcript.yaml`

Transcripts are organized as **3+ scenes** with nested turns. Each scene has a `scene_id`, a plain-language `summary`, and `turns[]`. `turn_id` is globally unique across the whole transcript and stays in validator-compatible `tNN` form.

Validation script:

- `python3 pipeline/scripts/validate_transcript.py artifacts/{story_id}/{episode_id}/transcript.yaml`

## Intermediate Artifacts

This command persists the following pipeline-only review surfaces under `artifacts/{story_id}/{episode_id}/`:

- `showrunner-projection.yaml`
- `transcript.raw.yaml`
- `flaw-proposals.yaml`
- `transcript.post-doctor.yaml`
- `transcript.yaml`

These saved files, not chat state, drive resumability.

## Required Inputs And Boundaries

- `stories/{story_id}/story.yaml`
- `artifacts/{story_id}/{episode_id}/episode-plan.yaml`
- `artifacts/{story_id}/{episode_id}/showrunner-projection.yaml`
- `reference/flaw-taxonomy.yaml`

`showrunner-projection.yaml` is the sole content-bearing brief for `staff_writer`.

- `story.yaml` is read for identity and operator context only
- `episode-plan.yaml` is read for identity and operator context only
- `showrunner-projection.yaml` is the only narrative brief passed downstream to `staff_writer`
- `staff_writer` must not be given `reference/flaw-taxonomy.yaml`
- `script_doctor` is the first explicit flaw-aware stage

`create_transcript` may not regenerate or silently substitute a missing projection from `episode-plan.yaml`. A missing `showrunner-projection.yaml` is a hard restart from `create_episodes`.

The required projection shape is:

```yaml
story_id: <str>
episode_id: <str>
title: <str>
narrative_synopsis: >-
  <episode_goal rewritten in plot and texture terms only, no flaw vocabulary>
hypothesis_pursued: >-
  <the wrong explanation the group anchors on this episode, phrased as a plot anchor>
disproof_event: >-
  <the visible beat that wobbles or disproves the hypothesis>
character_beats:
  - character_id: <id>
    beat: <voice, prop, physicality, and arc notes; flaw references removed>
running_threads:
  - <story-level thread this episode must plant or pay off, in plot terms>
plot_obligations:
  - <vocabulary-flagging obligation or must-happen beat, in story terms>
```

Do not merge story content from `episode-plan.yaml` into this brief at transcript-write time.

## Subagent Roles

This command should use three specialized subagents:

### 1. `staff_writer`

Responsibilities:

- draft a natural raw story transcript from the saved showrunner projection
- preserve character voice
- build momentum through dialogue, subtext, and reaction
- write a flat ordered `turns[]` draft with stable `tNN` turn ids

Required file output:

- `artifacts/{story_id}/{episode_id}/transcript.raw.yaml`

### 2. `script_doctor`

Responsibilities:

- read the operator-approved raw draft against the taxonomy
- propose up to 5 candidate teaching anchors by default in `flaw-proposals.yaml`
- let the operator iterate on candidate selection and edits before any application step
- apply only the latest operator-approved proposal set
- write `transcript.post-doctor.yaml` only after proposal approval

Required file output:

- `artifacts/{story_id}/{episode_id}/flaw-proposals.yaml`
- `artifacts/{story_id}/{episode_id}/transcript.post-doctor.yaml`

### 3. `transcript_structurer`

Responsibilities:

- read the final approved post-doctor draft
- segment it into app-facing scenes
- add concise scene summaries
- preserve dialog order and approved teaching-anchor turns while structuring

Required file output:

- `artifacts/{story_id}/{episode_id}/transcript.yaml`

## Review Standard

The standard is:

- natural dialogue
- strong enough story texture before flaw application
- clear enough flaw moments after operator-approved proposal work
- faithful post-doctor application before structuring
- reader-supportive scene scaffolding without rewriting the approved story
- suitable for a short 8-10 minute reading exercise for 6th graders

## Artifact Contracts

Use `python3 pipeline/scripts/_intermediate_guards.py <path>` as the minimal resumability guard for pipeline-only artifacts.

This command only needs the following artifact rules in prompt scope:

- `transcript.raw.yaml` is a flat ordered turn list with top-level metadata, `revision_history`, and `status`
- `transcript.post-doctor.yaml` keeps the same draft shape and adds proposal provenance plus `status`
- `flaw-proposals.yaml` stores proposal-review state, approved lesson anchors in `approved_anchors`, and the latest proposal set to apply
- `turn_id`s stay validator-compatible (`tNN`) and must be preserved once written
- `showrunner-projection.yaml` must carry the stripped brief fields documented above

Detailed per-field contracts live in the active command, agent, helper, and validator scripts.

## Resumability Ladder

Resume from saved artifacts in this order:

1. If `transcript.yaml` exists and validates, treat the transcript stage as complete.
2. Else if `transcript.post-doctor.yaml` passes `_intermediate_guards.py`, branch on `status`:
   - `approved`: invoke `transcript_structurer` directly without re-prompting.
   - `pending_review`: resume at the post-application operator spot-check.
   - `needs_revision`: inspect `flaw-proposals.yaml`.
     - if `flaw-proposals.yaml` is missing or has `status: needs_revision`, reopen checkpoint 2 proposal review.
     - if `flaw-proposals.yaml` has `status: approved`, re-invoke `script_doctor` for re-application only.
3. Else if `flaw-proposals.yaml` passes `_intermediate_guards.py`, branch on `status`:
   - `approved`: apply the latest approved proposal set, even if `approved_anchors` is empty.
   - otherwise: resume at checkpoint 2 proposal review.
4. Else if `transcript.raw.yaml` passes `_intermediate_guards.py`, branch on `status`:
   - `approved`: invoke `script_doctor` to write `flaw-proposals.yaml`.
   - otherwise: resume at checkpoint 1 raw-draft review.
5. Else if `showrunner-projection.yaml` passes `_intermediate_guards.py`, invoke `staff_writer` from that saved brief.
6. Else restart the episode flow from `create_episodes`.

A half-written, empty, or structurally incomplete intermediate artifact counts as missing and must be regenerated from the prior checkpoint.

Artifact presence alone is not approval state. `status` fields on `transcript.raw.yaml`, `flaw-proposals.yaml`, and `transcript.post-doctor.yaml` are the persisted operator-review state.

## Required Command Sequence And Checkpoints

`create_transcript` should execute in this order:

1. read `story.yaml`
2. read the selected `episode-plan.yaml`
3. read `showrunner-projection.yaml` as the sole content-bearing brief
4. run `_intermediate_guards.py` against whichever saved intermediate artifact is the latest candidate resume point
5. follow the resumability ladder above

When resuming from any saved artifact, tell the operator explicitly which checkpoint the command resumed from and which artifact path triggered that branch.

### Checkpoint 1: Raw Story Draft

1. invoke `staff_writer` using `showrunner-projection.yaml` only
2. save `transcript.raw.yaml` with `status: pending_review`
3. alert the operator in CLI chat with a concise summary and the artifact path
4. if the operator requests revision, re-invoke `staff_writer` with the existing raw draft plus a condensed feedback summary recorded as a new `revision_history` entry
5. preserve all existing `turn_id`s across revisions
6. revise until the operator approves the raw draft as a story draft
7. on approval, write the updated artifact with `status: approved`

### Checkpoint 2: Flaw Proposals

1. invoke `script_doctor` on approved `transcript.raw.yaml`
2. save `flaw-proposals.yaml` with `status: pending_review`
3. alert the operator in CLI chat with a concise summary and the artifact path
4. let the operator approve, reject, relabel, tone down, or request revisions on the candidate set
5. on each revision round, update `flaw-proposals.yaml` so `revision_history` records a concise summary of the latest operator feedback
6. iterate until the operator approves the proposal set
7. on approval, persist the operator-approved lesson anchors in `approved_anchors`
8. set `flaw-proposals.yaml` `status: approved` when the operator approves the proposal set, even if `approved_anchors` is empty

### Post-Doctor Spot-Check

1. ask `script_doctor` to apply only the latest approved proposal set from `proposals[]`
2. save `transcript.post-doctor.yaml` with:
   - `status: pending_review`
   - proposal provenance fields
3. alert the operator in CLI chat with a concise post-application summary and the artifact path
4. if the spot-check fails because the proposal set needs revision:
   - set `flaw-proposals.yaml` to `status: needs_revision`
   - set `transcript.post-doctor.yaml` to `status: needs_revision`
   - reopen checkpoint 2 proposal review
5. if the spot-check fails because application quality is poor but the approved proposal set stands:
   - leave `flaw-proposals.yaml` at `status: approved`
   - set `transcript.post-doctor.yaml` to `status: needs_revision`
   - re-invoke `script_doctor` to re-apply only
6. require explicit operator re-approval in chat before proceeding after either failure case
7. once the operator passes the spot-check, set `transcript.post-doctor.yaml` to `status: approved`

### Structuring Pass

1. invoke `transcript_structurer` on approved `transcript.post-doctor.yaml`
2. save final `transcript.yaml`
3. run transcript validation

```bash
python3 pipeline/scripts/validate_transcript.py artifacts/{story_id}/{episode_id}/transcript.yaml
```

If validation fails, revise `transcript.yaml` through `transcript_structurer`, save again, and rerun validation before stopping.

After validation passes, present a concise final summary to the operator and stop. Do not continue into `create_lesson_package`.

## What This Command Must Not Do

Do not:

- infer approval from artifact presence alone
- regenerate `showrunner-projection.yaml` from `episode-plan.yaml`
- pass the full flaw-bearing plan or taxonomy straight through to `staff_writer`
- apply `script_doctor` edits before operator approval
- skip the post-doctor operator spot-check
- let transcript structuring rewrite plot, voice, or approved teaching-anchor turns
- build the lesson package automatically after drafting

The human operator is the judge of whether the transcript is good enough.
