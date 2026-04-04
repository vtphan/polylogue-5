# Pipeline Implementation Plan

## Overview

This plan covers implementation of the Polylogue 5 pipeline: the system that generates AI group discussions with designed reasoning weaknesses for the Lens app. It does not cover the app (to be written separately after the pipeline is complete).

**Source documents:**
- `polylogue-v5-4.md` — conceptual framework (lenses, facets, explanatory variables, perspectival learning model)
- `facet-inventory.md` — the eleven facets with quality ranges, cross-lens visibility, explanatory connections
- `pipeline-spec.md` — technical specification (six artifacts, five stages, nine agents, schemas)
- `user-stories.md` — how teachers and students interact with pipeline artifacts through the app

**Build order:** Reference data and schemas first — these establish the vocabulary and contracts every subsequent artifact depends on. Then agent prompts and commands. Then the first end-to-end scenario run to validate the architecture. Then scripts to formalize mechanical operations. Then a review to catch integration and quality issues.

**Structure:** Seven implementation phases (including Phase 5A) and one review phase. Each phase is scoped to one Claude Code working session. The review catches issues before scenario generation begins.

**How the review works:** The operator runs the review prompt with a separate agent, analyzes the feedback, and forwards relevant findings to the developing agent. The operator controls the gate.

---

## Phase Map

```
Phase 1 → Phase 2 → Phase 3 → Phase 4 → REVIEW → Phase 5 → Phase 5A → Phase 6
```

All phases are sequential.

---

## Phase 1: Foundation

**Objective:** Set up the directory structure, project configuration, and hand-authored reference data.

**Inputs:**
- `polylogue-v5-4.md` — framework definitions (lenses, cognitive patterns, social dynamics)
- `facet-inventory.md` — the eleven facets

**Tasks:**

1. Create the full directory tree:
   ```
   configs/
   ├── reference/              # Reference data files + schemas
   │   └── schemas/
   ├── scenario/               # create_scenario command, planning + validation agents
   │   ├── schemas/
   │   ├── commands/
   │   └── agents/
   ├── transcript/             # create_transcript command, dialog writer + transcript ID agents
   │   ├── schemas/
   │   ├── commands/
   │   └── agents/
   ├── analysis/               # analyze_transcript command, evaluator agent
   │   ├── schemas/
   │   ├── commands/
   │   └── agents/
   ├── scaffolding/            # design_scaffolding command, scaffolding ID agent
   │   ├── schemas/
   │   ├── commands/
   │   └── agents/
   ├── session/                # configure_session command
   │   ├── schemas/
   │   └── commands/
   ├── system/                 # initialize_polylogue command, sync script
   │   ├── commands/
   │   └── scripts/
   └── shared/                 # Cross-cutting scripts (validate_schema, etc.)
       └── scripts/
   ```

2. Create `registry/` directory. Each scenario gets `registry/{scenario_id}/` for final artifacts and `registry/{scenario_id}/intermediates/` for pre-enumeration transcripts, pre-enrichment facilitation guides, and other intermediate outputs useful for debugging.

3. Write `CLAUDE.md` at repo root with project conventions — YAML for all artifacts, schema-driven communication, canonical IDs, directory structure.

4. Write three reference data files:

   | File | Contents | Source |
   |---|---|---|
   | `configs/reference/lenses.yaml` | Three lenses: ID, name, question, description | `polylogue-v5-4.md` Section 2 |
   | `configs/reference/facet_inventory.yaml` | Eleven facets: ID, name, definition, quality range, primary lens, cross-lens visibility, explanatory connections, priority tier | `facet-inventory.md` |
   | `configs/reference/explanatory_variables.yaml` | Eight cognitive patterns + four social dynamics: ID, name, description (6th-grade language) | `polylogue-v5-4.md` Section 4 |

**Outputs:**
- Directory tree
- `CLAUDE.md`
- Three reference data files

**Notes:**
- Canonical IDs established here propagate into every schema, prompt, and artifact. All IDs use snake_case.
- Lens IDs: `logic`, `evidence`, `scope`.
- Facet IDs: `source_credibility`, `source_diversity`, `relevance`, `sufficiency`, `inferential_validity`, `internal_consistency`, `reasoning_completeness`, `perspective_engagement`, `consequence_consideration`, `condition_sensitivity`.
- Cognitive pattern IDs: `confirmation_bias`, `tunnel_vision`, `overgeneralization`, `false_cause`, `uncritical_acceptance`, `black_and_white_thinking`, `egocentric_thinking`, `false_certainty`.
- Social dynamic IDs: `group_pressure`, `conflict_avoidance`, `authority_deference`.
- Reference data files are the source of truth — not schema definitions. Schema definitions (Phase 2) describe the *structure* of these files.

---

## Phase 2: Schemas

**Objective:** Author all schema definitions governing every pipeline handoff and artifact.

**Inputs:**
- `pipeline-spec.md` — artifact specifications (Sections 2.1–2.7)
- Reference data files from Phase 1 (for canonical IDs)

**Tasks:**

Write 13 schema files:

| # | Schema | Location | Source |
|---|---|---|---|
| 1 | Lens definitions | `configs/reference/schemas/lenses.yaml` | Pipeline spec Section 8 |
| 2 | Facet inventory | `configs/reference/schemas/facet_inventory.yaml` | Pipeline spec Section 8 |
| 3 | Explanatory variables | `configs/reference/schemas/explanatory_variables.yaml` | Pipeline spec Section 8 |
| 4 | Scenario plan | `configs/scenario/schemas/scenario_plan.yaml` | Pipeline spec Section 2.1 |
| 5 | Validation output | `configs/scenario/schemas/validation_output.yaml` | Pipeline spec Section 3, Stage 1 |
| 6 | Dialog writer input | `configs/transcript/schemas/dialog_writer_input.yaml` | Derived from scenario plan minus `target_facets` |
| 7 | Transcript (pre-enumeration) | `configs/transcript/schemas/transcript_pre.yaml` | Pipeline spec Section 2.2, without IDs |
| 8 | Transcript (post-enumeration) | `configs/transcript/schemas/transcript.yaml` | Pipeline spec Section 2.2 |
| 9 | Expert analysis | `configs/analysis/schemas/analysis.yaml` | Pipeline spec Section 2.3 |
| 10 | Facilitation guide | `configs/analysis/schemas/facilitation.yaml` | Pipeline spec Section 2.4 |
| 11 | Scaffolding materials | `configs/scaffolding/schemas/scaffolding.yaml` | Pipeline spec Section 2.6 |
| 12 | Session configuration | `configs/session/schemas/session.yaml` | Pipeline spec Section 2.5 |
| 13 | Student annotations | `configs/session/schemas/student_annotations.yaml` | Pipeline spec Section 2.7 |

**Outputs:**
- 13 schema files in their respective directories.

**Notes:**
- Schema #6 (dialog writer input) is the scenario plan minus `target_facets`. This is the information barrier in schema form — making it a schema prevents accidental leakage.
- Schema #7 (pre-enumeration transcript) matches #8 but without `turn_id` and `sentence_id` fields. The dialog writer outputs prose with speaker labels; enumeration adds IDs.
- Schema #9 (expert analysis) is the most complex — it contains the hidden layer (facet annotations), two visible AI perspective blocks (evaluate and explain), and diversity metadata. Each section has distinct fields and purposes.
- Schema #10 (facilitation guide) includes the debrief section: key takeaways, cross-group prompts, and connection to next session.
- Schema #11 (scaffolding) contains two rubric sub-schemas: observation rubric (per-lens, Evaluate phase) and explanation rubric (lens-independent, Explain phase). Also includes common misreadings with pattern and redirect fields.
- Schema #13 (student annotations) is app-side, not pipeline — it's specified here so the pipeline's assessment-relevant fields align with what the app stores.
- Schemas are descriptive YAML (field name, type, required/optional, description, constraints) — human-readable contracts first, machine-validatable second.
- **Scaffolding field checklist** (from `user-stories.md` artifact requirements table — verify every field below appears in the corresponding schema):

  | Field | Schema | Purpose |
  |---|---|---|
  | `passage_scaffolding[].evaluate.lens_entry_prompts` | scaffolding | Per-passage, per-lens entry prompts more directed than the generic lens question |
  | `passage_scaffolding[].evaluate.difficulty` | scaffolding | Difficulty signal for ordering passages by accessibility |
  | `passage_scaffolding[].evaluate.partial_hints` | scaffolding | Per-lens partial hints ("where to look, not what to see") |
  | `passage_scaffolding[].evaluate.ai_reflection_prompts` | scaffolding | Per-lens reflection prompts for the Evaluate AI step |
  | `passage_scaffolding[].explain.bridge_prompts` | scaffolding | Per-lens prompts connecting Evaluate observations to the Explain task |
  | `passage_scaffolding[].explain.passage_sentence_starters` | scaffolding | Passage-specific starters (distinct from session-level generic starters) |
  | `passage_scaffolding[].explain.ai_reflection_prompt` | scaffolding | Reflection prompt for the Explain AI step |
  | `passage_scaffolding[].common_misreadings` | scaffolding | Per-passage, per-lens misreading patterns with redirects |
  | `passage_scaffolding[].observation_rubric` | scaffolding | Per-lens rubric (basic/developing/differentiated) |
  | `passage_scaffolding[].explanation_rubric` | scaffolding | Lens-independent rubric (cognitive/social/interaction levels) |
  | `explain_phase.individual.sentence_starters` | session | Session-level generic starters (cognitive, social, interaction) |
  | `explain_phase.reference_lists` | session | Browsable cognitive pattern and social dynamic definitions |
  | `evaluate_phase.completion_threshold` | session | Minimum passages to evaluate before moving to Peer step |
  | `explain_phase.completion_threshold` | session | Minimum passages to explain before moving to Peer step |

---

## Phase 3: Agent Prompts

**Objective:** Write the nine agent prompt definitions — six production agents and three quality reviewers.

**Inputs:**
- `pipeline-spec.md` — agent roles (Section 4), information barrier (Section 5), stage descriptions (Section 3)
- `polylogue-v5-4.md` — framework principles (perspectival learning model, hidden/visible layers)
- `facet-inventory.md` — facet definitions, quality ranges, cross-lens visibility
- Schemas from Phase 2

**Tasks:**

