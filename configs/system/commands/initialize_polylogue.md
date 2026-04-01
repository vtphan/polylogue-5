# Initialize Polylogue

Set up the pipeline for a working session by syncing commands and agents to `.claude/` and verifying reference data.

## Steps

### 1. Sync Configuration Files

Run `configs/system/scripts/sync_configs.py` to copy commands and agents to `.claude/`.

If `sync_configs.py` is not available, sync manually:

```bash
# Copy commands
mkdir -p .claude/commands
for dir in configs/*/commands; do
  cp "$dir"/*.md .claude/commands/ 2>/dev/null
done

# Copy agents (not used as Claude Code agents — these are prompt files referenced by commands)
mkdir -p .claude/agents
for dir in configs/*/agents; do
  cp "$dir"/*.md .claude/agents/ 2>/dev/null
done
```

### 2. Verify Reference Data

Confirm the three reference data files exist and are parseable:

```bash
python3 -c "
import yaml
for f in ['configs/reference/lenses.yaml', 'configs/reference/facet_inventory.yaml', 'configs/reference/explanatory_variables.yaml']:
    with open(f) as fh:
        yaml.safe_load(fh)
    print(f'OK: {f}')
"
```

### 3. Verify Schema Files

Confirm all 13 schema files exist:

```bash
ls configs/reference/schemas/lenses.yaml \
   configs/reference/schemas/facet_inventory.yaml \
   configs/reference/schemas/explanatory_variables.yaml \
   configs/scenario/schemas/scenario_plan.yaml \
   configs/scenario/schemas/validation_output.yaml \
   configs/transcript/schemas/dialog_writer_input.yaml \
   configs/transcript/schemas/transcript_pre.yaml \
   configs/transcript/schemas/transcript.yaml \
   configs/analysis/schemas/analysis.yaml \
   configs/analysis/schemas/facilitation.yaml \
   configs/scaffolding/schemas/scaffolding.yaml \
   configs/session/schemas/session.yaml \
   configs/session/schemas/student_annotations.yaml
```

### 4. Report

Confirm:
- [ ] Commands synced to `.claude/commands/`
- [ ] Agent prompts synced to `.claude/agents/`
- [ ] 3 reference data files present and valid
- [ ] 13 schema files present
- [ ] `registry/` directory exists

The pipeline is ready. Run `/create_scenario` to begin generating a scenario.
