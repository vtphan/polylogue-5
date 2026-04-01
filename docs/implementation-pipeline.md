# Pipeline Implementation Plan

## Overview

This plan covers implementation of the Polylogue 5 pipeline: the system that generates AI group discussions with designed reasoning weaknesses for the Perspectives app. It does not cover the app (to be written separately after the pipeline is complete).

**Source documents:**
- `polylogue-v5-4.md` — conceptual framework (lenses, facets, explanatory variables, perspectival learning model)
- `facet-inventory.md` — the eleven facets with quality ranges, cross-lens visibility, explanatory connections
- `pipeline-spec.md` — technical specification (six artifacts, five stages, six agents, schemas)
- `user-stories.md` — how teachers and students interact with pipeline artifacts through the app

**Build order:** Reference data and schemas first — these establish the vocabulary and contracts every subsequent artifact depends on. Then agent prompts and commands. Then the first end-to-end scenario run to validate the architecture. Then scripts to formalize mechanical operations. Then a review to catch integration and quality issues.

**Structure:** Six implementation phases and one review phase. Each phase is scoped to one Claude Code working session. The review catches issues before scenario generation begins.

**How the review works:** The operator runs the review prompt with a separate agent, analyzes the feedback, and forwards relevant findings to the developing agent. The operator controls the gate.

---

## Phase Map

```
Phase 1 → Phase 2 → Phase 3 → Phase 4 → REVIEW → Phase 5 → Phase 6
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
- Facet IDs: `source_credibility`, `source_diversity`, `relevance`, `sufficiency`, `inferential_validity`, `internal_consistency`, `reasoning_completeness`, `perspective_breadth`, `consequence_consideration`, `condition_sensitivity`, `counter_argument_engagement`.
- Cognitive pattern IDs: `confirmation_bias`, `tunnel_vision`, `overgeneralization`, `false_cause`, `uncritical_acceptance`, `black_and_white_thinking`, `egocentric_thinking`, `false_certainty`.
- Social dynamic IDs: `conformity`, `conflict_avoidance`, `authority_deference`, `groupthink`.
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

---

## Phase 3: Agent Prompts

**Objective:** Write the six agent prompt definitions.

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

**Outputs:**
- 6 agent prompt files.

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
| 3 | `create_transcript` | `configs/transcript/commands/create_transcript.md` | Strip `target_facets` → dialog writer → structural review → transcript ID polish → enumeration |
| 4 | `analyze_transcript` | `configs/analysis/commands/analyze_transcript.md` | Segment passages → evaluator produces analysis + facilitation guide |
| 5 | `design_scaffolding` | `configs/scaffolding/commands/design_scaffolding.md` | Scaffolding ID produces scaffolding materials + enriches facilitation guide |
| 6 | `configure_session` | `configs/session/commands/configure_session.md` | Assemble session config from transcript + analysis + scaffolding |

**Outputs:**
- 6 command files.

**Notes:**
- `create_transcript` is the most complex command. It must:
  - Strip `target_facets` from the scenario plan before passing to the dialog writer, using `strip_scenario.py` (or manually: copy `scenario.yaml`, delete the `target_facets` key, save as `dialog_writer_input.yaml`). This is the information barrier's enforcement mechanism.
  - Run structural review after dialog writer output (script or manual)
  - Implement discard-and-regenerate (max 3 attempts, clean retry, no feedback from failed attempt)
  - Pass raw transcript + full plan to the transcript instructional designer
  - Apply enumeration after polish
- `create_scenario` must include:
  - Persona conflict validation (personas must disagree about something substantive)
  - Turn outline anti-pattern checks (no 4+ consecutive turns of unchecked agreement, omission concerns must be at least briefly acknowledged)
  - Quality checklist in the command itself
- `analyze_transcript` handles passage segmentation — initially manual or heuristic, with a note for future automation.
- `design_scaffolding` writes to two outputs: `scaffolding.yaml` (new) and enriches `facilitation.yaml` (existing, from Stage 3). The enrichment mechanism: the scaffolding ID agent reads the existing `facilitation.yaml`, generates passage-specific discussion starter questions for each passage's `productive_questions` fields, and writes the updated `facilitation.yaml` back. The agent must preserve all existing content from Stage 3 and only add to `productive_questions` — it does not modify other fields.
- `configure_session` is largely mechanical — assembles from other artifacts.
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
   The 3 lens IDs, 11 facet IDs, 8 cognitive pattern IDs, and 4 social dynamic IDs
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
   assembles from the correct sources.

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

2. Choose a topic from the 6th-grade PBL unit (e.g., a group discussing whether to focus their project on ocean pollution or deforestation — a topic that naturally produces disagreement).

3. Run `create_scenario` with:
   - The chosen topic and PBL context
   - 1-2 instructional goals
   - 2 personas with genuine disagreement
   - 2 target facets from the Core tier (prioritizing high cross-lens visibility facets: relevance, sufficiency, perspective breadth, or counter-argument engagement)

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
- Document every manual operation — this informs script formalization in Phase 6.
- Quality checks on the first scenario:
  - **Discussion quality:** Does it read like a real conversation between 6th graders? Does it reach a resolution? Is it readable in 3 minutes? (Constraints 7-9 from user stories)
  - **Information barrier:** Does the dialog writer's output show signs of "knowing" the framework? Look for unnaturally precise flaw placement or analytical language in character dialog.
  - **AI perspective quality:** Are the Evaluate observations per-lens and free of explanatory vocabulary? Are the Explain observations introducing vocabulary as perspective, not verdict? Is the split clean?
  - **Scaffolding quality:** Are partial hints incomplete (directing where to look, not what to see)? Are rubric entries at three distinct differentiation levels? Are bridge prompts connecting Evaluate observations to the perspective-taking task? Are common misreadings plausible and are their redirects calibrated (redirecting attention, not naming the answer)?
  - **Facilitation guide quality:** Is it scannable in 2-3 minutes? Does it use facet language? Are the enriched productive_questions specific and useful? Do the debrief key takeaways and cross-group prompts surface perspectival diversity at the class level?
- Save all intermediate artifacts (pre-enumeration transcript, pre-enrichment facilitation guide) alongside final outputs. These serve as evidence of the pipeline's processing stages.

---

## Phase 6: Python Scripts

**Objective:** Formalize deterministic scripts, informed by the manual operations in Phase 5.

**Inputs:**
- `pipeline-spec.md` — script inventory (Section 9)
- Schemas from Phase 2
- Issue log from Phase 5

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
| 3 | Agent prompts | Phase 2 | Dialog writer steering, information barrier, AI perspective split, scaffolding calibration |
| 4 | Slash commands | Phase 3 | Pipeline orchestration, barrier enforcement |
| **REVIEW** | **Full pipeline review** | **Phase 4** | **ID mismatches, barrier leaks, schema gaps, AI perspective split, cross-reference integrity** |
| 5 | First end-to-end scenario | Review | Architectural validation against real output |
| 6 | Python scripts | Phase 5 | Script formalization from manual experience |

**After Phase 6:** The pipeline is complete. Scenario generation is an operator activity — the operator runs the five slash commands in sequence for each new discussion topic. Scenarios for the UMS pilot should be generated following a scenario sequence guide (to be written separately, similar to v4's `scenario-sequence.md`).

**App implementation** follows the pipeline. The first step is spec alignment — reconcile the app design with any changes from pipeline implementation. See `user-stories.md` for the full student and teacher experience the app must support, and `pipeline-spec.md` Section 7 for the pipeline-app contract.
