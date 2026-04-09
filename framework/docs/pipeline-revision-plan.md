# Pipeline Revision Plan: An Assistive Package for Non-AI Applications

**Status.** Draft for review. Not yet approved for implementation.
**Audience.** Pipeline maintainers, app builders, instructional-design reviewers.
**Scope.** Lens application. Reasoning Lab is deferred (see §7).

---

## 0. Why this revision exists

The Polylogue pipeline currently produces five files per episode that carry per-passage assistive content: `analysis.yaml`, `facilitation.yaml`, `lens/scaffolding.yaml`, `lens/facilitation.yaml`, and `lens/session.yaml`. These files grew field-by-field as each instructional question came up, and the result is a structure with at least six pairs of overlapping fields, inconsistent naming across files, and no single place the downstream app can point at and say "this is what I read."

More importantly: the Lens app has not yet been built. The app will be non-AI — it makes no runtime LLM calls — which means every piece of intelligent analysis, scaffolding, feedback, and discrimination must be precomputed by the pipeline and handed to the app as structured data. The current five files were not designed with that contract in mind. Fields that seemed adequate when the pipeline was producing them for human review turn out to be underspecified for a system that must deliver them to students without any further reasoning in between.

This plan proposes a reorganization and extension of the pipeline's per-passage output into a single, coherent **assistive package** that:

1. Groups content by the cognitive question it answers, not by the file it historically lived in.
2. Grounds every required field in a framework affordance or a well-validated instructional strategy — not in the creative choices of any particular story.
3. Supports the downstream non-AI app as richly as possible, with structured data that eliminates the temptation to do runtime LLM calls.
4. Extends only where the extension is cheap to produce and load-bearing for the app; resists the temptation to add fields whose content is speculative or redundant.

The plan is organized in seven parts:

