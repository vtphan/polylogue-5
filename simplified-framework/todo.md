# TODO — Lower Cognitive Load and Scaffold the Reading Phase

> **This document describes planned revisions, not current state.** For the system as it stands today, consult:
>
> - `simplified-framework/docs/instructional-design.md` — conceptual framework, student journey, authoring surface
> - `simplified-framework/docs/tech-reference.md` — stack, data model, runtime contracts, change recipes
> - `simplified-framework/docs/operator-workflow.md` — human-in-the-loop authoring cadence
> - `simplified-framework/reference/flaw-taxonomy.yaml` — canonical flaws + amplification bands
>
> When a planned change here conflicts with what the docs describe, treat this file as the forward direction and the docs as the current state. Source-of-truth precedence for authoritative rules (validators, Zod schemas, artifact files, Prisma schema, the taxonomy, then docs) is defined in `CLAUDE.md`.

## Goal

Lower cognitive load for 6th-grade students so a full episode reliably fits inside a 20-minute session. Three levers:

1. **Scaffold the reading phase** — add an episode summary and scenes with summaries so students orient to the episode and to each scene before facing dialog.
2. **Shorten scaffolding text** — cap word counts on warm-up `worked_explanation`, `best_answer_text`, `takeaway`, and the new orientation fields, so passive reading load doesn't dominate reasoning load.
3. **Reduce the number of levels per episode** — fix at 3 instead of 3–5 so a run fits the session budget without rushing.

Dialog is treated separately: no word cap (which would flatten voice and block deliberate reasoning chains), but a **linguistic guide** + readability checks keep vocabulary and register inside 6th-grade range.

Changes span both the authoring pipeline (schemas + validators + agent specs) and the downstream app (runtime rendering + state).

The reading phase is scoped to **comprehension only** — help students understand what the episode is about before they reason about it. Reasoning scaffolds belong downstream (modeled warm-up, guided warm-up, levels) and are out of scope for this batch.

This revision also collapses the story catalog from the current 8-episode `strangers-in-the-old-forest` into a new 3-episode story, `the-white-squirrel`, and tightens the gate agents so they check only what the app actually requires (no content quotas beyond the runtime minimum).

## Scope decisions (baseline)

- **Level count:** cap at **3 levels per episode** (was 3–5). One `unmistakable` → two `showcased`/`heightened`.
- **Warm-ups:** unchanged — 1 modeled + 1 guided.
- **Reading phase:** two comprehension scaffolds only —
  - An **episode summary** shown before any dialog, plus (for ep 2+) a short "previously" recap.
  - **Scenes**: the transcript is split into 2–4 scenes. Left panel shows the current scene's dialog; right drawer shows `Scene N of M` + a simple-language scene summary. Students can navigate to previous and next scenes.
- **Terminology:** the hierarchy is **Episode → Scenes → Turns**. No "beats", no "bridges", no "labels" — one vocabulary across docs, schemas, agents, and code.

---

## New story scope — "The White Squirrel" (3 episodes)

Collapse the current 8-episode `strangers-in-the-old-forest` (source: `simplified-framework/stories/strangers-in-the-old-forest/story.yaml`) into a new 3-episode story titled **"The White Squirrel"**, `story_id: the-white-squirrel`. Authoring will happen interactively with Claude Code against the outline below.

### Cast (3 characters)

Two boys and one girl, friends in sixth grade. Each character has one primary reasoning flaw that makes them the natural lead for one of the three episodes.

- **Cam** (M) — ep 1 lead. Phone-native. Treats TikToks, comment threads, popular posts, and credentialed-adjacent adults as equivalent kinds of authority — something is trustworthy because it sounds trustworthy.
- **James** (M) — ep 2 lead. The chainer. Moves from one observation to a much bigger conclusion in one breath. His signature dialog shape: opener *"okay but check this out"*, stacked links *"and then"* / *"so"*, closer *"it has to be"*. Older brother Marcus studies astrobiology at Rhodes; this is how the group first hears of Anya.
- **Leela** (F) — ep 3 lead. Sharp gut for other people's reasoning ("that doesn't sound right") but narrow sampling of her own experience. Lives near one edge of Overton Park; only ever walks one loop. The flaw and the virtue share a root — she trusts her own observation, which is both why she pushes back on James and why she misses what she hasn't seen. (Authoring wink: "Leela" echoes the letters of "allele" — surfaced only once, at the end of ep 3, as an unexplained-word easter egg; see engagement threads.)

