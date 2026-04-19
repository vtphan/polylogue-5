---
description: Chat with the operator and draft a simplified `story.yaml` for the new Lens pipeline
---

# Create Story

Help the operator create a simplified story design for the new Lens framework.

This command is conversational and human-in-the-loop. Its job is to gather the minimum story-level decisions needed to draft `story.yaml` in the simplified format.

Unlike the older framework, this command should stay light:

- no heavy multi-stage validation
- no requirement to fully lock every story detail before moving on
- no pressure to maximize analytic richness

The goal is to produce a usable story artifact for the simplified pipeline.

## Output Target

The primary artifact is:

- `stories/{story_id}/story.yaml`

Default to that story-source path unless the operator explicitly asks for another location.

This command creates source material, not generated lesson artifacts.

Episode plans, transcripts, flaw reviews, and lesson packages belong later under:

- `artifacts/{story_id}/{episode_id}/`

The output should follow:

- `docs/instructional-design.md`
- `schemas/story.yaml`

Do not read `reference/flaw-taxonomy.yaml` at the story-design stage. In v4 `story_designer` does not author a flaw inventory, and flaw taxonomy language should not leak into `story.yaml` or operator-facing story framing.

Validation script:

- `python3 pipeline/scripts/validate_story.py stories/{story_id}/story.yaml`

## What This Command Must Do

Through conversation with the operator, help define:

- `story_id`
- `title`
- `premise` — student-facing overview (see §Premise Guidance below)
- audience and tone
- setting
- recurring characters (distinct voices)
- episode set — each episode has `episode_id`, `title`, `summary` (showrunner-facing; see §Episode Summary Guidance), and `final_takeaway` (student-facing closing line)

Do not force a rigid questionnaire. Move the story toward a clean `story.yaml` draft through short, focused exchanges.

## Premise Guidance

`premise` is rendered to students on the `/stories` page. It is not a brief for downstream agents. Author it as a short student-facing overview:

- set up who the characters are and what they notice
- hint in plain student-facing language at the kinds of thinking moves the story will practice — not flaw taxonomy vocabulary
- do not spoil the per-episode plot or the final answer
- keep it short (a paragraph, not a synopsis)

## Episode Summary Guidance

Each `episodes[].summary` is a showrunner-facing paragraph. It gives `create_episodes` enough authorial intent to plan that episode without inventing the story from scratch. It is not rendered to students, so it may carry per-episode plot detail, specific sources, specific locations, and concrete setups/disproofs.

An episode summary should:

- name the hypothesis the episode pursues and what disproves or complicates it
- identify which character leads the episode and why
- note any recurring images, running threads, or joke beats the author wants preserved
- stay at the level of narrative intent — not a scene-by-scene script and not flaw-taxonomy guidance

Do not include flaw names, amplification levels, or teachable-moment counts in episode summaries. Flaw selection happens later at the `script_doctor` stage against the finished story draft.

## Conversation Style

You are a co-designer, not a validator.

Use this workflow:

1. absorb the operator's latest idea
2. summarize the current story shape
3. identify the next missing or risky decision
4. ask only what is needed to move the story toward a usable draft

Keep the operator oriented to:

- what is already decided
- what is still open
- what will matter downstream for episode and transcript generation

## What To Optimize For

Optimize for:

- a good story in the literary sense
- recurring characters with distinct voices
- a plausible multi-episode arc
- flaws that can be embedded naturally later
- a story structure that can support the app

Do not optimize for:

- exhaustive framework detail
- overfitting the story to taxonomy
- forcing every episode to look the same

## Important Story-Level Constraints

In v4 `story_designer` does not decide which flaws appear in which episodes. Flaw selection is the `script_doctor` job, run against the finished story draft and approved by the operator at a later checkpoint.

At the story level, help the operator decide the narrative shape — characters, setting, episode titles, and the per-episode `final_takeaway` the story aims toward. Do not impose flaw names, counts, amplification levels, or distribution across episodes.

## When To Draft

By default, stay conversational until the operator has given enough information for a usable story draft.

Once there is enough information, offer to draft `story.yaml`.

If the operator explicitly asks for a draft, produce it even if some details are still provisional. Use reasonable placeholders where needed and mark them clearly.

## Useful Response Pattern

When helpful, structure your response like this:

1. **Current Story Shape**
2. **What Is Settled**
3. **What Still Needs a Decision**
4. **Best Next Step**

Keep this lightweight.

## Required Validation Step

After saving `story.yaml`, run:

```bash
python3 pipeline/scripts/validate_story.py stories/{story_id}/story.yaml
```

If validation fails:

- revise the artifact
- rerun the validation
- do not treat the story draft as ready until it passes

## Relationship to Later Commands

- `create_story` defines the story world and episode map.
- later episode creation commands should use this artifact as their source of truth.
- transcript generation happens later and one episode at a time.

Do not try to generate transcripts or lesson package content in this command.
