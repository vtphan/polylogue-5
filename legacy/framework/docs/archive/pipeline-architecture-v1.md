# Pipeline Architecture: An Assistive Package for Non-AI Applications

**Status.** Draft for review. Not yet approved for implementation.
**Audience.** Pipeline maintainers, app builders, instructional-design reviewers.
**Scope.** Lens application. Reasoning Lab is deferred (see `pipeline-revision-plan.md` §7).

> **What this document is.** The architectural argument: why the pipeline is shaped the way it is, which pedagogical commitments it rests on, why the downstream half is split into four authoring agents, and which governance rules any future extension is accountable to. It is read once and returned to only when an architectural decision is being challenged.
>
> **Where to find the rest.** Field-level schemas, enforcement rules, the end-to-end revision sequence, risks, and the diff against the current pipeline live in `pipeline-revision-plan.md`. This memo contains no field definitions or procedural sequencing. Section numbering is preserved across both documents, so gaps here (there is no §2, §4, §5, §7, §8) correspond to sections that live in the plan.

---

## 0. Why this revision exists

The Polylogue pipeline currently produces five files per episode that carry per-passage assistive content: `analysis.yaml`, `facilitation.yaml`, `lens/scaffolding.yaml`, `lens/facilitation.yaml`, and `lens/session.yaml`. These files grew field-by-field as each instructional question came up, and the result is a structure with at least six pairs of overlapping fields, inconsistent naming across files, and no single place the downstream app can point at and say "this is what I read."

More importantly: the Lens app has not yet been built. The app will be non-AI — it makes no runtime LLM calls — which means every piece of intelligent analysis, scaffolding, feedback, and discrimination must be precomputed by the pipeline and handed to the app as structured data. The current five files were not designed with that contract in mind. Fields that seemed adequate when the pipeline was producing them for human review turn out to be underspecified for a system that must deliver them to students without any further reasoning in between.

**The two halves of the pipeline want different architectural properties.** The upstream half (story authoring, episode planning, transcript generation and evaluation) works within a bounded creative space: the shape of a story, an episode, a transcript is understood, and operators build trust through repetition. That half wants stability. The downstream half (the assistive package) works within an open-ended creative space: new pedagogical capabilities, new app needs, and new instructional strategies keep arriving, and operators build trust through iteration. That half wants the cost of adding a new capability to be low enough that extensions happen routinely rather than heroically. Rule 11 (§6) is the architectural commitment that makes the downstream half extensible; the upstream half inherits it for free because it isn't pushing on it.

This plan proposes a reorganization and extension of the pipeline's per-passage output into a single, coherent **assistive package** that:

1. Groups content by the cognitive question it answers, not by the file it historically lived in.
2. Grounds every required field in a framework affordance or a well-validated instructional strategy — not in the creative choices of any particular story.
3. Supports the downstream non-AI app as richly as possible, with structured data that eliminates the temptation to do runtime LLM calls.
4. Extends only where the extension is cheap to produce and load-bearing for the app; resists the temptation to add fields whose content is speculative or redundant.
5. **Organizes the LLM-bearing work along failure-mode boundaries** so that future capabilities can be added or removed without disturbing the rest of the pipeline.

This memo covers the architectural arguments (§1 pedagogical commitments, §3 agent architecture, §6 governance rules) and the traceability evidence (Appendix A). The assistive-package field definitions (§2), capability-flag declarations (§4), end-to-end revision sequence (§5), risks and open questions (§7), and the diff against the current pipeline (Appendix B) live in `pipeline-revision-plan.md`.

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
- **Structured peer discussion with distributed roles and prompts** — students learn more in small-group work when each participant enters with a specific, distinct contribution to make. (Palincsar & Brown on reciprocal teaching; Webb on collaborative discourse; Cohen on complex instruction.)

And one that comes along for free given cross-episode threading:

- **Spaced / distributed practice** — the same concept revisited across multiple episodes produces more durable learning than a single concentrated exposure. (Cepeda et al.; Dunlosky et al.)

The pipeline supports these strategies by producing primitives aligned with them. It does not compel any app to use the primitives in those ways. An app remains free to implement any instructional design, including rejecting faded assistance or productive struggle entirely.

### 1.2 The three affordances operationalized at three scales

Each of the framework's three affordances is operationalized at **three scales** in the assistive package: analytical (what's true about the passage), individual-phase (what one student working alone needs), and group-phase (what a small group discussing together needs). Every required block in the package traces to one cell of this matrix.

| Affordance | Analytical | Individual-phase | Group-phase |
|---|---|---|---|
| **1. Name what is weak** | `ground_truth.facets_present`, `facets_absent_but_tempting` | `response_space` + `next_move`, `entry_prompts` | `consensus_check` |
| **2. Explain why the reasoner got there** | `causal_layer` (passage), `causal_layer_episode` | `response_space.explanation_quality` | `causal_discussion_prompts` |
| **3. Hold more than one valid perspective** | `lens_visibility`, `perspective_transitions`, multiple-forces rule | `recommended_lens_switch` on blindspots | `role_cards`, `discussion_cues` (three creative axes) |

Prior drafts operationalized the three affordances only at the analytical and individual scales; the group-phase column is where most of the recent additions land. This is deliberate: a non-AI app that runs small-group discussion without a teacher in the loop cannot generate perspective-taking cues at runtime, so precomputing them is load-bearing.

Field-level definitions for each cell of this matrix live in `pipeline-revision-plan.md` §2.

#### Affordance 1 — name what is weak

