# TODO v3

> **DRAFT — 2026-04-19.** Supersedes `todo-v2.md` (frozen). Two tasks only. Earlier drafts carried scaffold-field speculation, reader redesign prose, and design-record material; those are out of scope now and have been removed. Git history has the expanded draft if any prior prose is needed.

> **UI freeze (in effect).** The app's interface is frozen. No changes to layout, navigation, page structure, component styling, color / spacing tokens, typography, or existing-surface CSS — including incidental changes made while landing these tasks — without **explicit operator approval**. Task 2 below requires rendering a new field on `/stories`; that's a UI change and must be approved before implementation. Everything else in the app — scene reader, quiz panel, bottom nav, practice mode, profile flow — is settled.

## Motivation

v3 scope is narrow:

1. **Remove `kind: action` turns** from the pipeline and the app's type contract. Action beats drifted into long narration paragraphs that competed with dialog for attention; they are out.
2. **Surface the already-authored `story.premise`** to the app so `/stories` can render story-level framing.

That's the whole scope. Everything else is out — see **Out of scope** at the bottom.

---

## Task 1 — Remove `kind: action` turns

**Current state.** The runtime filter in `ContinuousSceneReader.tsx` already skips action turns so the reader is clean. The pipeline agents, validators, and the app's Zod contract still accept or emit them. The cleanup below closes the drift.

### Upstream (pipeline) — agents

- **`pipeline/agents/screenwriter.md`** — stop emitting action turns. Install a "transcripts stand on their own" mandate: setting, physical action, silence, and emotional register all travel through the dialog itself; no stage directions. Starting prose for the mandate is in git history at commit `c81404c` (§5 of the earlier v3 draft); pull from there when editing the agent file.
- **`pipeline/agents/flaw_injector.md`** — drop any action-preserve guidance. Injector no longer touches action turns because they cannot exist.

### Upstream (pipeline) — canonical docs + schemas + command prompts

Codex 2026-04-19 flagged that action-turn references are still spread across the authoring contract. All of the following describe `kind: action` as valid and must be updated in the same pass that tightens the validator, or the checked-in contract contradicts itself:

- `simplified-framework/docs/instructional-design.md:139, 186` — "turns may be `kind: dialog` or `kind: action`" / "action turns are exempt from transcript FK aggregation." Reduce to dialog-only; drop the exemption clause.
- `simplified-framework/docs/tech-reference.md:96, 102, 122` — same language. Reduce to dialog-only; the "levels must target dialog turns" clause at line 122 is trivially satisfied and can stay as defense-in-depth.
- `simplified-framework/schemas/transcript.yaml:10, 56` — header comment references action turns; `enum: [dialog, action]` on the `kind` field. Tighten to `enum: [dialog]` (or drop `kind` entirely with a constant default), and rewrite the header comment.
- `simplified-framework/pipeline/commands/create_transcript.md:97` — instructs the screenwriter to "build strong scenes with clear transitions, sensory grounding, and **action beats** where useful." Remove the action-beats phrase; align with the new screenwriter mandate.
- `simplified-framework/schemas/episode-plan.yaml` + `pipeline/commands/*.md` — sweep for any narrative-texture language that implied action beats were a required authoring output.

### Upstream (pipeline) — validators

- **`pipeline/scripts/validate_transcript.py:162`** — make `kind: action` a **hard error**. Any action turn in a transcript fails the gate.
- **`pipeline/scripts/validate_lesson_package.py`** — keep the "level cannot target an action turn" rule as defense-in-depth; update the error message for clarity.

### Active-corpus cleanup (gating condition for validator tightening)

Every checked-in non-archived transcript currently contains action turns:

- `artifacts/the-white-squirrel/episode_01/transcript.yaml` — 17 action turns.
- `artifacts/the-white-squirrel/episode_02/transcript.yaml` — 14 action turns.
- `artifacts/the-white-squirrel/episode_03/transcript.yaml` — 13 action turns.

**All three must be re-authored** (absorbing load-bearing atmosphere into dialog per the screenwriter mandate) before `validate_transcript.py` can be tightened; otherwise every active artifact stops validating on the next run. The runtime filter keeps the reader clean today, so there is no user-visible pressure — pressure is entirely on the validator-flip ordering below.

### Downstream (app contract cleanup)

After upstream validators reject action turns and all active transcripts are clean, three app-side files still carry dead handling for them:

- **`app/src/lib/domain.ts:8`** — tighten `transcriptTurnSchema.kind` from `z.enum(["dialog", "action"]).default("dialog")` to `z.literal("dialog").default("dialog")`. Drop the `"action turns must omit speaker"` refinement branch.
- **`app/src/lib/catalog.ts:88-114`** — simplify `isEligibleEpisodePair`: drop the `dialog | action` kind branch and keep only the one-level-per-scene uniqueness check.
- **`app/src/app/runs/[runId]/_components/ContinuousSceneReader.tsx`** — drop the `turns.filter((turn) => turn.kind !== "action")` line. Dead code once upstream guarantees no action turns.

