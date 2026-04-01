# Create Scenario

Generate a scenario plan — the blueprint for a scripted group discussion.

## Input

The operator provides a prompt specifying:
- Topic and PBL context
- Instructional goals
- Target complexity (number of personas, number of target facets)
- Target facets with: facet ID, primary lens, desired cognitive pattern, desired social dynamic, carrier persona description
- Any specific constraints on the discussion

## Steps

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

Review the scenario plan against all five criteria:
1. Facet detectability
2. Cross-lens visibility
3. Persona tension
4. Information barrier compliance
5. Turn outline anti-patterns

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
