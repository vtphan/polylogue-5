---
name: design_story
description: Interactive multi-phase co-design of a full story with all per-episode commitments. Handled by the main orchestrator in conversation with the operator.
---

# /design_story

`/design_story` produces `stories/{story_id}/story.yaml` through an extended multi-turn conversation with the operator. You (the main orchestrator) hold the taxonomy, the authoring doctrine, and the conversation shape. The operator holds the creative authority.

There is no subagent. The design conversation belongs here.

## Reads

Required, at session start:

- `v5/reference/reasoning-taxonomy.yaml` — full taxonomy. You have this for awareness. You do not author reasoning items into story.yaml; you use the taxonomy to recognize whether proposed episodes will surface genuine reasoning opportunities.
- `v5/schemas/story.yaml` — the output contract.
- `v5/docs/instructional-design.md` — the pedagogical frame.

Optional, on request:

- `v5/stories/` — to see prior stories if the operator wants to reference or extend one.

## Writes

- `v5/stories/{story_id}/story.yaml` — the single serialized output.
- `v5/stories/{story_id}/story-design-review.md` — Phase D approval artifact.

Nothing else is written by this command. Artifacts under `v5/artifacts/{story_id}/` are produced by downstream commands.

## Rerun behavior

On invocation, if `v5/stories/{story_id}/story.yaml` already exists, report that and ask the operator to confirm a fresh run. A fresh run clears `story.yaml` and `story-design-review.md` in that story directory. Downstream artifacts under `v5/artifacts/{story_id}/` may become stale; warn the operator and let them decide.

## Authoring Doctrine

These principles shape every phase below. Internalize them before the conversation starts.

### Persuasive-thread discipline

Each episode must have at least one character actively promoting an argument, intention, or position that other characters can examine, push back on, or extend. This persuasive pressure is what makes reasoning visible — without it, reasoning stays latent and teaching anchors have to be manufactured after the fact.

You do **not** author a separate "argument" field. During Phase C, co-design each `episode_synopsis` until it clearly embeds a persuasive thread in the operator's voice. If a proposed synopsis has no pressure point (everyone agrees, no stakes, no friction), surface that and help the operator locate or invent it.

### Awareness, not checklist

You have full taxonomy access for *awareness*, not for prescription. You know what kinds of reasoning moves can be taught (six items across three lenses). You use this to have grounded conversations about which reasoning moves an episode could surface. You do **not** pick specific reasoning items for the operator, and you do not author a `suggested_reasoning_items` field. Reasoning items are detected downstream by `script_doctor`, not declared at design time.

### Lens coverage (story-level, conversational)

During Phase D review, assess whether the episode synopses collectively make room for all three lenses (`logic`, `evidence`, `scope`). If one lens is conspicuously absent, raise it with the operator and suggest which episode could be nudged to surface it. This is coverage awareness, not a quota — a story may reasonably lean toward one or two lenses by design.

### Audience fit

All student-facing text — `premise`, `episode_synopsis`, `final_takeaway` — is pitched to a 6th-grade reader. Subject matter lives inside a middle-schooler's direct experience (school, friends, family, sports, games, pets, online life, local community). Adult-specialized topics are out of bounds unless explicitly introduced in-scene.

### Reading-time heuristic

6th-grade silent reading averages ~150 words per minute. At Phase D serialize time, each episode's `reading_time_minutes` is converted into a `word_count_range` stored in the episode block as a drafting guideline for staff_writer:

```
word_count_range.min = (reading_time_minutes - 1) × 150
word_count_range.max = (reading_time_minutes + 1) × 150
```

±1 minute tolerance, so ~300 words of slack on either side of the minute target.

Examples:

- 7-minute episode → `word_count_range: { min: 900, max: 1200 }`
- 8-minute episode → `word_count_range: { min: 1050, max: 1350 }`
- 10-minute episode → `word_count_range: { min: 1350, max: 1650 }`

Word count sums the `text` field of every turn (narrator + character dialogue). Chrome like speaker names, turn ids, and scene summaries is not counted.

**The range is a guideline, not a hard constraint.** Validators do not enforce actual transcript word counts against the range. Good dialogue with strong story momentum takes precedence over landing exactly in range — staff_writer targets the range, but operator review at the raw-draft gate is where length is judged.

Rough turn-count intuition: ~30 words per turn means roughly **4–5 turns per target minute**, so an 8-minute episode is around 40 turns. Use this when helping the operator set `reading_time_minutes` values that make sense for the scope of each episode's synopsis.

### Narrator convention

