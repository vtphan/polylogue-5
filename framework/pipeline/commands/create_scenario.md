---
description: Generate a scenario plan from a 6-field operator prompt (planning + validation agents)
argument-hint: [paste 6-field operator prompt after invoking]
---

# Create Scenario

Generate a scenario plan — the blueprint for a scripted group discussion.

## Input

The operator provides a prompt with 6 named fields (see `framework/docs/OperatorGuidance.md` for full descriptions and examples):

1. **Topic** — The discussion topic in plain language
2. **Context** — PBL connection: what unit, what driving question, what situation the group faces
3. **Instructional goals** — What the teacher wants students to practice noticing (at least 2)
4. **Target complexity** — Number of personas (2-3) and number of target facets
5. **Target facets and target strengths** — Two parallel sub-sections.
   - **Target facets** (weaknesses): per facet — facet ID, primary lens, cognitive pattern, social dynamic, carrier persona description, and **signal mechanism** (the concrete narrative of how the weakness manifests in the conversation).
   - **Target strengths** (mixed-valence is doctrinal — at least one is required): per strength — facet ID, primary lens, carrier persona description, and **signal mechanism** (the concrete narrative of how the strength manifests). Optionally a `contrastive_note`. **No cognitive pattern or social dynamic** — the framework has no positive explanatory variables; strengths are explained contrastively downstream.
6. **Discussion dynamic** — Starting positions, shift mechanism, ending condition, and interaction quality (how the interpersonal dynamics should unfold)

## Steps

### Step 0: Validate Operator Input

Before invoking the planning agent, check that the operator prompt includes all 6 fields:

- [ ] Topic specified
- [ ] Context with PBL connection
- [ ] Instructional goals (at least 2)
- [ ] Target complexity stated
- [ ] Each target facet has: facet ID, lens, signal mechanism, cognitive pattern, social dynamic, carrier
- [ ] At least one target strength is present, each with: facet ID, lens, signal mechanism, carrier
- [ ] Discussion dynamic with: starting positions, shift mechanism, ending condition

If any field is missing or underspecified, ask the operator to complete it before proceeding. In particular:
- **Signal mechanism** must be present for each target facet AND each target strength — it cannot be left for the planning agent to invent
- **Target strengths** are required, not optional — mixed-valence is doctrinal
- **Discussion dynamic** must describe concrete interpersonal mechanics, not just restate the topic

Hold the validated prompt in memory for the next step. **Do not save it yet** — the `scenario_id` does not exist until the planning agent generates it in Step 1, so there is no directory to save into.

Normalize the prompt to clean plain text with each field labeled on its own line, body text flowing continuously (no mid-sentence line breaks), one blank line between fields. This is the form you will pass to the planning agent and (later) save:

```
Topic: Whether to focus the group's environmental project on...

Context: A 6th-grade STEM class is working on...They can only pick one.

Instructional goals:
- Practice noticing when...
- Practice noticing when...

Target complexity: 2 personas, 2 target facets

Target facets:
- Relevance (Evidence lens) — ...Signal mechanism: ...Cognitive pattern: ...
- Counter-argument engagement (Scope lens) — ...Signal mechanism: ...

Target strengths:
- Consequence consideration (Scope lens) — Carrier: Maya. Signal mechanism: Maya asks who's actually going to maintain the rain barrels every week...

Discussion dynamic: The personas must genuinely disagree...
```

### Telemetry

Throughout this command, log meaningful events to `artifacts/{scenario_id}/pipeline_log.yaml` via:

```bash
python3 framework/pipeline/scripts/log_pipeline_event.py \
  --scenario {scenario_id} --command create_scenario \
  --stage <stage> [--agent <agent>] [--attempt <n>] [--verdict <V>] \
  [--retries-remaining <n>] [--notes "<text>"]
```

The required log points are called out in each step below. The log captures only the trace (no artifact content) — it is safe to commit and used by future tuning.

**Pending-id handling.** `scenario_id` is not known until after Step 1, so the early events must be logged under a per-run temporary id. At the start of the command, generate a timestamped pending id and hold it for the rest of the run:

```bash
PENDING_ID="_pending_$(date -u +%Y%m%dT%H%M%SZ)"
```

Use this `PENDING_ID` as `--scenario` for every event before the planning agent returns. Once the real `scenario_id` is known (end of Step 1), merge the pending log into the real scenario directory with one helper invocation:

```bash
python3 framework/pipeline/scripts/log_pipeline_event.py \
  --rename-pending "$PENDING_ID" {scenario_id}
```

This moves (or concatenates) the pending events into `artifacts/{scenario_id}/pipeline_log.yaml`, removes the empty pending directory, and records the merge as a `rename_pending` event in the destination log. From that point on, log under the real `scenario_id`.

**Log immediately on entry:** `--stage start --verdict START` (under `$PENDING_ID`).

### Step 1: Planning Agent — Draft the Scenario Plan

**Use the Task tool with `subagent_type: planning_agent`.**

Pass the agent:
- The full validated operator prompt (inline in the task description, in the normalized form from Step 0)
- A pointer to the schema at `framework/schemas/scenario_plan.yaml` and the reference data under `framework/reference/`

Expect back: a complete `scenario.yaml` as YAML text, including a kebab-case `scenario_id` derived from the topic. The agent has Read but not Write — it returns the draft to you for review and saving.

Once the draft comes back, extract the `scenario_id` field — every subsequent step uses it as the directory name under `artifacts/`.

