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
6. [Runtime: continuous-scroll scene reader](#runtime-continuous-scroll-scene-reader)
7. [Runtime: follow-on UI refinements](#runtime-follow-on-ui-refinements)
8. [Open questions](#open-questions)
9. [Explicitly out of scope](#explicitly-out-of-scope)

---

## Motivation

v2 delivered the full two-mode architecture (practice + read-a-story), star scoring, the three-level quiz contract, the screenwriter/flaw-injector split, and the grade-6 scaffolding readability gate. A 2026-04-18 review of the reader surface surfaced two follow-ons:

1. **Right-column scaffold is the correct home for the quiz, not the inline-below-turn position v2 specified.** Fixed-viewport laptop/tablet layout with a dialog column on the left and a scaffold rail on the right gives the student one persistent thinking space. This pass landed in code as part of the v2→v3 transition (see next section).
2. **The lesson package has very little reading scaffold.** Today only `episode.summary`, optional `episode.previously`, and per-scene `scene.summary` exist. Everything else in the package is quiz machinery. v3's upstream work adds structured reading scaffolds that the right column can surface during reading mode.

In parallel, the in-episode action beats currently drift long (25–45 word narration paragraphs rather than the stage-line beats v2 §8 imagined). That is an authoring-bar problem in the screenwriter agent, not a schema problem, but it lands here for v3 follow-up.

---

## What already landed in the v2→v3 transition (2026-04-18 UI pass)

Committed in the codebase ahead of locking this doc:

- **Two-column fixed-viewport scene reader.** `simplified-framework/app/src/app/runs/[runId]/scene/[n]/page.tsx` renders `.scene-shell` with a capped reading column on the left (~42rem / ≈68ch, the prose-optimal line length) and a scaffold rail on the right.
- **Quiz renders in the right rail**, not inline.
- **Bordered turn boxes** with the speaker label overflowing the top border (fieldset/legend pattern). Tight vertical footprint.
- **Flagged turn is visually identical to other turns** — the only signal is a small circular `?` icon in the top-right corner, with three variants (unanswered / open / locked). The earlier accent-band + text-chip treatment (AM) was flagged as "too distinguishing to the point of distractive" and replaced (PM).
- **Action turns filtered out of the reader** (2026-04-18 PM). See §[Upstream: remove `kind: action` turns from the pipeline](#upstream-remove-kind-action-turns-from-the-pipeline) for the pipeline follow-up.
- **Quoted-turn line in Quiz Reveal** for spatial contiguity.
- **Persistent character chip row** in the scene-shell header.
- **Dead styles removed** from `globals.css` (~500 lines of lesson-workspace / work-drawer / session-bar / warmup / reveal-stages / reading-workspace / etc.).

Subsequently superseded by the continuous-scroll pass (same day PM, see §[Runtime: continuous-scroll scene reader](#runtime-continuous-scroll-scene-reader)):

- **Per-scene paging** — replaced with a single scrolling transcript. `Prev` / `Next` bottom-nav buttons removed.
- **`ScaffoldPanel.tsx` + `CollapsibleBlock.tsx`** — deleted; the simpler right-rail content is inlined into the new `ContinuousSceneReader` client component.
- **Collapsible About / Previously blocks in the rail** — removed. `Previously` moves to `/stories` cards; `About this episode` moves to a header affordance. Scene 0 orientation splash drops `Previously`.
- **"Open question" / "Review question" / "Question is open" text chips on the flagged turn** — replaced by the single `?` icon with three state variants.

---

## Instructional-design principles driving v3

Cognitive-load theory (Sweller) + Mayer multimedia principles, applied to the reader:

1. **Spatial contiguity.** Related items live close in space. Flagged-turn band ↔ quiz-panel band; flagged-turn quote embedded in the Reveal state.
2. **Coherence.** Cut what isn't load-bearing right now. `Previously` and `About this episode` are removed from the reader entirely (decision-time context goes to `/stories` and a header affordance respectively); the reader itself only carries what's needed for *this* scene.
3. **Single mode of attention.** When the quiz is open, sibling (non-flagged) turns dim to 0.6 so the flagged turn stays the bright anchor. The right rail's scene header stays fully visible — "things disappearing" is a distraction cost to avoid.
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

## Runtime: continuous-scroll scene reader

Supersedes the per-scene paging landed in the 2026-04-18 AM UI pass. Student reviewed it same day PM and asked for continuous scroll; this section captures the locked-in design before code.

### Why continuous scroll

- **Matches the written-message-thread mental model** that the pipeline is now authoring against (see §[Upstream: remove `kind: action` turns](#upstream-remove-kind-action-turns-from-the-pipeline) → *New screenwriter mandate*). Scrolling is the native grammar for chat-like dialog; "Next scene →" is a foreign gesture for it.
- **Re-read context is one gesture.** When a student hits a flagged turn mid-episode and needs to recall an earlier scene, scrolling up is cheaper and lower-disruption than navigating pages.
- **The pacing tradeoff is self-mitigated by the pipeline direction.** Paging's one pedagogical win is the "Next" click as a forced pause. The screenwriter mandate already builds transition pacing *into the dialog itself* ("scene transitions are dialog transitions"), so we don't need a button to enforce pace.
- **Finished-run browsing is natural.** Re-reading a completed episode is scrolling; no terminal state to re-exit.

### Left column (reading surface)

- **Single transcript stack.** All scenes rendered in one vertical column. No "Next" click, no per-scene page, no page transitions.
- **No visible scene dividers.** No sticky header, no horizontal rule, no "Scene 2" banner inside the dialog stream. The transcript reads as one uninterrupted message thread. Scene boundaries live in the DOM (as invisible anchors the observer watches) and in dialog content (per the screenwriter mandate).
- **Turn shape unchanged.** Bordered turn boxes with overflow-speaker-chip from the 2026-04-18 AM pass stay. Flagged-turn `?` icon stays.

### Right rail (always-visible scaffold)

- **Top line:** `Scene X of Y` where `X` is scroll-tracked via `IntersectionObserver`.
- **Second line:** the current scene's `scene.summary`.
- **Both stay visible at all times — including when the quiz is open.** Nothing in the rail disappears on quiz open; the quiz panel stacks *below* the scene header. Rationale: "things disappearing" is a distraction cost the student explicitly flagged.
- **Quiz freezes the scene label.** While a quiz is open, the `Scene X of Y` label and summary freeze on the scene that owns the flagged turn — not the student's current scroll position. This keeps the label matched to "the scene this quiz is about," which is more useful than "the scene you happen to be scrolled to." When the quiz closes, the observer resumes and the label re-syncs to scroll position.
- **No About-this-episode in the rail.** Moved (see below).
- **No Previously in the rail.** Moved (see below).

### IntersectionObserver config (draft)

- Each scene's container gets `data-scene-index={n}` and a top scroll-margin for trigger stability.
- Observer `rootMargin`: `"-35% 0px -35% 0px"` — "current scene" = whichever scene occupies the middle 30% of the scroll viewport. Narrower band = more responsive; wider = more stable. Tune after first usability pass.
- On intersection change, client state updates and an async server action (`recordSceneViewAction`) persists `run.currentSceneIndex` / `sceneHighWaterMark` / `readingFinishedAt` for resume. Fire-and-forget (no redirect).

### Initial scroll on mount

- URL `/runs/[runId]/scene/[n]` where `n>=1` is the continuous reader; `n` is the *initial scroll target*, not a page index.
- Client component calls `scrollIntoView` on the scene-n anchor on mount so a resuming student lands where they left off.
- `n=0` stays as the orientation splash (single-column foyer), unchanged except `Previously` is removed (see below).

### Bottom nav

- Drops `Prev` and `Next` buttons — scrolling replaces them.
- Keeps `StarRow` (live-updating as quizzes lock) and `Recap` (appears when `readingFinishedAt` is set).

### Episode-level context relocation

- **`episode.previously` moves to `/stories`.** It's decision-time context (a student hovering over episode 2 wants to know what episode 1 wrapped up with), not reading-time scaffold. Each episode card on `/stories` gets a muted `Previously` line under the title when the field is present; absent on episode 1 of any story (nothing to recap). Drops from the scene reader entirely.
- **`episode.summary` moves to the header.** A small ⓘ button (or "About" affordance) next to the episode title in the scene-shell header opens a lightweight popover / native `<details>` with the summary for mid-read reference. Out of the right rail.
- **Scene 0 orientation splash** keeps only `episode.summary` + "Start reading" — `Previously` is now on the picker, so the splash doesn't re-show it.

### Stories-page implications

- Each `/stories` episode card renders:
  - Story heading (grouped, as today).
  - Episode title + episode ID (as today).
  - **New:** `previously` line if present (≤ ~2 visible lines, muted).
  - State label (Resume / Open / Open recap, as today).
  - Star row (as today).
- Data source: read `lesson_package.yaml` inline at render time (cheap, `/stories` is infrequent). A later optimization can push `previously` into the `CatalogEpisode` Prisma table via the catalog sync step, but not now — keep the schema surface small during the v3 shakeout.

### Accessibility notes

- Focus management: when a quiz opens via the `?` icon, focus moves into the quiz panel; `Esc` / "Back to reading" restores focus to the originating `?` icon in the left column.
- Observer mechanism falls back gracefully: if `IntersectionObserver` is unavailable (extremely rare in 2026), the rail shows the last-known scene or scene 1 — the reader still works, just without scroll-tracked label updates.

---

## Runtime: follow-on UI refinements

Lower priority than the upstream work, but scoped and cheap once the fields land:

1. **Scroll flagged turn into center view** when the `?` icon opens the quiz. Reinforces the spatial-contiguity tether now that the rail carries the quiz but the left column is continuous-scroll.
2. **Keyboard shortcuts** — `Esc` from the quiz panel closes back to reading; `?` key focuses the next flagged-turn icon below the current scroll position.
3. **"Watch for" banner** — once `scene.watch_for` lands, render a small banner at the top of the left column on scene entry (dismissible; remembered per scene).
4. **Character chip popover** — once `characters[]` carries `one_liner`, tapping a chip reveals the one-liner. No modal; use a lightweight popover.
5. **Words-in-this-scene tab** — once `scene.vocabulary[]` lands, surface it as a collapsible block in the scaffold rail. Deferred with the field.
6. **Catalog optimization** — push `episode.previously` into the `CatalogEpisode` Prisma table via the sync step so `/stories` doesn't re-parse lesson packages at render.

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
