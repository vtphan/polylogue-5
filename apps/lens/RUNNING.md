# Running the Lens Pipeline

## Initialize

Before running any slash commands, bootstrap the environment. This clears `.claude/commands/` and `.claude/agents/`, then syncs shared upstream commands/agents from `framework/pipeline/` and Lens-specific commands/agents from `apps/lens/pipeline/`.

```bash
python3 apps/lens/pipeline/initialize_lens.py
```

Run this:
- Before the first session
- After editing any file in `framework/pipeline/commands/`, `framework/pipeline/agents/`, `apps/lens/pipeline/commands/`, or `apps/lens/pipeline/agents/`
- When switching from another application (e.g., Reasoning Lab) to Lens

## Pipeline Stages

Run these commands in order. Each stage produces artifacts in `registry/{scenario_id}/`.

### Stage 1: Create Scenario

```
/create_scenario
```

The operator provides the 6-field prompt (topic, context, instructional goals, target complexity, target facets with signal mechanisms, discussion dynamic). The planning agent drafts a scenario plan; the validation agent reviews it.

**Output:** `registry/{scenario_id}/scenario.yaml`

### Stage 2: Create Transcript

```
/create_transcript
```

The dialog writer produces the discussion behind the information barrier. The transcript instructional designer refines signal clarity. Scripts enumerate turns and sentences.

**Output:** `registry/{scenario_id}/transcript.yaml`

### Stage 3: Analyze Transcript

```
/analyze_transcript
```

The evaluator produces per-passage facet annotations, the AI perspective, and the facilitation guide. The analysis reviewer checks quality.

**Output:** `registry/{scenario_id}/analysis.yaml`, `registry/{scenario_id}/facilitation.yaml`

### Stage 4: Design Scaffolding (Lens-specific)

```
/design_scaffolding
```

The scaffolding instructional designer produces hints, rubrics, deepening probes, misreading redirects, and enriches the facilitation guide with discussion starters.

**Output:** `registry/{scenario_id}/lens/scaffolding.yaml`, `registry/{scenario_id}/lens/facilitation.yaml` (enriched)

### Stage 5: Configure Session (Lens-specific)

```
/configure_session
```

Assembles the session configuration from all preceding artifacts. The operator provides onboarding text, lifeline pool size, and reference list toggles.

**Output:** `registry/{scenario_id}/lens/session.yaml`

## Final Artifact Layout

```
registry/{scenario_id}/
├── scenario.yaml              # Shared — stage 1
├── transcript.yaml            # Shared — stage 2
├── analysis.yaml              # Shared — stage 3
├── facilitation.yaml          # Shared — stage 3 (initial version)
├── intermediates/             # Pipeline working files
└── lens/
    ├── scaffolding.yaml       # Lens — stage 4
    ├── facilitation.yaml      # Lens — stage 4 (enriched)
    └── session.yaml           # Lens — stage 5
```
