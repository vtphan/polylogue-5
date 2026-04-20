---
description: Draft the full episode set for a simplified Lens story, including episode plans and saved showrunner briefs
---

# Create Episodes

Help the operator create the full episode set for a simplified Lens story.

This command is story-level planning, not transcript generation.

Its job is to translate a completed or mostly completed `story.yaml` into a set of simplified `episode-plan.yaml` artifacts, one per episode, with a coherent narrative arc across the whole story.

The output of this command is the **full episode-plan set for the story in one run**. Do not reinterpret this as a per-episode planning command.

## Output Target

The default artifacts are:

- `artifacts/{story_id}/episode_01/episode-plan.yaml`
- `artifacts/{story_id}/episode_02/episode-plan.yaml`
- and so on for the full episode set

This command also prepares a saved `showrunner-projection.yaml` for each episode plan. That brief is the later handoff material for `staff_writer`.

These should follow:

- `schemas/episode-plan.yaml`

Validation script:

- `python3 pipeline/scripts/validate_episode_plan.py artifacts/{story_id}/{episode_id}/episode-plan.yaml`

## What This Command Must Do

Using the story artifact and operator input, define the episode set at the planning level. Each episode yields two artifacts: a human-editable `episode-plan.yaml` and a paired `showrunner-projection.yaml` that is the sole content-bearing brief passed later to `staff_writer`.

Preserve the intent of `story.yaml` while planning. Clarify or tighten weak episode summaries when needed, but do not silently invent a different episode arc than the one the story artifact establishes.

For each episode plan (`episode-plan.yaml`), author at minimum:

- `story_id`, `episode_id`, `title`
- `episode_goal` — planning-only narrative/learning aim for this episode
- `student_takeaway` — the line the student should carry away

Optional planning aids allowed in the plan:

- `character_beats` — per-character voice, private stakes, and arc notes

The plan is story-facing. It captures episode goal, story movement, student takeaway, and story-level obligations. Teaching-anchor selection happens later in the pipeline from the actual approved draft; it is not planned here. Reader-facing scene segmentation also happens later, in the transcript structurer. `staff_writer` writes continuous dialog flow in a flat turn list, so this stage should not plan around scene count, scene boundaries, or app-facing segmentation.

For each projection (`showrunner-projection.yaml`), author the full shape described below. The projection is richer than the plan because it is what `staff_writer` actually reads.

For each episode, also prepare this exact showrunner projection shape:

```yaml
story_id: <str>
episode_id: <str>
title: <str>
narrative_synopsis: >-
  <episode_goal rewritten in plot and texture terms only>
hypothesis_pursued: >-
  <the wrong explanation the group anchors on this episode, phrased as a plot anchor>
disproof_event: >-
  <the visible beat that wobbles or disproves the hypothesis>
character_beats:
  - character_id: <id>
    beat: <voice, prop, physicality, and arc notes in story terms>
running_threads:
  - <story-level thread this episode must plant or pay off, in plot terms>
plot_obligations:
  - <vocabulary-flagging obligation or must-happen beat, in story terms>
```

Notes on the shape:

- `narrative_synopsis` should encode the episode's story problem through situation design, interpersonal pressure, and episode obligations. Plain story voice only.
- `hypothesis_pursued` names the wrong idea or unstable theory the group anchors on this episode, phrased as a story belief (e.g. "it has to be the water").
- `disproof_event` names the visible beat that wobbles or disproves that belief in-world.
- The projection should help `staff_writer` write a compact, engaging story rather than a storyboard or scene outline.
- Each episode should be planned as a short 10-15 minute reading exercise for 6th graders: plain language, readable scope, and enough narrative movement to feel like a real story without sprawl.
- The projection deliberately omits `student_takeaway` because `staff_writer` drafts from story pressure, not from the lesson line.

This command should plan all episodes in one shot so the story-level narrative arc is coherent.

## What This Command Must Not Do

Do not:

- generate final transcripts
- plan around scene count or scene boundaries
- select teaching anchors or label reasoning moves
- generate lesson package answer choices

Those belong to later commands (`create_transcript`, `create_lesson_package`).

## Design Principles

### 1. Story-Level Coherence First

Episodes should feel like parts of one story, not isolated lesson containers.

### 2. Story Pressure Should Be Intentional

The operator and agent should decide:

- which wrong idea or unstable theory drives each episode
- what emotional center gives the episode human pressure
- where private stakes and offscreen life deepen the episode
- where earlier tensions are reinforced later
- where episodes should stay simple and where they can become richer

### 3. Give The Writer A Real Story To Draft

Each episode plan should give the downstream writer:

- a strong narrative spine
- enough clear obligations that later drafting does not invent the episode from scratch
- a saved brief that can be handed to `staff_writer` without hidden planning context

### 4. Write For A Short Middle-Grade Read

Each episode should be plan-worthy as a short 10-15 minute reading exercise for 6th graders.

That means:

- plain, readable language
- age-appropriate social and emotional stakes
- enough focus that the later draft stays compact
- enough texture that the story still feels alive

### 5. Preserve Room for Natural Transcript Writing

The episode plan should guide transcript generation without scripting it too tightly.

## Conversation Style

You are a planner and co-designer, not a validator.

Use this workflow:

1. read the current `story.yaml`
2. summarize the current story-level episode arc
3. identify missing or risky episode-level decisions
4. work with the operator to refine the episode set
5. draft episode plans once the design is good enough

Do not insist on perfection before drafting.

## Inputs

Primary input:

- `stories/{story_id}/story.yaml`

Also read as needed:

Scope rule for this run:

- treat `stories/{story_id}/story.yaml` as the only story source
- write only under `artifacts/{story_id}/`
- do not inspect sibling story artifact trees under `artifacts/` unless the operator explicitly asks for comparison or reuse
- if prior artifacts already exist under `artifacts/{story_id}/`, use only that same-story path as reference context for overwrites or revisions

## Validation

`validate_episode_plan.py` requires `story_id`, `episode_id`, `title`, `episode_goal`, `student_takeaway`, with `character_beats` as an optional planning aid. A well-authored v4 plan should pass cleanly.

```bash
python3 pipeline/scripts/validate_episode_plan.py artifacts/{story_id}/{episode_id}/episode-plan.yaml
```

The `showrunner-projection.yaml` has no dedicated validator. A shared helper (`pipeline/scripts/_intermediate_guards.py`) spot-checks that the required top-level keys are present if invoked; it does not enforce semantics.

## Relationship to Later Commands

- `create_story` creates the story-level source artifact.
- `create_episodes` turns that into the full episode plan set and the paired saved projection used later by `staff_writer`.
- later transcript creation should happen one episode at a time.

Do not move into transcript writing in this command.