| # | Agent | File | Key challenge |
|---|---|---|---|
| 1 | Planning agent | `configs/scenario/agents/planning_agent.md` | Must translate facet targets into natural-language persona weaknesses and `accomplishes` fields — the information barrier depends on this translation quality |
| 2 | Validation agent | `configs/scenario/agents/validation_agent.md` | Must check facet detectability through specified lenses, cross-lens visibility potential, persona tension, information barrier compliance in `weaknesses`/`accomplishes` fields, and turn outline anti-patterns |
| 3 | Dialog writer | `configs/transcript/agents/dialog_writer.md` | Operates behind the information barrier — sees character traits and narrative goals only. Must produce natural 6th-grade language, distinct persona voices, coherent discussion arc reaching a resolution |
| 4 | Transcript instructional designer | `configs/transcript/agents/transcript_id.md` | Sees full plan including targets. Sharpens signal moments without making them cartoonish. Enforces 6th-grade language. Does not add or remove content — refines phrasing and signal clarity only |
| 5 | Evaluator | `configs/analysis/agents/evaluator.md` | Produces both analysis.yaml and facilitation.yaml (including whole-class debrief materials). Must write AI perspectives as perspectives, not verdicts. Must identify both targeted and emergent facets. Must produce discrete expected student observations per lens for diversity metadata. Must produce debrief key takeaways, cross-group prompts, and connection-to-next |
| 6 | Scaffolding instructional designer | `configs/scaffolding/agents/scaffolding_id.md` | Translates evaluator's analytical language into pedagogical materials for 6th graders. Must produce partial hints that direct attention to *where* to look, not *what* to see. Must anticipate common misreadings per passage per lens with gentle redirects. Must produce rubric entries at three differentiation levels. Must also enrich facilitation guide's `productive_questions` |
| 7 | Transcript reviewer | `configs/transcript/agents/transcript_reviewer.md` | Reviews the polished transcript against the full scenario plan. Reports to operator — does not trigger regeneration. Checks: facet signals detectable but not cartoonish, information barrier held (no framework language in dialog), distinct persona voices, genuine disagreement present, natural discussion arc for 6th graders, resolution reached or meaningfully failed |
| 8 | Analysis reviewer | `configs/analysis/agents/analysis_reviewer.md` | Reviews analysis.yaml and facilitation.yaml against the transcript and scenario plan. Reports to operator. Checks: facet annotations match observable transcript evidence, AI perspective split is clean (no explanatory vocabulary in evaluate block), perspectives read as perspectives not verdicts, diversity_potential observations are plausible, facilitation guide is scannable and actionable, debrief materials surface perspectival diversity |
| 9 | Scaffolding reviewer | `configs/scaffolding/agents/scaffolding_reviewer.md` | Reviews scaffolding.yaml and the enriched facilitation.yaml against analysis.yaml and the transcript. Reports to operator. Checks: partial hints direct attention without naming what to see, rubric entries have three distinct differentiation levels, common misreadings are plausible with calibrated redirects, bridge prompts connect Evaluate observations to perspective-taking, enriched productive_questions don't duplicate or contradict evaluator's existing content, all scaffolding field checklist items present |

**Outputs:**
- 9 agent prompt files.

**Notes:**
- The dialog writer prompt is the highest-risk artifact. It must:
  - Produce natural conversation between 6th-grade characters with distinct voices
  - Follow the turn outline's narrative arc
  - Use persona weaknesses to drive reasoning quality without awareness of the framework
  - Produce a discussion that is coherent, reaches a resolution (or meaningful failure to resolve), and is readable in 3 minutes (constraint from user stories)
  - Include no framework terminology, no facet names, no analytical language
- The evaluator prompt is the most complex artifact. It must produce two separate AI perspective blocks (evaluate and explain) with the correct content in each:
  - Evaluate: per-lens observations only, no explanatory vocabulary, includes `what_to_notice`
  - Explain: cognitive/social vocabulary as one possible reading, not diagnosis; interaction modeling
  - Both blocks: written as "here's what I notice" not "here's what's wrong"
- The scaffolding instructional designer prompt must encode the hint calibration principle: "direct attention to *where* to look, not *what* to see." A hint should point to a region of the reasoning without naming what about that region is notable.
- Each agent prompt references its output schema explicitly.
- The three reviewer agents (transcript, analysis, scaffolding) share a common output format: structured PASS/ISSUE/SUGGESTION per criterion, with specific file and field references for each ISSUE. They report to the operator and suggest revisions — they do not trigger regeneration or modify artifacts directly. The operator decides whether to act on findings.
- The transcript reviewer sees the full scenario plan (including `target_facets`) so it can assess whether designed facet signals are present. This is appropriate because the reviewer operates after the information barrier has served its purpose (the dialog writer has already generated the transcript without seeing the targets).
- The analysis reviewer must check both directions: (a) are targeted facets correctly identified in the analysis, and (b) does the analysis identify any emergent facets that seem spurious or unsupported by the transcript text?
- The scaffolding reviewer is the final quality gate before session configuration. It verifies that the pedagogical materials are calibrated for 6th graders — hints that are too specific give away the answer, rubrics that are too vague don't help assessment.

---

## Phase 4: Slash Commands

**Objective:** Write the five slash command definitions that orchestrate the pipeline stages, plus the initialization command.

**Inputs:**
- `pipeline-spec.md` — stage descriptions (Section 3), information barrier (Section 5)
- Agent prompts from Phase 3
- Schemas from Phase 2

**Tasks:**

| # | Command | File | Orchestration logic |
|---|---|---|---|
| 1 | `initialize_polylogue` | `configs/system/commands/initialize_polylogue.md` | Calls `sync_configs.py` to copy commands and agents to `.claude/`, then verifies reference data and schema files exist |
| 2 | `create_scenario` | `configs/scenario/commands/create_scenario.md` | Planning agent drafts plan → validation agent reviews → operator approves → output |
| 3 | `create_transcript` | `configs/transcript/commands/create_transcript.md` | Strip `target_facets` → dialog writer → structural review → transcript ID polish → **transcript reviewer** → operator gate → enumeration |
| 4 | `analyze_transcript` | `configs/analysis/commands/analyze_transcript.md` | Segment passages → evaluator produces analysis + facilitation guide → **analysis reviewer** → operator gate |
| 5 | `design_scaffolding` | `configs/scaffolding/commands/design_scaffolding.md` | Scaffolding ID produces scaffolding materials + enriches facilitation guide → **scaffolding reviewer** → operator gate |
| 6 | `configure_session` | `configs/session/commands/configure_session.md` | Assemble session config from transcript + analysis + scaffolding |

