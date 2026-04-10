# Runtime Package Restructure — Design Note

**Status.** Draft — describes **v2 (migration target)**, not yet implemented. Extends `pipeline-revision-plan.md` §2 at the output boundary only. See `pipeline-v1-to-v2-migration.md` for the v1→v2 diff.

**Audience.** Pipeline maintainers, Lens app builders, reviewers.

**Scope.** Restructures the *consumption side* of the universal pipeline. The four authoring agents, their files, the merge script, and Rule 11 (one cognitive job per agent) are unchanged. Only the shape of what gets written to disk after merge changes.

---

## 1. Why

The current `assistive_package.yaml` serves three different consumers with a single artifact:

- **Authoring agents and re-run loops** need analytical ground truth, working notes, and cross-agent scratch.
- **Reviewers** need auditability — a trace they can read end-to-end to check the pipeline's reasoning.
- **The Lens app (and any future non-LLM app)** needs nothing except dictionary lookups keyed by turn, facet, probe tap, and phase transition.

Conflating all three into one file inflates cognitive load for each. Specifically:

1. Two blocks sit in the runtime file that the spec itself admits are not runtime-consumed: `diagnostic.response_space.by_lens` ("internal agent scratch … not consumed by the app at runtime") and `ground_truth.turn_annotations[].discussion_cue_seeds[]` ("raw material for the discussion agent, not student-facing prose").
2. Most of `ground_truth.yaml` is analytical and never read at runtime — the runtime only reads the projections the merge script derived from it (`worked_example` rungs, `lens_switch` rungs, `redirect` rungs, `causal_signals`).
3. A developer integrating a new app must today learn L1/L2/L3 layers, four files, the merge derivation rules, three probe roles, and three creative axes before they know what to read first. The runtime API, after that learning, is three tables.

The restructure separates the three consumers by producing three outputs from the same merge step. Authoring quality, reviewer access, and the agent-per-file contract are unchanged.

## 2. The three-layer split

| Layer | File | Consumer | Shape |
|---|---|---|---|
| **Runtime** | `runtime_package.yaml` | The app (Lens today, others later) | Three lookup tables keyed by `turn` / `(turn, facet)` / `(turn, facet, role)` plus a small episode-asset bag. |
| **Authoring trace** | `authoring_trace.yaml` | Reviewers, re-run loops, the operator | The current `ground_truth`, full `causal_layer`, `response_space.by_lens`, `discussion_cue_seeds[]`, and any other cross-agent scratch. Analytical, not indexed for runtime lookup. |
| **Derivation rules** | `framework/pipeline/derive_runtime_package.py` + `framework/docs/runtime-derivation-rules.md` | The merge script and its reviewers | Pure functions that project the authoring trace into the runtime tables. Versioned as code, not as prose in the pipeline spec. |

All three are produced by the same merge step that today produces `assistive_package.yaml`. No new agent, no new authoring job.

## 3. Runtime package schema

This is the full contract the Lens app reads. Any field not listed here is *not* at runtime and must not be depended on by an app.

