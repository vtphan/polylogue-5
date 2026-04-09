# Pipeline Revision Plan: An Assistive Package for Non-AI Applications

**Status.** Draft for review. Not yet approved for implementation.
**Audience.** Pipeline maintainers, app builders, instructional-design reviewers.
**Scope.** Lens application. Reasoning Lab is deferred (see §7).

> **What this document is.** The working specification and revision sequence: field-level schemas for the assistive package, capability-flag declarations, the end-to-end stage plan, risks and open questions, and the diff against the current pipeline. This is the document consulted field-by-field during agent prompt authoring, schema authoring, and reviewer checks.
>
> **Where to find the architectural argument.** Why this revision exists, the pedagogical commitments that ground every required field, the four-agent architecture and why four, and the full governance-rule treatment with worked examples and rationale all live in `pipeline-architecture.md`. Section numbering is preserved across both documents, so gaps here (there is no §0, §1, §3, §6) correspond to sections that live in the memo. Appendix C below provides a one-page operational reference to the twelve governance rules with cross-references into the memo.

---

_Sections §0, §1, §3, §6, and Appendix A have been relocated to `pipeline-architecture.md`. Numbering is preserved across both documents; this file begins at §2. See Appendix C below for the operational governance-rule reference._

## 2. The assistive package

The pipeline produces four authored files per episode plus one merged file. The four authored files are each written by one agent with one cognitive job; the merged file is produced by a deterministic Python script.

### 2.1 `ground_truth.yaml` — what the analyst produces

Per-passage content grounded in Affordances 1 and 2 and the cross-lens source of Affordance 3. The analyst works from the episode plan and the enumerated transcript. It is analytical, not pedagogical — it does not speculate about what students will say. Its job is accuracy.

**Required blocks:**

- `facets_present[]` — every facet exhibited in the passage, with `facet_ref` (canonical ID), `label` (student-facing language from `teacher-overview.md`), `lens`, `role` (`primary | cross_lens | strength`), `severity` (`strong | moderate | subtle`), `evidence_turns[]`, and `one_line` description. When the same move is simultaneously a character growth beat and a facet instance, `role` is a list, not a single value.
- `facets_absent_but_tempting[]` — the discrimination surface. Facets that look like they might apply but don't, each with `why_tempting` and `why_wrong`. At least one entry per passage where any discrimination is possible.
- `lens_visibility` — per-lens `signal` (`weak | moderate | strong`) and `what_shows` description. This is how the app decides which lens transitions are pedagogically meaningful.
- `turn_annotations` — per-turn inverse index: `speaker`, `moves[]`, `facet_signals[]` (with polarity and strength), `why_it_matters`, and `discussion_cue_seeds[]`. The seeds are a shallow enumeration of creative directions this turn could support (e.g., `[source_credibility, authority_deference, counterfactual_what_if]`) — raw material for the discussion agent, not student-facing prose. Authored by the analyst cheaply because it is an enumeration of its own annotations. Only turns inside the passage's `turn_range` are annotated.
- `causal_layer` — per-passage; see §2.2.
- `causal_layer_episode` — a short episode-scoped block listing cognitive patterns and social dynamics that recur across passages, with a one-sentence arc of the episode's reasoning. Feeds episode-scoped discussion primitives and sharpens `connects_to.echoes` across episodes.
- `perspective_transitions[]` — directional pairs between lenses: `from`, `to`, `trigger`, `what_they_gain`, `what_they_realize`, `prompt`. Required on every passage.
- `counterfactuals[]` — per facet present, a one-sentence "what would fix this in the specific passage." **Quality bar:** every entry must cite at least one `evidence_turn` from the passage AND name a specific change to that turn's content. Generic prescriptions are rejected by the reviewer.
- `connects_to` — cross-passage threading: `echoes[]`, `contrasts[]`, `sets_up[]`. Each `contrasts[]` entry additionally carries a `contrast_prompt` — one student-facing sentence asking the student to compare the two passages on a specific dimension grounded in the analytical difference. A student-facing *question* grounded in analytical comparison is within the analyst's role purity; predictions about student responses remain exclusively downstream work.

**Enforcement.**

- Every entry uses the canonical ID from `framework/reference/`. The literal-scan validator catches deviations.
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

### 2.3 `diagnostic.yaml` — what the diagnostic agent produces

Per-passage content for everything that requires a student error model: the response space, `next_move` on every reading, the hint ladder, struggle calibration, stall signals, and teacher-facing divergence guidance. The diagnostic agent works from the episode plan, the enumerated transcript, the ground truth file, the story position object, and the canonical reference files. Its cognitive job is *hold a student error model in mind and write the calibrated responses to foreseeable stuck states.*

**Required blocks:**

