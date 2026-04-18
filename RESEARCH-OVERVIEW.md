# Polylogue — Research Overview

Polylogue is a research project for teaching critical thinking to middle school students through short narrative episodes and explicit reasoning practice.

The active implementation in this repository is `simplified-framework/`. It teaches one student-facing layer only: reasoning flaws expressed in plain language.

## Current Instructional Model

Students work with five recurring reasoning flaws:

- jumping to a conclusion
- not enough evidence
- ignoring another perspective
- trusting a source too quickly
- missing important conditions or consequences

The design goal is not to hide the core concept behind abstract theory. Students are told directly what kind of reasoning move they are looking at, then they practice noticing it in context.

## Student Experience

The current model has two modes:

- **Practice mode** teaches the interaction pattern with one short exercise per flaw.
- **Read-a-story mode** places three inline quizzes inside a story episode at authored teachable moments.

Students can read the story linearly, open quizzes in place, use a hint when needed, and earn episode-local stars for quiz performance. The runtime is deterministic: there is no LLM call during student use.

## Research Aim

The simplified framework is designed to study whether students can:

- identify flawed reasoning more precisely when the categories are explicit and concrete
- apply the same reasoning language across multiple stories and situations
- move from isolated practice to in-context story reading without needing a different interaction model

The emphasis is on clarity, transfer, and teachability rather than on preserving a large hidden ontology.

## Authoring And Runtime

Authors create:

- `story.yaml`
- `episode-plan.yaml`
- `transcript.yaml`
- `flaw-review.md`
- `lesson_package.yaml`
- `practice_package.yaml`

These artifacts are validated before use. The app reads the authored YAML plus local Prisma state to render practice, story reading, inline quizzes, persistence, and scoring.

## Active References

For the live project model, use:

- `simplified-framework/docs/instructional-design.md`
- `simplified-framework/docs/tech-reference.md`
- `simplified-framework/docs/operator-workflow.md`

Historical shared-framework material now lives under `legacy/` and should be treated as reference only.
