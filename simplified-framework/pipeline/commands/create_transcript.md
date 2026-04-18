---
description: Generate one episode transcript through the v2 two-pass writing flow, review quiz readiness, and present the result to the operator for approval
---

# Create Transcript

Generate one transcript at a time for the simplified Lens v2 framework.

This command should:

1. load the story artifact
2. load the selected `episode-plan.yaml`
3. draft a narrative transcript
4. inject the planned flaw moments
5. review whether the transcript is strong enough for the downstream inline-quiz app
6. report to the operator whether the transcript seems good enough for package generation

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

Transcripts are organized as **3+ scenes** with nested turns (no top-level `turns[]`, no `setting_note`, no `previously`). Each scene has a `scene_id`, a plain-language `summary`, and `turns[]`. `turn_id` is globally unique across the whole transcript and strictly increasing, so lesson-package references resolve across scenes.

Validation script:

- `python3 simplified-framework/pipeline/scripts/validate_transcript.py simplified-framework/artifacts/{story_id}/{episode_id}/transcript.yaml`

## Required Inputs

- `simplified-framework/stories/{story_id}/story.yaml`
- `simplified-framework/artifacts/{story_id}/{episode_id}/episode-plan.yaml`
- `simplified-framework/reference/flaw-taxonomy.yaml`

## Subagent Roles

This command should use three specialized subagents:

### 1. `screenwriter`

Responsibilities:

- draft a natural narrative transcript from the story and the screenwriter-safe projection of the episode plan
- preserve character voice
- build strong scenes with clear transitions, sensory grounding, and action beats where useful
- create scenes that can later support inline quizzes without sounding instructional

Required file output:

- none; this draft is ephemeral working context, not a saved artifact

### 2. `flaw_injector`

Responsibilities:

- revise the screenwriter draft into the final `transcript.yaml`
- land the planned primary-flaw moments at the requested amplifications
- preserve scene boundaries while adjusting turns inside scenes
- ensure quiz-target turns are clear enough to support short direct prompts later, without the package builder needing to restate the turn text

Required file output:

- `simplified-framework/artifacts/{story_id}/{episode_id}/transcript.yaml`

### 3. `flaw_reviewer`

Responsibilities:

- review the saved transcript
- identify the 3 strongest quiz candidates for the primary flaw
- verify that those quiz candidates live in distinct scenes
- explain why the flaws are obvious enough, or not obvious enough, for 6th graders
- judge whether each quiz candidate can support a short direct prompt without quoting or paraphrasing the highlighted turn
- lightly revise or recommend revision if the flaw moments are too weak, too subtle, or too dependent on restating the turn

Required file output:

- `simplified-framework/artifacts/{story_id}/{episode_id}/flaw-review.md`

The flaw reviewer must not stop at naming flaws.

It must explicitly answer:

- why would a 6th grader be able to see this as a flaw after brief instruction?
- can the lesson package builder write a short direct prompt without repeating the highlighted turn?

## Review Standard

The standard is not analytic perfection.

The standard is:

- natural dialogue
- clear enough flaw moments
- exactly 3 strong quiz-ready primary-flaw moments, one per amplification band
- those 3 quiz-ready moments occurring in distinct scenes
- obvious enough for beginner instruction
- strong enough that the later package builder will not need to compensate with long prompts or verbose scaffolds

## Expected Operator Report

After the transcript and flaw review are complete, Claude Code should report to the operator:

- where the saved transcript file is
- where the saved flaw-review file is
- the app-readiness judgment
- the 3 strongest quiz candidates (primary flaw; one at each of `unmistakable`, `showcased`, `heightened`)
- which scene each quiz candidate belongs to
- why these flaws should be visible to 6th graders
- whether each candidate can support a short direct prompt without restating the turn
- any weak or too-subtle flaw moments
- whether revision is recommended

The operator-facing report should be a concise summary of the saved artifacts, not a replacement for them.

## Required Command Sequence

`create_transcript` should execute in this order:

1. read `story.yaml`
2. read the selected `episode-plan.yaml`
3. invoke `screenwriter`
4. invoke `flaw_injector`
5. save `transcript.yaml`
6. run transcript validation
7. invoke `flaw_reviewer`
8. save `flaw-review.md`
9. present a concise summary to the operator
10. stop and wait for operator judgment

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
- silently collapse back to the old single-pass `dialog_writer` flow
- build the lesson package automatically after drafting
- leave the review only in chat without saving the file artifact

The human operator is the judge of whether the transcript is good enough.
