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

## Complete Example Prompts

These are complete operator prompts with all 6 fields filled in. Use them as templates for new scenarios or as-is to regenerate the existing discussions.

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