- §1 — Pedagogical commitments (the pipeline's instructional stance)
- §2 — The assistive package (schemas and fields)
- §3 — Agent architecture (who produces what)
- §4 — Story-level capability declarations (the opt-in surface)
- §5 — End-to-end revision sequence with review gates
- §6 — Governance rules
- §7 — Non-goals, risks, and open questions

---

## 1. Pedagogical commitments

### 1.1 Two grounds for assumption

The pipeline makes assumptions on two grounds, and keeping them distinct matters:

**Ground A — framework-grounded universals.** Every Polylogue story shares four properties that are not creative choices but definitional:

1. **Purpose.** The story exists to teach critical thinking.
2. **Form.** The story is composed of turn-based multi-persona dialog.
3. **Vocabulary.** The story builds on the Polylogue conceptual framework — three lenses (Logic, Evidence, Scope), two classes of forces (cognitive biases and social dynamics), ten facets that sit at the hinge where lenses and forces meet.
4. **Affordances.** The framework is designed to produce three affordances (§1.2 of this document; §1 of `framework/docs/conceptual-framework.md`): naming what is weak, explaining why the reasoner got there, and holding more than one valid perspective. These are not optional outcomes — the framework was built to make them precise.

The pipeline may assume these four without permission. No story can opt out of them and still be a Polylogue story.

**Ground B — well-validated instructional defaults.** Some instructional strategies have enough empirical grounding in the learning-science literature that assuming them as defaults is low-risk and high-value. The conceptual framework is careful not to dictate instructional design (see `framework/docs/conceptual-framework.md` line 3), but that silence is about *not mandating* — not about *refusing to assume anything*. Assuming well-validated designs is a different move than mandating them.

The strategies this plan treats as defaults are:

- **Productive struggle** — students learn more when they sit with uncertainty before receiving assistance. (Kapur, productive failure research; VanLehn; Schwartz & Bransford.)
- **Faded assistance** — scaffolding should be graduated and thinned as competence grows. (Collins, Brown, and Newman; Wood, Bruner, and Ross; Pea; cognitive load theory.)
- **Elaborative interrogation / self-explanation** — students learn more when prompted to explain *why* something is the case. (Chi; Pressley.)
- **Perspective-taking** — structural, since it is the framework's third affordance made manifest.
- **Worked examples / worked counterfactuals** — short, concrete "what would fix this" examples grounded in the specific passage support transfer better than abstract corrections. (Sweller; Renkl on worked examples and self-explanation of completion problems.)

And one that comes along for free given cross-episode threading:

- **Spaced / distributed practice** — the same concept revisited across multiple episodes produces more durable learning than a single concentrated exposure. (Cepeda et al.; Dunlosky et al.)

The pipeline supports these strategies by producing primitives aligned with them. It does not compel any app to use the primitives in those ways. An app remains free to implement any instructional design, including rejecting faded assistance or productive struggle entirely.

### 1.2 The three affordances as spine

Part 1 is organized around the three affordances from the conceptual framework, because the affordances are the framework-grounded reason the pipeline produces anything at all. Each affordance maps to a block of assistive content, and each block carries metadata that operationalizes one or more of the instructional defaults.

#### Affordance 1 — name what is weak

Operationalized by the pipeline's **ground truth** block. For each passage, the pipeline commits to what facets are present, which are absent but tempting (the discrimination surface), which lenses see what with what signal strength, and what each turn is contributing to the reasoning. Every annotation is anchored to turn IDs, and every reference to a facet uses the canonical ID from `framework/reference/facet_inventory.yaml`.

This block is *analytical*. It describes the reasoning in the passage as it is, with no pedagogical wrapping.

#### Affordance 2 — explain why the reasoner got there

Operationalized by the pipeline's **causal layer** block. For each passage, the pipeline commits to the forces at work — cognitive biases, social dynamics, and crucially their interaction. The framework's §2.2 states that "every moment in reasoned discussion has both a cognitive and a social dimension, and understanding how they interact is the deepest level of explanation the framework supports." The pipeline treats this as a required structural property: the `interaction` field on every causal-layer entry must be populated with an enumerated value (see §2.2 of this document).

The framework's §4 also states that "one weak facet can be produced by several forces" and "no observation has a unique correct explanation." The pipeline treats this as a required schema rule: when more than one force plausibly accounts for a facet, the causal layer lists them all, with none marked as "the" cause.

#### Affordance 3 — hold more than one valid perspective

This is the affordance that has two structural sources in the framework (§3 and §4 of the conceptual framework), and both sources must be present in the pipeline's output:

**Source A — cross-lens visibility.** Operationalized inside the ground truth block as `lens_visibility` (per-lens signal strength and content) and as **perspective transitions** (directional pairs between lenses describing what one lens sees that another misses on this specific passage). Perspective transitions are the one genuinely new primitive this revision introduces. They are required on every passage. The LLM pipeline is uniquely positioned to produce them — reasoning about "what does Logic see that Evidence misses here" requires content-specific analysis that a non-AI app cannot do at runtime.

**Source B — multiple causes per facet.** Operationalized inside the causal layer by the required multiple-forces-per-facet rule above.

Together, Affordance 3 becomes the pipeline's structural commitment that diversity of perspective is not an accidental byproduct but is engineered into every package.

### 1.3 Where the instructional defaults live

The four default strategies (productive struggle, faded assistance, elaborative interrogation, perspective-taking) do not require their own schema blocks. They are **default uses of the affordance primitives**, enabled by small metadata additions:

- **Productive struggle** — enabled by `process_guidance.struggle_calibration` metadata (difficulty, productive_duration, danger_signals, minimum_wrestling). The app gates hint availability and interrupt behavior against these fields.
- **Faded assistance** — enabled by a single graduated hint ladder with `appropriate_for: [early, mid, late]` tags per rung, plus `prior_exposure` and `assumes_familiar_with` / `introduces` at passage level. The app fades by filtering rungs based on story position and prior exposure.
- **Elaborative interrogation** — enabled by the `deepening_moves` primitive (per-lens prompts that push from *what* to *why*).
- **Perspective-taking** — enabled by `perspective_transitions` as a required primitive.
- **Spaced practice** — enabled for free by `connects_to.echoes` cross-passage threading.

No new blocks for any of these. Metadata on existing blocks, plus one new primitive.

### 1.4 "Unfinished, not wrong" and other story-level register choices

Some stories commit to pedagogical stances that are creative choices, not framework commitments. *The Overton Park Sightings* commits to "thin reasoning is not wrong reasoning — it is reasoning that hasn't finished yet." This is a register choice that shapes how the pedagogue should write rationales, hints, and redirect language. It is not universal — a different story might deliberately want a crisper discriminative register.

The pipeline handles this via a story-level capability declaration (§4): the story design doc's frontmatter names the `pedagogical_register` it wants, and the pedagogue agent reads this and matches its prose accordingly. Stories that don't declare one get a generic neutral register. No schema block depends on the value; only the pedagogue's prose tone does.

Note that the `surface/partial/completed` rubric introduced in §2.3 is the same kind of register choice as `pedagogical_register`, elevated from terminology — both exist to let stories vary their stance toward "incomplete reasoning" without changing the schema.

### 1.5 Summary of Part 1

The pipeline's output is grounded in three framework affordances plus four well-validated instructional defaults. Every required schema field traces to one of those seven sources. Any field that cannot trace to a framework affordance or a well-validated instructional strategy is either moved to the opt-in story-level extension set (§4) or removed from the plan. Story-specific creative choices are honored through a small capability-declaration surface in the story design doc, not by baking them into the core schema.

### 1.6 Universal core vs. app-coupled layer

Not every block in the package is equally portable across apps. The plan distinguishes two layers:

**Universal core (framework-shaped, app-agnostic).** `ground_truth.yaml` in full — facets present, absent-but-tempting, lens visibility, turn annotations, causal layer, perspective transitions, counterfactuals, connects_to. Any non-AI critical-thinking app built on the Polylogue framework would want this content unchanged. The `learner_response_space` and `process_guidance` blocks are also universal *as primitives*, but their precise interpretation is app-coupled.

**App-coupled interpretation (Lens-shaped today, generalizable later).** The hint-cost economy in `attention_cues[].cost`, the "commit to a reading then get assessed" loop assumed by `learner_response_space.by_lens.{likely/partial/mis/blindspots}`, and any session-pacing or unlocking semantics are interpretation choices a specific app makes when it consumes the package. The pipeline produces neutral primitives; the app decides what they mean.

The universal pipeline (§5 stages 1–6) produces only the universal core and the universal primitives. App-specific reshaping, renaming, semantic annotation, and pacing live in the **app projection layer** (§2.6, §3.6), which runs after the main pipeline and is opt-in per app.

---

## 2. The assistive package

The pipeline produces three files per episode. Two are authored by LLM agents; the third is a mechanical merge produced by a Python script.

### 2.1 `ground_truth.yaml` — what the analyst produces

Per-passage content grounded in Affordances 1 and 2 and the cross-lens source of Affordance 3. The analyst works from the episode plan and the enumerated transcript. It is analytical, not pedagogical — it does not speculate about what students will say. Its job is accuracy.

**Required blocks:**

- `facets_present[]` — every facet exhibited in the passage, with `facet_ref` (canonical ID), `label` (student-facing language from `teacher-overview.md`), `lens`, `role` (`primary | cross_lens | strength`), `severity` (`strong | moderate | subtle`), `evidence_turns[]`, and `one_line` description. When the same move is simultaneously a character growth beat and a facet instance (as Jules's falsifiable reformulation in Overton Park episode 8 is both), `role` is a list, not a single value.
- `facets_absent_but_tempting[]` — the discrimination surface. Facets that look like they might apply but don't, each with `why_tempting` and `why_wrong`. At least one entry per passage where any discrimination is possible.
- `lens_visibility` — per-lens `signal` (`weak | moderate | strong`) and `what_shows` description. This is how the app decides which lens transitions are pedagogically meaningful.
- `turn_annotations` — per-turn inverse index: `speaker`, `moves[]`, `facet_signals[]` (with polarity and strength), and `why_it_matters`. Only turns inside the passage's `turn_range` are annotated. This block is what enables turn-level heat-maps and click-to-context UIs on the app side.
- `causal_layer` — see §2.2.
- `perspective_transitions[]` — directional pairs between lenses: `from`, `to`, `trigger`, `what_they_gain`, `what_they_realize`, `prompt`. Required on every passage. This operationalizes Affordance 3's first structural source.
- `counterfactuals[]` — per facet present, a one-sentence "what would fix this in the specific passage." Supports "rewrite the turn" exercises and makes "better" concrete rather than abstract.
- `connects_to` — cross-passage threading: `echoes[]`, `contrasts[]`, `sets_up[]`. Each entry points at another passage in the episode or a prior episode with a relation description.

**Enforcement.**

- Every entry with a facet, pattern, or dynamic uses the canonical ID from `framework/reference/`. The literal-scan validator in `validate_schema.py` catches any deviation.
- Every entry with a turn citation references a turn that exists in the transcript.
- Every `perspective_transitions` entry has both `from` and `to`, and both are valid lens IDs.
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

1. **Interaction is required.** Every `facets_explained` entry must have an `interaction` field. The allowed values are `cognitive_only`, `social_only`, `cognitive_amplified_by_social`, `social_amplified_by_cognitive`, and `mutual`.

2. **`cognitive_only` is legal only for specific facets.** Per framework §4, `relevance` and `inferential_validity` have no social-dynamic account. For those two facets, `cognitive_only` is a valid value. For any other facet, `cognitive_only` is an error and the reviewer flags it.

3. **Multiple forces per facet are required when applicable.** When more than one cognitive bias or social dynamic plausibly accounts for a facet, the causal layer lists all of them, with no marking of one as primary. The reviewer flags entries that list exactly one force when the framework's §4 tables show multiple plausible candidates for that facet.

4. **Interaction note is required when interaction is not `cognitive_only` or `social_only`.** Whenever biases and dynamics interact, the pedagogue must describe how in a single sentence. This is the framework's "deepest level of explanation" made mandatory.

### 2.3 `learner_package.yaml` — what the pedagogue produces

Per-passage content grounded in the non-AI app's need for structured data to replace runtime reasoning. The pedagogue works from the episode plan, the enumerated transcript, the ground truth file produced by the analyst, and the story position (episode number, prior facet/pattern exposure). Its job is *pedagogical* — imagining what 6th-grade students will actually say, write, miss, and get tempted by.

**Required blocks:**

- `learner_response_space.by_lens.{logic, evidence, scope}` — per lens, four categories of reading:
    - `likely_readings[]` — things students will actually say. Each has `text`, `quality` (`surface | partial | completed`), `maps_to_facet`, and `rationale`. The rubric levels are deliberately renamed from the earlier `basic/developing/differentiated` to avoid the quality-tier register that implies "your basic reading is low-quality." `surface/partial/completed` supports the "unfinished, not wrong" register when a story declares it, and is neutral enough to fit other registers too.
    - `partial_readings[]` — half-right readings. Each has `text`, `what_they_got`, `what_they_miss`. These are the readings that need nudging, not redirecting.
    - `misreadings[]` — wrong-but-tempting readings. Each has `text`, `why_tempting`, `why_wrong`. These are the readings that need redirecting.
    - `blindspots[]` — what most students won't notice, as prose.

  **Minimum per lens:** at least one entry in each of the four categories, unless the lens's `signal` in `ground_truth.lens_visibility` is `weak`, in which case `likely_readings` may be empty and `blindspots` must carry the content.

- `learner_response_space.explanation_quality` — for the "why did they reason this way" articulation. Structured by the three causal categories (`cognitive`, `social`, `interaction`), each with two quality levels (`surface`, `worked_through`), each with at least one example text and a rationale.

- `process_guidance.attention_cues[]` — the graduated hint ladder. Each rung has:
    - `level` (integer, 1 to N)
    - `text` (student-facing, directs attention without giving an answer)
    - `cost` (lifelines or whatever currency the app uses)
    - `appropriate_for` (list of story-position tags: `early`, `mid`, `late`)
  Minimum two rungs. The final rung may be the AI perspective reveal.

- `process_guidance.deepening_moves` — per-lens prompt that pushes from *what* to *why*, shown after a student commits to an observation. This is the elaborative-interrogation primitive.

- `process_guidance.expected_divergence[]` — anticipated class disagreements. Each entry has `split` (description), `both_legitimate` (boolean), and `productive_question` (teacher-facing prompt).

- `process_guidance.stall_signals` — `productive` and `stalled` prose descriptions, plus `unstall_moves` per lens.

- `process_guidance.struggle_calibration` — the productive-struggle metadata:
    - `difficulty`: `generous | standard | strict` (how aggressive the app should be with hint availability)
    - `productive_duration`: `short | moderate | long` (how long to let a student sit before offering anything)
    - `danger_signals[]` (concrete descriptions of bad-stuck)
    - `minimum_wrestling[]` (preconditions before hints unlock)

- `assumes_familiar_with[]` and `introduces[]` — pedagogue-authored at passage level. `assumes_familiar_with` names vocabulary the passage builds on; `introduces` names vocabulary the passage newly teaches. These inform the app's faded-assistance filtering.

**Conditionally required blocks** (populated only when the story's frontmatter declares the relevant capability — see §4):

- `calibration_warnings[]` — author-flagged high-risk passages, lifted from prose notes in the story design doc. Carries operator judgment forward.
- `growth_beats` / `character_arc_position` — growth arc metadata. Only when `uses_character_growth: true` in story frontmatter.
- `stance_positions[]` — distinct stances a student can hold toward a claim, independent of their lens reading. Only when `uses_stance_positions: true`.

**Enforcement.**

- Every lens has at least one entry in each of the four response-space categories (subject to the weak-signal exception above).
- `attention_cues` has at least two rungs, and the `appropriate_for` tags use only the enumerated values.
- `assumes_familiar_with` references are grounded in prior episodes — the reviewer checks each reference against the story's episode sequence.
- Every `maps_to_facet` in `learner_response_space` exists in `ground_truth.facets_present` for the same passage (cross-file check, enforced at merge time).
- The pedagogue's prose register matches the story's declared `pedagogical_register`. The reviewer spot-checks this on sampled entries.

### 2.4 `assistive_package.yaml` — the merged view the app reads

A mechanical concatenation of `ground_truth.yaml` and `learner_package.yaml`, plus cross-reference integrity checks. Produced by a Python merge script, not an LLM. This is the single file the Lens app consumes.

**The merge script also computes one deterministic block:** `prior_exposure` — per passage, the list of facets/patterns/dynamics the student has already encountered in prior episodes (each with `first_seen: episode_NN`). Derived mechanically from the story's episode sequence and the per-episode ground truth files. The pedagogue *reads* this as input via the story-position object (§3.2) but does not author it; producing it in the merge script removes any chance of LLM hallucination on a value that has a deterministic answer.

**The merge script enforces:**

- Every `learner_response_space` entry's `maps_to_facet` exists in `ground_truth.facets_present` for the same passage.
- Every `attention_cues` rung's target lens corresponds to a lens with `signal ≥ moderate` in `lens_visibility` (hints should not direct attention to weak-signal lenses).
- Every `calibration_warnings[]` entry references a passage that exists in the episode.
- Every `prior_exposure` reference points at a facet/pattern/dynamic in the canonical inventory.
- Every `causal_layer.interaction` value is the enumerated set, and `cognitive_only` appears only for `relevance` and `inferential_validity`.
- Every `appropriate_for` tag uses the enumerated story-position values.
- Every turn reference in any block is a valid turn in the transcript.

If any check fails, the merge script exits with an error and the episode is not considered complete. No manual override.

### 2.5 What changed from the current five-file structure

| Current field | Disposition under the revision |
|---|---|
| `analysis.yaml` → `ai_perspective.through_{lens}` | Becomes `ground_truth.lens_visibility` + `perspective_transitions` |
| `analysis.yaml` → `ai_perspective.why_it_happened` | Becomes `ground_truth.causal_layer` with required `interaction` |
| `analysis.yaml` → `ai_perspective.what_to_notice` | Folds into `process_guidance.expected_divergence` |
| `analysis.yaml` → `diversity_potential.expected_lens_split` | Folds into `ground_truth.lens_visibility` |
| `analysis.yaml` → `diversity_potential.likely_student_observations` | Becomes `learner_response_space.by_lens.{likely_readings, blindspots}` |
| `scaffolding.yaml` → `scaffold_sequence` (hints) | Becomes `process_guidance.attention_cues` with `appropriate_for` tags |
| `scaffolding.yaml` → `deepening_probes` | Becomes `process_guidance.deepening_moves` |
| `scaffolding.yaml` → `common_misreadings` | Becomes `learner_response_space.by_lens.misreadings` |
| `scaffolding.yaml` → `observation_rubric` | Becomes `learner_response_space.by_lens.likely_readings` with `quality` tags |
| `scaffolding.yaml` → `explanation_rubric` | Becomes `learner_response_space.explanation_quality` |
| `facilitation.yaml` → `productive_questions` | Stays distinct as `process_guidance.productive_questions` (teacher-facing); `deepening_moves` is student-facing. Different audiences must not collapse. |
| `facilitation.yaml` → `watch_for`, `if_students_are_stuck` | Becomes `process_guidance.stall_signals` + `struggle_calibration` |
| `facilitation.yaml` → `likely_disagreements` | Becomes `process_guidance.expected_divergence` |

Six overlapping pairs from the earlier audit all collapse into one-source-of-truth blocks. No content is lost; content is reorganized and deduplicated.

### 2.6 The app projection layer (optional, per app)

`assistive_package.yaml` is the universal pipeline's terminal artifact. It is app-agnostic by construction (§1.6) and is intended to be readable directly by any non-AI app whose needs it already meets.

For apps that need to *reshape*, *narrow*, *rename*, or *annotate with app-specific semantics* (hint cost economies, session pacing, unlocking rules, custom field shapes), the plan introduces an **app projection layer**: a per-episode, per-app derivative produced after the universal pipeline by an `app_projector` agent (§3.6) reading two inputs:

- `artifacts/{story_id}/episodes/episode_{NN}/assistive_package.yaml`
- `apps/{app_id}/docs/package-contract.md` — the app's contract document, committed to source

and writing:

- `artifacts/{story_id}/episodes/episode_{NN}/{app_id}/app_package.yaml`

**Key properties:**

- **Derived, not authored.** The projection is reproducible from package + contract. The projector may select blocks, reshape, rename, attach app-specific semantics (e.g., tag `attention_cues[].cost` with Lens lifeline values), and emit `contract_violations[]`. It may *not* invent content the package lacks.
- **Optional.** An app that's content with the universal package consumes `assistive_package.yaml` directly. No contract, no projector, no blocking. The universal pipeline's success criteria never reference `app_package.yaml`.
- **Per-episode, per-app.** Same granularity as everything else. A future per-story projection (e.g., for cross-episode pacing) is added only if a contract demonstrates the need.
- **Failure mode is `contract_violations[]`, not fabrication.** If a contract requires a field the package doesn't have (e.g., `stance_positions[]` when the story didn't opt in), the projector emits a violation entry and exits non-zero. Recurring violations across episodes or apps are the upstream-communication signal that the schema or a capability flag should change.

The contract document itself states, for the app: which package blocks the app consumes; which optional/conditional blocks the app requires; which capability flags the app needs the story to declare; the app-specific interpretation of each consumed field; and any known gaps.

---

## 3. Agent architecture

The current `/analyze_transcript` command uses a single `evaluator` agent that produces both analytical and pedagogical content in one pass. This revision splits that into two agents with distinct cognitive jobs, plus one reviewer.

### 3.1 The analyst agent

**Input.** `episode.yaml`, `transcript.yaml`, the canonical reference files from `framework/reference/`, and (for cross-episode threading) the episode index of the story.

**Output.** `ground_truth.yaml` conforming to §2.1 and §2.2.

**Information barrier note.** Merging `/analyze_transcript` and `/design_scaffolding` does not touch the dialog-writer information barrier, which sits upstream at `/create_transcript`. The analyst sees the episode plan, the transcript, and the framework reference files because the dialog has already been written; nothing the analyst does flows back to the dialog writer.

**Job.** Close reading against a known framework. Identify what facets fire, with what severity, anchored to which turns. Identify what facets are absent-but-tempting. Annotate every turn in every passage with its move and facet signals. Write the causal layer including required interaction. Generate perspective transitions. Produce counterfactuals. Identify cross-passage connections.

**Constraints.**

- The analyst must not speculate about what students will say. If it catches itself writing "a student might notice...," that content belongs in the pedagogue's output, not the analyst's.
- The analyst must cite turn IDs for every annotation. Un-anchored observations are errors.
- The analyst uses canonical IDs from `framework/reference/` for every facet, pattern, and dynamic reference. Labels in student-facing language are added alongside the IDs, not instead of them.

**Failure modes this role is defending against.**

- Conflating "what's true about the passage" with "what students will say about it."
- Picking a single force as "the" explanation when the framework permits multiple.
- Hand-waving the interaction field with generic language.

### 3.2 The pedagogue agent

**Input.** `episode.yaml`, `transcript.yaml`, `ground_truth.yaml` (read from file, not passed inline), the canonical reference files, and a **story position** object (episode number, prior facet/pattern exposure list, story design doc frontmatter with capability declarations).

**Output.** `learner_package.yaml` conforming to §2.3.

**Job.** Imagine what 6th-grade students will actually say, write, miss, and get tempted by, passage by passage. Produce the full four-category learner response space per lens. Write the hint ladder with position tags. Calibrate struggle metadata. Write deepening moves. Anticipate divergence. Populate conditional blocks if the story's frontmatter opted into them.

**Constraints.**

- The pedagogue must match the story's declared `pedagogical_register`.
- The pedagogue reads ground truth but does not alter it. If the pedagogue believes the analyst's ground truth is wrong, it emits a `reviewer_flag` field; it does not silently contradict.
- The pedagogue's prose must be passage-specific. Generic "a student might notice the evidence is weak" is flagged by the reviewer as under-specified.
- The pedagogue's hint ladder rungs must direct attention without giving the observation. The reviewer spot-checks this.

**Failure modes this role is defending against.**

- Over-specifying in ways that turn hints into answers.
- Generic-sounding pedagogical prose that doesn't sound like the specific passage.
- Skipping blindspots (writing only likely readings, leaving the blindspots block empty because it's the hardest part).
- Not matching the story's register.

### 3.3 The package reviewer

**Input.** Both files (`ground_truth.yaml` and `learner_package.yaml`) plus the episode plan and story frontmatter.

**Output.** `ACCEPT` or `REVISE` with structured findings.

**Review criteria (judgment-only).** Mechanical checks (turn-citation existence, enumerated `interaction` values, cross-file `maps_to_facet` resolution, capability-declaration honoring, prior-exposure reference validity) are enforced by the merge script in §2.4 and removed from the reviewer's load. The reviewer is left with criteria that require judgment:

1. **Block orthogonality** — no content appears in two blocks that should be one block.
2. **Response space completeness** — every lens has at least one entry in every category, subject to the weak-signal exception.
3. **Near-miss discriminability** — every `facets_absent_but_tempting` entry has a non-hand-wavy `why_wrong` that actually distinguishes the case.
4. **Multiple forces listed** — when the framework's §4 tables show multiple candidates for a facet, the causal layer lists them all (judgment about plausibility, not enumeration).
5. **Register matching** — sampled pedagogue prose matches the story's declared `pedagogical_register`.
6. **Hint calibration** — sampled hint rungs direct attention without giving the observation.

**Cross-episode consistency.** The reviewer additionally has a cross-episode mode that runs after every episode in a story has been packaged. It verifies that `connects_to.echoes`, `connects_to.contrasts`, and `prior_exposure` references resolve coherently across the full set of episode packages, and that `pedagogical_register` does not drift across episodes. This is the standing mechanism behind the "register drift across episodes" concern in stage 5.

The reviewer is a separate agent with fresh context. It reads both files but does not rewrite them. When it returns `REVISE`, the operator re-runs the relevant agent (usually the pedagogue) with the specific findings attached to the prompt. No agent-to-agent dialogue.

### 3.4 Why two agents, not more or fewer

**Not one monolith.** The analyst's and pedagogue's cognitive jobs are different enough that combining them degrades both — the analyst speculates about students, the pedagogue loses grip on what's actually in the passage. The existing `evaluator` agent exhibits this failure mode.

**Not four or five.** Splitting the pedagogue into separate "rubric-author," "hint-author," "misreading-author," and "probe-author" agents would produce mutually inconsistent prose (different tone, different level of specificity) that a fourth agent would then have to reconcile. The four pedagogical outputs share language, register, and student model, and are cheaper to produce coherently in one pass than to produce separately and reconcile.

**Not a separate perspective-transitions agent.** Transitions are analytical content (what does Logic see that Evidence misses), not pedagogical content. They belong in the analyst's output. The pedagogue wraps them in prompts inside `attention_cues` or `deepening_moves` if and when the story wants that use.

Two agents plus one reviewer is the minimum that cleanly separates cognitive jobs in the universal pipeline. The app projector (§3.6) is a third pure role but lives *outside* the universal pipeline and runs only when an app opts in, so it does not count against this minimum. More is over-engineering by the lights of §6.

### 3.5 Coordination rules

1. **Ground truth is passed as a file, not inline.** The analyst writes `ground_truth.yaml` and exits. The pedagogue reads it via the Read tool. This keeps both context windows clean and gives a durable intermediate artifact for inspection.

2. **The pedagogue sees the full transcript, not just ground truth.** This is load-bearing and easy to miss. Pedagogical prose must be grounded in specific turns and specific language, and that requires access to the original transcript even though ground truth is the structured input. The pedagogue's prompt must make this explicit.

3. **No back-and-forth between analyst and pedagogue.** If the reviewer flags a contradiction, the fix is to re-run the affected agent with the specific finding. Agent-to-agent dialogue is prohibited.

4. **The merge script runs only after the reviewer returns ACCEPT.** No merged package is produced from un-reviewed inputs.

### 3.6 The app projector agent

The third pure role, parallel to analyst and pedagogue. Runs *only when invoked* by an app-specific command — never as part of the universal pipeline's per-episode autorun.

**Input.** `assistive_package.yaml` (read from file), `apps/{app_id}/docs/package-contract.md`, optionally the story design doc frontmatter for capability-flag awareness.

**Output.** `artifacts/{story_id}/episodes/episode_{NN}/{app_id}/app_package.yaml`.

**Job.** Apply the contract to the package: select consumed blocks, reshape and rename per the contract's mapping rules, attach app-specific semantic annotations (e.g., tag `attention_cues[].cost` with the app's lifeline values), and emit `contract_violations[]` for anything the contract requires that the package lacks.

**Constraints.**

- The projector is **forbidden from generating any content not present in `assistive_package.yaml`.** Missing required content becomes a violation entry, never a fabrication. This is the projector's version of role purity.
- The projection must be **reproducible**: the same package + same contract must yield the same `app_package.yaml`. No creative choices, no LLM speculation about what the app probably wants.
- Whether the projector is an LLM agent or a Python script that calls an LLM only for specific reshaping ops is a Stage 7 decision. Much of the work is templating; the agent designation is provisional.

**Failure modes this role is defending against.**

- Inventing fields the contract asks for but the package doesn't carry.
- Silently consuming blocks the contract didn't list.
- Drifting away from reproducibility by making creative reshaping choices not specified in the contract.

---

## 4. Story-level capability declarations

The story design doc's frontmatter is extended with a small set of capability flags that the pipeline reads and honors. The flags are few by design — the governance rule in §6 requires that every flag earn its place against a creative choice multiple stories actually make.

**Existing flags (unchanged):**

- `coverage_mode: focused | comprehensive`
- `declared_facets: [...]`
- `declared_cognitive_patterns: [...]`
- `declared_social_dynamics: [...]`

**New flags:**

- `pedagogical_register: unfinished_not_wrong | discriminative | exploratory | neutral` (default: `neutral`)
    - Shapes the pedagogue's prose tone. `unfinished_not_wrong` is the Overton Park register: rationales are written as "show me more," not "you missed this." `discriminative` is a crisper register for stories that teach sharp distinction between strong and weak reasoning. `exploratory` is a more open-ended register. `neutral` is the default when no commitment is declared.

- `uses_character_growth: true | false` (default: `false`)
    - When `true`, the learner package populates `growth_beats` at episode level and `character_arc_position` at passage level. When `false`, these fields are absent and the reviewer does not flag their absence.

- `declares_calibration_warnings: true | false` (default: `false`)
    - When `true`, the pedagogue lifts author-written calibration warnings from the story design doc prose into structured `calibration_warnings[]` entries in the learner package. When `false`, the field is absent.

- `uses_stance_positions: true | false` (default: `false`)
    - When `true`, the pedagogue populates `stance_positions[]` per passage. When `false`, the field is absent.

**The governance rule** (see §6): a new flag is added only when at least two distinct stories would use it differently, and the content it gates cannot reasonably live in the default schema. Each flag must be named in this section of the plan with a one-sentence justification meeting both criteria.

**The same rule applies to enum values, not just flags.** A new value added to `pedagogical_register` (or any other enumerated flag) must clear the same two-instance bar: at least two distinct stories must want it differently. Otherwise enums quietly accumulate values (`socratic`, `dialogic`, ...) that no review ever gates.

---

## 5. End-to-end revision sequence

The universal pipeline is six stages (1–6); it ends at `assistive_package.yaml` and is fully app-agnostic. App-specific work — contracts, projectors, migrations — lives in a separate per-app track (App-Stage 1, App-Stage 2) that runs *after* the universal pipeline lands and never blocks it. Each universal stage has a gate review; stages 3 and 5 have architecture reviews in addition.

**Resolved before Stage 1 begins:** the granularity of `turn_annotations` (Open Question 7.3). The answer determines analyst context budget and whether the two-agent split holds, so it cannot wait for Stage 2 to surface it.

### Stage 1 — Schema-first hand authoring

**Action.** Write `ground_truth.schema.yaml` and `learner_package.schema.yaml` as formal YAML schemas. Then hand-author both files for **one existing episode** — specifically, whichever episode in the current corpus most densely exercises the schema's hardest fields (cross-lens signals, required interaction, multiple forces, perspective transitions, conditional blocks). At the time of writing, that is Overton Park episode 3 — which is explicitly flagged by its author as the highest-load scaffolding episode in the story. If a future story has a denser test case, the stage-1 target moves; the criterion is density of schema stress, not episode-1-of-a-specific-story.

**Forcing function during hand-authoring.** For every field, ask: "could a non-AI app render or use this without further inference?" If the answer is no, the field is under-specified — fix the schema, don't push the gap downstream. This is the cheapest place to discover schema gaps and is deliberately app-agnostic (no specific app contract is consulted).

**Exit criterion.** A human can fill every required field without hand-waving. If any required field cannot be filled cleanly from the transcript and episode plan, the field is either wrong (cut it) or the schema is under-specified (fix it). No agent work begins until hand-authoring is clean.

**Gate review — schema reality check.** Does the schema survive contact with real content? Did we have to invent fields mid-authoring? Were any proposed fields struck because they had no legitimate content? Write findings as a short report; update the schema and the plan in response.

### Stage 2 — Analyst agent

**Action.** Port the existing `evaluator` prompt into the new analyst role, stripping all pedagogical speculation. Run it on the same episode as stage 1. Diff its output against the hand-authored ground truth.

**Exit criterion.** Operationalized: ≥90% of hand-authored `facets_present` entries are also produced by the analyst with matching `facet_ref` and at least one overlapping `evidence_turn`; zero hallucinated facets (no analyst-produced `facet_ref` absent from the hand-authored set); 100% of analyst turn citations resolve to real turns; every `causal_layer` entry has a populated and enumerated `interaction` field.

**Gate review — analyst fidelity.** Where does the agent over- or under-reach? Is each gap a prompt problem or a schema problem? Record prompt revisions needed for the second-episode run later.

### Stage 3 — Pedagogue agent

**Action.** Write the pedagogue prompt from scratch. Do not adapt the old evaluator — the pedagogue's job includes new work (struggle calibration, position-tagged hints, `surface/partial/completed` rubric, register matching) that the old prompt was not doing. Run it on the same episode, reading the stage-2 analyst output from file.

**Exit criterion.** Pedagogue output is specific enough that a 6th-grade teacher reading it would recognize their students. No generic placeholder prose. Register matches the story's declared value.

**Gate review — pedagogical register.** Does the language sound like a 6th grader could say it? Or like an adult imagining one? Sample five entries per category and mark each as "student-sounding" or "adult-sounding." If the ratio is not ≥80% student-sounding, the prompt needs revision.

**Architecture review.** After stage 3 is the first point at which the whole two-agent pair has run on a real episode. Step back from the implementation and ask:

1. Does the three-affordance spine in Part 1 still hold? Did any instructional commitment turn out to be harder or easier than expected?
2. Does the block structure feel orthogonal in practice, or are fields accidentally drifting into each other's territory?
3. Are the governance rules in Part 6 being respected? Any field that snuck in without an affordance or instructional-default justification?

Findings may revise §1, §2, or §4 before stage 4 proceeds.

### Stage 4 — Package reviewer

**Action.** Write the package reviewer agent based on failures actually observed in stages 2 and 3, not imagined failures. Seed it with three deliberately broken packages (hallucinated facet, missing interaction, generic pedagogue prose) and verify it catches each.

**Exit criterion.** Reviewer catches all seeded broken cases and returns ACCEPT on the validated stage-3 output.

**Gate review — catches known-bad cases.** Binary: does it catch each of the seeded cases, yes or no?

### Stage 5 — Second-episode unassisted run

**Action.** Run the full pipeline (analyst → pedagogue → reviewer → merge) on a **fresh episode**, with no manual intervention between agents. This is the first test of whether the system works without hand-holding.

**Exit criterion.** The full pipeline produces an `assistive_package.yaml` that passes all merge-script integrity checks and reviewer criteria, with no operator intervention. Any intervention needed is logged as a prompt or schema fix to apply before the stage-5 run is considered complete.

**Architecture review.** Same questions as stage 3, now with a more complete dataset. Did the second-episode run surface issues the first one hid? Are there any cross-episode interactions we missed (prior exposure mis-tracked, `connects_to` entries malformed, register drift across episodes)?

### Stage 6 — Contrast-case run

**Action.** Run the full pipeline on a creatively distinct story — ideally one that opts *out* of several capability flags Overton Park opts *into*. At current state of the corpus, this is `saving-the-maker-space`, but a minimal hand-authored contrast story would be better. The point is to verify the core-plus-extensions split actually works. If the only test cases are stories that make the same creative choices, the plan has secretly baked those choices into the "universal" core and nobody will notice.

**Exit criterion.** Contrast story produces a valid assistive package with correctly-absent conditional blocks. The reviewer does not flag the absence of conditional content as under-specification. The pedagogue honors the contrast story's `pedagogical_register` if it differs.

**Gate review — capability-declaration respect.** Verify that every conditional block is populated iff its flag is true, and that no schema rule forced content into a block whose flag is false.

Stage 6 is the end of the universal pipeline. After Stage 6, every episode in the corpus has a valid `assistive_package.yaml` produced by the new agents. App-specific work begins in the per-app track below.

---

### App-specific track (per app, runs after the universal pipeline)

These stages exist *per app* and do not block the universal pipeline or other apps. An app that consumes `assistive_package.yaml` directly without reshaping skips this track entirely.

#### App-Stage 1 — Contract + projector (Lens first)

**Action.** Write `apps/lens/docs/package-contract.md` stating which blocks Lens consumes, which optional blocks it requires, which capability flags the story must declare, and Lens's interpretation of each consumed field (lifeline-cost semantics, session pacing, etc.). Build the `app_projector` agent (or script) per §3.6. Run it end-to-end on a real episode against the real `assistive_package.yaml`.

**Exit criterion.** A full Lens session can be described using only `lens/app_package.yaml`, with no "and then the app somehow figures out X." The projector produces `lens/app_package.yaml` *deterministically* from `assistive_package.yaml` + the contract. Any gap surfaces as either a `contract_violations[]` entry (if the package should provide it) or an explicit Lens-side responsibility (if it's truly app-private).

#### App-Stage 2 — Migration and cleanup (per app)

**Action.** Migrate the app's existing artifacts and runtime code to the new package + projection. Retire the old fields from `analysis.yaml`, `facilitation.yaml`, `lens/scaffolding.yaml`, `lens/facilitation.yaml` for *this app's* consumption path. Update the app's documentation. `lens/session.yaml` is preserved for its session-configuration purpose, but any app-consumed content moves to `lens/app_package.yaml`.

**Exit criterion.** No app code references the retired fields. The app reads only `assistive_package.yaml` and (if the app has a contract) `lens/app_package.yaml`. Documentation is updated.

---

## 6. Governance rules

These are the rules the plan itself is accountable to, and which apply to any future extension of the assistive package.

### Rule 1 — Every required field traces to a justified source

Every required field in `ground_truth.yaml` or `learner_package.yaml` must trace to one of:

- A framework affordance (from `framework/docs/conceptual-framework.md` §1 and §2–§4)
- A well-validated instructional strategy from learning-science literature (named in §1.1 of this plan)

Fields that cannot trace to either are either moved to the opt-in extension set under a story-level capability flag, or removed. This rule is applied to every proposed field during stage 1 hand-authoring.

### Rule 2 — Creative choices are opt-ins, not defaults

A field or block that assumes a creative choice some story might not make is an opt-in extension, gated by a capability flag in the story design doc frontmatter. Examples: character-growth tracking, stance positions, author-written calibration warnings, specific pedagogical registers.

A new capability flag is added only when at least two distinct stories would use it differently, and the gated content cannot reasonably live in the default schema.

### Rule 3 — Light usage is valid

A story that lightly populates instructional metadata (one-level hint ladder, `cognitive_only` interactions where permitted, empty `blindspots` when the lens is weak-signal) is not flagged by the reviewer as under-specified. The reviewer checks that what is there is well-formed, not that the full machinery is exercised. (Rule 2 governs *creative choices*; Rule 3 governs *intensity of use of universal primitives*. They look similar but answer different questions.)

### Rule 4 — The pipeline supports, does not compel

The pipeline produces primitives aligned with proven instructional strategies, but no app is forced to use the primitives in those ways. An app may ignore `appropriate_for` tags and show all hints always; an app may ignore `struggle_calibration` and never gate hints. The pipeline's job is to make good practice cheap, not to compel it.

### Rule 5 — Redundancy is an error, not a feature

When two blocks contain the same content in different wrappings, one of them is wrong and must be deleted or merged. The current five-file pipeline has six such overlaps; part of this revision's value is eliminating them.

### Rule 6 — Turn anchors are mandatory

Because every Polylogue story is turn-based dialog, every annotation can be and must be anchored to turn IDs. Un-anchored observations are errors. This is what enables any downstream turn-level UI without re-inference.

### Rule 7 — IDs are hidden; labels are student-facing

Every student-facing field uses labels from `apps/lens/docs/teacher-overview.md`. Every machine-readable field uses canonical IDs from `framework/reference/`. The pedagogue's output must not leak IDs into labels, and the analyst's output must not leak labels into ID fields.

### Rule 8 — Agent roles are pure

The analyst does not speculate about students. The pedagogue does not invent ground truth. The reviewer does not rewrite. The app projector does not invent content the package lacks. Role-purity is enforced by the reviewer's criteria and by the agents' input restrictions.

### Rule 9 — App contracts are read-only consumers

App contracts may *narrow* what an app uses from the package; they may *not constrain* what the pipeline produces. If an app needs the pipeline to change, that goes through a plan revision, not through an edit to the contract. The `contract_violations[]` log is the upstream-communication channel: when the same violation recurs across episodes or apps, that's the §4 two-instance rule firing automatically and signals that the schema or a capability flag should change.

### Rule 10 — The app projection layer is optional

An app may consume `assistive_package.yaml` directly without a contract or a projector run. Contracts and projectors exist only for apps that need to reshape, narrow, or annotate the package with app-specific semantics. The absence of `apps/{app_id}/docs/package-contract.md` is not an error and does not block any pipeline stage. The universal pipeline's success criteria never reference `app_package.yaml`.

---

## 7. Non-goals, risks, and open questions

### 7.1 Non-goals

The following are explicitly out of scope for this revision. Naming them prevents scope creep and makes clear what a future revision might address.

- **Reasoning Lab migration is deferred but no longer evasive.** Reasoning Lab currently consumes the same `analysis.yaml` + `facilitation.yaml` as Lens and continues to do so during this revision. Under the projection-layer architecture, Reasoning Lab's path forward is principled: when the team is ready, it gets `apps/reasoning-lab/docs/package-contract.md` and its own projector run. Any gaps surface as `contract_violations[]` rather than as ad-hoc guesses, and the same governance rules (§4 two-instance, Rule 9 read-only) apply. The deferral is about sequencing, not about uncertainty.

- **Runtime LLM calls from the app.** The Lens app is non-AI by design. Every intelligent operation is precomputed. If a field seems to require runtime inference, that is a pipeline gap, not an app-side justification for adding an LLM.

- **Adaptive runtime behavior beyond what metadata permits.** The pipeline provides position tags, struggle calibration, and prior exposure. The app may use these to adapt. But the pipeline does not attempt to pre-compute all possible adaptation paths — the app is responsible for its own state machine.

- **Cross-story threading.** This revision supports within-episode and within-story threading (`connects_to`). It does not attempt cross-story continuity (a student who encountered confirmation bias in Overton Park and then starts Maker Space). That is a future-work question once multiple stories are in active use.

- **Teacher-authored overrides.** Teachers do not edit the assistive package at runtime in this revision. The package is read-only on the teacher side. Editing is a future feature.

- **Real-time analytics infrastructure.** The package contains hidden ID references that enable analytics, but the analytics pipeline itself is not in scope here.

### 7.2 Risks

- **Over-engineering risk (highest).** Every new field is pressure on the governance rules in §6. The risk is not any single field but accumulation over time. Mitigation: rule 1 is applied to every proposed field, and any field without a clean justification is cut. Stage 1 hand-authoring is the forcing function.

- **Agent prompt drift.** The pedagogue in particular is doing cognitively demanding work that is easy to get wrong. Mitigation: the reviewer has explicit criteria (§3.3) and the stage 3 architecture review catches drift early.

- **Pedagogical register leakage.** The pedagogue might accidentally write in a register other than the one declared. Mitigation: reviewer criterion 7 (register matching) and stage 3 gate review.

- **Corpus bias.** Testing only on Overton Park and Saving the Maker Space risks the schema quietly baking in those stories' choices. Mitigation: stage 6 is a contrast-case run, and rule 2 is applied to every capability decision.

- **Agent role impurity.** The pedagogue might invent ground truth if the analyst's output looks thin. Mitigation: the pedagogue's prompt forbids this explicitly, and the reviewer catches contradictions between the two files.

- **Schema version drift vs. agent prompts.** If a schema field changes and the prompt is not updated in the same commit, the agent produces broken output. Mitigation: co-locate schema and prompt in the same directory, and make schema-prompt parity a review criterion for any PR touching either.

### 7.3 Open questions

These are questions the plan does not answer. They should be answered before the implementation reaches the stage that surfaces them, not during that stage.

- **Meaningful absences.** Some stories use a character's absence from an episode as a structural pedagogical device (Priya's absence from Overton Park episode 5 is part of the scope lesson). The current schema has no place for "what's missing from this passage and does the absence do work?" Is this a general enough move to deserve a schema field, or is it story-specific enough to live only in prose? Deferred until stage 6 surfaces whether it actually matters for other stories.

- **Granularity of turn annotations.** Every turn in every passage, or only load-bearing turns? Finer granularity costs context but enables richer app-side UIs. Answer needed by stage 2.

- **Weak-signal lens policy.** When a lens has `signal: weak` on a passage, what exactly should `learner_response_space.by_lens` contain for that lens? The current plan allows `likely_readings` to be empty and requires `blindspots` to carry content, but this may need refinement after stage 3.

- **Minimum-wrestling enforcement.** `struggle_calibration.minimum_wrestling` names preconditions ("commit to a lens, write an observation") the app must enforce before hints unlock. Is this list standardized across the pipeline (enumerated preconditions) or free-form prose? The former is cleaner for the app, the latter more expressive. Answer needed by stage 3.

- **Counterfactual depth.** Per-facet one-sentence counterfactuals are cheap. Multi-sentence worked-rewrites of weak turns would be richer but more expensive. Defer the expansion question until an app use case requires it.

- **Contrast-case story acquisition.** Stage 6 requires a story that opts out of several flags. Do we use Saving the Maker Space as-is, modify it, or hand-author a minimal contrast story? Decision needed before stage 5.

---

## 8. What success looks like

When this revision is complete:

1. The Lens app reads one file per episode — `assistive_package.yaml` — and that file contains everything the app needs to deliver a full student and teacher session without any runtime LLM call.

2. Every field in the package traces to a framework affordance or a well-validated instructional strategy. The schema has no fields whose justification is "a specific story needs this."

3. The three instructional strategies named in this plan (productive struggle, faded assistance, perspective-taking) are richly supported by structured metadata in the package, and any app can implement them without precomputing anything itself.

4. Stories opt into creative extensions (character growth, stance positions, calibration warnings, specific registers) via a small set of capability flags in frontmatter. Stories that opt in get enriched packages. Stories that don't are served equally well with minimal packages.

5. The pipeline runs two LLM agents (analyst and pedagogue) plus one reviewer, and no agent is doing work another agent could do better. The agents have pure roles, pass artifacts through files, and do not engage in dialogue.

6. The current five-file overlap structure is eliminated. No content lives in two places.

7. At least two creatively distinct stories have been run through the revised pipeline end-to-end, and the contrast case has exposed any Overton-Park-specific assumptions that snuck into the "universal" core.

This is the pipeline the app deserves, and the app the framework's affordances have been waiting for. The revision is large but not speculative — every piece of it is grounded, every extension has a justification, every strategy has a primitive.

---

## Appendix A — Traceability matrix

| Required field | Source of justification |
|---|---|
| `facets_present[]` | Affordance 1 (name what is weak); framework §2 |
| `facets_absent_but_tempting[]` | Affordance 1 + non-AI app discrimination need |
| `lens_visibility` | Affordance 3a (cross-lens visibility); framework §3 |
| `turn_annotations` | Turn-dialog universal substrate (rule 6) |
| `causal_layer.cognitive[]` | Affordance 2; framework §2.2 |
| `causal_layer.social[]` | Affordance 2; framework §2.2 |
| `causal_layer.interaction` | Affordance 2 + framework §2.2 explicit commitment |
| `causal_layer` multiple forces rule | Affordance 3b; framework §4 |
| `perspective_transitions[]` | Affordance 3a made explicit; framework §3 |
| `counterfactuals[]` | Worked-examples instructional default (§1.1); Sweller, Renkl |
| `connects_to` | Spaced-practice strategy (default); within-story continuity |
| `learner_response_space.by_lens.*` | Non-AI app rubric replacement |
| `learner_response_space.explanation_quality` | Affordance 2 articulation support |
| `process_guidance.attention_cues[]` | Productive-struggle default + faded-assistance default |
| `process_guidance.deepening_moves` | Elaborative-interrogation default |
| `process_guidance.expected_divergence[]` | Affordance 3 (multiple legitimate perspectives) |
| `process_guidance.stall_signals` | Productive-struggle default |
| `process_guidance.struggle_calibration` | Productive-struggle default |
| `prior_exposure` | Faded-assistance default + spaced-practice default |
| `assumes_familiar_with[]` / `introduces[]` | Faded-assistance default |

Every field is accounted for by an affordance or an instructional default. No field is justified by "a specific story needs this."

## Appendix B — Diff against the current pipeline

**Files produced today (per episode):** `analysis.yaml`, `facilitation.yaml`, `lens/scaffolding.yaml`, `lens/facilitation.yaml`, `lens/session.yaml`.

**Files produced after this revision:** Universal — `ground_truth.yaml`, `learner_package.yaml`, `assistive_package.yaml`. Per-app (optional) — `{app_id}/app_package.yaml`, plus `lens/session.yaml` preserved for its session-configuration role (its file shape is unchanged, but any app-consumed content is now read from `lens/app_package.yaml` rather than directly from `session.yaml`).

**Agents changed.** The `evaluator` agent is retired and replaced by `analyst_agent` and `pedagogue_agent`. The `analysis_reviewer` and `scaffolding_reviewer` agents are merged into `package_reviewer` with the criteria in §3.3. A new `app_projector` agent (§3.6) lives in the per-app track and runs only when an app opts in.

**Commands changed.** `/analyze_transcript` and `/design_scaffolding` are merged into a single `/build_assistive_package` command that runs analyst → pedagogue → reviewer → merge. A new per-app command (e.g., `/project_for_app lens`) invokes the projector against an existing `assistive_package.yaml`. Operators running an app-agnostic story see one command where today they see two; operators running an app with a contract see one additional optional command.

**Schemas changed.** `analysis.schema.yaml` and `facilitation.schema.yaml` are retired. `lens/scaffolding.schema.yaml` is retired. New schemas are `ground_truth.schema.yaml`, `learner_package.schema.yaml`, `assistive_package.schema.yaml`.

**Commands unchanged.** `/create_episode`, `/create_transcript`, `/configure_session` are untouched. The information barrier remains enforced in the same way at the same stage.

---

*End of plan.*