```yaml
# runtime_package.yaml — per episode
story_id: saving-the-maker-space
episode_number: 2
schema_version: 1

# ---- Three lookup tables ----

probes:
  facet:
    by_turn:
      t6:
        trigger: inactivity_or_manual
        question: "What are you noticing about this turn?"
        options:
          - text: "..."
            routes_to: {facet: source_credibility, role: present}
          - text: "..."
            routes_to: {facet: scope_affected_parties, role: afforded_missing}
          - text: "..."
            routes_to: {facet: relevance, role: tempting_absent}
          - text: "I'm not sure what I'm noticing"
            routes_to: {blank_page: true}
  explanation:
    by_turn_facet:
      "t6.source_credibility":
        question: "Why do you think Mira believed it so easily?"
        options:
          - text: "..."
            routes_to: {explanatory_variable: cognitive, pattern_ref: uncritical_acceptance}
          - text: "..."
            routes_to: {explanatory_variable: social, dynamic_ref: authority_deference}
          - text: "..."
            routes_to: {explanatory_variable: interaction}
          - text: "..."
            routes_to: {explanatory_variable: tempting_absent}

interventions:
  by_turn:
    t6:
      blank_page:
        opening: "..."
        ladder: [...]
      by_facet:
        source_credibility:
          role: present
          opening: "..."
          ladder:                          # monotonic in reveals
            - {type: question,        text: "...", reveals: 1, cost: 0}
            - {type: question,        text: "...", reveals: 2, cost: 0}
            - {type: hint,            text: "...", reveals: 3, cost: 1}
            - {type: worked_example,  text: "...", reveals: 4, cost: 2}
          has_explanation_depth: true
          explanation:
            by_explanatory_variable:
              cognitive:       {ladder: [...]}
              social:          {ladder: [...]}
              interaction:     {ladder: [...]}
              tempting_absent: {ladder: [...]}
        scope_affected_parties:
          role: afforded_missing
          opening: "..."
          ladder: [...]
          has_explanation_depth: false
        relevance:
          role: tempting_absent
          opening: "..."
          ladder:
            - {type: redirect, text: "...", routes_to: {facet: source_credibility}, reveals: 1, cost: 0}
          has_explanation_depth: false

discussion_cues:
  by_turn:
    t6:
      - id: t6_c1
        text: "..."
        angle: source_credibility     # facet
        lens: evidence
        axis: lens_refraction         # lens_refraction | persona_projection | stance_inversion
        continuation_of: {turn: t6, facet: source_credibility}
        explanatory_ref: null
        persona: null
        independent_of: []
  episode_scope:
    - id: e_c1
      text: "..."
      angle: inferential_validity
      lens: logic
      axis: lens_refraction
      continuation_of: null
      explanatory_ref: null
      persona: null
      independent_of: []

# ---- Episode assets (small, non-indexed) ----

episode_assets:
  opening_prose: "..."                   # from prose.yaml
  entry_prompts:                         # one-sentence starter stems, from prose.yaml
    - lens: logic
      passage: p1
      text: "I noticed that in turn ___, ___ assumes ___."
  talk_moves:                            # discourse stems, from discussion.yaml
    - "I disagree with ___ because…"
    - "Building on ___…"
  consensus_check:                       # group-phase closure probes, from prose.yaml
    - "Did your group decide whether the article was good evidence?"
  struggle_calibration:
    by_passage:
      p1:
        pace: standard
        minimum_wrestling: [selected_a_facet, viewed_turn_for_15s]
        productive_duration: moderate
  prior_exposure:                        # merge-derived from story sequence
    by_facet:
      source_credibility: {first_seen: episode_01}
```

**What an app must understand to consume this file:**

1. Three lookup tables indexed by `turn`, `(turn, facet)`, and `(turn, facet, role)`. Everything in `probes` and `interventions` is a dictionary lookup triggered by a student tap or an inactivity event.
2. One matching algorithm for `discussion_cues` at the individual→group transition (the `continuation_of` staircase from pipeline-revision-plan.md §2.5).
3. A small bag of episode-scoped assets shown at navigation events.

No L1/L2/L3. No file count. No merge derivation knowledge. The integration doc fits on one page.

### 3.1 Strength cells: closing the weakness/strength asymmetry

The conceptual framework commits to recognizing both strong thinking and weak thinking. Part 4 of `story-pipeline-revision.md` enforces evidence grounding for both weakness and strength targets; `validate_story.py` requires strength rotation across the arc; `transcript_reviewer` criterion 5d checks that strength signals landed; ground truth captures strengths via `facets_present[].role == strength`.

**At the runtime layer, this parity does not hold.** The three probe roles in §3's schema (`present`, `afforded_missing`, `tempting_absent`) are all implicitly weakness-oriented. Intervention ladders use fix-oriented rung types (`nudge`, `hint`, `redirect`, `worked_example` — the last lifted verbatim from `counterfactuals[]`, the "what would fix this" block). The explanation sub-ladder routes into cognitive/social *failures* but not cognitive/social *successes*. A student tapping "noticing what went well" has nowhere to land, and `ground_truth.facets_present` entries with `role == strength` are captured in the authoring trace but have no projection into the runtime tables.

This asymmetry must be closed in v2. The fix does not add any new metadata — it uses data the pipeline already produces at the authoring and ground-truth layers.

**Schema additions (folded into §3 at schema draft time):**

1. **Fourth probe role.** `probes.facet.by_turn[T].options` may include options routing to `{facet: F, role: strength_present}`. Positively framed: *"Dev actually pushed back on where the source came from."*

