# Probe-Record Handoff Contract

**Purpose.** Documents the convention between the pipeline's `assistive_package.yaml` and any consuming app's per-student state. The pipeline produces the package; the app owns everything after.

**Source.** `pipeline-architecture.md` §2.7.

---

## Boundary

- The pipeline writes to `artifacts/{story_id}/episodes/episode_{NN}/`. Once `/build_assistive_package` completes, the four authored files and the merged package are frozen.
- The pipeline never reads or writes anything under `artifacts/{story_id}/episodes/episode_{NN}/{app_id}/`. That subdirectory is reserved for app outputs.
- No app-layer step writes back into the pipeline's files.

## Probe record shape

The package's indexing assumes each consuming app maintains a persistent per-student record:

```
probe_record = [
  (turn, facet, explanatory_variable, rung_reached, timestamp),
  ...
]
```

This record is **app-owned state**. The pipeline never writes to it and never reads it.

## What the record enables

| App operation | Package lookup path |
|---|---|
| Route individual-phase interventions | `interventions.by_turn[T].by_facet[F]` |
| Select group-phase cues at individual→group transition | Match `discussion_cues[].continuation_of` against the latest `(turn, facet)` |
| Apply personalized faded assistance | Filter hint-ladder rungs against cumulative facet exposure |
| Surface student-specific closure content | Use probe record to select relevant closure blocks |

## Flexibility

The record's field names are a **handoff convention, not a schema the pipeline validates**:

- Apps that implement fewer fields (e.g., no timestamps, no rung tracking) consume a narrower slice of the package.
- Apps that implement more fields (e.g., tap latency, hover time) are free to extend.
- The framework's only commitment: every package block either consumes `(turn, facet, explanatory_variable)` indexing or is deployed on navigation events. No block requires app-side state outside this vocabulary.

## App contract documents

An app may write a contract document at `apps/{app_id}/docs/package-contract.md` that formalizes what it consumes. Contracts are read-only consumers (Rule 9).
