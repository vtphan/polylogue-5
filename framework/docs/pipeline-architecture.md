# Pipeline Architecture: An Assistive Package for Non-AI Applications

**Status.** Draft — describes **v2 (migration target)**, not the currently-live pipeline. See `pipeline-v1-to-v2-migration.md` for the diff against v1.
**Audience.** Pipeline maintainers, app builders, instructional-design reviewers.
**Scope.** Lens application. Reasoning Lab is deferred (see `pipeline-revision-plan.md` §7).

> **What this document is.** The architectural argument: why the pipeline is shaped the way it is, which pedagogical commitments it rests on, why the downstream half is split into four authoring agents, and which governance rules any future extension is accountable to. It is read once and returned to only when an architectural decision is being challenged.
>
> **Where to find the rest.** Field-level schemas, enforcement rules, the end-to-end revision sequence, and risks live in `pipeline-revision-plan.md`. The diff between this target design and the currently-running pipeline lives in `pipeline-v1-to-v2-migration.md`. This memo contains no field definitions, no procedural sequencing, and no comparisons to the current system. Section numbering is preserved across both design documents.

---

## 0. Why this revision exists

The Polylogue pipeline currently produces five files per episode that carry per-passage assistive content: `analysis.yaml`, `facilitation.yaml`, `lens/scaffolding.yaml`, `lens/facilitation.yaml`, and `lens/session.yaml`. These files grew field-by-field as each instructional question came up, and the result is a structure with at least six pairs of overlapping fields, inconsistent naming across files, and no single place the downstream app can point at and say "this is what I read."

More importantly: the Lens app has not yet been built. The app will be non-AI — it makes no runtime LLM calls, no runtime NLP, no runtime affect detection. Every piece of intelligent analysis, scaffolding, feedback, and discrimination must be precomputed by the pipeline and delivered to the app as structured data the app can consume via dictionary lookups and timers. The current five files were not designed with that contract in mind.

**The two halves of the pipeline want different architectural properties.** The upstream half (story authoring, episode planning, transcript generation and evaluation) works within a bounded creative space. That half wants stability. The downstream half (the assistive package) works within an open-ended creative space. That half wants the cost of adding a new capability to be low enough that extensions happen routinely rather than heroically. Rule 11 (§6) is the architectural commitment that makes the downstream half extensible.

This plan proposes a reorganization and extension of the pipeline's per-passage output into a single coherent **assistive package** that:

1. Groups content by the cognitive question it answers, not by the file it historically lived in.
2. Grounds every required field in a framework affordance or a well-validated instructional strategy.
3. Supports the downstream non-AI app as richly as possible, eliminating the temptation to do runtime LLM calls, NLP, or affect detection.
4. Extends only where the extension is cheap to produce and load-bearing for the app.
5. Organizes the LLM-bearing work along failure-mode boundaries so that future capabilities can be added or removed without disturbing the rest of the pipeline.

This memo covers the architectural arguments (§1 pedagogical commitments, §3 agent architecture, §6 governance rules) and the traceability evidence (Appendix A). The assistive-package field definitions (§2), capability-flag declarations (§4), end-to-end revision sequence (§5), and risks and open questions (§7) live in `pipeline-revision-plan.md`.

---

## 1. Pedagogical commitments

### 1.1 Two grounds for assumption

The pipeline makes assumptions on two grounds, and keeping them distinct matters:

**Ground A — framework-grounded universals.** Every Polylogue story shares four properties that are not creative choices but definitional:

1. **Purpose.** The story exists to teach critical thinking.
2. **Form.** The story is composed of turn-based multi-persona dialog.
3. **Vocabulary.** The story builds on the Polylogue conceptual framework — three lenses (Logic, Evidence, Scope), two classes of forces (cognitive biases and social dynamics), ten facets.
4. **Affordances.** The framework is designed to produce three affordances: naming what is weak, explaining why the reasoner got there, and holding more than one valid perspective.

The pipeline may assume these four without permission.

**Ground B — well-validated instructional defaults.** Some instructional strategies have enough empirical grounding in the learning-science literature that assuming them as defaults is low-risk and high-value:

- **Productive struggle** (Kapur; VanLehn; Schwartz & Bransford)
- **Faded assistance** (Collins, Brown & Newman; Wood, Bruner & Ross; Pea)
- **Elaborative interrogation / self-explanation** (Chi; Pressley)
- **Perspective-taking** — structural to Affordance 3
- **Worked examples / worked counterfactuals** (Sweller; Renkl)
- **Structured peer discussion with distributed roles and prompts** (Palincsar & Brown; Webb; Cohen)
- **Spaced / distributed practice** — for free given cross-episode threading (Cepeda et al.; Dunlosky et al.)

The pipeline supports these strategies by producing primitives aligned with them. It does not compel any app to use the primitives in those ways.

### 1.2 The three affordances operationalized at three layers

Each framework affordance is operationalized at **three layers** in the assistive package. The layers are distinguished by **what triggers them at runtime**, not by what phase of the student arc they serve.

