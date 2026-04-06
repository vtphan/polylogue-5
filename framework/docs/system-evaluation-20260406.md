# System Evaluation — 2026-04-06

A review of the conceptual framework, its realization in the pipeline, and the pipeline/command structure. Conducted after the autonomous-pipeline conversion and before the first end-to-end run on the new architecture.

This document captures a snapshot of suggestions for piecewise follow-up. Items are ranked at the end. Nothing here has been executed.

## Operator clarifications (incorporated)

Two reframings from the operator that adjust the analysis below. Both are reflected in the relevant sections, but stated up front for clarity:

1. **"Critical thinking is not just flaw detection."** The conceptual framework's slogan was originally *"critical thinking is not flaw detection"*, which read as a categorical denial. The current framework extends beyond the original intent: the right framing is *"not just flaw detection"* — flaw detection is one component, but evaluating reasoning quality, engaging with how others see it differently, and reasoning about why people think the way they do are the broader capacity. The mixed-valence design (predominantly weak passages with genuine sound reasoning) is consistent with this — both flaw recognition and strength recognition matter.

2. **Authority sequencing (Individual → Peer → AI → Teacher) belongs to Lens, not the framework.** In the previous architecture this sequence was framework-level. In the new architecture (framework separated from app-specific instructional designs in `apps/`), this sequencing is a property of the **Lens** instructional design — appropriate for a reflective, writing-centered experience but not a constraint on future applications. Other instructional designs may legitimately use different sequencings (e.g., Reasoning Lab's competitive structure foregrounds peer-against-peer dynamics differently). The framework should not lock in any single source-of-perspective ordering; each application chooses its own.

   Suggestion D below (machine-readable scenario sequence) and suggestion B (discussion catalyst) are both currently written from a Lens perspective and would need adaptation for other applications. The framework-level point is preserved — perspectival diversity is engineered into the artifacts — but how that diversity reaches students, in what order, and through which authority structure is a per-application decision.

---

## 1. Understanding of the framework

The core insight: **critical thinking is not just flaw detection** — it is the capacity to evaluate reasoning by *articulating what you see in it*, and to engage with the fact that other people legitimately see different things in the same material. The framework operationalizes this with a deliberate three-layer architecture:

- **Visible: three lenses.** Logic/Evidence/Scope are not orthogonal dimensions to be measured along. They are *perceptual angles* — and crucially, their *non-orthogonality* (overlap, cross-visibility) is the engine, not a bug. Two students looking through different lenses can see different facets of the same passage and both be right.
- **Hidden: ten facets.** This is where the framework's structural precision lives. The hiddenness is *pedagogically load-bearing* — if students saw the taxonomy, they would classify (find the source-credibility problem) instead of perceive (look through Evidence and tell me what you see). The framework is explicit that this is not a convenience but the mechanism that makes the visible pedagogy work.
- **Visible: two interacting explanatory variables.** Cognitive patterns and social dynamics are *coupled*, not alternatives. Their interaction is the deepest learning target — the framework even cites a worked example of bidirectional amplification (a cognitive pattern reshaping the social field).

Around this sit framework-level commitments and application-level choices:

**Framework-level (any application must preserve):**

- **Mixed-valence reasoning.** Predominantly weak passages with *genuine moments of sound reasoning*. The strength is not decorative — it is calibration ("here they actually checked their sources, unlike before") and explains why the framework can use deficit-only explanatory variables (positive reasoning gets explained contrastively).
- **Articulation + brainstorming as complementary modes.** Written articulation does precision work; verbal brainstorming does fluidity work. Both are claimed as essential.
- **Learning is measured by articulation quality, perspectival range, and explanatory depth — not correctness.** The system is built so that there is no "right answer" to converge on.
- **Perspectival diversity is structural, not accidental.** It comes from facets being multi-dimensional within lenses, visible through multiple lenses, and many-to-many-mapped to explanatory variables.

**Application-level (each app decides):**

- **Authority sequencing.** Lens uses Individual → Peer → AI → Teacher. Other applications may use different orderings — e.g., a competitive format may foreground peer-against-peer differently; a social-deduction game may have no AI voice at all.
- **The state machine.** Per-passage flow is a Lens design choice.
- **Motivation structure.** Reflective (Lens), competitive (Reasoning Lab), or other.
- **What is precomputed.** Lens precomputes everything (no LLM at runtime). Other apps may make different tradeoffs.

The pipeline is the production engine that takes a structured operator prompt and produces artifacts that the runtime app consumes. For Lens, six artifacts (because of the no-runtime-LLM constraint). For other apps, the artifact set will differ.

---

## 2. Improvements to realizing the goal (framework / pedagogical)

These are gaps between what the framework *says* it does and what the pipeline *actually produces*.

### A. The strength signal is doctrinally critical but operationally implicit

The conceptual framework lists mixed-valence as a v5-6 improvement. Every scenario in `scenario-sequence.md` has a hand-written **"Strength signal"** design note. The evaluator's `quality_level` field can be `"strong"` or `"weak"`. The AI perspective is told to be mixed-valence.

But the **scenario plan has no `target_strengths` field** — only `target_facets` (which carry an implicit `target_quality: weak`). The dialog_writer is given `weaknesses` to manifest, but no parallel structure for *what should be sound*. The result: strength is engineered into the scenario design *only in the operator's prose*, then everything downstream hopes the dialog writer happens to produce it. If it doesn't, no reviewer catches the absence.

This is the gap with the largest leverage. Mixed-valence isn't pedagogical decoration — it is what justifies using *deficit-only* explanatory variables (the framework explicitly says students explain sound reasoning *contrastively* using the deficit vocabulary). Without engineered strength, that contrast collapses and students are back to flaw-finding only.

**Suggested change:** Add a first-class `target_strengths` field to `scenario.yaml` and the planning_agent's contract. Each entry carries `facet_id`, `target_quality: strong`, `carrier_persona`, and `signal_mechanism` — symmetric with `target_facets`. The dialog_writer receives a *barrier-safe translation* of this just like weaknesses (as character traits). The transcript_reviewer adds an explicit criterion: "Is the designed strength signal present?" The evaluator's `was_targeted` gains a third state (or a new `targeted_strength: bool`).

### B. Nothing in the pipeline supports verbal brainstorming (Lens-specific framing)

> **Note:** This observation was originally framed as framework-level. With clarification (2), it is properly an observation about the **Lens** application, not the framework. Other apps may handle the verbal mode differently.

The conceptual framework says learning happens in the *interaction* between written articulation and verbal brainstorming. The Lens state machine supports both — *Discuss* is face-to-face at the table. But every Lens artifact the pipeline produces is in service of articulation: hints, rubrics, AI perspectives, deepening probes, misreading redirects. The verbal-mode learning is left entirely to the room.

The facilitation guide has `productive_questions` and `likely_disagreements`, but those are *for the teacher*. There is nothing the **Lens app** can show **the group** when verbal discussion stalls or when the group is converging too easily.

**Suggested change (Lens app):** Add a small artifact — a **discussion catalyst** per passage — that the Lens app can surface when the group hits one of two triggers: (a) all members have diagnosed and >2 minutes pass without a submitted assessment, or (b) all members rated the passage the same way through the same lens (suspicious convergence). The catalyst is a single sentence — *"You all rated this strong. What would make you rate it weak?"* or *"Look at the second turn — does everyone read it the same way?"* — and it's free (not lifeline-cost). It's a lens/region pointer, not a hint at the answer. The pipeline produces 1–2 catalysts per passage from the diversity metadata that already exists in `analysis.yaml`.

This belongs in `apps/lens/pipeline/agents/scaffolding_id.md` and the Lens scaffolding schema, not in the framework.

### C. Cross-lens visibility is the framework's engine, but it's invisible to students at the moment of choice (Lens-specific framing)

> **Note:** Same caveat as B — this is a Lens app observation, not a framework one. Other applications may choose different mechanisms or none.

The framework's *whole* claim about perspectival diversity rests on cross-lens visibility — facets that one lens reveals primarily and other lenses reveal secondarily. The pipeline computes this in `expected_lens_split` and `likely_student_observations` per lens.

But if a student picks Logic in the Lens app and a passage has rich Scope visibility, *nothing surfaces this to them*. The Discuss state highlights divergence between *written diagnoses*, but not between *what lenses afford*. A whole group that all picked Logic on a Scope-rich passage will never know Scope had something specific to show them.

This is not an issue of revealing facets — it's about revealing *lens productivity*, which is fully framework-compliant.

**Suggested change (Lens app):** A **lens-switch invitation** in the Discuss state. After diagnoses are revealed, if `expected_lens_split` shows a productive lens that no group member used, the app shows: *"Nobody looked at this through Scope. Want to try?"* Picking it up costs no lifeline; it adds another diagnose-input to the thread. The framework allows multiple lenses already; this just makes lens-level diversity discoverable when it's structurally afforded but missed.

### D. The scenario sequence is design content, not machine-readable progression

> **Caveat from clarification (2):** The current `scenario-sequence.md` was written for Lens. A machine-readable sequence may need to be either (a) framework-level with app-specific overlays, or (b) per-application. Worth deciding which before implementing.

`scenario-sequence.md` is a beautifully reasoned design document — anchor + breadth, tier progression, vocabulary-on-vs-off, social-dynamic distribution. None of it is in a form the app or pipeline can read. The operator manually applies the design every time they invoke `/configure_session` (which scenario position am I at? should vocabulary toggles be on?).

This matters because three of the five Lens session-level toggles in `configure_session` (lifeline pool, show_cognitive_patterns, show_social_dynamics) are scenario-position-dependent in a way the design document already specifies. Currently the operator manually decides each time. The design intent is being re-applied by hand.

**Suggested change:** A `framework/reference/scenario_sequence.yaml` (or `apps/lens/reference/scenario_sequence.yaml` if per-app) that lists the planned sequence by `scenario_id` with: position (1..N), anchor or new, expected vocabulary state, suggested lifeline pool, target facets (cross-checked against scenario.yaml at validation time). Then `/configure_session` derives most toggles from this and the operator only overrides if needed. As a side benefit, an app could load this and tell a class "this is your 4th critical thinking session" or "you've now seen all three lenses as primary."

### E. Internal consistency of the explanatory layer — one structural soft spot

The framework says cognitive patterns and social dynamics are deficit-only because deficit patterns have causal specificity that positive ones lack, and that positive reasoning gets explained contrastively. This is intellectually clean. But it creates a real problem for **Scenario 5** in the current sequence: a passage where the personas *engage well with each other but miss consequence consideration* — the strength is interpersonal, the weakness is structural. The current explanatory variable inventory cannot name "engaging with each other well" because there is no positive social dynamic.

The framework's "future considerations" indirectly acknowledges related issues. Worth surfacing: in the evaluator agent, when annotating a passage with `quality_level: strong`, the agent should produce a *contrastive* explanation ("here the group did X, where in earlier passages they would have done Y") rather than try to find a non-existent positive variable. This is what the framework intends but the agent prompts don't make it explicit.

**Suggested change:** Add a `contrastive_explanation` field to strong-quality facet annotations in `analysis.yaml`. Update the evaluator prompt with one paragraph on how to write contrastive explanations using the deficit vocabulary.

---

## 3. Improvements to the pipeline and commands

These are about the production system, not the pedagogy.

### F. Standardize reviewer verdict vocabulary

The four reviewers currently return inconsistent verdict sets:

| Reviewer | Verdicts |
|---|---|
| validation_agent | pass / revise / reject |
| transcript_reviewer | ACCEPT / REVISE / REGENERATE |
| analysis_reviewer | ACCEPT / REVISE |
| scaffolding_reviewer | ACCEPT / REVISE |

The commands now drive control flow off these verdicts. Different vocabularies + different cases = a latent bug surface. If `analysis_reviewer` ever returns REGENERATE, `analyze_transcript.md` doesn't know what to do with it.

**Suggested change:** Standardize on `ACCEPT / REVISE / REGENERATE / REJECT` across all four. Document which subset each reviewer is *allowed* to return. Update each reviewer's "Output Format" section. The producer-driven loops in the commands all key off the same four words.

### G. No telemetry — the pipeline is operating blind

When something works, no record. When something fails, the operator gets a one-shot report. There is no way to look back and ask: "How many revise passes did `relevance` scenarios typically need? Where do reviewers fail most? Did the dialog_writer's first attempt usually pass structural review, or did it always need a regenerate?" That data would let you tune the agents over time. Without it, every adjustment is intuition-driven.

**Suggested change:** Each command writes to `artifacts/{scenario_id}/pipeline_log.yaml` as it runs. Each entry: stage, agent invoked, attempt number, verdict, retry-budget remaining, timestamp, optional notes. No sensitive content — just the trace. After 10 scenarios you have data for tuning; after 30 you have data for revising the framework's assumptions about what's hard.

### H. No resume semantics for halted runs

The failure-mode escape hatch (added in the autonomous-pipeline conversion) says "edit and resume," but there's no documented way to resume. Each command currently always starts from Step 1. If `/create_transcript` halted on the dialog_writer at attempt 3 and the operator manually fixes the transcript_polished.yaml, re-invoking the command reruns everything.

**Suggested change:** Each command checks for the existence of its expected output before each step and skips completed steps with a `[SKIP] step N: artifact already present` log line. Add a `--restart` flag (or `--restart-from N`) for the cases where the operator wants to force re-execution. Document the convention in `framework/docs/system-architecture.md` next to the escape hatch.

### I. Wire `validate_schema.py` into save steps

The commands say "validate against the schema" in prose, but the script is not always explicitly invoked. When the main-thread Claude follows the prose, sometimes it runs the script and sometimes it eyeballs. The reviewer subagents never validate.

**Suggested change:** Each command's save step explicitly runs `python3 framework/pipeline/scripts/validate_schema.py <artifact> <schema>` and halts on non-zero exit. This is one line per command and converts a soft check into a hard one.

### J. `/configure_session` makes the operator hand-author too much templated copy

The 8+ student-facing strings the operator authors in `/configure_session` (`diagnose.instructions`, `articulation_prompt`, `discuss.instructions`, etc.) are mostly templated. They differ between scenarios only when the operator wants them to. Right now the operator either re-types or copies from a previous scenario.

**Suggested change:** A `framework/reference/default_instructions.yaml` with all the standard strings (or `apps/lens/reference/default_instructions.yaml` if Lens-specific). `/configure_session` loads defaults and writes them into `session.yaml`. The operator only customizes when they want to deviate. Reduces the authorship surface to *just* the genuinely scenario-specific bits (`topic_summary`, `reading_instruction`).

### K. `/brainstorm` and `/create_scenario` have a copy-paste boundary that adds friction

`/brainstorm` outputs an operator prompt as conversational text. The operator copies it, invokes `/create_scenario`, pastes it. This is two slash commands and a clipboard hop. The two commands are conceptually one design phase.

**Suggested change:** Either (a) `/brainstorm` writes the prompt to a staging path like `artifacts/_pending/operator-prompt.txt` and `/create_scenario` accepts an optional `--from-pending` flag; or (b) `/brainstorm` ends by suggesting the operator type `/create_scenario` and Claude carries the prompt across in conversational context. (a) is more durable but (b) is friction-free in the common case.

### L. No coverage check across the scenario set

The scenario-sequence design tracks coverage carefully (5/5 core facets, 8/8 cognitive patterns, 3/3 social dynamics, distribution constraints). After the operator runs the pipeline 5 times, no command says "you covered everything you planned to" or "scenario 4 still needs to be generated." The design is enforced by the operator's memory.

**Suggested change:** A `/check_coverage` command that reads all `artifacts/*/scenario.yaml`, the planned `scenario_sequence.yaml` (from suggestion D), and reports a coverage matrix. Useful especially during the pilot phase when you'll be regenerating individual scenarios.

### M. No smoke test for pipeline edits

After each round of edits to commands or agents, the only way to know the pipeline still works is to run a real scenario. That costs operator attention and tokens. There should be a way to verify the plumbing without doing real generation.

**Suggested change:** A fixed minimal operator prompt at `framework/test/minimal_operator_prompt.txt` and a `/smoke_test_pipeline` command that runs the entire pipeline against it with a `--smoke` flag passed to commands so agents know to keep outputs minimal. Output goes to `artifacts/_smoke/` and is .gitignored. Run after every meaningful edit.

---

## 4. Prioritization

**Tier 1 — largest leverage, do first:**
- **A** (first-class strength signaling) — closes the gap between the mixed-valence doctrine and what the pipeline actually engineers
- **C** (lens-switch invitation, Lens-specific) — surfaces the framework's central engine to students at the moment of choice
- **F + I** (verdict standardization + schema validation script) — small, mechanical, removes latent bug classes that will bite during the pilot

**Tier 2 — meaningful structural improvements:**
- **B** (discussion catalyst, Lens-specific) — gives the verbal mode the same support the written mode gets
- **D + L** (machine-readable scenario sequence + coverage check) — the design document becomes load-bearing, the pilot phase has feedback
- **G** (telemetry) — converts agent-tuning from intuition to data

**Tier 3 — worth doing eventually:**
- **E** (contrastive explanation field) — clean fix for a real conceptual edge case
- **H** (resume semantics) — quality-of-life for the operator
- **J** (default instructions library) — reduces authorship burden
- **K** (brainstorm chaining) — friction reduction
- **M** (smoke test) — useful but you can live without it

---

## 5. What I am deliberately *not* recommending

A few things look like "improvements" but would actively hurt the design:

- **Don't expose facets to students.** The hidden layer is load-bearing.
- **Don't add a single rating output.** Articulation-as-evaluation is foundational; rating-only collapses the learning.
- **Don't simplify lenses to dimensions.** The metaphor is intentional.
- **Don't reduce the explanatory variable count to one.** Both cognitive and social are needed; their interaction is the deepest target.
- **Don't add positive cognitive patterns or social dynamics.** The deficit-only design has theoretical justification and contrastive explanation handles the mixed-valence case (see E).
- **Don't reintroduce mid-pipeline operator gates.** They were just removed for good reason.
- **Don't lock the framework to Lens's authority sequencing.** Per clarification (2), Individual → Peer → AI → Teacher is a Lens design choice; other applications may use different orderings.
