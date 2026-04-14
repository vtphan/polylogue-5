# Polylogue

A research project for teaching critical thinking to middle school students (grades 6-8). Students read AI-generated group discussions and evaluate the reasoning — where it is sound, where it is weak, and why the characters reasoned the way they did.

## Structure

- **`framework/`** — The application-agnostic theory (three evaluative lenses, ten hidden facets, cognitive patterns, social dynamics) and the shared pipeline that generates per-episode artifacts.
- **`apps/`** — Application-specific implementations (Lens, Reasoning Lab) that consume the pipeline's output.
- **`artifacts/`** — Generated story and episode artifacts (YAML files).
- **`legacy/`** — Archived roots from the previous Polylogue architecture (`legacy/docs/`, `legacy/configs/`, `legacy/registry/`). Kept only as historical reference.

## Documentation

| Document | Purpose |
|---|---|
| `framework/docs/conceptual-framework.md` | The reasoning quality ontology — lenses, facets, explanatory variables |
| `framework/docs/story-authoring.md` | Story-level workflow — design doc, episode drafts, and `/validate_story` |
| `framework/docs/artifacts-generation.md` | Episode-level pipeline — `/create_episode` → `/create_transcript` → `/build_assistive_package` |
| `framework/docs/operator-guide.md` | Short practical runbook |
| `framework/docs/architecture.md` | Repository and system structure |
| `framework/docs/README.md` | Entry point to the live docs set |

## Pipeline

Stories are authored as prose (a design doc + per-episode drafts), then each episode runs through three shared pipeline stages:

```
/create_episode  →  /create_transcript  →  /build_assistive_package
```

The pipeline is operated through Claude Code. For the story-level command set, initialize with:

```bash
python3 framework/pipeline/scripts/initialize_polylogue.py
```

For the full app-facing pipeline:

```bash
python3 framework/pipeline/scripts/initialize_polylogue.py --app lens
```

See `framework/docs/README.md` for the current documentation set.

## Applications

| Application | Status | Description |
|---|---|---|
| **Lens** | Pipeline complete, app not yet built | Students evaluate passages through lenses. Reflective, writing-centered. |
| **Reasoning Lab** | Experimental | Forensic investigation metaphor with competitive scoring. |
