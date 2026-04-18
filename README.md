# Polylogue

`simplified-framework/` is the only active framework in this repository.

The current working model is:

- `simplified-framework/` contains the live reasoning-flaws framework, validators, pipeline specs, artifacts, and the dedicated Next.js app.
- `.claude/` at the repo root is the canonical Claude Code command/agent sync target.
- `legacy/` contains the older shared-framework roots and archived pre-v2 material, kept only for reference.

## Current Docs

Use these as the active source of truth:

- `simplified-framework/docs/instructional-design.md`
- `simplified-framework/docs/tech-reference.md`
- `simplified-framework/docs/operator-workflow.md`

## Bootstrap

Run the simplified initializer against the repo root so it syncs into repo-root `.claude/`:

```bash
cd ~/Development/polylogue-5
python3 simplified-framework/pipeline/scripts/initialize_polylogue.py
```

If you are already inside `simplified-framework/`, pass the repo root explicitly:

```bash
python3 pipeline/scripts/initialize_polylogue.py --project-root ~/Development/polylogue-5
```

## Validation

```bash
python3 simplified-framework/pipeline/scripts/validate_story.py <story.yaml>
python3 simplified-framework/pipeline/scripts/validate_episode_plan.py <episode-plan.yaml>
python3 simplified-framework/pipeline/scripts/validate_transcript.py <transcript.yaml>
python3 simplified-framework/pipeline/scripts/validate_lesson_package.py <lesson_package.yaml>
python3 simplified-framework/pipeline/scripts/validate_practice_package.py <practice_package.yaml>
```

## Legacy Material

Older roots such as the former shared framework, old app surfaces, and historical artifacts live under `legacy/`. They are not part of the active simplified-framework workflow and should not be treated as current source of truth.