- **L1 — source material.** Analytical ground truth, not user-visible. Feeds downstream authoring and merge-script derivations. Triggered by nothing — it is static source. Owned by the analyst.
- **L2 — pre-authored navigation content.** Shown or dealt on navigation events (episode load, phase transition, closure). Not reactive to per-student state beyond "what phase are we in." Owned by prose and discussion.
- **L3 — reactive intervention.** Fired on student-state events (inactivity, probe tap, attempt commit). Routes through probe taps, never through runtime NLP or affect detection. Owned by the diagnostic agent.

| Affordance | L1 (source) | L2 (pre-authored navigation) | L3 (reactive) |
|---|---|---|---|
| **1. Name what is weak** | `facets_present`, `facets_absent_but_tempting` | `entry_prompts`, `consensus_check` | Facet probe + intervention cells (present / tempting-absent) |
| **2. Explain why** | `causal_layer` with required `interaction` | *(subsumed into discussion cues with `explanatory_ref`)* | Opt-in explanation probe + explanation sub-ladders |
| **3. Hold more than one valid perspective** | `lens_visibility`, `perspective_transitions` | `discussion_cues` (three axes + `continuation_of`) | Afforded-missing intervention cells, lens-switch ladder rungs |

Nine cells, nine distinct operationalizations, no redundancy. The Affordance 3 individual-phase row is anchored by afforded-missing intervention cells, which make the pedagogically most-valuable case (`engagement: none, affordance: rich`) first-class.

**Why three layers.** Individual-phase and group-phase content can each be either pre-authored (dealt on phase entry) or reactive (fired on student state), and those two kinds fail in different ways and should be owned by different agents. A "when in the student arc" axis collapses that split; the three-layer runtime-trigger axis preserves it. Field-level definitions for each cell live in `pipeline-revision-plan.md` §2.

#### Affordance 1 — name what is weak

Operationalized analytically by `facets_present` and `facets_absent_but_tempting`. The pipeline commits to what facets are present and which are absent-but-tempting at passage scope, with all the turn-level anchoring in `turn_annotations`. Reactive individual-phase operationalization lives in the per-turn intervention dictionary's facet probe and the three-role cells it routes into. Pre-authored individual-phase operationalization lives in `entry_prompts` (the blank-page rung). Group-phase is `consensus_check`, explicitly labeled as a closure probe.

#### Affordance 2 — explain why the reasoner got there

Operationalized analytically by `causal_layer` at passage scope. The framework's requirement that "every moment in reasoned discussion has both a cognitive and a social dimension, and understanding how they interact is the deepest level of explanation the framework supports" is enforced by the required `interaction` field.

