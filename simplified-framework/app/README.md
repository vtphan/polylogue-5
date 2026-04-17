# Simplified Framework App

Dedicated app for the simplified framework. Implements the full session flow: student identity selection, transcript reading, modeled and guided warm-ups, challenge levels with bounded retry, restrained badge-style rewards with a lifeline-gated bonus, and a completion surface.

## Canonical docs

- `../docs/instructional-design.md` — conceptual framework, student journey, pedagogical mechanics, authoring surface
- `../docs/tech-reference.md` — stack, directory map, Prisma data model, artifact → runtime contract, phase state machine, change recipes

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

## Routes

| Route                          | Purpose                                            |
| ------------------------------ | -------------------------------------------------- |
| `/`                            | Group selection                                    |
| `/groups/[groupId]`            | Student selection (immediate-select)               |
| `/runs/[runId]/entry`          | Episode entry (title, intro, setting)              |
| `/runs/[runId]/read`           | Transcript reading + Continue                      |
| `/runs/[runId]/warmup`         | Modeled warm-up → guided warm-up → guided reveal   |
| `/runs/[runId]/level`          | Level question → retry (if eligible) → feedback; also the completion handoff |

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

Tables (Prisma schema in `prisma/schema.prisma`):

- `session_runs` — one row per (config, episode, group, student, attempt). Partial unique index ensures at most one `status = 'in_progress'` row per tuple; completed rows are unbounded so the same student can replay.
- `warmup_progress` — 1:1 with a run; tracks modeled + guided warm-up state.
- `level_responses` — one row per (run, level); holds initial/final answers, retry-eligibility state, hint-usage, and lock timestamp.
- `scaffold_events` — append-only hint-open log with unique `(run_id, level_id, step_key)`.

Enums (enforced at the application layer via Zod):

- `status`: `in_progress` | `complete`
- `current_phase`: `read` | `warmup` | `level` | `complete`

See `../docs/tech-reference.md` §4 for field-level detail and derived state helpers.
