# Lens App: Instructional Design and Artifact Generation

This document specifies the instructional design and artifact generation pipeline for the **Lens** application — the first application built on the [Perspectival Framework for Teaching Critical Thinking](../../../framework/docs/conceptual-framework.md).

In Lens, students read AI-generated group discussions and evaluate highlighted passages through the framework's three lenses. The core activity is individual articulation followed by group discussion — a reflective, writing-centered experience designed for depth.

---

# Instructional Design

## What Students Work With

An AI pipeline generates scripted multi-character discussions on age-appropriate topics (e.g., a class debating a field trip). The discussions contain predominantly weak reasoning with genuine moments of sound reasoning — sound reasoning provides contrast, motivation, and calibration; weak reasoning is easier to perceive when it sits next to strong reasoning.

Students read the full discussion, then work through highlighted passages where something interesting is happening in the reasoning. Passages are ordered from most accessible to most subtle.

## What Students Do

For each passage, students choose one or more lenses (Evidence, Logic, Scope), rate the passage as strong or weak on each chosen lens, and articulate why. There is no separation between evaluation and explanation — students respond to an open prompt that invites both.

## Per-Passage State Machine

Each passage progresses through four states. This is not a linear sequence — it is a state machine with multiple valid transitions.

**Diagnose.** Each student chooses one or more lenses, rates the passage as strong or weak on each chosen lens, and writes their diagnosis. They cannot see peers' diagnoses until they submit their own. Students work on passages asynchronously — a fast student might be diagnosing Passage 3 while another is still on Passage 1. Group discussion for a passage opens when all members have diagnosed it.

**Discuss.** All diagnoses become visible. The app highlights divergence. Discussion happens face-to-face at the table. From here, the group can submit an assessment or spend a lifeline to see a scaffold.

**Reviewing AI.** The AI perspective is visible — either accessed via lifeline (before assessment) or unlocked free (after assessment). The group discusses it and may return to discussion or submit/revise their assessment.

**Submit Assessment.** The group records their assessment — their collaborative, considered reading of the passage. The assessment is always revisable; there is no finality.

Valid transitions:

- **Diagnose → Discuss:** Gated. All group members must have diagnosed this passage.
- **Discuss → Submit Assessment:** Free. Group submits their assessment.
- **Discuss → Reviewing AI:** Costs a lifeline. Group chooses to see the AI before committing.
- **Submit Assessment → Reviewing AI:** Free. AI unlocks automatically after submission.
- **Reviewing AI → Discuss:** Free. AI perspective sends group back to discussion.
- **Reviewing AI → Submit Assessment:** Free. Group submits or revises after seeing AI.
- **Submit Assessment → Discuss:** Free. Group reopens discussion to revise.

## Chat-Style Interaction

Individual diagnoses and group assessments are messages in a thread, not form submissions. Students don't edit previous messages — they append new ones. If a student wants to update their thinking, they write a new message. This mirrors the texting interaction natural to this age group.

A passage thread captures the full progression: individual diagnoses, group discussion, assessments, reactions to scaffolds, reactions to the AI perspective. The thread is the record — revision history is simply the thread itself.

## Scaffolding

### Unified Scaffold Sequence

For each passage, the pipeline produces a graduated scaffold sequence: one or more hints followed by the AI perspective as the final entry. Minimum two entries per passage (one hint + AI perspective). Each hint is progressively more revealing and supportive, but even the last hint does not give away the answer.

### Lifeline Mechanics

Each hint costs one lifeline from a shared pool. Hints are sequential. The AI perspective is always free after the group submits an assessment. Groups can skip remaining hints at any time by submitting.

### Automatic Mechanisms

Three built-in mechanisms fire without student action and cost no lifelines:
- *Misreading redirects* catch common misunderstandings after a diagnosis and gently reorient attention
- *Deepening probes* push students to go further after submitting a diagnosis
- *Difficulty ordering* sequences passages from most accessible to most challenging

## The Progressive Loop

The AI perspective is revealed per passage, not in a batch. Each reveal calibrates how students approach the next passage. A group that sees the AI notice a scope problem they missed on Passage 1 is primed to look more carefully through the Scope lens on Passage 2. The group can also revisit and revise previous assessments at any time.

## Teacher Debrief

