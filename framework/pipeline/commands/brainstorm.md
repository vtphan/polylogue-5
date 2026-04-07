---
description: Co-design a per-episode draft (Appendix B) through guided conversation
---

# Brainstorm

Help an operator author a per-episode draft for one episode of a story. The draft is a Markdown file with YAML frontmatter that lives at `framework/docs/stories/{story_id}/episode_{NN}.md`. See **Appendix B of `framework/docs/story-pipeline-revision.md`** for the full template, and `framework/docs/operator-manual.md` for the prose-first authoring loop.

> **No telemetry.** Brainstorm is conversational and produces no pipeline artifacts — its output is the per-episode draft Markdown file, committed by hand. The first telemetry events for an episode are emitted by `/create_episode` once the draft has been authored.

## How This Works

You are a co-designer, not a form filler. The operator may not know or remember technical terms like "sufficiency" or "overgeneralization." Your job is to listen to what they want students to notice, map that to the framework, suggest options when they're unsure, and assemble the result as a per-episode draft.

You assume a story design doc already exists at `framework/docs/stories/{story_id}.md` — that is the source of truth for the cast and the arc. If it does not exist, redirect the operator to author it first (see `framework/docs/story-design.md` and `framework/docs/operator-manual.md`).

## Reference Data (load at start)

- Story design doc: `framework/docs/stories/{story_id}.md` (premise, cast, arc, declared coverage)
- Other per-episode drafts in this story (for continuity and rotation context): `framework/docs/stories/{story_id}/episode_*.md`
- Facet inventory: `framework/reference/facet_inventory.yaml`
- Explanatory variables: `framework/reference/explanatory_variables.yaml`
- Lenses: `framework/reference/lenses.yaml`
- Per-episode draft template: Appendix B of `framework/docs/story-pipeline-revision.md`
- Operator manual: `framework/docs/operator-manual.md`

## Conversation Flow

### 0. Orient the operator

Confirm which story they're authoring for and which episode number. Read the design doc and any prior episode drafts so you can refer to the cast, recent beats, and what coverage is still outstanding. Briefly orient the operator:

> **What you're authoring:** One episode of an existing story. The episode is captured as a Markdown file with YAML frontmatter — the frontmatter is the operator prompt that `/create_episode` consumes; the prose body is for human reviewers. The cast comes from the story design doc; you're picking which characters lead this episode, what they're discussing, and which reasoning targets the episode surfaces.

If the operator already knows the framework and the template, skip the orientation and go directly to step 1.

### 1. Start with what the operator cares about

Ask: **"What do you want students to practice noticing in this episode?"**

Map their answer to facets, cognitive patterns, and social dynamics from the framework reference. If their description matches multiple options, explain briefly and let them choose.

### 2. Check coverage and rotation

Read the story design doc's `declared_facets`, `declared_cognitive_patterns`, `declared_social_dynamics` and the union of targets across the other episode drafts. Surface any declared items still uncovered, and flag any character who is at risk of carrying more than half the story's strengths or weaknesses (the rotation rule). Steer toward closing coverage and balancing rotation.

### 3. Build the premise

Ask: **"What's happening this episode? What situation are the characters in?"** Translate to the draft's `premise` (one paragraph, narrative only) and `previously` (one or two sentences of recap, empty for episode 1).

### 4. Pick lead characters

2–5 characters from the design doc cast. Every strength/weakness carrier must be a lead (they need a speaker slot in the transcript). Confirm each lead is a natural carrier for at least one of the targets you're considering — their design-doc identity should support the cognitive_pattern or social_dynamic you'd assign them.

### 5. Author each target

For each target (facet + carrier + cognitive_pattern + social_dynamic):

- Ask **"How should this weakness show up in the conversation for this character?"** and translate to a `cognitive_signal` (required if cognitive_pattern is set) or `social_signal` (required if social_dynamic is set; describes a move/response turn-pair).
- The signal must be a *concrete behavioral trace* — stage direction, not analysis. It must read as something this character (per the design doc) would actually do.
- Optionally collect an `interaction_note` if the cognitive and social signals interact.

### 6. Author each strength

Mixed-valence is doctrinal — the episode must include at least one designed strength. Pick a facet that is *not* one of the targeted weaknesses, and prefer one with a different primary lens than the weaknesses. For each strength: facet, carrier, optional note.

### 7. Pick primary_lens and mixed_valence_shape

`primary_lens` is one of `logic`, `evidence`, `scope`. `mixed_valence_shape` is one of `early_strength_collapse`, `strength_prevails`, `stalemate`, `self_correction`, `unresolved_disagreement`. Both contribute to the cross-episode rotation rules.

### 8. Sketch the beats

5–8 dramatic beats in operator language. These are read by `story_consistency_reviewer` for character-consistency checking; planning_agent does not consume them.

### 9. Assemble and present

Write the complete per-episode draft following Appendix B's template (frontmatter + prose body with `## Authorial notes` and `## Why these targets` sections). Present it to the operator and ask:

> "Here's your draft. Read the frontmatter — does each `cognitive_signal` capture what you want the character to do? Does each `social_signal` describe a move/response shape clearly? Do the beats follow from the design doc's character voices? Anything you'd change?"

After adjustments, save the file at `framework/docs/stories/{story_id}/episode_{NN}.md` and recommend the operator run `validate_story.py` and `story_consistency_reviewer` before moving on to `/create_episode` in Phase 7.

## Principles

- **Use plain language first, framework terms second.** The operator thinks in "I want them to notice the group ignored a good point" — you translate that to `perspective_engagement`.
- **Always explain your suggestions.** Don't just say "I recommend sufficiency." Say why it fits their goals.
- **Respect the design doc.** The cast is fixed; the arc is fixed. If the operator asks for a target a character can't naturally carry per the design doc, push back and suggest an alternative carrier or a different target.
- **Cover the contract.** Read what other drafts in the story have already targeted. Steer toward what is still uncovered.
- **Stay on the right side of the information barrier.** Signals are stage directions, not framework labels. The dialog writer will never see this draft, but `planning_agent` derives the projection from it — the cleaner the signals, the cleaner the projection.
