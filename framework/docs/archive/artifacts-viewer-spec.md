# Artifacts Viewer Spec

**Status.** Draft proposal for a new app, `artifacts_viewer`, that reads generated story artifacts from `artifacts/` and presents them as a navigable, episode-centered research tool.

## 1. Goal

`artifacts_viewer` should let a user:

- browse stories in `artifacts/`
- see which episodes exist and how complete each episode is
- open an episode and understand it at three levels:
  - the story surface: what happens in the episode
  - the pipeline surface: which artifacts were generated
  - the runtime surface: how the v2 assistive package would behave for a student

The main job is not raw YAML inspection. The main job is to make episode artifacts legible and cross-linked.

## 2. Repo Placement

### 2.1 Recommended location

The repo already has a structural distinction:

- `framework/` contains shared theory, schemas, stories, and pipeline code
- `apps/` contains concrete applications

Because `artifacts_viewer` is an application that consumes generated artifacts, the recommended home is:

`apps/artifacts-viewer/`

### 2.2 Non-recommended location

`./frameworks` does not exist in this repo. Creating it would cut across the current architecture and make the new app inconsistent with `apps/lens/` and `apps/reasoning-lab/`.

If the requirement is strictly "keep it close to framework code," the next-best compromise is:

`framework/docs/artifacts-viewer-spec.md` for the spec

and later:

`apps/artifacts-viewer/` for the implementation

## 3. Primary User

Initial target user:

- researcher / pipeline operator / developer

Not the initial target:

- classroom teacher
- student

That means the first version should optimize for traceability, artifact completeness, and cross-linking rather than a polished classroom flow.

## 4. Canonical Data Sources

For each episode directory:

`artifacts/{story_id}/episodes/episode_{NN}/`

the app should read these files when present:

- `episode.yaml`
- `transcript.yaml`
- `ground_truth.yaml`
- `diagnostic.yaml`
- `prose.yaml`
- `discussion.yaml`
- `assistive_package.yaml`
- `pipeline_log.yaml`

Generated variants may also exist:

- `*_generated.yaml`

These should be treated as secondary debugging artifacts, not the default read model.

## 5. Canonical Read Rule

Use this precedence order:

1. If `assistive_package.yaml` exists, use it as the primary episode model.
2. If no `assistive_package.yaml` exists, compose a partial episode model from individual v2 files.
3. If only `episode.yaml` exists, render a planning-only episode view.
4. If `pipeline_log.yaml` exists, use it to compute stage status even when content files are missing.

This matters because current data already includes both cases:

- `the-field-trip/episode_01` is fully generated
- `the-field-trip/episode_02` is planning-only

## 6. Product Principles

### 6.1 Transcript-first

The transcript should be the spine of the UI. Most v2 structures are keyed by turn or passage:

- `ground_truth.turn_annotations`
- `diagnostic.probes.facet.by_turn`
- `diagnostic.interventions.by_turn`
- `discussion.discussion_cues.by_turn`

### 6.2 Story-first navigation, artifact-first depth

Users should start at story and episode level, then drill into artifacts. They should not need to know file names first.

### 6.3 Partial episodes are a first-class state

The app must handle:

- planning-only episodes
- transcript-only episodes
- partially generated package files
- completed episodes

without treating missing files as errors in the UI.

### 6.4 Human-readable first, raw YAML always available

Every structured screen should have an adjacent raw artifact view for debugging and trust.

## 7. Information Architecture

### 7.1 Story Index

Route intent:

`/stories`

Shows:

- all story IDs found under `artifacts/`
- story title when derivable
- number of episode directories
- per-story completion summary
- latest pipeline activity from `pipeline_log.yaml` if available

Card fields:

- story ID
- optional human title
- episode count
- completed episode count
- in-progress episode count
- last updated timestamp

### 7.2 Story Detail

Route intent:

`/stories/{storyId}`

Shows:

- story metadata
- episode list
- per-episode stage completion
- quick links into transcript, package, and raw files

Episode table columns:

- episode number
- topic
- status
- available files
- last pipeline event

### 7.3 Episode Detail

Route intent:

`/stories/{storyId}/episodes/{episodeId}`

This is the core screen.

