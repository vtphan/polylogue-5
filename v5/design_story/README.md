# Story-Design Webapp

A browser-based authoring app for v5 story design. This is the **alternative implementation** of the `/design_story` workflow — same doctrine, same artifact contract, same approval gate as the Claude Code slash command, but reachable through a web UI and driven by the `claude` CLI under the hood so it runs on a Claude Max subscription instead of per-token API billing.

## What this app is for

Polylogue v5 authors stories through a human-in-the-loop co-design conversation with an orchestrator. v5 has two implementations of that conversation:

| Implementation | Surface | Audience |
|---|---|---|
| `v5/pipeline/commands/design_story.md` | Claude Code slash command | Operators running the full pipeline in a terminal |
| `v5/design_story/` (this app) | Browser UI at `http://localhost:3000` | Any author comfortable in a browser |

Both produce the same output artifacts — `v5/stories/{story_id}/story.yaml` and `v5/stories/{story_id}/story-design-review.md` — and both enforce the same authoring doctrine. Downstream v5 commands (`/create_transcript`, `/create_lesson_package`) consume those artifacts without knowing or caring which implementation produced them.

The webapp explicitly does **not** cover the downstream stages — only Phase A through D of `/design_story`.

## How it relates to the `/design_story` command

The two implementations share **one canonical source of truth**:

```
v5/reference/story-design-doctrine.md ← single source of truth (shared)
v5/reference/reasoning-taxonomy.yaml  ← shared
v5/schemas/story.yaml                 ← shared
        ▲                       ▲
        │                       │
v5/pipeline/commands/            v5/design_story/
  design_story.md                  orchestrator-prompt.md
  (Claude Code surface)            (Agent surface for webapp)
```

Each implementation's surface file is a thin wrapper that loads the shared doctrine and describes its own runtime-specific orchestration — rerun flow, tool surface, turn model. When doctrine tightens, it tightens in one place for both.

Full relationship + architecture: see [`architecture.md`](architecture.md).

## How the app works

One Next.js process hosts both the browser UI and the API routes. Each chat turn:

1. Browser POSTs the user's message to `/api/chat`.
2. Server composes a **system prompt** (orchestrator role + doctrine + taxonomy + schema) and a **user-role preamble** (current phase, in-flight `story.yaml`, last N turns of chat).
3. Server spawns `claude -p "<preamble + message>" --output-format stream-json --verbose --append-system-prompt "<composed>"` as a subprocess.
4. Subprocess output streams back to the browser as SSE events.
5. After the stream ends, the server parses the agent's reply for commit sentinels (see below) and persists any new artifact state to disk.

Authentication is handled by the `claude` CLI's OAuth credentials (Max subscription). The server explicitly unsets `ANTHROPIC_API_KEY` in the subprocess environment to guarantee subscription billing and prevent accidental API charges.

### Commit sentinels

The agent has no direct write access. To persist artifact state, it emits fenced code blocks in its conversational reply:

````
```commit:story.yaml
<full story.yaml content>
```

```commit:story-design-review.md
<full review.md content>
```
````

The server extracts each block after the stream ends and writes it to `v5/stories/{story_id}/{filename}`. For `story.yaml` commits the server additionally post-processes the YAML to fill in `word_count_range` per episode from `reading_time_minutes` (doctrine §2.5, `(rtm ± 1) × 150` words).

### Approval gate

Phase D approval is a UI action, not an agent action. The agent commits `story-design-review.md` with `Status: revise`. The author clicks **Approve story** in the artifact pane; the server validates `story.yaml` and — on pass — flips `Status: revise` → `Status: approved`, filling in the date placeholder.

## Tech stack

- **Next.js 15 + React 19 + TypeScript** — single process hosts UI and API routes
- **Tailwind CSS** — styling
- **`yaml`** — YAML parsing / serialization for server-side artifact post-processing
- **`claude` CLI subprocess** — the orchestrator. Not the Anthropic SDK.

## Run it

