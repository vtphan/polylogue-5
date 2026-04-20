# Simplified Framework App

Dedicated student-facing app for `simplified-framework`.

The app is deterministic at student time. It does not call LLMs. It reads authored artifacts from `simplified-framework/artifacts/` and runtime state from the database, then renders practice and story-reading experiences.

## Canonical Docs

- `../docs/instructional-design.md` — instructional model and learner assumptions
- `../docs/tech-reference.md` — stable technical/system reference

## Current Model

The app has two student-facing modes:

- `practice` — shared flaw practice
- `stories` — scaffolded reading with inline thinking quizzes

Story content is discovered from paired `transcript.yaml` and `lesson_package.yaml` artifacts under `../artifacts/{story_id}/{episode_id}/`.

## Runtime Contract

- No real-time LLM calls.
- The app reads authored YAML artifacts from disk.
- Runtime progress and results live in the database.
- The catalog is artifact-driven, not config-driven.

## Stack

- Next.js App Router
- React + TypeScript
- Prisma + SQLite
- Zod for runtime parsing of authored artifacts

## Main Routes

| Route | Purpose |
| --- | --- |
| `/` | Home / student entry |
| `/practice` | Practice picker |
| `/practice/[flaw_id]` | Practice exercise |
| `/stories` | Story catalog |
| `/runs/[runId]/scene/[n]` | Reader scene view with inline quiz access |

## Setup

```bash
npm install
npx prisma migrate dev
npm run dev
```

## Environment

- `DATABASE_URL` — SQLite URL. Default in `.env` is `file:./dev.db`.

## Artifact Loading

The app loads:

- `transcript.yaml` for student-facing reading content
- `lesson_package.yaml` for episode framing, prompts, options, feedback, and takeaways
- `practice_package.yaml` for shared flaw practice

Artifact parsing and eligibility checks live in `src/lib/`.

## Notes

- The app expects authored content to already be complete and validated upstream.
- Practice and story experiences are intentionally lightweight and readable for middle school students.
