# Story-Design Doctrine

This document is the canonical source of authoring doctrine for v5 story design. It is implementation-agnostic: it describes **how** to co-design a story with an author and **what** each phase commits, without prescribing the runtime (Claude Code command, webapp, or anything else) that delivers the conversation.

Two implementations consume this document:

- `v5/pipeline/commands/design_story.md` — Claude Code slash command
- `v5/design_story/orchestrator-prompt.md` — webapp Agent SDK orchestrator

Each implementation wraps the doctrine with runtime-specific orchestration (rerun flow, tool surface, UI surface, session model). The doctrine stays one file.

## 1. Output contract

Every `/design_story` session produces two artifacts under `v5/stories/{story_id}/`:

- `story.yaml` — schema: `v5/schemas/story.yaml`. The single story-design source artifact. Carries story-level fields (`premise`, `characters[]`) and an ordered `episodes[]` array of per-episode blocks.
- `story-design-review.md` — Phase D approval artifact. `Status: approved` is the load-bearing signal downstream commands check before running.

Validation at serialize time: `v5/pipeline/scripts/validate_story.py`.

## 2. Authoring Doctrine

These principles shape every phase. Internalize them before the conversation starts; return to them as the conversation drifts.

### 2.1 Persuasive-thread discipline

Each episode must have at least one character actively promoting an argument, intention, or position that other characters can examine, push back on, or extend. This persuasive pressure is what makes reasoning visible — without it, reasoning stays latent and downstream teaching anchors have to be manufactured after the fact.

The persuasive thread lives inside the `episode_synopsis` prose; there is no separate "argument" field. During Phase C, co-design each synopsis until the pressure point is clear in the operator's voice. If a proposed synopsis has no pressure (everyone agrees, no stakes, no friction), surface that and help the operator locate or invent it.

### 2.2 Awareness, not checklist

The orchestrator has full access to `v5/reference/reasoning-taxonomy.yaml` for **awareness**, not prescription. Taxonomy awareness means knowing what kinds of reasoning moves can be taught (six items across three lenses) so you can have grounded conversations about which moves an episode might surface. It does **not** mean picking specific reasoning items for the operator, authoring a `suggested_reasoning_items` field, or inserting taxonomy labels into the story artifact.

Reasoning items are detected downstream by `script_doctor` against the raw transcript. `story.yaml` carries no per-episode lens declarations, reasoning-item targets, flaw labels, density hints, or plot-obligation lists.

### 2.3 Lens coverage (story-level, conversational)

During Phase D review, assess whether the episode synopses collectively make room for all three lenses (`logic`, `evidence`, `scope`). If one lens is conspicuously absent, raise it with the operator and suggest which episode could be nudged to surface it. This is coverage awareness, not a quota — a story may reasonably lean toward one or two lenses by design.

### 2.4 Audience fit

Student-facing text — `premise` and `final_takeaway` — is pitched to a 6th-grade reader. Story `title` and per-episode `title` also render to students (selection screens, scene chrome) and are held to a lighter bar: no adult-specialized vocabulary, no curriculum-label wording (for example, "Confirmation bias, pt. 1"); creative flair and in-world references are permitted.

`episode_synopsis` is staff_writer-facing and never shown to students, but is bounded by the same middle-school subject matter so the dialogue it seeds inherits audience fit. Subject matter lives inside a middle-schooler's direct experience (school, friends, family, sports, games, pets, online life, local community). Adult-specialized topics are out of bounds unless explicitly introduced in-scene.

Enforcing audience appropriateness at Phase D means downstream stages do not re-check per turn.

### 2.5 Reading-time heuristic

6th-grade silent reading averages ~150 words per minute. At Phase D serialize time, each episode's `reading_time_minutes` (operator-authored scalar, range 6–12 minutes) is converted into a `word_count_range` stored on the episode block as a drafting guideline for staff_writer:

```
word_count_range.min = (reading_time_minutes - 1) × 150
word_count_range.max = (reading_time_minutes + 1) × 150
```

±1 minute tolerance → ~300 words of slack on either side of the minute target.

Examples:

- 7-minute episode → `word_count_range: { min: 900, max: 1200 }`
- 8-minute episode → `word_count_range: { min: 1050, max: 1350 }`
- 10-minute episode → `word_count_range: { min: 1350, max: 1650 }`

Word count sums the `text` field of every turn (narrator + character dialogue). Chrome (speaker names, turn ids, scene summaries) is not counted.

**The range is a guideline, not a hard constraint.** Validators do not enforce actual transcript word counts against the range. Good dialogue with strong story momentum takes precedence over landing exactly in range.

Rough turn-count intuition: ~30 words per turn means roughly **4–5 turns per target minute**, so an 8-minute episode is around 40 turns. Use this when helping the operator set `reading_time_minutes` values that make sense for the scope of each episode's synopsis.

### 2.6 Narrator convention

A lightweight narrator voice is permitted in the transcript for scene-setting and cohesion. The operator does not author narrator lines at design time; they appear during transcript drafting. Keep in mind when staff_writer runs later: narrator turns are sparing, short, and plain — establishing place/time or marking a beat transition. The narrator does **not** define vocabulary, explain reasoning, or moralize. The narrator is a voice, not a character, and does not appear in the `characters[]` roster.

### 2.7 Restraint on structural invention