Operationalized analytically by `ground_truth.facets_present` and `facets_absent_but_tempting` (the discrimination surface). The pipeline commits to what facets are present, which are absent but tempting, which lenses see what with what engagement and affordance, and what each turn is contributing to the reasoning. Every annotation is anchored to turn IDs, and every reference to a facet uses the canonical ID from `framework/reference/facet_inventory.yaml`. Individual-phase and group-phase operationalizations scaffold the naming act on both ends — `entry_prompts` unblocks the blank page; `consensus_check` forces a group to commit to a named weakness at closure.

#### Affordance 2 — explain why the reasoner got there

Operationalized analytically by `causal_layer` at passage scope and `causal_layer_episode` at episode scope. For each passage, the pipeline commits to the forces at work — cognitive biases, social dynamics, and crucially their interaction. The framework's §2.2 states that "every moment in reasoned discussion has both a cognitive and a social dimension, and understanding how they interact is the deepest level of explanation the framework supports." The pipeline treats this as a required structural property: the `interaction` field on every causal-layer entry must be populated with an enumerated value (schema defined in `pipeline-revision-plan.md` §2.2).

The framework's §4 also states that "one weak facet can be produced by several forces" and "no observation has a unique correct explanation." The pipeline treats this as a required schema rule: when more than one force plausibly accounts for a facet, the causal layer lists them all, with none marked as "the" cause.

Group-phase operationalization comes via `causal_discussion_prompts` that hook into the `interaction` value ("was the group's agreement real agreement, or conflict-avoidance?"). This turns the framework's deepest level of explanation into a discussion activity instead of an analyst artifact.

#### Affordance 3 — hold more than one valid perspective

This is the affordance with two structural sources in the framework (§3 and §4), and both must be present in the pipeline's output.

**Source A — cross-lens visibility.** Operationalized analytically by `lens_visibility` (per-lens engagement, affordance, and content) and `perspective_transitions` (directional pairs between lenses describing what one lens sees that another misses on this specific passage). Perspective transitions are required on every passage. The LLM pipeline is uniquely positioned to produce them — reasoning about "what does Logic see that Evidence misses here" requires content-specific analysis that a non-AI app cannot do at runtime.

**Source B — multiple causes per facet.** Operationalized by the required multiple-forces-per-facet rule above.

Group-phase operationalization is the single biggest addition this revision introduces: `role_cards` partition students by lens so groups start with guaranteed disagreement; `discussion_cues` produce multiple voiced readings of the same turn across three creative axes (lens refraction, persona projection, stance inversion). Without these, Affordance 3 is diagnosed but not *used* in student discourse. With them, diversity of perspective is engineered into every group activity.

### 1.3 Where the instructional defaults live

The instructional defaults in §1.1 do not require their own schema blocks. They are **default uses of the affordance primitives**, enabled by small metadata additions:

- **Productive struggle** — enabled by `struggle_calibration` metadata (difficulty, productive_duration, danger_signals, minimum_wrestling). The app gates hint availability against these fields.
- **Faded assistance** — enabled by the graduated hint ladder with `appropriate_for: [early, mid, late]` tags per rung, plus `prior_exposure` and `assumes_familiar_with` / `introduces` at passage level. The app fades by filtering rungs based on story position.
- **Elaborative interrogation** — enabled by `next_move` on every `response_space` entry, which pushes from *what* the student said to *why* it is what it is.
- **Perspective-taking** — enabled by `perspective_transitions` and by the `role_cards` / `discussion_cues` primitives that distribute perspective-taking across students.
- **Worked examples** — enabled by `counterfactuals[]` per facet.
- **Structured peer discussion** — enabled by `role_cards`, three-axis `discussion_cues`, `talk_moves`, and `jigsaw_fragments`.
- **Spaced practice** — enabled for free by `connects_to.echoes` cross-passage threading and by `causal_layer_episode`.

No new blocks for any of these. Metadata on existing blocks, plus the primitives above.

### 1.4 "Unfinished, not wrong" and other story-level register choices

Some stories commit to pedagogical stances that are creative choices, not framework commitments. *The Overton Park Sightings* commits to "thin reasoning is not wrong reasoning — it is reasoning that hasn't finished yet." This is a register choice that shapes how the prose agent should write rationales, hints, and redirect language.

The pipeline handles this via a story-level capability declaration (defined in `pipeline-revision-plan.md` §4): the story design doc's frontmatter names the `pedagogical_register` it wants, and the prose and discussion agents read this and match their prose accordingly. Stories that don't declare one get a generic neutral register.

### 1.5 Summary of Part 1

The pipeline's output is grounded in three framework affordances plus seven well-validated instructional defaults. Every required schema field traces to one of those sources and to one of the three scales (analytical, individual-phase, group-phase). Any field that cannot trace to a framework affordance or a well-validated instructional strategy is either moved to the opt-in story-level extension set (see `pipeline-revision-plan.md` §4) or removed from the plan.

### 1.6 Universal core vs. app-coupled layer

Not every block in the package is equally portable across apps. The plan distinguishes two layers:

**Universal core (framework-shaped, app-agnostic).** Everything in `ground_truth.yaml`, `diagnostic.yaml`, `prose.yaml`, and `discussion.yaml` in full. Any non-AI critical-thinking app built on the Polylogue framework would want this content unchanged.

**App-coupled interpretation (Lens-shaped today, generalizable later).** The hint-cost economy in `attention_cues[].cost`, the "commit to a reading then get assessed" loop, and any session-pacing or unlocking semantics are interpretation choices a specific app makes when it consumes the package. The pipeline produces neutral primitives; the app decides what they mean.

The universal pipeline produces only the universal core and the universal primitives and ends at `assistive_package.yaml`. Anything an app does with that artifact happens in the **app layer** (governed by Rule 12, §6), which the framework describes only by its boundary conditions — not by its contents. The pipeline is organized along two extensibility axes: Rule 11 governs modularity *inside* the framework's shared pipeline; Rule 12 governs the *handoff* from the framework to any specific app.

