---
description: Report scenario coverage of facets, cognitive patterns, and social dynamics against the planned sequence
argument-hint: (no arguments)
---

# Check Coverage

Compare generated scenarios in `artifacts/` against the planned scenario sequence in `framework/reference/scenario_sequence.yaml`. Reports per-scenario drift (facets, cognitive patterns, social dynamics that don't match the plan) and aggregate coverage of the plan's targets.

This is a diagnostic command. It does not modify any artifacts. Use it during the pilot phase, especially when regenerating individual scenarios, to confirm the set as a whole still covers what the design intended.

## Input

- `framework/reference/scenario_sequence.yaml` — the planned sequence
- `artifacts/*/scenario.yaml` — every generated scenario plan

## Steps

### Step 1: Run the coverage script

```bash
python3 framework/pipeline/scripts/check_coverage.py
```

The script prints a full report regardless of exit code. Exit code is `0` only if every planned scenario is present and the union of generated scenarios covers all planned facets, cognitive patterns, and social dynamics.

Optional arguments:
- `--sequence <path>` — point at an alternate sequence file (e.g., a per-app variant if one is added later).
- `--artifacts <path>` — point at an alternate artifacts root.

### Step 2: Interpret the report

The report has three sections:

1. **Per-scenario status** — `OK`, `DRIFT`, or `MISSING` for each planned scenario.
   - `DRIFT` means the generated `scenario.yaml` is missing planned facets / patterns / dynamics, or carries ones that weren't planned. Both directions matter — drift in either direction is worth investigating.
   - `MISSING` means the planned scenario hasn't been generated yet.
2. **Unexpected scenarios** — anything in `artifacts/` that isn't in the plan. This is informational, not necessarily wrong (the operator may be experimenting).
3. **Aggregate coverage** — how many of each category's targets are covered across all present scenarios. Anything in `intentionally_excluded` is not flagged as unplanned.

### Step 3: Decide what to do

- `MISSING` scenarios → run the pipeline for those scenario IDs.
- `DRIFT` scenarios → either re-run `/create_scenario` for that ID with a corrected operator prompt, or update `framework/reference/scenario_sequence.yaml` if the plan itself has shifted. Keep the YAML in sync with `framework/docs/scenario-sequence.md`.
- Aggregate gaps → consider whether the plan still matches your pilot intent before adding scenarios.

## Output

Report printed to stdout. No files written.
