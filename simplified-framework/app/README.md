# Simplified Framework App — Milestone 1

This is the dedicated app for the simplified framework. **Milestone 1 scope only:**
student identity selection, episode entry, transcript reading, and the transition
into `current_phase = warmup`. Warm-ups, challenge levels, rewards, and completion
screens are intentionally not implemented yet.

## Canonical docs

- `../docs/app-design.md` — product and interaction design (source of truth)
- `../docs/technical-spec.md` — artifact and runtime contracts
- `../docs/framework-model.md` — pedagogical framework

## Runtime contract

- No real-time LLM calls. All lesson content is prepared upstream.
- Runtime state comes from `transcript.yaml`, `lesson_package.yaml`, the active
  config on disk, and persisted database state.
- Active config is read directly from disk; rosters are **not** mirrored into DB
  tables in Milestone 1.
- The database is the source of truth for run state (student work can resume on
  another device).

## Stack

- Next.js App Router, React, TypeScript
- Prisma + SQLite (`prisma/dev.db`)
- Zod for runtime schema parsing of YAML/JSON artifacts

## Routes (Milestone 1)

| Route                          | Purpose                               |
| ------------------------------ | ------------------------------------- |
| `/`                            | Group selection                       |
| `/groups/[groupId]`            | Student selection (immediate-select)  |
| `/runs/[runId]/entry`          | Episode entry (title, intro, setting) |
| `/runs/[runId]/read`           | Transcript reading + Continue         |
| `/runs/[runId]/warmup`         | Milestone 2 placeholder               |

## Setup

```bash
npm install
npx prisma migrate dev      # creates prisma/dev.db + applies the migration
npm run dev                 # http://localhost:3000
```

## Environment

- `DATABASE_URL` — SQLite URL. Default in `.env` is `file:./dev.db`.
- `POLYLOGUE_CONFIG_PATH` — override for the active config path. Absolute, or
  relative to `simplified-framework/`. Default is
  `configs/forest-ep01-table-a.json`.

## Config shape (v1)

```jsonc
{
  "config_id": "forest-ep01-table-a",
  "episode": {
    "source": "simplified-framework/artifacts/strangers-in-the-old-forest/episode_01"
  },
  "groups": [
    {
      "group_id": "group-a",
      "name": "Table A",
      "students": [{ "student_id": "ava", "name": "Ava" }, ...]
    }
  ]
}
```

`episode.source` is repo-relative; the loader reads
`{episode.source}/transcript.yaml` and `{episode.source}/lesson_package.yaml`.

## Database

Milestone 1 uses a single table:

- `session_runs` — one row per (config, episode, group, student, status).
  Unique on `(config_id, episode_source, group_id, student_id, status)` so
  there is at most one `in_progress` row per tuple; resume reopens it.

Enums (enforced at the application layer via Zod):

- `status`: `in_progress` | `complete`
- `current_phase`: `read` | `warmup` | `level` | `complete`

Later milestones will add `warmup_progress`, `level_responses`, and
`scaffold_events` per `app-design.md` §11.13.
