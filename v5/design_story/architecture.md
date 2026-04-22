# Story-Design Webapp — Architecture (Draft)

> **Status:** first-cut draft, 2026-04-21. This document proposes a webapp implementation of the v5 `/design_story` authoring workflow. It is design-only — no implementation has started. Open questions are collected in §8.

## 1. Purpose

Polylogue v5 ships `/design_story` as a Claude Code slash command. That implementation assumes the author is a Claude Code operator with CLI fluency. This webapp is an alternative implementation of the same authoring workflow — same doctrine, same artifact contract, same approval gate — exposed through a browser so that non-operator authors can co-design stories without touching the CLI.

**Key framing.** The webapp is a *second implementation* of the same authoring doctrine, not a replacement for the slash command and not an extension of the pipeline. Both implementations produce the same `stories/{story_id}/story.yaml` and `stories/{story_id}/story-design-review.md`. Downstream commands (`/create_transcript`, `/create_lesson_package`) and the student-facing app consume those artifacts and don't know or care which implementation produced them.

## 2. Relationship to v5

### 2.1 What this app owns

- A browser UI for co-designing stories (Phases A–D, chat-driven).
- A server process running the Claude Agent SDK as the orchestrator.
- Filesystem I/O that reads reference material and writes the two output artifacts.

### 2.2 What this app does not own

- Story-design doctrine (persuasive-thread discipline, awareness-not-checklist, lens coverage, reading-time heuristic, narrator convention, audience fit). Doctrine is pipeline-wide; the webapp reads it, it does not author it.
- Downstream authoring (transcripts, lesson packages). Those remain Claude Code commands.
- The student-facing runtime (`v5/app/`).

### 2.3 Doctrine and orchestration separation

The authoring doctrine is shared across both implementations and lives in a single canonical doc: **`v5/docs/story-design-doctrine.md`**. Each implementation wraps it with runtime-specific orchestration:

- `v5/pipeline/commands/design_story.md` — Claude Code slash-command surface (rerun flow, CLI conversation shape). Reads the doctrine at session start.
- `v5/design_story/orchestrator-prompt.md` — Agent SDK system prompt for the webapp (turn model, scoped tools, seed-to-Phase-A pattern, response contract). Server loads this + the doctrine into the SDK's system prompt.

This three-way split keeps the doctrine as one source of truth while letting each implementation own its own orchestration layer without conflating the two.

### 2.4 Artifact contract

Unchanged from v5. The webapp writes:

- `v5/stories/{story_id}/story.yaml` — schema: `v5/schemas/story.yaml`
- `v5/stories/{story_id}/story-design-review.md` — template: doctrine doc (once promoted)

Validation is unchanged: `v5/pipeline/scripts/validate_story.py` runs at Phase D serialize time, same as the command.

## 3. Runtime Shape

### 3.1 Process topology

```
┌──────────────┐    HTTP + SSE     ┌───────────────────┐   query()    ┌──────────────┐
│   Browser    │ ────────────────► │  Next.js server   │ ───────────► │  Agent SDK   │
│   (React)    │ ◄──────────────── │  (API routes)     │ ◄──────────  │  (orchestr.) │
└──────────────┘                   └────────┬──────────┘              └──────┬───────┘
                                            │                                 │
                                            │         scoped FS tools         │
                                            └─────────────────┬───────────────┘
                                                              ▼
                                                   ┌──────────────────┐
                                                   │  v5/ filesystem  │
                                                   │  (artifacts,     │
                                                   │   reference)     │
                                                   └──────────────────┘
```

- **Browser** — chat pane, artifact preview pane, gate actions. Plain React.
- **Next.js server** — hosts API routes; each user message hits one route; route invokes the Agent SDK for a single-turn query, streams tokens back to the browser via SSE.
- **Agent SDK** — runs the orchestrator loop for that turn. Uses scoped filesystem tools provided by the server rather than unrestricted Read/Edit/Write.
- **Filesystem** — the `v5/` repo tree. Reads from `reference/`, `schemas/`, `docs/`. Writes to `stories/{story_id}/`.

### 3.2 Tech stack (proposed)

Consistent with `v5/app/`:

- Next.js + React + TypeScript for UI and API routes (single process).
- `@anthropic-ai/claude-agent-sdk` for orchestration.
- Direct filesystem I/O for artifact storage. No database for this MVP.

Trade-off: no database means single-machine / single-user for now. Multi-user and hosted deployment are §8 open questions.