- `response_space.by_lens.{logic, evidence, scope}` — per lens, four categories of reading. **Every entry across all four categories carries a `next_move` field** — a single-sentence prompt the app delivers when a student's actual writing pattern-matches to that entry.
  - `likely_readings[]` — things students will actually say. Each has `text`, `quality` (`surface | partial | completed`), `maps_to_facet`, `rationale`, and `next_move`.
  - `partial_readings[]` — half-right readings. Each has `text`, `what_they_got`, `what_they_miss`, and `next_move`.
  - `misreadings[]` — wrong-but-tempting readings. Each has `text`, `why_tempting`, `why_wrong`, and `next_move`.
  - `blindspots[]` — what most students won't notice. Each has `text`, `next_move`, and **`recommended_lens_switch`** — a precomputed "if stuck, try this lens instead" routing so the non-AI app can recommend lens changes without inference.

  **Minimum per lens:** at least one entry in each of the four categories, unless the lens's `signal` in `ground_truth.lens_visibility` is `weak`, in which case `likely_readings` may be empty and `blindspots` must carry the content.

- `response_space.explanation_quality` — for the "why did they reason this way" articulation. Structured by three causal categories (`cognitive`, `social`, `interaction`), each with two quality levels (`surface`, `worked_through`), each with at least one example text and a rationale.

- `attention_cues[]` — the graduated hint ladder. Each rung has `level`, `text` (directs attention without giving an answer), `cost`, and `appropriate_for` (list: `early | mid | late`). Minimum two rungs. The final rung may be the AI perspective reveal.

- `stall_signals` — `productive` and `stalled` prose descriptions, `unstall_moves` per lens, and `silence_breakers[]` — a short ordered list of minimally invasive nudges the app fires on silence timers *before* spending a lifeline hint.

- `struggle_calibration` — productive-struggle metadata: `difficulty` (`generous | standard | strict`), `productive_duration` (`short | moderate | long`), `danger_signals[]`, `minimum_wrestling[]`.

- `expected_divergence[]` — anticipated class disagreements. Each entry has `split`, `both_legitimate` (boolean), `productive_question` (teacher-facing), and `classroom_move` — one concrete sentence of teacher action that turns the disagreement into practice. This block is diagnostic of class dynamics even though its audience is the teacher; it belongs in the diagnostic agent because it requires predicting student error patterns at group scale.

- `assumes_familiar_with[]` and `introduces[]` — at passage level. Inform the app's faded-assistance filtering.

**Conditionally required blocks** (populated only when the story's frontmatter declares the relevant capability — see §4):

- `growth_beats` / `character_arc_position` — only when `uses_character_growth: true`.
- `stance_positions[]` — only when `uses_stance_positions: true`.

### 2.4 `prose.yaml` — what the prose agent produces

Short, voiced, register-matched student-facing prose at the entry and closure moments of the student arc. The prose agent works from the episode plan, the enumerated transcript, `ground_truth.yaml`, `diagnostic.yaml` (for register consistency with `next_move` prose), the story design doc (for voice and register), and reference files. Its cognitive job is *write short, voiced, register-matched prose at the entry and closure moments.*

**Required blocks:**

- `episode_opening` — one paragraph, student-facing, written in the story's declared `pedagogical_register`. Sets the narrative scene for the episode and ends with a non-leading "what to watch for" sentence that primes attention without naming facets, patterns, or dynamics. The non-AI app shows this *before* the discussion loads. Barrier-safe: no framework terminology.

- `entry_prompts[]` — per passage, per lens. One-sentence starter stems a student can adopt verbatim if they can't begin: "I noticed that in turn ___, ___ assumes ___." These scaffold writing production and do not reveal the observation. Distinct from `attention_cues` (which direct attention in the diagnostic agent's hint ladder).

- `consensus_check[]` — 1–2 short questions the app asks after group discussion ("Did your group decide whether the article was good evidence? If not, what's the sticking point?"). Drives closure and exposes group stall.

- `group_stall_signals` — parallel to the diagnostic agent's individual `stall_signals`, but describing what a stuck *group* looks like (one voice dominating, agreement-without-engagement, off-topic drift) with `unstall_moves` the app can push to the group's screen. Needed for small-group work where no teacher is present at the moment of stall.

- `causal_discussion_prompts[]` — group-facing student prompts seeded from `causal_layer.interaction` values, operationalizing Affordance 2 at the group level ("Your group has to decide — did she accept the article because of how she thinks, because of who was in the room, or both?").

**Why these cluster together.** All five blocks are voiced short prose that does not depend on a student error model — they depend on register, character voice, and story context. The failure modes are the same across all five (adult-sounding, off-register, generic). They do not require the diagnostic muscle and do not require the generative-creative three-axis work; they are the "what does this sound like at the edges of the activity" work.

### 2.5 `discussion.yaml` — what the discussion agent produces

