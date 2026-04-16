# Simplified Operator Workflow

This document defines the human-in-the-loop workflow for the simplified Lens pipeline.

The simplified framework should use fewer hard gates than the older pipeline.

Quality control should come mainly from:

- clear authoring guidelines
- Claude Code reporting
- operator judgment

## 1. Core Principle

The goal is not to prove that an episode is analytically perfect.

The goal is to decide whether it is good enough for the app:

- natural enough as dialogue
- clear enough in its flaw moments
- structured enough to support warm-ups and levels

## 2. Story-Level Planning

At the story level, the operator should approve:

- the set of episodes
- the intended flaw distribution across episodes
- the rough learning progression

This should happen before transcript generation.

## 3. Transcript-by-Transcript Review

Transcripts should be generated one episode at a time.

After each transcript, Claude Code should report:

- the likely designated flaw moments
- which turns are good warm-up candidates
- which turns are good level candidates
- where the flaws are too weak, too subtle, or missing
- whether the transcript seems app-ready

It should also save:

- `simplified-framework/artifacts/{story_id}/{episode_id}/transcript.yaml`
- `simplified-framework/artifacts/{story_id}/{episode_id}/flaw-review.md`

under the episode artifact directory before asking the operator to decide.

## 4. Operator Decision

The operator should then decide whether to:

- accept the transcript
- request a light revision
- regenerate the transcript
- revise the episode plan

This is the main gate.

## 5. Flaw Count as Guideline

The simplified framework should treat this as a guideline:

- about 2 warm-up flaw moments
- about 3 to 5 additional level flaw moments

This is not a strict global rule.

The operator may approve episodes that differ from this pattern if the episode still works well for the app.

## 6. Package Generation Rule

Do not build the lesson package until the transcript has been accepted.

Once accepted, the package generator should produce an app-facing package that maps unambiguously into the student experience.

## 7. Non-LLM App Constraint

The app is deterministic and non-LLM.

So the operator should review package quality with this question:

Can the app render the intended learning experience without guessing what the package author meant?

If the answer is no, the package needs revision.

## 8. Acceptance Questions

Before accepting a transcript for package generation, ask:

1. Does the conversation sound natural?
2. Are the flaw moments obvious enough for the intended difficulty?
3. Are there enough candidate warm-up and level turns?
4. Is the main reasoning flaw clear enough across the episode?
5. Will the downstream app be able to teach from this episode cleanly?