Remind the operator (or keep in mind yourself when staff_writer runs later) that a lightweight narrator voice is permitted for scene-setting and cohesion. Sparse, short, plain. The narrator establishes place/time or marks a beat transition; it does **not** define vocabulary, explain reasoning, or moralize. The narrator is a voice, not a character.

### Restraint on structural invention

If the operator asks for a field or commitment not in `schemas/story.yaml` ("can we add a focus flaw per episode?" "can we mark scene structure?"), push back. The schema is lean by design. Every dropped field was dropped because it tempted mechanical authoring. Don't reintroduce those pressures through ad-hoc additions.

## Phases

### Phase A — World and voice

Establish the story's foundation. Ask about:

- premise (one-paragraph student-facing hook)
- setting, tone, register — to be written into premise prose, not a separate field
- recurring characters: names, voice hooks (2–3 sentences each, baseline voice), relational dynamics

Draft the story-level block (`story_id`, `title`, `premise`, `characters[]`) but do not serialize yet. Confirm with the operator before moving to Phase B.

### Phase B — Arc

Establish the episode map at a high level. Ask about:

- number of episodes (typical: 3–5)
- story arc: what changes from episode 1 to episode N
- per-episode narrative seeds — a sentence or two each, just enough to know what each episode is about

Draft the episode map with placeholder `episode_synopsis` values (one-sentence seeds). Confirm with the operator before moving to Phase C.

### Phase C — Per-episode co-design

For each episode in order, work with the operator to author:

- `episode_synopsis` — full paragraph of story-voice prose. Carries persuasive thread, plot beats, episode-specific character action. The heart of the episode plan.
- `reading_time_minutes` — operator-set; apply the heuristic above
- `final_takeaway` — one sentence, student-facing

During co-design of each synopsis:

- Name the persuasive pressure. If the draft doesn't have one, say so: "this synopsis is about observation but nobody's trying to convince anyone of anything — should someone be pushing a theory, a plan, or a judgment?"
- Keep taxonomy awareness in the background. If the operator asks "what reasoning does this expose?", answer in plain language ("this looks like someone leaning on a shaky source — that's evidence territory"). Do not insist on labels.
- Resist over-engineering. Not every turn should be argumentative. Most dialogue is voice, relationship, and scene movement. Push back if the operator tries to make every beat a reasoning exercise.

### Phase D — Review and serialize

Before writing `story.yaml`:

1. **Lens coverage check**. Scan all synopses. If one lens is conspicuously absent, raise it. Offer a suggestion for which synopsis could be nudged. Let the operator decide.
2. **Persuasive-thread check**. Each synopsis names a live persuasive thread. Flag any that don't.
3. **Audience fit check**. Premise, synopses, and takeaways pitched at 6th-grade. Flag adult-specialized topics.
4. **Reading-time sanity**. Times are plausible for the synopsis scope.
5. **Premise revisit**. The premise was drafted in Phase A before episode shape was known. Revisit it now with the full episode arc visible. Propose a tightened final version that sounds like a student-facing hook (not a curriculum teaser), and let the operator approve the final wording.

Present the findings. Let the operator accept, revise, or override.

Once approved:

1. For each episode, compute `word_count_range` from `reading_time_minutes` per the heuristic above and include it in the serialized episode block.
2. Write `v5/stories/{story_id}/story.yaml`.
3. Run `python3 v5/pipeline/scripts/validate_story.py <path>`.
4. If validation fails, report and loop back — do not write the review artifact on an invalid story.
5. If validation passes, write `v5/stories/{story_id}/story-design-review.md` with the Phase D findings and operator sign-off.

### Story-design-review.md format

```markdown
# Story Design Review — {story_id}

- Status: approved | revise
- Reviewer: {operator id}
- Date: {YYYY-MM-DD}

## Lens coverage
- logic: covered by {episode_ids} | gap
- evidence: covered by {episode_ids} | gap
- scope: covered by {episode_ids} | gap

## Persuasive threads
- {episode_id}: {one-line naming the thread} — ok | concern

## Audience fit
- premise: ok | concern
- episodes: ok | concern — {notes}

## Reading-time sanity
- ok | concern — {notes}

## Notes
{free text, required if status is revise}
```

`Status: approved` is the load-bearing signal that `/create_transcript` checks before running.

## Conversation shape

Do not front-load the entire doctrine into the operator's lap. Lead with curiosity about the story; let the doctrine shape your questions and feedback. The operator should feel like they're co-designing with a knowledgeable collaborator, not completing a form.

When the operator drifts toward schema-field thinking ("what should the argument be for this episode?"), redirect to story thinking ("what's the pressure point — who's pushing, and on what?"). The doctrine shapes conversation; it does not shape the artifact's field list.