---

## 3. Agent architecture

The current `/analyze_transcript` command uses a single `evaluator` agent that produces both analytical and pedagogical content in one pass. This revision splits that into **four authoring agents** in the universal pipeline — analyst, diagnostic, prose, and discussion — plus one reviewer. The split follows the cognitive-job boundary described in §3.6 below, not the phase boundary (individual vs. group); this matters because the natural joint is "what does the agent need to hold in mind," not "when in the student arc does the output fire."

Field-level schemas for each agent's output live in `pipeline-revision-plan.md` §2.

### 3.1 The analyst agent

**Input.** `episode.yaml`, `transcript.yaml`, the canonical reference files from `framework/reference/`, and (for cross-episode threading) the episode index of the story.

**Output.** `ground_truth.yaml` (schema in `pipeline-revision-plan.md` §2.1 and §2.2).

**Information barrier note.** Merging `/analyze_transcript` and `/design_scaffolding` does not touch the dialog-writer information barrier, which sits upstream at `/create_transcript`. The analyst sees the episode plan, the transcript, and the framework reference files because the dialog has already been written.

**Cognitive job.** Close reading against a known framework. Identify what facets fire, with what severity, anchored to which turns. Identify what facets are absent-but-tempting. For every lens per passage, write two orthogonal judgments into `lens_visibility`: **`engagement`** (how much the characters actually used the lens — a pure observation of the transcript) and **`affordance`** (how much the topic gives the lens to work with if it were engaged fully — a judgment about the passage). Both judgments are analyst territory: they are about the transcript and the topic, not predictions about students. Formalizing them as two fields instead of one collapsed `signal` makes each judgment auditable on its own terms and eliminates the ambiguity the old three-value signal introduced in the moderate and weak cases. Annotate every turn in every passage with `speaker` and `turn_id`; populate the content fields (`moves[]`, `facet_signals[]`, `why_it_matters`, `discussion_cue_seeds[]`) iff the turn is **load-bearing** — see the framework-relative definition below. Write the causal layer including required interaction at passage scope and a recurring-forces summary at episode scope (`causal_layer_episode`). Generate perspective transitions. Produce counterfactuals. Identify cross-passage connections and write a `contrast_prompt` for each `contrasts[]` edge.

**Load-bearing turn (framework-relative definition).** A turn is load-bearing iff at least one of the following holds: (a) it exhibits a **facet signal** (populates `facet_signals[]`); (b) it exhibits a **lens transition** contributing to `perspective_transitions[]`; (c) it reveals a **cognitive pattern or social dynamic** operating on the discussion and feeding `causal_layer`; or (d) it makes a **claim** that later turns respond to with framework-visible content. Otherwise the turn is non-load-bearing and its annotation entry carries only `speaker` and `turn_id`, with all content fields empty. The definition is deliberately framework-grounded — not a generic "interesting turn" judgment — because the analyst's cognitive job is to detect framework content, and "load-bearing" must be anchored in facets, lenses, cognitive patterns, and social dynamics to be auditable. An empty entry is a positive assertion ("the framework has nothing to say about this turn"), not a mark of analyst omission; a reviewer may dispute any empty turn as a legitimate extension under the D.1 diff-gate Half B check.

**Reading the transcript fresh.** The analyst receives `episode.yaml` (which contains the operator-designed `target_facets`), but must derive `facets_present[]` from the transcript without using the designed targets as a hint. Rubber-stamping is a failure mode the package reviewer checks for.

**Constraints.**

- The analyst must not speculate about what students will say.
- The analyst must cite turn IDs for every annotation.
- The analyst uses canonical IDs from `framework/reference/` for every facet, pattern, and dynamic reference.

**Failure modes defended against.** Conflating "what's true about the passage" with "what students will say about it"; picking a single force as "the" explanation when the framework permits multiple; hand-waving the interaction field with generic language.

### 3.2 The diagnostic agent

**Input.** `episode.yaml`, `transcript.yaml`, `ground_truth.yaml` (read from file), the canonical reference files, and a **story position** object (episode number, prior facet/pattern exposure list, story design doc frontmatter with capability declarations).

**Output.** `diagnostic.yaml` (schema in `pipeline-revision-plan.md` §2.3).

**Cognitive job.** *Hold a student error model in mind and write the calibrated responses to foreseeable stuck states.* Imagine what 6th-grade students will get wrong and how to recover them. Produce the response space per lens by applying the engagement/affordance matrix in `pipeline-revision-plan.md` §2.3 mechanically to each lens's `(engagement, affordance)` pair from `ground_truth.lens_visibility`. The matrix resolves every cell into specific category-population rules — `likely_readings` and `misreadings` require `engagement ∈ {partial, high}`; `partial_readings` requires `engagement: partial`; `blindspots` require `affordance ∈ {moderate, rich}` OR (`affordance: thin` AND `engagement ∈ {none, partial}`); all four empty iff `affordance: none`. Write the graduated hint ladder with position tags and `recommended_lens_switch` on blindspots. Calibrate struggle metadata. Describe stall signals with silence-breakers below the hint ladder. Anticipate class-level divergence and write the `classroom_move` on every entry. Populate conditional blocks if the story opted into them.

