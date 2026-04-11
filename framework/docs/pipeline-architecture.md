# Pipeline Architecture

**Audience.** Pipeline maintainers, app builders, instructional-design reviewers.
**Scope.** Lens application. Reasoning Lab is deferred.

This document is the complete architectural specification for the Polylogue pipeline's per-episode output: the **assistive package**. It covers the pedagogical commitments the pipeline rests on (§1), the field-level schemas for every authored and derived block (§2), the four-agent architecture that produces them (§3), the story-level capability flags that control conditional content (§4), the governance rules any future extension is accountable to (§5), and risks (§6).

---

## 1. Pedagogical commitments

### 1.1 Two grounds for assumption

The pipeline makes assumptions on two grounds:

**Ground A — framework-grounded universals.** Every Polylogue story shares four properties that are definitional, not creative choices:

1. **Purpose.** The story exists to teach critical thinking.
2. **Form.** The story is composed of turn-based multi-persona dialog.
3. **Vocabulary.** The story builds on the Polylogue conceptual framework — three lenses (Logic, Evidence, Scope), two classes of forces (cognitive biases and social dynamics), ten facets.
4. **Affordances.** The framework produces three affordances: naming what is weak, explaining why the reasoner got there, and holding more than one valid perspective.

**Ground B — well-validated instructional defaults.** Some instructional strategies have enough empirical grounding that assuming them as defaults is low-risk and high-value:

- **Productive struggle** (Kapur; VanLehn; Schwartz & Bransford)
- **Faded assistance** (Collins, Brown & Newman; Wood, Bruner & Ross; Pea)
- **Elaborative interrogation / self-explanation** (Chi; Pressley)
- **Perspective-taking** — structural to Affordance 3
- **Worked examples / worked counterfactuals** (Sweller; Renkl)
- **Structured peer discussion with distributed roles and prompts** (Palincsar & Brown; Webb; Cohen)
- **Spaced / distributed practice** — for free given cross-episode threading (Cepeda et al.; Dunlosky et al.)

The pipeline produces primitives aligned with these strategies. It does not compel any app to use the primitives in those ways.

### 1.2 The three affordances operationalized at three layers

Each framework affordance is operationalized at **three layers**, distinguished by **what triggers them at runtime**:

- **L1 — source material.** Analytical ground truth, not user-visible. Feeds downstream authoring and merge-script derivations. Triggered by nothing — it is static source. Owned by the analyst.
- **L2 — pre-authored navigation content.** Shown or dealt on navigation events (episode load, phase transition, closure). Not reactive to per-student state beyond "what phase are we in." Owned by prose and discussion.
- **L3 — reactive intervention.** Fired on student-state events (inactivity, probe tap, attempt commit). Routes through probe taps, never through runtime NLP or affect detection. Owned by the diagnostic agent.

| Affordance | L1 (source) | L2 (pre-authored navigation) | L3 (reactive) |
|---|---|---|---|
| **1. Name what is weak** | `facets_present`, `facets_absent_but_tempting` | `entry_prompts`, `consensus_check` | Facet probe + intervention cells (present / tempting-absent) |
| **2. Explain why** | `causal_layer` with required `interaction` | *(subsumed into discussion cues with `explanatory_ref`)* | Opt-in explanation probe + explanation sub-ladders |
| **3. Hold more than one valid perspective** | `lens_visibility`, `perspective_transitions` | `discussion_cues` (three axes + `continuation_of`) | Afforded-missing intervention cells, lens-switch ladder rungs |

Nine cells, nine distinct operationalizations, no redundancy.

### 1.3 Where the instructional defaults live

The instructional defaults do not require their own schema blocks. They are **default uses of the affordance primitives**, enabled by small metadata additions:

- **Productive struggle.** The mechanism is the *shape* of the per-turn intervention ladders: cheap nudges precede paid hints, questions dominate early rungs, hints and worked examples dominate late rungs, the ladder is monotonic in `reveals`. `struggle_calibration` is a coarse thermostat on top — it modulates the ladders, but is not itself the mechanism. Detection of student struggle is app-owned via inactivity; the pipeline authors no detection heuristics.

- **Faded assistance.** Enabled by `prior_exposure` (merge-script-derived from story sequence), `assumes_familiar_with` / `introduces` at passage level, and `minimum_wrestling[]` gates that the app consults to filter which rungs unlock cheaply.

- **Elaborative interrogation.** Enabled by the question-type rungs in the per-turn intervention ladders. Reinforced by the optional explanation sub-ladders.

- **Perspective-taking.** Enabled by `perspective_transitions` (analytical), `discussion_cues` with three creative axes (pre-authored group), and afforded-missing intervention cells (reactive individual).

- **Worked examples.** Enabled by `counterfactuals[]` per facet, surfaced by the merge script as the bottom `worked_example` rung of present-role intervention ladders.

- **Structured peer discussion.** Enabled by `discussion_cues` (with `continuation_of`, `explanatory_ref`, null-turn support), `talk_moves`, and `jigsaw_fragments`. Empty-history students get generic opening cues via `continuation_of: null`.

- **Spaced practice.** Enabled for free by `connects_to.echoes` cross-passage threading.

### 1.4 Universal core vs. app-coupled layer

**Universal core (framework-shaped, app-agnostic).** Everything in `ground_truth.yaml`, `diagnostic.yaml`, `prose.yaml`, and `discussion.yaml`. Any non-AI critical-thinking app built on the Polylogue framework would want this content unchanged.

**App-coupled interpretation (Lens-shaped today, generalizable later).** The lifeline-cost economy, the "commit to a reading then get assessed" loop, session pacing, and UI rituals are interpretation choices a specific app makes when it consumes the package. The pipeline produces neutral primitives; the app decides what they mean.

The universal pipeline produces only the universal core and ends at `assistive_package.yaml`. Anything an app does with that artifact happens in the **app layer** (governed by Rule 12, §5).

---

## 2. The assistive package

The pipeline produces four authored files per episode plus one merged file. The four authored files are each written by one agent with one cognitive job; the merged file is produced by a deterministic Python script. Every block lives in exactly one of the three layers defined in §1.2.

### 2.1 `ground_truth.yaml` — analyst output (L1)

Per-passage analytical ground truth. The analyst works from the episode plan and the enumerated transcript. It is analytical, not pedagogical — it does not speculate about what students will say.

**Required blocks:**

- `facets_present[]` — every facet exhibited in the passage, with `facet_ref` (canonical ID), `label` (student-facing language), `lens`, `role` (`primary | cross_lens | strength`), `severity` (`strong | moderate | subtle`), `evidence_turns[]`, and `one_line` description.

- `facets_absent_but_tempting[]` — the discrimination surface. Facets that look like they might apply but don't, each with `why_tempting` and `why_wrong`. At least one entry per passage. Feeds the tempting-absent intervention role.

- `lens_visibility` — per-lens, two orthogonal enum fields plus a prose description. `engagement` (`none | partial | high`) is a pure observation about the transcript. `affordance` (`none | thin | moderate | rich`) is a judgment about the passage. `what_shows` is a short prose description. Invalid combinations: `(engagement: partial|high, affordance: none)`.

- `turn_annotations[]` — per-turn inverse index: `speaker`, `turn_id`, `moves[]`, `facet_signals[]` (with polarity and strength), `why_it_matters`, and `discussion_cue_seeds[]`. Every turn inside the passage's `turn_range` gets an entry, one-to-one with the transcript. Content fields are populated iff the turn is load-bearing (at least one of: facet signal, lens transition, causal-layer signal, or claim that later turns respond to).

- `causal_layer` — per passage. Structure in §2.2.