## 4. Session and State Model

The load-bearing split: **artifacts are durable state; chat is ephemeral working memory.**

### 4.1 State categories

| State | Lifetime | Storage | Authority |
|---|---|---|---|
| Doctrine | Permanent | `v5/docs/story-design-doctrine.md` | Project-wide |
| Reference (taxonomy, schema) | Permanent | `v5/reference/`, `v5/schemas/` | Project-wide |
| Committed artifact state | Durable | `v5/stories/{story_id}/*.yaml,*.md` | The story itself |
| Phase buffer | Ephemeral (within a sitting) | Server memory | The current chat session |
| UI state (scroll, selection) | Ephemeral | Browser | The current tab |

### 4.2 Turn construction (Shape B)

Each user message triggers one stateless Agent SDK call. The server assembles the full turn from scratch every time; the SDK holds no session memory. Prompt arrangement:

```
SYSTEM (stable across the whole session, fully cacheable):
  - orchestrator-prompt.md
  - story-design-doctrine.md
  - reasoning-taxonomy.yaml
  - story.yaml schema

USER (assembled fresh per turn):
  ## Current state
    - current phase marker
    - in-flight story.yaml (YAML content)
    - phase buffer: last N turns of in-phase conversation
  ## Message
    - user's latest prompt
```

The system role holds only implementation-invariant content; it is byte-identical across every turn of every session of every story, which lets Anthropic's prompt cache hit at near-100% on the prefix. Everything turn-variant (phase, artifact state, recent dialog) lands in a structured user-role preamble before the user's actual message. This has three consequences:

- **No SDK-side session state.** The server does not pass a `session_id` to resume an SDK conversation. Each call is a fresh `query()`. Artifact state + phase buffer together carry everything the agent needs.
- **Debuggability.** "What did the agent see on turn N?" is one user-role message; no hidden history to reconstruct.
- **Trivial resume.** Page reloads, new sessions, or server restarts rehydrate from `v5/stories/{sid}/` files + an empty phase buffer. Nothing is lost because nothing load-bearing lived in SDK memory.

### 4.3 Phase boundaries

Phases A–D are serialization points. At the end of each phase, the agent serializes the committed work to the artifact (writing partial `story.yaml` state as phases complete), and the phase buffer is flushed. On resume (new session, page reload, next day), the agent rehydrates from the artifact and the buffer starts empty — no context loss because all load-bearing content is in the artifact.

This is the same discipline v5 already uses between commands; the webapp applies it between phases within one command.

### 4.4 Gate discipline

Phase D approval is an **explicit user action** in the UI, not something the agent can do on the user's behalf. When the user clicks approve, the server writes `Status: approved` into `story-design-review.md`. The agent can produce the review findings and propose the sign-off line, but cannot write `approved` itself. This mirrors the human-in-the-loop approval gate from the Claude Code implementation.

## 5. Tool Surface

The Agent SDK gets scoped tools, not raw filesystem access.

| Tool | Purpose |
|---|---|
| `read_reference(name)` | Read `docs/`, `reference/`, `schemas/` content. Read-only. |
| `list_stories()` | Inventory existing stories. |
| `read_story(story_id, filename)` | Read committed artifact content for a story. |
| `write_story(story_id, filename, content)` | Write/overwrite an artifact file. |
| `validate_story(story_id)` | Run `validate_story.py`; return pass/fail + diagnostics. |
| `request_approval(story_id)` | Surface a UI prompt asking the user to review and approve Phase D. Cannot set `Status: approved` directly. |

This gives the server authority over what files the agent can touch, prevents cross-story leakage, and lets the server enforce write atomicity.

## 6. UI Surfaces

### 6.1 Main layout

```
┌──────────────────────────────┬──────────────────────────────┐
│                              │                              │
│     Chat pane                │     Artifact preview         │
│     (user ⇄ orchestrator)    │     (live story.yaml +       │
│                              │      review.md when open)    │
│                              │                              │
├──────────────────────────────┼──────────────────────────────┤
│  Phase: A • B • C • D        │  [ Approve ]  [ Revise ]     │
│                              │  (enabled only at Phase D)   │
└──────────────────────────────┴──────────────────────────────┘
```

### 6.2 Screens

- **Landing / story picker** — list existing stories (with state badge: in-progress / approved), "New story" button.
- **Design session** — layout above. Active co-design of one in-progress story.
- **View mode** — preview-only layout (artifact pane only, no chat, no approve controls). Available for any story regardless of state.
- **Review & approve** — Phase D modal showing `story-design-review.md` in rendered form + explicit approve/reject controls.