**Blindspot calibration by matrix cell.** The diagnostic produces *engagement predictions* (likely/partial/mis-readings) for lenses students are using, and *blindspot predictions* for lenses students are missing. Both are first-class outputs. The urgency framing of a blindspot is calibrated to its matrix cell: `(engagement: none, affordance: rich)` blindspots get the highest-urgency framing ("characters had a reasoning gap; students reading this will inherit it") because the passage is calling for the missing lens and students will adopt the characters' framing; `(engagement: none, affordance: thin)` blindspots get habit-building framing ("this lens has less to do in a topic like this one, but asking its question is still a valuable habit"); `(engagement: partial, *)` blindspots name what the partial engagement stopped short of; `(engagement: high, affordance: rich/moderate)` blindspots name subtler edges the full engagement still missed. The `(engagement: high, affordance: thin)` cell has no blindspots by design — the characters exhausted the thin lens, and the meta-observation that the lens is at its limits is carried by the analyst's `what_shows` prose. Skipping or hand-waving a `(engagement: none, affordance: rich)` blindspot is the most serious failure in this agent's output, because it is the passage's most pedagogically valuable content — the entry point for the framework's distinctive lens-switching move.

**Why `expected_divergence` lives here.** Even though its audience is the teacher, `expected_divergence` is *diagnostic of class dynamics* — it predicts what students will disagree about — and requires the same student error model the response space requires. Keeping it with the response space prevents the diagnostic and prose agents from both trying to hold the error model.

**Constraints.**

- The diagnostic agent reads ground truth but does not alter it. If it believes the analyst's ground truth is wrong, it emits a `reviewer_flags[]` entry that the package reviewer must adjudicate.
- The diagnostic agent's prose must be passage-specific. Generic "a student might notice the evidence is weak" is flagged.
- The hint ladder rungs must direct attention without giving the observation.
- The agent does *not* author episode opening, entry prompts, consensus checks, or any group-phase discussion primitives. That is prose and discussion territory.

**Failure modes defended against.** Over-specifying hints into answers; generic rubric prose; skipping blindspots (the hardest part); hand-waving `next_move` so it would apply to any reading; rubber-stamping the analyst.

### 3.3 The prose agent

**Input.** `episode.yaml`, `transcript.yaml`, `ground_truth.yaml`, `diagnostic.yaml` (for register consistency with `next_move` phrasing), the **story design doc** at `framework/stories/{story_id}.md` (read-only; used for register calibration and character voice awareness), the story position object, and reference files.

**Output.** `prose.yaml` (schema in `pipeline-revision-plan.md` §2.4).

**Cognitive job.** *Write short, voiced, register-matched prose at the entry and closure moments of the student arc.* Produce the student-facing `episode_opening` in the story's voice. Write `entry_prompts` that unblock the blank page without revealing the observation. Write `consensus_check` questions that drive group closure. Describe `group_stall_signals` and unstall moves. Write `causal_discussion_prompts` that convert the analyst's `causal_layer.interaction` values into group-facing questions.

**Why these cluster together.** All five blocks share a register, a voice, a grade level, and a failure mode (adult-sounding, off-register, generic). None of them require holding a student error model; all of them require holding the story's voice and register. This is homogeneous work by §3.6's test.

**Constraints.**

- The prose agent matches the story's declared `pedagogical_register`.
- The prose agent does not leak framework terminology into student-facing text (literal-scan).
- The prose agent does not produce rubric content, hint content, or discussion distributables. Those belong to the diagnostic and discussion agents.

**Failure modes defended against.** Adult-sounding voice; generic prose that would fit any passage; register drift across episodes; accidentally leading the student toward a specific observation in `episode_opening` or `entry_prompts`.

### 3.4 The discussion agent

**Input.** `episode.yaml`, `transcript.yaml`, `ground_truth.yaml`, `diagnostic.yaml`, `prose.yaml` (for register and voice consistency), the story design doc (for character voices and persona-projection grounding), and reference files.

**Output.** `discussion.yaml` (schema in `pipeline-revision-plan.md` §2.5).

**Cognitive job.** *Generate voiced, distributable, creatively varied group-phase primitives across three creative axes.* Produce role cards that partition students by lens. Generate three-axis discussion cues per turn: lens refraction, persona projection, stance inversion. Honor the character voices established in the story design doc. Produce episode cues, talk moves, jigsaw fragments (if the capability flag is set), and consensus-compatible closing primitives.

**Why this is its own agent.** Cue generation has two properties no other downstream work has. First, it produces a *plural, distinguishable-by-angle set from a single underlying observation* — no other block produces multiple variants that must be kept substantively independent. Second, it is the most open-ended creative surface in the pipeline: new axes, new persona strategies, new activity formats keep arriving. Both properties diverge its failure modes from every other agent: cues fail by collapsing under cosmetic variation, by drifting persona voices, by converging stylistically across episodes. Rule 11's iteration-frequency tiebreaker applies — this is the agent expected to iterate most frequently as new pedagogical capabilities arrive, while the diagnostic agent is expected to stabilize. Splitting them means iteration on one does not destabilize the other.

**Constraints.**

- The discussion agent does not alter any upstream file. It emits `reviewer_flags[]` when upstream files are thin.
- Persona-projected cues must honor the story's character voices. Voice drift is a reviewer criterion.
- Cues with the same `angle` must carry `independent_of` entries distinguishing them, and the distinction must be substantive.
- The discussion agent does not produce diagnostic rubric content or entry/closure prose. Those belong to the diagnostic and prose agents.

**Failure modes defended against.** Cues that collapse to the same reasoning move under cosmetic variation; persona voices that contradict the story's established characters; generic cues that would fit any passage; over-cueing thin turns and under-cueing rich ones; stylistic convergence across episodes (a generative-agent failure mode unique to this role).

### 3.5 The package reviewer

**Input.** All four authored files (`ground_truth.yaml`, `diagnostic.yaml`, `prose.yaml`, `discussion.yaml`) plus the episode plan and story frontmatter.

**Output.** `ACCEPT` or `REVISE` with structured findings.