Top section:

- episode topic
- story + episode breadcrumb
- completeness/status badges
- artifact availability list

Main tabs:

- Overview
- Transcript
- Ground Truth
- Diagnostic
- Prose
- Discussion
- Package
- Pipeline
- Raw YAML

## 8. Episode Tab Behavior

### 8.1 Overview Tab

Purpose:

- orient the user before they inspect detailed artifacts

Show:

- `episode.yaml` topic and context
- instructional goals
- personas
- short completion summary
- passage count
- turn count
- available artifact set

If `assistive_package.yaml` exists, include:

- facet summary
- lens summary
- number of probe-bearing turns
- number of discussion cues

### 8.2 Transcript Tab

Purpose:

- anchor the episode on its actual dialog

Show:

- full transcript by turn
- speaker labels
- turn IDs
- per-turn badges for facets and lenses
- click-to-expand annotations

When package data exists, expanding a turn should reveal:

- `ground_truth.turn_annotations` content
- linked `facets_present`
- probe options for that turn
- intervention cells for that turn
- discussion cues continuing from that turn

This should be the fastest way to answer: "what is the pipeline saying about this exact moment?"

### 8.3 Ground Truth Tab

Purpose:

- explain the analyst layer

Primary sections:

- passages
- `facets_present`
- `facets_absent_but_tempting`
- `lens_visibility`
- `causal_layer`
- `perspective_transitions`
- `counterfactuals`

Important visualizations:

- passage cards
- per-lens engagement vs affordance matrix
- facet evidence-turn links
- causal explanation grouped by facet

### 8.4 Diagnostic Tab

Purpose:

- explain and simulate the reactive intervention layer

Primary sections:

- orientation probes by turn
- explanation probes by turn/facet
- intervention dictionary by turn
- `struggle_calibration`

Important visualizations:

- turn-to-probe browser
- option-to-route mapping
- ladder viewer by facet and role
- role badges: `present`, `afforded_missing`, `tempting_absent`

This tab should support a "simulate student tap" interaction:

- pick a turn
- pick a probe option
- see the routed intervention cell
- step through ladder rungs

That is the most important v2-native behavior to visualize.

### 8.5 Prose Tab

Purpose:

- show non-reactive student-facing text

Show:

- `episode_opening`
- `entry_prompts`
- `consensus_check`

This tab can stay simple.

### 8.6 Discussion Tab

Purpose:

- show how individual observations continue into group-phase discussion

Show:

- `discussion_cues.by_turn`
- `discussion_cues.episode_scope`
- `talk_moves`

Important visualizations:

- cue list by turn
- axis badges:
  - `lens_refraction`
  - `persona_projection`
  - `stance_inversion`
- continuation links back to transcript turns and facets

This tab should make it easy to answer:

- what group prompt follows a private observation?
- which cues are turn-specific vs episode-wide?

### 8.7 Package Tab

Purpose:

- show the merged runtime view

When `assistive_package.yaml` exists, this tab should present the package as the normalized, app-facing model:

- merged ground truth
- merged diagnostic
- merged prose
- merged discussion
- derived fields

This tab is where implementation-minded users confirm what a consuming runtime actually needs to read.

### 8.8 Pipeline Tab

Purpose:

- show generation history and artifact completeness

Read from:

- `pipeline_log.yaml`
- file presence in the episode directory

Show:

- chronological event list
- stage verdicts
- attempts and retries
- currently missing expected files

For partial episodes, this tab becomes the primary explanation of state.

### 8.9 Raw YAML Tab

Purpose:

- debugging and source-of-truth inspection

Show one file at a time with:

- file picker
- syntax-highlighted YAML
- copy path action

## 9. Data Model the App Should Build

The implementation should normalize each episode into an internal view model roughly like:

```ts
type EpisodeBundle = {
  storyId: string;
  episodeNumber: number;
  status: "planning_only" | "transcript_ready" | "partial_v2" | "complete_v2";
  files: {
    episode?: unknown;
    transcript?: unknown;
    groundTruth?: unknown;
    diagnostic?: unknown;
    prose?: unknown;
    discussion?: unknown;
    assistivePackage?: unknown;
    pipelineLog?: unknown;
  };
  derived: {
    topic?: string;
    turnCount: number;
    passageCount: number;
    probeTurnCount: number;
    discussionCueCount: number;
    lastUpdated?: string;
  };
};
```

