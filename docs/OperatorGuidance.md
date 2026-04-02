# Operator Guidance

This document guides you through operating the Polylogue 5 pipeline — from writing the operator prompt through generating all 6 artifacts for a scenario.

## Prerequisites

- Python 3 with PyYAML installed
- Claude Code CLI
- Run `/initialize_polylogue` (or `python3 configs/system/scripts/sync_configs.py`) to sync commands and agents to `.claude/`

## Pipeline Overview

Each scenario produces 6 artifacts through 5 stages. You run each stage as a slash command and review at each gate.

```
/create_scenario → /create_transcript → /analyze_transcript → /design_scaffolding → /configure_session
```

| Stage | Command | What it produces | Your role |
|---|---|---|---|
| 1 | `/create_scenario` | `scenario.yaml` | Write the operator prompt, review the plan |
| 2 | `/create_transcript` | `transcript.yaml` | Review transcript quality at each gate |
| 3 | `/analyze_transcript` | `analysis.yaml` + `facilitation.yaml` | Approve passage segmentation, review analysis |
| 4 | `/design_scaffolding` | `scaffolding.yaml` + enriched `facilitation.yaml` | Review scaffolding calibration |
| 5 | `/configure_session` | `session.yaml` | Author onboarding content, review assembly |

All artifacts are saved to `registry/{scenario_id}/`. Intermediate artifacts are saved to `registry/{scenario_id}/intermediates/`.

## Stage 1: Create Scenario (`/create_scenario`)

This is where you invest the most design effort. The quality of everything downstream depends on the operator prompt.

### What you provide: 6 named fields

#### 1. Topic

The discussion topic in plain language — what the group of students is deciding.

> **Example:** Whether to focus the group's environmental project on ocean pollution or deforestation

#### 2. Context

The PBL connection: what unit, what driving question, what situation this group faces. Include enough detail for the planning agent to create realistic personas.

> **Example:** A 6th-grade STEM class is working on the PBL driving question: "What are the major threats affecting our global environment, and what can our communities do to protect our ecosystems?" This group needs to choose one environmental issue for their semester project. They're debating between ocean pollution (one member saw a documentary about plastic in the Pacific) and deforestation (another member read about Amazon fires). They can only pick one.

#### 3. Instructional Goals

What you want students to practice noticing. Write at least two. Describe observable reasoning patterns, not framework terminology.

> **Example:**
> - Practice noticing when someone's evidence doesn't actually support the specific claim they're making
> - Practice noticing when the group only considers one side of a question

#### 4. Target Complexity

Number of personas (2-3) and number of target facets. Start with 2 personas and 2 target facets for most scenarios.

> **Example:** 2 personas, 2 target facets

#### 5. Target Facets

For each target facet, specify:

| Sub-field | What it is |
|---|---|
| **Facet ID** | From the facet inventory (e.g., `relevance`, `sufficiency`) |
| **Primary lens** | Which lens most reveals this facet (Evidence, Logic, or Scope) |
| **Signal mechanism** | The concrete narrative of how the weakness manifests in the conversation |
| **Cognitive pattern** | From the explanatory variables (e.g., `overgeneralization`) |
| **Social dynamic** | From the explanatory variables (e.g., `conformity`) |
| **Carrier persona** | Which persona primarily manifests this weakness |

The **signal mechanism** is the most important sub-field. It's the concrete, specific description of what goes wrong and how — not a restatement of the facet definition, but the particular way this facet plays out in this specific discussion.

> **Good signal mechanism:** "One persona uses evidence about ocean pollution in general to argue their local project should focus on it, but the evidence is about a different scale and context than what their project could address."
>
> **Too vague:** "The evidence isn't relevant to the claim."

#### 6. Discussion Dynamic

Describe how the interpersonal interaction should unfold:

- **Starting positions** — Who wants what? Where does each persona begin?
- **Shift mechanism** — What causes the dynamic to change? Who concedes and why?
- **Ending condition** — How does the discussion resolve?
- **Interaction quality** — What should the conversation *feel like*?

