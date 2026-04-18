# Lens Manual Test Guide

This guide covers the current `apps/lens/` runtime as implemented in the greenfield Lens v1 app.

## Run Locally

```bash
cd apps/lens
npm run dev
```

Open the local Next.js URL shown in the terminal.

## Primary Smoke Test

Use this path for a basic end-to-end validation of the current runtime:

1. Start on the home screen and confirm the app loads the default session bundle without showing a loader failure or empty-state screen.
2. Click `Start new`.
3. In `Group Setup`, keep the default roster or edit it, then continue.
4. On `Episode Landing`, confirm the roster, active student, pacing policy, and empty focal-turn state look reasonable.
5. Click `Begin reading`.
6. In `Episode Reading`, confirm transcript turns render in order and focal-turn candidates are visually marked.
7. Select a focal turn.
8. In `First Response`, confirm the selected turn text, support panel, and round-robin roster status all match the chosen turn.
9. Save first responses for each student until the app advances into `Comparison View`.
10. Confirm saved responses and discussion support appear in `Comparison View`.
11. Continue into `Discussion / Deepening`.
12. Cycle at least one discussion cue or consensus check, then move to `Revision`.
13. Save a revision, confirm the guided stopping-point prompt appears, and continue.
14. In `Episode Completion`, save a transfer takeaway.
15. Award at least one peer recognition.
16. Return to start and confirm the latest session appears in `Start / Resume`.
17. Resume that session and confirm the app restores the saved stage and data.

## What To Watch For

- The app should never unexpectedly fall back to the `Load Failure` or `Empty State` surfaces during the normal smoke path.
- Focal-turn selection should stay consistent between `Episode Reading`, `First Response`, `Comparison`, and later stages.
- Active-student rotation should progress through the roster and stop auto-advancing once the round is complete.
- `Pause session` and `Pause and return` should preserve progress and return the session to the start screen without data loss.
- The progress panel should update badges and show saved peer recognitions after completion activity.
- Reloading the page after progress is saved should still allow session resume from local storage.

## Focused Regression Checks

Use these smaller checks when changing one subsystem:

### Loader And Contract

1. Start the app and confirm the homepage loads without schema or artifact errors.
2. Confirm the contract proof block shows the expected manifest, transcript, and assistive-package values.
3. Confirm `t02` resolves to a real transcript speaker in the homepage proof panel.

### Resume Behavior

1. Start a session and advance at least to `First Response`.
2. Use `Pause session` or `Pause and return`.
3. Confirm the session appears under `Resume latest`.
4. Resume and verify the current stage, focal turn, and saved responses are intact.

### Completion And Recognition

1. Reach `Episode Completion`.
2. Save a transfer takeaway.
3. Award one or more peer recognitions.
4. Confirm both the completion panel and the progress panel reflect the saved recognition state.

## Known Limits Of This Guide

- It is a manual smoke-test guide, not a full acceptance test plan.
- It assumes the default bundled manifest and session config remain available.
- It does not yet cover multi-episode sequencing because the current runtime is still centered on a single session bundle path.
