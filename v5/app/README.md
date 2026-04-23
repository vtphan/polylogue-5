# Polylogue v5 App

Student-facing Next.js runtime for Polylogue v5.

The app is deterministic at student time. It does not call LLMs. It reads authored artifacts from `v5/artifacts/` and runtime state from SQLite + Prisma, then renders the scene reader and three-step reasoning quizzes.

## Canonical Docs

- `../docs/architecture.md` §2.5 - app layer, runtime invariants
- `../docs/instructional-design.md` §5-6 - three-step quiz, student journey

## New Developer Setup

Prerequisites:

- Node.js and npm installed locally
- Node.js 20+ recommended for the current Next.js and Prisma toolchain
- Prisma 6 is used in this app

From this directory (`v5/app`), install dependencies, create the local database, and start the dev server:

```bash
npm install
cp .env.example .env
npx prisma migrate dev
npm run dev
```

Then open `http://localhost:3000`.

Important:

- run `npm install` before any `npx prisma ...` command
- this project is pinned to Prisma 6, and `npm install` ensures `npx prisma` uses the local project version instead of downloading Prisma 7
- Prisma CLI needs `DATABASE_URL` in a real environment file such as `.env`; the fallback in `src/lib/db.ts` only helps the running app, not `prisma migrate dev`

## First Run

On first launch, the app will:

- create a local SQLite database at `prisma/dev.db`
- scan `../artifacts/` and `../stories/` for available episodes
- prompt you to create a local student profile in the browser

You do not need API keys or LLM access to run the app.

## Environment

- `DATABASE_URL` - optional SQLite URL
- if `DATABASE_URL` is not set, the app falls back to `file:./dev.db`

For Prisma CLI commands, create `.env` in this folder or copy `.env.example`:

```bash
cp .env.example .env
```

Contents:

```bash
DATABASE_URL="file:./dev.db"
```

## Clear Data And Start Fresh

This app stores local runtime data in `prisma/dev.db`. That includes:

- student profiles
- reading progress
- quiz attempts
- synced catalog rows derived from the authored artifacts

To wipe all local app data and recreate a clean database:

```bash
npm install
cp .env.example .env
rm -f prisma/dev.db prisma/dev.db-journal
npx prisma migrate dev
```

Then restart the dev server with `npm run dev` and open `http://localhost:3000` again.

If you want to confirm the Prisma CLI version before migrating, run:

```bash
npx prisma --version
```

It should report Prisma 6.x for this project.

If you only changed story artifacts and want the app to pick them up, you usually do not need a reset. In development, the catalog re-syncs from the filesystem automatically.

## Useful Commands

```bash
npm run lint
npm run build
```

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Profiles + episode progress |
| `/stories` | Episode picker |
| `/runs/[runId]/scene/[n]` | Scene reader with three-step quiz |

## Artifacts

The app discovers episodes by scanning `v5/artifacts/{story_id}/{episode_id}/` for paired `lesson_package.yaml` + `transcript.yaml`, both of which must parse through the v5 Zod schemas and share turn ids.

Story metadata (title, premise) is read from `v5/stories/{story_id}/story.yaml`.
