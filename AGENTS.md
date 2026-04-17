# Repository Guidelines

## Current Focus
`simplified-framework/` is the primary area of active work right now. When a request is ambiguous and touches multiple framework variants, default to the simplified framework unless the user explicitly asks for `framework/`, `lens-app/`, or another app-specific surface.

Treat the older shared `framework/` and the current `lens-app/` as reference context unless the task explicitly targets them.

## Project Structure & Module Organization
`simplified-framework/` is the self-contained working area for the simplified reasoning-flaws framework. Its current active documentation set is:

- `simplified-framework/docs/instructional-design.md`
  Conceptual framework, student journey, pedagogical mechanics, and the authoring surface.
- `simplified-framework/docs/tech-reference.md`
  Stack, directory map, Prisma data model, artifact → runtime contract, phase state machine, and change recipes.
- `simplified-framework/docs/operator-workflow.md`
  Human-in-the-loop workflow and review cadence.

Within `simplified-framework/`, canonical materials live in:

- `stories/{story_id}/story.yaml`
  Authored story source.
- `artifacts/{story_id}/{episode_id}/episode-plan.yaml`
  Episode planning artifact.
- `artifacts/{story_id}/{episode_id}/transcript.yaml`
  Transcript artifact.
- `artifacts/{story_id}/{episode_id}/flaw-review.md`
  Review artifact used before package generation.
- `artifacts/{story_id}/{episode_id}/lesson_package.yaml`
  App-facing teaching artifact.
- `reference/flaw-taxonomy.yaml`
  Canonical flaw taxonomy and amplification guidance.
- `schemas/*.yaml`
  Human-readable schema sketches.
- `pipeline/scripts/validate_*.py`
  Canonical structural validators.
- `pipeline/commands/*.md`
  Workflow contracts.
- `pipeline/agents/*.md`
  Specialized prompt specs.
- `docs/archived/`
  Superseded docs and historical design material. Do not treat archived docs as current source of truth.

Outside the simplified framework:

- `framework/` holds the older shared reasoning model, schemas, and pipeline scripts.
- `artifacts/` stores generated YAML outputs and archived runs for the older shared framework.
- `apps/` holds app-specific docs, schemas, and optional downstream command surfaces.
- `apps/artifacts-viewer/` is a small Next.js viewer for framework and story artifacts.
- `apps/lens/` is incomplete/in limbo and should be treated as downstream app-specific material, not the canonical simplified app.
- `lens-app/` is the older Lens Next.js application kept for reference; do not confuse it with the implemented dedicated app under `simplified-framework/app/`.

## Simplified Framework Essence
The simplified framework is organized around one student-facing layer: reasoning flaws.

Current student-facing flaw set:

- jumping to a conclusion
- not enough evidence
- ignoring another perspective
- trusting a source too quickly
- missing important conditions or consequences

Important working assumptions:

- keep student-facing language plain and explicit
- each episode should primarily teach one main flaw
- transcripts are source dialogue, not analytic containers
- `lesson_package.yaml` is the deterministic app-facing teaching artifact
- the dedicated app under `simplified-framework/app/` is implemented end to end: read → warmup → level → complete
- runtime is deterministic: no LLM call at student-use time; grading uses `feedback.correct.option_ids`, never `best_answer_id`

When making decisions in `simplified-framework/`, prefer the following source-of-truth order:

1. validators in `simplified-framework/pipeline/scripts/`
2. artifact files under `simplified-framework/stories/` and `simplified-framework/artifacts/`
3. `simplified-framework/reference/flaw-taxonomy.yaml`
4. Zod schemas in `simplified-framework/app/src/lib/domain.ts`
5. Prisma schema in `simplified-framework/app/prisma/schema.prisma`
6. `simplified-framework/docs/tech-reference.md` and `instructional-design.md`
7. schema sketches in `simplified-framework/schemas/`

## Build, Test, and Development Commands
Run commands from the relevant app directory.

Simplified framework (primary):