Student-facing group-phase distributable primitives, generative-creative, produced across three creative axes. The discussion agent works from the episode plan, the enumerated transcript, `ground_truth.yaml`, `diagnostic.yaml`, `prose.yaml` (for register and voice consistency), the story design doc (for character voices and the three-axis persona projection), and reference files. Its cognitive job is *generate voiced, distributable, creatively varied group-phase primitives across three axes.*

**Required blocks:**

- `role_cards[]` — per passage, one card per lens (up to 3), each with a one-sentence stance grounded in that lens's `what_shows`, plus a sentence stem ("From a Logic view, I think ___ because ___"). The app deals these to students so groups start with **guaranteed disagreement**. This is the single highest-leverage addition for "minimizing stuck groups."

- `discussion_cues[]` at turn scope — keyed by turn ID. A structured set per turn:

  ```yaml
  discussion_cues:
    by_turn:
      t6:
        - id: t6_c1
          text: "Mira said the article was from a real magazine. Bring this to your group: is 'real magazine' enough to trust something?"
          angle: source_credibility
          lens: evidence
          axis: lens_refraction
          independent_of: []
        - id: t6_c2
          text: "Right after Mira spoke, nobody pushed back. Ask your group why."
          angle: authority_deference
          lens: logic
          axis: lens_refraction
          independent_of: []
        - id: t6_c3
          text: "If Priya were here, what would she ask about what Mira just said?"
          angle: source_credibility
          lens: scope
          axis: persona_projection
          persona: priya
          independent_of: [t6_c1]
        - id: t6_c4
          text: "Defend the opposite: argue that Mira was right to trust the article. What would you need to believe?"
          angle: source_credibility
          lens: evidence
          axis: stance_inversion
          independent_of: [t6_c1]
  ```

  **Three creative axes:**
  1. **Lens refraction** — the same observation viewed through a different related lens.
  2. **Persona projection** — "what would character X ask?" or "what would absent character Y ask?" This axis resolves the §7.3 meaningful-absences open question: absence earns its operationalization here as a cue-generation hook rather than as an analytical schema field.
  3. **Stance inversion** — "defend the opposite."

  **Minimum cue count per turn** is computed mechanically by the merge script as the number of distinct angles the analyst's `facet_signals` and inverted `causal_layer` support for that turn. Thin turns get few cues and that is correct (Rule 3). Dense turns earn more. No flat quota.

  **Distribution contract.** The app may partition cues across students working on the same turn (non-overlap by `angle` + `independent_of`), double up when students outnumber cues, or fall back to `episode_cues[]` when a student has no turn-scoped anchor. The pipeline exposes enough metadata for both "more students than cues" and "more cues than students" cases without runtime inference.

- `episode_cues[]` — 3–4 episode-scoped cues for students who didn't establish turn-level footing, plus whole-class closing prompts. Can hook into `causal_layer_episode`.

- `talk_moves[]` — 4–6 grade-calibrated sentence stems ("I disagree with ___ because…", "Building on ___…"). Episode-level.

- `jigsaw_fragments[]` (capability-flagged; only when `supports_jigsaw: true`) — per-lens micro-briefs for jigsaw-pattern activities. Sourced from `lens_visibility.what_shows`.

### 2.6 `assistive_package.yaml` — the merged view the app reads

A mechanical concatenation of `ground_truth.yaml`, `diagnostic.yaml`, `prose.yaml`, and `discussion.yaml`, plus cross-reference integrity checks and deterministic derivations. Produced by a Python merge script, not an LLM. This is the single file the Lens app consumes.

**The merge script computes these deterministic blocks:**

1. `prior_exposure` — per passage, the list of facets/patterns/dynamics the student has already encountered in prior episodes (each with `first_seen: episode_NN`). Derived from the story's episode sequence and the per-episode ground truth files.

2. `turn_annotations[].causal_signals` — inverted from `causal_layer[].evidence_turns` so each turn carries the list of cognitive patterns and social dynamics it exhibits. Free consistency guarantee with the passage-level causal layer.

3. `calibration_warnings[]` — when `declares_calibration_warnings: true`, the merge script parses a `## Calibration warnings` section from the story design doc and lifts each entry verbatim. No LLM paraphrase.

4. `discussion_cues[]` **minimum-count enforcement** — for every turn, the script computes the distinct-angle set from the analyst's annotations and verifies `len(cues_for_turn) ≥ angle_count`. Mechanical check, no judgment.

**The merge script enforces:**

