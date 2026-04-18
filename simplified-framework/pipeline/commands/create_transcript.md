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

Transcripts are organized as **3+ scenes** with nested turns. Each scene has a `scene_id`, a plain-language `summary`, and `turns[]`. `turn_id` is globally unique across the whole transcript and strictly increasing.

Validation script:

- `python3 simplified-framework/pipeline/scripts/validate_transcript.py simplified-framework/artifacts/{story_id}/{episode_id}/transcript.yaml`

## Required Inputs

- `simplified-framework/stories/{story_id}/story.yaml`
- `simplified-framework/artifacts/{story_id}/{episode_id}/episode-plan.yaml`
- `simplified-framework/reference/flaw-taxonomy.yaml`

## Screenwriter Barrier

Before invoking `screenwriter`, this command must prepare the stripped screenwriter-safe projection described in `todo-v2.md` § 8.

- `screenwriter` receives the projection, not the full flaw-bearing `episode-plan.yaml`
- `screenwriter` must not be given `reference/flaw-taxonomy.yaml`
- the full `episode-plan.yaml` and taxonomy remain available to `flaw_injector` and `flaw_reviewer`

The projection shape is:

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
scene_design:
  opening: <prose>
  turn: <prose>
  close: <prose>
character_beats:
  - character_id: <id>
    beat: <voice, prop, physicality, and arc notes; flaw references removed>
running_threads:
  - <story-level thread this episode must plant or pay off, in plot terms>
plot_obligations:
  - <vocabulary-flagging obligation or must-happen beat, in story terms>
scene_count_target: { min: 3, max: 5 }
```

Do not substitute a looser summary of the plan. `create_transcript` must prepare and pass this stripped projection shape specifically.

This barrier is part of the v2 contract. Do not collapse it into a generic "read the plan and start writing" handoff.

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
- recommend revision if the flaw moments are too weak, too subtle, or too dependent on restating the turn

Required file output:

- `simplified-framework/artifacts/{story_id}/{episode_id}/flaw-review.md`

## Review Standard

The standard is:

- natural dialogue
- clear enough flaw moments
- exactly 3 strong quiz-ready primary-flaw moments, one per amplification band
- those 3 quiz-ready moments occurring in distinct scenes
- obvious enough for beginner instruction
- strong enough that the later package builder will not need to compensate with long prompts or verbose scaffolds

## Required Command Sequence

`create_transcript` should execute in this order:

1. read `story.yaml`
2. read the selected `episode-plan.yaml`
3. prepare the stripped screenwriter projection from the episode plan
4. invoke `screenwriter` with that projection only
5. invoke `flaw_injector` with the screenwriter draft plus the full flaw-bearing plan
6. save `transcript.yaml`
7. run transcript validation
8. invoke `flaw_reviewer`
9. save `flaw-review.md`
10. present a concise summary to the operator
11. stop and wait for operator judgment

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
- pass the full flaw-bearing plan or taxonomy straight through to `screenwriter`
- build the lesson package automatically after drafting
- leave the review only in chat without saving the file artifact

The human operator is the judge of whether the transcript is good enough.
