---
description: Draft the full episode set for a simplified Lens story, including episode-level flaw progression and planning artifacts
---

# Create Episodes

Help the operator create the full episode set for a simplified Lens story.

This command is story-level planning, not transcript generation.

Its job is to translate a completed or mostly completed `story.yaml` into a set of simplified `episode-plan.yaml` artifacts, one per episode, with a coherent learning arc across the whole story.

## Output Target

The default artifacts are:

- `simplified-framework/examples/stories/{story_id}/episode_01/episode-plan.yaml`
- `simplified-framework/examples/stories/{story_id}/episode_02/episode-plan.yaml`
- and so on for the full episode set

These should follow:

- `simplified-framework/docs/episode-plan-spec.md`
- `simplified-framework/schemas/episode-plan.yaml`

Validation script:

- `python3 simplified-framework/pipeline/scripts/validate_episode_plan.py simplified-framework/examples/stories/{story_id}/{episode_id}/episode-plan.yaml`

## What This Command Must Do

Using the story artifact and operator input, define the episode set at the planning level.

For each episode, determine:

- title
- episode goal
- flaws
- target difficulty
- rough number of teachable moments
- student takeaway
- scene design
- character beats
- flaw embedding guidance

This command should plan all episodes in one shot so the story-level flaw progression is coherent.

## What This Command Must Not Do

Do not:

- generate final transcripts
- assign flaws to every turn
- force a rigid flaw count across all episodes
- generate assistive-package answer choices

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

### 3. Counts Are Guidance, Not Hard Law

Each episode plan may include target teachable-moment counts and warm-up/level goals.

These are planning aids, not rigid rules.

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

## What To Optimize For

Optimize for:

- a clear multi-episode learning progression
- natural story development
- beginner-friendly flaw focus in early episodes
- room for reinforcement in later episodes
- episode plans that later transcript agents can actually write from

Do not optimize for:

- analytic over-completeness
- packing many flaws into every episode
- rigid regularity across all episodes

## Inputs

Primary input:

- `simplified-framework/examples/stories/{story_id}/story.yaml`

Also read as needed:

- `simplified-framework/docs/conceptual-model.md`
- `simplified-framework/docs/instructional-model.md`
- `simplified-framework/docs/episode-plan-spec.md`
- `simplified-framework/mappings/flaw-taxonomy.md`
- `simplified-framework/reference/flaw-taxonomy.yaml`

## When To Draft

Once the story-level episode map is sufficiently clear, draft the set of `episode-plan.yaml` files for all episodes.

If some details are still open:

- make reasonable placeholders
- mark them clearly as provisional
- keep moving

## Required Validation Step

After saving each `episode-plan.yaml`, run:

```bash
python3 simplified-framework/pipeline/scripts/validate_episode_plan.py simplified-framework/examples/stories/{story_id}/{episode_id}/episode-plan.yaml
```

Each saved episode plan should pass before the episode set is treated as complete.

## Relationship to Later Commands

- `create_story` creates the story-level source artifact.
- `create_episodes` turns that into the full episode plan set.
- later transcript creation should happen one episode at a time.

Do not move into transcript writing in this command.
