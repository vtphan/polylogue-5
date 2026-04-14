# Repository Guidelines

## Project Structure & Module Organization
`framework/` holds the shared reasoning model, schemas, and pipeline scripts that generate app-agnostic episode artifacts. `artifacts/` stores generated YAML outputs and archived runs. `apps/` holds app-specific docs, schemas, and optional post-pipeline command surfaces. `apps/artifacts-viewer/` is a small Next.js viewer for framework and story artifacts. `apps/lens/` is currently incomplete/in limbo and should be treated as app-specific downstream material, not the canonical Lens runtime. `lens-app/` is still the current Lens Next.js application with route handlers in `src/app/`, reusable UI in `src/components/`, and shared logic in `src/lib/`. Reference material and scaffolding live under `docs/`, `configs/`, `references/`, and `registry/`.

## Build, Test, and Development Commands
Run commands from the relevant app directory.

- `cd lens-app && npm run dev` starts the main app on a local Next.js server.
- `cd lens-app && npm run build` produces a production build; `npm run lint` runs ESLint.
- `cd lens-app && npm run db:migrate` applies local Prisma migrations; `npm run db:seed` seeds development data.
- `cd apps/artifacts-viewer && npm run dev` runs the artifact viewer; `npm run build` and `npm run lint` validate it.
- `python3 framework/pipeline/scripts/initialize_polylogue.py` initializes the shared framework pipeline.
- `python3 framework/pipeline/scripts/initialize_polylogue.py --app lens` initializes the shared framework pipeline plus Lens-specific downstream commands.

## Claude Code Pipeline Commands
This repo defines Claude Code slash-command workflows under `.claude/commands/` and the corresponding specialized agent prompts under `.claude/agents/` (mirrored from `framework/pipeline/` plus any app-specific additions after initialization).

- Example operator usage in Claude Code: `/brainstorm_episode strangers-in-the-old-forest 1`
- Shared framework commands: `brainstorm_story`, `brainstorm_episode`, `validate_story`, `create_episode`, `create_transcript`, `build_assistive_package`
- App-specific commands may appear only after `--app <app_id>` initialization, such as Lens `configure_session` and `design_scaffolding`

When working in Codex, treat these slash commands as documented workflows rather than shell commands:

- Read the matching command spec in `.claude/commands/<name>.md`
- Read any referenced agent prompt(s) in `.claude/agents/`
- Execute or emulate the workflow with local tools, scripts, and file edits

Codex does not natively invoke Claude Code's slash-command runtime, but it should understand the command contract and can reproduce the same steps from the checked-in command and agent specifications.

## Coding Style & Naming Conventions
TypeScript uses the existing Next.js and ESLint setup in `eslint.config.mjs`; resolve lint issues before opening a PR. Follow the repo’s current naming patterns: React components and route files use lowercase kebab-case filenames such as `evaluate-individual.tsx`, utility modules stay descriptive (`artifact-cache.ts`), and dynamic routes use Next.js bracket folders like `src/app/session/[id]/`. Keep Python script names verb-first and snake_case, for example `validate_story.py`.

## Testing Guidelines
There is no dedicated unit-test suite checked in yet, so treat `npm run lint` and `npm run build` as the minimum gate for app changes. For `lens-app`, run any affected Prisma workflow as needed. For pipeline updates, run the relevant validator scripts such as `python3 framework/pipeline/scripts/validate_story.py` or `validate_schema.py` against the changed content.

## Commit & Pull Request Guidelines
Recent history favors short, imperative commit subjects such as `Streamline framework and pipeline documentation post-v2 migration` and `Generate episode 3 artifacts...`. Keep commits focused and descriptive. PRs should explain which area changed (`framework`, `lens-app`, or `artifacts-viewer`), list validation steps performed, link related issues or design docs, and include screenshots for visible UI changes.
