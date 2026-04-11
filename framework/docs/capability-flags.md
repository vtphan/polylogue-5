# Capability Flags in Story Frontmatter

**Purpose.** Documents the capability flags declared in a story's design doc frontmatter. The pipeline reads these flags and conditionally populates or omits fields in the assistive package.

**Source.** `pipeline-revision-plan.md` §4. Governance Rule 2 requires that every flag earn its place against a creative choice multiple stories actually make.

---

## Coverage and inventory flags

Declared in the story design doc's YAML frontmatter:

| Flag | Type | Description |
|---|---|---|
| `coverage_mode` | `focused \| comprehensive` | Whether the story covers a subset or the full facet inventory |
| `declared_facets` | list of facet IDs | Which facets this story covers |
| `declared_cognitive_patterns` | list of pattern IDs | Which cognitive patterns this story covers |
| `declared_social_dynamics` | list of dynamic IDs | Which social dynamics this story covers |

## Creative-choice flags

| Flag | Type | Default | Effect on pipeline |
|---|---|---|---|
| `pedagogical_register` | `unfinished_not_wrong \| neutral` | `neutral` | Shapes prose and discussion agents' tone |
| `uses_character_growth` | `true \| false` | `false` | When true, diagnostic agent populates `growth_beats` at episode level and `character_arc_position` at passage level; discussion agent populates `connects_to.echoes` |
| `declares_calibration_warnings` | `true \| false` | `false` | When true, merge script lifts author-written calibration warnings from the story design doc |
| `uses_stance_positions` | `true \| false` | `false` | When true, diagnostic agent populates `stance_positions[]` per passage |
| `supports_jigsaw` | `true \| false` | `false` | When true, discussion agent populates `discussion.jigsaw_fragments[]` |

## Example frontmatter

```yaml
---
story_id: the-field-trip
title: "The Field Trip"
coverage_mode: comprehensive
declared_facets:
  - inferential_validity
  - source_credibility
  - perspective_engagement
  # ...
declared_cognitive_patterns:
  - confirmation_bias
  - uncritical_acceptance
  # ...
declared_social_dynamics:
  - group_pressure
  - authority_deference
pedagogical_register: neutral
uses_character_growth: true
declares_calibration_warnings: false
uses_stance_positions: false
supports_jigsaw: false
---
```

## Merge-script behavior

The merge script in `/build_assistive_package` reads the story's capability flags from the episode plan (which inherits them from the story design doc). Flag-gated fields are:

- **Included** when the flag is `true` (or the active enum value)
- **Omitted** when the flag is `false` (or the default enum value)

The `package_reviewer` agent verifies that flag-gated fields are populated when expected and absent when not.
