# Repository Guidelines

## Project Structure & Module Organization
`framework/` holds the shared reasoning model, schemas, and pipeline scripts that generate episode artifacts. `artifacts/` stores generated YAML outputs and archived runs. App-specific work lives in `apps/` and `lens-app/`: `apps/artifacts-viewer/` is a small Next.js viewer for framework and story artifacts, while `lens-app/` is the main Next.js application with route handlers in `src/app/`, reusable UI in `src/components/`, and shared logic in `src/lib/`. Reference material and scaffolding live under `docs/`, `configs/`, `references/`, and `registry/`.

## Build, Test, and Development Commands
Run commands from the relevant app directory.

- `cd lens-app && npm run dev` starts the main app on a local Next.js server.
- `cd lens-app && npm run build` produces a production build; `npm run lint` runs ESLint.
- `cd lens-app && npm run db:migrate` applies local Prisma migrations; `npm run db:seed` seeds development data.
- `cd apps/artifacts-viewer && npm run dev` runs the artifact viewer; `npm run build` and `npm run lint` validate it.
- `python3 framework/pipeline/scripts/initialize_polylogue.py --app lens` initializes the shared content pipeline described in [README.md](/Users/vinhthuyphan/ResearchDev/polylogue-5/README.md).

## Coding Style & Naming Conventions
TypeScript uses the existing Next.js and ESLint setup in `eslint.config.mjs`; resolve lint issues before opening a PR. Follow the repo’s current naming patterns: React components and route files use lowercase kebab-case filenames such as `evaluate-individual.tsx`, utility modules stay descriptive (`artifact-cache.ts`), and dynamic routes use Next.js bracket folders like `src/app/session/[id]/`. Keep Python script names verb-first and snake_case, for example `validate_story.py`.

## Testing Guidelines
There is no dedicated unit-test suite checked in yet, so treat `npm run lint` and `npm run build` as the minimum gate for app changes. For `lens-app`, run any affected Prisma workflow as needed. For pipeline updates, run the relevant validator scripts such as `python3 framework/pipeline/scripts/validate_story.py` or `validate_schema.py` against the changed content.

## Commit & Pull Request Guidelines
Recent history favors short, imperative commit subjects such as `Streamline framework and pipeline documentation post-v2 migration` and `Generate episode 3 artifacts...`. Keep commits focused and descriptive. PRs should explain which area changed (`framework`, `lens-app`, or `artifacts-viewer`), list validation steps performed, link related issues or design docs, and include screenshots for visible UI changes.