Reactive operationalization lives in opt-in explanation probes and their sub-ladders, authored only for cells where the diagnostic agent judges "why" is pedagogically load-bearing (typically the passage's most urgent cells and the non-trivial interaction cells). The opt-in gate prevents over-authoring.

Group-phase operationalization lives inside `discussion_cues` via the `explanatory_ref` field, which lets any cue carry a bias or dynamic reference.

#### Affordance 3 — hold more than one valid perspective

Operationalized analytically by `lens_visibility` (per-lens engagement and affordance) and `perspective_transitions` (directional pairs).

The L1→L3 bridge for Affordance 3 is the **engagement/affordance matrix**. The matrix classifies each lens on each passage along two orthogonal axes, and v2 uses that classification to drive the per-turn intervention dictionary's afforded-missing cells. The `(engagement: none, affordance: rich)` case — a lens the passage richly affords but nobody engaged — becomes a first-class intervention cell distributed across the turns where its missing observation would most naturally attach. This is the framework's distinctive lens-switching move, operationalized reactively for the first time.

Pre-authored group-phase operationalization lives in `discussion_cues` with their three creative axes (lens refraction, persona projection, stance inversion). The new `continuation_of` field lets the app select cues per student at the individual→group transition: a student who worked on `source_credibility` on turn 11 in the individual phase gets a cue that continues `source_credibility` into the group phase, not a random assignment.

Reactive group-phase operationalization uses the same `discussion_cues` content, deployed via the cue-refetch loop: when the app detects a quiet student or an over-circled angle, it fetches a new cue for that student, routing by `independent_of` and probe history.

### 1.3 Where the instructional defaults live

The instructional defaults in §1.1 do not require their own schema blocks. They are **default uses of the affordance primitives**, enabled by small metadata additions:

- **Productive struggle.** The mechanism is the *shape* of the per-turn intervention ladders: cheap nudges precede paid hints, questions dominate early rungs, hints and worked examples dominate late rungs, the ladder is monotonic in `reveals`. This shape is content the diagnostic agent authors per cell. `struggle_calibration` is a coarse thermostat on top (`pace`, `minimum_wrestling[]` as enumerated action gates, `productive_duration`) — it modulates the ladders the agent already authored, but is not itself the mechanism. *If the ladder shapes are weak, no pricing policy will save them.* Detection of student struggle is app-owned via inactivity; the pipeline authors no detection heuristics.

- **Faded assistance.** Enabled by `prior_exposure` (merge-script-derived from story sequence), `assumes_familiar_with` / `introduces` at passage level, and `minimum_wrestling[]` gates that the app consults to filter which rungs unlock cheaply. The app fades by filtering rungs based on per-student cumulative facet exposure tracked in the probe record (§2.7 of the plan).

- **Elaborative interrogation.** Enabled by the question-type rungs in the per-turn intervention ladders, which push from *what* the student said to *why* it is what it is. Reinforced by the optional explanation sub-ladders.

- **Perspective-taking.** Enabled by `perspective_transitions` (analytical), `discussion_cues` with three creative axes (pre-authored group), and afforded-missing intervention cells (reactive individual).

- **Worked examples.** Enabled by `counterfactuals[]` per facet, surfaced by the merge script as the bottom `worked_example` rung of present-role intervention ladders.

- **Structured peer discussion.** Enabled by `discussion_cues` (with `continuation_of`, `explanatory_ref`, null-turn support), `talk_moves`, and `jigsaw_fragments`. Empty-history students get generic opening cues via `continuation_of: null`; students with probe history get matching-continuation cues.

- **Spaced practice.** Enabled for free by `connects_to.echoes` cross-passage threading.

No new blocks for any of these. Metadata on existing blocks, plus the primitives above.

### 1.4 "Unfinished, not wrong" and other story-level register choices

Some stories commit to pedagogical stances that are creative choices, not framework commitments. *The Overton Park Sightings* commits to "thin reasoning is not wrong reasoning — it is reasoning that hasn't finished yet." This is a register choice that shapes how the prose and discussion agents write rationales, hints, and redirect language.

The pipeline handles this via a story-level capability declaration (defined in `pipeline-revision-plan.md` §4): the story design doc's frontmatter names the `pedagogical_register` it wants, and the prose and discussion agents read this and match their prose accordingly. Stories that don't declare one get a generic neutral register.

### 1.5 Summary of Part 1

The pipeline's output is grounded in three framework affordances plus seven well-validated instructional defaults. Every required schema field traces to one of those sources and to exactly one of the three layers (L1 source / L2 pre-authored navigation / L3 reactive intervention). Any field that cannot trace to a framework affordance or a well-validated instructional strategy is either moved to the opt-in extension set or removed from the plan. **Productive struggle's mechanism is the shape of the per-turn intervention ladders, not the `struggle_calibration` block.** **Detection is app-owned; content is pipeline-owned; routing is student-owned via probe taps.** These two commitments are what make the non-AI contract honest.

### 1.6 Universal core vs. app-coupled layer

Not every block in the package is equally portable across apps. The plan distinguishes two layers:

**Universal core (framework-shaped, app-agnostic).** Everything in `ground_truth.yaml`, `diagnostic.yaml`, `prose.yaml`, and `discussion.yaml` in full. Any non-AI critical-thinking app built on the Polylogue framework would want this content unchanged.

**App-coupled interpretation (Lens-shaped today, generalizable later).** The lifeline-cost economy in ladder `cost` fields, the "commit to a reading then get assessed" loop, session pacing, and UI rituals (click-a-turn, tap-a-probe, "why?" affordance) are interpretation choices a specific app makes when it consumes the package. The pipeline produces neutral primitives; the app decides what they mean and how they are presented.

The universal pipeline produces only the universal core and ends at `assistive_package.yaml`. Anything an app does with that artifact happens in the **app layer** (governed by Rule 12, §6).

---

## 3. Agent architecture

The current `/analyze_transcript` command uses a single `evaluator` agent that produces both analytical and pedagogical content in one pass. This revision splits that into **four authoring agents** — analyst, diagnostic, prose, and discussion — plus one reviewer. The split follows the cognitive-job boundary described in §3.6, not the phase boundary.

Field-level schemas for each agent's output live in `pipeline-revision-plan.md` §2.

### 3.1 The analyst agent

**Input.** `episode.yaml`, `transcript.yaml`, the canonical reference files from `framework/reference/`, and (for cross-episode threading) the episode index of the story.

**Output.** `ground_truth.yaml` (schema in `pipeline-revision-plan.md` §2.1 and §2.2).

**Cognitive job.** Close reading against a known framework. Identify what facets fire, with what severity, anchored to which turns. Identify facets-absent-but-tempting. For every lens per passage, write the two orthogonal `lens_visibility` judgments: `engagement` (how much the characters actually used the lens) and `affordance` (how much the topic gives the lens to work with). Annotate every turn with `speaker` and `turn_id`; populate content fields iff the turn is load-bearing. Write the causal layer with required interaction. Generate perspective transitions. Produce counterfactuals. Identify cross-passage `echoes` and `contrasts` (bare — no more `sets_up[]`, no more `contrast_prompt`).

**Reading the transcript fresh.** The analyst receives `episode.yaml` (which contains the operator-designed `target_facets`), but must derive `facets_present[]` from the transcript without using the designed targets as a hint.

**Constraints.**

- The analyst must not speculate about what students will say.
- The analyst must cite turn IDs for every annotation.
- The analyst uses canonical IDs from `framework/reference/` for every facet, pattern, and dynamic reference.

**Failure modes defended against.** Conflating "what's true about the passage" with "what students will say"; picking a single force as "the" explanation when the framework permits multiple; hand-waving the interaction field with generic language.

### 3.2 The diagnostic agent

**Input.** `episode.yaml`, `transcript.yaml`, `ground_truth.yaml` (read from file), the canonical reference files, and a **story position** object (episode number, prior facet/pattern exposure list, story design doc frontmatter with capability declarations).

**Output.** `diagnostic.yaml` (schema in `pipeline-revision-plan.md` §2.3).

**Cognitive job.** *Hold a student error model in mind and author the probes and per-turn intervention ladders that let the app deliver calibrated intervention via dictionary lookup, with no runtime NLP or affect detection.*

The agent's primary output is the per-turn three-role intervention dictionary. Each turn entry carries both a `blank_page` escape cell and a `by_facet[F]` map of facet cells — i.e. `interventions.by_turn[T].{blank_page, by_facet[F]}` (full shape in `pipeline-revision-plan.md` §2.3.2). For each load-bearing turn, the agent derives the relevant facet set from three sources:

1. **Present facets** — facets the analyst signaled on T in `turn_annotations`.
2. **Afforded-missing facets** — facets the `lens_visibility` engagement/affordance matrix says the passage affords but nobody engaged, distributed across the turns where those missing observations most naturally attach. The `(engagement: none, affordance: rich)` case is the highest-urgency pedagogical moment and must be covered.
3. **Tempting-absent facets** — facets from `facets_absent_but_tempting[]` that would plausibly attract a student's attention on T.

For each resulting `(turn, facet)` cell, the agent authors:

- A `role` tag (present / afforded_missing / tempting_absent).
- An `opening` sentence framing the cell for the student, register-matched to the story.
- A `ladder[]` of mixed-type rungs (nudge / question / hint / lens_switch / redirect / worked_example), monotonic in `reveals`, with `cost` fields for lifeline economics.
- A `has_explanation_depth: bool` flag gating whether an explanation probe and sub-ladder are authored for this cell. The flag is opt-in per cell; the agent authors depth only where "why" is pedagogically load-bearing.

The agent also authors the orientation probes (`probes.facet.by_turn[T]`) that route students into cells, and, where `has_explanation_depth: true`, the depth probes (`probes.explanation.by_turn_facet[T][F]`).

The agent authors the lean `struggle_calibration` (`pace`, `minimum_wrestling[]`, `productive_duration`) per passage. **The agent understands that struggle_calibration is not the productive-struggle mechanism** — the mechanism is the shape of the ladders it has just authored. `struggle_calibration` is a coarse knob that modulates those ladders. The agent's prompt is explicit about this, so it does not over-invest in calibration at the expense of ladder shape.

**Internal scratch.** The agent reasons about `response_space.by_lens` (likely / partial / misreading / blindspot categories) as working notes, and emits those notes as an audit trace in the output file. The merge script does not consume them at runtime — the intervention dictionary is the runtime source.

**Blindspot calibration by matrix cell.** The `(engagement: none, affordance: rich)` blindspots become afforded-missing intervention cells at maximum urgency; `(engagement: none, affordance: moderate)` become afforded-missing cells at high urgency; `(engagement: none, affordance: thin)` become cells at habit-building urgency; `(engagement: partial, *)` become cells whose opening names what the partial engagement stopped short of; `(engagement: high, affordance: rich/moderate)` become cells naming subtler edges. The `(engagement: high, affordance: thin)` cell has no cells by design.

**Constraints.**

- The diagnostic agent reads ground truth but does not alter it. If it believes ground truth is wrong, it emits a `reviewer_flags[]` entry.
- Intervention ladder text must be passage-specific. Generic rungs are flagged.
- Ladder rungs must direct attention without giving the observation, except at the `worked_example` bottom rung which reveals the counterfactual.
- The agent does not author opening prose, entry prompts, consensus checks, or any group-phase distributables. That is prose and discussion territory.
- The agent does not pattern-match student prose or instruct the app to do so. Routing is student-owned via probe taps.

**Failure modes defended against.** Over-specifying hints into answers; generic ladder prose; skipping afforded-missing cells (the hardest and most pedagogically valuable part); hand-waving `opening` sentences; treating `struggle_calibration` as the productive-struggle mechanism; authoring explanation depth on every cell instead of where it matters; rubber-stamping the analyst.

### 3.3 The prose agent

**Input.** `episode.yaml`, `transcript.yaml`, `ground_truth.yaml`, `diagnostic.yaml` (for register consistency with ladder text), the **story design doc** at `framework/stories/{story_id}.md` (read-only), the story position object, and reference files.

**Output.** `prose.yaml` (schema in `pipeline-revision-plan.md` §2.4).

**Cognitive job.** *Write short, voiced, register-matched prose at the entry and closure moments of the student arc.* Produce the student-facing `episode_opening` in the story's voice. Write `entry_prompts` that unblock the blank page without revealing the observation. Write `consensus_check` questions that drive group closure.

**Why these three cluster together.** All three share a register, a voice, a grade level, and a failure mode (adult-sounding, off-register, generic). None requires holding a student error model; all require holding the story's voice. This is homogeneous work by §3.6's test.

**Constraints.**

- The prose agent matches the story's declared `pedagogical_register`.
- The prose agent does not leak framework terminology into student-facing text.
- The prose agent does not produce ladder content, probe options, or discussion distributables.

**Failure modes defended against.** Adult-sounding voice; generic prose that would fit any passage; register drift across episodes; accidentally leading the student toward a specific observation in `episode_opening` or `entry_prompts`.

### 3.4 The discussion agent

**Input.** `episode.yaml`, `transcript.yaml`, `ground_truth.yaml`, `diagnostic.yaml`, `prose.yaml` (for register and voice consistency), the story design doc (for character voices and persona-projection grounding), and reference files.

**Output.** `discussion.yaml` (schema in `pipeline-revision-plan.md` §2.5).

**Cognitive job.** *Generate voiced, distributable, creatively varied group-phase primitives across three creative axes, indexed so the app can match them to each student's individual-phase work.*

Primary output is `discussion_cues[]`, indexed along seven axes:

- `angle` — the facet the cue concerns.
- `lens` — the lens the cue routes through.
- `axis` — one of three creative axes: lens refraction, persona projection, stance inversion.
- `continuation_of: (turn, facet) | null` — for the individual→group handoff. Cues with `continuation_of` match students whose individual-phase probe record ends on that `(turn, facet)`; cues with `continuation_of: null` are generic openings for empty-history students.
- `explanatory_ref: cognitive_pattern_id | social_dynamic_id | null` — for cues carrying "why" content routed by the student's explanation-probe tap.
- `persona` — for persona-projection cues, names the character the cue invokes.
- `independent_of` — for non-overlap partition contract.

The agent also supports a null `turn` key for cues that aren't anchored to a specific turn. The agent also produces `talk_moves[]` (grade-calibrated sentence stems, episode scope) and `jigsaw_fragments[]` (capability-flagged).

**Why this is its own agent.** Cue generation has two properties no other downstream work has. First, it produces a *plural, distinguishable-by-angle set from a single underlying observation* — no other block produces multiple variants that must be kept substantively independent. Second, it is the most open-ended creative surface in the pipeline: new axes, new persona strategies, new activity formats keep arriving. Both properties diverge its failure modes from every other agent. Rule 11's iteration-frequency tiebreaker applies — this is the agent expected to iterate most frequently as new pedagogical capabilities arrive, while the diagnostic agent is expected to stabilize.

**Constraints.**

- The discussion agent does not alter any upstream file. It emits `reviewer_flags[]` when upstream files are thin.
- Persona-projected cues must honor the story's character voices.
- Cues with the same `angle` must carry `independent_of` entries distinguishing them, and the distinction must be substantive.
- Every `(turn, facet)` intervention cell with `role: present` or `role: afforded_missing` must have at least one matching-angle cue (cross-file integrity; enforced by the merge script).
- Every passage must have at least one `continuation_of: null` cue per lens with `affordance ∈ {moderate, rich}` (empty-history-student guarantee).

**Failure modes defended against.** Cues that collapse to the same reasoning move under cosmetic variation; persona voices that contradict established characters; generic cues that would fit any passage; over-cueing thin turns and under-cueing rich ones; stylistic convergence across episodes; dead handoffs where the probe record has no matching cue to fetch.

### 3.5 The package reviewer

**Input.** All four authored files plus the episode plan and story frontmatter.

**Output.** `ACCEPT` or `REVISE` with structured findings.

**Review criteria (judgment-only).** Mechanical checks are enforced by the merge script (`pipeline-revision-plan.md` §2.6) and are not the reviewer's job.

*Analyst criteria:*
1. **Near-miss discriminability** — every `facets_absent_but_tempting` entry has a non-hand-wavy `why_wrong` that actually distinguishes the case.
2. **Multiple forces listed** — when the evidence supports more than one force for a facet, the causal layer lists them all.
3. **Counterfactual specificity** — each `counterfactuals[]` entry names a concrete change to the cited turn.
4. **Analyst vs. upstream `transcript_reviewer` reconciliation** — `facets_present[]` is consistent with what the upstream reviewer concluded "landed." Rubber-stamping the operator's design is a REVISE.

*Diagnostic agent criteria:*
5. **Intervention cell specificity** — sampled cells across all three roles have passage-specific `opening` sentences and ladder rungs. Generic rungs that would work on any reading are flagged. **Afforded-missing cells are held to the highest specificity bar**, especially the `(engagement: none, affordance: rich)` cells. A generic entry here counts as a larger failure than generic content anywhere else.
6. **Ladder calibration** — sampled ladders direct attention without giving the observation at early rungs; worked-example bottom rungs reveal the counterfactual cleanly. Ladders are monotonic in `reveals`.
7. **Probe option coverage** — sampled facet probes offer options spanning all three roles where available and carry a blank-page escape.
8. **Explanation-depth opt-in judgment** — sampled cells with `has_explanation_depth: true` are the ones where "why" is pedagogically load-bearing (typically the highest-urgency afforded-missing cells and cells with non-trivial `interaction` values). Sampled cells with `has_explanation_depth: false` can be defended as cells where surface facet-level content is enough.
9. **`struggle_calibration` differentiation** — `pace`, `minimum_wrestling[]`, and `productive_duration` values meaningfully differentiate across passages. A package with uniform `standard / [selected_a_facet] / moderate` everywhere is flagged.
10. **Diagnostic agent `reviewer_flags[]` adjudication** — every flag is resolved.

*Prose agent criteria:*
11. **Register matching** — sampled prose matches the story's declared `pedagogical_register`.
12. **Grade-appropriate voice** — sampled entries sound like a 6th grader could say or read them.

*Discussion agent criteria:*
13. **Creative-axis independence** — cues on the same turn genuinely draw on different axes or different moves within one axis.
14. **Persona voice fidelity** — sampled persona-projected cues sound like the character they invoke.
15. **Creative non-convergence** (cross-episode mode) — the discussion agent is not producing template-shaped cues across episodes.
16. **Cross-phase continuity coverage** — sampled `continuation_of` cues actually connect to something the individual-phase intervention dictionary would route students into.

*Cross-agent criterion:*
17. **Block orthogonality** — no content appears in two files that should be one. Any accidental drift between the four agents is caught here.

**Cross-episode consistency.** After every episode in a story has been packaged, the reviewer runs a cross-episode pass verifying that `connects_to.echoes` references resolve coherently, that `pedagogical_register` does not drift, and that criterion 15 holds.

The reviewer is a separate agent with fresh context. When it returns `REVISE`, the operator re-runs the relevant agent with the specific findings. No agent-to-agent dialogue.

### 3.6 Why four agents, not more or fewer

**Not one monolith.** The existing `evaluator` mixes analytical and pedagogical work and exhibits the predictable failure mode.

**Not two (analyst + pedagogue).** Under the full set of capabilities this revision introduces, a pedagogue agent would have three visibly different failure modes: revealing/over-specifying (diagnostic work), sounding adult (prose work), and producing cues that collapse under cosmetic variation (discussion work). Rule 11 Corollary 2 splits them.

**Not three (analyst + diagnostic + one scaffolding-plus-discussion).** Prose failure modes (adult-sounding, off-register) and discussion failure modes (cue collapse, persona drift, creative convergence) are different. They have different iteration rhythms — prose conventions stabilize quickly; cue generation iterates often.

**Not five or six.** Splitting the diagnostic agent further — probe author vs. ladder author vs. calibration author — would create reconciliation overhead the reviewer would absorb, which is the evaluator-in-waiting pattern.

The four authoring agents split on the deepest cognitive-job boundary available: **what does the agent need to hold in mind.**

- **Analyst** holds the framework vocabulary and the transcript.
- **Diagnostic agent** holds the student error model.
- **Prose agent** holds the story's voice and register.
- **Discussion agent** holds character canon and the three-axis creative surface.

**Four is also the maximum.** Any further LLM work any app needs lives at the app layer under Rule 12.

### 3.7 Coordination rules

1. **Files, not inline.** Every agent reads its inputs from files and writes its output to one file.
2. **Sequential execution with file handoffs.** `/build_assistive_package` runs analyst → diagnostic → prose → discussion in order. The sequence matters because prose reads diagnostic for register, and discussion reads both diagnostic and prose for register and voice.
3. **All agents see the full transcript.**
4. **No agent-to-agent dialogue.** If the reviewer flags a contradiction, re-run the affected agent.
5. **The reviewer runs once at the end, reading all four files together.**
6. **The merge script runs only after the reviewer returns ACCEPT.**

### 3.8 Claude Code surface mapping

The framework's shared pipeline maps onto Claude Code mechanics as follows.

**Slash commands** for the shared pipeline live in `framework/pipeline/commands/`, synced into `.claude/commands/` by each app's `initialize_{app_id}.py`.

**Subagents** for the shared pipeline are the Rule 11 LLM-bearing units, stored in `framework/pipeline/agents/`, synced into `.claude/agents/`.

**Deterministic scripts** are Python under `framework/pipeline/scripts/`, invoked from commands but not subagents.

**Universal pipeline command table:**

| Slash command | Subagents (sequential) | Deterministic steps | Output files |
|---|---|---|---|
| `/create_episode {story} {NN}` | `planning_agent` → `validation_agent` → `projection_reviewer` | `validate_schema.py` | `episode.yaml`, `episode_writer_input.yaml` |
| `/create_transcript {story} {NN}` | `dialog_writer` (barrier-isolated) → `transcript_id` → `transcript_reviewer` | — | `transcript.yaml` |
| `/build_assistive_package {story} {NN}` | `analyst_agent` → `diagnostic_agent` → `prose_agent` → `discussion_agent` → `package_reviewer` | `merge_assistive_package.py`, `validate_schema.py` | `ground_truth.yaml`, `diagnostic.yaml`, `prose.yaml`, `discussion.yaml`, `assistive_package.yaml` |

Three rows, three framework-owned commands.

**Bootstrap.** `initialize_{app_id}.py` clears `.claude/commands/` and `.claude/agents/`, then syncs the shared-pipeline files plus the app's own files.

---

## 6. Governance rules

These are the rules the plan is accountable to, and which apply to any future extension. A scannable operational reference — one row per rule — lives as Appendix B of `pipeline-revision-plan.md`.

### Rule 1 — Every required field traces to a justified source

Every required field must trace to either a framework affordance (from `framework/docs/conceptual-framework.md` §1 and §2–§4) or a well-validated instructional strategy (named in §1.1 of this memo). Fields that trace to neither are moved to the opt-in extension set under a capability flag, or removed.

### Rule 2 — Creative choices are opt-ins, not defaults

A field or block that assumes a creative choice some story might not make is an opt-in extension, gated by a capability flag. A new capability flag is added only when at least two distinct stories would use it differently, and the gated content cannot reasonably live in the default schema.

### Rule 3 — Light usage is valid

A story that lightly populates instructional metadata is not flagged as under-specified. The reviewer checks that what is there is well-formed, not that the full machinery is exercised. Rule 3 is enforceable mechanically via the engagement/affordance matrix: a lens with `affordance: thin` is thinness (protected by Rule 3); a lens with `(engagement: none, affordance: rich)` is a reasoning gap (the reviewer's urgent case).

### Rule 4 — The pipeline supports, does not compel

The pipeline produces primitives aligned with proven instructional strategies, but no app is forced to use them in those ways. **Operational corollary:** the pipeline authors no block whose correct operation requires the app to do runtime NLP, runtime affect detection, or runtime pattern matching of student prose. Detection is app-owned; content is pipeline-owned; routing is student-owned via probe taps.

### Rule 5 — Redundancy is an error, not a feature

When two blocks contain the same content in different wrappings, one of them is wrong. The design enforces this by routing all group-phase "why" content through `discussion_cues.explanatory_ref`, all cross-passage threading through `connects_to.echoes`, and all individual-phase reactive content through the per-turn intervention dictionary.

### Rule 6 — Turn anchors are mandatory

Because every Polylogue story is turn-based dialog, every annotation can be and must be anchored to turn IDs. The primary intervention key is `(turn, facet)`, which makes Rule 6 load-bearing for the runtime app loop, not just for traceability.

### Rule 7 — IDs are hidden; labels are student-facing

Every student-facing field uses labels from `apps/lens/docs/teacher-overview.md`. Every machine-readable field uses canonical IDs from `framework/reference/`. The literal-scan validator catches leakage in either direction.

### Rule 8 — Agent roles are pure

The analyst does not speculate about students. The diagnostic agent does not invent ground truth. The prose agent does not author ladder or cue content. The discussion agent does not author diagnostic or prose content. The reviewer does not rewrite.

### Rule 9 — App contracts are read-only consumers

App contracts may *narrow* what an app uses; they may *not constrain* what the pipeline produces. If an app needs the pipeline to change, that goes through a plan revision.

**Making recurrence visible.** A small aggregator script (`scripts/scan_contract_violations.py`) walks `artifacts/**/{app_id}/` for any contract-violation records an app chooses to emit, groups by `violation_id`, and reports any ID appearing in ≥2 episodes or ≥2 apps.

### Rule 10 — Contracts are optional

An app may consume `assistive_package.yaml` directly without ever writing a contract document.

### Rule 11 — One cognitive job per agent; one agent per file

Every LLM-bearing unit of work in the pipeline is an agent with a single named cognitive job. Each agent reads its inputs from files, writes its output to one file, and does not negotiate with other agents. Adding a new intelligent capability means adding an agent and a file; removing one means deleting an agent and a file.

**Corollary 1 — Deterministic work stays deterministic.** Merging, aggregation, integrity checks, and enumeration inversion are never placed inside an agent.

**Corollary 2 — Different failure modes mean different agents, even with shared context.**

**Corollary 3 — The reviewer is an agent too.** When reviewer criteria start spanning unrelated judgment kinds, the reviewer is becoming an evaluator-in-waiting.

**Iteration-frequency tiebreaker.** When a new capability's failure mode overlaps with two existing agents, prefer adding a new agent if it is expected to iterate more frequently.

### Rule 12 — Apps own everything app-specific; the framework stops at the handoff

The universal pipeline produces framework-shaped, app-agnostic artifacts. Its terminal artifact per episode is `assistive_package.yaml`. After that artifact is written, the framework's responsibility for the episode ends.

**The handoff contract.** Anything an app does with `assistive_package.yaml` happens in the app's own layer: app-specific code under `apps/{app_id}/pipeline/`, an optional contract document at `apps/{app_id}/docs/package-contract.md`, and per-episode app outputs strictly under `artifacts/{story_id}/episodes/episode_{NN}/{app_id}/`.

**The probe record** documented in `pipeline-revision-plan.md` §2.7 is named as app-owned state: the app maintains the record, the pipeline never reads or writes it, and the package's indexing is designed so every reactive block consumes `(turn, facet, explanatory_variable)` tuples from that record. This gives app designers a clear contract for what state to carry without constraining how they carry it.

**What apps are free to decide.** Whether to run any Claude Code commands at the app layer, what to name them, whether to use LLMs at build-time (runtime is non-AI by design), what file shapes to use inside `{app_id}/`.

**What apps may not do.** Write outside their `{app_id}/` directory, modify universal artifacts, depend on another app's outputs, use their contract document to constrain what the universal pipeline produces.

**Why Rule 11 and Rule 12 are separate.** Rule 11 governs LLM modularity *inside* the framework's shared pipeline. Rule 12 governs the *boundary* between the framework and any specific app. The two rules operate at different layers and compose cleanly.

---

## Appendix A — Traceability matrix

| Required field | Source of justification | Agent | Layer |
|---|---|---|---|
| `facets_present[]` | Affordance 1; framework §2 | analyst | L1 |
| `facets_absent_but_tempting[]` | Affordance 1 + three-role intervention surface | analyst | L1 |
| `lens_visibility.{engagement, affordance, what_shows}` | Affordance 3a; framework §3 | analyst | L1 |
| `turn_annotations[]` | Turn-dialog universal substrate (Rule 6) | analyst | L1 |
| `turn_annotations.discussion_cue_seeds[]` | Raw material for group-phase cues | analyst | L1 |
| `causal_layer.{cognitive, social, interaction}` | Affordance 2; framework §2.2 | analyst | L1 |
| `causal_layer` multiple-forces rule | Affordance 3b; framework §4 | analyst | L1 |
| `perspective_transitions[]` | Affordance 3a made explicit; framework §3 | analyst | L1 |
| `counterfactuals[]` | Worked-examples default | analyst | L1 |
| `connects_to.{echoes, contrasts}` (bare) | Spaced-practice default | analyst | L1 |
| `turn_annotations.causal_signals` (derived) | Affordance 2 at turn granularity | merge script | L1 |
| `prior_exposure` (derived) | Faded-assistance + spaced-practice defaults | merge script | L1 |
| `probes.facet.by_turn[T]` | Student-owned routing; non-AI constraint; Affordance 1 | diagnostic | L3 |
| `probes.explanation.by_turn_facet[T][F]` (opt-in) | Affordance 2; elaborative-interrogation default | diagnostic | L3 |
| `interventions.by_turn[T].by_facet[F].role` | Three-role coverage (Affordances 1 and 3) | diagnostic | L3 |
| `interventions.*.ladder[]` | Productive-struggle + faded-assistance defaults | diagnostic | L3 |
| `interventions.*.has_explanation_depth` | Opt-in depth; elaborative-interrogation default | diagnostic | L3 |
| `interventions.*.explanation.by_explanatory_variable` | Affordance 2 reactive | diagnostic | L3 |
| `struggle_calibration.{pace, minimum_wrestling, productive_duration}` | Productive-struggle default (pricing knob) | diagnostic | L3 |
| `assumes_familiar_with[]` / `introduces[]` | Faded-assistance default | diagnostic | L3 |
| `response_space.by_lens` (working notes) | Audit trace for reviewer; not runtime | diagnostic | L3 (scratch) |
| `episode_opening` | Priming / engagement | prose | L2 |
| `entry_prompts[]` | Faded-assistance default; cognitive-load reduction | prose | L2 |
| `consensus_check[]` | Affordance 1 at group closure | prose | L2 |
| `discussion_cues[]` (three axes + `continuation_of` + `explanatory_ref`) | Affordance 3 + perspective-taking + structured-peer-discussion defaults | discussion | L2 |
| `talk_moves[]` | Structured-peer-discussion default | discussion | L2 |
| `jigsaw_fragments[]` (flag-gated) | Structured-peer-discussion default | discussion | L2 |

Every field in the package is accounted for by an affordance or an instructional default and lives in exactly one agent's output at exactly one layer.

---

*End of architecture memo. For the assistive-package field definitions, capability-flag declarations, revision sequence, risks, and the one-page governance rules reference, see `pipeline-revision-plan.md`. For the diff between this target design and the currently-running pipeline, see `pipeline-v1-to-v2-migration.md`.*