**Outputs:**
- 6 command files.

**Notes:**
- `create_transcript` is the most complex command. It must:
  - Strip `target_facets` from the scenario plan before passing to the dialog writer, using `strip_scenario.py` (or manually: copy `scenario.yaml`, delete the `target_facets` key, save as `dialog_writer_input.yaml`). This is the information barrier's enforcement mechanism.
  - Run structural review after dialog writer output (script or manual)
  - Implement discard-and-regenerate (max 3 attempts, clean retry, no feedback from failed attempt)
  - Pass raw transcript + full plan to the transcript instructional designer
  - Run the **transcript reviewer** after the transcript ID polish. The reviewer reads the polished transcript + full scenario plan (including `target_facets`) and reports PASS/ISSUE/SUGGESTION to the operator. The operator decides whether to accept, request revisions from the transcript ID, or discard and regenerate.
  - Apply enumeration after the operator accepts the transcript
- `create_scenario` must include:
  - Persona conflict validation (personas must disagree about something substantive)
  - Turn outline anti-pattern checks (no 4+ consecutive turns of unchecked agreement, omission concerns must be at least briefly acknowledged)
  - Quality checklist in the command itself
- `analyze_transcript` handles passage segmentation — initially manual or heuristic, with a note for future automation. After the evaluator produces analysis.yaml and facilitation.yaml, the **analysis reviewer** checks both artifacts and reports to the operator. The operator decides whether to accept or request revisions from the evaluator.
- `design_scaffolding` writes to two outputs: `scaffolding.yaml` (new) and enriches `facilitation.yaml` (existing, from Stage 3). The enrichment mechanism: the scaffolding ID agent reads the existing `facilitation.yaml`, generates passage-specific discussion starter questions for each passage's `productive_questions` fields, and writes the updated `facilitation.yaml` back. The agent must preserve all existing content from Stage 3 and only add to `productive_questions` — it does not modify other fields.
- After the scaffolding ID produces its outputs, the **scaffolding reviewer** checks scaffolding.yaml and the enriched facilitation.yaml, reporting to the operator. The operator decides whether to accept or request revisions.
- `configure_session` is largely mechanical — assembles from other artifacts. No reviewer is needed — it assembles from already-reviewed artifacts.
- Commands include manual fallback instructions for when scripts are not yet available: "If `review_transcript.py` is not available, verify manually: turn count within 10-14, 1-3 sentences per turn, under 400 words total, speaker names match plan, turn order follows outline."

---

## REVIEW: Full Pipeline Review

**Why here:** All schemas, agents, and commands are authored. Before running the first scenario, review the full pipeline for consistency, barrier integrity, and completeness.

**Files to review:**
- All reference data files in `configs/reference/`
- All schema files in `configs/*/schemas/`
- All agent prompts in `configs/*/agents/`
- All commands in `configs/*/commands/`

**Review prompt:**

