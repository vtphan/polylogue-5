# Polylogue v5

v5 is the next iteration of the simplified framework for teaching critical thinking to middle-school students. It inherits v4's human-in-the-loop pipeline shape (four commands, six agents, deterministic student-facing app) and improves instructional quality in three specific ways:

1. A new reasoning taxonomy where weak and strong reasoning are peers.
2. Grade-level audience fit enforced once, upstream, at story design.
3. A three-step quiz flow (claim → judgment → why) replacing the flat single-question format.

## Current phase

v5 is currently in **design lock**. The goal of this phase is to stabilize the design, specs, and contracts before any command, agent, validator, or app code is written. No implementation has started.

## Design docs

| Document | Purpose |
|---|---|
| [`todo-01.md`](todo-01.md) | Scope, motivation, phasing, open questions. The reasoning trail. |
| [`docs/architecture.md`](docs/architecture.md) | System architecture: five-layer data model, four-command / six-agent pipeline, invariants. |
| [`docs/instructional-design.md`](docs/instructional-design.md) | Pedagogy: story-design frame, detection principles, three-step quiz, student journey. |
| [`docs/operator-workflow.md`](docs/operator-workflow.md) | Operator-facing workflow: running commands, review cadence, what each approval gate expects. |
| [`reference/reasoning-taxonomy.yaml`](reference/reasoning-taxonomy.yaml) | Six reasoning items × {weak, strong} faces across three lenses. |
| [`schemas/`](schemas/) | Descriptive YAML shape contracts for every artifact in the pipeline. |

## Directory layout

```
v5/
  docs/          design docs (architecture, instructional design, operator workflow)
  reference/     canonical reference data (reasoning taxonomy)
  schemas/       artifact shape contracts
  pipeline/      commands, agents, scripts (empty; implementation phase)
  stories/       authored story sources
  artifacts/     generated per-story / per-episode artifacts
  app/           student-facing runtime (empty; implementation phase)
  todo-01.md     scoping and phasing
  README.md      this file
```

## Reading order

New to v5? Start with `docs/architecture.md` for the system shape, then `docs/instructional-design.md` for the pedagogy. Consult `todo-01.md` for the reasoning behind specific design choices and the list of still-open questions.
