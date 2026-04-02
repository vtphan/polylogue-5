# Operator Guidance: create_scenario

This document explains what `create_scenario` expects from the operator and how the operator's input flows through the pipeline.

## The 6 Operator Input Fields

When running `/create_scenario`, provide a prompt with these 6 named fields. All are required.

### 1. Topic

The discussion topic in plain language — what the group of students is deciding.

> **Example:** Whether to focus the group's environmental project on ocean pollution or deforestation

### 2. Context

The PBL connection: what unit the class is in, what driving question they're working on, and what specific situation this group faces. Include enough detail for the planning agent to create realistic personas.

> **Example:** A 6th-grade STEM class is working on the PBL driving question: "What are the major threats affecting our global environment, and what can our communities do to protect our ecosystems?" This group needs to choose one environmental issue for their semester project. They're debating between ocean pollution (one member saw a documentary about plastic in the Pacific) and deforestation (another member read about Amazon fires). They can only pick one.

### 3. Instructional Goals

What you want students to practice noticing when they evaluate this discussion. Write at least two. These should describe observable reasoning patterns, not framework terminology.

> **Example:**
> - Practice noticing when someone's evidence doesn't actually support the specific claim they're making
> - Practice noticing when the group only considers one side of a question

### 4. Target Complexity

Number of personas (2-3) and number of target facets. Start with 2 personas and 2 target facets for most scenarios.

> **Example:** 2 personas, 2 target facets

### 5. Target Facets

For each target facet, specify all of the following:

| Sub-field | What it is |
|---|---|
| **Facet ID** | From the facet inventory (e.g., `relevance`, `sufficiency`) |
| **Primary lens** | Which lens most reveals this facet (Evidence, Logic, or Scope) |
| **Signal mechanism** | The concrete narrative of how the weakness manifests in the conversation |
| **Cognitive pattern** | From the explanatory variables (e.g., `overgeneralization`) |
| **Social dynamic** | From the explanatory variables (e.g., `conformity`) |
| **Carrier persona** | Which persona primarily manifests this weakness |

The **signal mechanism** is the most important sub-field. It's the concrete, specific description of what goes wrong and how. It is NOT a restatement of the facet definition — it describes the particular way this facet plays out in this specific discussion.

> **Good signal mechanism:** "One persona uses evidence about ocean pollution in general to argue their local project should focus on it, but the evidence is about a different scale and context than what their project could address."
>
> **Too vague:** "The evidence isn't relevant to the claim."
>
> **Good signal mechanism:** "One persona claims the rain barrel system 'will definitely provide enough water' based on one website about rainfall in a different climate. The evidence is thin for a confident conclusion."
>
> **Too vague:** "There isn't enough evidence."

### 6. Discussion Dynamic

Describe how the interpersonal interaction should unfold. Include:

- **Starting positions** — Who wants what? Where does each persona begin?
- **Shift mechanism** — What causes the dynamic to change? Who concedes and why?
- **Ending condition** — How does the discussion resolve?
- **Interaction quality** — What should the conversation *feel like*?

> **Example (Scenario A):** The personas must genuinely disagree — they want different projects, not just different angles on the same project. The discussion ends when they pick one or acknowledge they can't decide.
>
> **Example (Scenario 5 — more specific):** The personas should genuinely disagree at first — one wants the preserve, the other wants the waste facility. But unlike Scenario 1, they should argue respectfully and make concessions. The discussion should feel like a GOOD conversation — the weakness is in what they DON'T discuss, not in how they treat each other. The discussion ends with a clear decision.

## How Your Input Flows Through the Pipeline

Two of your fields are **copied verbatim** into the scenario plan. Two others are **translated** by the planning agent. Both versions are preserved.

| You write | Planning agent does | Where it lives in scenario.yaml |
|---|---|---|
| Signal mechanism | Copies verbatim | `target_facets[].signal_mechanism` |
| Signal mechanism | Translates into natural language | `personas[].weaknesses` |
| Discussion dynamic | Copies verbatim | `discussion_dynamic` |
| Discussion dynamic | Translates into narrative + turn sequence | `discussion_arc` + `turn_outline` |

The **verbatim copies** preserve your original intent. Downstream agents (transcript ID, evaluator, scaffolding ID) can read them to understand what you designed and why.

The **translations** are what the dialog writer sees. The dialog writer operates behind the information barrier — it never sees `signal_mechanism`, `discussion_dynamic`, or `target_facets`. It works only from `weaknesses`, `accomplishes`, `discussion_arc`, and `turn_outline`, all written in natural language.

## What the Validation Agent Checks

After the planning agent drafts the scenario plan, the validation agent reviews it against 6 criteria:

1. **Facet detectability** — Will the designed weakness be observable in the transcript?
2. **Cross-lens visibility** — Can multiple lenses reveal the weakness?
3. **Persona tension** — Do the personas genuinely disagree?
4. **Information barrier compliance** — Are `weaknesses` and `accomplishes` free of framework terminology?
5. **Turn outline anti-patterns** — No long agreement runs, dismissed concerns acknowledged, narrative arc present?
6. **Signal mechanism fidelity** — Does `weaknesses` faithfully and specifically translate your `signal_mechanism`? Is it concrete enough for the dialog writer? Does `discussion_arc` + `turn_outline` realize your `discussion_dynamic`?

Criterion 6 is the check that your intent survived the planning agent's translation. If the validation agent flags it, the planning agent's translations need revision before proceeding.

## Reference Data

When writing target facets, consult:
- Facet inventory: `configs/reference/facet_inventory.yaml` (11 facets with IDs, definitions, quality ranges, cross-lens visibility)
- Explanatory variables: `configs/reference/explanatory_variables.yaml` (8 cognitive patterns + 4 social dynamics with IDs and descriptions)
- Lenses: `configs/reference/lenses.yaml` (3 lenses: logic, evidence, scope)
- Scenario sequence: `docs/scenario-sequence.md` (the pilot scenario plan with all operator prompts)
