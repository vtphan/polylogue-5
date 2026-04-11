# Polylogue

A research project for teaching critical thinking to middle school students (grades 6-8). Students read AI-generated group discussions and evaluate the reasoning — where it is sound, where it is weak, and why the characters reasoned the way they did.

## Structure

- **`framework/`** — The application-agnostic theory (three evaluative lenses, ten hidden facets, cognitive patterns, social dynamics) and the shared pipeline that generates per-episode artifacts.
- **`apps/`** — Application-specific implementations (Lens, Reasoning Lab) that consume the pipeline's output.
- **`artifacts/`** — Generated story and episode artifacts (YAML files).

## Documentation

| Document | Purpose |
|---|---|
| `framework/docs/conceptual-framework.md` | The reasoning quality ontology — lenses, facets, explanatory variables |
| `framework/docs/story-design.md` | Operator guidance for designing stories — cast rules, coverage, drafts, pipeline design guidance |
| `framework/docs/pipeline-architecture.md` | Pipeline specification — assistive package schemas, agent architecture, governance rules |
| `framework/docs/operator-manual.md` | End-to-end runbook — prose authoring (Phase 6) and pipeline execution (Phase 7) |
| `framework/docs/system-architecture.md` | System structure — three-layer model, directory layout, conventions |

## Pipeline

Stories are authored as prose (a design doc + per-episode drafts), then each episode runs through three shared pipeline stages:

```
/create_episode  →  /create_transcript  →  /build_assistive_package
```

The pipeline is operated through Claude Code. Initialize with:

```bash
python3 framework/pipeline/scripts/initialize_polylogue.py --app lens
```

See `framework/docs/operator-manual.md` for the full runbook.

## Applications

| Application | Status | Description |
|---|---|---|
| **Lens** | Pipeline complete, app not yet built | Students evaluate passages through lenses. Reflective, writing-centered. |
| **Reasoning Lab** | Experimental | Forensic investigation metaphor with competitive scoring. |
