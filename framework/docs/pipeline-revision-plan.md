# Pipeline Revision Plan: An Assistive Package for Non-AI Applications

**Status.** Draft for review.
**Audience.** Pipeline maintainers, app builders, instructional-design reviewers.
**Scope.** Lens application. Reasoning Lab is deferred (see §7).

> **What this document is.** The working specification: field-level schemas for the assistive package, capability-flag declarations, the end-to-end stage plan, and risks and open questions. This is the document consulted field-by-field during agent prompt authoring, schema authoring, and reviewer checks.
>
> **Where to find the rest.** The architectural argument (pedagogical commitments, the four-agent split, governance rules) lives in `pipeline-architecture.md`. The execution runbook lives in `pipeline-revision-implementation.md`. The diff between this target design and the currently-running pipeline lives in `pipeline-v1-to-v2-migration.md`. Section numbering is preserved between this file and the architecture memo: gaps here (there is no §0, §1, §3, §6) correspond to sections in the memo. Appendix B below provides a one-page operational reference to the twelve governance rules.

---

_Sections §0, §1, §3, §6, and Appendix A live in `pipeline-architecture.md`. This file begins at §2._

## 2. The assistive package

The pipeline produces four authored files per episode plus one merged file. The four authored files are each written by one agent with one cognitive job; the merged file is produced by a deterministic Python script. Every block in every file lives in exactly one of three layers:

- **L1 — source material (analyst).** Analytical ground truth about the passage. Not user-visible. Feeds downstream authoring and merge-script derivations.
- **L2 — pre-authored navigation content (prose, discussion).** Dealt or shown on navigation events (episode load, phase transition, closure). Not reactive to per-student state beyond "what phase are we in."
- **L3 — reactive intervention (diagnostic).** Fired on student-state events (inactivity, probe tap, attempt commit). Routes through probe taps, never through prose pattern matching or affect detection.

### 2.1 `ground_truth.yaml` — what the analyst produces (L1)

Per-passage content grounded in Affordances 1 and 2 and the cross-lens source of Affordance 3. The analyst works from the episode plan and the enumerated transcript. It is analytical, not pedagogical — it does not speculate about what students will say. Its job is accuracy.

**Required blocks:**

- `facets_present[]` — every facet exhibited in the passage, with `facet_ref` (canonical ID), `label` (student-facing language from `teacher-overview.md`), `lens`, `role` (`primary | cross_lens | strength`), `severity` (`strong | moderate | subtle`), `evidence_turns[]`, and `one_line` description. When the same move is simultaneously a character growth beat and a facet instance, `role` is a list, not a single value.

- `facets_absent_but_tempting[]` — the discrimination surface. Facets that look like they might apply but don't, each with `why_tempting` and `why_wrong`. At least one entry per passage where any discrimination is possible. Feeds the tempting-absent intervention role at §2.3 and the merge-script-derived redirect rungs.

- `lens_visibility` — per-lens, two orthogonal enum fields plus a prose description. `engagement` (`none | partial | high`) is a pure observation about the transcript: how much the characters actually used the lens. `affordance` (`none | thin | moderate | rich`) is a judgment about the passage: how much the topic gives the lens to work with if it were engaged fully. `what_shows` is a short prose description of how the lens manifests (or fails to) in this passage. The two enum fields together drive the diagnostic agent's facet-distribution rules (§2.3) and the mechanical response-space completeness check (§2.6). Invalid combinations: `(engagement: partial, affordance: none)` and `(engagement: high, affordance: none)` — the characters cannot engage with a lens the topic affords nothing; the merge script rejects these combinations.

- `turn_annotations[]` — per-turn inverse index: `speaker`, `turn_id`, `moves[]`, `facet_signals[]` (with polarity and strength), `why_it_matters`, and `discussion_cue_seeds[]`. The seeds are a shallow enumeration of creative directions this turn could support (e.g., `[source_credibility, authority_deference, counterfactual_what_if]`) — raw material for the discussion agent, not student-facing prose. **Granularity policy.** Every turn inside the passage's `turn_range` gets an entry, one-to-one with the transcript. Every entry carries `speaker` and `turn_id`. The remaining content fields are populated **iff the turn is load-bearing**, where load-bearing is defined framework-relatively: at least one of (a) facet signal, (b) lens transition, (c) cognitive-pattern or social-dynamic signal feeding `causal_layer`, or (d) claim that later turns respond to with framework-visible content. An empty entry is a **positive assertion** that the framework has nothing to say about the turn, not a mark of omission; a reviewer may dispute any empty turn as a legitimate extension.

- `causal_layer` — per passage. Structure and enforcement in §2.2.

- `perspective_transitions[]` — directional pairs between lenses: `from`, `to`, `trigger`, `what_they_gain`, `what_they_realize`, `prompt`. Required on every passage. Feeds the merge-script-derived lens-switch ladder rungs.

