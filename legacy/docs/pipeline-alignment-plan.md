# Pipeline Alignment Plan — v5-6

The pipeline was built against the v5-5 framework (two-phase Evaluate/Explain design). The framework has been revised to v5-6 (integrated flow, per-passage state machine, unified scaffolds, multi-lens diagnosis). This plan describes what needs to change in the pipeline code to align with v5-6.

**Source of truth:** `docs/polylogue-v5-6.md` (framework + instructional design + artifact generation), `docs/pipeline-spec.md` (technical spec)

**Reference data is unaffected.** `configs/reference/` (lenses, facets, explanatory variables) is framework-agnostic and doesn't enforce the old phase structure.

**Generated artifacts in `registry/` are stale.** All three scenarios were generated under the old design. They will be regenerated after the pipeline is updated.

---

## What Changed (v5-5 → v5-6)

| Old Design | New Design | Impact on Pipeline |
|---|---|---|
| Two phases: Evaluate then Explain | One integrated flow | Schemas, prompts, commands all organized by phase |
| Separate AI blocks: `ai_perspective_evaluate` + `ai_perspective_explain` | Unified `ai_perspective` per passage | Analysis schema, evaluator prompt, analysis reviewer |
| Phase-based scaffolding (evaluate hints + explain starters) | Unified scaffold sequence (graduated hints → AI as final entry) | Scaffolding schema, scaffolding agent, scaffolding reviewer |
| Four-step cycle: Individual → Peer → AI → Consensus | Per-passage state machine: Diagnose → Discuss → Reviewing AI → Submit Assessment | Session schema, session command |
| Form submissions per step | Chat-style threads (append-only messages) | Student annotations schema |
| Facilitation guide by phase | Facilitation guide by passage state | Facilitation schema |
| Student tags diagnosis with one lens | Student chooses one or more lenses, rates strong/weak per lens | Session schema, scaffolding (rubrics already per-lens), student annotations |

---

## Current Status

| Component | Status | Notes |
|---|---|---|
| `docs/polylogue-v5-6.md` | **Done** | Reorganized into 3 parts; all v5-6 changes applied |
| `docs/pipeline-spec.md` | **Done** | Student annotations, diagnose descriptions, reference data counts, open questions updated |
| `configs/reference/` | **No change needed** | Framework-agnostic |
| Schemas (Phase 1) | **Done** | All 5 schemas updated (analysis, scaffolding, facilitation, session, student annotations) |
| Agent prompts (Phase 2) | **Done** | evaluator, scaffolding_id, analysis_reviewer, scaffolding_reviewer updated |
| Commands (Phase 3) | **Done** | analyze_transcript, design_scaffolding, configure_session updated; .claude/ synced |
| Regeneration (Phase 4) | **Pending** | After Phases 1–3 |

---

## Phase 1: Schemas

Update the structural contracts. Everything downstream depends on these.

### 1.1 Analysis Schema
**File:** `configs/analysis/schemas/analysis.yaml`

**Change:** Replace `ai_perspective_evaluate` and `ai_perspective_explain` with a single `ai_perspective` block per passage.

New structure:
```yaml
ai_perspective:
  through_logic:
    observation: string | null
    key_sentences: [string]
  through_evidence:
    observation: string | null
    key_sentences: [string]
  through_scope:
    observation: string | null
    key_sentences: [string]
  why_it_happened: string | null    # Integrated explanation — cognitive × social
  what_to_notice: string
  what_to_notice_sentences: [string] | null
```

Per-lens observations and explanation are in one block. The AI perspective is written as one voice that moves from observation to explanation naturally.

### 1.2 Scaffolding Schema
**File:** `configs/scaffolding/schemas/scaffolding.yaml`

**Change:** Replace `evaluate` and `explain` sections with a unified `scaffold_sequence` plus supporting elements.