If the operator asks for a field or commitment not in `schemas/story.yaml` ("can we add a focus flaw per episode?", "can we mark scene structure?"), push back. The schema is lean by design. Every dropped field was dropped because it tempted mechanical authoring. Don't reintroduce those pressures through ad-hoc additions.

## 3. Phases

The conversation is structured in four phases. Phases are not rigid steppers — they shape the *beats* of the conversation, and the orchestrator names them aloud so the operator knows where they are. Each phase has a commit goal; advancing means the operator has signed off on that commit.

### 3.1 Phase A — World and voice

Establish the story's foundation.

**Commit goal:** `story_id`, `title`, `premise`, `characters[]` drafted and operator-approved.

Topics:

- premise (one-paragraph student-facing hook; setting and world texture live inside premise prose, not a separate field)
- recurring characters: names, `character_id`s, 2–3-sentence voice hooks, relational dynamics

The premise is pitched as a hook, not a curriculum teaser. Voice hooks are rich enough that a writer can later derive episode-specific behavior without a separate per-episode `character_beats` field.

### 3.2 Phase B — Arc

Establish the episode map at a high level.

**Commit goal:** ordered `episodes[]` array with `episode_id`, `title`, and a one-sentence narrative seed per episode. Full synopses are not yet authored.

Topics:

- number of episodes (typical: 3–5)
- what changes from episode 1 to episode N
- a sentence or two per episode — just enough to know what each episode is about

### 3.3 Phase C — Per-episode co-design

For each episode in order, work with the operator to author the load-bearing per-episode fields.

**Commit goal:** for every episode — `episode_synopsis`, `reading_time_minutes`, `final_takeaway`.

During co-design of each synopsis:

- **Name the persuasive pressure.** If a draft doesn't have one, say so: "this synopsis is about observation but nobody's trying to convince anyone of anything — should someone be pushing a theory, a plan, or a judgment?"
- **Keep taxonomy awareness in the background.** If the operator asks "what reasoning does this expose?", answer in plain language ("this looks like someone leaning on a shaky source — that's evidence territory"). Do not insist on labels.
- **Resist over-engineering.** Not every turn should be argumentative. Most dialogue is voice, relationship, and scene movement. Push back if the operator tries to make every beat a reasoning exercise.

`final_takeaway` is one student-facing sentence per episode. `reading_time_minutes` is an integer 6–12; apply the heuristic above to keep it plausible for the synopsis scope.

### 3.4 Phase D — Review and serialize

Before writing `story.yaml`, run five checks:

1. **Lens coverage.** Scan all synopses. If one lens is conspicuously absent, raise it and offer a suggestion for which synopsis could be nudged. Let the operator decide.
2. **Persuasive thread.** Each synopsis names a live persuasive thread. Flag any that don't.
3. **Audience fit.** `premise` and every `final_takeaway` pitched at 6th-grade. Every `episode_synopsis` — staff_writer-facing, not rendered to students — bounded to middle-school subject matter so the dialogue it seeds inherits audience fit. Flag adult-specialized topics anywhere.
4. **Reading-time sanity.** Values are plausible for the synopsis scope.
5. **Premise revisit.** The premise was drafted in Phase A before episode shape was known. Revisit it now with the full episode arc visible. Propose a tightened final version that sounds like a student-facing hook (not a curriculum teaser), and let the operator approve the final wording.

Present findings. Let the operator accept, revise, or override.

Once approved:

1. For each episode, compute `word_count_range` from `reading_time_minutes` per §2.5 and include it in the serialized episode block.
2. Write `v5/stories/{story_id}/story.yaml`.
3. Run `validate_story.py`.
4. If validation fails, report and loop back — do not write the review artifact on an invalid story.
5. If validation passes, write `v5/stories/{story_id}/story-design-review.md` with Phase D findings and operator sign-off.

## 4. Story-design-review.md format

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

## Premise revisit
- ok | revised — {notes}

## Notes
{free text, required if status is revise}
```

`Status: approved` is the load-bearing signal downstream commands check.

## 5. Conversation shape

Do not front-load the entire doctrine into the operator's lap. Lead with curiosity about the story; let the doctrine shape your questions and feedback. The operator should feel like they're co-designing with a knowledgeable collaborator, not completing a form.

When the operator drifts toward schema-field thinking ("what should the argument be for this episode?"), redirect to story thinking ("what's the pressure point — who's pushing, and on what?"). The doctrine shapes conversation; it does not shape the artifact's field list.

## 6. What this document does not cover

- **Runtime orchestration** — rerun behavior, tool surfaces, command/session lifecycle. These are implementation-specific and belong in the wrapping files (`pipeline/commands/design_story.md` for Claude Code, `design_story/orchestrator-prompt.md` for the webapp).
- **Downstream stages** — transcript drafting, detection, lesson-package authoring. See `v5/docs/architecture.md` and the respective command doctrines.
- **Student experience** — see `v5/docs/instructional-design.md`.

## 7. Cross-references

- System architecture: `v5/docs/architecture.md`
- Instructional pedagogy: `v5/docs/instructional-design.md`
- Operator workflow (Claude Code): `v5/docs/operator-workflow.md`
- Output schema: `v5/schemas/story.yaml`
- Taxonomy (awareness only): `v5/reference/reasoning-taxonomy.yaml`
- Claude Code surface: `v5/pipeline/commands/design_story.md`
- Webapp surface: `v5/design_story/orchestrator-prompt.md`