- `counterfactuals[]` — per facet present, a one-sentence "what would fix this in the specific passage." **Quality bar:** every entry must cite at least one `evidence_turn` from the passage AND name a specific change to that turn's content. Generic prescriptions are rejected by the reviewer. Feeds the merge-script-derived worked-example ladder rungs.

- `connects_to` — cross-passage threading. Two fields only: `echoes[]` (backward pointers the merge script uses to derive `prior_exposure`) and `contrasts[]` (bare cross-passage comparisons for analytical traceability).

**Enforcement.**

- Every entry uses canonical IDs from `framework/reference/`. Literal-scan validator catches deviations.
- Every turn citation references a turn that exists in the transcript.
- Every `perspective_transitions` entry has both `from` and `to` as valid lens IDs.
- Every `facets_present` entry has at least one `evidence_turn` inside the passage's `turn_range`.

### 2.2 `causal_layer` and the Affordance 2 rules

The causal layer sits inside `ground_truth.yaml`, not as a separate file. Its structure:

```yaml
causal_layer:
  facets_explained:
    - facet_ref: source_credibility
      cognitive:
        - pattern_ref: uncritical_acceptance
          label: "Uncritical acceptance"
          one_line: "Mira treats the article as settled because it exists."
          evidence_turns: [t4, t6]
      social:
        - dynamic_ref: authority_deference
          label: "Authority deference"
          one_line: "No one questions Mira once she sounds confident."
          evidence_turns: [t6, t9]
      interaction: cognitive_amplified_by_social
      interaction_note: "The acceptance wouldn't carry on its own — the
                         deference lets it go unchallenged."
```

**Required rules enforced by the validator:**

1. **Interaction is required.** Every `facets_explained` entry must have an `interaction` field. Allowed values: `cognitive_only`, `social_only`, `cognitive_amplified_by_social`, `social_amplified_by_cognitive`, `mutual`.
2. **`cognitive_only` is legal only for specific facets.** Per framework §4, `relevance` and `inferential_validity` have no social-dynamic account.
3. **Multiple forces per facet are required when applicable.** The reviewer consults `framework/reference/facet_inventory.yaml` for the candidate set and flags entries that list one force when the evidence supports more than one.
4. **Interaction note is required when interaction is not `cognitive_only` or `social_only`.**

The merge script (§2.6) derives a turn-first mirror of this layer as `turn_annotations[].causal_signals` by inverting the `evidence_turns` pointers, so the app can look up "what biases and dynamics are at work on turn 6" without building an inverse index at read time. This is free (no LLM involvement) and joins `prior_exposure` as a merge-script-derived block.

### 2.3 `diagnostic.yaml` — what the diagnostic agent produces (L3)

Per-turn reactive intervention content: the probe layer that turns student taps into routing keys, the per-turn intervention dictionary that every routed key looks up, and the coarse pricing policy that modulates how expensive each rung becomes. The diagnostic agent works from the episode plan, the enumerated transcript, the ground truth file, the story position object, and the canonical reference files. Its cognitive job is *hold a student error model in mind and author the probes and ladders that let the app deliver calibrated intervention via dictionary lookup, with no runtime NLP or affect detection.*

**Required blocks:**

#### 2.3.1 Probes — the routing layer

Two probe types, both student-facing, both multiple-choice, both written in voiced grade-appropriate language.

- `probes.facet.by_turn[T]` — **orientation probe**, one per load-bearing turn. Structure:

  ```yaml
  probes:
    facet:
      by_turn:
        t11:
          trigger: inactivity_or_manual
          question: "What are you noticing about this turn?"
          options:
            - text: "Mira trusted the article without checking it"
              routes_to: {facet: source_credibility, role: present}
            - text: "The article might not even be about their decision"
              routes_to: {facet: relevance, role: tempting_absent}
            - text: "Nobody asked who this affects besides the club"
              routes_to: {facet: scope_affected_parties, role: afforded_missing}
            - text: "I'm not sure what I'm noticing"
              routes_to: {blank_page: true}
  ```

  Option set is drawn from three sources: facets the analyst signaled on T (**present** role), facets the `lens_visibility` matrix says were afforded but nobody engaged, distributed to the turns where those missing observations would most naturally attach (**afforded-missing** role), and facets the analyst marked in `facets_absent_but_tempting[]` that would plausibly attract a student's attention on this turn (**tempting-absent** role). Every option set carries a blank-page escape.