### Three-hypothesis structure

Each episode's primary flaw pushes the group toward a different wrong hypothesis. The flaw-overcoming work in ep 3 is what reveals the correct one. The reasoning flaws are the engine of the wrong conclusions, not a separate layer.

| Episode | Hypothesis the group pursues | Primary flaw | Disproving evidence (or reveal) | Tone |
|---|---|---|---|---|
| 1. The Sighting | **Alien** — Anya's biosignature framing | `trusting_a_source_too_quickly` | Anya is a **PhD candidate in astrophysics**, not biology. Someone actually looks up what *biosignature* means — it is about detecting microbial life on other planets, not about explaining mammal coloring on Earth. | Mysterious, funny |
| 2. The Water | **Environmental** — a TikTok about toxic water mutating animals elsewhere makes the group conclude Overton's water is toxic | `jumping_to_a_conclusion` | Memphis tap water is famously clean — pumped from the **Memphis Sand Aquifer**, the city drinks it straight from taps. The TikTok was about a different place. | Alarming → deflating |
| 3. The Walk | **Genetic** — a rare mutation in an isolated population | `missing_important_conditions_or_consequences` (overcome) | The missed condition is **isolation**: highways cut this forest patch off decades ago. The north-side walk shows no red-eyed squirrels there — clustering fits isolated-population mutation, not environmental or alien. Ms. Reyes's quiet framing and Anya's honest re-call confirm. | Relieving, quiet |

Note: the alien hypothesis wobbles but does not fully die in ep 1; it lingers into ep 2 and is fully ruled out by the north-side walk in ep 3.

### Episodes

**Episode 1 — The Sighting.**
- Primary flaw: `trusting_a_source_too_quickly` (Cam leads).
- Hypothesis pursued: alien / biosignature.
- Supporting flaw (≤ 2 moments): `jumping_to_a_conclusion` (James has one or two chain-moments in the sighting that set up his voice for ep 2).
- Plot: at Overton Park on a Saturday afternoon, the three see a white squirrel with red eyes. James mentions his brother Marcus knows a grad student — Anya — who works on "color morphs as candidate biosignatures." Cam Googles Anya, finds her University of Memphis page ("PhD candidate, physics; side research on color morphs as candidate biosignatures"), and amplifies her as *the* expert. James calls Anya that afternoon; retells the conversation with inflation. The group accepts the alien-biosignature framing because Anya has a PhD and the word sounds legitimate. Disproof: someone (Cam or Leela) actually looks up what "biosignature" means and discovers it is about detecting microbial life on exoplanets, not about explaining mammal coloring on Earth; Anya's dissertation is on atmospheric spectra. Doubt introduced; the alien hypothesis wobbles.
- Authoring note: `biosignature` is the episode's load-bearing technical word. It must appear inside Anya-retold-by-James (and in Cam's reading of her page) and must be flagged in-dialog as unfamiliar ("bio-what?" / "some word she used — biosignature?"). Never narrator-explained. The word itself is part of why the alien framing gets accepted — the student should see technical vocabulary doing unearned work.

**Episode 2 — The Water.**
- Primary flaw: `jumping_to_a_conclusion` (James leads).
- Hypothesis pursued: environmental / toxic-water mutation.
- Supporting flaws (≤ 2 moments each): `trusting_a_source_too_quickly` (residual — Cam treats the TikTok as authoritative), `not_enough_evidence` (residual).
- Plot: aliens having been wobbled in ep 1, the group hunts for a new explanation. Cam brings up a TikTok about a polluted river somewhere else where animals have developed mutations. James jumps on it and chains to "our water must be toxic" in his signature shape — e.g., *"okay but check this out — red eyes, and mutations, and the TikTok, so it has to be something in the water."* The group anchors to the environmental hypothesis and gets alarmed. Disproof: someone looks up Memphis tap water and discovers it is famously clean — the Memphis Sand Aquifer supplies drinkable-from-the-tap water and the city is civically proud of it. The TikTok was about a specific polluted river elsewhere. Environmental hypothesis collapses.