2. **Strength cells in `interventions.by_turn[T].by_facet[F]`.** When `role: strength_present`, the cell carries a different ladder shape:
   ```yaml
   interventions:
     by_turn:
       t8:
         by_facet:
           source_credibility:
             role: strength_present
             opening: "You're noticing that Dev did something important."
             ladder:
               - {type: observation, text: "What exactly did Dev ask?", reveals: 1, cost: 0}
               - {type: naming,      text: "What would you call that move — why does it count as checking?", reveals: 2, cost: 0}
               - {type: transfer,    text: "Where else in this discussion would that same move have helped?", reveals: 3, cost: 1}
             has_explanation_depth: true
             explanation:
               by_explanatory_variable:
                 cognitive_strength: {ladder: [...]}   # e.g., careful_attention, deliberate_pacing
                 social_strength:    {ladder: [...]}   # e.g., willingness_to_disagree, giving_airtime
   ```

3. **Three new rung types:** `observation | naming | transfer`. Orthogonal to the weakness-oriented rungs (`nudge | question | hint | lens_switch | redirect | worked_example`). The ladder shape reflects a different pedagogical move: students learn recognition and generalization, not correction.

4. **Explanation sub-ladder for strengths.** Mirrors the existing weakness-side routing with two strength variables (`cognitive_strength`, `social_strength`). The `interaction` variable remains available for cases where a cognitive strength is amplified by a social strength.

5. **`discussion_cues` gain optional `valence: weakness | strength`.** Lets the app balance the cue mix per student across the group phase and lets authoring-side reviewers check "does this episode's cue set include strength observations."

**Merge-script derivation.** `ground_truth.facets_present[].role == strength` entries mechanically generate strength-cell stubs in the intervention dictionary, the same way `counterfactuals[]` mechanically generate worked-example bottom rungs today. The diagnostic agent fills in the openings, ladder text, and explanation sub-ladders; the wiring is free.

**Why this is not overengineering.** Unlike the growth-arc schema proposal (considered and rejected during the v2 design conversation — see §8), strength cells use data the pipeline already produces. The runtime package is simply the only layer that currently ignores it. Closing the gap is completing the runtime projection of ground truth, not adding a new feature.

**Relevance to growth-arc stories.** A story where characters gradually strengthen their reasoning specifically needs the runtime package to scaffold "noticing what strong thinking looks like." Without strength cells, the pedagogical payoff of a growth arc never reaches the student-facing layer, because the runtime can only route taps into weakness cells. With strength cells, the arc is observable by students via the same `continuation_of` and `echoes` mechanisms that already exist — without any declared arc metadata.

## 4. Authoring trace schema

`authoring_trace.yaml` is the current `assistive_package.yaml` minus everything in §3, plus a few blocks that today live in the runtime file but shouldn't.

Contents:

- All of `ground_truth.yaml` as authored (`facets_present`, `facets_absent_but_tempting`, `lens_visibility`, `turn_annotations`, `causal_layer`, `perspective_transitions`, `counterfactuals`, `connects_to`).
- `diagnostic.response_space.by_lens` — moved out of the runtime file.
- `turn_annotations[].discussion_cue_seeds[]` — stays in ground_truth but not in the runtime file.
- `calibration_warnings[]` — reviewer-visible, merge-script-lifted from the story design doc.
- Agent metadata: agent versions, prompt hashes, timestamps, reviewer verdicts per agent.
- Cross-references back into the runtime file (cue IDs, intervention cell keys) so a reviewer can jump from an analytical claim to the runtime content it produced.

Reviewers read this file end-to-end to audit the pipeline's reasoning. The app never reads it.

## 5. Derivation rules promoted to code

The merge script derivations currently specified in prose in pipeline-revision-plan.md §2.6 become:

- `framework/pipeline/derive_runtime_package.py` — a pure-Python module with one function per derivation. Functions are small, testable, and take the authoring trace as input. The existing merge script calls this module.
- `framework/docs/runtime-derivation-rules.md` — short (one page) spec mirroring the function set. This is the reviewer's contract: "for every runtime block, which function produced it and from which authoring-trace block."

Derivations to extract (from pipeline-revision-plan.md §2.6, item 3):

