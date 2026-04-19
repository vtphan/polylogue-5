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

- `docs/instructional-design.md`
- `schemas/episode-plan.yaml`

Validation script:

- `python3 pipeline/scripts/validate_episode_plan.py artifacts/{story_id}/{episode_id}/episode-plan.yaml`

## What This Command Must Do

Using the story artifact and operator input, define the episode set at the planning level.

For each episode, determine:

- title
- episode goal
- student takeaway
- scene design
- character beats
- running threads
- plot obligations

In v4, this plan is story-facing. Do not author `flaws[]`, amplification bands, or quiz-distribution targets here.

For each episode, also prepare this exact showrunner projection shape:

```yaml
story_id: <str>
episode_id: <str>
title: <str>
narrative_synopsis: >-
  <episode_goal rewritten in plot and texture terms only, no flaw vocabulary>
hypothesis_pursued: >-
  <the wrong explanation the group anchors on this episode, phrased as a plot anchor>
disproof_event: >-
  <the visible beat that wobbles or disproves the hypothesis>
scene_design:
  opening: <prose>
  turn: <prose>
  close: <prose>
character_beats:
  - character_id: <id>
    beat: <voice, prop, physicality, and arc notes; flaw references removed>
running_threads:
  - <story-level thread this episode must plant or pay off, in plot terms>
plot_obligations:
  - <vocabulary-flagging obligation or must-happen beat, in story terms>
scene_count_target: { min: 3, max: 5 }
```

That projection withholds:

- `flaws[]`
- `student_takeaway`
- `flaw_embedding_guidance.must_include`
- `flaw_embedding_guidance.avoid`
- `target_teachable_moments`
- `reference/flaw-taxonomy.yaml`

`staff_writer` does not receive the full flaw-bearing plan.

This command should plan all episodes in one shot so the story-level narrative arc is coherent.

## What This Command Must Not Do

Do not:

- generate final transcripts
- assign flaws to every turn
- force a rigid flaw count across all episodes
- generate lesson package answer choices

Those belong to later commands.

## Design Principles

### 1. Story-Level Coherence First

Episodes should feel like parts of one story, not isolated lesson containers.

### 2. Story Pressure Should Be Intentional

The operator and agent should decide:

- which wrong idea or unstable theory drives each episode
- where private stakes and offscreen life deepen the episode
- where earlier tensions are reinforced later
- where episodes should stay simple and where they can become richer

### 3. Plan For The Downstream Reader

Each episode plan should give the downstream app what it needs:

- a strong narrative spine
- enough clear obligations that later drafting does not invent the episode from scratch
- a saved brief that can be handed to `staff_writer` without hidden planning context

### 4. Preserve Room for Natural Transcript Writing

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

- `docs/instructional-design.md`

Scope rule for this run:

- treat `stories/{story_id}/story.yaml` as the only story source
- write only under `artifacts/{story_id}/`
- do not inspect sibling story artifact trees under `artifacts/` unless the operator explicitly asks for comparison or reuse
- if prior artifacts already exist under `artifacts/{story_id}/`, use only that same-story path as reference context for overwrites or revisions

## Validation Note

The current validator still enforces the older v3 `episode-plan.yaml` contract. Task 7 removes that mismatch.

Until then, author the v4 showrunner plan shape described in `todo-v4.md` even if `validate_episode_plan.py` still expects legacy flaw fields.

If you do run the validator, treat v3-only failures as expected migration debt rather than a reason to reintroduce `flaws[]`.

```bash
python3 pipeline/scripts/validate_episode_plan.py artifacts/{story_id}/{episode_id}/episode-plan.yaml
```

## Relationship to Later Commands

- `create_story` creates the story-level source artifact.
- `create_episodes` turns that into the full episode plan set and the paired saved projection used later by `staff_writer`.
- later transcript creation should happen one episode at a time.

Do not move into transcript writing in this command.
