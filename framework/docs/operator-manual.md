# Operator Manual

End-to-end runbook for authoring and running a Polylogue story. Written for the operator — the person at the keyboard with Claude Code, designing curriculum.

**Prerequisites.** Understand the conceptual framework (lenses, facets, explanatory variables) at a working level — if not, read `conceptual-framework.md`. Cast design rules, coverage contract, per-episode draft template, and pipeline design guidance are in `story-design.md`.

---

## Bootstrap

Before authoring or running anything:

```bash
# Phase 6 authoring only (shared commands, no app downstream)
python3 framework/pipeline/scripts/initialize_polylogue.py

# Full pipeline with an app downstream
python3 framework/pipeline/scripts/initialize_polylogue.py --app lens
python3 framework/pipeline/scripts/initialize_polylogue.py --app reasoning-lab
```

This clears `.claude/commands/` and `.claude/agents/`, then syncs shared upstream commands/agents from `framework/pipeline/` and (when `--app` is given) app-specific commands/agents. Omitting `--app` is sufficient for Phase 6 authoring and `/validate_story`. Re-run after editing pipeline files or switching applications.

---

## Phase 6: Prose authoring

This phase produces the story design doc and per-episode drafts. No pipeline commands run. This is creative authoring, gated by `validate_story.py` and `story_consistency_reviewer`.

### 1. Author the story design doc

**File:** `framework/stories/{story_id}.md`

Markdown with YAML frontmatter:

```yaml
---
story_id: your-story-id
title: Your Story Title
coverage_mode: focused
declared_facets: [sufficiency, source_credibility, relevance, perspective_engagement]
declared_cognitive_patterns: [false_certainty, confirmation_bias]
declared_social_dynamics: [group_pressure]
episode_count: 5
---
```

Prose body: premise, setting, cast (one section per character — name, voice, cognitive moves, social dynamic, lens disposition, growth arc if any), arc summary, stakes, pedagogical commitments.

The cast section is **load-bearing**. It is the source of truth `story_consistency_reviewer` checks every draft against. See `story-design.md` for the six cast design rules and detailed guidance.

### 2. Author per-episode drafts

**Files:** `framework/stories/{story_id}/episode_{NN}.md` (one per episode).

YAML frontmatter plus prose body. The full template is in `story-design.md` §10. Key frontmatter fields: `targets[]` (each with facet, lens, carrier, cognitive_pattern, social_dynamic, cognitive_signal, social_signal), `strengths[]`, `lead_characters`, `primary_lens`, `mixed_valence_shape`, `premise`, `previously`, `beats[]`.

**The hardest part** is writing per-target signals that are simultaneously (1) stage directions, not analysis, (2) faithful to the design doc, and (3) concretely realizable in 6th-grader dialog. See `story-design.md` §5 for the information barrier constraints.

**Iteration is normal.** Drafting episode 3 often reveals something about the cast that wasn't pinned down in the design doc. Revise both as needed.

### 3. Validate after each draft

```bash
python3 framework/pipeline/scripts/validate_story.py --story <story_id>
```

Checks coverage closure, lens distribution, mixed-valence rotation, strength/weakness rotation. Output: `framework/stories/validation/{story_id}-validation-report-{timestamp}.yaml` (gitignored).

### 4. Run `story_consistency_reviewer` after substantive changes

Prose-on-prose review checking character consistency, voice consistency, earned growth beats, and rubric items 1–8. Run it after each new draft, after design-doc revisions, and as a final pass before Phase 7.

### 5. Authoring closeout

Ready for Phase 7 when:
- Story design doc exists with populated frontmatter.
- All `episode_count` per-episode drafts exist.
- `validate_story.py` returns PASS.
- `story_consistency_reviewer` returns ACCEPT.
- You have checked rubric item 9 (moment of surprise) yourself.
- All authored files are committed.

---

## Phase 7: Pipeline execution

Mechanical execution of what prose authoring decided. Each slash command runs in a fresh Claude Code conversation. Artifacts on disk are the source of truth between commands.

### Per-episode command sequence

For each episode `<NN>` in order, run three conversations:

| # | Command | Output |
|---|---|---|
| 1 | `/create_episode <story_id> <NN>` | `episode.yaml`, `episode_writer_input.yaml` |
| 2 | `/create_transcript <story_id> <NN>` | `transcript.yaml` |
| 3 | `/build_assistive_package <story_id> <NN>` | `ground_truth.yaml`, `diagnostic.yaml`, `prose.yaml`, `discussion.yaml`, `assistive_package.yaml` |

When starting each conversation, one line of context suffices: *"Continue the pipeline for `{story_id}` episode 2."*

### Stage 1: `/create_episode`