Prerequisites:

- `claude` CLI installed and authenticated (`claude auth login`) with a Claude Max subscription.
- Node 20+.

```bash
cd v5/design_story
npm install
npm run dev
# open http://localhost:3000
```

No `.env` file is required. The `.env.example` exists only to document that `ANTHROPIC_API_KEY` is **not** used — the app uses the CLI's OAuth credentials to ensure subscription billing.

## Directory map

```
v5/design_story/
├── README.md                         (this file)
├── architecture.md                   webapp runtime architecture
├── orchestrator-prompt.md            Agent system prompt (Agent-SDK-style; applies to the claude subprocess)
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
├── postcss.config.mjs
├── .env.example                      documents that no env is needed
├── app/
│   ├── layout.tsx
│   ├── page.tsx                      thin entry; renders <AppShell />
│   ├── globals.css
│   └── api/
│       ├── chat/route.ts             POST: streams a claude turn; parses commit blocks after stream-end
│       ├── story/route.ts            GET: returns story.yaml + review.md + approval status
│       └── approve/route.ts          POST: validates + flips review.md Status to approved
├── components/
│   ├── AppShell.tsx                  client shell; holds refresh signal between chat and artifact
│   ├── ChatPane.tsx                  chat input + streaming assistant bubble
│   └── ArtifactPane.tsx              story.yaml + review.md preview, Approve button
└── lib/
    ├── session.ts                    in-memory session state (storyId, phase, phaseBuffer)
    ├── paths.ts                      v5/stories/{storyId}/story.yaml helpers
    ├── systemPrompt.ts               composes the stable --append-system-prompt string
    ├── preamble.ts                   composes the turn-variant user-role preamble
    ├── commitParser.ts               extracts ```commit:<filename>``` fenced blocks
    ├── wordCount.ts                  post-processes story.yaml to add word_count_range
    └── validateStory.ts              MVP TypeScript validator (pending canonical Python validator)
```

## Current status

**Working:**

- Seed → Phase A draft → operator approval → Phase A commit → disk
- Multi-turn continuity via the Shape B user-role preamble (doctrine, in-flight `story.yaml`, last 10 turns of chat)
- `story.yaml` commit with server-side `word_count_range` post-processing
- `story-design-review.md` commit during Phase D
- Approve button → validate → flip `Status: approved` with today's date

**Deferred (on the roadmap):**

- **Story picker / multi-story support.** Currently single active story at a time; the session is in-memory and resets on dev-server restart. Resuming an existing story isn't wired.
- **Phase advancement UI.** The server tracks `session.phase` but there's no UI control to advance A→B→C→D. The agent has been advancing conversationally without it, which works but means the preamble marker doesn't always reflect reality.
- **Canonical validator.** The current validator is a minimal TypeScript implementation in `lib/validateStory.ts`. It will be swapped for a subprocess call to `v5/pipeline/scripts/validate_story.py` once that script is written.
- **View-only mode for approved stories** (architecture §6.3).
- **Scoped MCP tools.** The commit-sentinel mechanism is a stand-in; a future iteration may swap it for a proper MCP tool surface (`write_story`, `validate_story`, `request_approval`).

## Cross-references

- Shared doctrine: [`../reference/story-design-doctrine.md`](../reference/story-design-doctrine.md)
- v5 system architecture: [`../docs/architecture.md`](../docs/architecture.md)
- Instructional pedagogy: [`../docs/instructional-design.md`](../docs/instructional-design.md)
- Output schema: [`../schemas/story.yaml`](../schemas/story.yaml)
- Reasoning taxonomy: [`../reference/reasoning-taxonomy.yaml`](../reference/reasoning-taxonomy.yaml)
- Claude Code slash-command surface: [`../pipeline/commands/design_story.md`](../pipeline/commands/design_story.md)
- Webapp runtime architecture: [`architecture.md`](architecture.md)
- Agent system prompt: [`orchestrator-prompt.md`](orchestrator-prompt.md)