```
You are reviewing the Polylogue 5 pipeline — schemas, agent prompts, and commands —
before the first end-to-end run. The conceptual framework is at docs/polylogue-v5-4.md,
the facet inventory at docs/facet-inventory.md, and the pipeline specification at
docs/pipeline-spec.md. Check the following criteria and report each as PASS, ISSUE
(with explanation), or SUGGESTION (non-blocking).

FILES TO REVIEW:
- configs/reference/*.yaml and configs/reference/schemas/*.yaml
- All .yaml files in configs/*/schemas/
- All .md files in configs/*/agents/
- All .md files in configs/*/commands/

CRITERIA:

1. CANONICAL ID CONSISTENCY
   The 3 lens IDs, 10 facet IDs, 8 cognitive pattern IDs, and 3 social dynamic IDs
   must match exactly between the reference data files and every schema and agent prompt
   that references them. List any mismatches.

2. INFORMATION BARRIER INTEGRITY
   a. Does the dialog_writer_input schema exclude target_facets?
   b. Does the create_transcript command strip target_facets before invoking the
      dialog writer?
   c. Does the dialog writer agent prompt contain ANY framework terminology (facet
      names, lens names, cognitive pattern names, social dynamic names)? It should not.
   d. Are the planning agent's weaknesses and accomplishes field examples written in
      natural language, not framework terminology?

3. SCHEMA COMPLETENESS
   For each artifact specification in pipeline-spec.md Sections 2.1-2.7, verify every
   field appears in the corresponding schema. Flag any fields in the spec but missing
   from the schema, or in the schema but absent from the spec.

4. AI PERSPECTIVE SPLIT
   a. Does analysis.yaml schema have TWO separate ai_perspective blocks
      (ai_perspective_evaluate and ai_perspective_explain)?
   b. Does ai_perspective_evaluate contain ONLY per-lens observations and
      what_to_notice — NO explanatory vocabulary?
   c. Does ai_perspective_explain contain explanatory_note, cognitive_connection,
      social_connection, and interaction_note?
   d. Does the evaluator agent prompt encode the distinction between the two blocks?

5. SCAFFOLDING CALIBRATION
   a. Do the scaffolding ID agent's instructions encode the partial hint principle
      ("where to look, not what to see")?
   b. Does the scaffolding schema include both observation_rubric (per-lens) and
      explanation_rubric (lens-independent)?
   c. Does the explanation_rubric's differentiated level model cognitive-social
      interaction?

6. TWO-PHASE SESSION STRUCTURE
   a. Does the session configuration schema encode both evaluate_phase and
      explain_phase with their own I→P→AI sequences?
   b. Do both AI steps have response_required and response_prompt fields?
   c. Is lens_scope marked as evaluate_only?

7. AGENT-COMMAND ALIGNMENT
   For each command, verify it invokes the correct agent(s) in the correct order
   with the correct inputs. Check that create_transcript strips target_facets,
   that design_scaffolding enriches facilitation.yaml, and that configure_session
   assembles from the correct sources. Verify that each command invokes its
   reviewer agent at the correct point: transcript reviewer after transcript ID
   polish (before enumeration), analysis reviewer after evaluator output,
   scaffolding reviewer after scaffolding ID output.

8. CROSS-REFERENCE INTEGRITY
   Verify that passage_id, turn_id, and sentence_id are used consistently across
   all schemas that reference them (analysis, facilitation, scaffolding, session
   config, student annotations).

9. SCAFFOLDING-TO-FACILITATION ALIGNMENT
   The scaffolding ID agent enriches facilitation.yaml's productive_questions
   fields. Verify:
   a. Does the design_scaffolding command specify that the agent reads the existing
      facilitation.yaml and writes back with additions?
   b. Does the scaffolding ID agent prompt instruct the agent to preserve all
      existing content and only add to productive_questions?
   c. Could the enriched productive_questions contradict or duplicate the
      evaluator's original likely_disagreements or watch_for fields? If so,
      does the prompt guard against this?

10. WHOLE-CLASS DEBRIEF COMPLETENESS
    The facilitation guide includes a debrief section. Verify:
    a. Does the facilitation guide schema include debrief with key_takeaways,
       cross_group_prompts, and connection_to_next?
    b. Does the evaluator agent prompt instruct the agent to produce debrief
       materials?
    c. Do the cross_group_prompts surface perspectival diversity at the class
       level (cross-lens and cross-group differences)?
    d. Does connection_to_next reference the scenario's pedagogical position
       without assuming a fixed sequence?

11. COMMON MISREADINGS CALIBRATION
    The scaffolding materials include common_misreadings per passage per lens.
    Verify:
    a. Does the scaffolding schema include common_misreadings with pattern and
       redirect fields?
    b. Does the scaffolding ID agent prompt instruct the agent to produce
       misreadings?
    c. Are redirects calibrated like partial hints — redirecting attention
       without naming the correct observation?
    d. Are misreading patterns specific enough for keyword/semantic matching
       without LLM access at runtime?

12. SCAFFOLDING FIELD COMPLETENESS
    Every field in the Phase 2 scaffolding field checklist must appear in
    the corresponding schema (scaffolding or session). Verify:
    a. Does scaffolding.yaml include all 10 passage_scaffolding fields
       listed in the checklist?
    b. Does session.yaml include explain_phase.individual.sentence_starters,
       explain_phase.reference_lists, and completion thresholds for both
       phases?
    c. Does the scaffolding ID agent prompt instruct the agent to produce
       each of these fields?
    d. Are lens_entry_prompts, ai_reflection_prompts, and bridge_prompts
       per-lens (keyed by lens ID)?

Report each criterion as PASS or ISSUE. For ISSUEs, quote the specific file and
field causing the problem. End with READY TO PROCEED or NEEDS REVISION (prioritized).
```

---

## Phase 5: First End-to-End Scenario Run

**Objective:** Run the full pipeline for one scenario to validate every architectural decision.

**Inputs:**
- All artifacts from Phases 1-4
- PBL reference: `references/PBL/6th Grade STEM (Fall 2025).txt` — driving question: "What are the major threats affecting our global environment, and what can our communities do to protect our ecosystems?"

**Tasks:**

1. Run `initialize_polylogue` to copy commands and agents to `.claude/`.

2. Run `create_scenario` with the operator prompt below. Run `create_scenario` again with the second prompt only if the first scenario completes successfully and time permits — the second scenario tests different facets and a different explanatory pairing.

### Test Scenario A: Ocean Pollution vs. Deforestation

```
Topic: Whether to focus the group's environmental project on ocean pollution
or deforestation

Context: A 6th-grade STEM class is working on the PBL driving question: "What
are the major threats affecting our global environment, and what can our
communities do to protect our ecosystems?" This group needs to choose one
environmental issue for their semester project. They're debating between ocean
pollution (one member saw a documentary about plastic in the Pacific) and
deforestation (another member read about Amazon fires). They can only pick one.

Instructional goals:
- Practice noticing when someone's evidence doesn't actually support the
  specific claim they're making
- Practice noticing when the group only considers one side of a question

Target complexity: 2 personas, 2 target facets

Target facets:
- Relevance (Evidence lens) — one persona uses evidence about ocean pollution
  in general to argue their local project should focus on it, but the evidence
  is about a different scale and context than what their project could address.
  Cognitive pattern: overgeneralization. Social dynamic: group_pressure (the other
  persona finds the documentary compelling and doesn't push back on the
  relevance gap).
- Counter-argument engagement (Scope lens) — the persona arguing for
  deforestation raises real concerns about feasibility, but the group moves
  past them with "we can figure that out later" rather than actually engaging.
  Cognitive pattern: confirmation bias (the ocean-pollution persona dismisses
  the concern because it threatens their preferred choice). Social dynamic:
  conflict avoidance (the deforestation persona lets it go rather than
  pressing).

The personas must genuinely disagree — they want different projects, not
just different angles on the same project. The discussion ends when they
pick one or acknowledge they can't decide.
```

**Why this scenario:** Relevance and counter-argument engagement are both Core tier facets with high cross-lens visibility (relevance visible through Logic; counter-argument engagement visible through Evidence and Logic). This maximizes the chance of perspectival diversity in peer exchange. The two facets test different lenses (Evidence and Scope), and the explanatory variables span three cognitive patterns and two social dynamics, exercising the full evaluate-then-explain arc. The topic is concrete and age-appropriate — students have opinions about environmental projects.