After all groups have submitted assessments, the teacher leads a whole-class discussion. The teacher's role during the session is minimal — observing, not intervening. At the end, the teacher synthesizes across groups, surfaces patterns, introduces formal vocabulary where it adds precision, and records an assessment note in the app.

## Assessment

Learning is tracked across five dimensions, none of which require LLM access at runtime:

- **Articulation quality** — Does the student's diagnosis match any of the facets present in the passage? The app compares free-text responses against pre-computed observation rubric entries at three levels (basic, developing, differentiated) using approximate matching.
- **Perspectival range** — Does the student diagnose through multiple lenses across sessions? Tracked from stored lens tags.
- **Explanatory depth** — Does the student's response reference both cognitive and social forces? Does it connect them? Compared against pre-computed explanation rubric entries organized by type (cognitive-only, social-only, interaction) and level.
- **Scaffolding independence** — Is the student relying less on hints over time? Tracked from scaffold consumption data.
- **Engagement** — Message count, participation in group threads, responses to AI perspective.

The observation and explanation rubrics are the key enablers for app-side assessment. The three differentiation levels let the app track whether a student's responses are becoming more specific over time — the definition of evaluative differentiation and explanatory reasoning. This matching remains approximate — student responses are free text, not structured data. A student who writes something valid that neither the evaluator nor the instructional designer anticipated should be recognized, not penalized. The rubric entries are a matching vocabulary, not a grading rubric.

---

# Artifact Generation

## The Architectural Principle

The Lens app does not invoke an LLM at runtime. All intelligence the app needs — hints, AI perspectives, rubric entries, misreading redirects, facilitation prompts — must be pre-computed by the pipeline and baked into artifacts. The pipeline has LLM access; the app renders, matches, and sequences, but does not generate.

This constraint is deliberate. It makes sessions deterministic — every student in a class encounters the same scaffolding. It keeps runtime costs zero. It ensures every piece of content students encounter has been reviewed by the pipeline's quality checks and, optionally, by the teacher before the session.

The consequence: the pipeline must anticipate what the app will need. Every scaffolding move, every assessment comparison, every teacher prompt must be produced at pipeline time. The artifacts are the complete contract between the pipeline and the app.

## What the Pipeline Produces

The pipeline produces six artifacts per scenario. Each is a YAML file stored in `registry/{scenario_id}/`.

| Artifact | File | Consumer | Purpose |
|---|---|---|---|
| Scenario plan | `scenario.yaml` | Pipeline only | Blueprint — topic, personas, targeted facets, discussion arc |
| Discussion transcript | `transcript.yaml` | App (student-facing) | The scripted group discussion students evaluate |
| Expert analysis | `analysis.yaml` | App (AI perspective) + teacher | Per-passage facet annotations, AI perspective, diversity metadata |
| Facilitation guide | `facilitation.yaml` | Teacher | What's structurally present, what students will likely see/miss, debrief materials |
| Scaffolding materials | `scaffolding.yaml` | App (runtime) | Hints, deepening probes, misreading redirects, rubrics, AI reflection prompts |
| Session configuration | `session.yaml` | App (setup) | Which passages, lens definitions, passage ordering, file references |

### Why These Six

Each artifact exists because a specific consumer needs it at a specific moment. The mapping to the per-passage state machine:

**Diagnose** requires the transcript (what students read), the session configuration (which passages, lens definitions, suggested order), and the scaffolding materials (deepening probes after submission, misreading redirects after submission).

**Discuss** requires no pipeline artifact for students — peer exchange uses live student responses. The teacher uses the facilitation guide's discussion prompts and observation predictions. The transcript must be rich enough to produce diverse readings, which is a generation concern (scenario plan + dialog writing).

**Reviewing AI** requires the AI perspective from the expert analysis and the scaffold sequence from the scaffolding materials — the graduated hints leading to the AI perspective, plus the reflection prompt shown after the AI perspective is revealed.

**Submit Assessment** requires the scaffolding materials' observation and explanation rubrics for approximate matching — tracking articulation quality and explanatory depth without LLM access.

**Teacher Debrief** requires the facilitation guide's whole-class debrief materials — key takeaways, cross-group discussion prompts, connection to future sessions.

**Assessment (background)** requires the expert analysis (facet annotations as ground truth, diversity metadata for expected observations) and the scaffolding materials (rubrics at three differentiation levels).