### Ordering

Two viable sequences; operator picks:

- **Path A (clean, slower).** Re-author ep01/ep02/ep03 → update docs/schemas/command prompts → tighten `validate_transcript.py` + `domain.ts` + `catalog.ts` + reader filter in one pass. Source of truth is consistent at every step.
- **Path B (incremental).** Keep `validate_transcript.py` and `domain.ts` permissive as a grace period while the three transcripts are re-authored one at a time. Update docs/schemas last, together with the final validator flip. Minimizes blockage but leaves the contract briefly inconsistent.

Either way, validator tightening is the **last** step, gated on all three active transcripts being clean. Do not flip the validator while `the-white-squirrel` still has action turns on disk.

---

## Task 2 — Surface `story.premise` to the app

**Field is already in contract.** No new schema work needed:

- `simplified-framework/schemas/story.yaml:10` lists `premise` as required.
- `simplified-framework/pipeline/scripts/validate_story.py:23` enforces it.
- `simplified-framework/pipeline/commands/create_story.md:49` documents it.
- `simplified-framework/pipeline/agents/story-designer.md:39` emits it.

**Pending work is app-side wiring only.**

Codex 2026-04-19 flagged that `premise` is a *story-level* fact and must not be denormalized onto `CatalogEpisode`: `/stories` currently groups rows by `storyTitle` (a display string, not canonical), so a per-episode `premise` column would either repeat the same value N times with no single read-source, or collide if two stories shared a title. The wiring below uses a dedicated `CatalogStory` table and switches grouping to `storyId` so `premise` has one owner.

1. **Extend the catalog read.** `app/src/lib/catalog.ts:43` (`loadStoryTitles`) already reads `stories/{story_id}/story.yaml` at catalog-sync time for the title. Rename to `loadStoryMetadata`; return `{ storyId, title, premise }` per story.
2. **Introduce a `CatalogStory` Prisma model.** Keyed by `storyId` (unique). Columns: `storyId`, `title`, `premise`. Populated inside `syncCatalogFromFilesystem` alongside the existing `CatalogEpisode` upsert loop. Run `prisma migrate`. Do **not** add `premise` to `CatalogEpisode` — `premise` is story-scoped.
3. **Switch `/stories` grouping from title to id.** `app/src/app/stories/page.tsx:53, 73, 84, 98` currently builds the grouping `Map` keyed by `storyTitle`. Change the key to `storyId` so grouping is canonical; render `storyTitle` as the heading's display label, pulled from `CatalogStory`.
4. **Render `premise` on `/stories`.** Subtitle / lead-in under each story heading, above the episode list. Uses the `CatalogStory.premise` value loaded alongside the title. **UI change — requires explicit operator approval per the freeze callout before implementation.**

No `story-info.yaml` artifact, no new agent, no new script. Catalog sync is the single path from authoring tree → Prisma → app. Note that step 3 is a grouping change to an existing surface; even though it's invisible when all story titles are unique (as they are today), it's still a UI-surface diff and so falls under the freeze — roll it into the same approval as step 4.

---

## Open questions (deferred)

Both are UI changes and therefore blocked on the freeze. Parked; not on the task list.

1. Scroll-triggered auto-open vs. click-to-toggle on the flagged turn.
2. Dim-opacity on reading column during quiz (currently 0.82 with restore-on-hover) vs. relying on the right-column color signaling alone.

---

## Out of scope

- **UI changes to the existing app** beyond what Task 2 explicitly needs, unless approved by the operator. The app interface is frozen.
- **Broader scaffold-field additions** — `episode.question_to_hold`, `transcript.characters[]` upgraded to objects with `one_liner`, `scene.setting`, `scene.watch_for`, `scene.vocabulary[]`. Speculative cognitive-load additions from earlier drafts; demo-scoped v3 stays on `scene.summary` alone.
- **Accessibility features** — focus management, screen-reader affordances, keyboard-only navigation, ARIA dialog semantics. Existing `aria-label` attributes in the code are incidental, not a commitment.
- **Keyboard shortcuts**, scroll-flagged-turn-into-center, catalog optimizations beyond what Task 2 requires.
- **Multi-episode story-level mechanics** (cross-episode recap surfaces, badges). v3 is single-episode scoped.
- **Teacher / dashboard surfaces.**
- **Any LLM-at-runtime feature.** Determinism from artifacts + Prisma is invariant per `CLAUDE.md`.
- **Practice-mode UI changes.** Practice is shipped-and-good in v2.
- **Migration of pre-v2 artifacts.** Regenerate, don't migrate.
