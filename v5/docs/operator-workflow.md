# Polylogue v5 Operator Workflow

This document describes how an operator actually drives the v5 pipeline — which commands to run in what order, when human review happens, and what each approval gate expects. Structural and pedagogical context live in `architecture.md` and `instructional-design.md`.

## 1. Command Sequence

Authoring a new story is a four-command sequence. Each command is run interactively in Claude Code and produces artifacts under `stories/` or `artifacts/`.

```
/create_story                                 (once per story)
  └─ stories/{story_id}/story.yaml

/create_episodes                              (once per story; plans all episodes)
  └─ artifacts/{story_id}/{episode_id}/episode-plan.yaml
  └─ artifacts/{story_id}/{episode_id}/showrunner-projection.yaml
  └─ artifacts/{story_id}/{episode_id}/episode-design-review.md

/create_transcript                            (per episode)
  └─ artifacts/{story_id}/{episode_id}/transcript.raw.yaml
  └─ artifacts/{story_id}/{episode_id}/reasoning-proposals.yaml
  └─ artifacts/{story_id}/{episode_id}/transcript.post-doctor.yaml
  └─ artifacts/{story_id}/{episode_id}/transcript.yaml

/create_lesson_package                        (per episode, after transcript accepted)
  └─ artifacts/{story_id}/{episode_id}/lesson_package.yaml
```

`/create_story` and `/create_episodes` are story-scoped and run once. `/create_transcript` and `/create_lesson_package` are episode-scoped and run once per episode.

## 2. Typical Workflow (Happy Path)

### Step 1 — Create the story

```
/create_story
```

Conversational. The story designer asks about setting, characters, tone, and episode map. The operator answers as needed. Once the shape is clear, the designer drafts `story.yaml` and runs the validator.

**Operator involvement:** medium. You co-design; the agent drafts.

### Step 2 — Plan the episodes

```
/create_episodes
```

The showrunner drafts the full episode plan set for the story in one run. Each episode gets an `episode-plan.yaml` (with `context`, `argument`, `description`, `lenses[]`) and a paired `showrunner-projection.yaml`.

**Gate:** at the end, the operator reviews all episode designs and signs off via `episode-design-review.md`. Transcript drafting may not start until this is accepted.

**Review target:** each episode has a clear, age-appropriate `argument` that creates a persuasive thread. Each episode declares one or more lenses that match what the argument naturally exposes.

### Step 3 — Draft one transcript

```
/create_transcript
```

This is the longest command. It has three internal approval gates:

1. **Raw-draft review.** `staff_writer` drafts `transcript.raw.yaml` from the projection. Operator reviews the story for natural voice, momentum, and faithfulness to the projection. If revisions are needed, re-invoke `staff_writer` within the same run.

2. **Proposal review.** `script_doctor` reads the approved raw draft against the reasoning taxonomy and writes `reasoning-proposals.yaml`. Operator reviews proposed anchors against the five selection criteria (§4.1 of `instructional-design.md`), the polarity classification, the articulated intended claim, and any revised anchor wording. Operator can accept, reject, or ask for revision.

3. **Post-doctor spot-check.** `script_doctor` applies the operator-approved proposals and writes `transcript.post-doctor.yaml`. Operator spot-checks that revised turns read naturally in context. If the revision quality is poor but the proposal set still stands, ask `script_doctor` to re-apply. If the proposal set itself needs revision, reopen the proposal review.

After all three gates pass, `transcript_structurer` segments the post-doctor draft into 3+ scenes with summaries, producing `transcript.yaml`.

**Operator involvement:** high. Three review passes per episode.

### Step 4 — Author the lesson package

```
/create_lesson_package
```

`lesson_package_builder` reads `transcript.yaml`, `reasoning-proposals.yaml`, and `reasoning-taxonomy.yaml`. It authors the three-step quiz (claim → judgment → why) per approved anchor: Step 1 options with per-choice feedback, Step 2 buy/not-buy routing, Step 3 `why_yes` and `why_no` branches, optional hint, and takeaway.

**Operator involvement:** medium. Review the authored levels for clarity, claim accuracy, answer distinguishability, and feedback quality. If a level is weak, revise within the same run.

## 3. Approval Gates in Detail

### Gate: episode-design-review.md

**Produced by:** `/create_episodes` at the end of the run.

**What to review:**

- Does each episode's `argument` name a real persuasive thread (someone trying to convince someone of something)?
- Are `context`, `argument`, and `description` pitched at a 6th-grade reader?
- Does each episode's `lenses[]` declaration match what the argument actually exposes?
- Does the episode set form a coherent arc, or are individual episodes isolated?

**Reject if:** an episode has no real argument, stakes read as adult-only, or the lens declaration doesn't match the persuasive thread.

### Gate: raw-draft review

**Produced by:** `/create_transcript`, checkpoint 1.

**What to review:**

- Does the dialogue sound like middle-school characters?
- Does the persuasive thread from `argument` actually surface in dialogue?
- Does the episode have the momentum it needs for an 8–10 minute read?

**Reject if:** the argument isn't audible, the voices read wrong, or the story feels skeletal. Ask for revision inside the same run.

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

**Ownership boundaries:** `/create_transcript` never deletes `episode-plan.yaml`; `/create_lesson_package` never touches the transcript. An approved upstream artifact is never cleared by a downstream command.

This means rerunning a command is always a deliberate, confirmed operation — there is no silent auto-resume from a partial state.

## 5. Revision Scenarios

### "The transcript is good but one anchor is wrong"

Rerun `/create_transcript`. Confirm clearing the owned artifacts. The command will redraft. If most of the raw draft was fine, you can approve the raw review quickly; the real work is in the proposal-review gate.

### "The lesson package needs better feedback on Step 3"

Rerun `/create_lesson_package`. It clears only `lesson_package.yaml`. The transcript and proposals upstream are untouched.

### "The episode design for episode 3 is weak"

Rerun `/create_episodes`. This clears all episode plans and projections (story-scoped). If most of the plans are fine, you can approve them quickly at the design gate and just focus your review on the problem episode.

### "The story itself needs a structural change"

Rerun `/create_story`. This clears `story.yaml`. Be aware: downstream artifacts (episode plans, transcripts, lesson packages) will still exist but may no longer match. Rerunning the downstream commands is recommended.

## 6. Review Cadence Summary

| Stage | Operator role | Time cost |
|---|---|---|
| `/create_story` | Co-design | Short; conversational |
| `/create_episodes` | Review episode designs at the end | Medium |
| `/create_transcript` | Review at three gates per episode | High — this is where authoring time lives |
| `/create_lesson_package` | Review authored quiz content | Medium |

The transcript stage is the operator-intensive one by design. Early review effort there prevents downstream rework in the lesson package.

## 7. Validators

After any artifact is written or revised, the relevant command runs its validator:

```
pipeline/scripts/validate_story.py                 <path>
pipeline/scripts/validate_episode_plan.py          <path>
pipeline/scripts/validate_transcript.py            <path>
pipeline/scripts/validate_reasoning_proposals.py   <path>
pipeline/scripts/validate_lesson_package.py        <path>
```

A validator failure blocks the gate it precedes — the operator is not asked to approve an invalid artifact.

## 8. Cross-references

- System structure and artifact flow: [`architecture.md`](architecture.md)
- Pedagogy and authoring principles: [`instructional-design.md`](instructional-design.md)
- Reasoning taxonomy: [`../reference/reasoning-taxonomy.yaml`](../reference/reasoning-taxonomy.yaml)
- Artifact shape contracts: [`../schemas/`](../schemas/)
