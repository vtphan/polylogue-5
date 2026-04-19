# TODO v3 — Reading Scaffolds + Two-Column Reader (draft)

> **DRAFT — opened 2026-04-18.** Supersedes `todo-v2.md` (frozen). This is a working document; items are not yet locked. Use it to accumulate the v3 scope during conversation; promote items to "locked" only once we've agreed on them.

> **This document describes planned revisions, not current state.** For the system as it stands today, consult:
>
> - `simplified-framework/docs/instructional-design.md`
> - `simplified-framework/docs/tech-reference.md`
> - `simplified-framework/docs/operator-workflow.md`
> - `simplified-framework/reference/flaw-taxonomy.yaml`
>
> When a planned change here conflicts with the docs, treat this file as forward direction and the docs as current state. Source-of-truth precedence (validators → Zod schemas → artifacts → Prisma → taxonomy → docs) is defined in `CLAUDE.md`.

---

## Contents

1. [Motivation](#motivation)
2. [What already landed in the v2→v3 transition (2026-04-18 UI pass)](#what-already-landed-in-the-v2v3-transition-2026-04-18-ui-pass)
3. [Instructional-design principles driving v3](#instructional-design-principles-driving-v3)
4. [Upstream: reading-scaffold authoring surface](#upstream-reading-scaffold-authoring-surface)
5. [Upstream: remove `kind: action` turns from the pipeline](#upstream-remove-kind-action-turns-from-the-pipeline)
6. [Runtime: follow-on UI refinements](#runtime-follow-on-ui-refinements)
7. [Open questions](#open-questions)
8. [Explicitly out of scope](#explicitly-out-of-scope)

---

## Motivation

v2 delivered the full two-mode architecture (practice + read-a-story), star scoring, the three-level quiz contract, the screenwriter/flaw-injector split, and the grade-6 scaffolding readability gate. A 2026-04-18 review of the reader surface surfaced two follow-ons:

1. **Right-column scaffold is the correct home for the quiz, not the inline-below-turn position v2 specified.** Fixed-viewport laptop/tablet layout with a dialog column on the left and a scaffold rail on the right gives the student one persistent thinking space. This pass landed in code as part of the v2→v3 transition (see next section).
2. **The lesson package has very little reading scaffold.** Today only `episode.summary`, optional `episode.previously`, and per-scene `scene.summary` exist. Everything else in the package is quiz machinery. v3's upstream work adds structured reading scaffolds that the right column can surface during reading mode.

In parallel, the in-episode action beats currently drift long (25–45 word narration paragraphs rather than the stage-line beats v2 §8 imagined). That is an authoring-bar problem in the screenwriter agent, not a schema problem, but it lands here for v3 follow-up.

---

## What already landed in the v2→v3 transition (2026-04-18 UI pass)

Committed in the codebase ahead of locking this doc:

- **Two-column fixed-viewport scene reader.** `simplified-framework/app/src/app/runs/[runId]/scene/[n]/page.tsx` renders `.scene-shell` with a capped reading column on the left (~42rem / ≈68ch, the prose-optimal line length) and a `.scaffold-panel` rail on the right.
- **Quiz renders in the right rail**, not inline. New `ScaffoldPanel.tsx` swaps between reading mode (scene summary + collapsible About/Previously + character chips) and quiz mode (`QuizPanel.tsx`).
- **Flagged-turn visual tether.** Flagged turn gets a left-edge accent band; when the quiz opens, `.scaffold-panel--quiz` gets a matching top accent band. Flagged turn in the left column toggles between an **Open question →** chip (closed) and a **Question is open →** indicator (open) via a server-action URL param (`?open=<level_id>`).
- **Action turns removed from the reader.** Initially re-styled as inline italic narration (2026-04-18 AM); operator review concluded they were more distractive than useful and the reader now filters them out entirely (2026-04-18 PM). See §[Upstream: remove `kind: action` turns from the pipeline](#upstream-remove-kind-action-turns-from-the-pipeline) for the pipeline follow-up.
- **Quoted-turn line in Quiz Reveal.** Lock state surfaces the flagged turn as a `.quiz-quote` inside the panel so the student doesn't scan back to the left column to remember what they were judging (Mayer spatial contiguity).
- **Persistent character chip row** in the scene-shell header.
- **Collapsible "About this episode" + "Previously"** blocks in the scaffold rail — open by default on scene 1, collapsed on scene ≥2.
- **Fixed bottom nav** (`.scene-bottom-bar`) carries Prev / stars / Recap · Next, matches the cda9e6f session-bar footprint.
- **Dead styles removed** from `globals.css` (~500 lines of lesson-workspace / work-drawer / session-bar / warmup / reveal-stages / reading-workspace / etc.).

These are locked-in code. v3's upstream work extends the artifact contract to fill the scaffold rail with richer content; v3's runtime work refines the reader around the shell.

---

## Instructional-design principles driving v3

Cognitive-load theory (Sweller) + Mayer multimedia principles, applied to the reader:

1. **Spatial contiguity.** Related items live close in space. Flagged-turn band ↔ quiz-panel band; flagged-turn quote embedded in the Reveal state.
2. **Coherence.** Cut what isn't load-bearing right now. Collapse `Previously` and `About this episode` after the orientation scene; reveal on demand.
3. **Single mode of attention.** When the quiz is open, dim the reading column slightly (~0.82 opacity, restored on hover/focus) so the right column carries focal weight without hard-gating re-read.
4. **Pre-training.** Orientation card introduces framing before the reading task. v3 candidate: add an explicit "question to hold" line so orientation plants a reading lens, not just a summary.
5. **Persistent identity anchor.** Character chip row in the header stays visible across the episode so "who is this?" never enters working memory.
6. **Signaling without alarms.** Flagged turn is subtle but unmistakable (left band + inline chip). No motion, no saturated color — preserves the calm-engagement invariant from `CLAUDE.md`.
7. **Line length governs column width.** Reading column capped around 70ch regardless of viewport; "maximizing horizontal space" is a trap for prose. Two-column layout *is* the right use of horizontal space.

---

## Upstream: reading-scaffold authoring surface

The lesson package and transcript currently carry very little for the right column to show during reading mode. v3 proposes these additions. Cheap schema additions first; higher-cost authoring deferred.

### Candidate new fields (draft — pending sign-off)

1. **`episode.question_to_hold`** — in `lesson_package.yaml`.
   - One short question that the student holds across the whole episode, e.g., *"What makes a source fit a question?"*
   - Distinct from `final_takeaway` (which is an answer / lesson conclusion and is spoilery during reading).
   - Surfaces in orientation and in the scaffold rail header on every scene.
   - Soft cap ≤ 14 words. Plain-language; no flaw vocabulary.

2. **`transcript.characters[]`** — upgrade from bare string IDs to objects.
   - Shape: `{ character_id, name, one_liner }` where `one_liner` is ≤ 14 words naming the role/voice without plot content, e.g., *"Cam — the group's default researcher; reaches for his phone first."*
   - Used in the `.character-chip` row (name), and as a popover/expander on tap (one-liner).
   - Back-compat: validator accepts bare strings as a migration grace period; emits a warning.

3. **`scene.setting`** — in each transcript scene.
   - One short place/time anchor, e.g., *"Overton Park, Saturday afternoon."* ≤ 10 words.
   - Renders as a header line above `scene.summary` in the scaffold rail.

4. **`scene.watch_for`** — in each transcript scene.
   - One sentence that plants the reading-focus without spoiling the quiz, e.g., *"Watch what Cam does with his phone."*
   - ≤ 20 words; cannot name a flaw or quote the flagged turn.
   - Renders below `scene.summary` in the scaffold rail.

5. **Deferred to later pass: `scene.vocabulary[]`** — per-scene list of above-grade terms paired with plain paraphrases, surfaced as a "Words in this scene" tab. Defer; higher authoring cost; §8 register guidelines already require in-dialog paraphrase.

### Validator work (draft)

- `validate_transcript.py` accepts new `characters[]` object shape (with string-fallback warning), `scene.setting` (required once released; optional during migration), `scene.watch_for` (required once released).
- `validate_lesson_package.py` requires `episode.question_to_hold`; adds FK readability + word-cap on the new field (grade-6 hard error, ≤ 14 words).
- `episode-plan.yaml` gains an upstream `question_to_hold` field the episode planner emits so downstream agents (screenwriter, lesson package builder) can carry it canonically.

### Agent surface (draft)

- `story_designer` emits story-level framing including the *question to hold* template used by every episode in the story.
- `episode_planner` emits `question_to_hold`, per-scene `setting` + `watch_for`, and the upgraded `characters[]` shape, all in plot-level language (no flaw vocabulary).
- `screenwriter` inherits `setting` and `watch_for` in its in-context projection to ground scene writing; does not author scaffold copy directly.
- `lesson_package_builder` emits `episode.question_to_hold` canonically.

---

## Upstream: remove `kind: action` turns from the pipeline

`todo-v2.md` §5 and §8 introduced `kind: action` turns as *"short stage/texture lines (e.g. `[James steps aside, comes back two minutes later.]`)"*. In practice, `the-white-squirrel` ep1 action turns run 25–45 words as narration paragraphs (e.g., `t01`: *"Saturday sun flickered through the oak leaves at Overton Park, striping the dirt path in warm gold. Somewhere a kid was yelling about a kickball."*), and operator review on 2026-04-18 concluded that regardless of length, interleaved stage/narration beats are **more distractive than useful** in the reader: they compete with dialog for attention, break the chat-style rhythm the student is tracking, and add passive reading load without adding reasoning scaffold.

**Decision: remove `kind: action` turns from the pipeline entirely.** Scene-setting and sensory grounding belong in scaffold fields (`scene.setting` in the reading rail), not in the dialog stream.

### Runtime (already landed 2026-04-18)

- Scene reader filters out `turn.kind === "action"` before rendering. Action turns never display. The previous italic-narration treatment is removed.
- `.scene-turn--action` / `.scene-turn__narration` CSS deleted.

### Upstream work (pending v3 sign-off)

- **Screenwriter agent:** remove the "one beat per 3–5 turns" guideline and all references to action-beat authoring. The screenwriter stops emitting action turns. See new mandate below.
- **Flaw injector agent:** remove any action-preserve guidance. Injector never touches actions because they no longer exist.
- **`validate_transcript.py`:** make `kind: action` turns a **hard error**. Any action turn in a freshly authored transcript fails the gate.
- **`validate_lesson_package.py`:** existing "level cannot target an action turn" rule becomes trivially satisfied; keep as defense-in-depth with a clearer error message.
- **`episode-plan.yaml`:** drop any narrative-texture language that implied action beats were a required authoring output.
- **Re-author `the-white-squirrel` episode_01 transcript** to remove the existing action turns, absorbing any load-bearing atmosphere into `scene.setting` (once that field lands) or re-casting it as dialog. Until re-author, the runtime filter keeps the reader clean — no operator action required on disk.

### New screenwriter mandate: the transcript must stand on its own

With action turns gone, the dialog stream is the only thing the student reads. The screenwriter (and, downstream, the flaw injector) must produce a transcript that is **coherent and cohesive on its own**, with nothing load-bearing left to stage directions.

**Mental model: a written message thread.** Think of the transcript as a text-message conversation or an online forum thread — the kind of chat a student would read on their phone. Everything the student needs to follow the story comes through the utterances themselves. There is no narrator, no off-stage voice, no stage camera. If the reader is confused about where the characters are, who is in the scene, what just happened, or why the mood shifted, **that information has to be said aloud by somebody**.

Concretely:

- **No reliance on actions for meaning.** The screenwriter cannot leave a load-bearing fact in a stage direction. If "Leela pulled out her phone" matters to the reasoning, someone in the dialog has to notice it: *"Wait — Leela, are you googling this right now?"*
- **Speakers plant their own setting.** Place, time, weather, props — if they matter, a character mentions them in voice. *"It's getting dark and I still want food."* beats a narrator note about the sun setting.
- **Scene transitions are dialog transitions.** A scene change is signaled by what the next character says: a new topic, a new question, a remark about a new location. The scaffold rail shows `scene.setting` once on scene entry; the transcript does not re-narrate it.
- **Physical action is reported, not narrated.** If James throws a pinecone and misses, another character sees it in voice: *"Dude, you missed by a mile."* If Cam turns his phone screen around, somebody remarks: *"Okay show me."*
- **Silence and pauses are voiced.** If a character goes quiet on purpose, someone else marks it: *"Leela, you've been staring at that branch for ten minutes."* No stage direction about Leela staring.
- **Emotional register lives in word choice.** Whisper, laugh, scoff, flat affect — all of it comes through diction, fragment length, repetition, interruption, and word choice. The screenwriter's craft carries it.

This is closer to a play in the tradition of *My Dinner with Andre* than to screen direction: if you removed every stage direction from this medium, would the transcript still hold together? In v3, the answer has to be yes, because there are no stage directions.

**Register guideline carryover.** All of §8's register rules from `todo-v2.md` still apply (6th-grade anchor, paraphrase borderline words in-turn, no unflagged technical vocabulary, friction every few turns, one-clause scaffolding). They now do more work because they are the only lever left.

### Narrative-texture intent — where it goes instead

The v2 §8 narrative-texture guidelines (sensory anchors, transitions, pivot beats, character bodies/props) had a legitimate craft intent. v3 redirects that intent into:

- **Dialog-carried texture.** Characters describe what they see/hear/touch in their own voices rather than the transcript narrating it. *"Why's it so quiet all of a sudden?"* beats a stage direction about silence.
- **Scaffold fields.** `scene.setting` carries place/time grounding once. The right column surfaces it on scene entry; no need to repeat it in the turn stream.
- **Scene boundaries.** A new scene already signals a transition; we don't need an in-turn beat to cushion it.

---

## Runtime: follow-on UI refinements

Lower priority than the upstream work, but scoped and cheap once the fields land:

1. **Scroll flagged turn into center view** when `?open=<level_id>` loads the quiz. Reinforces the spatial-contiguity tether.
2. **Back-to-reading preserves scroll position** in the left column (not a browser-default scroll reset).
3. **Keyboard shortcuts** — Tab opens the flagged-turn chip when the chip has focus; Esc from the quiz panel returns to reading mode.
4. **"Watch for" banner** — once `scene.watch_for` lands, render a small banner at the top of the left column on scene entry (dismissible; remembered per scene).
5. **Character chip popover** — once `characters[]` carries `one_liner`, tapping a chip reveals the one-liner. No modal; use a lightweight popover.
6. **Words-in-this-scene tab** — once `scene.vocabulary[]` lands, surface it as a collapsible block in the scaffold rail. Deferred with the field.

---

## Open questions

Items still in active discussion; do not implement until locked.

1. **Scroll-triggered auto-open vs. click-to-open on the flagged turn.** v2→v3 transition shipped click-to-open. A scroll-triggered open (question appears when the flagged turn enters the viewport) is more pedagogically aligned but more code. Revisit after a round of student usability data.
2. **Should "Next scene" be gated on quiz lock?** Today: not gated — students can skip a quiz and Next. Matches v2's "finished is not frozen" invariant. Pedagogically arguable either way; keep ungated unless data shows skipping is common.
3. **Reveal reopen-on-click from the left column.** After a quiz locks, the flagged turn in the left column shows *Review question →* which re-opens the Reveal. Alternative: clicking anywhere on the flagged turn (not just the chip) re-opens. Low priority.
4. **Dim opacity on reading column during quiz.** Current: 0.82 with restore-on-hover. Alternative: no dim, rely entirely on the right-column color band for signaling. Usability test.

---

## Explicitly out of scope

- Multi-episode story-level mechanics (recap screens that span multiple episodes, cross-episode progress badges). v3 is single-episode scoped.
- Teacher / dashboard surfaces.
- Any LLM-at-runtime feature. Determinism from artifacts + Prisma is invariant per `CLAUDE.md`.
- Practice-mode UI changes. Practice is shipped-and-good in v2.
- Migration of pre-v2 artifacts. Regenerate, don't migrate — same policy as v1→v2.