The scenario plan is consumed only by the pipeline itself — it governs generation but is not rendered by the app.

### What Each Artifact Contains

**Scenario plan.** The blueprint for a single discussion: topic, PBL context, instructional goals, 2–3 personas with perspectives and weaknesses, targeted facets with designed explanatory variables and carrier personas, discussion arc, and turn outline. The `weaknesses` and `accomplishes` fields use natural language — no framework terminology — because this plan crosses the information barrier to reach the dialog writer.

**Discussion transcript.** The scripted discussion, fully enumerated. Every turn has an ID; every sentence within a turn has an ID. These sentence IDs are the indexing foundation — every other artifact that references a moment in the discussion uses them. 10–14 turns, 1–3 sentences per turn, under 400 words total. Natural 6th-grade language with distinct persona voices.

**Expert analysis.** Three layers per passage: (1) hidden-layer facet annotations — which facets are present, at what quality level, through which lenses, with what explanatory variables, whether each was a design target or emergent; (2) the AI perspective — a unified block combining per-lens observations with an integrated explanation of why the characters may have reasoned this way, written as perspective not verdict; (3) diversity metadata — which lenses are likely to produce different readings, what students are likely to see and miss. The AI perspective is the final entry in the scaffold sequence. The facet annotations and diversity metadata are never shown to students.

**Facilitation guide.** The teacher's companion, organized by passage and by state (Diagnose, Discuss, AI perspective). For each passage: what's structurally present (using facet language), what to do if students are stuck, likely disagreements and productive questions for discussion, what the AI will say and likely student reactions. Includes a whole-class debrief section: key takeaways, cross-group discussion prompts, and connection to future sessions. Self-contained — the teacher should not need to cross-reference other files during a live session.

**Scaffolding materials.** Everything the app needs to scaffold student engagement at runtime: (1) a unified scaffold sequence per passage — graduated hints followed by the AI perspective as the final entry; (2) difficulty signals (accessible / moderate / challenging) for passage ordering; (3) deepening probes — lens-specific prompts shown after diagnosis submission; (4) common misreadings with redirects — predictable misinterpretations matched by pattern, not LLM; (5) AI reflection prompt — shown after AI perspective is revealed; (6) observation rubric — what a student might say at basic, developing, and differentiated levels per lens per passage; (7) explanation rubric — what a student might say when explaining, organized by type (cognitive, social, interaction) and level. All text in student-friendly language.

**Session configuration.** Tells the app how to set up the session: which passages are evaluable, their suggested order (based on difficulty from scaffolding), lens definitions as shown to students, onboarding content (topic summary, reading instruction), and file references to transcript, analysis, and scaffolding.

## The Information Barrier

The information barrier prevents the dialog writer from producing discussion that feels designed rather than natural. It operates through two mechanisms:

1. **Schema stripping.** The `create_transcript` command strips `target_facets` and `discussion_dynamic` from the scenario plan before passing it to the dialog writer. The dialog writer sees personas (with `weaknesses` phrased as character traits), the discussion arc, and the turn outline with `accomplishes` fields — character and story, not framework targets.

2. **Language discipline.** The `weaknesses` and `accomplishes` fields in the scenario plan are written in natural language by the planning agent. "Only researched one source, tends to generalize from limited data" — not "will produce weak source diversity and sufficiency." The planning agent prompt enforces this translation.

The transcript instructional designer, evaluator, and scaffolding instructional designer all operate *outside* the barrier — they need to see the full plan to do their jobs (sharpening signals, annotating facets, producing scaffolding). The barrier exists only for the dialog writer.

## Pipeline Stages

The pipeline runs as a sequence of operator-invoked commands. Each command orchestrates one or more agents and produces one or more artifacts.

```
create_scenario ——→ create_transcript ——→ analyze_transcript ——→ design_scaffolding ——→ configure_session
     ↓                     ↓                      ↓                     ↓                     ↓
scenario.yaml        transcript.yaml         analysis.yaml        scaffolding.yaml       session.yaml
                                             facilitation.yaml ←── (enriched)
```

**Stage 1: Create Scenario.** The operator specifies the topic, instructional goals, and which facets to target. A planning agent drafts the scenario plan — personas, discussion arc, turn outline. A validation agent reviews the plan: Are the targeted facets detectable? Do they have sufficient cross-lens visibility? Are personas in genuine tension? Is the language barrier-safe? The operator reviews and approves.

