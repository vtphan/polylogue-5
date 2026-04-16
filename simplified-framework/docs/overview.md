# Simplified Lens Framework

This directory is an incubation space for a simpler version of Lens.

It exists because the current Lens framework, pipeline, and app designs are carrying more conceptual and technical complexity than the student experience currently justifies.

The goal here is not to discard the existing framework. The goal is to design a simpler instructional and product model that can still reuse lessons, concepts, and selected assets from the current system.

## Why This Exists

The current Lens work has several problems:

- the conceptual framework is rich, but hard to surface clearly for students
- the app flow has been more complex than the learning payoff
- the lesson package has been better suited to analysis than to direct teaching
- the student runtime has not yet taught critical thinking simply and effectively

This simplified framework starts from a stricter question:

How can a student read an episode and practice a small number of meaningful critical-thinking moves with very low interface friction?

## Core Principle

The simplified model should teach a few recurring habits of mind clearly, repeatedly, and in plain language.

The app should feel like a guided reasoning coach, not a workflow engine.

## Student-Facing Focus

The current candidate student-facing move set is:

- jumping to a conclusion
- not enough evidence
- ignoring another perspective
- trusting a source too quickly
- missing important conditions or consequences

These are not necessarily the full hidden ontology.

They are the first student-facing teaching set.

## Relationship to the Existing Framework

The existing framework remains useful as:

- a source of story and episode design ideas
- a source of conceptual mappings
- a source of richer hidden analytic structure
- a source of pipeline patterns and validation ideas

This simplified framework should selectively reuse those materials without inheriting all of their runtime assumptions.

## What Lives Here

- `docs/`
  High-level design documents for the simplified framework.
- `schemas/`
  Draft schemas for app-facing or pipeline-facing simplified artifacts.
- `examples/`
  Small worked examples of simplified outputs.
- `mappings/`
  Mappings from the current Lens framework to the simplified model.

## First Design Goals

The simplified framework should produce:

- a simpler instructional model
- a simpler app-facing lesson package
- a simpler runtime flow
- episodes designed around a small number of teachable critical-thinking moves

## Immediate Next Documents

The first foundational documents are:

- `conceptual-model.md`
- `instructional-model.md`
- `package-schema.md`

These should be treated as the starting point for future prompt, schema, and pipeline work in this directory.
