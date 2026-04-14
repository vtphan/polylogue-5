# Pipeline Revision 02: Operator Prompt Formalization

## Problem

The operator prompt for `create_scenario` contains rich calibration information that the planning agent consumes but doesn't preserve in `scenario.yaml`. Two categories of information are lost:

1. **Signal mechanism** — the concrete narrative of how each facet weakness manifests in the discussion (e.g., "the evidence supports 'recycling aluminum saves energy' but gets stretched to 'recycling saves the planet'"). The planning agent translates this into the `weaknesses` field, but the original description — which downstream agents would benefit from seeing — disappears.

2. **Discussion dynamic** — the interpersonal mechanics the operator designs (starting positions, shift mechanism, ending condition, interaction quality). The planning agent translates this into `discussion_arc` and `turn_outline`, but the operator's framing of *what kind of interaction this should be* is lost.

Downstream agents (transcript ID, evaluator, scaffolding ID, all reviewers) read `scenario.yaml` but can't see the operator's original intent. They work only with the planning agent's translations.

## Changes

### 1. Operator Prompt Formalized into 6 Named Fields

Previously, the operator prompt was free text with loosely suggested structure. Now `create_scenario` expects 6 named fields:

1. **Topic** — The discussion topic
2. **Context** — PBL connection and situation
3. **Instructional goals** — What students should practice noticing
4. **Target complexity** — Number of personas and target facets
5. **Target facets** — Per facet: facet ID, primary lens, cognitive pattern, social dynamic, carrier persona, and **signal mechanism**
6. **Discussion dynamic** — Starting positions, shift mechanism, ending condition, interaction quality

### 2. New Schema Fields

Two fields added to `configs/scenario/schemas/scenario_plan.yaml`:

- **`signal_mechanism`** (string, required) — inside each `target_facets[]` entry, after `carrier_persona`. Operator-authored, copied verbatim by the planning agent. Contains the concrete narrative of how the facet weakness manifests.

- **`discussion_dynamic`** (string, required) — top-level field, after `instructional_goals`. Operator-authored, copied verbatim by the planning agent. Contains the interpersonal mechanics of the discussion.

Both fields are **operator-authored passthrough** — the planning agent copies them unchanged. They coexist with the planning agent's translations (`weaknesses`, `discussion_arc`, `turn_outline`), preserving both the original intent and the barrier-safe realization.

### 3. Information Barrier Update

- `signal_mechanism` lives inside `target_facets`, which is already stripped by `strip_scenario.py`. No additional stripping needed.
- `discussion_dynamic` is a new top-level field that must not cross the barrier (it contains meta-design framing like "the weakness is in what they DON'T discuss"). Added to `BARRIER_FIELDS` in `strip_scenario.py`.

### 4. Command Update

`create_scenario` now includes:
- **Step 0: Validate operator input** — checks all 6 fields present before invoking the planning agent
- Extended quality checklist: signal_mechanism present per facet, discussion_dynamic present, weaknesses specific enough, weaknesses faithful to signal_mechanism

### 5. Agent Updates

**Planning agent:**
- References the 6 operator input fields by name
- New "Translating Operator Intent" section explaining the dual relationship: verbatim copies preserve intent, translations make it actionable behind the barrier

**Validation agent:**
- New criterion 6: "Signal Mechanism Fidelity" — checks whether `weaknesses` faithfully and specifically translates `signal_mechanism`, and whether `discussion_arc` + `turn_outline` realize `discussion_dynamic`
- Updated criterion 4: notes that `signal_mechanism` and `discussion_dynamic` must not appear in stripped output

## Files Changed

| File | Change |
|---|---|
| `configs/scenario/schemas/scenario_plan.yaml` | Add `discussion_dynamic` (top-level) and `signal_mechanism` (per facet) |
| `configs/scenario/schemas/validation_output.yaml` | Add `signal_mechanism_fidelity` to criterion enum |
| `configs/transcript/scripts/strip_scenario.py` | Add `discussion_dynamic` to BARRIER_FIELDS |
| `configs/scenario/commands/create_scenario.md` | 6 named input fields, Step 0 validation, extended checklist |
| `configs/scenario/agents/planning_agent.md` | Reference 6 fields, translation guidance section |
| `configs/scenario/agents/validation_agent.md` | Criterion 6, updated criterion 4 |
| `.claude/agents/planning_agent.md` | Synced copy |
| `.claude/agents/validation_agent.md` | Synced copy |
| `CLAUDE.md` | Updated architecture, agent, and barrier descriptions |
| `docs/OperatorGuidance.md` | New — operator-facing reference |

## Backward Compatibility

Existing generated scenarios (`registry/ocean-vs-deforestation/`, `registry/school-garden-water/`) predate this revision and lack `signal_mechanism` and `discussion_dynamic` fields. They are not retroactively updated. `strip_scenario.py` handles missing fields gracefully (checks `if field in plan` before deleting).

New scenarios generated after this revision will include both fields.