- Every `response_space` entry's `maps_to_facet` exists in `ground_truth.facets_present` for the same passage.
- Every `attention_cues` rung's target lens corresponds to a lens with `signal ≥ moderate` in `lens_visibility`.
- Every `prior_exposure` reference points at a facet/pattern/dynamic in the canonical inventory.
- Every `causal_layer.interaction` value is the enumerated set, and `cognitive_only` appears only for `relevance` and `inferential_validity`.
- Every `appropriate_for` tag uses the enumerated story-position values.
- Every turn reference in any block is a valid turn in the transcript.
- Every `diagnostic.assumes_familiar_with[]` reference resolves to a facet/pattern/dynamic in `prior_exposure` for the same passage.
- Every `counterfactuals[]` entry cites at least one `evidence_turn` inside the passage's `turn_range`.
- **Response-space category completeness** per lens, subject to the weak-signal exception.
- **`next_move` presence** on every response-space entry (string-length check).
- **`episode_opening` presence** with no reserved framework terms (literal-scan).
- **`contrast_prompt` presence** on every `connects_to.contrasts[]` entry.
- **`classroom_move` presence** on every `expected_divergence[]` entry.
- **Discussion cue minimum count** per turn (per above).
- **`role_cards[]` lens validity** — each card's lens has `signal ≥ moderate`.
- **Discussion literal-scan** — no reserved framework IDs leak into student-facing cue text, role cards, or talk moves.

If any check fails, the merge script exits with an error and the episode is not considered complete. No manual override.

### 2.7 What changed from the current five-file structure

| Current field | Disposition under the revision |
|---|---|
| `analysis.yaml` → `ai_perspective.through_{lens}` | `ground_truth.lens_visibility` + `perspective_transitions` |
| `analysis.yaml` → `ai_perspective.why_it_happened` | `ground_truth.causal_layer` with required `interaction` |
| `analysis.yaml` → `diversity_potential.likely_student_observations` | `diagnostic.response_space.by_lens.{likely_readings, blindspots}` |
| `scaffolding.yaml` → `scaffold_sequence` (hints) | `diagnostic.attention_cues` with `appropriate_for` tags |
| `scaffolding.yaml` → `deepening_probes` | Subsumed by `response_space.*.next_move` |
| `scaffolding.yaml` → `common_misreadings` | `diagnostic.response_space.by_lens.misreadings` |
| `scaffolding.yaml` → `observation_rubric` | `diagnostic.response_space.by_lens.likely_readings` with `quality` tags |
| `scaffolding.yaml` → `explanation_rubric` | `diagnostic.response_space.explanation_quality` |
| `facilitation.yaml` → `productive_questions` | `diagnostic.expected_divergence.productive_question` |
| `facilitation.yaml` → `watch_for`, `if_students_are_stuck` | `diagnostic.stall_signals` + `struggle_calibration` |
| `facilitation.yaml` → `likely_disagreements` | `diagnostic.expected_divergence` |
| *(new)* | `prose.episode_opening`, `prose.entry_prompts`, `prose.consensus_check`, `prose.group_stall_signals`, `prose.causal_discussion_prompts` |
| *(new)* | `discussion.role_cards`, `discussion.discussion_cues` (three axes), `discussion.episode_cues`, `discussion.talk_moves`, `discussion.jigsaw_fragments` |

Six overlapping pairs from the earlier audit collapse into one-source-of-truth blocks. No content is lost; content is reorganized, deduplicated, and extended with the group-phase primitives the Lens app needs.

### 2.8 The handoff to apps

`assistive_package.yaml` is the universal pipeline's terminal artifact. After it is written, the framework's responsibility for the episode ends. Anything an app does with the package happens in the app's own layer, governed by Rule 12 (full treatment in `pipeline-architecture.md` §6; one-line operational statement in Appendix C below).

**The handoff contract** is deliberately narrow:

- The universal pipeline never reads or writes anything under `artifacts/{story_id}/episodes/episode_{NN}/{app_id}/`. That subdirectory is reserved for app outputs.
- Once `/build_assistive_package` completes, the four authored files and the merged package are frozen. No app-layer step writes back into them.
- An app that wants to formalize what it consumes from the package *may* write a contract document at `apps/{app_id}/docs/package-contract.md`. Contracts are read-only consumers (Rule 9): they narrow what the app uses, they do not constrain what the pipeline produces. When an app's contract surfaces `contract_violations[]` that recur across episodes or apps, that is the upstream-communication channel telling the framework something needs to move into the universal package.
- An app that needs no contract does not write one. The universal pipeline's success criteria never reference any app-side artifact.

The framework does not specify what commands, subagents, or scripts an app uses to consume the package, or whether the app uses Claude Code at that layer at all. Those are app-designer decisions, described only by Rule 12's boundary conditions. See `pipeline-architecture.md` §3.6 for why the framework stops at four authoring agents and `pipeline-architecture.md` §6 Rule 12 for the full scope statement on the app layer.

---

## 4. Story-level capability declarations

