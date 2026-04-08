# Polylogue Operator Manual

This manual is the end-to-end runbook for authoring and running a Polylogue story. It is written for the operator — the person sitting at the keyboard with Claude Code, designing curriculum.

It assumes you understand the conceptual framework (lenses, facets, explanatory variables) at a working level — if not, read `framework/docs/conceptual-framework.md` first. The cast design rules, coverage contract, and rotation rules are spelled out in `framework/docs/story-design.md`; this manual points at the sections you need as you encounter them.

The operator's work is in two phases: **prose authoring** (you author the story design doc and per-episode drafts, iterating with `validate_story.py` and `story_consistency_reviewer`, no pipeline runs) and **pipeline execution** (you run the slash commands for each episode in order, capturing friction). The earlier cleanup and post-pilot closeout phases have shipped.

---

## Prerequisites

Before authoring or running anything:

1. **Bootstrap the application.** Each application has its own initialization script. Run the one for the application you're targeting (Lens is the priority):
   ```bash
   python3 apps/lens/pipeline/initialize_lens.py
   # or
   python3 apps/reasoning-lab/pipeline/initialize_reasoning_lab.py
   ```
   This clears `.claude/commands/` and `.claude/agents/`, then syncs shared upstream commands/agents from `framework/pipeline/` and the application's own commands/agents from `apps/{app-id}/pipeline/`. It also verifies that all required reference data and schema files exist.

   Re-run the init script after editing any file in the pipeline directories, or when switching applications.

2. **Confirm reference data is loadable.** The bootstrap step verifies this. If it reports any missing files in `framework/reference/`, `framework/schemas/`, or `apps/{app-id}/{reference,schemas}/`, fix them before proceeding.

3. **Read `framework/docs/story-design.md`.** The cast design rules, the coverage contract semantics, and the information barrier expectations are all in there. This manual references them but does not restate them.

---

## Prose-first authoring

This phase produces three things, all authored by you (with AI assistance) in conversation:

1. The **story design doc** at `framework/stories/{story_id}.md`.
2. The **per-episode drafts** at `framework/stories/{story_id}/episode_{NN}.md` (one per episode).
3. The **friction log** at `framework/stories/{story_id}-friction-log.md` (started in Phase 7 but you can begin it here if you find issues during authoring).

No slash commands run during prose authoring. The pipeline does not execute. This phase is creative authoring, gated by `validate_story.py` and `story_consistency_reviewer`.

### 1. Author the story design doc

**File:** `framework/stories/{story_id}.md`

**Format:** Markdown with YAML frontmatter at the top:

```markdown
---
story_id: saving-the-maker-space
title: Saving the Maker Space
coverage_mode: focused
declared_facets: [sufficiency, source_credibility, relevance, perspective_engagement]
declared_cognitive_patterns: [false_certainty, confirmation_bias]
declared_social_dynamics: [group_pressure]
episode_count: 5
---

# Saving the Maker Space

(prose body: premise, setting, cast, arc summary, stakes, pedagogical commitments)
```

**Frontmatter fields:** `story_id`, `title`, `coverage_mode` (`full` or `focused`), `episode_count`. For `focused` stories, also `declared_facets`, `declared_cognitive_patterns`, `declared_social_dynamics`. The focused floor is hard: ≥3 facets, ≥1 cognitive pattern, ≥1 social dynamic.

**Prose body sections (recommended):**
- **Premise.** What the story is about, in one or two paragraphs.
- **Setting.** Where it takes place, what the stakes are, who matters.
- **Cast.** One section per character (4–6 characters total). For each: name, voice notes, the way they reason (cognitive moves they tend to make), the social dynamic they tend to drive or absorb, lens disposition, and any growth arc.
- **Arc summary.** A paragraph or two on how the story moves across episodes.
- **Stakes.** What the kids stand to lose. What they stand to gain.
- **Pedagogical commitments.** What you want students to walk away noticing.

The cast section is **load-bearing**. It is the source of truth for character identity that `story_consistency_reviewer` will check every per-episode draft against. Take the time to make it specific. "Maya is logic-leaning and prone to false certainty" is too thin. "Maya is the kid who remembers a single source she encountered last week and treats it as the whole record. When the group is moving toward a decision, she's the one who states the consensus a beat too early — making it harder for anyone who disagrees to speak up. From episode 4 onward, after the petition fails, she starts to catch herself doing this, but only sometimes." That is a description the reviewer can check episode behavior against.

