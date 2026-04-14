# Story Authoring

This document covers the story-level part of the Polylogue pipeline: write the story design doc, write the episode drafts, then iterate on `/validate_story` until the story is ready for artifact generation.

## Story-Level Pipeline

The story pipeline has three authored artifacts:

- `framework/stories/{story_id}.md` — the story design doc
- `framework/stories/{story_id}/episode_{NN}.md` — one draft per episode
- `framework/stories/calibration/{story_id}-validation-report.md` — the latest validation report written by `/validate_story`

`/validate_story` is part of the pipeline. It is the story-level gate before any episode enters `/create_episode`.

## Authoring Loop

1. Write the story design doc.
2. Draft one or more episodes.
3. Run `/validate_story <story_id>`.
4. Revise the design doc and episode drafts using the report.
5. Repeat until `/validate_story` returns `READY`.

`/validate_story` combines:

- `validate_story.py` for mechanical cross-episode checks
- `story_consistency_reviewer` for prose-on-prose review
- pipeline-readiness analysis for likely downstream churn

## Optional Co-Design Commands

Two optional conversational commands can help before formal validation:

- `brainstorm_story` — iterative, thread-aware co-design for the story as a whole
- `brainstorm_episode` — iterative co-design for one episode draft once the story design doc exists

These commands help shape ideas into the right format, but they do not replace `/validate_story`.

## Story Design Doc

The story design doc lives at `framework/stories/{story_id}.md`. It is Markdown with YAML frontmatter plus a prose body.

The frontmatter defines the story-level contract:

- `story_id`
- `title`
- `coverage_mode`
- `declared_facets`
- `declared_cognitive_patterns`
- `declared_social_dynamics`
- `episode_count`

Optional capability flags may also appear when the story needs them, such as `pedagogical_register`, `uses_character_growth`, or `supports_jigsaw`.

The prose body defines premise, setting, cast, arc, stakes, and pedagogical intent. The cast section is the source of truth for character identity.

## Episode Drafts

Per-episode drafts live at `framework/stories/{story_id}/episode_{NN}.md`. Each draft has YAML frontmatter plus a prose body.

Key frontmatter fields:

- `lead_characters`
- `primary_lens`
- `mixed_valence_shape`
- `premise`
- `previously`
- `targets[]`
- `strengths[]`
- `beats[]`

Each target carries a `facet`, optional `cognitive_pattern`, optional `social_dynamic`, and the corresponding `cognitive_signal` / `social_signal`.

The prose body explains why the episode exists in the arc and why the targets landed on these carriers.

## Design Rules

The cast and story should satisfy these steady-state rules:

- The cast collectively carries the declared coverage across the whole story.
- No character is an embodied fallacy; each should have multiple tendencies.
- Each character should have at least one stable strength.
- At most two characters should have visible growth arcs.
- The cast should collectively model the three lens dispositions.
- Cast size should stay small enough to remain distinct and stageable.

## Coverage Contract

Coverage is judged at the story level, not the episode level.

- **Full coverage** means all framework facets, cognitive patterns, and social dynamics are covered across the story.
- **Focused coverage** means a declared subset is covered, with a floor of at least 3 facets, 1 cognitive pattern, and 1 social dynamic.

`validate_story.py` checks:

- coverage closure
- lens distribution
- mixed-valence rotation
- strength and weakness rotation
- later, the hedged-annotation rule when analyses exist

## Information Barrier

The dialog writer never sees the story design doc, the episode draft, or `episode.yaml`. It only sees `episode_writer_input.yaml`, the barrier-safe projection.

That means `cognitive_signal` and `social_signal` must be written as stage directions, not analysis labels. They should describe visible behavior and move/response patterns that can survive translation into dialog.

## Readiness

A story is ready for episode execution when:

- all planned episode drafts exist
- `/validate_story` returns `READY`
- the operator has checked item 9 manually

For episode execution, continue to `artifacts-generation.md`.