The story design doc's frontmatter is extended with a small set of capability flags that the pipeline reads and honors. The governance rule in `pipeline-architecture.md` §6 (Rule 2; see also Appendix C below) requires that every flag earn its place against a creative choice multiple stories actually make.

**Existing flags (unchanged):**

- `coverage_mode: focused | comprehensive`
- `declared_facets: [...]`
- `declared_cognitive_patterns: [...]`
- `declared_social_dynamics: [...]`

**New flags:**

- `pedagogical_register: unfinished_not_wrong | neutral` (default: `neutral`) — shapes the prose and discussion agents' prose tone. Additional values are added only when a second story concretely claims them.

- `uses_character_growth: true | false` (default: `false`) — when `true`, the diagnostic agent populates `growth_beats` at episode level and `character_arc_position` at passage level.

- `declares_calibration_warnings: true | false` (default: `false`) — when `true`, the merge script lifts author-written calibration warnings from the story design doc prose into structured `calibration_warnings[]` entries.

- `uses_stance_positions: true | false` (default: `false`) — when `true`, the diagnostic agent populates `stance_positions[]` per passage.

- `supports_jigsaw: true | false` (default: `false`) — when `true`, the discussion agent populates `discussion.jigsaw_fragments[]`. Short passages without enough cross-lens content to split three ways set this `false`.

**The governance rule** (Rule 2; full treatment in `pipeline-architecture.md` §6): a new flag is added only when at least two distinct stories would use it differently, and the gated content cannot reasonably live in the default schema. The same rule applies to enum values, not just flags.

---

## 5. End-to-end revision sequence

The universal pipeline is seven stages; it ends at `assistive_package.yaml` and is fully app-agnostic. App-specific work lives in a separate per-app track that runs after the universal pipeline lands and never blocks it. Each universal stage has a gate review; stages 4 and 6 have architecture reviews in addition.

**Resolved before Stage 1 begins:** the granularity of `turn_annotations` (Open Question 7.3). Resolution: a one-hour spike on Overton Park episode 3's densest passage, hand-annotating under both the every-turn and load-bearing-turns-only policies, comparing analyst output token counts and the downstream app's ability to render turn-level UIs without inference. The cheaper policy wins unless the richer one unlocks a concrete UI affordance the app actually needs.

### Stage 1 — Schema-first hand authoring

**Action.** Write `ground_truth.schema.yaml`, `diagnostic.schema.yaml`, `prose.schema.yaml`, and `discussion.schema.yaml` as formal YAML schemas. Hand-author all four files for **one existing episode** — whichever in the current corpus most densely exercises the schema's hardest fields. At the time of writing, that is Overton Park episode 3.

**Forcing function.** For every field, ask: "could a non-AI app render or use this without further inference?" If not, fix the schema.

**Exit criterion.** A human can fill every required field without hand-waving. No agent work begins until hand-authoring is clean.

**Authorship discipline.** Hand-authored gold files must be committed *before* the agent prompts are written, ideally by a different operator than the prompt author, to prevent Stage 2–5 success criteria from degrading into self-grading.

**Gate review — schema reality check.** Does the schema survive contact with real content? Write findings as a short report; update the schema and the plan in response.

### Stage 2 — Analyst agent

**Action.** Port the existing `evaluator` prompt into the new analyst role, stripping all pedagogical speculation. Run it on the same episode as Stage 1. Diff against the hand-authored ground truth.

**Exit criterion.** ≥90% of hand-authored `facets_present` entries are produced by the analyst with matching `facet_ref` and at least one overlapping `evidence_turn`; zero hallucinated facets; 100% of analyst turn citations resolve to real turns; every `causal_layer` entry has a populated enumerated `interaction` field; `causal_layer_episode` is present and synthesized across passages; `discussion_cue_seeds[]` is populated on every load-bearing turn.

**Gate review — analyst fidelity.** Where does the agent over- or under-reach?

### Stage 3 — Diagnostic agent

**Action.** Write the diagnostic agent prompt from scratch. Do not adapt the old evaluator. Run on the same episode, reading the stage-2 analyst output from file.

**Exit criterion.** Response-space entries are specific enough that a 6th-grade teacher would recognize their students. Hints direct attention without revealing observations. `next_move` on every entry is non-generic. `recommended_lens_switch` populated on every blindspot.

**Gate review — diagnostic specificity.** Sample five entries per category; mark each as "passage-specific" or "generic." ≥80% passage-specific to pass.

### Stage 4 — Prose agent

**Action.** Write the prose agent prompt, taking the story design doc as an explicit read-only input. Run on the same episode, reading stage-2 and stage-3 outputs.

**Exit criterion.** `episode_opening` sets scene in declared register with no framework leakage. Sampled `entry_prompts`, `consensus_check`, and `causal_discussion_prompts` sound like something a 6th grader could say or read.

