# TODO v3

> **Status — 2026-04-19: verification signed off.** Implementation complete and operator-verified; v4 now supersedes this plan. Supersedes `todo-v2.md` (frozen). Two tasks only. Earlier drafts carried scaffold-field speculation, reader redesign prose, and design-record material; those are out of scope now and have been removed. Git history has the expanded draft if any prior prose is needed.

> **UI freeze (in effect).** The app's interface is frozen. No changes to layout, navigation, page structure, component styling, color / spacing tokens, typography, or existing-surface CSS — including incidental changes made while landing these tasks — without **explicit operator approval**. Operator approval is granted for Task 2's narrow `/stories` change: render `story.premise` as a subtitle / lead-in under each story heading, with no other interface changes. Everything else in the app — scene reader, quiz panel, bottom nav, practice mode, profile flow — is settled.

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
- `simplified-framework/schemas/transcript.yaml:10, 56` — header comment references action turns; `enum: [dialog, action]` on the `kind` field. Remove `kind` entirely from the transcript contract and rewrite the header comment accordingly.
- `simplified-framework/pipeline/commands/create_transcript.md:97` — instructs the screenwriter to "build strong scenes with clear transitions, sensory grounding, and **action beats** where useful." Remove the action-beats phrase; align with the new screenwriter mandate.
- `simplified-framework/schemas/episode-plan.yaml` + `pipeline/commands/*.md` — sweep for any narrative-texture language that implied action beats were a required authoring output.

### Upstream (pipeline) — validators

- **`pipeline/scripts/validate_transcript.py:162`** — make any turn-level `kind` field a **hard error**. `kind` is no longer part of the transcript shape.
- **`pipeline/scripts/validate_lesson_package.py`** — once transcripts no longer carry `kind`, drop the action-turn-specific branch and keep only the paired-transcript existence + distinct-scene checks.

### Active-corpus cleanup (gating condition for validator tightening)

Every checked-in non-archived transcript currently contains action turns:

- `artifacts/the-white-squirrel/episode_01/transcript.yaml` — 17 action turns.
- `artifacts/the-white-squirrel/episode_02/transcript.yaml` — 14 action turns.
- `artifacts/the-white-squirrel/episode_03/transcript.yaml` — 13 action turns.

**All three must be re-authored** (absorbing load-bearing atmosphere into dialog per the screenwriter mandate) before `validate_transcript.py` can be tightened; otherwise every active artifact stops validating on the next run. The runtime filter keeps the reader clean today, so there is no user-visible pressure — pressure is entirely on the validator-flip ordering below.

**Lesson-package stability rule during re-authoring.** This transcript rewrite is **not** a lesson-package redesign pass. Keep the existing quiz-target contract stable while removing action turns:

- preserve every currently referenced `lesson_package.yaml -> levels[].turn_id` target in the paired transcript
- preserve the scene ownership of those 3 targeted turns so the distinct-scene invariant stays true without lesson-package edits
- if a targeted line must be rewritten, keep its `turn_id` on the rewritten dialog turn rather than retargeting the lesson package

If an episode cannot be cleaned while preserving those 3 target turns and their scene ownership, stop and explicitly widen scope to include `lesson_package.yaml` regeneration for that episode. That scope expansion is **not** part of v3 by default.

### Downstream (app contract cleanup)

After upstream validators reject transcripts that still carry `kind`, and all active transcripts are clean, three app-side files still carry dead handling for the old shape:

- **`app/src/lib/domain.ts:8`** — remove `kind` from `transcriptTurnSchema`. Every turn is dialog-shaped, so keep the required-speaker rule and drop the action-specific refinement branch entirely.
- **`app/src/lib/catalog.ts:88-114`** — simplify `isEligibleEpisodePair`: drop all turn-kind handling and keep only the one-level-per-scene uniqueness check.
- **`app/src/app/runs/[runId]/_components/ContinuousSceneReader.tsx`** — drop the `turns.filter((turn) => turn.kind !== "action")` line. Dead code once upstream guarantees no transcript carries `kind`.