**Design notes for review:**
- The relevance gap should be subtle — the documentary evidence is real and interesting, just not relevant to their specific local project scope. If the gap is too obvious, the dialog writer has failed.
- The counter-argument dismissal ("we can figure that out later") should feel natural, not cartoonish. Real groups do this constantly.
- Check that the conflict avoidance dynamic is visible — the deforestation persona should push back at least once before yielding.

### Test Scenario B: School Garden Water Usage

```
Topic: Whether the school garden project should use the school's water supply
or set up a rainwater collection system

Context: A 6th-grade STEM class is working on the PBL driving question: "What
are the major threats affecting our global environment, and what can our
communities do to protect our ecosystems?" This group is planning the school
garden (a real project at the school) and needs to decide how to water it.
One option is simple — use the school's hose. The other is more ambitious —
build a rain barrel system. The principal said they can do either but the
garden needs to be running by spring.

Instructional goals:
- Practice noticing when a conclusion is bigger than what the discussion
  actually showed
- Practice noticing whose perspectives are missing from the discussion

Target complexity: 2 personas, 2 target facets

Target facets:
- Sufficiency (Evidence lens) — one persona claims the rain barrel system
  "will definitely provide enough water" based on one website about rainfall
  in a different climate. The evidence is thin for a confident conclusion.
  Cognitive pattern: false certainty (states the conclusion with no
  qualification despite minimal evidence). Social dynamic: authority deference
  (the other persona defers because "you researched it").
- Perspective breadth (Scope lens) — neither persona considers the
  custodial staff who would maintain the system, the science teacher who
  runs the garden club, or what happens over summer break. The plan only
  reflects student enthusiasm.
  Cognitive pattern: egocentric thinking (only considered their own
  perspective as students). Social dynamic: group_pressure (both were excited
  and neither stepped back to ask "who else should we talk to?").

The personas should disagree about which option is better — one wants the
simple hose, the other wants the rain barrels. The rain-barrel persona is
more enthusiastic and researched; the hose persona is pragmatic but gets
won over by the "research." The discussion ends with a decision.
```

**Why this scenario:** Sufficiency and perspective_engagement are Core tier facets from different lenses (Evidence and Scope), with different cross-lens visibility patterns (sufficiency also visible through Scope and Logic; perspective_engagement also visible through Evidence). The explanatory variables test a different set than Scenario A — false certainty, egocentric thinking, authority deference, and group_pressure. Together, the two test scenarios cover 4 of 6 Core facets, 5 of 8 cognitive patterns, and all 3 social dynamics.

**Design notes for review:**
- The sufficiency weakness should be clear in hindsight but not obvious on first read — "one website" is thin evidence, but the persona's confidence makes it feel adequate in the moment.
- The perspective_engagement gap tests a different kind of Scope weakness — it's about who's missing, not what argument was dismissed. Students looking through Scope should be able to name specific missing stakeholders.
- Check that authority deference is distinguishable from group_pressure — the hose persona defers specifically because the other "did the research," not because of general social pressure.

3. Run `create_scenario` with the operator prompt above.

4. Run `create_transcript` to generate the discussion.
   - Manual structural verification if `review_transcript.py` is not available
   - Manual enumeration if `enumerate_transcript.py` is not available

5. Run `analyze_transcript` to produce the expert analysis and facilitation guide.
   - Manual passage segmentation (group turns into 1-3 turn passages). Target 3-4 evaluable passages, of which 2-3 contain targeted facets. The remaining passages provide context or show strong reasoning.

6. Run `design_scaffolding` to produce scaffolding materials and enrich the facilitation guide.

7. Run `configure_session` to produce the session configuration.
   - Author the onboarding content: `topic_summary` (brief context for students) and `reading_instruction`. These are not auto-derived — the operator writes them for this scenario.

8. Validate all artifacts against their schemas (manually if `validate_schema.py` is not available).

9. Document all issues encountered: schema violations, prompt failures, quality problems, manual interventions needed.

**Outputs:**
- `registry/{scenario_id}/scenario.yaml`
- `registry/{scenario_id}/transcript.yaml`
- `registry/{scenario_id}/analysis.yaml`
- `registry/{scenario_id}/facilitation.yaml`
- `registry/{scenario_id}/scaffolding.yaml`
- `registry/{scenario_id}/session.yaml`
- Issue log documenting all manual interventions and problems

**Notes:**
- Start with 2 target facets from the Core tier, not more. This isolates whether the pipeline produces usable artifacts before adding complexity.
- Target facets with high cross-lens visibility to maximize the chance of perspectival diversity in the first run.
- The two test scenarios together cover 4 of 6 Core facets (relevance, sufficiency, perspective_engagement), 5 of 8 cognitive patterns (overgeneralization, confirmation bias, false certainty, egocentric thinking, group_pressure → authority deference), and all 3 social dynamics. This exercises the pipeline broadly enough to catch structural issues before the pilot scenario sequence is authored.
- Document every manual operation — this informs script formalization in Phase 6.
- Per-stage quality checks are handled by the inline reviewer agents (transcript reviewer, analysis reviewer, scaffolding reviewer). The operator gates each stage based on reviewer feedback. Cross-artifact and systemic quality assessment happens in Phase 5A.
- Save all intermediate artifacts (pre-enumeration transcript, pre-enrichment facilitation guide) alongside final outputs. These serve as evidence of the pipeline's processing stages.

---

## Phase 5A: Quality Assessment

**Objective:** Systematically assess the quality of all artifacts from the first end-to-end run. Identify systemic issues in agent prompts that need revision before generating more scenarios.