- `perspective_transitions[]` — directional pairs between lenses: `from`, `to`, `trigger`, `what_they_gain`, `what_they_realize`, `prompt`. Required on every passage.

- `counterfactuals[]` — per facet present, a one-sentence "what would fix this." Must cite at least one `evidence_turn` and name a specific change to that turn's content.

- `connects_to` — cross-passage threading. Two fields: `echoes[]` (backward pointers for `prior_exposure`) and `contrasts[]` (bare cross-passage comparisons).

### 2.2 `causal_layer` and the Affordance 2 rules

The causal layer sits inside `ground_truth.yaml`:

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

**Enforced rules:**

1. **Interaction is required.** Allowed values: `cognitive_only`, `social_only`, `cognitive_amplified_by_social`, `social_amplified_by_cognitive`, `mutual`.
2. **`cognitive_only` is legal only for specific facets.** Per framework §4, `relevance` and `inferential_validity` have no social-dynamic account.
3. **Multiple forces per facet are required when applicable.**
4. **Interaction note is required when interaction is not `cognitive_only` or `social_only`.**

The merge script derives a turn-first mirror as `turn_annotations[].causal_signals` by inverting the `evidence_turns` pointers, so the app can look up biases and dynamics per turn without building an inverse index.

### 2.3 `diagnostic.yaml` — diagnostic agent output (L3)

Per-turn reactive intervention content. The diagnostic agent's cognitive job: *hold a student error model in mind and author the probes and ladders that let the app deliver calibrated intervention via dictionary lookup, with no runtime NLP or affect detection.*

#### 2.3.1 Probes — the routing layer

Two probe types, both student-facing, both multiple-choice, both in voiced grade-appropriate language.

- `probes.facet.by_turn[T]` — **orientation probe**, one per load-bearing turn:

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

  Option set drawn from three sources: present facets from analyst signals, afforded-missing facets from the `lens_visibility` matrix, and tempting-absent facets from `facets_absent_but_tempting[]`. Every option set carries a blank-page escape.

- `probes.explanation.by_turn_facet[T][F]` — **optional depth probe**, authored only when the corresponding intervention cell has `has_explanation_depth: true`. Fires on "why?" taps.

#### 2.3.2 Interventions — the per-turn three-role dictionary

`interventions.by_turn[T].by_facet[F]` — one entry per facet key the probe routes into:

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
          ladder: [...]
          has_explanation_depth: false
        relevance:
          role: tempting_absent
          opening: "This turn might look like it's about whether the article is about the right topic, but the issue is really where it came from."
          ladder:
            - {type: redirect, text: "Try the 'trust the source' angle instead.", routes_to: {facet: source_credibility}, reveals: 1, cost: 0}
          has_explanation_depth: false
```

**Role-gated authoring depth.** Present cells get full ladders (~4 rungs) plus optional explanation sub-ladders. Afforded-missing cells get medium ladders (~4 rungs) without explanation branching. Tempting-absent cells get short redirect ladders (1–2 rungs).

**Rung types.** `nudge | question | hint | lens_switch | redirect | worked_example`. Monotonic in `reveals`. Rung `cost` denominates lifelines; `struggle_calibration.pace` modulates cost per passage.

**Mechanical fields on every intervention cell:** `role`, `opening`, `ladder[]` (at least one rung, monotonic in `reveals`), `has_explanation_depth: bool`, `explanation` (present iff depth is true).

#### 2.3.3 `struggle_calibration` — the coarse pricing policy

Three fields, per passage:

```yaml
struggle_calibration:
  by_passage:
    p1:
      pace: generous | standard | strict
      minimum_wrestling: [selected_a_facet, viewed_turn_for_15s, attempted_one_sentence]
      productive_duration: short | moderate | long