Cast design rules in one line: 4–6 characters total, 2–3 per episode; no character is an embodied fallacy (each carries 2–3 cognitive tendencies + 1 social dynamic contribution that surface situationally); at most 2 characters have visible growth arcs; the cast collectively models all three lens dispositions without naming them; the cast collectively must carry the declared coverage. Full rationale and the strength/weakness rotation rules: `framework/docs/story-design.md`.

### 2. Author per-episode drafts

**Files:** `framework/stories/{story_id}/episode_{NN}.md`, one per episode (`NN` is zero-padded: `episode_01.md`, `episode_02.md`, ...).

**Format:** Markdown with YAML frontmatter (the operator's authoring artifact for one episode) plus a prose body. The full template is in Appendix B of `framework/docs/story-pipeline-revision.md` — read it once before writing your first draft. The fields are summarized below.

The frontmatter fields the validator and `planning_agent` will consume:

- `story_id`, `episode_number`, `title`
- `premise` — one paragraph in narrative terms (no framework vocabulary)
- `lead_characters` — 2–5 names from the design doc cast; every strength/weakness carrier must appear in this list
- `primary_lens` — `logic`, `evidence`, or `scope`
- `mixed_valence_shape` — `early_strength_collapse`, `strength_prevails`, `stalemate`, `self_correction`, or `unresolved_disagreement`
- `previously` — one or two narrative sentences recapping prior episodes (empty string for episode 1)
- `targets[]` — each entry is `{facet, lens, carrier, cognitive_pattern, social_dynamic, cognitive_signal, social_signal, interaction_note}`. `cognitive_signal` is required iff `cognitive_pattern` is non-null; same for `social_signal`/`social_dynamic`.
- `strengths[]` — each entry is `{facet, carrier, note}`. No signals required.
- `beats[]` — 5–8 dramatic beats in operator language

The prose body should contain at least:
- `## Authorial notes` — what this episode is for in the arc, what you considered and rejected, callbacks to set up, anything future-you needs to remember when revising.
- `## Why these targets` — one paragraph per target explaining why this facet/pattern/dynamic landed on this carrier in this episode. `story_consistency_reviewer` reads this to check the targets aren't arbitrary.

**The hardest part.** The hardest part of authoring a draft is writing the per-target signals. They have to be three things at once:

1. **Stage directions, not analysis.** "Maya cites a single article she half-remembers from last week and dismisses Jordan's pushback as overcautious" — not "Maya exhibits false_certainty driven by overgeneralization." Boundary cases: `framework/pipeline/agents/projection_reviewer.md`.
2. **Faithful to the design doc.** The signal must be a recognizable instance of how this character reasons per the cast prose. If it's a contradiction, `story_consistency_reviewer` will flag it as drift.
3. **Concretely realizable in dialog.** A `cognitive_signal` that no dialog writer could plausibly stage in a 6th-grader's voice will fail downstream when `transcript_reviewer` checks whether the signal landed.

**Iteration is normal.** Expect to revise both the design doc and the per-episode drafts multiple times. Drafting episode 3 often reveals something about the cast that wasn't pinned down well enough in the design doc. That's fine — go back and revise the design doc, then re-check earlier drafts against it.

### 3. Run `validate_story.py` after each draft

```bash
python3 framework/pipeline/scripts/validate_story.py --story <story_id>
```

This walks the design doc frontmatter and every per-episode draft frontmatter under `framework/stories/{story_id}/`. It runs all the cross-episode rules:

- Coverage closure (declared facets/patterns/dynamics actually appear in episode targets, with both weakness and strength episodes for facets)
- Lens distribution (every lens appears as primary in ≥1 episode; no lens dominates more than half)
- Mixed-valence shape rotation (no shape in more than half)
- Strength rotation (no character carries more than half the strengths)
- Weakness rotation (no character carries more than half the weaknesses)
- Per-draft schema sanity (lead count, valid lens, valid shape, episode_number in range, signals present where required)

The hedged-annotation rule is skipped during prose authoring because there are no `analysis.yaml` files yet.

The audit lands at `framework/stories/{story_id}-validation-report.yaml`. If `validate_story.py` reports any FAIL, fix the offending file(s) and re-run. The validator exit code is 0 only when there are no failures.

### 4. Run `story_consistency_reviewer` after substantive changes

`story_consistency_reviewer` is a prose-on-prose review of the design doc plus all per-episode drafts written so far. It checks character consistency, voice consistency, earned growth beats, and story-design rubric items 1–8 (stakes concrete and personal; cast small and distinct; arc has momentum; coverage closes; mixed-valence varied; ending earned; no embodied fallacies; serial pull from episode to episode). Item 9 ("moment of surprise") stays human-only — you check that yourself.

To invoke it from a Claude Code conversation:

> Use the Task tool with `subagent_type: story_consistency_reviewer`. Pass it pointers to `framework/stories/{story_id}.md` and every existing `framework/stories/{story_id}/episode_*.md`. Ask it to return the structured report described in the agent prompt.

Run it:
- After each new episode draft is authored.
- After any substantive revision to the design doc (because the revision may have invalidated earlier drafts).
- As a final pass before Phase 7 begins.

The reviewer's verdict is `ACCEPT` or `REVISE`. There is no `REJECT` — drift is always recoverable by operator revision. The structured findings tell you which character drifted in which episode and what specifically to revise.

### 5. Authoring closeout

You're ready to leave prose authoring when all of these are true:

- The story design doc exists and has populated frontmatter.
- All `episode_count` per-episode drafts exist.
- `validate_story.py` returns PASS (exit code 0) over the story.
- `story_consistency_reviewer` returns ACCEPT (no outstanding ISSUEs) over the story design doc plus all drafts.
- You have personally checked rubric item 9 (moment of surprise) and are satisfied.
- You have committed all the authored files.

Then move to pipeline execution.

---

## Pipeline execution

Mechanical execution of what prose authoring already decided. One conversation per command per episode.

### Per-conversation hygiene

Run each slash command in a fresh Claude Code conversation. Token cost is lower, failure isolation is cleaner, and the autonomous reviewer loops within each command don't need conversational context to do their job.

For each episode `<NN>` in order, you'll run five conversations:

| # | Command |
|---|---|
| 1 | `/create_episode <story_id> <NN>` |
| 2 | `/create_transcript <story_id> <NN>` |
| 3 | `/analyze_transcript <story_id> <NN>` |
| 4 | `/design_scaffolding <story_id> <NN>` (Lens) or `/design_scoring_rubric <story_id> <NN>` (Reasoning Lab) |
| 5 | `/configure_session <story_id> <NN>` (Lens) or `/configure_competition <story_id> <NN>` (Reasoning Lab) |

When you start each conversation, give Claude one line of context like *"Continue the pipeline for `saving-the-maker-space` episode 2."* — that's enough orientation. The slash command itself reads what it needs from `framework/stories/{story_id}/` and `artifacts/{story_id}/episodes/episode_{NN}/`.

### What each command does

**`/create_episode <story_id> <NN>`**

- Confirms the per-episode draft and the story design doc exist.
- Re-runs `validate_story.py` over the story (catches anything you might have edited since authoring closeout).
- Invokes `planning_agent` to read the per-episode draft frontmatter and the story design doc and produce two artifacts:
  - `artifacts/{story_id}/episodes/episode_{NN}/episode.yaml` — the full episode plan with framework terminology, consumed by reviewers and `transcript_id`.
  - `artifacts/{story_id}/episodes/episode_{NN}/intermediates/episode_writer_input.yaml` — the barrier-safe projection consumed by `dialog_writer`. This is the only artifact that crosses the information barrier.
- Invokes `validation_agent` (fresh subagent) which returns `ACCEPT` / `REVISE` / `REJECT`. One retry budget on `REVISE`; `REJECT` halts.
- Runs `validate_schema.py` against both produced files. The `episode_writer_input.yaml` validation includes the literal scan that enforces the information barrier (no facet IDs, lens names used as classification, cognitive_pattern_ids, or social_dynamic_ids may appear).

**`/create_transcript <story_id> <NN>`**

- Re-validates the projection, then invokes `projection_reviewer` to check for *paraphrased* leakage that the literal scan can't catch.
- Invokes `dialog_writer` as a fresh subagent **with no Read tool** — the structural information barrier. The agent receives `episode_writer_input.yaml` contents inline only.
- Runs `review_transcript.py` for structural compliance (turn count, word count, speaker names). On failure, returns to dialog_writer; up to 3 attempts.
- Invokes `transcript_id` (which sees the full plan) to sharpen weakness and strength signals.
- Invokes `transcript_reviewer` for the seven quality criteria, including the split signal-landing checks (5a–5d). One revise budget; `REGENERATE` counts toward the dialog-writer attempt limit.
- Enumerates turns and sentences and validates the result.

**`/analyze_transcript <story_id> <NN>`**

- Invokes `evaluator` to segment passages, produce facet annotations (three passes: targeted weaknesses, targeted strengths, emergent), the unified AI perspective, and the facilitation guide.
- Validates both outputs and runs `check_analysis_invariants.py` to enforce cross-field invariants (every strong annotation has a contrastive_explanation, etc.).
- Invokes `analysis_reviewer` for an independent quality pass. One revise budget.

**`/design_scaffolding <story_id> <NN>`** (Lens) — produces `lens/scaffolding.yaml` and enriches `lens/facilitation.yaml` with passage-specific discussion starters. Reviewer-gated.

**`/configure_session <story_id> <NN>`** (Lens) — assembles `lens/session.yaml` from upstream artifacts. The operator authors only the genuinely episode-specific student-facing strings (`onboarding.topic_summary`, `onboarding.reading_instruction`); everything else is derived or defaulted from `apps/lens/reference/default_instructions.yaml`.

**`/design_scoring_rubric <story_id> <NN>`** (Reasoning Lab) — produces `reasoning-lab/scoring.yaml` (observation buckets, explanation buckets, senior analyst report) and `reasoning-lab/competition-facilitation.yaml`.

**`/configure_competition <story_id> <NN>`** (Reasoning Lab) — assembles `reasoning-lab/session.yaml` from upstream artifacts.

### Reading the artifacts

After each command, read the artifacts it produced. Don't trust that the reviewer's ACCEPT means the artifact is what you wanted — it means the artifact is structurally and (in the reviewer's judgment) qualitatively acceptable. You're looking for whether it actually does what you intended.

| Artifact | What to check |
|---|---|
| `episode.yaml` | The targets faithfully realize the per-episode draft. Personas genuinely disagree. Turn outline tells a story. Move/response pairs are encoded for non-null `social_signal`s. |
| `episode_writer_input.yaml` | No facet IDs, no lens names, no pattern/dynamic names. Voice and weaknesses read as character traits, not as label restatements. (The literal scan and `projection_reviewer` should already have caught these, but read it yourself.) |
| `transcript.yaml` | The discussion sounds like a 6th grader actually wrote it. The targeted signals are visible to a careful reader without being announced. |
| `analysis.yaml` | Every targeted facet (weakness AND strength) is annotated. `evidence_basis` cites specific behavior in the cited sentences. Hedged labels are honest, not lazy. |
| `validation_report.yaml` (the story-level sidecar at `framework/stories/{story_id}-validation-report.yaml`) | Coverage closes. Lens distribution is balanced. Rotation rules pass. After pipeline execution has produced analyses, the hedged-annotation rule passes. |

### Reading reviewer reports

The reviewer agents (`validation_agent`, `transcript_reviewer`, `analysis_reviewer`, `projection_reviewer`, `story_consistency_reviewer`, the Lens scaffolding reviewer) all return structured reports. The verdict is at the top; the per-criterion findings are below.

When a reviewer returns `REVISE`, the calling command automatically re-invokes the producer with the report as feedback (one retry budget). When it returns `REGENERATE` (transcript_reviewer only), the calling command discards and starts over (counts toward the attempt budget). When the budget is exhausted, the command halts and surfaces the latest artifact and report to you.

When a command halts:

1. Read the artifact in its final state.
2. Read the latest reviewer report.
3. Decide: edit and resume (manually fix the artifact, re-invoke the next command), accept as-is (save as-is despite the reviewer's concerns — sometimes the reviewer is being conservative on an edge case you judge acceptable), or restart upstream (return to `/create_episode`, or in the worst case back to prose authoring).

### The re-planning loop

When the same signal fails to land across two episodes — `transcript_reviewer` flags 5b (cognitive signal) or 5c (social signal move/response) repeatedly, or `analysis_reviewer` keeps hedging the same label — the failure is structural, not local. Don't keep retrying the pipeline. Use the three-step loop:

**Step 1 — Local fix.** Re-run `/create_transcript` for the affected episode after revising the per-episode draft's `cognitive_signal` or `social_signal` to be more concrete and dialog-stageable. Most signal failures are local: the signal wasn't actionable enough.

**Step 2 — Structural mark + story-level re-validation.** If the local fix doesn't take after one or two attempts, the failure is structural. Mark the affected per-episode draft as needing revision and re-run `validate_story.py` and `story_consistency_reviewer` over the whole story. The reviewer may surface that the carrier persona's design-doc identity doesn't actually support this signal — in which case the right fix is at the story level, not the episode level.

**Step 3 — Story-level repair.** Either revise the per-episode draft to use a different carrier (one whose design-doc identity supports the signal), or revise the design doc to add the tendency to the existing carrier. If you revise the design doc, you must re-run `story_consistency_reviewer` over every existing per-episode draft to check for new drift, and you may need to regenerate downstream artifacts for episodes whose drafts depended on the old character description.

The discipline: never pressure the evaluator to commit harder to satisfy coverage. Persistent hedging is information about the design, not noise to be tuned away.

### Capture friction as you go

Append to `framework/stories/{story_id}-friction-log.md` after each episode. Capture every place the pipeline surprised you, every reviewer false positive, every place this manual was wrong or incomplete, every place a schema or agent should change in v2. The friction log is the only place qualitative pilot data lives — the artifacts and telemetry capture *what* the pipeline produced; the friction log captures *what it felt like to run*.

### Stopping and resuming across multiple authoring conversations

Prose authoring is "however many conversations are needed." You will likely:

- Start the design doc in one conversation.
- Refine the design doc and write episode 1 in another.
- Write episodes 2–3 in a third, after running `validate_story.py` and `story_consistency_reviewer` and addressing whatever drift surfaces.
- Etc.

The protocol for resuming: the artifacts on disk are the source of truth. Open a new conversation, give Claude one line of context like *"I'm authoring `saving-the-maker-space`. The design doc and episodes 1–3 exist; I want to write episode 4 today. Read the design doc and episodes 1–3 first, then we'll talk about episode 4."* That's enough.

For pipeline execution, the same protocol works. Each slash command reads what it needs from disk. You can run conversations across days.

---

## Common failures and how to recover

**`validate_story.py` reports `lens_starved`.** One of `logic` / `evidence` / `scope` is never the primary lens of any episode. Pick an episode whose primary_lens is over-represented and change it to the starved lens, then revise the targets and the prose body to make sense under the new lens.

**`validate_story.py` reports `shape_dominant`.** One mixed-valence shape appears in more than half the episodes. Pick the offending shape and replace it in one episode with a different shape (and revise the beats to match).

**`validate_story.py` reports `strength_concentration` or `weakness_concentration`.** One character carries more than half the strengths or weaknesses. Move at least one entry to a different carrier in a different episode, and check that the new carrier's design-doc identity supports it.

**`validate_story.py` reports `pattern_uncovered` or `dynamic_uncovered`.** A declared coverage item never appears in any episode draft. Either add a target for it to an episode that has room, or revise the declared subset (only acceptable if the pattern was a stretch in the first place).

**`story_consistency_reviewer` reports `behavior_drift`.** An episode shows a character doing something the design doc never establishes them as doing. The reviewer report names both quotes; pick one to revise (usually the episode draft, sometimes the design doc).

**`/create_episode` halts at validation_agent REJECT.** The drafted `episode.yaml` doesn't realize the per-episode draft faithfully — usually because the draft frontmatter has a structural problem (missing signal where pattern is set, carrier not in lead_characters, etc.). Read the validation report, fix the per-episode draft, re-run.

**`/create_transcript` halts at projection_reviewer LEAK.** The `episode_writer_input.yaml` paraphrases a framework label. The report names the field and quotes the leak. Re-run `/create_episode` to have `planning_agent` rewrite the projection — but if the leak is downstream of a leak in the per-episode draft itself (a `cognitive_signal` written too analytically), fix the draft first.

**`/create_transcript` exhausts the dialog_writer budget on structural review.** The projection is structurally hard to render — usually because the turn outline is asking for something the dialog writer can't naturally produce in 10–14 turns. Read `intermediates/transcript_raw.yaml` to see what dialog_writer kept producing, then revise the per-episode draft's beats or `social_signal` move/response shape.

**`/create_transcript` exhausts the budget on transcript_reviewer 5b/5c.** The cognitive or social signal isn't landing in the transcript. Local fix first (revise the signal to be more concrete and stageable). If the second attempt fails, escalate to the re-planning loop in 7.5.

**`/analyze_transcript` halts on `check_analysis_invariants.py`.** A strong annotation is missing `contrastive_explanation`, or a planned `target_strengths` entry has no matching strong annotation. Re-run `/analyze_transcript` once; if the second pass also fails, read `intermediates/` and fix the analysis manually. Don't ship without resolving this — strength signals are doctrinal.

**`/configure_session` complains about a missing onboarding string.** The two operator-authored strings (`onboarding.topic_summary`, `onboarding.reading_instruction`) need to be supplied. Author them in conversation, save the file, re-run.

---

## What this manual does not cover

- **Designing a story from scratch** — the cast/coverage/rotation rules and worked examples: `framework/docs/story-design.md`.
- **The full per-episode draft template** — Appendix B of `framework/docs/story-pipeline-revision.md`.
- **Architectural rationale** — `framework/docs/system-architecture.md` for the system shape; `framework/docs/story-pipeline-revision.md` for the spec.
- **The conceptual framework itself** — `framework/docs/conceptual-framework.md`.
