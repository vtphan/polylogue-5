# Polylogue v5 App

Student-facing Next.js runtime for Polylogue v5.

The app is deterministic at student time. It does not call LLMs. It reads authored artifacts from `v5/artifacts/` and runtime state from SQLite + Prisma, then renders the scene reader and three-step reasoning quizzes.

## Canonical Docs

- `../docs/architecture.md` §2.5 — app layer, runtime invariants
- `../docs/instructional-design.md` §5–6 — three-step quiz, student journey

## Setup

```bash
npm install
npx prisma migrate dev
npm run dev
```

## Environment

- `DATABASE_URL` — SQLite URL. Default in `.env` is `file:./dev.db`.

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Profiles + episode progress |
| `/stories` | Episode picker |
| `/runs/[runId]/scene/[n]` | Scene reader with three-step quiz |

## Artifacts

The app discovers episodes by scanning `v5/artifacts/{story_id}/{episode_id}/` for paired `lesson_package.yaml` + `transcript.yaml`, both of which must parse through the v5 Zod schemas and share turn ids.

Story metadata (title, premise) is read from `v5/stories/{story_id}/story.yaml`.