1. `counterfactuals[F]` → `worked_example` bottom rung on `interventions.by_turn[T].by_facet[F]` where T matches the counterfactual's evidence turn.
2. `perspective_transitions[]` → `lens_switch` rungs.
3. `facets_absent_but_tempting[F].why_wrong` → `redirect` rungs on tempting-absent cells.
4. `causal_layer` → `turn_annotations[].causal_signals` (inverted index; in authoring trace only) and sub-ladder grounding for `interventions.explanation.*`.
5. `prior_exposure` → episode asset, computed from the story sequence.
6. `minimum cue count per turn` → distribution-contract check on `discussion_cues`, not a derivation but a validator run during merge.

Each becomes a named function. Each function has a doctest or unit test with a toy input.

## 6. Validation changes

`scripts/validate_schema.py` gains one rule and loses none:

- **New rule:** `runtime_package.yaml` contains no field whose key appears only in `authoring_trace.yaml`'s exclusive block set (literal scan — cheap, catches accidental bleed-through).
- **Unchanged:** all existing literal-scan rules on the authoring trace (reserved framework IDs in barrier-safe fields, etc.) still apply; they move with the fields they govern.

The projection barrier rule from pipeline-revision-plan.md §5.5 continues to apply to `episode_writer_input.yaml`. It is not affected by this restructure.

## 7. Migration plan

Ordered. Each step leaves the pipeline runnable. The key sequencing principle: **archive v1 content first** so every subsequent step operates on a clean tree, and **sketch the v2 pilot before freezing the schema** so authoring-time holes are caught on paper rather than in code.

1. **Archive v1 content.** Move frozen v1 material out of the live tree:
   - `framework/stories/saving-the-maker-space.md` → `framework/stories/archive/v1/saving-the-maker-space.md`
   - `framework/stories/saving-the-maker-space/` → `framework/stories/archive/v1/saving-the-maker-space/`
   - `framework/stories/the-overton-park-sightings.md` → `framework/stories/archive/v1/the-overton-park-sightings.md`
   - `framework/stories/the-overton-park-sightings/` → `framework/stories/archive/v1/the-overton-park-sightings/`
   - `artifacts/saving-the-maker-space/` → `artifacts/archive/v1/saving-the-maker-space/`
   - (No `artifacts/the-overton-park-sightings/` exists yet — overton was never run through Phase 7.)

   Add `README.md` at the root of each archive directory (`framework/stories/archive/v1/README.md` and `artifacts/archive/v1/README.md`) explaining: content is historical v1-pipeline reference only; v2 pipeline does not read from these paths; do not run pipeline commands against these files; contributors looking for current stories should see `framework/stories/` excluding the archive; contributors extracting storylines should see `framework/stories/v1-storylines/`.

   Update live-pipeline callers to skip `archive/` paths: `validate_story.py`, `story_consistency_reviewer`, `initialize_lens.py`, `initialize_reasoning_lab.py`, and any other walker of `framework/stories/` or `artifacts/`. A grep for the literal strings `framework/stories/` and `artifacts/` across `framework/pipeline/`, `apps/lens/pipeline/`, `apps/reasoning-lab/pipeline/`, and `scripts/` will surface the call sites. Prefer explicit path exclusion at each call site over a global ignore.

   Update `CLAUDE.md`'s Artifact Storage section with a one-paragraph note about `archive/v1/` and `v1-storylines/` and what each is for.

2. **Extract v1 storylines as creative briefs.** For each v1 story whose premise is worth carrying forward, write a prose file at `framework/stories/v1-storylines/{v1_story_id}.md` containing premise, stakes, cast sketches, episode-by-episode dramatic arc. These are fresh authoring artifacts — not copies of v1 frontmatter, not targets, not signals. Each file opens with a one-line provenance note pointing into the archive. These files are live content, not archived.

3. **One-page sketch of the v2 pilot story.** Premise, cast (4–6 names with one-line tendencies each), episode count, one sentence per episode describing what happens dramatically. No frontmatter, no targets, no signals. May draw from step 2's storyline extractions or from a fresh Part 11 frame (B or C). This sketch is the probe for step 5.

4. **Draft this design note.** (You are here.)

5. **Draft the runtime schema** (§3 of this doc) without freezing. Walk it against the step 3 sketch: for each episode in the sketch, does the schema support the authoring moves that episode needs? Specifically — would each passage produce a non-trivial `(present, afforded_missing, tempting_absent)` triple; does the sketch give the explanation probe something to latch onto; is there at least one passage where each of the three creative axes makes sense? Any "no" or "I'm not sure" answer is a schema conversation now, not after implementation.