**Gate review — pedagogical register.** Sample five entries per block; mark each as "student-sounding" or "adult-sounding." ≥80% student-sounding to pass. Confirm register matches the story's declared value.

**Architecture review.** After stage 4 is the first point at which the analyst + diagnostic + prose chain has run end-to-end on a real episode. Questions:

1. Does the three-affordance-at-three-scales spine in `pipeline-architecture.md` §1.2 still hold?
2. Does the block structure feel orthogonal in practice, or are fields accidentally drifting between the diagnostic and prose files?
3. Are the governance rules in `pipeline-architecture.md` §6 being respected?

Findings may revise `pipeline-architecture.md` §1, or this document's §2 or §4, before stage 5 proceeds.

### Stage 5 — Discussion agent

**Action.** Write the discussion agent prompt. Run on the same episode, reading stage-2, stage-3, and stage-4 outputs. This is the first test of the three-axis creative surface.

**Exit criterion.** Every load-bearing turn meets the mechanical cue-count floor (≥ distinct angles). Sampled cues exercise at least two of the three axes across the episode. Role cards are produced per lens where `signal ≥ moderate`. Persona-projected cues honor established character voices.

**Gate review — creative generativity.** Does the discussion agent sound like it's *generating*, or paraphrasing ground truth? Sample ten cues; mark each as "generative" or "paraphrase." ≥70% generative to pass (lower bar than the register check because paraphrase is less damaging than adult-sounding — but still a bar).

### Stage 6 — Package reviewer + second-episode unassisted run

**Action.** Write the package reviewer agent based on failures actually observed in stages 2–5, not imagined failures. Seed it with four deliberately broken packages (hallucinated facet, missing interaction, generic diagnostic prose, cues collapsing under cosmetic variation) and verify it catches each. Then run the full pipeline (analyst → diagnostic → prose → discussion → reviewer → merge) on a **fresh episode**, with no manual intervention between agents.

**Exit criterion.** Reviewer catches all seeded broken cases. Full pipeline produces `assistive_package.yaml` that passes all merge-script integrity checks and all thirteen reviewer criteria with no operator intervention. Cross-episode mode runs across episodes 1 and 2 and passes: `connects_to` references resolve, `pedagogical_register` does not drift, and creative non-convergence (criterion 12) holds for the discussion agent's output.

**Architecture review.** Same questions as stage 4, now with a more complete dataset. Did the second-episode run surface issues the first hid? Any cross-episode interactions missed?

### Stage 7 — Contrast-case run

**Action.** Run the full pipeline on a creatively distinct story — ideally one that opts *out* of several capability flags the stage-1 story opts *into*. At current state of the corpus, `saving-the-maker-space` is the candidate; a minimal hand-authored contrast story would be better.

**Exit criterion.** Contrast story produces a valid assistive package with correctly-absent conditional blocks. The reviewer does not flag the absence of conditional content as under-specification. The prose and discussion agents honor the contrast story's `pedagogical_register` if it differs.

**Gate review — capability-declaration respect.** Every conditional block is populated iff its flag is true.

Stage 7 is the end of the universal pipeline.

### App-layer work (per app, after the universal pipeline)

After the universal pipeline lands and the first real episode is packaged, each app that wants to consume the package does whatever work that app needs per Rule 12. The framework plan does not specify app-layer stages, commands, or file shapes; each app's `apps/{app_id}/RUNNING.md` documents its own sequence. At a minimum, migrating from the legacy `analysis.yaml` / `facilitation.yaml` / `lens/scaffolding.yaml` / `lens/facilitation.yaml` fields to reading `assistive_package.yaml` is an app-owned task, governed by Rule 12 and recorded in the app's own documentation.

---

## 7. Non-goals, risks, and open questions

### 7.1 Non-goals

- **Reasoning Lab migration is deferred but not evasive.** Under the projection-layer architecture, Reasoning Lab's path forward is principled: when the team is ready, it gets `apps/reasoning-lab/docs/package-contract.md` and its own projector run. Any gaps surface as `contract_violations[]`.
- **Runtime LLM calls from the app.** The Lens app is non-AI by design. Every intelligent operation is precomputed.
- **Adaptive runtime behavior beyond what metadata permits.** The pipeline provides position tags, struggle calibration, prior exposure, and distribution-ready cue metadata. The app may use these to adapt but owns its state machine.
- **Cross-story threading.** Within-episode and within-story threading only.
- **Teacher-authored overrides.** The package is read-only on the teacher side in this revision.
- **Real-time analytics infrastructure.** Out of scope here.

### 7.2 Risks

