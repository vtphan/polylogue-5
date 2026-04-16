# Simplified Artifact Spec

This document describes the intended artifact set for the simplified Lens framework.

## Per-Episode Artifacts

Each episode should generate three main artifacts:

### `episode-plan.yaml`

Defines:

- episode goal
- primary reasoning flaw
- optional secondary reasoning flaw
- target teaching takeaway
- candidate teachable moments

### `transcript.yaml`

Defines:

- the dialogue itself
- speakers
- turns
- sentence-level text

### `simplified_assistive_package.yaml`

Defines the app-facing teaching content:

- warm-ups
- levels
- answer choices
- best answers
- hints
- feedback
- final takeaway

## Relationship to the App

The app should read the lesson package directly, with minimal inference.

The app should not need to reconstruct its teaching model from diffuse analytic metadata.