- `cd simplified-framework/app && npm install` installs dependencies.
- `cd simplified-framework/app && npx prisma migrate dev` applies local SQLite migrations.
- `cd simplified-framework/app && npm run dev` starts the dedicated app on a local Next.js server.
- `cd simplified-framework/app && npm run build` produces a production build; `npm run lint` runs ESLint.
- `python3 simplified-framework/pipeline/scripts/initialize_polylogue.py` clears and repopulates `.claude/commands/` and `.claude/agents/` with the simplified workflow command set.
- `python3 simplified-framework/pipeline/scripts/validate_story.py simplified-framework/stories/<story_id>/story.yaml` validates a simplified story artifact.
- `python3 simplified-framework/pipeline/scripts/validate_episode_plan.py simplified-framework/artifacts/<story_id>/<episode_id>/episode-plan.yaml` validates a simplified episode plan.
- `python3 simplified-framework/pipeline/scripts/validate_transcript.py simplified-framework/artifacts/<story_id>/<episode_id>/transcript.yaml` validates a simplified transcript.
- `python3 simplified-framework/pipeline/scripts/validate_lesson_package.py simplified-framework/artifacts/<story_id>/<episode_id>/lesson_package.yaml` validates a simplified lesson package.

Older shared framework and legacy apps (reference context):

- `cd lens-app && npm run dev` starts the older Lens app.
- `cd lens-app && npm run build` / `npm run lint` / `npm run db:migrate` / `npm run db:seed`.
- `cd apps/artifacts-viewer && npm run dev` runs the artifact viewer; `npm run build` and `npm run lint` validate it.
- `python3 framework/pipeline/scripts/initialize_polylogue.py` initializes the older shared framework pipeline.
- `python3 framework/pipeline/scripts/initialize_polylogue.py --app lens` initializes the shared framework pipeline plus Lens-specific downstream commands.

## Claude Code Pipeline Commands
This repo defines Claude Code slash-command workflows under `.claude/commands/` and the corresponding specialized agent prompts under `.claude/agents/`. Which command set is present depends on the most recent initializer you ran.

- Example operator usage in Claude Code: `/brainstorm_episode strangers-in-the-old-forest 1`
- Shared framework commands: `brainstorm_story`, `brainstorm_episode`, `validate_story`, `create_episode`, `create_transcript`, `build_assistive_package`
- Simplified framework commands: `create_story`, `create_episodes`, `create_transcript`, `create_lesson_package`
- App-specific commands may appear only after `--app <app_id>` initialization, such as Lens `configure_session` and `design_scaffolding`

If you are working in `simplified-framework/`, initialize that workflow first and then treat the simplified command specs in `.claude/commands/` as the source of truth for the operator flow. The simplified workflow is story-level planning first, then transcript generation one episode at a time with operator approval, then lesson-package generation only after transcript acceptance.

When working in Codex, treat these slash commands as documented workflows rather than shell commands:

- Read the matching command spec in `.claude/commands/<name>.md`
- Read any referenced agent prompt(s) in `.claude/agents/`
- Execute or emulate the workflow with local tools, scripts, and file edits

Codex does not natively invoke Claude Code's slash-command runtime, but it should understand the command contract and can reproduce the same steps from the checked-in command and agent specifications.

## Coding Style & Naming Conventions
TypeScript uses the existing Next.js and ESLint setup in `eslint.config.mjs`; resolve lint issues before opening a PR. Follow the repo’s current naming patterns: React components and route files use lowercase kebab-case filenames such as `evaluate-individual.tsx`, utility modules stay descriptive (`artifact-cache.ts`), and dynamic routes use Next.js bracket folders like `src/app/session/[id]/`. Keep Python script names verb-first and snake_case, for example `validate_story.py`.

## Testing Guidelines
There is no dedicated unit-test suite checked in yet, so treat `npm run lint` and `npm run build` as the minimum gate for app changes. For the simplified app, also run any affected `npx prisma migrate dev` before committing schema edits. For simplified-framework pipeline updates, run the relevant validator scripts against changed artifacts. For the older shared framework, run the corresponding `framework/pipeline/scripts/validate_*.py` checks.

## Commit & Pull Request Guidelines
Recent history favors short, imperative commit subjects such as `Streamline framework and pipeline documentation post-v2 migration` and `Generate episode 3 artifacts...`. Keep commits focused and descriptive. PRs should explain which area changed (`simplified-framework`, `framework`, `lens-app`, or `artifacts-viewer`), list validation steps performed, link related issues or design docs, and include screenshots for visible UI changes.