The normalization layer should hide file-presence complexity from the UI.

## 10. Episode Status Rules

Recommended status rules:

- `planning_only`
  - has `episode.yaml`
  - missing `transcript.yaml`
- `transcript_ready`
  - has `episode.yaml` and `transcript.yaml`
  - missing all or most v2 package files
- `partial_v2`
  - has `transcript.yaml`
  - has some but not all of `ground_truth.yaml`, `diagnostic.yaml`, `prose.yaml`, `discussion.yaml`, `assistive_package.yaml`
- `complete_v2`
  - has `assistive_package.yaml`

Secondary badges:

- `generated_variants_present`
- `pipeline_log_present`
- `raw_only_gap`

## 11. File and Parsing Strategy

### 11.1 Initial implementation

Keep the loader file-system based and read directly from repo-local disk.

Do not start with:

- a database mirror
- background indexing service
- mutation flows

The initial problem is inspection, not authoring.

### 11.2 YAML parsing

The loader should:

- enumerate `artifacts/*/episodes/episode_*`
- parse YAML safely
- tolerate missing files
- surface parse failures as per-file warnings, not full-page crashes

## 12. UI Priorities for v1

Build in this order:

1. Story index
2. Story detail with episode status
3. Episode overview
4. Transcript tab with turn-linked package data
5. Pipeline tab
6. Diagnostic simulator
7. Ground truth and discussion visualizations
8. Raw YAML inspector

This ordering gets useful value quickly from the current dataset.

## 13. Proposed App Structure

If implemented as a Next.js app, a reasonable structure is:

```text
apps/artifacts-viewer/
  package.json
  tsconfig.json
  next.config.ts
  src/
    app/
      page.tsx
      stories/
        page.tsx
        [storyId]/
          page.tsx
          episodes/
            [episodeId]/
              page.tsx
    components/
      story/
        story-card.tsx
        episode-table.tsx
      episode/
        episode-header.tsx
        artifact-availability.tsx
        transcript-view.tsx
        ground-truth-view.tsx
        diagnostic-view.tsx
        prose-view.tsx
        discussion-view.tsx
        package-view.tsx
        pipeline-view.tsx
        raw-yaml-view.tsx
    lib/
      artifacts/
        list-stories.ts
        load-story.ts
        load-episode.ts
        normalize-episode.ts
        status.ts
      yaml/
        parse-yaml.ts
      types/
        artifacts.ts
```

## 14. Relationship to Existing UI

There is already a researcher-facing artifact view in:

- `lens-app/src/app/researcher/scenario/[id]/artifacts/`
- `lens-app/src/app/researcher/scenario/[id]/pipeline/`

That code is useful precedent for:

- tabbed inspection
- transcript-linked artifact browsing
- pipeline walkthrough concepts

But `artifacts_viewer` should not copy its data model directly because that UI is built around older scenario-centered artifacts, not the v2 assistive package structure.

`artifacts_viewer` should be:

- story-centered instead of scenario-centered
- file-system backed instead of Prisma-backed
- `assistive_package`-first instead of analysis/scaffolding-first

## 15. Current Test Fixture

The initial implementation should be tested against:

- `artifacts/the-field-trip/episodes/episode_01/`
- `artifacts/the-field-trip/episodes/episode_02/`

Why:

- `episode_01` exercises the full v2 path
- `episode_02` exercises partial-state handling

## 16. Explicit Non-Goals for v1

Do not build these first:

- editing artifacts
- rerunning pipeline commands
- teacher-facing classroom UX
- student-facing runtime UX
- cross-story analytics dashboards

Those are separate products.

## 17. Recommendation

Build `artifacts_viewer` as a lightweight read-only application in `apps/artifacts-viewer/`, with `assistive_package.yaml` as the primary episode model and the transcript as the primary navigation surface.

That gives the app a clear purpose:

- browse stories
- inspect episodes
- understand package behavior
- debug partial pipeline output

without coupling it to older v1 app assumptions.
