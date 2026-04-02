# Create Scenario

Generate a scenario plan — the blueprint for a scripted group discussion.

## Input

The operator provides a prompt with 6 named fields (see `docs/OperatorGuidance.md` for full descriptions and examples):

1. **Topic** — The discussion topic in plain language
2. **Context** — PBL connection: what unit, what driving question, what situation the group faces
3. **Instructional goals** — What the teacher wants students to practice noticing (at least 2)
4. **Target complexity** — Number of personas (2-3) and number of target facets
5. **Target facets** — Per facet: facet ID, primary lens, cognitive pattern, social dynamic, carrier persona description, and **signal mechanism** (the concrete narrative of how the weakness manifests in the conversation)
6. **Discussion dynamic** — Starting positions, shift mechanism, ending condition, and interaction quality (how the interpersonal dynamics should unfold)

## Steps

### Step 0: Validate Operator Input

Before invoking the planning agent, check that the operator prompt includes all 6 fields:

- [ ] Topic specified
- [ ] Context with PBL connection
- [ ] Instructional goals (at least 2)
- [ ] Target complexity stated
- [ ] Each target facet has: facet ID, lens, signal mechanism, cognitive pattern, social dynamic, carrier
- [ ] Discussion dynamic with: starting positions, shift mechanism, ending condition

If any field is missing or underspecified, ask the operator to complete it before proceeding. In particular:
- **Signal mechanism** must be present for each target facet — it cannot be left for the planning agent to invent
- **Discussion dynamic** must describe concrete interpersonal mechanics, not just restate the topic

Once the prompt is validated, save it as the originating artifact:

```
registry/{scenario_id}/operator-prompt.md
```

This preserves the operator's original input for future reference, re-generation, and comparison against the planning agent's translations.

### Step 1: Planning Agent — Draft the Scenario Plan

Read the planning agent prompt at `configs/scenario/agents/planning_agent.md`.

Using the operator's input and the reference data files, draft a complete scenario plan following the schema at `configs/scenario/schemas/scenario_plan.yaml`.

**Key requirements:**
- `weaknesses` and `accomplishes` must use natural language only — no framework terminology
- Personas must genuinely disagree
- Turn outline must have 10-14 turns with a narrative arc
- `target_facets` must reference valid IDs from `configs/reference/facet_inventory.yaml`
- `designed_explanation` must reference valid IDs from `configs/reference/explanatory_variables.yaml`

Present the drafted plan to the operator for initial review before validation.

### Step 2: Validation Agent — Review the Plan

Read the validation agent prompt at `configs/scenario/agents/validation_agent.md`.

Review the scenario plan against all six criteria:
1. Facet detectability
2. Cross-lens visibility
3. Persona tension
4. Information barrier compliance
5. Turn outline anti-patterns
6. Signal mechanism fidelity

Report findings as PASS/ISSUE/SUGGESTION per criterion.

### Step 3: Operator Gate

Present the validation results to the operator. The operator decides:
- **Approve** — proceed to save the plan
- **Revise** — address specific issues and re-validate
- **Reject** — start over with a new approach

### Step 4: Quality Checklist

Before saving, verify:
- [ ] `scenario_id` is kebab-case and descriptive
- [ ] All `facet_id` values exist in the facet inventory
- [ ] All `cognitive_pattern` values exist in the explanatory variables
- [ ] All `social_dynamic` values exist in the explanatory variables
- [ ] `weaknesses` fields contain NO framework terminology
- [ ] `accomplishes` fields contain NO framework terminology
- [ ] Personas genuinely disagree (different positions, not just different knowledge)
- [ ] Turn outline has 10-14 turns
- [ ] No 4+ consecutive turns of unchecked agreement
- [ ] Discussion arc describes rising tension and resolution
- [ ] `carrier_persona` names match persona names
- [ ] `signal_mechanism` present for each target facet (copied verbatim from operator prompt)
- [ ] `discussion_dynamic` present (copied verbatim from operator prompt)
- [ ] `weaknesses` fields are specific enough to steer the dialog writer (not vague)
- [ ] `weaknesses` faithfully translates `signal_mechanism` (same behavioral intent, natural language)

### Step 5: Save

Create the scenario directory and save the plan:

```
registry/{scenario_id}/scenario.yaml
```

Confirm the file is valid YAML and matches the schema.

## Output

`registry/{scenario_id}/scenario.yaml`

## Next Step

Run `/create_transcript` with this scenario.
