# Instructional Design

This document describes the instructional approach for `simplified-framework/` at a high level.

It is intentionally stable and conceptual. It defines the educational model, the learner assumptions, and the role of the system in instruction.

It does not define pipeline implementation details, app mechanics, artifact schemas, or temporary migration choices. Those belong in technical and operational documents.

## Purpose

The system is an intervention for helping middle school students strengthen critical-thinking habits through short story-based reading experiences.

The student is not being asked to memorize formal logic vocabulary. The instructional goal is more practical:

- notice weak reasoning in context
- slow down before accepting a claim
- look for evidence, missing conditions, and alternative perspectives
- practice naming what is wrong in plain language

The intended learner is a middle school student, with 6th grade as the default design point.

## Core Assumptions

The instructional design assumes:

- the audience is primarily 6th graders
- each episode should work as a short 10-15 minute reading exercise
- student-facing language should be plain, direct, and readable
- the app experience should feel like guided reading and reflection, not a worksheet or test-prep drill

These assumptions should shape tone, scope, vocabulary, and cognitive load across the system.

## Model of Instruction

The instructional model has three parts:

1. A flaw taxonomy that defines the reasoning moves the system is trying to teach.
2. LLM-based authoring that generates the learning artifacts.
3. A non-LLM app that delivers those artifacts as a deterministic student intervention.

The taxonomy is the conceptual teaching backbone. It provides a shared language for identifying flawed reasoning and for authoring explanations, prompts, and feedback.

The authoring pipeline uses LLMs to generate stories, transcripts, and lesson materials that embody the instructional approach.

The system is also human in the loop. LLMs generate and revise instructional artifacts, but a human operator reviews key outputs and decides what is approved for downstream use. This preserves instructional judgment, keeps the system externally reviewable, and prevents the teaching intervention from becoming a fully automatic black box.

The runtime app does not generate instruction on the fly. It delivers pre-authored artifacts deterministically so that the student experience is stable, reviewable, and consistent.

## What The Student Is Learning

The student-facing layer is reasoning flaws named in plain language.

The canonical flaw set is:

- jumping to a conclusion
- not enough evidence
- ignoring another perspective
- trusting a source too quickly
- missing important conditions or consequences

The learner should encounter these flaws in context, inside believable social and narrative situations, rather than as isolated definitions.

## Why Story-Based Instruction

Stories provide a practical setting for reasoning.

In narrative context, students can:

- see how a flawed conclusion arises from pressure, confusion, habit, or emotion
- compare stronger and weaker interpretations of the same situation
- practice reflection without being asked to reason in the abstract first

The story is not decoration around the lesson. It is the teaching environment.

For that reason, story quality matters instructionally. Episodes should feel coherent, readable, and emotionally legible enough that students can follow what characters believe, why they believe it, and where that reasoning breaks down.

## Role of the App

The app is the delivery surface for the intervention, not the author of the intervention.

Its job is to:

- present short reading experiences
- surface teachable moments inside those readings
- ask clear, direct questions
- provide feedback in plain language

The app should reduce friction around practice and reflection. It should not require the student to decode dense instructions, hold too many moving parts in working memory, or navigate an experience that feels procedurally complex.

## Design Priorities

The instructional approach prioritizes:

- clarity over cleverness
- plain language over academic performance language
- short, focused episodes over sprawling content
- believable social situations over contrived lesson setups
- teachable reasoning moments over exhaustive analysis
- consistency and determinism in delivery over runtime improvisation

## Boundaries

This document does not specify:

- pipeline stages or agent responsibilities
- artifact field definitions
- validator rules
- UI mechanics
- database or runtime implementation

Those details may evolve. The instructional approach above should remain stable even when the implementation changes.

## Related Docs

- `simplified-framework/docs/tech-reference.md`
- `simplified-framework/docs/operator-workflow.md`
- `simplified-framework/reference/flaw-taxonomy.yaml`
