# Simplified Lens Framework

This directory is the self-contained working area for the simplified Lens redesign.

It brings together:

- the conceptual and instructional model
- the simplified Claude Code-style artifact pipeline
- the simplified schemas and prompts
- generated artifacts
- the downstream student app

The purpose of this directory is to let the simplified design evolve as one coherent system rather than splitting the framework, artifacts, and app across different roots.

## Directory Structure

- `docs/`
  Design documents for the simplified model.
- `schemas/`
  Draft schemas for simplified artifacts.
- `prompts/`
  Prompt drafts for story, episode, transcript, and package generation.
- `pipeline/`
  Command specs, agent specs, scripts, and templates for the simplified artifact pipeline.
- `artifacts/`
  Generated or copied sample artifacts consumed by the simplified app.
- `configs/`
  App session manifest and config files for local loading.
- `app/`
  The student-facing runtime for the simplified framework.
- `examples/`
  Small worked examples and future reference outputs.
- `mappings/`
  Bridge documents from the current Lens framework to the simplified model.
- `validation/`
  Validation notes and future rule definitions.

## Current Status

This directory is an incubation space, not yet the canonical replacement for the current `framework/`.

Right now it contains:

- the first simplified design docs
- a copied sample episode artifact for local use
- a localized copy of the current `lens-v1_1` prototype under `app/`

The app here is a starting point, not a final product.

## Immediate Priorities

1. Define the simplified conceptual model around one layer: reasoning flaws.
2. Define the simplified package schema and generation pipeline.
3. Map the current framework concepts into the simplified model where useful.
4. Redesign the app to consume the simplified artifacts directly.
