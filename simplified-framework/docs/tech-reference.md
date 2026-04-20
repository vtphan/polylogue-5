# Tech Reference

This document is the stable technical reference for `simplified-framework/`.

It describes the system at the level of architecture, durable artifact roles, and major operational boundaries.

It should explain how the system works without freezing temporary implementation choices, migration notes, or line-level mechanics that may change.

For instructional purpose and learner assumptions, see `instructional-design.md`.

## System Model

The system has three layers:

1. A human-in-the-loop authoring pipeline.
2. Authored artifacts produced by that pipeline.
3. A non-LLM student-facing app that renders those artifacts deterministically.

The pipeline uses LLMs to help generate and refine content, but the system is not fully automatic. A human operator reviews important outputs and approves what moves forward.

The app is delivery-only at student time. It does not generate new lesson content on demand. It reads authored artifacts and app state, then renders a stable intervention experience.

## Core Technical Assumptions

The framework assumes:

- the flaw taxonomy is the canonical reasoning reference
- the audience is primarily 6th graders
- each episode should function as a short 10-15 minute exercise
- student-time delivery is deterministic and non-LLM

These assumptions shape both the authoring pipeline and the runtime app.

## Major Components

### 1. Flaw Taxonomy

`reference/flaw-taxonomy.yaml` is the canonical reasoning reference used by the system.

It defines the flaw language that anchors lesson authoring and evaluation. Other surfaces may restate that language in student-friendly ways, but the taxonomy remains the reference backbone.

### 2. Artifact-Generation Pipeline

The pipeline generates the authored content that the app later serves.

At a high level, it moves through:

1. story design
2. episode planning
3. transcript drafting and review
4. teachable-turn proposal and approval
5. transcript structuring for reading
6. lesson package generation

The pipeline is orchestrated through commands and specialized agents. The exact command flow may evolve, but the stable pattern is:

- upstream agents generate draft artifacts
- a human operator reviews key checkpoints
- downstream stages build on approved artifacts rather than hidden chat state

### 3. Authored Artifacts

The system uses YAML artifacts as the durable interface between authoring and runtime.

At a durable conceptual level:

- `story.yaml` defines the story-level source material
- episode-planning artifacts support writing and orchestration
- transcript artifacts capture the approved reading text
- lesson artifacts capture the approved teaching prompts and feedback
- practice artifacts support reusable tutorial-style instruction outside the story flow

Some artifacts are pipeline-facing only and exist for review, resumability, and orchestration. Others are runtime-facing and are read directly by the app.

### 4. Student-Facing App

The app serves the authored intervention to students.

At a stable level, the app provides:

- scaffolded reading
- embedded thinking quizzes tied to teachable moments
- lightweight achievement signaling

The app is designed to support reading, reflection, and response with low friction. It is not intended to feel like an open-ended tutor, a content generator, or a procedurally complex assessment engine.

## Durable Artifact Roles

### Runtime-Facing Artifacts

The app depends on authored artifacts that are ready to render without runtime invention.

At a stable conceptual level:

- the transcript artifact supplies the student-facing reading text and reading scaffold
- the lesson package supplies the student-facing quiz prompts, options, feedback, and episode framing
- the practice package supplies reusable non-story practice content

### Pipeline-Facing Artifacts

The pipeline also produces intermediate artifacts that support:

- human review
- resumability
- separation of responsibilities across stages
- durable operator approval state

These pipeline-facing artifacts are part of the authoring system, not part of the student runtime contract.

## Human Operator Role

The human operator is part of the technical system, not an external afterthought.

The operator is responsible for:

- reviewing draft quality
- approving or rejecting important artifact states
- deciding which proposed teaching anchors should be used
- ensuring the generated materials are good enough for the intended learner experience

This role is technically important because the pipeline is designed around approved artifacts, not around unchecked automatic continuation.

## Agent Roles

The system uses specialized agents with distinct responsibilities.

At a durable high level:

- story-design agents shape story world and episode intent
- planning agents prepare episode-level writing briefs
- writing agents draft the story text
- diagnostic/editing agents identify teachable moments and propose targeted revisions
- structuring agents convert approved story text into reader-facing scaffolded form
- lesson-building agents convert approved transcript moments into deterministic app-facing quizzes and feedback

The exact prompt wording may change, but the separation of concerns is intentional: story writing, flaw diagnosis, reading scaffold, and lesson packaging are different jobs.

## Student Experience Model

The student-facing app combines reading support and thinking practice.

The stable model is:

- students read short story episodes
- the reading is scaffolded for clarity and pacing
- quizzes appear at selected teachable moments
- feedback is immediate and plain-language
- achievement is lightly gamified rather than heavily systematized

The point of gamification is motivation and recognition, not competition or score maximization.

## What "Deterministic App" Means Here

The app may track state, progress, and results, but it does not invent lesson content at runtime.

Deterministic delivery means:

- prompts and feedback come from authored artifacts
- grading logic follows authored answer structure
- student progress is derived from stored state plus authored content
- the instructional experience is reviewable because runtime behavior is grounded in saved artifacts

## Boundaries

This document does not attempt to freeze:

- prompt wording
- exact command syntax
- validator internals
- database field inventories
- route structures
- temporary migration constraints

Those may change as the system evolves. This document should remain useful even as those details are refined.

## Related Docs

- `simplified-framework/docs/instructional-design.md`
- `simplified-framework/docs/operator-workflow.md`
- `simplified-framework/reference/flaw-taxonomy.yaml`