**Stage 2: Create Transcript.** The dialog writer receives the scenario plan with `target_facets` stripped (information barrier) and writes the discussion as natural prose. A structural check validates turn count, speaker names, and turn order. A transcript instructional designer — who sees the full plan — sharpens expression: ensures signal moments are visible but natural, enforces 6th-grade language. An enumeration script assigns sequential IDs to turns and sentences.

**Stage 3: Analyze Transcript.** The operator segments the transcript into evaluable passages (groups of 1–3 consecutive turns). An evaluator agent reads the full transcript and scenario plan and produces the expert analysis (facet annotations, AI perspective, diversity metadata) and the facilitation guide (organized by passage and state, with whole-class debrief materials).

**Stage 4: Design Scaffolding.** A scaffolding instructional designer agent receives all prior artifacts and produces the scaffolding materials: scaffold sequence, difficulty signals, deepening probes, common misreadings, rubrics, and AI reflection prompts. This agent also enriches the facilitation guide's discussion prompts with passage-specific questions.

**Stage 5: Configure Session.** A configuration step (script or operator) assembles the session configuration from the transcript, analysis, and scaffolding — listing passages, marking evaluability, setting suggested order, and including lens definitions.

The pipeline uses six agents across five stages. Detailed agent specifications, YAML schemas, and scripts are in the pipeline spec.

---

## Appendix: Revision History

**v5-6 (current):** Major revision from v5-5 — restructured instructional design and added artifact generation:

| Change | Before (v5-5) | After (v5-6) | Rationale |
|---|---|---|---|
| Document structure | Framework + instructional design | Three parts: Framework, Instructional Design, Artifact Generation | Pipeline artifacts are tightly coupled to the instructional design; one document makes traceability explicit |
| Phase structure | Two sequential phases (Evaluate then Explain) | One integrated flow — no phase separation | Evaluation and explanation are intertwined dimensions, not sequential operations. Reduces time pressure in 50-minute sessions. |
| Session flow | Three-beat cycle (Individual → Share → Group Diagnosis) + batch expert reveal | Per-passage state machine (Diagnose → Discuss → Reviewing AI → Submit Assessment) | Non-linear transitions give groups flexibility. AI revealed per passage, not in batch. |
| Expert framing | "Dr. Chen" / fictional human expert | AI voice as fallible reference + teacher as human authority | AI is one more perspective, not the answer. Teacher synthesizes at class level. |
| Perspective sources | Three (Individual, Peer, Expert) | Four (Individual, Peer, AI voice, Teacher) | Teacher's whole-class debrief is where authority and cross-group synthesis live. |
| Scaffolding | Separate hints + separate AI perspective | Unified scaffold sequence (graduated hints → AI perspective as final entry) | Hints and AI perspective are one graduated sequence. Lifelines unlock hints; AI is free after assessment. |
| Interaction model | Form submissions (diagnose, then overwrite) | Chat-style threads (append-only messages) | Captures deliberation traces, multiplies articulation, matches 6th-grader interaction patterns. |
| Nomenclature | "Group diagnosis" | Individual = diagnosis, group = assessment (revisable) | Assessment connotes collaboration; revisability reflects that learning is continual. |
| Learning modes | Articulation only | Articulation (written) + brainstorming (verbal) | Both are essential; each does different cognitive work. |
| Passage design | Deficit-focused | Mixed-valence (predominantly weak + genuine sound reasoning) | Sound reasoning provides contrast and calibration; matches the premise that critical thinking is not just flaw detection. |

**v5-5:** Two inventory merges from v5-4:

| Change | Before | After | Rationale |
|---|---|---|---|
| Facet merge | `perspective_breadth` + `counter_argument_engagement` (11 facets) | `perspective_engagement` (10 facets) | Both capture whether other viewpoints are considered; operationally inseparable |
| Social dynamic merge | `conformity` + `groupthink` (4 dynamics) | `group_pressure` (3 dynamics) | Both describe the group suppressing dissent; nearly identical observable behavior |

**v5-4:** Initial framework with 11 facets and 4 social dynamics. Archived at `docs/archived/polylogue-v5-4.md`.