### Ordering

Use **Path A**. Re-author ep01/ep02/ep03 → update docs/schemas/command prompts → tighten `validate_transcript.py` + `domain.ts` + `catalog.ts` + reader filter in one pass. Source of truth stays consistent throughout.

Validator tightening is the **last** step, gated on all three active transcripts being clean. Do not flip the validator while `the-white-squirrel` still has turns carrying the legacy `kind` field on disk.

---

## Task 2 — Surface `story.premise` to the app

**Field is already in contract.** No new schema work needed:

- `simplified-framework/schemas/story.yaml:10` lists `premise` as required.
- `simplified-framework/pipeline/scripts/validate_story.py:23` enforces it.
- `simplified-framework/pipeline/commands/create_story.md:49` documents it.
- `simplified-framework/pipeline/agents/story-designer.md:39` emits it.

**Pending work is app-side wiring only.**

Codex 2026-04-19 flagged that `premise` is a *story-level* fact and must not be denormalized onto `CatalogEpisode`: `/stories` currently groups rows by `storyTitle` (a display string, not canonical), so a per-episode `premise` column would either repeat the same value N times with no single read-source, or collide if two stories shared a title. The wiring below uses a dedicated `CatalogStory` table and switches grouping to `storyId` so story metadata has one owner.

1. **Extend the catalog read.** `app/src/lib/catalog.ts:43` (`loadStoryTitles`) already reads `stories/{story_id}/story.yaml` at catalog-sync time for the title. Rename to `loadStoryMetadata`; return `{ storyId, title, premise }` per story.
2. **Introduce a `CatalogStory` Prisma model.** Keyed by `storyId` (unique). Columns: `storyId`, `title`, `premise`. `CatalogStory.title` is the canonical runtime source of story title; remove `storyTitle` from `CatalogEpisode` rather than keeping a duplicate copy there. Populate `CatalogStory` inside `syncCatalogFromFilesystem` alongside the existing `CatalogEpisode` upsert loop. Run `prisma migrate`.
3. **Define sync ownership clearly.** Catalog sync remains a filesystem-derived snapshot. Upsert the current set of `CatalogStory` rows from `stories/*/story.yaml`, and delete stale `CatalogStory` rows that are no longer present in the current snapshot. Do not introduce story-level `isAvailable`; stale rows should be removed, not retained.
4. **Define the app read shape after the schema change.** `listCatalogEpisodes()` must stop exposing `storyTitle` from `CatalogEpisode` and instead return episode rows joined with canonical story metadata from `CatalogStory`. Keep one shared helper surface for app callers rather than making each page hand-roll its own Prisma join. The returned shape may be either nested (`story: { storyId, title, premise }`) or flattened joined fields, but it must give both `/stories` and the home page enough data to render story title after `CatalogEpisode.storyTitle` is removed.
5. **Switch `/stories` grouping from title to id.** `app/src/app/stories/page.tsx:53, 73, 84, 98` currently builds the grouping `Map` keyed by `storyTitle`. Change the key to `storyId` so grouping is canonical; render the heading title from `CatalogStory.title` via the shared catalog read in step 4.
6. **Render `premise` on `/stories`.** Subtitle / lead-in under each story heading, above the episode list. Uses `CatalogStory.premise` via the shared catalog read in step 4. This UI change is approved under the freeze only for this narrow addition; no other interface changes are in scope.
7. **Update the home-page story label without changing the UI.** `app/src/app/page.tsx` currently renders `episode.storyTitle` in the "Story progress" list. Keep the existing UI exactly as-is, but swap that read to the canonical story metadata returned by step 4 so the app has no remaining dependency on `CatalogEpisode.storyTitle`.

No `story-info.yaml` artifact, no new agent, no new script. Catalog sync is the single path from authoring tree → Prisma → app. The grouping change in step 5 is bundled into the approved Task 2 `/stories` surface change because it is required to make story ownership canonical.

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