New structure per passage:
```yaml
difficulty: string                    # accessible | moderate | challenging
scaffold_sequence:
  - type: hint | ai_perspective
    text: string                      # Progressively more revealing
  # Minimum 2 entries (1 hint + AI perspective)
  # AI perspective is always the final entry
deepening_probes:
  - lens: string
    prompt: string
ai_reflection_prompt: string
common_misreadings:                   # Unchanged
observation_rubric:                   # Unchanged (per-lens, per-passage)
explanation_rubric:                   # Unchanged (lens-independent, per-passage)
```

Remove: `evaluate.partial_hints`, `evaluate.lens_entry_prompts`, `evaluate.ai_reflection_prompts`, `explain.passage_sentence_starters`, `explain.bridge_prompts`, `explain.ai_reflection_prompt`.

### 1.3 Facilitation Schema
**File:** `configs/analysis/schemas/facilitation.yaml`

**Change:** Replace `evaluate` and `explain` sections in passage guides with state-based organization.

New structure per passage:
```yaml
diagnose:
  if_students_are_stuck: string
discuss:
  likely_disagreements: string
  productive_questions: [string]
  watch_for: string
ai_perspective:
  what_the_ai_will_say: string
  likely_student_reactions: string
  follow_up: string
```

Remove: `evaluate.individual`, `evaluate.peer`, `evaluate.ai`, `explain.individual`, `explain.peer`, `explain.ai`.

### 1.4 Session Schema
**File:** `configs/session/schemas/session.yaml`

**Change:** Remove `evaluate_phase` and `explain_phase`. Replace with passage-level configuration.

Remove: `evaluate_phase`, `explain_phase`, `lens_scope: evaluate_only`, phase-specific sequences, `ai.source: ai_perspective_evaluate`, `ai.source: ai_perspective_explain`.

The session config specifies: passages (with suggested order), lens definitions, onboarding content, and references to scaffolding. The per-passage state machine logic lives in the app, not in the session config.

### 1.5 Student Annotations Schema
**File:** `configs/session/schemas/student_annotations.yaml`

**Change:** Replace `evaluate` and `explain` sections with a thread-based message model supporting multi-lens diagnosis.

New structure:
```yaml
student_id: string
session_id: string
passage_id: string
messages:                              # Append-only thread
  - type: diagnosis | discussion | assessment | post_hint | post_ai
    text: string
    timestamp: string
    lenses:                            # For diagnosis/assessment messages
      - lens: string                   # Lens ID
        rating: strong | weak          # Rating on this lens
    hint_level: integer | null         # For post_hint messages
```

This matches the chat-style interaction design and supports multi-lens diagnosis. The "current assessment" is the most recent assessment-type message.

---

## Phase 2: Agent Prompts

Update the instructions that tell agents what to produce.

### 2.1 Evaluator
**Files:** `configs/analysis/agents/evaluator.md`, `.claude/agents/evaluator.md`