**Why a separate phase:** Phase 5 runs the pipeline and collects per-stage reviewer feedback inline. Phase 5A steps back to assess quality across the full artifact set — patterns that only emerge when you read all six artifacts together. This is where you catch problems like: the evaluator's observations are accurate but the scaffolding hints give away what the evaluator found, or the facilitation guide's debrief doesn't connect to the diversity the analysis identified.

**Inputs:**
- All artifacts from Phase 5: `registry/{scenario_id}/scenario.yaml`, `transcript.yaml`, `analysis.yaml`, `facilitation.yaml`, `scaffolding.yaml`, `session.yaml`
- All intermediate artifacts from Phase 5
- All reviewer reports from Phase 5 (inline PASS/ISSUE/SUGGESTION outputs)
- Design documents: `polylogue-v5-4.md`, `facet-inventory.md`, `pipeline-spec.md`, `user-stories.md`

**Tasks:**

Run the quality assessment prompt below with a separate agent. The operator analyzes the findings and decides which agent prompts need revision.

**Quality assessment prompt:**

```
You are assessing the quality of the Polylogue 5 pipeline's first generated scenario.
Read all artifacts in registry/{scenario_id}/ and the design documents at
docs/polylogue-v5-4.md, docs/facet-inventory.md, docs/pipeline-spec.md, and
docs/user-stories.md. For each criterion, report PASS, ISSUE (with explanation
and specific quotes), or SUGGESTION (non-blocking).

ARTIFACTS TO READ:
- registry/{scenario_id}/scenario.yaml
- registry/{scenario_id}/transcript.yaml
- registry/{scenario_id}/analysis.yaml
- registry/{scenario_id}/facilitation.yaml
- registry/{scenario_id}/scaffolding.yaml
- registry/{scenario_id}/session.yaml

CRITERIA:

1. TRANSCRIPT NATURALNESS
   a. Does the discussion read like a real conversation between 6th graders?
      Quote any lines that sound like an adult wrote them or that use vocabulary
      above grade level.
   b. Do the personas have distinct voices — different sentence patterns,
      different ways of expressing uncertainty, different levels of formality?
   c. Does the discussion reach a resolution (or meaningfully fail to)?
   d. Is it readable in under 3 minutes? (Under 400 words, 10-14 turns.)

2. FACET SIGNAL QUALITY
   a. For each targeted facet: is the weakness detectable by reading the
      transcript carefully, WITHOUT knowing the framework? Would a thoughtful
      6th grader notice something is off?
   b. Are the signals subtle enough? Quote any lines where the weakness is
      cartoonishly obvious — characters essentially announcing their flaws.
   c. Does the transcript support observation through the intended primary lens
      AND at least one cross-lens? (Check against the scenario plan's
      also_visible_through.)

3. INFORMATION BARRIER INTEGRITY
   a. Does the transcript contain any framework terminology — facet names, lens
      names, cognitive pattern names, social dynamic names?
   b. Does the dialog feel "designed" — are weaknesses placed too precisely,
      too symmetrically, or too conveniently? Natural conversations are messier.
   c. Compare the dialog writer's input (intermediates/dialog_writer_input.yaml)
      with the scenario plan — confirm target_facets was stripped.

4. AI PERSPECTIVE QUALITY
   a. Read ai_perspective_evaluate for each passage. Does it contain ONLY
      per-lens observations? Flag any explanatory vocabulary (cognitive pattern
      names, social dynamic names, "bias", "thinking pattern", etc.).
   b. Read ai_perspective_explain for each passage. Does it introduce vocabulary
      as perspective ("A cognitive scientist might say...") or as verdict
      ("This is confirmation bias")? Quote problematic phrasing.
   c. Is the split clean? Could a student read the evaluate block without being
      primed for the explain block?
   d. Are what_to_notice prompts genuinely thought-provoking, or do they
      telegraph the answer?

5. ANALYSIS ACCURACY
   a. For each facet_annotation: read the cited evidence_sentences in the
      transcript. Does the annotation accurately describe what's happening in
      those sentences?
   b. Are there facet signals in the transcript that the evaluator missed?
      (Read the transcript fresh, then compare to the annotations.)
   c. Are any emergent (non-targeted) facets identified? Are they genuinely
      present or spurious?
   d. Are diversity_potential observations realistic — would students actually
      produce the expected_lens_split described?

6. FACILITATION GUIDE USEFULNESS
   a. Could a teacher scan this guide in 2-3 minutes and know what to watch
      for? Is it organized for quick reference during class?
   b. Do the productive_questions (including enriched ones from the scaffolding
      stage) help a teacher facilitate discussion without giving away answers?
   c. Are watch_for items specific enough to be actionable?
   d. Does the debrief section surface perspectival diversity at the class
      level? Do cross_group_prompts reference cross-lens and cross-group
      differences, not just individual-level observations?
   e. Does connection_to_next reference the scenario's pedagogical position
      without assuming a fixed sequence?

7. SCAFFOLDING CALIBRATION
   a. For each partial_hint: does it direct attention to WHERE to look without
      naming WHAT to see? Quote any hint that gives away the observation.
   b. For each common_misreading: is the pattern plausible (would a real
      6th grader think this)? Is the redirect calibrated — does it redirect
      attention without naming the correct observation?
   c. Are observation_rubric entries at three genuinely distinct levels
      (basic/developing/differentiated)? Or are they just the same observation
      with increasing detail?
   d. Are explanation_rubric entries at three distinct levels? Does the
      differentiated level model cognitive-social interaction?
   e. Do bridge_prompts connect a specific Evaluate observation to the
      perspective-taking task, or are they generic?
   f. Do lens_entry_prompts add value beyond the generic lens question?

8. CROSS-ARTIFACT COHERENCE
   a. Do sentence IDs in analysis.yaml, facilitation.yaml, and scaffolding.yaml
      all reference valid IDs from transcript.yaml?
   b. Do the scaffolding hints align with (but not duplicate) the evaluator's
      observations? A hint should point toward what the evaluator found, not
      restate it.
   c. Does the facilitation guide's likely_disagreements align with the
      diversity_potential in the analysis? They should tell a consistent story.
   d. Does session.yaml correctly assemble from the other artifacts?

9. PEDAGOGICAL VIABILITY
   a. Imagine a 6th grader working through this scenario. At each step
      (read discussion → evaluate passages → peer exchange → AI perspective →
      explain reasoning → peer exchange → AI perspective): does the experience
      make sense? Are there dead ends where a student would get stuck with no
      scaffold available?
   b. Is there enough perspectival diversity built into the passages that
      students assigned different lenses will genuinely see different things?
   c. Would the AI perspectives help a student deepen their thinking, or
      would they feel like being told the answer?

Report each criterion as PASS or ISSUE. For ISSUEs, quote specific text from the
artifacts and explain what's wrong and what a revision should accomplish.
End with a SYSTEMIC ISSUES section: patterns that indicate agent prompt revisions
are needed (not one-off artifact fixes). Prioritize these by impact.
```

