# Operator Guide

This is the short practical runbook. Use it as an entrypoint, not as the full specification.

## Bootstrap

Before authoring or running anything:

```bash
# Story authoring only
python3 framework/pipeline/scripts/initialize_polylogue.py

# Full pipeline with an app downstream
python3 framework/pipeline/scripts/initialize_polylogue.py --app lens
python3 framework/pipeline/scripts/initialize_polylogue.py --app reasoning-lab
```

Omit `--app` for story authoring and `/validate_story`; include it when running the full app-facing pipeline.

## Workflow

1. Optionally use `brainstorm_story` to co-design the story.
2. Author the story in `framework/stories/`.
3. Run `/validate_story <story_id>` until it returns `READY`.
4. For each episode, run:
   - optionally `/brainstorm_episode <story_id> <NN>`
   - `/create_episode <story_id> <NN>`
   - `/create_transcript <story_id> <NN>`
   - `/build_assistive_package <story_id> <NN>`

## Failure Recovery

- If `/validate_story` returns `REVISE`, edit the story design doc and episode drafts, then run it again.
- If `/create_episode` fails, fix the story inputs or the episode draft.
- If `/create_transcript` fails repeatedly, the episode signals are likely not stageable; return to story revision.
- If `/build_assistive_package` fails, inspect the reviewer findings and merge-script checks before rerunning.

## Read More

- `story-authoring.md` — story design doc, episode drafts, and `/validate_story`
- `artifacts-generation.md` — the three episode commands and generated artifacts
- `conceptual-framework.md` — pedagogy and ontology
- `architecture.md` — repo layout and system boundaries