### 6.3 Story states and mode availability

| State | Condition | Available modes |
|---|---|---|
| Fresh | No story selected | Landing / picker |
| In-progress | `story.yaml` exists; `story-design-review.md` missing or not `Status: approved` | Design + View |
| Approved | `story-design-review.md` has `Status: approved` | **View only** |

**Approved-lock invariant.** Once a story is approved, the app opens it in view mode only. Design-mode entry is disabled. This protects downstream artifacts (transcripts, lesson packages authored by Claude Code commands) from retroactive story edits that would invalidate them. To change an approved story, the author must re-run the equivalent of v5's rerun flow (clear and redesign); this is not a silent in-place edit path.

Rationale mirrors the rerun discipline in `v5/docs/operator-workflow.md` §4: approved upstream artifacts are never silently mutated.

### 6.4 What the UI does not do

- No form-based authoring of story fields. Fields are populated through conversation; the artifact preview is read-only.
- No inline artifact editing. If the author wants to change a committed value, they ask the agent in the chat pane.
- No batch or "autopilot" phase completion. The author drives the conversation at their pace.

This is the load-bearing UI restraint: the moment the UI exposes direct field editing, the v5 "co-design over form-fill" doctrine collapses.

## 7. Non-goals

- **Multi-user / multi-tenant.** MVP is explicitly single-user, single-machine. All filesystem writes target the local repo tree. Multi-user editing, auth, and hosted deployment are deferred to a post-MVP iteration.
- Authentication / auth.
- Hosted / multi-tenant deployment.
- Web UIs for `/create_transcript` or `/create_lesson_package` — explicitly out of scope for this app. If those need web UIs later, they get their own peer directories.
- Real-time collaboration features.
- Student-facing rendering (that lives in `v5/app/`).

## 8. Open Questions

1. ~~**Doctrine promotion.**~~ Done 2026-04-21 (see §2.3).
2. **Phase-buffer size.** How many turns of in-phase chat to keep before truncating or summarizing? Related: does the agent get a tool to "flush chat into a note" if the conversation is long?
3. ~~**Session resume model.**~~ Resolved by Shape B (§4.2): rehydrate from artifacts, chat buffer starts empty. No phase-buffer persistence across sessions.
4. ~~**Streaming discipline.**~~ SSE per turn. Shape B's one-turn-per-`query()` model maps cleanly to POST-and-stream.
5. ~~**Single-user assumption.**~~ Done 2026-04-21: MVP is single-user / single-machine (see §7).
6. **Artifact previews during phases A–B.** Phase A produces premise + characters; Phase B produces the episode map. Pragmatic default for MVP: serialize incrementally (write partial `story.yaml`) and only run the validator at Phase D serialize. Revisit if partial files prove problematic.
7. ~~**Validator integration.**~~ Done 2026-04-21: server spawns `validate_story.py` as a subprocess; one source of truth, no duplicated contract.
8. ~~**Tech stack confirmation.**~~ Done 2026-04-21: Next.js + React + TypeScript + Tailwind, single process.

## 9. Next Steps (proposed)

1. ~~Confirm directory placement and tech stack.~~ Confirmed 2026-04-21: `v5/design_story/`, Next.js + React + TypeScript + Tailwind.
2. ~~Promote the story-design doctrine.~~ Done 2026-04-21 (see §2.3).
3. Resolve §8 questions 5, 6 (structural decisions) in a short design pass.
4. Draft the scoped-tool API contract (§5) in detail.
5. Stand up a scaffolded Next.js app with chat pane, static artifact preview, and a stub Agent SDK integration — no doctrine or phase logic yet, just the end-to-end round-trip.
6. Layer in phase logic, serialization, and the approval gate.

## 10. Cross-references

- `v5/docs/story-design-doctrine.md` — **canonical authoring doctrine** (shared by both implementations).
- `v5/design_story/orchestrator-prompt.md` — Agent SDK system prompt for the webapp.
- `v5/pipeline/commands/design_story.md` — Claude Code slash-command surface.
- `v5/docs/architecture.md` — system architecture; §3 pipeline shape and artifact contracts.
- `v5/docs/instructional-design.md` — story-design pedagogy; §3 story design.
- `v5/schemas/story.yaml` — output artifact contract.
- `v5/reference/reasoning-taxonomy.yaml` — taxonomy the orchestrator holds for awareness.