**Outputs:**
- Quality assessment report
- Prioritized list of agent prompt revisions needed (if any)
- Updated agent prompts (if revisions are warranted before Phase 6)

**Notes:**
- This phase may loop: if systemic issues are found in agent prompts, revise the prompts (Phase 3 artifacts), then re-run the affected pipeline stages (Phase 5 steps) and re-assess. Keep the loop tight — fix the highest-impact issue first, re-run, reassess.
- The inline reviewers (Phase 5) catch per-stage issues in real time. Phase 5A catches cross-artifact and systemic issues. Both are necessary — the reviewers prevent obvious problems from propagating, while 5A catches emergent problems that only appear when artifacts interact.
- If two test scenarios were run in Phase 5, assess both. Compare whether the same systemic issues appear in both — issues that appear in both scenarios indicate prompt-level problems; issues in only one may be scenario-specific.
- Save the quality assessment report alongside the scenario artifacts for future reference.

---

## Phase 6: Python Scripts

**Objective:** Formalize deterministic scripts, informed by the manual operations in Phases 5 and 5A.

**Inputs:**
- `pipeline-spec.md` — script inventory (Section 9)
- Schemas from Phase 2
- Issue log from Phases 5 and 5A

**Tasks:**

| # | Script | Location | What it does |
|---|---|---|---|
| 1 | `validate_schema.py` | `configs/shared/scripts/` | Validates any YAML artifact against its schema. Two modes: strict (halt) and warn (log, continue) |
| 2 | `review_transcript.py` | `configs/transcript/scripts/` | Structural checks: turn count 10-14, 1-3 sentences per turn, under 400 words, speaker names match plan, turn order follows outline, all turns present |
| 3 | `enumerate_transcript.py` | `configs/transcript/scripts/` | Assigns sequential IDs (turn_01, turn_01.s01, ...) to pre-enumeration transcript |
| 4 | `strip_scenario.py` | `configs/transcript/scripts/` | Reads scenario.yaml, removes `target_facets` key, writes dialog_writer_input.yaml. The information barrier's enforcement mechanism. |
| 5 | `sync_configs.py` | `configs/system/scripts/` | Copies commands from `configs/*/commands/` to `.claude/commands/`, agents from `configs/*/agents/` to `.claude/agents/`, verifies reference data |

**Outputs:**
- 5 Python scripts with unit tests.

**Notes:**
- Pure Python with PyYAML as the only external dependency.
- Scripts accept file paths as arguments — no hardcoded paths.
- `validate_schema.py` is the most complex: it must parse descriptive YAML schemas and check types, required fields, and constraints.
- Each script validates its own output against the relevant schema before writing.
- `segment_passages.py` is deferred — passage segmentation remains manual or heuristic for the pilot. If the first scenario reveals that segmentation quality matters enough to automate, add it as a post-Phase 6 task.
- Unit tests use the intermediate artifacts from Phase 5 as test fixtures.

---

## Summary

| Phase | What | Depends on | Key risk mitigated |
|---|---|---|---|
| 1 | Foundation — directory tree, reference data | — | Canonical ID establishment |
| 2 | Schemas | Phase 1 | Handoff contract definitions |
| 3 | Agent prompts (6 production + 3 reviewers) | Phase 2 | Dialog writer steering, information barrier, AI perspective split, scaffolding calibration, output quality verification |
| 4 | Slash commands (with reviewer steps) | Phase 3 | Pipeline orchestration, barrier enforcement, per-stage quality gates |
| **REVIEW** | **Full pipeline review** | **Phase 4** | **ID mismatches, barrier leaks, schema gaps, AI perspective split, cross-reference integrity** |
| 5 | First end-to-end scenario (with inline reviews) | Review | Architectural validation against real output |
| 5A | Quality assessment | Phase 5 | Cross-artifact coherence, systemic prompt issues, pedagogical viability |
| 6 | Python scripts | Phase 5A | Script formalization from manual experience |

**After Phase 6:** The pipeline is complete. Scenario generation is an operator activity — the operator runs the five slash commands in sequence for each new discussion topic. Each command includes an inline reviewer step; the operator gates progression based on reviewer feedback. Scenarios for the UMS pilot should be generated following a scenario sequence guide (to be written separately, similar to v4's `scenario-sequence.md`).

**App implementation** follows the pipeline. The first step is spec alignment — reconcile the app design with any changes from pipeline implementation. See `user-stories.md` for the full student and teacher experience the app must support, and `pipeline-spec.md` Section 7 for the pipeline-app contract.
