---
description: Generate one episode transcript through the current `staff_writer` and `script_doctor` flow, then present the result to the operator for approval
---

# Create Transcript

Generate one transcript at a time for the simplified Lens pipeline.

Task note: Tasks 4–5 rewire this command around explicit raw-draft and proposal checkpoints. In Tasks 1–3, this file is updated for the renamed roles and saved showrunner brief, while the full command-flow rewrite remains deferred.

This command should:

1. load the story artifact
2. load the selected `episode-plan.yaml`
3. draft a narrative transcript
4. sharpen the strongest teachable turns
5. review whether the transcript is strong enough for the downstream inline-quiz app
6. report to the operator whether the transcript seems good enough for package generation

This command is human-in-the-loop.

It should not silently move from transcript generation into package generation.

## Output Target

The default transcript artifact is:

- `artifacts/{story_id}/{episode_id}/transcript.yaml`

This should follow:

- `docs/instructional-design.md`
- `schemas/transcript.yaml`

Transcripts are organized as **3+ scenes** with nested turns. Each scene has a `scene_id`, a plain-language `summary`, and `turns[]`. `turn_id` is globally unique across the whole transcript and strictly increasing.

Validation script:

- `python3 pipeline/scripts/validate_transcript.py artifacts/{story_id}/{episode_id}/transcript.yaml`

## Required Inputs

- `stories/{story_id}/story.yaml`
- `artifacts/{story_id}/{episode_id}/episode-plan.yaml`
- `reference/flaw-taxonomy.yaml`

## Writer Barrier

Before invoking `staff_writer`, this command must use the stripped writer-safe projection described in the planning flow.

- `staff_writer` receives the projection, not the full flaw-bearing `episode-plan.yaml`
- `staff_writer` must not be given `reference/flaw-taxonomy.yaml`
- the full `episode-plan.yaml` and taxonomy remain available to `script_doctor`

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

This barrier remains in force during Tasks 1–3. Do not collapse it into a generic "read the plan and start writing" handoff.

## Subagent Roles

This command should use two specialized subagents:

### 1. `staff_writer`

Responsibilities:

- draft a natural narrative transcript from the story and the saved showrunner projection
- preserve character voice
- build strong scenes with clear transitions and sensory grounding carried through dialogue
- create scenes that can later support inline quizzes without sounding instructional

Required file output:

- none; this draft is ephemeral working context, not a saved artifact

### 2. `script_doctor`

Responsibilities:

- review the `staff_writer` draft against the taxonomy
- identify the strongest candidate flaw-carrying turns
- make the smallest viable revisions needed to sharpen teachable turns
- keep the story recognizable and scene-driven
- give the operator a concise summary of the strongest candidates and the main caution, if any

Required file output:

- `artifacts/{story_id}/{episode_id}/transcript.yaml`

## Review Standard

The standard is:

- natural dialogue
- clear enough flaw moments
- strong enough flaw moments for downstream lesson packaging
- obvious enough for beginner instruction
- strong enough that the later package builder will not need to compensate with long prompts or verbose scaffolds

## Required Command Sequence

`create_transcript` should execute in this order:

1. read `story.yaml`
2. read the selected `episode-plan.yaml`
3. load or prepare the stripped showrunner projection from the episode plan
4. invoke `staff_writer` with that projection only
5. invoke `script_doctor` with the `staff_writer` draft plus the full flaw-bearing plan
6. save `transcript.yaml`
7. run transcript validation
8. present a concise summary to the operator
9. stop and wait for operator judgment

The validation step is:

```bash
python3 pipeline/scripts/validate_transcript.py artifacts/{story_id}/{episode_id}/transcript.yaml
```

If validation fails:

- revise the transcript
- save it again
- rerun validation
- only then continue to operator review

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
- pass the full flaw-bearing plan or taxonomy straight through to `staff_writer`
- build the lesson package automatically after drafting

The human operator is the judge of whether the transcript is good enough.