- `probes.explanation.by_turn_facet[T][F]` — **optional depth probe**, authored only when the corresponding intervention cell has `has_explanation_depth: true`. Fires when the student taps a "why?" affordance. Structure:

  ```yaml
  probes:
    explanation:
      by_turn_facet:
        t11.source_credibility:
          question: "Why do you think Mira believed it so easily?"
          options:
            - text: "Because it sounded official"
              routes_to: {explanatory_variable: cognitive, pattern_ref: uncritical_acceptance}
            - text: "Because nobody argued with her"
              routes_to: {explanatory_variable: social, dynamic_ref: authority_deference}
            - text: "Both of those at the same time"
              routes_to: {explanatory_variable: interaction}
            - text: "Because she wanted it to be true"
              routes_to: {explanatory_variable: tempting_absent}
  ```

  **Opt-in per cell.** Not every `(turn, facet)` cell needs depth. The diagnostic agent authors the explanation probe and its sub-ladders only for cells where "why" is pedagogically load-bearing (typically the passage's most urgent `(engagement: none, affordance: rich)` cells and cells where the `interaction` field is non-trivial). The flag that controls this is `has_explanation_depth: bool` on the intervention cell (§2.3.2).

#### 2.3.2 Interventions — the per-turn three-role dictionary

`interventions.by_turn[T].by_facet[F]` — one entry per facet key the probe routes into. Each entry carries a `role` tag, an opening sentence, a mixed-type ladder monotonic in `reveals`, and an optional explanation sub-structure.

```yaml
interventions:
  by_turn:
    t11:
      blank_page:
        opening: "Take another look at what Mira said."
        ladder: [...]
      by_facet:
        source_credibility:
          role: present
          opening: "You're noticing Mira didn't check where the article came from."
          ladder:
            - {type: question, text: "What would someone need to know to trust it?", reveals: 1, cost: 0}
            - {type: question, text: "Has anyone in the group asked where it's from?", reveals: 2, cost: 0}
            - {type: hint, text: "The article says 'reported in a magazine.' Which magazine?", reveals: 3, cost: 1}
            - {type: worked_example, text: "{from ground_truth.counterfactuals[source_credibility]}", reveals: 4, cost: 2}
          has_explanation_depth: true
          explanation:
            by_explanatory_variable:
              cognitive: {ladder: [...]}
              social: {ladder: [...]}
              interaction: {ladder: [...]}
              tempting_absent: {ladder: [...]}
        scope_affected_parties:
          role: afforded_missing
          opening: "Nobody in the discussion mentioned who else would be affected."
          ladder: [...]   # starts by raising the facet into view
          has_explanation_depth: false
        relevance:
          role: tempting_absent
          opening: "This turn might look like it's about whether the article is about the right topic, but on this turn the issue is really where it came from."
          ladder:
            - {type: redirect, text: "Try the 'trust the source' angle instead.", routes_to: {facet: source_credibility}, reveals: 1, cost: 0}
          has_explanation_depth: false
```

**Role-gated authoring depth.** Present cells get full ladders (~4 rungs) plus optional explanation sub-ladders. Afforded-missing cells get medium ladders (~4 rungs) without explanation branching. Tempting-absent cells get short redirect ladders (1–2 rungs), often lifted verbatim from `facets_absent_but_tempting[F].why_wrong` by the merge script.

**Rung types.** `nudge | question | hint | lens_switch | redirect | worked_example`. The ladder is monotonic in `reveals` — each rung is at least as revealing as the previous one. Rung `cost` denominates lifelines; `struggle_calibration.pace` modulates cost per passage.

**Mechanical fields on every intervention cell:**

- `role: present | afforded_missing | tempting_absent`
- `opening` — one voiced sentence framing the cell for the student.
- `ladder[]` — at least one rung; monotonic in `reveals`.
- `has_explanation_depth: bool` — gates whether `explanation` sub-structure and the corresponding explanation probe are authored.
- `explanation` — present iff `has_explanation_depth: true`. Structure mirrors the ladder shape, keyed by `explanatory_variable`.

#### 2.3.3 `struggle_calibration` — the coarse pricing policy

Lean. Three fields, per passage (or per turn where it matters):

```yaml
struggle_calibration:
  by_passage:
    p1:
      pace: generous | standard | strict
      minimum_wrestling: [selected_a_facet, viewed_turn_for_15s, attempted_one_sentence]
      productive_duration: short | moderate | long
```

- `pace` — coarse rung-cost and wait-period multiplier.
- `minimum_wrestling[]` — enumerated action flags the student must clear before paid rungs unlock. Small closed vocabulary defined in `framework/reference/wrestling_gates.yaml`.
- `productive_duration` — relative hint on how long sustained struggle stays productive before further waiting becomes counterproductive.

**What struggle_calibration is not.** It is not a detection schedule, not an affect monitor, not the mechanism of productive struggle. The mechanism is the *shape* of the ladders the diagnostic agent authors inside each intervention cell (how many cheap rungs precede paid rungs, how revealing each rung is). `struggle_calibration` is a thermostat that modulates what the agent already authored; it is ~20% of the productive-struggle lift. If the ladders are weak, no pricing policy will save them.

#### 2.3.4 Other blocks

- `assumes_familiar_with[]` and `introduces[]` — at passage level. Feed the merge script's personalized-faded-assistance filter.
- `growth_beats` / `character_arc_position` — conditional, populated only when `uses_character_growth: true`.
- `stance_positions[]` — conditional, populated only when `uses_stance_positions: true`.

**Internal agent scratch (not runtime-consumed):**

- `response_space.by_lens` — the diagnostic agent's working notes: likely / partial / misreading / blindspot categories at passage/lens scope. Visible to reviewers as an audit trace; not consumed by the app at runtime (the per-turn intervention dictionary is the runtime source). The merge script lifts fragments into the intervention cells where relevant but does not require response_space to be complete in any particular shape.

### 2.4 `prose.yaml` — what the prose agent produces (L2)

Short, voiced, register-matched student-facing prose at the entry and closure moments of the student arc. The prose agent works from the episode plan, the enumerated transcript, `ground_truth.yaml`, `diagnostic.yaml` (for register consistency with ladder text), the story design doc (for voice and register), and reference files. Its cognitive job is *write short, voiced, register-matched prose at the entry and closure moments.*

**Required blocks:**

- `episode_opening` — one paragraph, student-facing, written in the story's declared `pedagogical_register`. Sets the narrative scene and ends with a non-leading "what to watch for" sentence that primes attention without naming facets, patterns, or dynamics. The non-AI app shows this before the discussion loads. Barrier-safe: no framework terminology.

- `entry_prompts[]` — per passage, per lens. One-sentence starter stems a student can adopt verbatim if they can't begin: "I noticed that in turn ___, ___ assumes ___." These scaffold writing production and do not reveal the observation. Used as the opening rung of the `blank_page` ladder in §2.3.2 when students tap "I'm not sure what I'm noticing."

- `consensus_check[]` — 1–2 short questions the app asks after group discussion ("Did your group decide whether the article was good evidence? If not, what's the sticking point?"). **Labeled explicitly as a group-phase closure probe:** fires on the navigation event "group phase ending," not on student-state detection. Drives closure and exposes group stall.

**Why these cluster together.** All three blocks are voiced short prose that does not depend on a student error model — they depend on register, character voice, and story context. The failure modes are the same across all three (adult-sounding, off-register, generic). They do not require the diagnostic muscle and do not require the generative-creative three-axis work.

### 2.5 `discussion.yaml` — what the discussion agent produces (L2)

Student-facing group-phase distributable primitives, generative-creative, produced across three creative axes, indexed richly enough for the app to select cues per student based on that student's probe record from the individual phase. The discussion agent works from the episode plan, the enumerated transcript, `ground_truth.yaml`, `diagnostic.yaml`, `prose.yaml`, the story design doc (for character voices and the three-axis persona projection), and reference files. Its cognitive job is *generate voiced, distributable, creatively varied group-phase primitives across three axes, indexed so the app can match them to each student's individual-phase work.*

**Required blocks:**

- `discussion_cues[]` — the main group-phase content. Per turn (or episode-scoped when `turn: null`), a set of cues indexed along seven axes:

  ```yaml
  discussion_cues:
    by_turn:
      t6:
        - id: t6_c1
          text: "Mira said the article was from a real magazine. Bring this to your group: is 'real magazine' enough to trust something?"
          angle: source_credibility        # facet
          lens: evidence
          axis: lens_refraction            # one of three creative axes
          continuation_of: {turn: t6, facet: source_credibility}
          explanatory_ref: null
          persona: null
          independent_of: []
        - id: t6_c2
          text: "If Priya were here, what would she ask about what Mira just said?"
          angle: source_credibility
          lens: scope
          axis: persona_projection
          continuation_of: null
          explanatory_ref: null
          persona: priya
          independent_of: [t6_c1]
        - id: t6_c3
          text: "Defend the opposite: argue that Mira was right to trust the article. What would you need to believe?"
          angle: source_credibility
          lens: evidence
          axis: stance_inversion
          continuation_of: null
          explanatory_ref: null
          persona: null
          independent_of: [t6_c1]
        - id: t6_c4
          text: "Did the group agree because they were convinced, or because nobody wanted to argue?"
          angle: source_credibility
          lens: logic
          axis: lens_refraction
          continuation_of: null
          explanatory_ref: conflict_avoidance
          persona: null
          independent_of: []
    episode_scope:
      - id: e_c1
        turn: null
        text: "Across this whole episode, where did the group use 'it makes sense' as if it meant 'it's true'?"
        angle: inferential_validity
        lens: logic
        axis: lens_refraction
        continuation_of: null
        explanatory_ref: null
        persona: null
        independent_of: []
  ```

  **Three creative axes:**
  1. **Lens refraction** — the same observation viewed through a different related lens.
  2. **Persona projection** — "what would character X ask?" or "what would absent character Y ask?"
  3. **Stance inversion** — "defend the opposite."

  **The `continuation_of` field** is what makes the individual→group handoff work. At the group-phase transition, the app reads each student's probe record and fetches:
  - A cue with `continuation_of` matching the student's latest `(turn, facet)` tuple (direct continuation).
  - Or, failing that, a cue matching the same facet at a different turn (bridge).
  - Or, failing that, a cue with `continuation_of: null` on the student's most-engaged turn (generic opening).
  - Empty-history students (who skipped or blanked the individual phase) get cues where `continuation_of: null`.

  **The `explanatory_ref` field** lets cues carry "why" content when the student's individual-phase explanation-probe tap points at a specific cognitive pattern or social dynamic.

  **Minimum cue count per turn** is computed mechanically by the merge script as the number of distinct angles the analyst's `facet_signals` and inverted `causal_layer` support for that turn, plus a required minimum of one `continuation_of: null` cue per lens with `affordance ∈ {moderate, rich}` on any passage (the empty-history-student guarantee).

  **Distribution contract — now personalized.** The partition rule is:
  1. **Minimize cross-student angle overlap** (current rule — `independent_of` non-overlap).
  2. **Maximize within-student continuity** (new rule — each student's cue should match their probe record where possible).
  Both rules are satisfiable because discussion_cues carry enough metadata for the app to find a matching cue per student across the three axes.

  **Neutral deployment.** The schema supports both pre-distribution at group-phase entry and reactive fetching on group events (quiet student, stall, angle saturation). The distribution contract does not prescribe which.

- `talk_moves[]` — 4–6 grade-calibrated sentence stems ("I disagree with ___ because…", "Building on ___…"). Episode-level.

- `jigsaw_fragments[]` — capability-flagged; only when `supports_jigsaw: true`. Per-lens micro-briefs for jigsaw-pattern activities. Sourced from `lens_visibility.what_shows`.

### 2.6 `assistive_package.yaml` — the merged view the app reads

A mechanical concatenation of `ground_truth.yaml`, `diagnostic.yaml`, `prose.yaml`, and `discussion.yaml`, plus cross-reference integrity checks and deterministic derivations. Produced by a Python merge script, not an LLM. This is the single file the Lens app consumes.

**The merge script computes these deterministic derivations (free, no LLM):**

1. **`prior_exposure`** — per passage, the list of facets/patterns/dynamics the student has already encountered in prior episodes (each with `first_seen: episode_NN`). Derived from the story's episode sequence and the per-episode ground truth files.

2. **`turn_annotations[].causal_signals`** — inverted from `causal_layer[].evidence_turns` so each turn carries the list of cognitive patterns and social dynamics it exhibits.

3. **Ladder endpoint derivations.** Several rung types are lifted verbatim from ground truth rather than re-authored by the diagnostic agent:
   - `worked_example` bottom rung on any present-role cell = `ground_truth.counterfactuals[]` entry for that facet, filtered to rungs whose evidence turn matches the intervention cell's turn.
   - `lens_switch` rung = matching `ground_truth.perspective_transitions[]` entry.
   - `redirect` rung on any tempting-absent cell = `ground_truth.facets_absent_but_tempting[F].why_wrong` entry.

4. **`calibration_warnings[]`** — when `declares_calibration_warnings: true`, the merge script parses a `## Calibration warnings` section from the story design doc and lifts each entry verbatim. No LLM paraphrase.

**The merge script enforces (integrity checks):**

- Every `interventions.by_turn[T].by_facet[F]` cell's `role` matches one of the three source lists for T (analyst signals, lens_visibility afforded-missing distribution, `facets_absent_but_tempting`).
- Every `facet_probe.by_turn[T].options[].routes_to` resolves to an existing intervention cell at T or `blank_page`.
- Every `explanation_probe` exists iff the corresponding intervention cell has `has_explanation_depth: true`.
- Every intervention ladder is monotonic in `reveals`.
- Every intervention cell has `role`, `opening`, non-empty `ladder`, and `has_explanation_depth` fields populated.
- Every `minimum_wrestling[]` entry is in the `framework/reference/wrestling_gates.yaml` enumeration.
- Every `causal_layer.interaction` value is from the enumerated set, and `cognitive_only` appears only for `relevance` and `inferential_validity`.
- Every turn reference in any block is a valid turn in the transcript.
- Every `diagnostic.assumes_familiar_with[]` reference resolves to a facet/pattern/dynamic in `prior_exposure` for the same passage.
- Every `counterfactuals[]` entry cites at least one `evidence_turn` inside the passage's `turn_range`.
- **Per-passage cue-cover rule:** for every lens with `affordance ∈ {moderate, rich}`, there is at least one `discussion_cues` entry with `continuation_of: null` whose `lens` matches. This is the empty-history-student guarantee.
- **Cross-file intervention↔cue rule:** for every `(turn, facet)` intervention cell with `role: present` or `role: afforded_missing`, there is at least one `discussion_cues` entry whose `angle` equals that facet. This prevents dead handoffs from individual to group phase.
- **Discussion cue minimum count** per turn (distinct-angle set from analyst's annotations).
- **Response-space completeness** — the engagement/affordance matrix check runs against `response_space.by_lens` as an audit trace, but does not block the merge because `response_space` is working-notes, not runtime content. Failures produce warnings, not errors.
- **Literal-scan** — no reserved framework IDs leak into student-facing cue text, probe options, intervention text, or talk moves.
- **`episode_opening` presence** with no reserved framework terms.

If any mandatory check fails, the merge script exits with an error and the episode is not considered complete. No manual override.

### 2.7 The handoff to apps

`assistive_package.yaml` is the universal pipeline's terminal artifact. After it is written, the framework's responsibility for the episode ends. Anything an app does with the package happens in the app's own layer, governed by Rule 12.

**The handoff contract** is deliberately narrow:

- The universal pipeline never reads or writes anything under `artifacts/{story_id}/episodes/episode_{NN}/{app_id}/`. That subdirectory is reserved for app outputs.
- Once `/build_assistive_package` completes, the four authored files and the merged package are frozen. No app-layer step writes back into them.
- An app may write a contract document at `apps/{app_id}/docs/package-contract.md` that formalizes what the app consumes. Contracts are read-only consumers (Rule 9).

**The probe record — a named piece of app-owned state.**

The package is indexed richly enough that any non-AI app consuming it will find itself maintaining a persistent per-student record of the following shape:

```
probe_record = [
  (turn, facet, explanatory_variable, rung_reached, timestamp),
  ...
]
```

This record is **app-owned state**. The pipeline never writes to it and never reads it. But the package's indexing explicitly assumes this record exists so the app can:

- Route individual-phase interventions (look up `interventions.by_turn[T].by_facet[F]`).
- Select group-phase cues at the individual→group transition (match `discussion_cues[].continuation_of` against the latest `(turn, facet)`).
- Apply personalized faded assistance (filter hint-ladder rungs against cumulative facet exposure).
- Surface student-specific closure content.

The record's field names are **a handoff convention, not a schema the pipeline validates**. Apps that implement fewer fields (e.g., no timestamps, no rung tracking) consume a narrower slice of the package. Apps that implement more fields (e.g., tracking tap latency, tracking option-text hover time) are free to. The framework's only commitment is that every package block either consumes `(turn, facet, explanatory_variable)` indexing or is deployed on navigation events — there is no block that requires app-side state outside this vocabulary.

The framework does not specify what commands, subagents, or scripts an app uses to consume the package, or whether the app uses Claude Code at that layer at all. Those are app-designer decisions, described only by Rule 12's boundary conditions. See `pipeline-architecture.md` §3.6 for why the framework stops at four authoring agents and `pipeline-architecture.md` §6 Rule 12 for the full scope statement on the app layer.

---

## 4. Story-level capability declarations

The story design doc's frontmatter is extended with a small set of capability flags that the pipeline reads and honors. The governance rule (Rule 2) requires that every flag earn its place against a creative choice multiple stories actually make.

**Coverage and inventory flags:**

- `coverage_mode: focused | comprehensive`
- `declared_facets: [...]`
- `declared_cognitive_patterns: [...]`
- `declared_social_dynamics: [...]`

**Creative-choice flags:**

- `pedagogical_register: unfinished_not_wrong | neutral` (default: `neutral`) — shapes the prose and discussion agents' prose tone.
- `uses_character_growth: true | false` (default: `false`) — when `true`, the diagnostic agent populates `growth_beats` at episode level and `character_arc_position` at passage level.
- `declares_calibration_warnings: true | false` (default: `false`) — when `true`, the merge script lifts author-written calibration warnings from the story design doc.
- `uses_stance_positions: true | false` (default: `false`) — when `true`, the diagnostic agent populates `stance_positions[]` per passage.
- `supports_jigsaw: true | false` (default: `false`) — when `true`, the discussion agent populates `discussion.jigsaw_fragments[]`.

---

## 5. End-to-end revision sequence

The universal pipeline is seven stages; it ends at `assistive_package.yaml` and is fully app-agnostic. Each universal stage has a gate review; stages 4 and 6 have architecture reviews in addition.

### Stage 1 — Schema-first hand authoring

**Action.** Write `ground_truth.schema.yaml`, `diagnostic.schema.yaml`, `prose.schema.yaml`, and `discussion.schema.yaml` as formal YAML schemas. Hand-author all four files for **one existing episode** — Overton Park episode 3.

**Forcing function.** For every field, ask: "could a non-AI app render or use this via dictionary lookup with no pattern matching and no affect detection?" If not, fix the schema.

**Exit criterion.** A human can fill every required field without hand-waving. No agent work begins until hand-authoring is clean. The per-turn three-role intervention dictionary is the hardest part of this stage and the single most important thing to get right.

**Gate review — schema reality check.** Does the schema survive contact with real content? Write findings as a short report; update the schema and the plan in response.

### Stage 2 — Analyst agent

**Action.** Port the existing `evaluator` prompt into the new analyst role, stripping all pedagogical speculation. Run it on the same episode as Stage 1. Diff against the hand-authored ground truth.

**Exit criterion.** ≥90% of hand-authored `facets_present` entries produced with matching `facet_ref` and overlapping `evidence_turn`; zero hallucinated facets; 100% turn citations resolve; every `causal_layer` entry has populated `interaction` field; `discussion_cue_seeds[]` populated on every load-bearing turn.

### Stage 3 — Diagnostic agent

**Action.** Write the diagnostic agent prompt from scratch. Run on the same episode, reading the stage-2 analyst output from file.

**Exit criterion.** Every `(turn, facet)` intervention cell has the required fields. Facet probes for every load-bearing turn are authored with options covering all three roles plus a blank-page escape. Explanation probes exist iff `has_explanation_depth: true`, and the diagnostic agent can articulate why each cell earned or did not earn explanation depth. Ladders are passage-specific, not generic. `struggle_calibration` values differentiate meaningfully across passages.

**Gate review — diagnostic specificity.** Sample ten intervention cells; mark each as "passage-specific" or "generic." ≥80% passage-specific to pass.

### Stage 4 — Prose agent

**Action.** Write the prose agent prompt, taking the story design doc as explicit read-only input. Run on the same episode, reading stage-2 and stage-3 outputs.

**Exit criterion.** `episode_opening` sets scene in declared register with no framework leakage. Sampled `entry_prompts` and `consensus_check` sound like something a 6th grader could say or read.

**Gate review — pedagogical register.** Sample five entries per block; mark each as "student-sounding" or "adult-sounding." ≥80% student-sounding to pass.

**Architecture review.** First end-to-end run of analyst + diagnostic + prose. Questions:
1. Does the three-affordance-at-three-layers spine in `pipeline-architecture.md` §1.2 hold?
2. Is the three-layer block placement clean, or are fields drifting?
3. Are governance rules being respected?

### Stage 5 — Discussion agent

**Action.** Write the discussion agent prompt. Run on the same episode. First test of the three-axis creative surface with the `continuation_of` and `explanatory_ref` indexing.

**Exit criterion.** Every load-bearing turn meets the mechanical cue-count floor. Sampled cues exercise at least two of the three axes. Per-passage cue-cover rule passes (one `continuation_of: null` cue per affordable lens). Cross-file intervention↔cue rule passes (every present/afforded-missing intervention cell has a matching-angle cue).

**Gate review — creative generativity.** Sample ten cues; mark each as "generative" or "paraphrase." ≥70% generative to pass.

### Stage 6 — Package reviewer + second-episode unassisted run

**Action.** Write the package reviewer agent based on failures actually observed in stages 2–5. Seed it with four deliberately broken packages (hallucinated facet, missing interaction, generic intervention cell, cues collapsing under cosmetic variation) and verify it catches each. Then run the full pipeline on a **fresh episode**, with no manual intervention between agents.

**Exit criterion.** Reviewer catches all seeded broken cases. Full pipeline produces `assistive_package.yaml` that passes all merge-script integrity checks and all reviewer criteria with no operator intervention. Cross-episode mode runs across episodes 1 and 2 and passes: `connects_to.echoes` references resolve, `pedagogical_register` does not drift, creative non-convergence holds.

### Stage 7 — Contrast-case run

**Action.** Run the full pipeline on a creatively distinct story — ideally one that opts out of several capability flags the stage-1 story opts into.

**Exit criterion.** Contrast story produces a valid assistive package with correctly-absent conditional blocks. The reviewer does not flag absence of conditional content as under-specification.

Stage 7 is the end of the universal pipeline.

### App-layer work (per app, after the universal pipeline)

After the universal pipeline lands, each app that wants to consume the package does whatever work that app needs per Rule 12. The framework plan does not specify app-layer stages, commands, or file shapes.

---

## 7. Non-goals, risks, and open questions

### 7.1 Non-goals

- **Reasoning Lab migration deferred** under a Rule-12 contract.
- **Runtime LLM calls from the app.** Non-AI by design.
- **Runtime NLP or affect detection.** The app reads dictionary lookups and timers. Nothing else.
- **Teacher-facing surface.** Dropped `expected_divergence` re-enters the plan only when a teacher surface is designed.
- **Cross-story threading.** Within-episode and within-story threading only.
- **Real-time analytics infrastructure.** Out of scope.

### 7.2 Risks

- **Over-engineering risk.** Every new field is pressure on the governance rules. Mitigation: Rule 1 applied to every proposed field; stage 1 hand-authoring as the forcing function.
- **Click-a-turn UX dependency.** The per-turn intervention dictionary assumes students click turns to engage. If the app's click-a-turn affordance is not visible or not low-friction, L3 never activates. Mitigation: this is an app-layer concern but is worth surfacing here so app designers see it as load-bearing.
- **Probe option quality.** The routing layer is only as good as its options. If a student's real thinking doesn't match any option, they fall back to blank-page. Mitigation: reviewer criterion on probe option coverage; blank-page ladder must be substantive.
- **Struggle calibration values need empirical tuning.** First few episodes will feel too strict or too generous until defaults settle. Mitigation: plan for an explicit recalibration pass after the first five episodes ship.
- **Agent role impurity.** The diagnostic agent might invent ground truth if the analyst's output looks thin. Mitigation: explicit prompt prohibition plus `reviewer_flags[]` adjudication.
- **Schema version drift vs. agent prompts.** Mitigation: each schema file carries a `schema_version`, each agent prompt declares the version it targets, and `validate_schema.py` fails on disagreement.

### 7.3 Open questions

- **Counterfactual depth.** One-sentence per facet vs. multi-sentence worked-rewrites. Defer until an app use case requires expansion.
- **Contrast-case story acquisition.** Use `saving-the-maker-space` as-is, modify it, or hand-author a minimal contrast story? Decision needed before stage 6.
- **Wrestling-gate vocabulary.** Initial set: `selected_a_facet`, `viewed_turn_for_15s`, `attempted_one_sentence`, `viewed_second_lens`. Needs validation against the first real episode's ladder content.
- **Teacher surface.** Deferred but not closed. When the teacher surface is designed, a teacher-facing block comes back as a future addition.

---

## 8. What success looks like

When this revision is complete:

1. Any non-AI critical-thinking app built on the Polylogue framework can consume `assistive_package.yaml` directly and deliver a full student session without any runtime LLM call, any runtime NLP, or any runtime affect detection — only dictionary lookups and timers.

2. Every field in the package traces to a framework affordance or a well-validated instructional strategy, operationalized at exactly one of three layers (L1 source / L2 navigation / L3 reactive).

3. Every runtime moment — episode entry, turn click, probe tap, rung advance, phase transition, group cue fetch, closure — has exactly one block in the package responsible for its content, and exactly one layer responsible for its trigger.

4. The per-turn three-role intervention dictionary guarantees that every possible student tap lands on authored content. No dead taps; no 404s; no paternalistic "that's wrong."

5. Stories opt into creative extensions via a small set of capability flags. Stories that don't opt in are served equally well with minimal packages.

6. The pipeline runs four LLM authoring agents (analyst, diagnostic, prose, discussion) plus one reviewer. Each agent has a single cognitive job, a distinct failure mode, and an independent iteration rhythm.

7. No content lives in two places. Each block has one owner and one layer.

8. Rule 11 is the load-bearing architectural commitment. Future extensions can be added by introducing a new agent and a new file, without touching existing agents or files.

9. At least two creatively distinct stories have been run through the pipeline end-to-end.

---

## Appendix B — Governance rules reference

One-line operational statements of the twelve governance rules. Full rationale lives in `pipeline-architecture.md` §6.

| # | Name | Operational statement | Memo § |
|---|---|---|---|
| 1 | Every required field traces to a justified source | A required field must trace to a framework affordance or a named well-validated instructional strategy; otherwise gate it behind a capability flag or remove it. | `pipeline-architecture.md` §6 Rule 1 |
| 2 | Creative choices are opt-ins, not defaults | Content that depends on a creative choice some story might not make goes behind a capability flag; a new flag requires two distinct stories that would use it differently. | §6 Rule 2 |
| 3 | Light usage is valid | The reviewer checks well-formedness of what is present, not exercise of the full machinery. | §6 Rule 3 |
| 4 | The pipeline supports, does not compel | The pipeline produces primitives; no app is required to use them in those ways. | §6 Rule 4 |
| 5 | Redundancy is an error, not a feature | Two blocks holding the same content in different wrappings means one is wrong. | §6 Rule 5 |
| 6 | Turn anchors are mandatory | Every annotation must cite turn IDs. | §6 Rule 6 |
| 7 | IDs are hidden; labels are student-facing | Machine-readable fields use canonical IDs; student-facing fields use labels from `apps/lens/docs/teacher-overview.md`. | §6 Rule 7 |
| 8 | Agent roles are pure | Each authoring agent produces only its own content kind. | §6 Rule 8 |
| 9 | App contracts are read-only consumers | Contracts narrow what an app uses; they cannot constrain what the pipeline produces. | §6 Rule 9 |
| 10 | Contracts are optional | Absence of a contract document is not an error. | §6 Rule 10 |
| 11 | One cognitive job per agent; one agent per file | Adding a new intelligent capability means adding an agent and a file; never bolting onto an existing prompt. | §6 Rule 11 |
| 12 | Apps own everything app-specific; the framework stops at the handoff | The universal pipeline ends at `assistive_package.yaml`; app-layer work lives under `apps/{app_id}/pipeline/` per Rule 12. | §6 Rule 12 |

**Operational corollary (not a new rule):** **Detection is app-owned; content is pipeline-owned; routing is student-owned via probe taps.** This is a consequence of Rules 4 and 11 applied to the productive-struggle surface. The pipeline authors no block whose correct operation requires the app to do runtime NLP, affect detection, or pattern matching of student prose. If a proposed block would fail this test, it is restructured to route through probe taps instead.

---

*End of plan.*
