---
description: Draft the full episode set for a simplified Lens story, including episode-level flaw progression and planning artifacts
---

# Create Episodes

Help the operator create the full episode set for a simplified Lens story.

This command is story-level planning, not transcript generation.

Its job is to translate a completed or mostly completed `story.yaml` into a set of simplified `episode-plan.yaml` artifacts, one per episode, with a coherent learning arc across the whole story.

The output of this command is the **full episode-plan set for the story in one run**. Do not reinterpret this as a per-episode planning command.

## Output Target

The default artifacts are:

- `artifacts/{story_id}/episode_01/episode-plan.yaml`
- `artifacts/{story_id}/episode_02/episode-plan.yaml`
- and so on for the full episode set

This command also prepares an **ephemeral screenwriter projection** for each episode plan. Those projections are in-context handoff material for `create_transcript`, not saved artifacts on disk.

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
- flaws — the primary flaw must carry exactly 3 quiz-worthy moments total: one each at `unmistakable`, `showcased`, and `heightened`, distributed across distinct scenes. Supporting flaws optional.
- student takeaway
- scene design
- character beats
- flaw embedding guidance

For each episode, also prepare this exact screenwriter projection shape:

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

`screenwriter` does not receive the full flaw-bearing plan.

This command should plan all episodes in one shot so the story-level flaw progression is coherent.

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

### 2. Flaw Progression Should Be Intentional

The operator and agent should decide:

- which flaw anchors each episode
- where earlier flaws are reinforced later
- where episodes should stay simple
- where later episodes can become slightly richer

### 3. Plan For The Downstream Reader

Each episode plan should give the downstream app what it needs:

- 3 quiz-worthy primary-flaw moments
- one per amplification band
- no two of those 3 moments in the same scene
- turns clear enough that later prompts can ask the question directly without repeating the turn

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
- `reference/flaw-taxonomy.yaml`

Scope rule for this run:

- treat `stories/{story_id}/story.yaml` as the only story source
- write only under `artifacts/{story_id}/`
- do not inspect sibling story artifact trees under `artifacts/` unless the operator explicitly asks for comparison or reuse
- if prior artifacts already exist under `artifacts/{story_id}/`, use only that same-story path as reference context for overwrites or revisions

## Required Validation Step

After saving each `episode-plan.yaml`, run:

```bash
python3 pipeline/scripts/validate_episode_plan.py artifacts/{story_id}/{episode_id}/episode-plan.yaml
```

Each saved episode plan should pass before the episode set is treated as complete.

## Relationship to Later Commands

- `create_story` creates the story-level source artifact.
- `create_episodes` turns that into the full episode plan set and the paired in-context projection shape used later by `screenwriter`.
- later transcript creation should happen one episode at a time.

Do not move into transcript writing in this command.