**Review criteria (judgment-only).** Mechanical checks are enforced by the merge script (defined in `pipeline-revision-plan.md` §2.6) and are not the reviewer's job. The reviewer's criteria partition by agent:

*Analyst criteria:*
1. **Near-miss discriminability** — every `facets_absent_but_tempting` entry has a non-hand-wavy `why_wrong` that actually distinguishes the case.
2. **Multiple forces listed** — when `framework/reference/facet_inventory.yaml` shows multiple candidates and the evidence supports more than one, the causal layer lists them all.
3. **Counterfactual specificity** — each `counterfactuals[]` entry names a concrete change to the cited turn.
4. **Analyst vs. upstream `transcript_reviewer` reconciliation** — `facets_present[]` is consistent with what the upstream reviewer concluded "landed." Rubber-stamping the operator's design is a REVISE.

*Diagnostic agent criteria:*
5. **`next_move` quality** — sampled entries act on the reading they attach to (push on `what_they_miss` for partial readings, redirect for misreadings, deepen for likely readings). Generic moves that would work on any reading are flagged. **Blindspot specificity is calibrated by matrix cell** (`ground_truth.lens_visibility.{lens}.(engagement, affordance)`): `(engagement: none, affordance: rich)` blindspots are held to the highest specificity bar — these are the "characters had a gap" case where the blindspot is the passage's most pedagogically urgent content, and a generic entry here counts as a larger failure than generic content anywhere else. `(engagement: none, affordance: moderate)` blindspots are held to a high bar. `(engagement: none, affordance: thin)` blindspots can be more general — they name the *kind* of question the lens would raise as a habit-building move. `(engagement: partial, *)` blindspots must name what the partial engagement stopped short of, compared against the partial_reading content in the same lens. `(engagement: high, affordance: rich/moderate)` blindspots name subtler edges and are held to normal specificity bars. Every blindspot must carry grounded `description` and `why_predictable` fields that reference specific features of the transcript the prediction rests on.
6. **Hint calibration** — sampled hint rungs direct attention without giving the observation.
7. **Diagnostic agent `reviewer_flags[]` adjudication** — every flag is resolved, either by correcting ground truth (REVISE to analyst) or by explicit dismissal with a recorded reason.

*Prose agent criteria:*
8. **Register matching** — sampled prose including `episode_opening`, `entry_prompts`, and `consensus_check` matches the story's declared `pedagogical_register`.
9. **Grade-appropriate voice** — sampled entries sound like something a 6th grader could say or read, not like an adult imagining one.

*Discussion agent criteria:*
10. **Creative-axis independence** — when multiple cues exist on a turn, they genuinely draw on different axes (lens refraction / persona projection / stance inversion) or different moves within one axis. Cues sharing an `angle` must carry `independent_of` entries with a substantive distinction.
11. **Persona voice fidelity** — sampled persona-projected cues sound like the character they invoke. Reviewer reads the story design doc as the ground truth for voice.
12. **Creative non-convergence** — in cross-episode mode, the discussion agent is not producing template-shaped cues across episodes. Sampled side-by-side comparison of comparable turns in different episodes.

*Cross-agent criterion:*
13. **Block orthogonality** — no content appears in two files that should be one. Any accidental drift between the four agents is caught here.

**Cross-episode consistency.** After every episode in a story has been packaged, the reviewer runs a cross-episode pass verifying that `connects_to.echoes`, `connects_to.contrasts`, and `prior_exposure` references resolve coherently, that `pedagogical_register` does not drift, and that criterion 12 (creative non-convergence) holds.

The reviewer is a separate agent with fresh context. It reads all four files but does not rewrite them. When it returns `REVISE`, the operator re-runs the relevant agent with the specific findings. No agent-to-agent dialogue.

### 3.6 Why four agents, not more or fewer

**Not one monolith.** The existing `evaluator` mixes analytical and pedagogical work and exhibits the predictable failure mode: it speculates about students when doing analytical work and loses grip on what's actually in the passage when doing pedagogical work.

**Not two (analyst + pedagogue).** An earlier version of this plan proposed a single pedagogue agent carrying everything downstream of the analyst. Under the full set of capabilities this revision introduces, that pedagogue has three visibly different failure modes: revealing/over-specifying (diagnostic work), sounding adult (prose work), and producing cues that collapse under cosmetic variation (discussion work). Rule 11 Corollary 2 says two jobs with visibly different failure modes are two agents, even if they share context; three jobs with three divergent failure modes are three agents.

**Not three (analyst + diagnostic + one scaffolding-plus-discussion).** A subsequent proposal merged prose and discussion. This fails on the same test: prose failure modes (adult-sounding, off-register) and discussion failure modes (cue collapse, persona drift, creative convergence) are different. More importantly, they have different iteration rhythms — prose conventions stabilize quickly, while discussion-cue generation is the most open-ended creative surface in the pipeline and will iterate often. Per Rule 11's iteration-frequency tiebreaker, they must split.

**Not five or six.** The temptation to split the diagnostic agent further — rubric author vs. hint author vs. calibration author — should be resisted. All three depend on the same input (student error model) and fail the same way (revealing/over-specifying). Splitting them would create reconciliation overhead the reviewer would then absorb, which is the evaluator-in-waiting pattern. The diagnostic agent is as finely split as the downstream half should go.

The four authoring agents split on the deepest cognitive-job boundary available: **what does the agent need to hold in mind.**

- **Analyst** holds the framework vocabulary and the transcript.
- **Diagnostic agent** holds the student error model.
- **Prose agent** holds the story's voice and register.
- **Discussion agent** holds character canon and the three-axis creative surface.

These are four genuinely different mental stances, and an LLM asked to hold all four in one prompt would do the most recently requested one well and the others conservatively. Four agents plus one reviewer is the minimum that cleanly separates cognitive jobs in the universal pipeline.