**Log:** `--stage planning --agent planning_agent --attempt 1 --verdict draft_returned` (still under `$PENDING_ID`).

**After the draft returns and `scenario_id` is known**, merge the pending log into the real scenario directory:

```bash
python3 framework/pipeline/scripts/log_pipeline_event.py \
  --rename-pending "$PENDING_ID" {scenario_id}
```

All subsequent events use `--scenario {scenario_id}`.

**Key requirements:**
- `weaknesses` and `accomplishes` must use natural language only — no framework terminology
- Personas must genuinely disagree
- Turn outline must have 10-14 turns with a narrative arc
- `target_facets` must reference valid IDs from `framework/reference/facet_inventory.yaml`
- `designed_explanation` must reference valid IDs from `framework/reference/explanatory_variables.yaml`

Proceed directly to validation — do not pause for operator review.

### Step 2: Validation Agent — Review the Plan

**Use the Task tool with `subagent_type: validation_agent`.** This MUST run as a fresh subagent — not in the main thread — so the review is independent of the drafting context.

Pass the agent:
- The drafted scenario plan from Step 1 (inline as YAML text)
- A pointer to `framework/reference/facet_inventory.yaml` and `framework/reference/explanatory_variables.yaml`

Expect back: a PASS/ISSUE/SUGGESTION report against all six criteria:
1. Facet detectability
2. Cross-lens visibility
3. Persona tension
4. Information barrier compliance
5. Turn outline anti-patterns
6. Signal mechanism fidelity
7. Strength signal fidelity

The validation_agent returns one of three verdicts: **ACCEPT**, **REVISE**, or **REJECT** (the validation_agent's allowed subset of the standardized ACCEPT / REVISE / REGENERATE / REJECT vocabulary — REGENERATE is not applicable at this stage).

- **ACCEPT** → proceed directly to the quality checklist (Step 3).
- **REVISE** → re-invoke the planning_agent (Step 1) with the validation report as additional feedback, then re-validate. **Retry budget: 1 revise pass.** If the second validation also returns REVISE, treat as REJECT.
- **REJECT** → halt the command. Surface the latest plan and the validation report to the operator. The operator decides whether to revise the operator prompt and re-run `/create_scenario`, or to discard. (See *Failure-mode escape hatch* in `framework/docs/system-architecture.md`.)

Do not pause for operator review on ACCEPT. The pipeline is autonomous from validated input through the save step.

**Log on each verdict:** `--stage validation --agent validation_agent --attempt <n> --verdict <ACCEPT|REVISE|REJECT> --retries-remaining <n>` (under the real `{scenario_id}` — the pending log was merged at the end of Step 1). On REJECT after exhaustion, also log `--stage halt --verdict HALT --notes "validation rejected after retries"`.

### Step 3: Quality Checklist

Before saving, verify:
- [ ] `scenario_id` is kebab-case and descriptive
- [ ] All `facet_id` values exist in the facet inventory
- [ ] All `cognitive_pattern` values exist in the explanatory variables
- [ ] All `social_dynamic` values exist in the explanatory variables
- [ ] `weaknesses` fields contain NO framework terminology
- [ ] `strengths` fields contain NO framework terminology
- [ ] `accomplishes` fields contain NO framework terminology
- [ ] `target_strengths` is present with at least one entry
- [ ] Each `target_strengths` entry has facet_id, primary_lens, also_visible_through, carrier_persona, signal_mechanism (verbatim)
- [ ] Each strength carrier persona has a non-trivial `strengths` field that translates the signal mechanism
- [ ] Strength turn-room: the carrier has at least one turn in the outline where the strength can manifest
- [ ] Personas genuinely disagree (different positions, not just different knowledge)
- [ ] Turn outline has 10-14 turns
- [ ] No 4+ consecutive turns of unchecked agreement
- [ ] Discussion arc describes rising tension and resolution
- [ ] `carrier_persona` names match persona names
- [ ] `signal_mechanism` present for each target facet (copied verbatim from operator prompt)
- [ ] `discussion_dynamic` present (copied verbatim from operator prompt)
- [ ] `weaknesses` fields are specific enough to steer the dialog writer (not vague)
- [ ] `weaknesses` faithfully translates `signal_mechanism` (same behavioral intent, natural language)

### Step 4: Save

Now that the `scenario_id` exists, create the scenario directory and its `intermediates/` subdirectory, then save **both** the scenario plan and the normalized operator prompt from Step 0:

```
artifacts/{scenario_id}/scenario.yaml         # the approved plan
artifacts/{scenario_id}/operator-prompt.txt   # the normalized prompt from Step 0
artifacts/{scenario_id}/intermediates/        # empty, used by /create_transcript
```

Then run schema validation explicitly and **halt on non-zero exit**:

```bash
python3 framework/pipeline/scripts/validate_schema.py \
  artifacts/{scenario_id}/scenario.yaml \
  framework/schemas/scenario_plan.yaml
```

If the validator reports issues, do not proceed — surface the issues to the operator. This converts the prose "validate against the schema" check into a hard gate.

**Log:** `--stage schema_validation --verdict <PASS|FAIL>` immediately after the validator runs, then `--stage save --verdict SAVE` on success or `--stage save --verdict FAIL --notes "<reason>"` if the file system save itself fails. Halt before save if `schema_validation` returned FAIL.

## Output

`artifacts/{scenario_id}/scenario.yaml`

## Next Step

Run `/create_transcript` with this scenario — it generates the scripted discussion by passing the plan through the information barrier to the dialog writer, then polishes and enumerates the transcript.