> **Example:** The personas must genuinely disagree — they want different projects, not just different angles on the same project. One is passionate about ocean pollution because of a documentary; the other thinks deforestation is more practical. The shift happens when the practical persona starts backing down in the face of the other's enthusiasm. The discussion ends when they pick ocean pollution, with concerns unresolved.

### What happens after you provide the prompt

1. **Step 0** — The command checks your prompt has all 6 fields. If anything is missing, you'll be asked to complete it.
2. **Your prompt is saved** to `registry/{scenario_id}/operator-prompt.md` as the originating artifact.
3. **Planning agent** drafts `scenario.yaml` — copies `signal_mechanism` and `discussion_dynamic` verbatim, translates them into barrier-safe `weaknesses`, `accomplishes`, `discussion_arc`, and `turn_outline`.
4. **Validation agent** reviews the plan against 6 criteria (facet detectability, cross-lens visibility, persona tension, barrier compliance, anti-patterns, signal mechanism fidelity).
5. **Operator gate** — You review the validation results and decide: approve, revise, or reject.
6. **Quality checklist** — Final verification before saving.

### How your input flows through the pipeline

Two fields are **copied verbatim** into the scenario plan. Two others are **translated** by the planning agent. Both versions are preserved.

| You write | Planning agent does | Where it lives in scenario.yaml |
|---|---|---|
| Signal mechanism | Copies verbatim | `target_facets[].signal_mechanism` |
| Signal mechanism | Translates to natural language | `personas[].weaknesses` |
| Discussion dynamic | Copies verbatim | `discussion_dynamic` |
| Discussion dynamic | Translates to narrative + turns | `discussion_arc` + `turn_outline` |

The verbatim copies preserve your original intent for downstream agents. The translations are what the dialog writer sees — the dialog writer operates behind the information barrier and never sees `signal_mechanism`, `discussion_dynamic`, or `target_facets`.

---

## Stage 2: Create Transcript (`/create_transcript`)

### What you provide

The approved `scenario.yaml` from Stage 1.

### What happens

1. **Information barrier enforced** — `strip_scenario.py` removes `target_facets` and `discussion_dynamic` to produce `dialog_writer_input.yaml`.
2. **Dialog writer** generates a discussion transcript from the stripped input only.
3. **Structural review** — script checks turn count (10-14), sentences per turn (1-3), word count (<400), speaker names, turn order.
4. **Transcript instructional designer** polishes the transcript for signal clarity (sees the full plan including targets).
5. **Transcript reviewer** assesses quality: naturalness, distinct voices, genuine disagreement, discussion arc, facet signal quality, barrier integrity, structural compliance.
6. **Operator gate** — You review the reviewer's report and decide: accept, revise (send back to transcript ID), or regenerate (max 3 attempts).
7. **Enumeration** — Sequential IDs assigned (turn_01, turn_01.s01, ...).

### What to watch for

- Does the transcript sound like real 6th graders? Quote any lines that sound adult.
- Are the designed weaknesses detectable without knowing the framework? Subtle enough?
- Does the discussion reach a resolution?
- Is there genuine pushback before any concession?

---

## Stage 3: Analyze Transcript (`/analyze_transcript`)

### What you provide

The enumerated `transcript.yaml` and the full `scenario.yaml`.

### What happens

1. **Passage segmentation** — You approve how turns are grouped into 3-5 passages (1-3 turns each). Target 2-3 evaluable passages containing targeted facets.
2. **Evaluator** produces `analysis.yaml` (facet annotations, AI perspectives for evaluate and explain phases, diversity metadata) and `facilitation.yaml` (teacher-facing guide with per-passage scaffolding and whole-class debrief).
3. **Analysis reviewer** checks: facet annotation accuracy, AI perspective split cleanliness, diversity metadata realism, facilitation guide quality, debrief completeness, cross-reference integrity.
4. **Operator gate** — You review and decide: accept or revise.

### What to watch for

- AI perspective evaluate block: does it contain ONLY per-lens observations? No explanatory vocabulary.
- AI perspective explain block: does it introduce vocabulary as perspective ("A cognitive scientist might say..."), not verdict ("This is confirmation bias")?
- Facilitation guide: could a teacher scan it in 2-3 minutes?
- Debrief: do cross-group prompts surface perspectival diversity across lenses?