**Episode 3 — The Walk.**
- Primary flaw: `missing_important_conditions_or_consequences` (Leela's realization).
- Hypothesis pursued and revealed: genetic — a rare mutation made visible by an isolated population.
- Supporting flaws (≤ 2 moments each): `ignoring_another_perspective` (dismissing Ms. Reyes's early framing), `not_enough_evidence` (residual).
- Plot: with aliens and environmental both ruled out, the group is stuck. Leela catches Ms. Reyes after class; Ms. Reyes casually offers the mutation angle. The group is initially skeptical — *"but how would that explain our park?"* They map their sightings, realize they have only walked the south side, walk the north side, and see no red-eyed squirrels. Leela: *"Wait. This is an island. The highways made it an island."* The Chekhov seed from ep 1 clicks. They call Anya back with plain questions; she admits her dissertation is on atmospheric biosignatures of microbes, not mammal coloring, and agrees that isolated-population mutation fits what they saw. The group assembles the plain-language answer. Ends with the allele easter egg (see engagement threads).

### Engagement threads

Running threads that cross episodes to enhance engagement. Humor is character-driven, not narrator-driven; it teases characters warmly and never makes one the butt.

- **Luminaria.** In ep 1 James dramatically names the squirrel "Luminaria" during the alien-biosignature enthusiasm. The name sticks. In ep 2 online commenters mock it; in ep 3 James dies of embarrassment on stage.
- **The group chat.** Short text interstitials between scenes — quick comic beats without disrupting the main dialog flow.
- **"The island" — the Chekhov seed.** In ep 1, while the kids are trying to square what "biosignature" has to do with squirrels, James half-remembers Ms. Reyes's unit on isolated populations as a throwaway complaint (*"the Galápagos stuff, the tortoises, whatever — she made us watch this documentary"*). The seed sits next to the biosignature framing in their science-class memory. In ep 3 Leela says, standing on the north side, *"Wait. This is an island. The highways made it an island."* The group connects it back to Ms. Reyes on stage.
- **The allele easter egg.** At the very end of ep 3, after the group has assembled the plain-language mutation + isolation answer, Cam mentions that his mom used the word *allele* on the drive over and he has no idea what it means. James notices: *"Wait — spell your name."* Leela: *"L-E-E-L-A."* James: *"A-L-L-E-L-E."* Beat. *"Your parents named you after a gene thing."* Leela denies it; Cam: *"They low-key might've."* Structurally this is a callback to the ep-1 biosignature move — the group encounters another technical word, and this time they do not defer to it; they play with it and put it down. The letter-wink between Leela and *allele* is an author easter egg; nothing in the scene depends on the student catching it.

### Scientific framing constraint

The story touches on **genetic mutations in general** and does not dig into mechanism. Authoring rules:

- No `heterozygous`, `homozygous`, `founder effect`, or `Punnett square` anywhere in student-facing text.
- `biosignature` appears in ep 1 as Anya's (and the kids') mystery word. Must be flagged in-dialog as unfamiliar ("bio-what?" / "some word she used"). Never narrator-explained. It is load-bearing for the episode — the word itself is part of why the alien framing gets accepted.
- `allele` appears exactly once, in the easter-egg scene at the end of ep 3. Treated as a mystery word the kids do not understand and do not need to understand. Never narrator-explained. Not used to explain any mechanism.
- The final plain-language explanation lives in three moves: (a) a rare mutation, (b) a forest patch cut off by highways, (c) in a small cut-off group, a rare thing shows up more often over time.
- Reference paragraph (authoring target — not locked text):
  > Sometimes animals are born with a rare mutation — red eyes and white fur are one of those. It's so rare you'd almost never see one. But a long time ago, highways cut this patch of forest off from the rest of Memphis. A small group of squirrels got stuck here. In a small cut-off group, a rare thing shows up more often over time — so we see them here and not anywhere else.

### Flaw coverage across the 3-episode arc

- Primary introductions: `trusting_a_source_too_quickly` (ep 1), `jumping_to_a_conclusion` (ep 2), `missing_important_conditions_or_consequences` (ep 3).
- Supporting exposure: `not_enough_evidence` and `ignoring_another_perspective` appear as supporting flaws in eps 2–3.
- All five flaws in the taxonomy are touched; three are primary.
- Amplification ramps across the arc: `unmistakable` dominance in ep 1, `heightened` presence by ep 3.

### Artifact moves

- New canonical story lives at `simplified-framework/stories/the-white-squirrel/story.yaml` with new episode directories under `simplified-framework/artifacts/the-white-squirrel/{episode_01,episode_02,episode_03}/`.
- Archive the old 8-episode story + artifacts under `simplified-framework/stories/archive/strangers-in-the-old-forest/` and `simplified-framework/artifacts/archive/strangers-in-the-old-forest/`. The pipeline does not read from archive paths.

---

## Pipeline changes (authoring + validators)

### P1. Cap levels at 3
- Update `simplified-framework/pipeline/scripts/validate_lesson_package.py` to enforce `len(levels) == 3` (or `<= 3` if we want to permit 2 during a transition — call before shipping).
- Update `simplified-framework/docs/instructional-design.md` §4.4 and §5.4 to state "3 levels per episode."
- Update `simplified-framework/schemas/` sketches to match.

### P2. Revamp `transcript.yaml` — introduce `scenes[]` with nested turns
- Replace top-level `turns[]` with top-level `scenes[]`. Each scene contains its own `turns[]`.
- New scene shape:
  ```yaml
  scenes:
    - scene_id: s1
      summary: "Plain-language scene summary, 6th-grade vocabulary, ≤ 30 words."
      turns:
        - turn_id: t01
          speaker: Cam
          text: "..."
  ```
- `turn_id` remains globally unique within the transcript (so `lesson_package.yaml` references are unchanged).
- Validator rules (`validate_transcript.py`):
  - `scenes[]` required, length **2–4**.
  - Each scene must have `scene_id` (unique), `summary` (required, ≤ 30 words), and `turns[]` (≥ 1 turn).
  - Every `turn_id` must be unique across the whole transcript.
  - Reject any top-level `turns[]` or `setting_note` (clean break, not deprecation).

### P3. Add `episode.summary` (required) to `lesson_package.yaml`
- New required field `episode.summary` — plain-language orientation to the whole episode. ≤ 60 words, 6th-grade vocabulary. Shown to students before any scenes render.
- Replaces the old `transcript.setting_note` (which is removed in P2).
- Validator (`validate_lesson_package.py`): required; word cap enforced.

### P4. Add `episode.previously` (required on ep 2+) to `lesson_package.yaml`
- New field `episode.previously`: a short recap carrying the story arc into this episode. ≤ 40 words. Should reference the prior episode's `final_takeaway` where sensible.
- Validator: **required when `package_meta.episode_number > 1`**; forbidden on episode 1.

### P5. Tighten word caps on scaffolding prose
- Applies to **scaffolding prose only** — not to dialog. Dialog is governed by P10 (linguistic guide), not a word cap.
- `warmups.modeled.best_answer_text`: soft cap ~40 words.
- `warmups.modeled.worked_explanation`: soft cap ~60 words.
- `warmups.modeled.takeaway`: soft cap ~20 words.
- Same caps apply to `warmups.guided` equivalents.
- `episode.summary`: soft cap ~60 words (already enforced in P3).
- `episode.previously`: soft cap ~40 words (already enforced in P4).
- `scene.summary`: soft cap ~30 words (already enforced in P2).
- Current ep 1 values run 80–100 words on `worked_explanation`; re-author to fit (see P8).
- Validator emits warnings first; promote to hard errors after P8 lands.

### P6. Deprecate `best_answer_id` on levels
- Runtime already ignores it (grading uses `feedback.correct.option_ids`).
- Make it optional in the schema + validator; omit from new authored content.
- Warm-ups still use `best_answer_id` — leave that alone.

### P7. Remove withdrawn fields / concepts from docs and agent specs
- No `setting_note`, no `noticing_frame`, no `signal_phrases`, no `exemplar_line`, no `beats`, no `bridge_text`, no `label`.
- Update `simplified-framework/pipeline/commands/*.md` and `simplified-framework/pipeline/agents/*.md` to use the scenes/turns vocabulary and the new required fields.
- Update `simplified-framework/docs/instructional-design.md` and `tech-reference.md` accordingly.

### P8. Author ep 1 of `the-white-squirrel` against the new schema
- Author the sighting + Anya-PhD + biosignature-trust plot per the "New story scope" section. Reference material: the squirrel-sighting opening in `stories/strangers-in-the-old-forest/episode_01/` for tone and the Anya-phone-call scene in `stories/strangers-in-the-old-forest/episode_02/` for Anya's voice.
- Split the transcript into 2–4 scenes with `scene_id` + `summary`.
- Add `episode.summary` to the lesson package.
- (`episode.previously` not required on ep 1.)
- Trim warm-up `worked_explanation` text to fit P5 caps.
- Ship 3 levels with the required amplification mix for the primary flaw `trusting_a_source_too_quickly` (1 `unmistakable`, 1 `showcased`, 1 `heightened`).
- Validate end-to-end with the updated validators.

### P9. Author eps 2 and 3 of `the-white-squirrel`
- Ep 2 (The Water) is substantially new plot — Cam's TikTok about toxic water elsewhere, James chaining to "our water must be toxic," the disproof via Memphis Sand Aquifer. Not a direct reuse of any single existing episode.
- Ep 3 (The Walk) condenses content from existing episodes 4–8 (Ms. Reyes, map, north side, second Anya call, reconstruction). Ends with the allele easter egg.
- Each episode must include `episode.previously` referencing the prior episode's `final_takeaway`.
- Same schema + word-cap + level-cap + amplification-mix expectations as P8.
- Archive the old 8-episode artifacts once the new 3 are validated.

### P10. Linguistic guide + readability checks (dialog and scaffolding)
- Applies to all generated text: dialog turns **and** scaffolding prose (`worked_explanation`, `best_answer_text`, `takeaway`, `episode.summary`, `scene.summary`, `previously`, `feedback.correct.text`, `feedback.by_option.*`).
- Ep 1 reads well for 6th grade; risk is later episodes with technical content (genetics, biosignatures in eps 4, 8). This item is a guardrail for authoring, not a rewrite of existing text.
- Three tiers, one concern per tier:

**Tier 1 — prompt-level guidance in agent specs.** Short, shipped in every relevant agent invocation. Referenced by `create_transcript`, `create_lesson_package`, and any other authoring agent that produces student-facing prose.

Shared core (both dialog and scaffolding):
> Write for an average or slightly-struggling 6th grader. When quoting a signal phrase from the dialog (e.g., "that basically proves it", "has to be", "so, so, so"), preserve it verbatim — do not soften or paraphrase. When a term above grade level is needed, either restate it in plain words adjacent to its use, or mark it explicitly as unfamiliar ("some word Anya used — biosignature?"). When a scientific concept needs to be explained in student-facing text, prefer a plain-language description of the mechanism over the technical term.

Dialog-only additions:
> Keep each character's voice distinct. When the teachable move in a turn is a reasoning chain or a signal-phrase escalation, preserve the stacking exactly — do not split it into shorter sentences.

Scaffolding-only additions:
> Narrator voice, not character voice. Direct and explanatory; no dramatic flourishes. Respect the word caps from P5.

**Tier 2 — human reviewer reference.** `simplified-framework/pipeline/reference/language-guide.md` holds the same three blocks above with one worked example per rule drawn from existing episodes. Short, not a rule encyclopedia.

**Tier 3 — validator readability check.** Add a Flesch-Kincaid (or Dale-Chall) grade-level score to `validate_transcript.py` (per scene) and `validate_lesson_package.py` (per scaffolding block). Warn when score > 7. Warnings only, not hard failures — the author decides whether a flagged phrase is worth the restate.

Notes:
- Word caps are applied to scaffolding prose (P5) but **not** to dialog. Length is not the right lever for dialog; register is (handled by this guide).
- The guide complements P5 word caps; it does not replace them.

### P11. Gates verify app-required minimums only — no content quotas
- Principle: pipeline gates (notably `flaw_reviewer`, plus `validate_transcript.py` and `validate_lesson_package.py`) check **only what the downstream app requires**. They do not invent additional content quotas like "exactly 5 flaw moments" or "exactly 7 teachable moments."
- App requirements per episode:
  - 1 modeled warm-up + 1 guided warm-up → **≥ 2 primary-flaw moments** suitable for warm-up use (the modeled one should typically be `unmistakable` so the walk-through is clear).
  - 3 levels with amplification progression → **≥ 1 `unmistakable`, ≥ 1 `showcased`, ≥ 1 `heightened`** primary-flaw moment.
  - **Net minimum: 5 primary-flaw moments** satisfying the amplification mix above.
- Gates **must**:
  - Confirm the net minimum and the amplification mix are present in the transcript.
  - Confirm every flaw moment flagged for warm-ups or levels is beginner-teachable (existing check).
  - Confirm the transcript conforms to the `scenes[]` schema from P2.
- Gates **must not**:
  - Require any specific total count (no "exactly 5", no "exactly 7", no "5–7").
  - Require specific supporting flaws, or any specific amplification on supporting flaws.
  - Enforce narrative structure, scene count beyond P2's 2–4, or turn count beyond hard limits.
- Implementation touchpoints:
  - Update `simplified-framework/pipeline/agents/flaw_reviewer.md` to codify the minimums above.
  - Update `validate_transcript.py` to assert the amplification mix when the transcript carries primary-flaw annotations, or leave this check to `flaw_reviewer` if the transcript schema doesn't carry flaw labels (transcripts are source dialogue per current design).
  - Update `validate_lesson_package.py` to assert exactly 3 levels (P1) and that warm-up counts are correct — do not assert anything about primary-flaw moment counts inside the transcript from the lesson-package validator.
  - Update `simplified-framework/docs/instructional-design.md` §5.4 to replace "roughly 5–7 candidate teachable moments" with the explicit minimum + "additional moments at the author's discretion when they serve the story."

---

## App changes (runtime)

### A1. Render `previously` + `episode.summary` before scenes
- In `src/app/runs/[runId]/read/page.tsx`, render a pre-scenes orientation surface:
  - When `episode.previously` is present (ep 2+), render it first.
  - Then render `episode.summary`.
  - Single Continue button → opens Scene 1.
- This is comprehension scaffolding only. No reasoning content here.

### A2. Scene-based reading UI
- Left panel: current scene's turns only.
- Right drawer: `Scene N of M` + the current scene's `summary`.
- Continue at the bottom of the dialog advances to the next scene (right drawer updates).
- Final scene's Continue fires `finishReadingAction` and advances to the warm-up phase (preserves current behavior).
- Students can navigate to **previous** and **next** scenes. Specific prev/next UX (chip, arrows, drawer jump, etc.) is deferred to implementation time.

### A3. Load transcript as scenes
- Update `loadTranscript` + Zod schema in `src/lib/domain.ts` to consume the new `scenes[]` shape.
- Update `src/lib/transcript.ts` (`selectTurnContext` and any consumers) — turn lookups now cross scenes; keep `turn_id` as the primary key so `lesson_package.yaml` references still resolve.
- Remove any code path that reads `setting_note` or top-level `turns[]`.

### A4. Enforce 3-level cap defensively in routing
- Guard in `routeForRun` / `loadLessonPackage` to fail loudly if a package with more than 3 levels slips through. The validator is the primary check; this is a belt-and-suspenders safeguard.

---

## Sequencing

1. **Phase 1 — pipeline schema revamp.** P1, P2, P3, P4, P5 (warnings), P6, P7, P10, P11. Update schemas, validators, docs, agent specs, the language guide, and the gate minimums. Low risk; no app changes yet.
2. **Phase 2 — author ep 1 of `the-white-squirrel`.** P8. Validates the new schema, language guide, and gate minimums against real content.
3. **Phase 3 — app: orientation + scenes.** A1, A2, A3, A4. Ship the new reading-phase UI against the new ep 1.
4. **Phase 4 — author eps 2 and 3 + archive old story.** P9. Promote P5 word caps from warnings to errors.

## Explicitly out of scope for this batch

- Cross-episode mixed-flaw review / interlude episode.
- Tiered hint system (first hint free, second costs a lifeline).
- Teacher-facing dashboard.
- Replay variation / adaptive re-attempts.
- Medal label voice pass.
- Any pre-read reasoning prime (noticing frame, signal-phrase pills, exemplar line). Deliberately withdrawn — the modeled warm-up already performs that function.
- Turn-flagging / "this feels fast" affordance during reading. Revisit after the comprehension scaffolds land.
- TTS / read-aloud audio.

These are real gaps from the earlier review but should be addressed in a later batch once the reading-phase scaffolding and level-count changes have been validated with students.