- Confirms the per-episode draft and story design doc exist.
- Runs `validate_story.py` over the story.
- Invokes `planning_agent` → produces `episode.yaml` (full plan with framework terminology) and `episode_writer_input.yaml` (barrier-safe projection).
- Invokes `validation_agent` — returns ACCEPT / REVISE / REJECT. One retry on REVISE; REJECT halts.
- Invokes `projection_reviewer` — checks for paraphrased framework leakage.
- Runs `validate_schema.py` against both files, including the literal-scan barrier enforcement.

### Stage 2: `/create_transcript`

- Re-validates the projection against its schema.
- Invokes `dialog_writer` as a fresh subagent **with no Read tool** — the structural information barrier. Receives `episode_writer_input.yaml` contents inline only.
- Runs `review_transcript.py` for structural compliance (turn count, word count, speaker names). Up to 3 dialog-writer attempts on failure.
- Invokes `transcript_id` (sees full plan) to sharpen weakness and strength signals.
- Invokes `transcript_reviewer` — seven quality criteria including signal-landing checks. One revise budget.
- Enumerates turns and sentences; validates against transcript schema.

### Stage 3: `/build_assistive_package`

- Runs four authoring agents sequentially: `analyst_agent` → `diagnostic_agent` → `prose_agent` → `discussion_agent`. Each reads its inputs from files and writes one output file.
- Invokes `package_reviewer` — returns ACCEPT / REVISE with structured findings per the 17 review criteria (see `pipeline-architecture.md` §3.5).
- On ACCEPT, runs `merge_assistive_package.py` — deterministic merge producing `assistive_package.yaml` with integrity checks and derived fields.
- Runs `validate_schema.py` on the merged package.

---

## Operating principles

**Reviewer loops are autonomous.** Once you invoke a command, let it run to completion or halt. Each command has bounded retry budgets.

**Telemetry is automatic.** Each command appends to `pipeline_log.yaml` — forensic, not operational.

**Read the artifacts.** Don't trust that ACCEPT means the artifact is what you wanted. Check that it does what you intended.

---

## When a command halts

Each command has bounded retry budgets. When exhausted:

1. **Read** the artifact in its final state and the latest reviewer report.
2. **Decide:**
   - **Edit and resume** — manually fix the artifact, re-invoke the next command.
   - **Accept as-is** — proceed despite reviewer concerns (edge cases you judge acceptable).
   - **Restart upstream** — return to `/create_episode`, or to prose authoring for structural problems.

### The re-planning loop

When the same signal fails to land across two episodes:

1. **Local fix.** Revise the per-episode draft's signal to be more concrete and stageable. Re-run `/create_transcript`.
2. **Structural mark.** If the local fix doesn't take, re-run `validate_story.py` and `story_consistency_reviewer` over the whole story.
3. **Story-level repair.** Revise the draft to use a different carrier, or revise the design doc. Re-check all existing drafts for drift.

Never pressure the evaluator to commit harder to satisfy coverage.

---

## Common failures

| Failure | Fix |
|---|---|
| `validate_story.py` reports `lens_starved` | Change an episode's `primary_lens` to the starved lens; revise targets |
| `validate_story.py` reports `shape_dominant` | Replace the dominant shape in one episode |
| `validate_story.py` reports strength/weakness `concentration` | Move entries to a different carrier in a different episode |
| `validate_story.py` reports `pattern_uncovered` or `dynamic_uncovered` | Add a target or revise the declared subset |
| `story_consistency_reviewer` reports `behavior_drift` | Revise the episode draft or the design doc |
| `/create_episode` halts at REJECT | Fix the per-episode draft frontmatter; re-run |
| `/create_transcript` halts at LEAK | Re-run `/create_episode` to rewrite the projection; if the leak originates in the draft's signals, fix the draft first |
| `/create_transcript` exhausts dialog-writer budget | The turn outline is too hard to render in 10–14 turns; revise the draft's beats or social_signal |
| `/create_transcript` exhausts budget on signal landing (5b/5c) | Revise the signal to be more concrete; if persistent, escalate to the re-planning loop |
| `/build_assistive_package` reviewer flags generic intervention cells | Re-run the diagnostic agent; if persistent, the ground truth is too thin — check the story design |

---

## Diagnostic scripts

| Script | Purpose |
|---|---|
| `validate_story.py --story <id>` | Cross-episode rules (coverage, rotation, distribution) |
| `validate_schema.py <artifact> <schema>` | Artifact against descriptive YAML schema |
| `merge_assistive_package.py` | Merge four authored files into `assistive_package.yaml` |
| `log_pipeline_event.py` | Append telemetry event (used internally) |

---

## What this manual does not cover

- **Story design guidance** — `story-design.md`
- **Pipeline architecture and field schemas** — `pipeline-architecture.md`
- **The conceptual framework** — `conceptual-framework.md`
- **System structure and conventions** — `system-architecture.md`
