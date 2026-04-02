# Post-Implementation Plan

The pipeline is built and validated through one end-to-end scenario. This plan covers what comes next: testing the pipeline at scale, designing a strategically meaningful scenario set for the UMS pilot, and documenting the operator workflow.

**Three goals:**
1. Test the full pipeline with the revised agent prompts
2. Design a scenario sequence that strategically develops students' critical thinking
3. Write an operator guideline (README.md) for running the pipeline manually

Goals 1 and 2 are coupled — the test scenarios should be the pilot scenarios, not throwaway tests. Goal 3 can be written once the workflow is validated.

---

## Goal 1: Pipeline Testing

**What needs testing:**
- The revised dialog writer prompt (sentence count variation) — does it produce transcripts with natural rhythm?
- The revised evaluator prompt (emergent facets, what_to_notice calibration) — does it find untargeted facets and write non-self-answering prompts?
- The scaffolding ID prompt (explicit rubric level structure) — does it produce the correct 2-level pattern per explanation category?
- The full pipeline at scale — do the five commands, six production agents, and three reviewers work end-to-end for multiple scenarios with different facet targets?

**What doesn't need testing:**
- The pipeline architecture — validated in Phase 5
- The schemas — validated by all 9 artifacts passing validate_schema.py
- The scripts — validated against Phase 5 artifacts

**Proposal:** Run the pilot scenarios (Goal 2) as the test. Each scenario exercises the pipeline end-to-end and validates the prompt revisions. If a scenario reveals issues, fix the prompts before generating the next one. This avoids generating throwaway test scenarios that don't serve the pilot.

---

## Goal 2: Scenario Sequence Design

This is the goal that requires the most design input. The question: **what set of scripted discussions, in what order, will most effectively develop 6th graders' critical thinking over the course of the pilot?**

### What We Know

**Facet coverage from the inventory:**

| Tier | Facets | Priority |
|---|---|---|
| Core (6) | source_credibility, relevance, sufficiency, inferential_validity, perspective_breadth, counter_argument_engagement | First — students need these |
| Extend (4) | source_diversity, reasoning_completeness, consequence_consideration, condition_sensitivity | After Core is established |
| Reserve (1) | internal_consistency | Only if time permits |

**Existing scenario (Test Scenario A):**
- Facets: relevance, counter_argument_engagement
- Patterns: overgeneralization, confirmation_bias
- Dynamics: conformity, conflict_avoidance
- Personas: 2

**Test Scenario B (designed but not yet generated):**
- Facets: sufficiency, perspective_breadth
- Patterns: false_certainty, egocentric_thinking
- Dynamics: authority_deference, groupthink
- Personas: 2

**Together, A + B cover:** 4 of 6 Core facets, 4 of 8 cognitive patterns, all 4 social dynamics.

**PBL context:** "What are the major threats affecting our global environment, and what can our communities do to protect our ecosystems?" — all scenarios should connect to this driving question. Topics should be concrete decisions a 6th-grade group might actually face.

**Session constraints:** 50-minute class period, 3-4 students per group. Each scenario = one session.

### Design Questions (Operator Input Needed)

These questions shape the scenario sequence. They can't be answered from the design documents alone.

**1. How many sessions in the pilot?**
This determines how many scenarios to generate. More scenarios = more facet coverage but more preparation. Fewer = tighter focus but possible gaps.

- 4 sessions: covers all 6 Core facets (2 per scenario) — tight, no room for error
- 6 sessions: covers Core + introduces 2-3 Extend facets — more breathing room
- 8 sessions: covers Core + most Extend — full curriculum arc

**2. Should complexity increase across the sequence?**
Options:
- **Flat:** every scenario has 2 personas, 2 target facets — simpler to generate, students know what to expect
- **Progressive:** start with 2 personas / 2 facets, move to 3 personas / 2-3 facets — builds difficulty, but later scenarios are harder to generate and assess
- **Mixed:** mostly 2-persona, with one 3-persona scenario near the end as a capstone

**3. Should facets repeat across scenarios?**
Options:
- **No repetition:** each scenario targets new facets — maximizes coverage but gives students only one chance to practice each
- **Spiral:** some facets appear in multiple scenarios at increasing subtlety — students build skill but coverage is narrower
- **Anchor + extend:** one or two "anchor" facets (e.g., relevance, counter_argument_engagement) appear in most scenarios alongside new facets — builds deep skill on anchors while introducing breadth

**4. How should scenarios connect to the PBL timeline?**
Options:
- **Independent:** scenarios are about environmental topics but don't follow the PBL milestones — easier to author, more flexible
- **Aligned:** scenarios mirror what students are doing in the PBL project (e.g., early scenarios about choosing a topic, later scenarios about evaluating solutions) — more authentic but constrains topic selection
- **Bookend:** first and last scenarios connect to PBL milestones, middle scenarios are independent — compromise