**Four is also the maximum.** Any further LLM work any app needs — reshaping, annotating, packaging, exporting, session-configuring, anything — lives at the app layer under Rule 12, not in the universal pipeline. Rule 11 still governs the LLM shape of those app-specific subagents (one cognitive job per agent, one output file, deterministic vs. LLM distinction preserved), but the governance is app-local. The framework does not define a fifth authoring role, a projector agent, or any other "almost-universal-but-not-quite" unit; the handoff at `assistive_package.yaml` is the clean break.

### 3.7 Coordination rules

1. **Files, not inline.** Every agent reads its inputs from files via the Read tool and writes its output to one file. This keeps context windows clean and gives durable intermediate artifacts for inspection.

2. **Sequential execution with file handoffs.** `/build_assistive_package` runs analyst → diagnostic → prose → discussion in order. Each downstream agent reads every upstream file it needs for consistency. The sequence matters because prose reads diagnostic for register, and discussion reads both diagnostic and prose for register and voice.

3. **All agents see the full transcript.** This is load-bearing. Pedagogical prose must be grounded in specific turns and specific language; that requires access to the original transcript even though intermediate files are the structured input.

4. **No agent-to-agent dialogue.** If the reviewer flags a contradiction, the fix is to re-run the affected agent with the specific finding.

5. **The reviewer runs once at the end, reading all four files together.** It does not review after each agent. Cross-artifact consistency checks need all files present.

6. **The merge script runs only after the reviewer returns ACCEPT.** No merged package is produced from un-reviewed inputs.

### 3.8 Claude Code surface mapping

The framework's shared pipeline maps onto Claude Code mechanics as follows.

**Slash commands** for the shared pipeline live in `framework/pipeline/commands/`, synced into `.claude/commands/` by each app's `initialize_{app_id}.py`.

**Subagents** for the shared pipeline are the Rule 11 LLM-bearing units, stored in `framework/pipeline/agents/`, synced into `.claude/agents/`. Each subagent is one file, has a single cognitive job, and is what the operator edits when Rule 11's "zoom in and fix one agent" workflow fires.

**Deterministic scripts** are Python under `framework/pipeline/scripts/`, invoked from commands but not subagents and not governed by Rule 11.

