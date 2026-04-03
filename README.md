# Polylogue 5 — Pipeline Operator Guide

This guide walks you through generating discussion scenarios for the Perspectives app. Each scenario produces 6 YAML artifacts: a scenario plan, a discussion transcript, an expert analysis, a facilitation guide, scaffolding materials, and a session configuration.

The pipeline is operated through Claude Code. You give instructions at each step; Claude executes them using the agent prompts and commands defined in this repository.

## Prerequisites

- Python 3 with PyYAML (`pip install pyyaml`)
- Claude Code CLI

## Quick Reference

```
/initialize_polylogue  →  /create_scenario  →  /create_transcript  →  /analyze_transcript  →  /design_scaffolding  →  /configure_session
```

Each command includes a quality reviewer that reports to you. You gate each step.

---

## Setup

### 1. Initialize the Pipeline

Run in Claude Code:

```
/initialize_polylogue
```

This syncs commands and agent prompts to `.claude/`, verifies reference data, and confirms schemas are in place. You should see:

```
Commands: synced 6 files
Agents: synced 9 files
Reference data: 3 files verified
Schemas: 13 files found
Registry: exists
```

If `initialize_polylogue` is not available as a slash command, run the sync script directly:

```bash
python3 configs/system/scripts/sync_configs.py
```

---

## Workflow: Generating a Scenario

### Step 1: Create Scenario (`/create_scenario`)

You provide an operator prompt describing the discussion you want to generate. The prompt must include:

- **Topic** — the decision the students are discussing
- **Context** — PBL connection and why this topic matters
- **Instructional goals** — what you want students to practice (in plain language)
- **Target complexity** — number of personas (2-3), number of target facets (usually 2)
- **Target facets** — which facets to design as weak, through which lens, with which cognitive pattern and social dynamic

**How to specify target facets:** Look up facets in `configs/reference/facet_inventory.yaml`. Each facet has a primary lens, cross-lens visibility, and explanatory connections. Choose facets whose cross-lens visibility is high — this ensures students with different lenses see different things.

**What happens:**
1. Claude drafts a scenario plan (planning agent)
2. Claude validates the plan against pedagogical criteria (validation agent)
3. You review the validation and approve, revise, or reject

**What to check before approving:**
- Do the `weaknesses` fields read as character traits, not framework language?
- Do the `accomplishes` fields read as story beats, not analytical categories?
- Do the personas genuinely disagree?
- Does the turn outline tell a story with rising tension and resolution?

**Output:** `registry/{scenario_id}/scenario.yaml`

---

### Step 2: Create Transcript (`/create_transcript`)

Tell Claude which scenario to generate:

```
Run /create_transcript for the scenario at registry/{scenario_id}/scenario.yaml
```

**What happens:**
1. The script strips `target_facets` from the plan (information barrier)
2. Claude writes the discussion as natural 6th-grade dialog (dialog writer — sees NO framework terminology)
3. A structural review checks turn count, word count, and speaker names
4. Claude polishes signal clarity (transcript instructional designer — sees the full plan)
5. Claude reviews the transcript quality (transcript reviewer)
6. You review the reviewer's report and approve, request revision, or request regeneration
7. Enumeration assigns turn/sentence IDs

**What to check before approving:**
- Does it sound like real 6th graders talking?
- Are the voices distinct?
- Can you detect the designed weaknesses on a careful read, without knowing the framework?
- Are the weaknesses subtle (not cartoonish)?
- Does the discussion reach a resolution?

If the transcript needs regeneration, Claude will do a clean retry (no feedback from the failed attempt, max 3 tries). If it fails 3 times, the scenario plan is the problem — go back to Step 1.

**Output:** `registry/{scenario_id}/transcript.yaml`

**Intermediates saved:** `dialog_writer_input.yaml`, `transcript_raw.yaml`, `transcript_polished.yaml`

---

### Step 3: Analyze Transcript (`/analyze_transcript`)

```
Run /analyze_transcript for the scenario at registry/{scenario_id}/
```

**Before Claude starts, you need to segment passages.** A passage is 1-3 consecutive turns that form a coherent chunk of the discussion. Read the transcript and tell Claude where to draw the boundaries:

```
Segment the transcript into these passages:
- passage_01: turn_01 through turn_03 (opening positions)
- passage_02: turn_04 through turn_06 (feasibility challenge)
- passage_03: turn_07 through turn_09 (dismissal)
- passage_04: turn_10 through turn_12 (resolution)

passage_01 is context-setting (not evaluable). passages 02-04 are evaluable.
```

**Segmentation guidelines:**
- Place boundaries at topic shifts, new claims, or direction changes
- Target 3-5 passages, of which 2-3 contain targeted facets
- Not every passage needs a weakness — some show strong reasoning or provide context