- **Over-engineering risk (highest).** Every new field is pressure on the governance rules (`pipeline-architecture.md` §6; Appendix C below). Mitigation: rule 1 applied to every proposed field; stage 1 hand-authoring as the forcing function.
- **Agent prompt drift.** The diagnostic and discussion agents do cognitively demanding work that is easy to get wrong. Mitigation: reviewer criteria 5–12 and stage 3/4/5 architecture reviews.
- **Pedagogical register leakage.** Prose agent might accidentally write in a register other than the one declared. Mitigation: reviewer criterion 8 and stage 4 gate review.
- **Discussion agent template convergence.** Generative agents can fall into stylistic ruts over repeated runs. Mitigation: reviewer criterion 12 in cross-episode mode during stage 6.
- **Corpus bias.** Testing only on Overton Park risks baking in its choices. Mitigation: stage 7 contrast-case run.
- **Agent role impurity.** The diagnostic agent might invent ground truth if the analyst's output looks thin. Mitigation: explicit prompt prohibition plus `reviewer_flags[]` adjudication (criterion 7).
- **Schema version drift vs. agent prompts.** If a schema field changes and the prompt is not updated in the same commit, the agent produces broken output. Mitigation: each schema file carries a `schema_version`, each agent prompt declares the `schema_version` it targets, and a one-line assertion in `validate_schema.py` fails when they disagree.

### 7.3 Open questions

- **Granularity of turn annotations.** Every turn in every passage, or only load-bearing turns? Finer granularity costs context but enables richer turn-level UIs. Answer needed by stage 2 (per the pre-Stage-1 spike above).
- **Weak-signal lens policy.** When a lens has `signal: weak`, what should `response_space.by_lens` contain? Current plan allows `likely_readings` empty; may need refinement after stage 3.
- **Minimum-wrestling enforcement.** Is `struggle_calibration.minimum_wrestling` enumerated preconditions or free-form prose? Answer needed by stage 3.
- **Counterfactual depth.** One-sentence per facet vs. multi-sentence worked-rewrites. Defer until an app use case requires expansion.
- **Contrast-case story acquisition.** Use `saving-the-maker-space` as-is, modify it, or hand-author a minimal contrast story? Decision needed before stage 6.

**Resolved this revision:**

- **"Meaningful absences"** (e.g., Priya missing from Overton Park episode 5). Absence does not need its own analytical schema field; it earns its operationalization as a **persona-projection cue-generation hook** in the discussion agent ("Priya isn't here — what would she ask?"). The open question closes without adding schema surface.

---

## 8. What success looks like

When this revision is complete:

1. Any non-AI critical-thinking app built on the Polylogue framework can consume `assistive_package.yaml` directly — with or without additional app-layer processing in `apps/{app_id}/pipeline/` — and that one file contains everything needed to deliver a full student and teacher session without any runtime LLM call, *including* group-phase distributable primitives that prevent peer-discussion stall.

2. Every field in the package traces to a framework affordance or a well-validated instructional strategy, operationalized at one of three scales (analytical, individual-phase, group-phase).

3. The seven instructional strategies named in `pipeline-architecture.md` §1.1 are each supported by structured metadata, and any app can implement them without precomputing anything itself.

4. Stories opt into creative extensions via a small set of capability flags. Stories that don't opt in are served equally well with minimal packages.

5. The pipeline runs four LLM authoring agents (analyst, diagnostic, prose, discussion) plus one reviewer, and each agent has a single cognitive job describable in one sentence, a distinct failure mode, and an independent iteration rhythm. No agent is doing work another agent could do better.

6. The current five-file overlap structure is eliminated. No content lives in two places.

7. At least two creatively distinct stories have been run through the revised pipeline end-to-end. The contrast case has exposed any Overton-Park-specific assumptions that snuck into the "universal" core.

8. Rule 11 is the load-bearing architectural commitment. Future extensions of the assistive package — new cue axes, new scaffolding primitives, new group activities — can be added by introducing a new agent and a new file, without touching existing agents or existing files.

---

## Appendix B — Diff against the current pipeline

**Files produced today (per episode):** `analysis.yaml`, `facilitation.yaml`, `lens/scaffolding.yaml`, `lens/facilitation.yaml`, `lens/session.yaml`.