**Universal pipeline command table (the framework's complete surface):**

| Slash command | Subagents (sequential) | Deterministic steps | Output files |
|---|---|---|---|
| `/create_episode {story} {NN}` | `planning_agent` → `validation_agent` → `projection_reviewer` | `validate_schema.py` | `episode.yaml`, `episode_writer_input.yaml` |
| `/create_transcript {story} {NN}` | `dialog_writer` (barrier-isolated) → `transcript_id` → `transcript_reviewer` | — | `transcript.yaml` |
| `/build_assistive_package {story} {NN}` | `analyst_agent` → `diagnostic_agent` → `prose_agent` → `discussion_agent` → `package_reviewer` | `merge_assistive_package.py`, `validate_schema.py` | `ground_truth.yaml`, `diagnostic.yaml`, `prose.yaml`, `discussion.yaml`, `assistive_package.yaml` |

Three rows, three framework-owned commands. These are the only slash commands the framework's shared pipeline defines. `/build_assistive_package` runs its four authoring subagents **sequentially**, not in parallel, because prose reads diagnostic and discussion reads both. A future operator should not "optimize" by parallelizing.

**The app layer.** Per Rule 12, each app defines whatever commands, subagents, and scripts it needs under `apps/{app_id}/pipeline/`, bootstrapped into `.claude/` by `initialize_{app_id}.py` alongside the shared-pipeline files. The framework does not specify the shape of the app layer, does not name its commands, and does not require any specific files to exist there — each app's `apps/{app_id}/RUNNING.md` is the authoritative source for how that app does its post-handoff work.

**Bootstrap.** `initialize_{app_id}.py` clears `.claude/commands/` and `.claude/agents/` (preventing cross-app leakage), then syncs the shared-pipeline files plus the app's own files. When this revision lands, the shared-pipeline sync picks up `analyst_agent`, `diagnostic_agent`, `prose_agent`, `discussion_agent`, `package_reviewer`, and `/build_assistive_package`; it stops syncing the retired `evaluator`, `analysis_reviewer`, `scaffolding_reviewer`, `/analyze_transcript`, and `/design_scaffolding`. Updating the bootstrap scripts is a named step in the revision sequence (see `pipeline-revision-plan.md` §5).

---

## 6. Governance rules

These are the rules the plan is accountable to, and which apply to any future extension. A scannable operational reference — one row per rule — lives as Appendix C of `pipeline-revision-plan.md` for use during spec authoring and review checks. This section carries the full treatment: rationale, worked examples, corollaries, and the composition argument between Rule 11 and Rule 12.

### Rule 1 — Every required field traces to a justified source

Every required field must trace to either a framework affordance (from `framework/docs/conceptual-framework.md` §1 and §2–§4) or a well-validated instructional strategy (named in §1.1 of this memo). Fields that trace to neither are moved to the opt-in extension set under a capability flag, or removed.

### Rule 2 — Creative choices are opt-ins, not defaults

A field or block that assumes a creative choice some story might not make is an opt-in extension, gated by a capability flag. A new capability flag is added only when at least two distinct stories would use it differently, and the gated content cannot reasonably live in the default schema.

### Rule 3 — Light usage is valid

A story that lightly populates instructional metadata (one-level hint ladder, `cognitive_only` interactions where permitted, empty `blindspots` when `affordance: none` or `(engagement: high, affordance: thin)`, few discussion cues when a turn is thin) is not flagged as under-specified. The reviewer checks that what is there is well-formed, not that the full machinery is exercised. Rule 3 is enforceable mechanically via the engagement/affordance matrix: a lens with `affordance: thin` is thinness (protected by Rule 3); a lens with `(engagement: none, affordance: rich)` is a reasoning gap (the reviewer's urgent case). The matrix makes the distinction that the old single-signal field could not.

### Rule 4 — The pipeline supports, does not compel

The pipeline produces primitives aligned with proven instructional strategies, but no app is forced to use them in those ways. The pipeline's job is to make good practice cheap, not to compel it.

### Rule 5 — Redundancy is an error, not a feature

When two blocks contain the same content in different wrappings, one of them is wrong. The current five-file pipeline has six such overlaps; part of this revision's value is eliminating them.

### Rule 6 — Turn anchors are mandatory

Because every Polylogue story is turn-based dialog, every annotation can be and must be anchored to turn IDs. This is what enables any downstream turn-level UI without re-inference.

### Rule 7 — IDs are hidden; labels are student-facing

Every student-facing field uses labels from `apps/lens/docs/teacher-overview.md`. Every machine-readable field uses canonical IDs from `framework/reference/`. The literal-scan validator catches leakage in either direction.

### Rule 8 — Agent roles are pure

The analyst does not speculate about students. The diagnostic agent does not invent ground truth. The prose agent does not author rubric or cue content. The discussion agent does not author diagnostic or prose content. The reviewer does not rewrite. The app projector does not invent content the package lacks. Role purity is enforced by the reviewer's criteria and by the agents' input restrictions.

### Rule 9 — App contracts are read-only consumers

App contracts may *narrow* what an app uses from the package; they may *not constrain* what the pipeline produces. If an app needs the pipeline to change, that goes through a plan revision, not through a contract edit. The `contract_violations[]` log is the upstream-communication channel: when the same violation recurs across episodes or apps, that is the Rule 2 two-instance rule firing automatically.

**Making recurrence visible.** A small aggregator script (`scripts/scan_contract_violations.py`) walks `artifacts/**/{app_id}/` for any contract-violation records an app chooses to emit, groups by `violation_id`, and reports any ID appearing in ≥2 episodes or ≥2 apps. Runs on demand. The record format is an app-layer convention — apps that write one get aggregator support; apps that don't are under no obligation to.

### Rule 10 — Contracts are optional

An app may consume `assistive_package.yaml` directly without ever writing a contract document. The absence of `apps/{app_id}/docs/package-contract.md` is not an error and does not block any pipeline stage. Contracts exist only to formalize what an app consumes and to feed the recurrence-based feedback loop in Rule 9; apps that don't need that formalization don't write one.

### Rule 11 — One cognitive job per agent; one agent per file

Every LLM-bearing unit of work in the pipeline is an agent with a single named cognitive job. Each agent reads its inputs from files, writes its output to one file, and does not negotiate with other agents. Adding a new intelligent capability means adding an agent and a file; removing one means deleting an agent and a file. An agent whose output is wrong is zoomed into in isolation — its prompt, its inputs, its output — without touching the rest of the pipeline.

**Corollary 1 — Deterministic work stays deterministic.** Merging, aggregation, integrity checks, and enumeration inversion are never placed inside an agent. They go in the merge script, the validator, or a deterministic projector. LLM intelligence is reserved for work that actually requires it.

**Corollary 2 — Different failure modes mean different agents, even with shared context.** Shared context is a weaker argument for combining than different failure modes is for splitting. The four-agent downstream split (analyst, diagnostic, prose, discussion) is this corollary applied: each agent has a visibly distinct failure mode, and combining any two would have the combined agent doing one job well and the other conservatively.

**Corollary 3 — The reviewer is an agent too.** When the reviewer's criteria start spanning unrelated judgment kinds, or when cross-agent criteria outnumber per-agent criteria, the reviewer is becoming an evaluator-in-waiting and should be revisited.

**Iteration-frequency tiebreaker.** When a new capability's failure mode overlaps with two existing agents, prefer adding a new agent if it is expected to iterate more frequently than the existing ones. Worked example: the discussion agent is split from the diagnostic agent in part because cue-generation capabilities (new axes, new persona-projection strategies) are expected to iterate frequently while diagnostic response-space conventions are expected to stabilize. Iteration on one should not destabilize the other.

**This rule is especially load-bearing for the downstream half** of the pipeline. The upstream half (story authoring through transcript evaluation) is bounded in creative scope and changes rarely; Rule 11 applies there but is not stress-tested. The downstream half (the assistive package) is open-ended by design: new pedagogical capabilities keep arriving, and Rule 11 is what makes the pipeline absorb them at low cost. If a future extension violates Rule 11 — by bolting a new capability onto an existing agent's prompt rather than adding an agent — the cost will surface as prompt drift and cross-capability regression. That is the failure mode the rule defends against.

### Rule 12 — Apps own everything app-specific; the framework stops at the handoff

The universal pipeline produces framework-shaped, app-agnostic artifacts and knows nothing about any specific app. Its terminal artifact per episode is `assistive_package.yaml`. After that artifact is written, the framework's responsibility for the episode ends.

**The handoff contract.** Anything an app does with `assistive_package.yaml` happens in the app's own layer, which consists of: app-specific code under `apps/{app_id}/pipeline/` (commands, subagents, scripts — any combination an app chooses), an optional contract document at `apps/{app_id}/docs/package-contract.md` that formalizes what the app consumes, and per-episode app outputs strictly under `artifacts/{story_id}/episodes/episode_{NN}/{app_id}/`. The `initialize_{app_id}.py` bootstrap is the single point of contact between the framework's shared pipeline and any given app's extensions; it syncs the universal files plus the app's own files and clears `.claude/` to prevent cross-app leakage.

**What apps are free to decide.**

- Whether to run any Claude Code commands at all at the app layer, or to do all post-handoff work in plain Python build scripts, or any mix.
- What to name their commands and how many to have. An app needing one reshaping step, five logistics commands, and a dashboard exporter is free to define them all.
- Whether app-layer work uses LLMs. Rule 11 still governs any LLM subagents the app defines — one cognitive job per agent, one output file, deterministic vs. LLM distinction preserved — but *whether* to use LLMs at the app layer is an app-designer call. The non-AI constraint applies to the runtime student-facing application, not to the app's build-time pipeline.
- What file shapes, directory structures, and naming conventions to use inside `{app_id}/`.

**What apps may not do.**

- Write outside their `{app_id}/` directory in `artifacts/`.
- Modify any universal artifact after `/build_assistive_package` completes.
- Depend on another app's outputs. If two apps need a common post-universal transformation, that is a signal the transformation belongs in the universal pipeline and goes through a framework plan revision.
- Use their contract document to constrain what the universal pipeline produces. Contracts are read-only consumers (Rule 9).

**Feedback loop.** When an app's contract surfaces `contract_violations[]` that recur across episodes or across apps, that is the upstream-communication signal that the universal schema or a capability flag should change. The aggregator script named in Rule 9 is how recurrence is counted. App-layer extensions that never surface as violations are apps succeeding at doing their own work; app-layer extensions that repeatedly surface as violations are apps telling the framework something needs to move upstream.

**Why Rule 11 and Rule 12 are separate.** Rule 11 governs LLM modularity *inside* the framework's shared pipeline — the four authoring agents, the reviewer, the deterministic merge script. Rule 12 governs the *boundary* between the framework and any specific app. An app designer extending an app follows Rule 11 at the app-local level (each app subagent has one cognitive job, one file) and follows Rule 12 at the framework-to-app boundary (stay inside `{app_id}/`, don't touch universal artifacts, use the contract feedback loop when the framework should change). The two rules operate at different layers and compose cleanly.

---

## Appendix A — Traceability matrix

| Required field | Source of justification | Agent | Scale |
|---|---|---|---|
| `facets_present[]` | Affordance 1; framework §2 | analyst | analytical |
| `facets_absent_but_tempting[]` | Affordance 1 + non-AI discrimination need | analyst | analytical |
| `lens_visibility` | Affordance 3a; framework §3 | analyst | analytical |
| `turn_annotations` | Turn-dialog universal substrate (Rule 6) | analyst | analytical |
| `turn_annotations.discussion_cue_seeds` | Raw material for group-phase cues | analyst | analytical |
| `causal_layer.cognitive[]` / `.social[]` | Affordance 2; framework §2.2 | analyst | analytical |
| `causal_layer.interaction` | Framework §2.2 explicit commitment | analyst | analytical |
| `causal_layer_episode` | Affordance 2 at episode scope; spaced practice | analyst | analytical |
| `causal_layer` multiple-forces rule | Affordance 3b; framework §4 | analyst | analytical |
| `perspective_transitions[]` | Affordance 3a made explicit; framework §3 | analyst | analytical |
| `counterfactuals[]` | Worked-examples default (Sweller, Renkl) | analyst | analytical |
| `connects_to` | Spaced-practice default | analyst | analytical |
| `connects_to.contrasts[].contrast_prompt` | Spaced-practice operationalized per edge | analyst | analytical |
| `turn_annotations.causal_signals` (derived) | Affordance 2 at turn granularity | merge script | analytical |
| `response_space.by_lens.*` | Non-AI rubric replacement | diagnostic | individual |
| `response_space.*.next_move` | Elaborative-interrogation default (Chi, Pressley) | diagnostic | individual |
| `response_space.explanation_quality` | Affordance 2 articulation support | diagnostic | individual |
| `response_space.blindspots.recommended_lens_switch` | Affordance 3 at individual phase | diagnostic | individual |
| `attention_cues[]` | Productive-struggle + faded-assistance defaults | diagnostic | individual |
| `stall_signals.silence_breakers[]` | Productive-struggle default (pre-hint tier) | diagnostic | individual |
| `struggle_calibration` | Productive-struggle default | diagnostic | individual |
| `expected_divergence[].classroom_move` | Affordance 3 operationalized as teacher practice | diagnostic | group (teacher) |
| `prior_exposure` (derived) | Faded-assistance + spaced-practice defaults | merge script | individual |
| `assumes_familiar_with[]` / `introduces[]` | Faded-assistance default | diagnostic | individual |
| `episode_opening` | Priming / engagement | prose | individual |
| `entry_prompts[]` | Faded-assistance default; cognitive-load reduction | prose | individual |
| `consensus_check[]` | Affordance 1 at group closure | prose | group |
| `group_stall_signals` | Productive-struggle at group scale | prose | group |
| `causal_discussion_prompts[]` | Affordance 2 at group level | prose | group |
| `role_cards[]` | Affordance 3 + structured-peer-discussion default (Palincsar & Brown, Webb, Cohen) | discussion | group |
| `discussion_cues[]` (turn scope, three axes) | Affordance 3 + perspective-taking default | discussion | group |
| `episode_cues[]` | Fallback tier; spaced practice | discussion | group |
| `talk_moves[]` | Structured-peer-discussion default | discussion | group |
| `jigsaw_fragments[]` (flag-gated) | Structured-peer-discussion default | discussion | group |

Every field is accounted for by an affordance or an instructional default and lives in exactly one agent's output at exactly one scale.

---

*End of architecture memo. For the assistive-package field definitions, capability-flag declarations, revision sequence, risks, the diff against the current pipeline, and the one-page governance rules reference, see `pipeline-revision-plan.md`.*
