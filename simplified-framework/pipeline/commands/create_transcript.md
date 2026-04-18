---
description: Generate one episode transcript, review how the planned flaws are embedded, and present the result to the operator for approval
---

# Create Transcript

Generate one transcript at a time for the simplified Lens framework.

This command should:

1. load the story artifact
2. load the selected `episode-plan.yaml`
3. draft a natural transcript
4. review how the planned flaws are embedded
5. report to the operator whether the transcript seems good enough for the app

This command is human-in-the-loop.

It should not silently move from transcript generation into package generation.

## Output Target

The default transcript artifact is:

- `simplified-framework/artifacts/{story_id}/{episode_id}/transcript.yaml`

The default flaw-review artifact is:

- `simplified-framework/artifacts/{story_id}/{episode_id}/flaw-review.md`

This should follow:

- `simplified-framework/docs/instructional-design.md`
- `simplified-framework/schemas/transcript.yaml`

Transcripts are organized as **2–4 scenes** with nested turns (no top-level `turns[]`, no `setting_note`, no `previously`). Each scene has a `scene_id`, a ≤ 30-word `summary`, and ≥ 1 turn. `turn_id` is globally unique across the whole transcript and strictly increasing, so lesson-package references resolve across scenes.

Validation script:

- `python3 simplified-framework/pipeline/scripts/validate_transcript.py simplified-framework/artifacts/{story_id}/{episode_id}/transcript.yaml`

## Required Inputs

- `simplified-framework/stories/{story_id}/story.yaml`
- `simplified-framework/artifacts/{story_id}/{episode_id}/episode-plan.yaml`
- `simplified-framework/reference/flaw-taxonomy.yaml`

## Subagent Roles

This command should use two specialized subagents:

### 1. `dialog_writer`

Responsibilities:

- draft a natural transcript from the story and episode plan
- preserve character voice
- keep the scene readable and believable
- leave room for flaws to appear naturally

Required file output:

- `simplified-framework/artifacts/{story_id}/{episode_id}/transcript.yaml`

### 2. `flaw_reviewer`

Responsibilities:

- review the draft transcript
- identify likely flaw moments
- note which turns are strong warm-up candidates
- note which turns are strong level candidates
- explain why the flaws are obvious enough, or not obvious enough, for 6th graders
- lightly revise or recommend revision if the flaws are too weak

Required file output:

- `simplified-framework/artifacts/{story_id}/{episode_id}/flaw-review.md`

The flaw reviewer must not stop at naming flaws.

It must explicitly answer:

- why would a 6th grader be able to see this as a flaw after brief instruction?

## Review Standard

The standard is not analytic perfection.

The standard is:

- natural dialogue
- clear enough flaw moments
- enough candidate turns for warm-ups and levels
- obvious enough for beginner instruction

## Expected Operator Report

After the transcript and flaw review are complete, Claude Code should report to the operator:

- where the saved transcript file is
- where the saved flaw-review file is
- the app-readiness judgment
- the strongest flaw turns
- 2 best warm-up candidates (primary flaw; one should be `unmistakable`)
- 3 best level candidates (primary flaw; one at each of `unmistakable`, `showcased`, `heightened`)
- why these flaws should be visible to 6th graders
- any weak or too-subtle flaw moments
- whether revision is recommended

The operator-facing report should be a concise summary of the saved artifacts, not a replacement for them.

## Required Command Sequence

`create_transcript` should execute in this order:

1. read `story.yaml`
2. read the selected `episode-plan.yaml`
3. invoke `dialog_writer`
4. save `transcript.yaml`
5. run transcript validation
6. invoke `flaw_reviewer`
7. save `flaw-review.md`
8. present a concise summary to the operator
9. stop and wait for operator judgment

The validation step is:

```bash
python3 simplified-framework/pipeline/scripts/validate_transcript.py simplified-framework/artifacts/{story_id}/{episode_id}/transcript.yaml
```

If validation fails:

- revise the transcript
- save it again
- rerun validation
- only then continue to flaw review

## Operator Decision

The operator should then decide:

- accept the transcript
- request a light revision
- regenerate the transcript
- revise the episode plan

Do not proceed to package generation until the operator accepts the transcript.

## What This Command Must Not Do

Do not:

- force every turn to contain a flaw
- treat guideline counts as rigid pass/fail rules
- build the lesson package automatically after drafting
- leave the review only in chat without saving the file artifact

The human operator is the judge of whether the transcript is good enough.