**Files produced after this revision:**
- Universal: `ground_truth.yaml`, `diagnostic.yaml`, `prose.yaml`, `discussion.yaml`, `assistive_package.yaml` (merged).
- Per-app (outside the framework's scope, owned by each app per Rule 12): whatever each app chooses to write inside `artifacts/{story_id}/episodes/episode_{NN}/{app_id}/`.

**Agents changed.** The `evaluator` agent is retired and replaced by **four** authoring agents in the shared pipeline: `analyst_agent`, `diagnostic_agent`, `prose_agent`, `discussion_agent`. The `analysis_reviewer` and `scaffolding_reviewer` agents are merged into `package_reviewer` with the thirteen criteria in `pipeline-architecture.md` §3.5. The framework defines no additional agents beyond these five; any LLM work an app needs at its own layer is Rule-12 territory.

**Commands changed.** `/analyze_transcript` and `/design_scaffolding` are merged into `/build_assistive_package`, which runs analyst → diagnostic → prose → discussion → reviewer → merge. This is the framework's complete command surface for the downstream half; apps define their own commands in `apps/{app_id}/pipeline/commands/` per Rule 12.

**Schemas changed.** `analysis.schema.yaml`, `facilitation.schema.yaml`, and `lens/scaffolding.schema.yaml` are retired. New schemas: `ground_truth.schema.yaml`, `diagnostic.schema.yaml`, `prose.schema.yaml`, `discussion.schema.yaml`, `assistive_package.schema.yaml`.

**Commands unchanged.** `/create_episode`, `/create_transcript`, `/configure_session` are untouched. The information barrier remains enforced in the same way at the same stage.

---

## Appendix C — Governance rules reference

One-line operational statements of the twelve governance rules, for use during spec authoring and reviewer checks. Full rationale, worked examples, corollaries, and the composition argument between Rules 11 and 12 live in `pipeline-architecture.md` §6. When a reviewer checks "does this field pass Rule N?" the answer is here; when a contributor asks "why is Rule N framed this way?" the answer is in the memo.

| # | Name | Operational statement | Memo § |
|---|---|---|---|
| 1 | Every required field traces to a justified source | A required field must trace to a framework affordance or a named well-validated instructional strategy; otherwise gate it behind a capability flag or remove it. | `pipeline-architecture.md` §6 Rule 1 |
| 2 | Creative choices are opt-ins, not defaults | Content that depends on a creative choice some story might not make goes behind a capability flag; a new flag requires two distinct stories that would use it differently. | `pipeline-architecture.md` §6 Rule 2 |
| 3 | Light usage is valid | The reviewer checks well-formedness of what is present, not exercise of the full machinery; thin turns, one-rung ladders, and empty weak-lens blindspots are acceptable. | `pipeline-architecture.md` §6 Rule 3 |
| 4 | The pipeline supports, does not compel | The pipeline produces primitives aligned with proven instructional strategies; no app is required to use them in those ways. | `pipeline-architecture.md` §6 Rule 4 |
| 5 | Redundancy is an error, not a feature | Two blocks holding the same content in different wrappings means one is wrong; collapse or remove one. | `pipeline-architecture.md` §6 Rule 5 |
| 6 | Turn anchors are mandatory | Every annotation must cite turn IDs; this is what makes downstream turn-level UIs possible without re-inference. | `pipeline-architecture.md` §6 Rule 6 |
| 7 | IDs are hidden; labels are student-facing | Machine-readable fields use canonical IDs from `framework/reference/`; student-facing fields use labels from `apps/lens/docs/teacher-overview.md`; literal-scan catches leakage both directions. | `pipeline-architecture.md` §6 Rule 7 |
| 8 | Agent roles are pure | Each authoring agent produces only its own content kind; the analyst does not speculate about students, the diagnostic does not invent ground truth, the prose agent does not author rubrics or cues, the discussion agent does not author diagnostics or prose, the reviewer does not rewrite. | `pipeline-architecture.md` §6 Rule 8 |
| 9 | App contracts are read-only consumers | Contracts narrow what an app uses; they cannot constrain what the pipeline produces; recurring `contract_violations[]` are the upstream-communication channel. | `pipeline-architecture.md` §6 Rule 9 |
| 10 | Contracts are optional | An app may consume `assistive_package.yaml` directly; absence of a contract document is not an error and does not block any pipeline stage. | `pipeline-architecture.md` §6 Rule 10 |
| 11 | One cognitive job per agent; one agent per file | Every LLM-bearing unit has one named cognitive job, reads inputs from files, writes one output file, and does not negotiate with other agents; new capabilities are added by adding an agent and a file, never by bolting onto an existing prompt. | `pipeline-architecture.md` §6 Rule 11 |
| 12 | Apps own everything app-specific; the framework stops at the handoff | The universal pipeline ends at `assistive_package.yaml`; app-layer work lives under `apps/{app_id}/pipeline/` and writes only under `artifacts/{story_id}/episodes/episode_{NN}/{app_id}/`; apps may not modify universal artifacts or depend on other apps' outputs. | `pipeline-architecture.md` §6 Rule 12 |

**How to use this appendix.** During spec authoring, open this table alongside the section you are editing; every proposed field should survive a row-by-row check. During reviewer checks, cite the rule number in findings (e.g., "flagged per Rule 1 — no affordance traceable"). If a row's one-sentence statement stops being enough to adjudicate a real case, the answer lives in the memo — but the row itself stays one sentence. Growing this table into multi-paragraph expansions would recreate the duplication Rule 5 rules out.

---

*End of plan.*
