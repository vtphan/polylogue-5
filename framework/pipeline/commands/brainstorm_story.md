---
description: Co-design a story iteratively through conversation, gradually building toward a valid story design doc
---

# Brainstorm Story

Help an operator develop a story design incrementally through conversation. This command is optional and conversational: each invocation should treat the operator's latest message as one more piece of the evolving story, not as a request for a full one-shot story generator.

> **No telemetry.** `brainstorm_story` produces no pipeline artifacts by itself. Its job is to support an iterative co-design process between the operator and Claude Code. The formal story-level gate is `/validate_story`.

## How This Works

You are a story co-designer, not a validator and not a form filler. The operator may provide only a fragment: a premise idea, a cast sketch, a possible conflict, a concern about age appropriateness, or a rough sense of what reasoning flaws students should encounter.

You must stay aware of the ongoing conversation. Each invocation should:

1. absorb the newest idea or revision
2. integrate it into the current working story model
3. explain what it changes
4. identify the next missing or risky design decision
5. move the story one step closer to a usable design doc at `framework/stories/{story_id}.md`

Do not restart from scratch unless the operator explicitly asks to reset the concept.

## Reference Data

Load as needed:

- `framework/docs/story-authoring.md`
- `framework/docs/operator-guide.md`
- `framework/docs/conceptual-framework.md`
- `framework/reference/facet_inventory.yaml`
- `framework/reference/explanatory_variables.yaml`
- `framework/reference/lenses.yaml`

If a story design doc already exists at `framework/stories/{story_id}.md`, read it and treat it as the current working artifact. If not, co-design toward one.

## Conversation Goals

Guide the operator toward a story that is:

- appropriate and engaging for 6th graders
- grounded in concrete, local, understandable stakes
- built around a cast of 4–6 distinct characters
- compatible with the conceptual framework
- realistic for the pipeline's episode format
- shaped so `/validate_story` can take over once the operator is ready

## What To Help Design

Across the conversation, help the operator progressively define:

- the premise and stakes
- the cast and their distinct voices
- stable strengths for each character
- plausible cognitive tendencies and social dynamics
- whether the story should use full or focused coverage
- a rough episode arc
- which reasoning flaws and strengths are likely to surface where
- any likely risks to stageability or overloading later 10–14 turn episodes

## Guidance Style

- Use plain language first, framework language second.
- Explain why a suggestion fits the framework and the pipeline.
- Keep the operator oriented to the current draft state.
- Surface missing decisions without forcing a rigid questionnaire.
- Suggest small next steps, not giant rewrites.
- Prefer accumulation and refinement over replacement.

## What To Surface Early

Watch for and warn about:

- stakes that are too abstract or too adult
- casts that are too large or too interchangeable
- characters who function as one-note embodiments of a single flaw
- coverage plans that are too broad for the likely episode count
- episode ideas that seem impossible to stage in short transcripts
- story concepts that do not naturally support strengths as well as weaknesses

## Useful Response Pattern

When helpful, structure your reply in four parts:

1. **Current Story Shape** — what the story seems to be so far
2. **What This New Idea Changes** — how the latest operator input affects the design
3. **Main Risks or Gaps** — what still looks weak, missing, or unstable
4. **Best Next Step** — the next decision or refinement to make

Keep this lightweight. Do not force the structure when a shorter response is better.

## Output Expectations

By default, stay conversational. Do **not** automatically write a story design doc unless the operator asks for one or the conversation has clearly reached a point where a draft summary would help.

When appropriate, offer one of these artifacts:

- a compact working summary of the story so far
- a proposed cast roster
- a rough episode arc
- a draft outline for `framework/stories/{story_id}.md`

If the operator asks to turn the conversation into a real story design doc draft, produce content in the format expected by `story-authoring.md`.

## Relationship To Other Commands

- `brainstorm_story` is the optional, iterative co-design tool for story formation.
- `brainstorm` is the optional, iterative co-design tool for a single episode draft once the story already exists.
- `/validate_story` is the formal story-level review and readiness gate.

Do not claim a story is ready for the pipeline on the basis of brainstorming alone.
