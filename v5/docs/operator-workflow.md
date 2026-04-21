# Polylogue v5 Operator Workflow

This document describes how an operator actually drives the v5 pipeline — which commands to run in what order, when human review happens, and what each approval gate expects. Structural and pedagogical context live in `architecture.md` and `instructional-design.md`.

## 1. Command Sequence

Authoring a new story is a three-command sequence. Each command is run interactively in Claude Code and produces artifacts under `stories/` or `artifacts/`.

```
/design_story                                 (once per story)
  └─ stories/{story_id}/story.yaml
  └─ stories/{story_id}/story-design-review.md

/create_transcript {episode_id}               (per episode, after story approved)
  └─ artifacts/{story_id}/{episode_id}/transcript.raw.yaml
  └─ artifacts/{story_id}/{episode_id}/reasoning-proposals.yaml
  └─ artifacts/{story_id}/{episode_id}/transcript.post-doctor.yaml
  └─ artifacts/{story_id}/{episode_id}/transcript.yaml

/create_lesson_package {episode_id}           (per episode, after transcript accepted)
  └─ artifacts/{story_id}/{episode_id}/lesson_package.yaml
```

`/design_story` is story-scoped and runs once. `/create_transcript` and `/create_lesson_package` are episode-scoped and run once per episode.

## 2. Typical Workflow (Happy Path)

### Step 1 — Design the story

```
/design_story
```

An extended interactive session driven by the main orchestrator (no subagent). The session moves through four phases:

- **Phase A — World and voice.** Premise, setting (in prose), characters with voice hooks.
- **Phase B — Arc.** Episode map with narrative seeds.
- **Phase C — Per-episode co-design.** For each episode: synopsis (with embedded persuasive thread), reading-time target, final takeaway.
- **Phase D — Review and serialize.** Lens-coverage check, persuasive-thread check, audience-fit check, reading-time sanity; write `story.yaml`; run validator; produce `story-design-review.md`.

**Operator involvement:** high, but co-designed. You bring the creative vision; the orchestrator holds the taxonomy awareness and authoring doctrine (persuasive-thread discipline, audience fit, lens coverage, reading-time heuristic, narrator convention).

**Gate (end of Phase D):** review `story-design-review.md` and set `Status: approved`. Transcript drafting may not start until this is set.

**Review target:**

- Each `episode_synopsis` embeds a real persuasive thread (someone trying to convince others of something).
- `premise`, `episode_synopsis`, and `final_takeaway` fields are pitched at 6th-grade.
- Episode synopses collectively make room for all three lenses (`logic`, `evidence`, `scope`), unless the story leans one way by intent.
- Reading-time targets are plausible for the synopsis scope (~4–5 turns per minute at ~30 words each).

### Step 2 — Draft one transcript

```
/create_transcript episode_01
```

`/create_transcript` is the longest command. It reads the full `story.yaml` (for cross-episode context) plus the target episode block, verifies `story-design-review.md` is approved, and runs three internal gates:

1. **Raw-draft review.** `staff_writer` drafts `transcript.raw.yaml` from the target episode block, with the full story available as context. Operator reviews for natural voice, momentum, faithfulness to the synopsis. If revisions are needed, re-invoke `staff_writer` within the same run.

2. **Proposal review.** `script_doctor` reads the approved raw draft against the reasoning taxonomy and writes `reasoning-proposals.yaml`. Operator reviews proposed anchors against the five selection criteria (§4.1 of `instructional-design.md`), the polarity classification, the articulated intended claim, and any revised anchor wording. Operator can accept, reject, or ask for revision.

3. **Post-doctor spot-check.** `script_doctor` applies the operator-approved proposals and writes `transcript.post-doctor.yaml`. Operator spot-checks that revised turns read naturally in context. If the revision quality is poor but the proposal set still stands, ask `script_doctor` to re-apply. If the proposal set itself needs revision, reopen the proposal review.

After all three gates pass, `transcript_structurer` segments the post-doctor draft into 3+ scenes with summaries, producing `transcript.yaml`.

**Operator involvement:** high. Three review passes per episode.

### Step 3 — Author the lesson package

```
/create_lesson_package episode_01
```

`lesson_package_builder` reads `story.yaml` (for episode title and final_takeaway), `transcript.yaml`, `reasoning-proposals.yaml`, and `reasoning-taxonomy.yaml`. It authors the three-step quiz (claim → judgment → why) per approved anchor: Step 1 options with per-choice feedback, Step 2 buy/not-buy routing, Step 3 `why_yes` and `why_no` branches, optional hint, and takeaway.

**Operator involvement:** medium. Review the authored levels for clarity, claim accuracy, answer distinguishability, and feedback quality. If a level is weak, revise within the same run.

## 3. Approval Gates in Detail

### Gate: story-design-review.md

**Produced by:** `/design_story` at Phase D.

**What to review:**

- Does each `episode_synopsis` name a real persuasive thread (someone trying to convince others of something)?
- Are `premise`, every `episode_synopsis`, and every `final_takeaway` pitched at a 6th-grade reader?
- Do the episode synopses collectively give space to all three lenses, or is one conspicuously absent?
- Are `reading_time_minutes` values plausible for the synopsis scope?
- Does the episode set form a coherent arc, or are individual episodes isolated?

**Reject if:** an episode has no persuasive pressure, stakes read as adult-only, or lens coverage has a gap the operator did not choose on purpose.

**Artifact format.** Operator-authored markdown. Minimum required content:

