# Polylogue v5

v5 is the next iteration of the simplified framework for teaching critical thinking to middle-school students. It keeps the human-in-the-loop pipeline shape from earlier versions: a deterministic student-facing app, authored YAML artifacts, subagent-based content creation, and operator approval gates.

The main v5 changes are:

1. A reasoning taxonomy where weak and strong reasoning are peers.
2. Grade-level audience fit enforced upstream at story design.
3. A three-step quiz flow: claim (what's the intended argument?) -> judgment (is that strong or weak?) -> why (why do you think so?).
4. A simplified authoring pipeline centered on `design_story`, `create_transcript`, and `create_lesson_package`.

## Current State

v5 is no longer just a design folder. It now includes:

- active design docs in `docs/`
- pipeline commands, agents, and validators in `pipeline/`
- authored stories in `stories/`
- generated lesson artifacts in `artifacts/`
- a working Next.js student app in `app/`

## New Developer Quickstart

If you want to run the student app locally, start in `v5/app`:

```bash
cd app
npm install
cp .env.example .env
npx prisma migrate dev
npm run dev
```

Then open `http://localhost:3000`.

The app uses a local SQLite database at `app/prisma/dev.db` and reads authored content from `stories/` and `artifacts/`.

This app currently uses Prisma 6. Run `npm install` before any `npx prisma ...` command so `npx` uses the repo's local Prisma version instead of downloading Prisma 7. Also create `app/.env` from `app/.env.example`, because Prisma CLI needs `DATABASE_URL` before it can run migrations.

To wipe local app data and start fresh:

```bash
cd app
npm install
cp .env.example .env
rm -f prisma/dev.db prisma/dev.db-journal
npx prisma migrate dev
npm run dev
```

For more detailed app setup notes, see [`app/README.md`](app/README.md).

## Design Docs

| Document | Purpose |
| --- | --- |
| [`todo-01.md`](todo-01.md) | Scope, motivation, phasing, and open questions. |
| [`docs/architecture.md`](docs/architecture.md) | System architecture, runtime invariants, and data flow. |
| [`docs/instructional-design.md`](docs/instructional-design.md) | Pedagogy, story-design frame, and the three-step quiz. |
| [`docs/operator-workflow.md`](docs/operator-workflow.md) | Operator workflow, command cadence, and approval gates. |
| [`reference/reasoning-taxonomy.yaml`](reference/reasoning-taxonomy.yaml) | Canonical reasoning taxonomy data. |
| [`schemas/`](schemas/) | YAML shape contracts for authored and generated artifacts. |

## Pipeline Surface

Core checked-in pipeline files live under `pipeline/`:

- commands: [`pipeline/commands/design_story.md`](pipeline/commands/design_story.md), [`pipeline/commands/create_transcript.md`](pipeline/commands/create_transcript.md), [`pipeline/commands/create_lesson_package.md`](pipeline/commands/create_lesson_package.md)
- agents: [`pipeline/agents/`](pipeline/agents/)
- validation and setup scripts: [`pipeline/scripts/`](pipeline/scripts/)

If you are working on the Claude workflow, initialize the simplified pipeline into the repo-root `.claude/` mirror before using the command surface.

## Directory Layout

```text
v5/
  docs/          design docs and operator guidance
  reference/     canonical reference data
  schemas/       YAML shape contracts
  pipeline/      commands, agents, validators, setup scripts
  stories/       authored story sources
  artifacts/     generated per-story / per-episode artifacts
  app/           student-facing Next.js runtime
  todo-01.md     scoping and phasing notes
  README.md      this file
```

## Reading Order

New to v5? Read in this order:

1. [`docs/architecture.md`](docs/architecture.md)
2. [`docs/instructional-design.md`](docs/instructional-design.md)
3. [`docs/operator-workflow.md`](docs/operator-workflow.md)
4. [`app/README.md`](app/README.md) if you need to run the app
5. [`todo-01.md`](todo-01.md) for design rationale and remaining open questions