```

`struggle_calibration` is not the productive-struggle mechanism — the mechanism is the *shape* of the ladders. This is a thermostat that modulates what the agent already authored.

#### 2.3.4 Other blocks

- `assumes_familiar_with[]` and `introduces[]` — feed the merge script's faded-assistance filter.
- `growth_beats` / `character_arc_position` — conditional, populated only when `uses_character_growth: true`.
- `stance_positions[]` — conditional, populated only when `uses_stance_positions: true`.
- `response_space.by_lens` — internal agent scratch. Visible to reviewers as audit trace; not consumed at runtime.

### 2.4 `prose.yaml` — prose agent output (L2)

Short, voiced, register-matched student-facing prose at the entry and closure moments.

**Required blocks:**

- `episode_opening` — one paragraph, student-facing, in the story's declared `pedagogical_register`. Sets the narrative scene with a non-leading "what to watch for" sentence. Barrier-safe: no framework terminology.

- `entry_prompts[]` — per passage, per lens. One-sentence starter stems a student can adopt verbatim if they can't begin. Scaffold writing production without revealing the observation.

- `consensus_check[]` — 1–2 short questions fired on the "group phase ending" navigation event. Drive closure and expose group stall.

**Why these cluster together.** All three blocks are voiced short prose that does not depend on a student error model — they depend on register, character voice, and story context. The failure modes are the same (adult-sounding, off-register, generic).

### 2.5 `discussion.yaml` — discussion agent output (L2)

Group-phase distributable primitives, generative-creative, indexed for the app to select cues per student based on their individual-phase probe record.

**Required blocks:**

- `discussion_cues[]` — per turn (or `turn: null` for episode-scoped), indexed along seven axes:

  ```yaml
  discussion_cues:
    by_turn:
      t6:
        - id: t6_c1
          text: "Mira said the article was from a real magazine. Bring this to your group: is 'real magazine' enough to trust something?"
          angle: source_credibility
          lens: evidence
          axis: lens_refraction
          continuation_of: {turn: t6, facet: source_credibility}
          explanatory_ref: null
          persona: null
          independent_of: []
  ```

  **Seven indexing axes:** `angle` (facet), `lens`, `axis` (lens_refraction / persona_projection / stance_inversion), `continuation_of` (individual→group handoff), `explanatory_ref` (cognitive/social pattern), `persona` (for persona-projection cues), `independent_of` (non-overlap partition).

  **The `continuation_of` field** makes the individual→group handoff work. At the transition, the app reads each student's probe record and fetches a matching cue. Empty-history students get cues where `continuation_of: null`.

  **Minimum cue count per turn** is computed mechanically by the merge script from the number of distinct angles the analyst's signals support, plus one `continuation_of: null` cue per lens with `affordance ∈ {moderate, rich}` (the empty-history-student guarantee).

- `talk_moves[]` — 4–6 grade-calibrated sentence stems. Episode-level.

- `jigsaw_fragments[]` — capability-flagged; only when `supports_jigsaw: true`.

### 2.6 `assistive_package.yaml` — the merged view the app reads

A mechanical concatenation of the four authored files plus cross-reference integrity checks and deterministic derivations. Produced by a Python merge script, not an LLM. This is the single file the app consumes.

**Deterministic derivations (no LLM):**

1. **`prior_exposure`** — per passage, facets/patterns/dynamics the student has already encountered. Derived from the story's episode sequence.
2. **`turn_annotations[].causal_signals`** — inverted from `causal_layer[].evidence_turns`.
3. **Ladder endpoint derivations:**
   - `worked_example` bottom rung = `ground_truth.counterfactuals[]` for that facet.
   - `lens_switch` rung = matching `ground_truth.perspective_transitions[]` entry.
   - `redirect` rung on tempting-absent cells = `ground_truth.facets_absent_but_tempting[F].why_wrong`.
4. **`calibration_warnings[]`** — when `declares_calibration_warnings: true`, lifted verbatim from the story design doc.

**Integrity checks enforced by the merge script:**

- Every intervention cell's `role` matches the source lists for that turn.
- Every probe option resolves to an existing intervention cell or `blank_page`.
- Every explanation probe exists iff `has_explanation_depth: true`.
- Ladders are monotonic in `reveals`.
- Every intervention cell has `role`, `opening`, non-empty `ladder`, and `has_explanation_depth`.
- Every `minimum_wrestling[]` entry is in `framework/reference/wrestling_gates.yaml`.
- Every `causal_layer.interaction` value is from the enumerated set.
- Every turn reference is a valid turn in the transcript.
- Every `assumes_familiar_with[]` reference resolves to `prior_exposure`.
- Every `counterfactuals[]` entry cites `evidence_turn` inside the passage's `turn_range`.
- **Per-passage cue-cover rule:** one `continuation_of: null` cue per affordable lens.
- **Cross-file intervention↔cue rule:** every present/afforded-missing intervention cell has a matching-angle cue.
- **Literal-scan:** no reserved framework IDs in student-facing text.
- **`episode_opening` presence** with no reserved framework terms.

If any mandatory check fails, the merge script exits with an error and the episode is not considered complete.

### 2.7 The handoff to apps

`assistive_package.yaml` is the universal pipeline's terminal artifact. After it is written, the framework's responsibility for the episode ends (Rule 12).

**The handoff contract:**

- The universal pipeline never reads or writes under `artifacts/{story_id}/episodes/episode_{NN}/{app_id}/`.
- Once `/build_assistive_package` completes, the four authored files and the merged package are frozen.
- An app may write a contract document at `apps/{app_id}/docs/package-contract.md`.

**The probe record — app-owned state.** The package is indexed so any non-AI app consuming it will maintain a per-student record shaped like `(turn, facet, explanatory_variable, rung_reached, timestamp)`. This record is app-owned — the pipeline never writes or reads it. The framework's commitment is that every package block either consumes `(turn, facet, explanatory_variable)` indexing or is deployed on navigation events.

---

## 3. Agent architecture

The pipeline uses **four authoring agents** — analyst, diagnostic, prose, and discussion — plus one reviewer. The split follows the cognitive-job boundary (§3.6), not the phase boundary.

### 3.1 The analyst agent

**Input.** `episode.yaml`, `transcript.yaml`, canonical reference files, and the story's episode index (for cross-episode threading).

**Output.** `ground_truth.yaml` (schema in §2.1–2.2).

**Cognitive job.** Close reading against a known framework. Identify facets, absent-but-tempting facets, lens visibility, turn annotations, causal layer with interaction, perspective transitions, counterfactuals, and cross-passage echoes/contrasts.

**Constraints.** Must not speculate about students. Must cite turn IDs. Must use canonical IDs. Must derive `facets_present[]` from the transcript without using the designed targets as a hint.

### 3.2 The diagnostic agent

**Input.** `episode.yaml`, `transcript.yaml`, `ground_truth.yaml`, canonical reference files, and a story position object.

**Output.** `diagnostic.yaml` (schema in §2.3).

**Cognitive job.** Hold a student error model in mind and author the probes and per-turn intervention ladders. For each load-bearing turn, derive the relevant facet set from present facets, afforded-missing facets, and tempting-absent facets. Author the `(turn, facet)` cells with role, opening, ladder, and optional explanation depth.

**Blindspot calibration by matrix cell.** `(engagement: none, affordance: rich)` → maximum urgency. `(engagement: none, affordance: moderate)` → high urgency. `(engagement: none, affordance: thin)` → habit-building urgency. `(engagement: partial, *)` → names what partial engagement stopped short of. `(engagement: high, affordance: rich/moderate)` → subtler edges. `(engagement: high, affordance: thin)` → no cells by design.

**Constraints.** Reads ground truth but does not alter it. Intervention text must be passage-specific. Ladders direct attention without giving the observation (except `worked_example` bottom rung). Does not author prose or discussion content. Does not pattern-match student prose.

### 3.3 The prose agent

**Input.** `episode.yaml`, `transcript.yaml`, `ground_truth.yaml`, `diagnostic.yaml` (for register consistency), the story design doc, the story position object, and reference files.

**Output.** `prose.yaml` (schema in §2.4).

**Cognitive job.** Write short, voiced, register-matched prose at entry and closure moments: `episode_opening`, `entry_prompts`, `consensus_check`.

**Constraints.** Matches the story's declared `pedagogical_register`. No framework terminology in student-facing text. Does not produce ladder or cue content.

### 3.4 The discussion agent

**Input.** `episode.yaml`, `transcript.yaml`, `ground_truth.yaml`, `diagnostic.yaml`, `prose.yaml`, the story design doc, and reference files.

**Output.** `discussion.yaml` (schema in §2.5).

**Cognitive job.** Generate voiced, distributable, creatively varied group-phase primitives across three creative axes, indexed so the app can match them to each student's individual-phase work.

**Constraints.** Does not alter upstream files. Persona-projected cues must honor character voices. Cues with the same `angle` must carry substantive `independent_of` entries. Every present/afforded-missing intervention cell must have a matching-angle cue. Every passage must have at least one `continuation_of: null` cue per lens with `affordance ∈ {moderate, rich}`.

### 3.5 The package reviewer

**Input.** All four authored files plus the episode plan and story frontmatter.
**Output.** `ACCEPT` or `REVISE` with structured findings.

**Review criteria (judgment-only; mechanical checks are enforced by the merge script):**

*Analyst:*
1. Near-miss discriminability — non-hand-wavy `why_wrong`.
2. Multiple forces listed when evidence supports them.
3. Counterfactual specificity — concrete change to the cited turn.
4. Analyst vs. upstream `transcript_reviewer` reconciliation.

*Diagnostic:*
5. Intervention cell specificity — passage-specific, not generic. Afforded-missing cells held to highest bar.
6. Ladder calibration — monotonic in `reveals`, early rungs direct attention, bottom rungs reveal.
7. Probe option coverage — all three roles plus blank-page escape.
8. Explanation-depth opt-in judgment — depth where "why" is load-bearing.
9. `struggle_calibration` differentiation across passages.
10. `reviewer_flags[]` adjudication.

*Prose:*
11. Register matching.
12. Grade-appropriate voice.

*Discussion:*
13. Creative-axis independence.
14. Persona voice fidelity.
15. Creative non-convergence (cross-episode).
16. Cross-phase continuity coverage.

*Cross-agent:*
17. Block orthogonality — no content in two files that should be one.

### 3.6 Why four agents

The four authoring agents split on the deepest cognitive-job boundary: **what the agent needs to hold in mind.**

- **Analyst** holds the framework vocabulary and the transcript.
- **Diagnostic agent** holds the student error model.
- **Prose agent** holds the story's voice and register.
- **Discussion agent** holds character canon and the three-axis creative surface.

**Four is also the maximum.** Any further LLM work any app needs lives at the app layer under Rule 12.

### 3.7 Coordination rules

1. **Files, not inline.** Every agent reads inputs from files and writes output to one file.
2. **Sequential execution.** `/build_assistive_package` runs analyst → diagnostic → prose → discussion. The sequence matters because prose reads diagnostic for register, and discussion reads both.
3. **All agents see the full transcript.**
4. **No agent-to-agent dialogue.** If the reviewer flags a contradiction, re-run the affected agent.
5. **The reviewer runs once at the end, reading all four files.**
6. **The merge script runs only after the reviewer returns ACCEPT.**

### 3.8 Claude Code surface mapping

| Slash command | Subagents (sequential) | Deterministic steps | Output files |
|---|---|---|---|
| `/create_episode {story} {NN}` | `planning_agent` → `validation_agent` → `projection_reviewer` | `validate_schema.py` | `episode.yaml`, `episode_writer_input.yaml` |
| `/create_transcript {story} {NN}` | `dialog_writer` (barrier-isolated) → `transcript_id` → `transcript_reviewer` | — | `transcript.yaml` |
| `/build_assistive_package {story} {NN}` | `analyst_agent` → `diagnostic_agent` → `prose_agent` → `discussion_agent` → `package_reviewer` | `merge_assistive_package.py`, `validate_schema.py` | `ground_truth.yaml`, `diagnostic.yaml`, `prose.yaml`, `discussion.yaml`, `assistive_package.yaml` |

**Bootstrap.** `initialize_polylogue.py` clears `.claude/commands/` and `.claude/agents/`, then syncs shared-pipeline files plus app-specific files when `--app` is provided.

---

## 4. Story-level capability declarations

The story design doc's frontmatter carries capability flags that the pipeline reads and honors. Governance Rule 2 requires that every flag earn its place against a creative choice multiple stories actually make.

**Coverage and inventory flags:**

- `coverage_mode: focused | comprehensive`
- `declared_facets: [...]`
- `declared_cognitive_patterns: [...]`
- `declared_social_dynamics: [...]`

**Creative-choice flags:**

- `pedagogical_register: unfinished_not_wrong | neutral` (default: `neutral`) — shapes prose and discussion agents' tone.
- `uses_character_growth: true | false` (default: `false`) — enables `growth_beats` and `character_arc_position`.
- `declares_calibration_warnings: true | false` (default: `false`) — enables merge-script lifting of author-written calibration warnings.
- `uses_stance_positions: true | false` (default: `false`) — enables `stance_positions[]` per passage.
- `supports_jigsaw: true | false` (default: `false`) — enables `discussion.jigsaw_fragments[]`.

---

## 5. Governance rules

Twelve rules the pipeline is accountable to, and which apply to any future extension.

### Rule 1 — Every required field traces to a justified source
Every required field must trace to a framework affordance or a well-validated instructional strategy; otherwise gate it behind a capability flag or remove it.

### Rule 2 — Creative choices are opt-ins, not defaults
Content that depends on a creative choice some story might not make goes behind a capability flag.

### Rule 3 — Light usage is valid
The reviewer checks well-formedness of what is present, not exercise of the full machinery. A lens with `affordance: thin` is thinness (protected); `(engagement: none, affordance: rich)` is a gap (the reviewer's urgent case).

### Rule 4 — The pipeline supports, does not compel
The pipeline produces primitives; no app is required to use them in those ways. **Corollary:** the pipeline authors no block whose correct operation requires runtime NLP, affect detection, or pattern matching of student prose. Detection is app-owned; content is pipeline-owned; routing is student-owned via probe taps.

### Rule 5 — Redundancy is an error, not a feature
Two blocks holding the same content in different wrappings means one is wrong.

### Rule 6 — Turn anchors are mandatory
Every annotation must cite turn IDs. The primary intervention key is `(turn, facet)`.

### Rule 7 — IDs are hidden; labels are student-facing
Machine-readable fields use canonical IDs from `framework/reference/`. Student-facing fields use labels from `apps/lens/docs/teacher-overview.md`.

### Rule 8 — Agent roles are pure
Each authoring agent produces only its own content kind. The analyst does not speculate about students. The diagnostic agent does not invent ground truth. The prose agent does not author ladders. The discussion agent does not author diagnostics.

### Rule 9 — App contracts are read-only consumers
Contracts narrow what an app uses; they cannot constrain what the pipeline produces.

### Rule 10 — Contracts are optional
An app may consume `assistive_package.yaml` directly without a contract document.

### Rule 11 — One cognitive job per agent; one agent per file
Adding a new intelligent capability means adding an agent and a file; removing one means deleting an agent and a file.

**Corollary 1 — Deterministic work stays deterministic.** Merging, aggregation, and integrity checks are never placed inside an agent.

**Corollary 2 — Different failure modes mean different agents, even with shared context.**

**Iteration-frequency tiebreaker.** When a new capability's failure mode overlaps with two existing agents, prefer adding a new agent if it is expected to iterate more frequently.

### Rule 12 — Apps own everything app-specific; the framework stops at the handoff
The universal pipeline ends at `assistive_package.yaml`. App-layer work lives under `apps/{app_id}/pipeline/`. Apps may not write outside their `{app_id}/` directory, modify universal artifacts, depend on another app's outputs, or use contracts to constrain the pipeline.

---

## 6. Risks

- **Over-engineering.** Every new field pressures the governance rules. Mitigation: Rule 1 plus hand-authoring as forcing function.
- **Click-a-turn UX dependency.** The per-turn intervention dictionary assumes students click turns. If the affordance is not visible, L3 never activates. App-layer concern but load-bearing.
- **Probe option quality.** Routing is only as good as options. Blank-page ladder must be substantive.
- **Struggle calibration needs empirical tuning.** First episodes will feel too strict/generous.
- **Agent role impurity.** The diagnostic agent might invent ground truth if analyst output is thin. Mitigation: explicit prompt prohibition plus `reviewer_flags[]`.

**Non-goals:** Reasoning Lab migration (deferred under Rule 12). Runtime LLM calls. Runtime NLP or affect detection. Teacher-facing surface (deferred). Cross-story threading. Real-time analytics.

---

## Appendix A — Traceability matrix

| Required field | Source | Agent | Layer |
|---|---|---|---|
| `facets_present[]` | Affordance 1 | analyst | L1 |
| `facets_absent_but_tempting[]` | Affordance 1 + three-role surface | analyst | L1 |
| `lens_visibility` | Affordance 3 | analyst | L1 |
| `turn_annotations[]` | Rule 6 | analyst | L1 |
| `turn_annotations.discussion_cue_seeds[]` | Group-phase raw material | analyst | L1 |
| `causal_layer` | Affordance 2 | analyst | L1 |
| `perspective_transitions[]` | Affordance 3 | analyst | L1 |
| `counterfactuals[]` | Worked-examples default | analyst | L1 |
| `connects_to` | Spaced-practice default | analyst | L1 |
| `turn_annotations.causal_signals` (derived) | Affordance 2 at turn granularity | merge script | L1 |
| `prior_exposure` (derived) | Faded-assistance + spaced-practice | merge script | L1 |
| `probes.facet.by_turn[T]` | Student-owned routing; Affordance 1 | diagnostic | L3 |
| `probes.explanation.by_turn_facet[T][F]` (opt-in) | Affordance 2; elaborative interrogation | diagnostic | L3 |
| `interventions.by_turn[T].by_facet[F].role` | Affordances 1 and 3 | diagnostic | L3 |
| `interventions.*.ladder[]` | Productive-struggle + faded-assistance | diagnostic | L3 |
| `interventions.*.has_explanation_depth` | Elaborative interrogation | diagnostic | L3 |
| `interventions.*.explanation` | Affordance 2 reactive | diagnostic | L3 |
| `struggle_calibration` | Productive-struggle (pricing knob) | diagnostic | L3 |
| `assumes_familiar_with[]` / `introduces[]` | Faded-assistance | diagnostic | L3 |
| `response_space.by_lens` (scratch) | Audit trace | diagnostic | L3 |
| `episode_opening` | Priming / engagement | prose | L2 |
| `entry_prompts[]` | Faded-assistance; cognitive-load reduction | prose | L2 |
| `consensus_check[]` | Affordance 1 at group closure | prose | L2 |
| `discussion_cues[]` | Affordance 3 + peer discussion | discussion | L2 |
| `talk_moves[]` | Structured-peer-discussion | discussion | L2 |
| `jigsaw_fragments[]` (flag-gated) | Structured-peer-discussion | discussion | L2 |

Every field traces to an affordance or instructional default, lives in one agent's output, at one layer.