6. **Freeze the runtime schema.** Incorporate revisions from step 5. Bump `schema_version: 1`.

7. **Write `framework/schemas/runtime_package.yaml`** as the descriptive contract.

8. **Write `framework/schemas/authoring_trace.yaml`** as the descriptive contract.

9. **Extract derivations into `framework/pipeline/derive_runtime_package.py`** with unit tests. One function per derivation (§5). Keep the existing merge script calling them.

10. **Teach the merge script to emit both files** instead of one, using the two schemas and the derivation module.

11. **Update `scripts/validate_schema.py`** with the new literal-scan rule (§6) and, optionally, a rule flagging any live pipeline file that references a path under `archive/v1/`.

12. **Write `apps/lens/docs/package-contract.md`** pointing at `runtime_package.yaml` only. One page.

13. **Retire `assistive_package.yaml`** from the merge step. `runtime_package.yaml` + `authoring_trace.yaml` are the new outputs. The name `assistive_package` does not survive into v2.

14. **Author the v2 pilot's episode 1.** New story ID (not `saving-the-maker-space` or `the-overton-park-sightings`). Run end-to-end. Capture everything in `framework/stories/{new_story_id}-friction-log.md`.

15. **Light pipeline revision if the friction log demands it.** Additive changes only — the runtime schema is frozen, but authoring-side refinements (agent prompts, reviewer criteria, derivation edge cases) are fair game.

16. **Author episodes 2+.** Each should go through faster than the last. Friction log continues.

17. **Ship the v2 pilot.** Pipeline and story have mutually validated at this point.

Step 1 is cheap and reversible; doing it first means every later step operates on a clean tree. Step 6 is the first expensive freeze — everything before it is paper-cost. Step 13 is the irreversible cut to the v2 output shape. Step 17 is the real validation.

## 8. What is explicitly out of scope