**What happens:**
1. Claude produces the expert analysis — facet annotations, AI perspectives (evaluate + explain blocks), diversity metadata (evaluator agent)
2. Claude produces the facilitation guide — per-passage teacher scaffolding, debrief materials (evaluator agent)
3. Claude reviews both artifacts for accuracy and quality (analysis reviewer)
4. You review the reviewer's report and approve or request revision

**What to check before approving:**
- Are the AI perspective evaluate blocks free of explanatory vocabulary? (No cognitive pattern names, no "bias," no "group pressure")
- Do the AI perspective explain blocks introduce vocabulary as perspective ("A cognitive scientist might say...") not verdict ("This is confirmation bias")?
- Do the facet annotations match what you can actually see in the transcript?
- Is the facilitation guide scannable and useful?

**Output:** `registry/{scenario_id}/analysis.yaml`, `registry/{scenario_id}/facilitation.yaml`

---

### Step 4: Design Scaffolding (`/design_scaffolding`)

```
Run /design_scaffolding for the scenario at registry/{scenario_id}/
```

**What happens:**
1. Claude produces scaffolding materials — hints, prompts, rubrics, misreadings (scaffolding instructional designer)
2. Claude enriches the facilitation guide's `productive_questions` with passage-specific discussion starters
3. Claude reviews the scaffolding for calibration (scaffolding reviewer)
4. You review the reviewer's report and approve or request revision

**What to check before approving:**
- Do partial hints direct attention to WHERE to look, not WHAT to see?
- Are common misreadings plausible for a real 6th grader?
- Do redirects guide without giving away the answer?
- Are rubric levels genuinely distinct (not the same observation with more words)?
- Is ALL text in student-friendly language (no framework terminology)?

**Output:** `registry/{scenario_id}/scaffolding.yaml`, `registry/{scenario_id}/facilitation.yaml` (enriched)

---

### Step 5: Configure Session (`/configure_session`)

```
Run /configure_session for the scenario at registry/{scenario_id}/
```

**You need to provide:**
- **`topic_summary`** — brief context for students (1-2 sentences, student-friendly)
- **`reading_instruction`** — what to tell students before they read the discussion
- **Completion thresholds** — how many passages students must evaluate/explain before moving to peer step (suggest: evaluate=2, explain=1)
- **Reference list toggles** — whether to show cognitive patterns and social dynamics lists (suggest: hide for early sessions, show for later sessions)

**What happens:** Claude assembles the session configuration from the transcript, analysis, and scaffolding. This is mostly mechanical.

**Output:** `registry/{scenario_id}/session.yaml`

---

### Step 6: Validate All Artifacts

After all 6 artifacts are generated, validate them against their schemas:

```bash
python3 configs/shared/scripts/validate_schema.py registry/{scenario_id}/scenario.yaml configs/scenario/schemas/scenario_plan.yaml
python3 configs/shared/scripts/validate_schema.py registry/{scenario_id}/transcript.yaml configs/transcript/schemas/transcript.yaml
python3 configs/shared/scripts/validate_schema.py registry/{scenario_id}/analysis.yaml configs/analysis/schemas/analysis.yaml
python3 configs/shared/scripts/validate_schema.py registry/{scenario_id}/facilitation.yaml configs/analysis/schemas/facilitation.yaml
python3 configs/shared/scripts/validate_schema.py registry/{scenario_id}/scaffolding.yaml configs/scaffolding/schemas/scaffolding.yaml
python3 configs/shared/scripts/validate_schema.py registry/{scenario_id}/session.yaml configs/session/schemas/session.yaml
```

All 6 should report PASS.

---

## Scripts Reference

| Script | Location | When to use |
|---|---|---|
| `sync_configs.py` | `configs/system/scripts/` | At session start — syncs commands/agents to `.claude/` |
| `strip_scenario.py` | `configs/transcript/scripts/` | During `/create_transcript` — enforces information barrier |
| `review_transcript.py` | `configs/transcript/scripts/` | During `/create_transcript` — structural checks |
| `enumerate_transcript.py` | `configs/transcript/scripts/` | During `/create_transcript` — assigns turn/sentence IDs |
| `validate_schema.py` | `configs/shared/scripts/` | After any artifact is generated — schema validation |

All scripts accept file paths as arguments. Run with `--help` for usage.

---

## Test Case: School Garden Water Usage

Use this test case to verify the pipeline works end-to-end. It targets different facets than the existing ocean-vs-deforestation scenario, exercising a different part of the framework.

### What This Tests

- **Facets:** sufficiency (Evidence lens), perspective_engagement (Scope lens)
- **Cognitive patterns:** false_certainty, egocentric_thinking
- **Social dynamics:** authority_deference, group_pressure
- **Also validates:** revised dialog writer (sentence count variation), revised evaluator (emergent facets, what_to_notice calibration)

### Operator Prompt

Copy this prompt and give it to Claude when running `/create_scenario`:

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
  perspective as students). Social dynamic: groupthink (both were excited
  and neither stepped back to ask "who else should we talk to?").