**5. What cognitive patterns and social dynamics matter most?**
All 12 explanatory variables can't appear equally in a short pilot. Which are most important for this group of students?
- Are there patterns the teacher already sees in class (e.g., students going along with the loudest voice → authority_deference)?
- Are there patterns tied to the PBL project's specific challenges?

**6. Should the sequence have a pedagogical arc beyond facet coverage?**
For example:
- Early sessions: students learn to evaluate (notice what's there)
- Middle sessions: students learn to explain (understand why it happened)
- Late sessions: students connect evaluation and explanation (see the full picture)

Or is it enough to let the two-phase session structure (Evaluate → Explain) carry this progression inherently?

### Candidate Sequence Structures

Pending answers to the above, here are three structures to consider:

**Structure A: Core Coverage (4 scenarios)**
```
Scenario 1: relevance + counter_argument_engagement (DONE — ocean vs deforestation)
Scenario 2: sufficiency + perspective_breadth (DESIGNED — school garden)
Scenario 3: source_credibility + inferential_validity
Scenario 4: [repeat 2 Core facets at higher subtlety]
```
- Pros: covers all 6 Core facets in 3 scenarios, 4th scenario reinforces
- Cons: no Extend facets, no 3-persona scenarios, tight schedule

**Structure B: Core + Extend (6 scenarios)**
```
Scenario 1: relevance + counter_argument_engagement (accessible)
Scenario 2: sufficiency + perspective_breadth (accessible)
Scenario 3: source_credibility + inferential_validity (moderate)
Scenario 4: relevance + source_diversity (spiral — relevance returns, new Extend facet)
Scenario 5: counter_argument_engagement + consequence_consideration (spiral + Extend)
Scenario 6: 3-persona capstone — multiple facets, higher complexity
```
- Pros: all Core covered, 2 Extend facets introduced, spiral reinforcement, complexity arc
- Cons: 6 sessions is a significant commitment

**Structure C: Anchor + Breadth (5 scenarios)**
```
Scenario 1: relevance + counter_argument_engagement (anchor pair introduced)
Scenario 2: sufficiency + source_credibility
Scenario 3: inferential_validity + perspective_breadth
Scenario 4: relevance + condition_sensitivity (anchor returns + Extend)
Scenario 5: counter_argument_engagement + consequence_consideration (anchor returns + Extend)
```
- Pros: two anchors get deep practice, all Core covered, 2 Extend facets
- Cons: no 3-persona, no spiral on non-anchor facets

### Topic Brainstorming

All topics should be concrete decisions within the PBL environmental context. Candidates:

| Topic | Decision | Natural for which facets? |
|---|---|---|
| Ocean pollution vs deforestation | Choose project focus | relevance, counter_argument_engagement (DONE) |
| School garden water source | Choose hose vs rain barrels | sufficiency, perspective_breadth (DESIGNED) |
| Recycling program redesign | Single-stream vs sorted recycling | source_credibility, inferential_validity |
| Energy audit presentation | What to recommend to the principal | consequence_consideration, condition_sensitivity |
| Fundraiser for conservation | Which organization to support | source_diversity, relevance |
| Climate action poster content | What claims to include on a public poster | sufficiency, source_credibility |
| Field trip proposal | Nature preserve vs waste treatment plant | perspective_breadth, counter_argument_engagement |
| Guest speaker selection | Environmentalist vs local business owner | source_credibility, inferential_validity |

---

## Goal 3: Operator Guideline (README.md)

The operator guideline is a step-by-step manual for running the pipeline. It should be writable once the scenario sequence is decided and the pipeline is validated at scale.

### Planned Structure

```
README.md
├── Overview — what the pipeline does, who it's for
├── Prerequisites — Python 3, PyYAML, Claude Code
├── Setup — run initialize_polylogue
├── Workflow — step-by-step for each scenario
│   ├── Step 1: Create Scenario (/create_scenario)
│   ├── Step 2: Create Transcript (/create_transcript)
│   ├── Step 3: Analyze Transcript (/analyze_transcript)
│   ├── Step 4: Design Scaffolding (/design_scaffolding)
│   ├── Step 5: Configure Session (/configure_session)
│   └── Quality gates at each step
├── Scripts — when and how to use each script
├── Troubleshooting — common issues and fixes
└── Scenario Sequence — the pilot scenario plan (from Goal 2)
```

### What Blocks This

- The workflow section can be drafted now from the existing commands
- The scenario sequence section requires Goal 2 decisions
- Troubleshooting benefits from Goal 1 testing (real issues encountered)

---

## Execution Order

```
Goal 2 decisions (operator input) → Goal 1 testing (generate pilot scenarios) → Goal 3 (write README.md)
```

The bottleneck is Goal 2 — the scenario sequence design questions need answers before generating scenarios. Goal 1 and Goal 2 then execute together (each generated scenario is both a test and a pilot artifact). Goal 3 follows once the workflow is validated.

---

## Next Step

Review the six design questions in Goal 2 and provide input. The scenario sequence can then be finalized and generation can begin.
