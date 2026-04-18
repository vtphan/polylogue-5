# Repository Guidelines

## Current Focus

`simplified-framework/` is the only active framework in this repository. When a request is ambiguous, default to `simplified-framework/`.

The repo-root `.claude/` directory is canonical. Do not treat `simplified-framework/.claude` as the active command surface.

## Project Structure

Active work lives in:

- `simplified-framework/docs/instructional-design.md`
- `simplified-framework/docs/tech-reference.md`
- `simplified-framework/docs/operator-workflow.md`
- `simplified-framework/stories/{story_id}/story.yaml`
- `simplified-framework/artifacts/{story_id}/{episode_id}/`
- `simplified-framework/reference/flaw-taxonomy.yaml`
- `simplified-framework/pipeline/scripts/`
- `simplified-framework/pipeline/commands/`
- `simplified-framework/pipeline/agents/`
- `simplified-framework/app/`

Reference-only material lives under `legacy/`.

## Working Assumptions

- student-facing language stays plain and explicit
- each episode primarily teaches one main flaw
- transcripts are source dialogue, not analytic containers
- `lesson_package.yaml` is the deterministic app-facing teaching artifact
- the dedicated app under `simplified-framework/app/` is the implemented runtime
- grading uses `feedback.correct.option_ids`, never `best_answer_id`

## Source Of Truth Order

1. `simplified-framework/pipeline/scripts/`
2. `simplified-framework/stories/` and `simplified-framework/artifacts/`
3. `simplified-framework/reference/flaw-taxonomy.yaml`
4. `simplified-framework/app/src/lib/domain.ts`
5. `simplified-framework/app/prisma/schema.prisma`
6. `simplified-framework/docs/tech-reference.md` and `instructional-design.md`
7. `simplified-framework/schemas/`

## Build, Test, And Development Commands

Run app commands from `simplified-framework/app/`.

- `cd simplified-framework/app && npm install`
- `cd simplified-framework/app && npx prisma migrate dev`
- `cd simplified-framework/app && npm run dev`
- `cd simplified-framework/app && npm run build`
- `cd simplified-framework/app && npm run lint`

Initialize the simplified pipeline into repo-root `.claude/`:

- `cd ~/Development/polylogue-5 && python3 simplified-framework/pipeline/scripts/initialize_polylogue.py`
- `cd ~/Development/polylogue-5/simplified-framework && python3 pipeline/scripts/initialize_polylogue.py --project-root ~/Development/polylogue-5`

Validate artifacts with:

- `python3 simplified-framework/pipeline/scripts/validate_story.py simplified-framework/stories/<story_id>/story.yaml`
- `python3 simplified-framework/pipeline/scripts/validate_episode_plan.py simplified-framework/artifacts/<story_id>/<episode_id>/episode-plan.yaml`
- `python3 simplified-framework/pipeline/scripts/validate_transcript.py simplified-framework/artifacts/<story_id>/<episode_id>/transcript.yaml`
- `python3 simplified-framework/pipeline/scripts/validate_lesson_package.py simplified-framework/artifacts/<story_id>/<episode_id>/lesson_package.yaml`
- `python3 simplified-framework/pipeline/scripts/validate_practice_package.py simplified-framework/artifacts/practice/practice_package.yaml`

## Claude Code Workflow

This repo uses repo-root `.claude/commands/` and `.claude/agents/` as the active synced command surface.

For simplified-framework work:

- initialize the simplified workflow first
- read the checked-in specs in `simplified-framework/pipeline/commands/` and `simplified-framework/pipeline/agents/`
- treat the synced `.claude/` copies as runtime mirrors of those checked-in specs

## Testing Guidance

Minimum gate for app changes:

- `npm run lint`
- `npm run build`

For pipeline updates, run the relevant validators against affected artifacts.