---

## Stage 4: Design Scaffolding (`/design_scaffolding`)

### What you provide

The `analysis.yaml`, `facilitation.yaml`, `transcript.yaml`, and `scenario.yaml`.

### What happens

1. **Pre-enrichment backup** — The current `facilitation.yaml` is copied to intermediates.
2. **Scaffolding instructional designer** produces `scaffolding.yaml` (hints, rubrics, misreadings, bridge prompts, reflection prompts per evaluable passage) and enriches `facilitation.yaml` with passage-specific discussion starter questions.
3. **Scaffolding reviewer** checks: partial hint calibration (where to look, not what to see), misreading plausibility, rubric differentiation, bridge prompt specificity, language appropriateness (6th-grade, no framework terms), facilitation enrichment integrity, cross-artifact coherence.
4. **Operator gate** — You review and decide: accept or revise.

### What to watch for

- Partial hints: do they direct attention to a *region* without naming the observation?
- Common misreadings: are patterns plausible for a real 6th grader? Are redirects gentle?
- Observation rubric: are the 3 levels genuinely distinct, not just more words?
- Explanation rubric: cognitive and social have basic+developing; interaction has developing+differentiated. No extra levels.
- All text in `scaffolding.yaml` must be student-friendly — no framework terminology.

---

## Stage 5: Configure Session (`/configure_session`)

### What you provide

All preceding artifacts plus two pieces of operator-authored content:

- **`topic_summary`** — Brief context for students (1-2 sentences).
- **`reading_instruction`** — How students should approach the transcript.

### What happens

1. **Assembly** — `session.yaml` is built from transcript, analysis, scaffolding, and reference data.
2. **Passage ordering** — Passages ordered by difficulty (accessible → moderate → challenging).
3. **Operator content** — You provide the onboarding text and set completion thresholds and reference list visibility.
4. **Validation** — Cross-references checked: passage IDs, turn IDs, lens definitions.

### What to watch for

- `topic_summary` should be neutral — don't hint at what's wrong with the discussion.
- Completion thresholds: suggest 2 for evaluate (minimum passages before peer step), 1 for explain.
- Reference lists (`show_cognitive_patterns`, `show_social_dynamics`): suggest `false` for early sessions, `true` for later sessions.

---

## After All 5 Stages

All 6 artifacts are in `registry/{scenario_id}/`:

| File | What it is | Who uses it |
|---|---|---|
| `scenario.yaml` | Scenario plan | Pipeline only |
| `transcript.yaml` | Discussion transcript | Students (via app) |
| `analysis.yaml` | Expert analysis | AI perspectives (via app) |
| `facilitation.yaml` | Facilitation guide | Teacher |
| `scaffolding.yaml` | Scaffolding materials | App (hints, rubrics) |
| `session.yaml` | Session configuration | App (setup) |

Intermediate artifacts in `registry/{scenario_id}/intermediates/` are preserved for debugging.

---

## Complete Example Prompts

These are complete operator prompts with all 6 fields. Use them as templates or as-is to run through the pipeline.

### Example A: Ocean Pollution vs Deforestation

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
  Signal mechanism: The persona cites dramatic facts from a documentary about
  the Great Pacific Garbage Patch — millions of tons of plastic, sea turtles —
  to argue their school group should do an ocean pollution project. The
  documentary evidence is real and compelling but it's about a global-scale
  problem in the Pacific, not about what a school group can do locally. The
  gap is between the evidence's scope (Pacific Ocean) and the project's scope
  (their school). The persona doesn't notice the mismatch because the
  documentary was so dramatic.
  Cognitive pattern: overgeneralization. Social dynamic: conformity (the other
  persona finds the documentary compelling and doesn't push back on the
  relevance gap).
  Carrier persona: the ocean-pollution advocate.