**Changes:**
- Remove instructions to produce separate `ai_perspective_evaluate` and `ai_perspective_explain`
- Instruct single unified `ai_perspective` per passage: per-lens observations combined with explanation of why characters reasoned this way
- Add: AI perspective should note sound reasoning moments, not just weaknesses (mixed-valence)
- Add: `why_it_happened` introduces cognitive/social vocabulary as perspective, not verdict
- Remove: "NO explanatory vocabulary" constraint on evaluate block (there's no evaluate block)

### 2.2 Scaffolding Instructional Designer
**Files:** `configs/scaffolding/agents/scaffolding_id.md`, `.claude/agents/scaffolding_id.md`

**Changes:**
- Remove phase-based organization (evaluate hints + explain starters)
- Instruct graduated `scaffold_sequence` per passage: ordered list of hints → AI perspective as final entry
- Hints are progressively more revealing; even the last hint doesn't give away the answer
- Minimum 2 entries per passage; pipeline determines depth based on complexity
- Add: `deepening_probes` (lens-specific, shown after diagnosis submission)
- Remove: bridge prompts (no phase transition to bridge)
- Remove: passage-specific sentence starters (these were explain-phase scaffolding)

### 2.3 Analysis Reviewer
**File:** `configs/analysis/agents/analysis_reviewer.md`

**Changes:**
- Remove: "AI Perspective Split — Evaluate Block" and "Explain Block" checks
- Remove: "Split Cleanliness" check
- Add: Check for unified AI perspective structure
- Add: Check that observations cover both sound and weak reasoning
- Add: Check that `why_it_happened` uses perspective language, not verdicts

### 2.4 Scaffolding Reviewer
**File:** `configs/scaffolding/agents/scaffolding_reviewer.md`

**Changes:**
- Remove: phase-based quality checks
- Add: Check scaffold sequence has minimum 2 entries, AI perspective is final
- Add: Check hints are progressively revealing without giving away the answer
- Add: Check deepening probes nudge toward explanation, not just evaluation

### 2.5 Evaluator — Facilitation Guide Output
The evaluator also produces `facilitation.yaml`. Update the facilitation section of the evaluator prompt to produce state-based guide (diagnose/discuss/ai_perspective) instead of phase-based (evaluate/explain).

### 2.6 Planning Agent
**Files:** `configs/scenario/agents/planning_agent.md`, `.claude/agents/planning_agent.md`

**Changes (minor):**
- No structural changes — the planning agent doesn't reference phases
- Verify reference to `polylogue-v5-6.md` (not v5-5)

### 2.7 Validation Agent
**Files:** `configs/scenario/agents/validation_agent.md`, `.claude/agents/validation_agent.md`

**Changes (minor):**
- No structural changes — the validation agent doesn't reference phases
- Verify reference to `polylogue-v5-6.md` (not v5-5)

---

## Phase 3: Commands

Update the orchestration instructions.

### 3.1 Analyze Transcript
**Files:** `configs/analysis/commands/analyze_transcript.md`, `.claude/commands/analyze_transcript.md`

**Changes:**
- Update Step 2: evaluator produces unified `ai_perspective` (not two blocks)
- Update Step 2: facilitation guide organized by state (not phase)
- Update Step 3 (reviewer): validate unified structure

### 3.2 Design Scaffolding
**Files:** `configs/scaffolding/commands/design_scaffolding.md`, `.claude/commands/design_scaffolding.md`

**Changes:**
- Update Step 2: scaffolding agent produces `scaffold_sequence` per passage (not phase-based hints)
- Update: deepening probes replace bridge prompts
- Update Step 3 (reviewer): validate sequence structure

### 3.3 Configure Session
**Files:** `configs/session/commands/configure_session.md`, `.claude/commands/configure_session.md`

**Changes:**
- Remove: two-phase configuration logic
- Update: session config references unified `ai_perspective`
- Remove: phase-specific thresholds, sequence definitions

### 3.4 Create Scenario and Create Transcript
**Files:** `configs/scenario/commands/create_scenario.md`, `configs/transcript/commands/create_transcript.md` (and `.claude/` copies)

**Changes:** None expected — these commands don't reference the session flow or AI perspective structure. Verify and confirm.

---

## Phase 4: Regeneration

After Phases 1–3, regenerate all scenarios:

1. Archive current `registry/` contents to `registry/archived/`
2. Run the full pipeline on each scenario's `operator-prompt.txt`
3. Validate generated artifacts against updated schemas
4. Spot-check AI perspective quality: is it unified, mixed-valence, perspective-not-verdict?

---

## Execution Notes

**Dependency order:** Schemas (Phase 1) must be done first — everything else references them. Agent prompts (Phase 2) and commands (Phase 3) can be done in parallel after schemas. Regeneration (Phase 4) is last.

**Dual locations:** Agent prompts and commands exist in both `configs/` (organized by pipeline stage) and `.claude/` (where Claude Code reads them). Both locations must be updated. The `configs/system/sync_commands.sh` script copies from `configs/` to `.claude/` — run it after updating `configs/`.

**The create_scenario and create_transcript commands are unaffected.** The scenario plan and transcript generation don't reference the session flow or AI perspective structure. Changes start at Stage 3 (analyze_transcript).

**Reference data is unaffected.** `configs/reference/` stays as-is.

**Validation scripts in `configs/shared/` may need updating** if they validate artifact structure against the old schemas. Check `validate_schema.py` and any other shared scripts.