```markdown
# Story Design Review — {story_id}

- Status: approved | revise
- Reviewer: {operator id}
- Date: {YYYY-MM-DD}

## Lens coverage
- logic: covered by {episode_ids} | gap
- evidence: covered by {episode_ids} | gap
- scope: covered by {episode_ids} | gap

## Persuasive threads
- {episode_id}: {one-line naming the thread} — ok | concern

## Audience fit
- premise: ok | concern
- episodes: ok | concern — {notes}

## Reading-time sanity
- ok | concern — {notes}

## Notes
{free text, required if status is revise}
```

A `Status: approved` line is the load-bearing signal — `/create_transcript` checks for it before allowing any transcript drafting for this story.

### Gate: raw-draft review

**Produced by:** `/create_transcript`, checkpoint 1.

**What to review:**

- Does the dialogue sound like middle-school characters?
- Does the persuasive thread from the `episode_synopsis` actually surface in dialogue?
- Does the episode have the momentum it needs for its target reading time?
- Is narrator usage light and well-placed (scene-setting only, no exposition or moralizing)?

**Reject if:** the persuasive thread isn't audible, the voices read wrong, the narrator is over-used or didactic, or the story feels skeletal. Ask for revision inside the same run.

### Gate: proposal review

**Produced by:** `/create_transcript`, checkpoint 2.

**What to review per proposal:**

- Does the source turn actually do argumentative work? (criterion 1)
- Is it more than expressive language? (criterion 2)
- Can you state the speaker's claim from what's on the page? (criterion 3)
- Is the reasoning quality audible in the line — or does the revised wording make it so? (criterion 4)
- Does the `(reasoning_item_id, polarity)` classification match the reasoning move? (criterion 5)

**What to review globally:**

- Is the mix of weak and strong anchors what the story calls for?
- Are the intended claims specific enough to author into Step 1 quiz options?
- Do any revised turns read as scripted or preachy? (reject those)

**Reject if:** any proposal fails a criterion, a claim is too vague, or a revision reads didactic. You can accept, reject, relabel, tone down, or request revisions on individual proposals.

### Gate: post-doctor spot-check

**Produced by:** `/create_transcript`, checkpoint 3.

**What to review:**

- Do revised turns read naturally in their scene context, not like lifted lesson lines?
- Do the approved anchors still land after surrounding dialogue is read through?

**Two failure modes:**

- **Application quality poor, but proposals still stand** → ask `script_doctor` to re-apply only.
- **Proposals need revision** → reopen checkpoint 2.

## 4. Rerun Behavior

Each command owns a specific set of artifacts (see `architecture.md` §3.1). On entry, the command:

1. Identifies its owned artifacts.
2. Reports any that already exist.
3. Asks the operator to confirm removal.
4. Runs fresh from a deterministic starting state.

**Ownership boundaries:** `/create_transcript` never deletes `story.yaml`; `/create_lesson_package` never touches the transcript. An approved upstream artifact is never cleared by a downstream command.

This means rerunning a command is always a deliberate, confirmed operation — there is no silent auto-resume from a partial state.

## 5. Revision Scenarios

### "The transcript is good but one anchor is wrong"

Rerun `/create_transcript` for that episode. Confirm clearing the owned artifacts. The command will redraft. If most of the raw draft was fine, you can approve the raw review quickly; the real work is in the proposal-review gate.

### "The lesson package needs better feedback on Step 3"

Rerun `/create_lesson_package` for that episode. It clears only `lesson_package.yaml`. The transcript and proposals upstream are untouched.

### "Episode 3's design is weak"

Rerun `/design_story`. This clears `story.yaml` and `story-design-review.md`. If most of the design is fine, you can move quickly through Phases A and B (accepting what's there) and focus Phase C on the problem episode. Downstream artifacts under `artifacts/{sid}/` for other episodes may still exist but may no longer match the revised story — regenerate them as needed.

### "The story itself needs a structural change"

Rerun `/design_story`. Same as above. Be aware: downstream artifacts (transcripts, lesson packages) will still exist but may no longer match. Rerunning the downstream commands is recommended.

## 6. Review Cadence Summary

| Stage | Operator role | Time cost |
|---|---|---|
| `/design_story` | Co-design across four phases; one approval gate at Phase D | Medium to high |
| `/create_transcript` | Review at three gates per episode | High — this is where authoring time lives |
| `/create_lesson_package` | Review authored quiz content | Medium |

The transcript stage is the operator-intensive one by design. Early review effort at `/design_story` Phase D prevents downstream rework.

## 7. Validators

After any artifact is written or revised, the relevant command runs its validator:

```
pipeline/scripts/validate_story.py                 <path>
pipeline/scripts/validate_transcript.py            <path>
pipeline/scripts/validate_reasoning_proposals.py   <path>
pipeline/scripts/validate_lesson_package.py        <path>
```

A validator failure blocks the gate it precedes — the operator is not asked to approve an invalid artifact. `story-design-review.md` is operator-authored prose and has no validator; its `Status: approved` line is the gate signal `/create_transcript` reads.

## 8. Cross-references

- System structure and artifact flow: [`architecture.md`](architecture.md)
- Pedagogy and authoring principles: [`instructional-design.md`](instructional-design.md)
- Reasoning taxonomy: [`../reference/reasoning-taxonomy.yaml`](../reference/reasoning-taxonomy.yaml)
- Artifact shape contracts: [`../schemas/`](../schemas/)
- `/design_story` command doctrine: [`../pipeline/commands/design_story.md`](../pipeline/commands/design_story.md)