- Counter-argument engagement (Scope lens) — the persona arguing for
  deforestation raises real concerns about feasibility, but the group moves
  past them rather than actually engaging.
  Signal mechanism: When the deforestation persona raises feasibility concerns
  ("we don't live near the ocean," "can we actually do anything about this?"),
  the ocean-pollution persona dismisses them with "we can figure that out
  later" and redirects to how important ocean pollution is. The concern is
  acknowledged just enough to not feel ignored, but never actually addressed.
  The feasibility question — which is the strongest counterargument — gets
  replaced by emotional urgency about the problem's size.
  Cognitive pattern: confirmation bias (the ocean-pollution persona dismisses
  the concern because it threatens their preferred choice). Social dynamic:
  conflict avoidance (the deforestation persona lets it go rather than
  pressing).
  Carrier persona: the ocean-pollution advocate.

Discussion dynamic: The personas must genuinely disagree — they want different
projects, not just different angles on the same project. One is passionate
about ocean pollution because of a documentary; the other thinks deforestation
is more practical because they could plant trees at school. The ocean-pollution
persona is more enthusiastic and emotionally invested; the deforestation
persona is more practical but less assertive. The shift happens when the
practical persona starts backing down in the face of the other's enthusiasm
and confident citing of dramatic facts. The discussion ends when they pick
ocean pollution, with the deforestation persona's concerns unresolved — not
because they were wrong, but because they stopped pressing.
```

### Example B: School Garden Water

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
  in a different climate.
  Signal mechanism: The persona found one website about rainwater harvesting
  in Portland, Oregon, where it rains significantly more than their city.
  The website showed rain barrels collected "plenty of water" for a community
  garden there. The persona extrapolates from this single source to confident
  certainty — "ours would definitely get enough water too" — without checking
  local rainfall, costs, or setup requirements. The other persona asks about
  the climate difference ("doesn't it rain way more in Portland?") but the
  question gets brushed past. The evidence is thin for a confident conclusion,
  but the persona's certainty makes it feel adequate in the moment.
  Cognitive pattern: false certainty (states the conclusion with no
  qualification despite minimal evidence). Social dynamic: authority deference
  (the other persona defers because "you researched it").
  Carrier persona: the rain-barrel advocate.

- Perspective breadth (Scope lens) — neither persona considers the custodial
  staff who would maintain the system, the science teacher who runs the garden
  club, or what happens over summer break.
  Signal mechanism: Both students shift into excited planning mode — where to
  put barrels, how to connect them to the roof drainage, when to start
  building — entirely from their own perspective as students. They plan to
  attach things to school property, use the building's roof drainage, and
  start construction this week, without mentioning custodial staff, the
  science teacher who runs garden club, the principal who set the deadline,
  or summer maintenance. The plan only reflects student enthusiasm. The
  absence of other stakeholders is what students need to notice — it's about
  who's NOT in the conversation, not about what argument was dismissed.
  Cognitive pattern: egocentric thinking (only considered their own
  perspective as students). Social dynamic: groupthink (both were excited
  and neither stepped back to ask "who else should we talk to?").
  Carrier persona: both (but the rain-barrel advocate drives the planning).

Discussion dynamic: The personas should disagree about which option is
better — one wants the simple hose, the other wants the rain barrels. The
rain-barrel persona is more enthusiastic and has done research (one website);
the hose persona is pragmatic but not assertive. The shift happens when the
hose persona concedes because the other "actually looked into it" — deference
to the appearance of research rather than genuine persuasion. Once they agree,
both get caught up in excited planning, building on each other's ideas about
barrel placement and design. The discussion ends with a confident decision
to build rain barrels and start designing this week. Neither student has
mentioned talking to any adult or considered who maintains things over summer.
The weakness in the second half is absence — what's missing from the
conversation, not what's wrong with what's said.
```

---

## Reference Data

When writing target facets, consult:
- Facet inventory: `configs/reference/facet_inventory.yaml` (11 facets with IDs, definitions, quality ranges, cross-lens visibility)
- Explanatory variables: `configs/reference/explanatory_variables.yaml` (8 cognitive patterns + 4 social dynamics with IDs and descriptions)
- Lenses: `configs/reference/lenses.yaml` (3 lenses: logic, evidence, scope)
- Scenario sequence: `docs/scenario-sequence.md` (the pilot scenario plan with all 5 operator prompts)