The personas should disagree about which option is better — one wants the
simple hose, the other wants the rain barrels. The rain-barrel persona is
more enthusiastic and researched; the hose persona is pragmatic but gets
won over by the "research." The discussion ends with a decision.
```

### What to Check at Each Step

**After `/create_scenario`:**
- Do the `weaknesses` fields describe character traits, not framework terms?
- Does the rain-barrel persona's weakness describe confidence from thin research?
- Does the hose persona's weakness describe giving in to someone who "did the research"?
- Does the turn outline avoid announcing weaknesses?

**After `/create_transcript`:**
- Does the transcript have varied sentence counts (1-3 per turn, not uniform)?
- Is the sufficiency gap subtle? The rain-barrel persona should sound confident and researched, not obviously wrong.
- Is the perspective gap visible? The conversation should focus entirely on the students' experience without mentioning staff, teachers, or summer.
- Does the hose persona push back at least once before deferring?

**After `/analyze_transcript`:**

Suggested passage segmentation (adjust based on the actual transcript):
- passage_01: opening positions (context-setting, not evaluable)
- passage_02: the "research" moment — where the rain-barrel persona presents their evidence
- passage_03: the decision moment — where the hose persona defers
- passage_04: planning/resolution — where the missing perspectives are most visible

Check:
- Does the evaluator identify at least one emergent facet (e.g., source_diversity — relying on one website)?
- Are what_to_notice prompts non-self-answering?
- Is the AI perspective split clean?

**After `/design_scaffolding`:**
- Do hints for the sufficiency passage point to the evidence region without naming the problem?
- Do misreadings include "the evidence is good because they researched it" (a very common 6th-grade misreading)?
- Does the explanation rubric use the correct level structure (2 per category, not 3)?

**After `/configure_session`:**
- Do all cross-references resolve?
- Are completion thresholds set?

**After full validation:**
```bash
for f in scenario transcript analysis facilitation scaffolding session; do
  echo "--- $f ---"
  python3 configs/shared/scripts/validate_schema.py \
    registry/school-garden-water/$([ "$f" = "facilitation" ] && echo "$f" || echo "$f").yaml \
    configs/$(case $f in scenario) echo "scenario/schemas/scenario_plan";; transcript) echo "transcript/schemas/transcript";; analysis) echo "analysis/schemas/analysis";; facilitation) echo "analysis/schemas/facilitation";; scaffolding) echo "scaffolding/schemas/scaffolding";; session) echo "session/schemas/session";; esac).yaml
done
```

Or validate each one individually using the commands in the Validate All Artifacts section above, substituting `school-garden-water` for `{scenario_id}`.

---

## Troubleshooting

**Transcript keeps failing structural review:**
The scenario plan is probably the problem. Check that the turn outline has 10-14 turns and that persona weaknesses are concrete enough for the dialog writer to work with.

**Dialog writer produces framework terminology:**
The information barrier may be broken. Check `intermediates/dialog_writer_input.yaml` — it should contain NO `target_facets` field. If it does, re-run `strip_scenario.py`.

**AI perspective evaluate block contains explanatory vocabulary:**
The evaluator prompt needs reinforcement. Words to watch for: "bias," "thinking pattern," "group pressure," cognitive pattern names, social dynamic names. The evaluate block should contain ONLY per-lens observations.

**Scaffolding hints give away the observation:**
The scaffolding ID may need stronger calibration. A hint like "The sources all come from one place" names the observation. It should be "Something about the sources..." — region, not finding.

**Schema validation fails:**
Check the specific field flagged. Common causes: a required field was left null, an ID doesn't match the enum, or a list has too few/many items.

**Reviewer reports ISSUE but you disagree:**
Reviewers report to you — you decide. If the reviewer flags something you think is fine, approve and move on. The reviewer's job is to surface concerns, not to have the final word.

---

## Project Structure

```
configs/
├── reference/          # Source-of-truth data (lenses, facets, variables) + schemas
├── scenario/           # create_scenario command, planning + validation agents
├── transcript/         # create_transcript command, dialog writer + transcript ID + reviewer
├── analysis/           # analyze_transcript command, evaluator + reviewer
├── scaffolding/        # design_scaffolding command, scaffolding ID + reviewer
├── session/            # configure_session command
├── system/             # initialize_polylogue command, sync script
└── shared/             # Cross-cutting scripts (validate_schema)
registry/               # Generated outputs: registry/{scenario_id}/ per scenario
docs/                   # Design documents
references/             # External reference materials (PBL curriculum)
```

Each scenario produces:
```
registry/{scenario_id}/
├── scenario.yaml           # Scenario plan (pipeline-internal)
├── transcript.yaml         # Discussion transcript (student-facing)
├── analysis.yaml           # Expert analysis (AI perspective)
├── facilitation.yaml       # Facilitation guide (teacher-facing)
├── scaffolding.yaml        # Scaffolding materials (app scaffolding)
├── session.yaml            # Session configuration (app setup)
└── intermediates/          # Debug artifacts (dialog writer input, raw/polished transcripts)
```
