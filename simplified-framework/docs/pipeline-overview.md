# Simplified Pipeline Overview

The simplified pipeline should still follow the Claude Code-style artifact generation pattern used elsewhere in the repo, but with fewer conceptual layers, fewer artifact types, and fewer hard gates.

## Pipeline Goal

Generate artifacts that are directly usable by the simplified Lens app.

The pipeline should produce:

- a story-level episode set
- one transcript at a time
- one lesson package per accepted transcript

Each artifact should be specific to the one-layer conceptual model of reasoning flaws.

## Proposed Flow

1. brainstorm or define a story world
2. create the full episode set for the story
3. write one episode transcript at a time
4. review how flaws are embedded in that transcript
5. accept, revise, or regenerate based on operator judgment
6. create a lesson package for the accepted transcript

## Command / Agent Structure

The simplified pipeline should mirror the broad shape of the current framework:

- `pipeline/commands/`
  Command contracts
- `pipeline/agents/`
  Specialized generation prompts
- `pipeline/scripts/`
  Lightweight validation and utility scripts
- `pipeline/templates/`
  Starter artifact templates

## Artifact Set Per Episode

Each episode should eventually produce:

- `episode-plan.yaml`
- `transcript.yaml`
- `simplified_assistive_package.yaml`

That smaller artifact set should be enough for the app.

## Review Model

The simplified pipeline should use lighter gates than the old framework.

Instead of multiple strict validation stages, the main quality-control loop should be:

1. generate transcript
2. Claude Code reports likely flaw moments and app readiness
3. human operator decides whether the transcript is good enough
4. only then build the assistive package

The operator should judge the transcript using guidelines, not rigid counts.

For example:

- about 2 strong warm-up candidates
- about 3 to 5 additional level candidates

This is a target pattern, not a hard rule.

## Important Runtime Constraint

The downstream app is non-LLM.

That means the lesson package must translate unambiguously into the student experience.

The app should not need to interpret ambiguous analytic output at runtime.

The package must already specify:

- which turns are used
- which questions are asked
- which answers are shown
- which answer is best
- what feedback or hint is shown
- what takeaway is reinforced