- **No agent changes.** The four authoring agents and Rule 11 are untouched.
- **No schema changes to `episode.yaml`, `transcript.yaml`, `analysis.yaml`, `facilitation.yaml`, or `episode_writer_input.yaml`.** The restructure is downstream of all of these.
- **No changes to the information barrier projection (pipeline-revision-plan.md §5.5).**
- **No behavioral changes to `validate_story.py` or `story_consistency_reviewer`.** Both gain archive-path exclusion (step 1) but their validation logic is unchanged.
- **No Lens app code changes in this doc.** `apps/lens/docs/package-contract.md` is written in step 12 but the app's consumer implementation is a separate effort.
- **No v1 migration, regeneration, or re-authoring in place.** `saving-the-maker-space` and `the-overton-park-sightings` — their story design docs, their per-episode drafts, and any Phase 7 artifacts — are frozen verbatim into `framework/stories/archive/v1/` and `artifacts/archive/v1/` (step 1). The v2 pipeline does not read from archive paths. V2 stories get new story IDs and may borrow from v1 only via the creative-brief extractions at `framework/stories/v1-storylines/` (step 2).
- **No growth-arc schema or metadata.** Growth arcs, when a story has them, are described as *prose* in the character sections of the story design doc (the existing convention per Part 13.1 of `story-pipeline-revision.md` — each character's section includes "growth arcs as narrative beats"). The evaluator and `story_consistency_reviewer` read that prose and use it to inform cross-episode annotation and consistency checks. Student *discovery* of character change is left to the existing `continuation_of` cross-episode mechanism on `discussion_cues`, `connects_to.echoes` on ground truth, and the evaluator's cross-episode context awareness — all of which already support noticing how a character's reasoning shifts without any structural arc metadata. Declaring growth arcs as schema fields was considered during v2 design and rejected on two grounds: (1) the existing mechanisms are already sufficient, so adding metadata would be overengineering; (2) structurally declaring "now is when the character pivots" risks converting student-driven discovery into system-driven telling, which is pedagogically weaker. The strength-cell addition (§3.1) is what actually closes the gap between "characters can be seen as growing" and "the runtime package can scaffold noticing that growth" — and it requires no new metadata at all.

## 9. Open questions

1. **Should `ground_truth.facets_present` remain accessible to the app at all?** A teacher-facing view ("what did the pipeline say was in this passage?") might want it. If yes, it belongs in a third output — something like `teacher_view.yaml` — not in `runtime_package.yaml`. Defer until a teacher view is actually designed.
2. **Schema version negotiation.** If an app is built against `schema_version: 1` and the pipeline bumps to `2`, what's the compatibility contract? Proposal: additive-only changes within a major version, Lens pins to a major. Revisit when the first breaking change is proposed.
3. **Friction log capture point.** The original open follow-up (a friction log for `saving-the-maker-space`) is now moot — maker-space is being frozen into the archive without further runs. The v2 pilot gets its own friction log at `framework/stories/{new_story_id}-friction-log.md`, started in step 14.
4. **Should the authoring trace be gitignored or committed?** It's large and regenerable, but reviewers want it historical for audit. Proposal: committed for now; revisit if repo size becomes a problem.
5. **Pilot story design is free-form within the hard pipeline constraints — not bound to any Part 11 frame.** The hard constraints are: coverage closure, lens/mixed-valence/strength/weakness rotation (all `validate_story.py`), evidence grounding (`validate_schema.py`), information barrier (`validate_schema.py` + `projection_reviewer`), cast size 4–6, no character is an embodied fallacy, character consistency across episodes (all `story_consistency_reviewer`). Everything else in Part 2 (cast tendencies, growth arc counts, stable-strength per character, lens-disposition modeling) and Part 10 (stakes, arc momentum, surprise, ending shape) is *quality guidance*, not structural enforcement. The v2 pilot's premise, cast, episode count, and dramatic arc are authored free-form with those hard constraints as a checklist verified at the end, not a menu picked from at the start. Part 11's three frames (A/B/C) are brainstorming suggestions, not a taxonomy the pipeline requires.
6. **V1 storyline extraction is skipped.** The v2 pilot is authored fresh, not extracted from v1 content. Step 2 of the migration plan (`framework/stories/v1-storylines/` extractions) is effectively optional — if a premise or character name from a frozen v1 story happens to be useful, it can be borrowed ad hoc, but no structured extraction step is required and the critical path skips it. Rationale: the v1 stories were authored against a different affordance surface; forcing extraction to happen would anchor the v2 pilot on v1 design assumptions, which is what the whole restructure is trying to get away from.
7. **Growth-arc handling.** Growth arcs, when present, are described in *prose* in the story design doc's character sections (existing convention, Part 13.1). No schema, no metadata, no declared pivot episodes. Student discovery of growth is scaffolded by the existing `continuation_of`, `echoes`, and cross-episode evaluator context — plus the new strength cells (§3.1), which give the runtime package a way to scaffold "noticing what strong thinking looks like" without ever naming the arc. See §8 for the full rationale.

## 10. Success criteria

The restructure is done when:

- **V1 content is cleanly archived.** `framework/stories/archive/v1/` and `artifacts/archive/v1/` exist with README files; no live pipeline code reads from either path; a grep for `saving-the-maker-space` and `the-overton-park-sightings` across live pipeline code returns no hits (archive paths and `v1-storylines/` references excepted).
- **`runtime_package.yaml` and `authoring_trace.yaml` are produced by the merge script** with full field coverage for every authoring-agent output, and `scripts/validate_schema.py` passes on both files.
- **`apps/lens/docs/package-contract.md` exists, is one page, and references only `runtime_package.yaml`.** A new developer can read that one page and write a toy app that consumes one episode's runtime package without reading any other pipeline doc.
- **The v2 pilot story exists** at `framework/stories/{new_story_id}.md` with per-episode drafts, runs cleanly through the restructured Phase 7, and produces valid runtime packages for every episode.
- **The v2 pilot exercises every runtime affordance in at least one passage across its arc:** all **four** probe roles (`present`, `afforded_missing`, `tempting_absent`, `strength_present`); `has_explanation_depth: true` on at least one cell per lens; all three creative axes (`lens_refraction`, `persona_projection`, `stance_inversion`); `continuation_of` matching from a non-trivial individual-phase probe record; the empty-history `continuation_of: null` fallback; at least one intervention cell with a full `observation → naming → transfer` strength ladder; and at least one strength-valenced discussion cue. This is the "the pilot earned the schema" check.
- **The friction log** at `framework/stories/{new_story_id}-friction-log.md` captures at least one entry from the restructure itself and one from story authoring.
- **Part 11's suggested-first-stories section is updated** to reflect which frame became the v2 pilot and how that choice validated (or stressed) the runtime schema.
