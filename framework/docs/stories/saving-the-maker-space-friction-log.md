# Friction log — Saving the Maker Space

Qualitative log of pipeline friction encountered while running the
story-based pipeline on its first authored story. Owned by the operator.
Each entry is dated and tagged by the pipeline stage that surfaced it.

The artifacts and pipeline event log capture *what* the pipeline
produced; this file captures *what it felt like to run* — surprises,
reviewer false positives, schema/agent gaps, places the operator manual
was wrong or incomplete.

---

## 2026-04-07 — Episode 1 / `/create_episode`

**Stage:** Phase 7, episode 1, after `/create_episode saving-the-maker-space 1`.

**Outcome:** ACCEPT on all 7 validation criteria. Schema PASS for both
`episode.yaml` and `episode_writer_input.yaml`. Targets, signals, and
turn outline align with the per-episode draft. No revisions required.

### Observation 1 — Background characters lost in projection

The episode 1 draft's authorial notes are explicit that Sam and Dev are
*present* at the lunch table even though they are not leads:

> Sam and Dev are not leads in this episode. Sam is in the room (she's at
> the table) but contributes nothing — that's the design-doc-established
> baseline her growth arc inflects out of in episode 4, so she has to be
> visibly silent here, not absent. Dev is at the table too but isn't a
> focus; his big move is waiting for episode 2. The episode mentions Dev
> once or twice in the dialog without making him a beat.

The barrier-safe projection (`episode_writer_input.yaml`) carries
characters only via `lead_characters` (constrained to 2–3) plus the
prose of `discussion_arc` and per-turn `accomplishes` fields. In the
generated projection, Sam and Dev appear nowhere — not in
`lead_characters`, not in `discussion_arc`, not in any `accomplishes`
line. `dialog_writer` will therefore render the scene as a 3-person
conversation, not a 5-person table with two peripheral kids.

**Why it matters:** for episode 1's facet signals, not at all — every
target is carried by Mira/Theo/Ren. For season continuity, a little:
Sam's "visibly silent, not absent" is the baseline her episode-4 growth
inflects out of, and the design doc deliberately wanted students to
remember Sam was *there* the whole time. Dev being mentioned in passing
was also a design-doc-owned setup beat for episode 2.

**Where the gap is:** the projection schema is technically correct —
adding `background_characters` would change the writer's prompt surface
in ways that need projection_reviewer rules. But `planning_agent` could
have surfaced background-character presence inside `discussion_arc` or
inside specific `accomplishes` lines (e.g., "Mira glances at Sam, who
says nothing, and keeps going"). It chose not to, presumably because the
draft's authorial-note paragraphs are not part of the structured fields
the agent reads from.

**v2 candidates:**

1. Extend `planning_agent.md` to instruct the agent to mine the draft's
   authorial notes for background-character continuity intent and
   express it through `discussion_arc` / `accomplishes` prose, not as a
   new schema field.
2. Or: add an optional `background_characters` field to
   `episode_writer_input.yaml` (name + one-line presence hint, no
   barrier risk) and a matching projection_reviewer rule.

Option 1 is lighter and barrier-safer. Option 2 is more reliable but
expands the projection surface area. Decision deferred to Phase 8.

**Manual update needed:** None for now. Revisit after seeing whether
Sam/Dev's absence in the episode-1 transcript actually feels wrong when
read against the design doc.

---

**Resolution (after episode 1 pipeline complete, before episode 2):**

Re-read the episode 1 transcript with the Sam/Dev question explicitly
in mind. Findings:

- The transcript reads cleanly as a 3-person scene. A reader who does
  not know the design doc would notice nothing missing. *In isolation*,
  the gap is invisible.
- For Dev, the gap turns out to be cosmetic: he becomes a lead in
  episode 2, so he gets introduced there as a lead rather than as a
  background reference. The "mention him once or twice in episode 1"
  beat was nice-to-have, not load-bearing.
- For Sam, the gap is **real**. The design doc commits Sam to
  "visibly silent, not absent" across episodes 1–3, with her speaking
  up in episode 4 as a growth arc. That arc only lands if the audience
  has experienced Sam being *in the room and not speaking* for several
  episodes. Episode 1's transcript has her *absent*, not silent. By
  the time episode 4 arrives, the "she's been there the whole time"
  baseline does not exist anywhere in the artifacts the audience can
  see — only in the design doc the audience never reads.

**Decision:** escalate. Episode 1 is shipped with the gap and we will
not retroactively rewrite it (the cost of regenerating is high; the
single-episode reader experience is fine; only the cross-episode arc
suffers, and only for Sam). For episode 2 onward, fix
`planning_agent.md` to honor background-character intent in the
draft's authorial notes.

**Fix applied:** added a "Background characters (present-but-not-lead)"
section to `framework/pipeline/agents/planning_agent.md`, between the
`turn_outline` field description and the "Explicitly excluded" block.
The instruction:

1. Tells the agent to mine the per-episode draft's authorial notes for
   declarations of background-character presence (e.g., "Sam is in the
   room but contributes nothing").
2. Tells the agent to thread the background character's **name** into
   `discussion_arc` and/or specific `accomplishes` lines, since the
   `lead_characters` list is hard-capped at 2–3.
3. Notes that this is barrier-safe so long as the mentions describe
   *presence and behavior*, not framework labels —
   `projection_reviewer` rules already cover this.
4. Explicitly forbids inventing background characters not declared in
   the draft's authorial notes.

**Operational consequence:** `apps/lens/pipeline/initialize_lens.py`
must be re-run before `/create_episode saving-the-maker-space 2` so
the harness picks up the updated `planning_agent` prompt. Otherwise
episode 2 will reproduce the gap.

**Risk note:** the design doc says Sam is in the room for episodes
1–3. Episode 1 already shipped without her. Episode 2 will be the
first time the new instruction is exercised — if it produces a
projection that mentions Sam (and Dev's history at the table), good.
If episode 2's transcript still treats the scene as 3-person, the
fix needs strengthening (e.g., adding an optional
`background_characters` field to the projection schema after all).
Watch for this in episode 2's transcript review.

**Status: closed for episode 1, applied forward for episodes 2+.**

---

**Follow-up after episode 2 transcript spot-check:**

The projection-side fix worked exactly as designed: episode 2's
`episode_writer_input.yaml` mentions Sam by name in `discussion_arc`
*and* in turn 9's `accomplishes` line ("She glances at Sam, who looks
up from the table but says nothing, and the meeting moves on around
Sam's silence"). Verified post-leak-fix copy.

**But Sam still does not appear in episode 2's `transcript.yaml`.**
Searched the 14 turns; her name does not occur in any sentence.

**Why:** the planted beat is a *non-verbal stage direction* (a glance,
a look-up, a not-speaking). The `transcript.yaml` schema is
**dialog-only** — `speaker` + `sentences[].text` and nothing else.
There is no narration field, no stage-direction field, no place for
"Mira glances at Sam." `dialog_writer` received the instruction
faithfully but had no structural place to render it. The only render
paths the schema allows would be:

1. Give Sam her own turn (contradicts the design: she's silent).
2. Have another character verbally name Sam (e.g., "Sam, you in?")
   which is a different beat — a conscious verbal acknowledgment,
   not a quiet glance.

So the projection-side fix is *necessary but not sufficient* to make
Sam visible in the rendered transcript. The Phase-7 architecture
forks Sam's continuity into two separate artifact layers:

- **Dialog layer (`transcript.yaml`):** Sam invisible. Cannot be made
  visible without a schema change or a hack.
- **Analysis layer (`analysis.yaml`, `facilitation.yaml`):** Sam can
  be surfaced by the **evaluator**, which reads `episode.yaml`
  directly (and `episode.yaml` *does* carry Sam's presence in its
  `discussion_dynamic` and turn 9 `accomplishes`). The evaluator
  also reads the design doc and per-episode draft prose, where the
  authorial notes spell out Sam's silence-as-baseline intent.

**Implication for the original design intent.** The design doc
commits Sam to silence-as-baseline across episodes 1–3 so that her
speaking up in episode 4 lands as an arc. *Who needs to perceive that
baseline?* Two readings:

1. **Students.** They read `transcript.yaml` in the Lens app. If
   Sam is invisible there, students cannot experience her silence as
   continuity. The arc only lands for them if the teacher narrates
   it.
2. **Teachers.** They read `facilitation.yaml`. If the evaluator
   surfaces Sam's presence there, teachers can scaffold the
   continuity verbally during the discussion. The arc lands through
   teacher mediation.

The original design doc reads more like (1) than (2). But (1) is
expensive (schema change + writer prompt + app rendering) and (2) is
cheap (just verify the evaluator picks Sam up from episode.yaml in
the next pipeline stage).

**Disposition for now: accept option (2).** Verify in the very next
step (`/analyze_transcript saving-the-maker-space 2`) that the
evaluator surfaces Sam's presence in `analysis.yaml`'s passage 04
commentary or `facilitation.yaml`'s `whats_here`. If the evaluator
picks her up unprompted, the architecture works through the analysis
layer and we accept the limitation. If it does not, the evaluator
prompt needs a similar instruction to the one I added to
planning_agent: *"if `episode.yaml`'s `discussion_dynamic` mentions a
present-but-silent character, surface their presence in your
commentary so teachers can scaffold the continuity."*

**v2 candidate (Phase 8) — rejected for now, logged for future
reconsideration:** add an optional `stage_directions` or
`non_verbal_beats` field to `transcript.yaml` schema, with matching
dialog_writer prompt and app rendering. This is the only way to
make non-verbal beats land in the student-facing transcript itself.
Cost is high (schema, writer, app). Benefit is high but only if
non-verbal continuity becomes a recurring need across stories. For
this single story we can rely on the teacher-mediated path and
defer the schema change. Reconsider if a second story authored in
Phase 8 also depends on present-but-silent characters.

**Status: reopened, awaiting next-step verification.**

---

**Preemptive evaluator.md edit (before `/analyze_transcript saving-the-maker-space 2`):**

Rather than wait to see whether the unmodified evaluator picks Sam up
unprompted, applied a parallel instruction to the one in
planning_agent.md. Added a "Surface present-but-silent characters"
subsection to `framework/pipeline/agents/evaluator.md`'s "Your Role"
section, immediately after the identifier-propagation paragraph.

The instruction:

1. States explicitly that `transcript.yaml` is dialog-only and cannot
   carry non-verbal beats — making the structural reason for the gap
   visible to the agent.
2. Notes that the agent has access to the source material that does
   carry the intent: `episode.yaml`'s `discussion_dynamic`, the
   per-episode draft's authorial notes, and the story design doc's
   cast section.
3. Tells the agent to surface present-but-silent characters in TWO
   specific places: `analysis.yaml`'s passage `notes` or
   `ai_perspective.why_it_happened`, and `facilitation.yaml`'s
   `whats_here` or `discuss.watch_for`.
4. Authorizes naming the silent character even though they do not
   appear in transcript.yaml, since the agent is reading episode.yaml
   and the design doc directly.
5. Forbids inventing silent characters not declared in any source.

**Operational consequence:** `apps/lens/pipeline/initialize_lens.py`
must be re-run before `/analyze_transcript saving-the-maker-space 2`,
so the harness picks up the updated evaluator prompt. Without the
re-init, the agent will run on the old prompt and the gap will
persist into episode 2's analysis layer.

**Verification when episode 2 analysis runs:** check whether
`analysis.yaml` mentions Sam in any passage notes or AI perspective
commentary, and whether `facilitation.yaml` mentions her in
`whats_here` or `watch_for`. If both surface her, the
teacher-mediated path is fully wired and Obs 1 can close (the
audience-of-students question still stands as a v2 candidate, but
the teacher-of-students question is solved).

**Status: preemptive fix applied; awaiting verification on episode 2 analysis.**

### Observation 2 — `review_transcript.py` Phase-5 rename leftover (BUG)

**Stage:** `/create_transcript` step that runs `review_transcript.py`
against `transcript_raw.yaml` and `episode_writer_input.yaml`.

**Symptom (from Claude Code console):**

```
Transcript review:
artifacts/saving-the-maker-space/episodes/episode_01/intermediates/transcript_raw.yaml
  Turns: 14
  Words: 204
  Speakers: {'Theo', 'Ren', 'Mira'}

  ISSUES (1):
    - Extra speakers not in plan: {'Mira', 'Ren', 'Theo'}
```

The script reports the *same three speakers* as both "the speakers it
found" and "speakers not in plan." That tautology is the tell: the
"plan speakers" set is empty, so every speaker looks extra.

**Root cause:** `framework/pipeline/scripts/review_transcript.py:56`
reads `plan.get("personas", [])`, but the script is invoked against
`episode_writer_input.yaml`, whose schema uses `lead_characters` (the
projection schema deliberately renamed/scoped this field, see
`framework/schemas/episode_writer_input.yaml` lines 68–71). With no
`personas` key in the projection, `plan_names` is the empty set, so the
set-difference test flags all actual transcript speakers as "extra."

The transcript itself is fine: 14 turns, 204 words, speakers all valid,
turn order matches outline (Claude Code verified this manually with an
inline Python check that read `lead_characters` directly).

**Classification:** Phase-5 rename leftover. The scenario→episode pass
(commit a65776f) updated commands, agents, and schemas but missed this
script. Validator script silently kept reading the old field name.

**Fix:** one-line change at `review_transcript.py:56` —
`plan.get("personas", [])` → `plan.get("lead_characters", [])`. Being
applied in another Claude Code terminal as of this entry; not editing
from here to avoid a parallel-edit conflict.

**Why this is worth more than a one-line fix:**

1. The other Phase-7 scripts under `framework/pipeline/scripts/` should
   be audited for the same field-name leftover. Candidates:
   `enumerate_transcript.py`, `check_analysis_invariants.py`,
   `validate_schema.py` (the projection-side rules), `check_coverage.py`
   (already known legacy per its docstring, not invoked by new
   pipeline). If any of them reads `personas` or `scenario_id` from a
   projection or new-pipeline artifact, same bug class.

2. The Phase-5 cleanup ran without an integration test that exercises
   every script against a real new-pipeline artifact. The rename audit
   was structural (find/replace + reviewer pass) but did not actually
   *run* every script end-to-end on the new format. This is the first
   end-to-end Phase-7 run, and it surfaced exactly the kind of silent
   leftover an integration test would have caught.

3. The error message itself is misleading. Reporting "extra speakers
   not in plan" when the plan-speakers set is empty hides the real
   cause (empty set, not extra speakers). v2 candidate: when
   `plan_names` is empty, the script should *fail loudly* with "could
   not find character list in plan file — expected key:
   `lead_characters`," not silently treat every speaker as extra.

**v2 candidates (Phase 8):**

- Add an integration test that runs every script in
  `framework/pipeline/scripts/` against a fixture from
  `artifacts/saving-the-maker-space/episodes/episode_01/`. Wire it
  into the initialize_*.py scripts or a `make check` target.
- Audit all scripts for `personas` and `scenario_id` reads against
  new-pipeline artifacts. Convert any silent-empty-set comparisons
  into loud-failure-on-missing-key.
- Consider whether the projection schema's `lead_characters` rename
  was worth the friction it caused here, or whether the field should
  have stayed `personas` for backward-compatibility with the existing
  validator scripts. (Probably yes — the rename clarifies that
  projection characters are a strict subset, not full personas — but
  the cost of rename-without-script-audit is worth noting.)

**Manual update needed:** the operator manual should mention that the
Phase-5 cleanup did not include a script-level integration test, so
operators running Phase 7 the first time should expect to find latent
script bugs. Defer to Phase 8 closeout — don't update the manual
mid-run.

### Observation 3 — `transcript.yaml` schema still uses legacy `scenario_id` as sole identifier (BUG + design gap)

**Stage:** `/create_transcript` final step — enumeration + schema validation
of `transcript.yaml` against `framework/schemas/transcript.yaml`.

**Symptom (from Claude Code console):**

```
Enumerated:
artifacts/saving-the-maker-space/episodes/episode_01/intermediates/transcript_polished.yaml
  -> artifacts/saving-the-maker-space/episodes/episode_01/transcript.yaml
  14 turns, 19 sentences, 33 IDs
Validating: artifacts/saving-the-maker-space/episodes/episode_01/transcript.yaml
  Schema: framework/schemas/transcript.yaml

  ISSUES (1):
    - root.scenario_id: required field missing
```

**Root cause:** two-part Phase-5 leftover.

1. `framework/schemas/transcript.yaml:9` declares `scenario_id` as a
   required top-level field. There are **no `story_id` or
   `episode_number` fields** in the schema. The schema was not updated
   when the rest of Phase 5 moved to story+episode addressing.
2. `enumerate_transcript.py` does not propagate `scenario_id` (or any
   identifier) from `episode.yaml` into the enumerated transcript
   output, so even the legacy field is missing.

The transcript itself enumerated cleanly (14 turns, 19 sentences, 33
IDs). This is purely an addressing/identifier problem.

**Why this is bigger than Observation 2.**

CLAUDE.md is explicit:

> The directory key is `{story_id}/episodes/episode_{NN}/`, not
> `{scenario_id}/`. The episode plan filename is `episode.yaml`.
> `scenario_id` survives as a field inside `episode.yaml` for
> traceability and pipeline log lines, but the on-disk addressing is
> by story and episode number.

The Phase-5 rename committed `episode.yaml` to that convention
(`scenario_id` retained as a traceability field; `story_id` +
`episode_number` are the primary addressing). But the *downstream*
schemas — `transcript.yaml`, and almost certainly `analysis.yaml`,
`facilitation.yaml`, and the Lens-side `scaffolding.yaml` /
`session.yaml` — were never audited. They likely all still use
`scenario_id`-only addressing.

If we patch only `transcript.yaml`'s validator to make the field
optional, or only have `enumerate_transcript.py` copy `scenario_id`
forward, the legacy terminology silently propagates through every
downstream artifact in the new pipeline. The rename never actually
finishes.

**Two possible fixes, very different scope:**

1. **Minimal (unblocks ep 1):** make `enumerate_transcript.py` copy
   `scenario_id` from `episode.yaml` into the enumerated transcript.
   Schema unchanged. Legacy field persists in downstream artifacts.

2. **Correct (finishes Phase 5):** update `transcript.yaml` schema to
   require `story_id` + `episode_number` (matching `episode.yaml`),
   keep `scenario_id` as an *optional* traceability field, propagate
   all three in `enumerate_transcript.py`, then audit `analysis.yaml`,
   `facilitation.yaml`, `lens/scaffolding.yaml`, `lens/session.yaml`
   for the same gap and update them all in one pass.

**Disposition for this run:** apply fix (1) if Claude Code's auto-fix
in the other terminal does that, accept it, let episode 1 complete.
**Do not let fix (2) creep into the middle of a Phase 7 run** — the
audit-and-update pass is a dedicated task that should happen between
episode 1 and episode 2 (or be scheduled into Phase 8 closeout if the
other downstream artifacts validate without complaint and the legacy
addressing turns out to be merely cosmetic).

**Connection to Observation 2.**

These are sibling bugs from the same root: Phase 5 did a structural
scenario→episode rename in the prose-authoring + planning_agent layer,
but did not run an end-to-end integration pass on the validator
scripts and the downstream schemas. Episode 1 is the first time the
new pipeline has actually executed `enumerate_transcript.py` or
`validate_schema.py` against a `transcript.yaml` produced from a new
`episode.yaml`. We are discovering the rename's incomplete coverage
one validator at a time.

**v2 candidates (Phase 8) — expanded from Observation 2:**

- **Schema audit:** every schema under `framework/schemas/` and
  `apps/lens/schemas/` should be checked for `scenario_id` references
  and updated to use `story_id` + `episode_number` as primary, with
  `scenario_id` optional for legacy traceability. Same pattern that
  CLAUDE.md established for `episode.yaml`.
- **Script audit:** every script under `framework/pipeline/scripts/`
  should be checked for `personas` reads against projection files and
  for `scenario_id`-only addressing of artifacts.
- **Integration test fixture:** add a test that runs every Phase-7
  command end-to-end against a fixture (probably the
  saving-the-maker-space episode 1 artifacts once they validate
  cleanly), and gates Phase-5-style cleanups behind passing the
  fixture.
- **Loud failure on missing identifiers:** validators should print
  the expected key names when a required field is missing, not just
  the path (already true for `validate_schema.py`'s output here, so
  this one's borderline).

**Manual update needed:** none mid-run. This is a Phase 8 item.

### Resolution — Observations 2 and 3 (between episode 1 and episode 2)

**Decision:** apply fix (2) from Observation 3 — finish the Phase-5
scenario→episode rename across all downstream schemas in one pass,
rather than band-aiding the immediate failure. Operator agreed
because the alternative (legacy terminology silently spreading
through every downstream artifact in the new pipeline) makes Phase 8
cleanup harder and adds confusion to every artifact a future
operator reads.

**What changed:**

*Schemas — `scenario_id` demoted to optional, `story_id` + `episode_number` required:*

- `framework/schemas/transcript.yaml` — added story_id + episode_number
  + demoted scenario_id (the actual blocker for episode 1).
- `framework/schemas/transcript_pre.yaml` — removed scenario_id and
  personas entirely. The pre-enumeration writer runs inside the
  information barrier and cannot produce either; both are injected
  post-barrier by `enumerate_transcript.py`. This makes the schema
  honest about what dialog_writer is allowed to write.
- `framework/schemas/analysis.yaml` — demoted scenario_id (story_id +
  episode_number were already required from earlier Phase 5 work).
- `framework/schemas/facilitation.yaml` — added story_id +
  episode_number, demoted scenario_id, fixed the stale
  `{scenario_id}/facilitation.yaml` path comment in the header.
- `framework/schemas/validation_output.yaml` — added story_id +
  episode_number, demoted scenario_id.
- `apps/lens/schemas/scaffolding.yaml` — demoted scenario_id (story_id
  + episode_number were already required).
- `apps/lens/schemas/session.yaml` — demoted scenario_id (already
  required).
- `apps/reasoning-lab/schemas/scoring.yaml` — demoted scenario_id
  (already required).
- `apps/reasoning-lab/schemas/competition_facilitation.yaml` — demoted
  scenario_id (already required).
- `apps/reasoning-lab/schemas/session.yaml` — demoted scenario_id
  (already required).

`framework/schemas/episode_plan.yaml` was deliberately left
**unchanged** — `episode.yaml` is the canonical place where
`scenario_id` is born (planning_agent assigns
`{story_id}-ep-{NN}`), so it stays required there. Downstream files
inherit it as optional.

*Scripts:*

- `framework/pipeline/scripts/review_transcript.py` — fixed line 56
  (`personas` → `lead_characters`), and replaced the silent-empty-set
  comparison with a loud failure when the plan file is missing the
  expected key. Also corrected the docstring on line 10, which
  incorrectly claimed both `episode.yaml` and `episode_writer_input.yaml`
  have `personas`.
- `framework/pipeline/scripts/enumerate_transcript.py` — added
  identifier + persona injection from the sibling `episode.yaml`. The
  script now derives `episode.yaml`'s path from the output directory
  (the canonical layout `artifacts/{story_id}/episodes/episode_{NN}/`
  guarantees the sibling exists), reads `story_id`, `episode_number`,
  `scenario_id`, and the `personas` block (name + perspective only),
  and writes them at the top of the enumerated transcript before
  `turns`. Fails loudly if the sibling is missing or lacks
  `story_id`/`episode_number`. This is the correct architectural
  injection point: post-barrier (writer can't reach episode.yaml),
  pre-validation (downstream consumers can rely on the fields).

**Verification (post-fix, against the existing episode 1 artifacts):**

```
$ python3 framework/pipeline/scripts/validate_schema.py \
    artifacts/saving-the-maker-space/episodes/episode_01/transcript.yaml \
    framework/schemas/transcript.yaml
Validating: artifacts/saving-the-maker-space/episodes/episode_01/transcript.yaml
  Schema: framework/schemas/transcript.yaml
  PASS: All checks passed

$ python3 framework/pipeline/scripts/review_transcript.py \
    artifacts/saving-the-maker-space/episodes/episode_01/transcript.yaml \
    artifacts/saving-the-maker-space/episodes/episode_01/intermediates/episode_writer_input.yaml
Transcript review: artifacts/saving-the-maker-space/episodes/episode_01/transcript.yaml
  Turns: 14
  Words: 221
  Speakers: {'Mira', 'Theo', 'Ren'}
  PASS: All structural checks passed
```

The episode 1 transcript validates against the new schema unchanged
— the operator's hand-patch (which added `story_id`,
`episode_number`, and `scenario_id` at the top of `transcript.yaml`)
is exactly the shape the new schema expects, and is exactly what
`enumerate_transcript.py` will now produce automatically for episode
2 onward.

**What is NOT yet verified:**

- The `analysis.yaml` and `lens/scaffolding.yaml`, `lens/session.yaml`
  schemas have been updated, but no artifacts of those types exist
  yet for episode 1. They will be exercised when `/analyze_transcript`
  and `/design_scaffolding` run. If any further leftovers surface,
  log them as new observations and resolve in the same pattern.
- The reasoning-lab schemas were updated for consistency but will not
  be exercised in this run (Lens-only).

**v2 candidates that remain open after this resolution:**

- Integration test fixture (still recommended for Phase 8). The
  schema audit was done by hand against grep results; an integration
  test that runs every Phase-7 command end-to-end against a fixture
  would have caught Observations 2 and 3 before episode 1 ever ran.
- Audit `framework/pipeline/scripts/check_coverage.py` and
  `log_pipeline_event.py` for `--scenario` / `scenario_id` legacy
  references. Both were noted in the earlier transition review as
  benign legacy remnants; revisit in Phase 8 to decide whether to
  delete or properly update.

### Resolution addendum — preemptive agent prompt fixes for `/analyze_transcript`

**Trigger:** before running `/analyze_transcript` for episode 1, audited
the agents whose outputs the schema audit changed shape on, to catch
forward-leaning bugs.

**Findings:**

- **`framework/pipeline/agents/evaluator.md`** — line 18 instructed the
  agent to propagate `story_id` and `episode_number` into
  `analysis.yaml` only. Said nothing about `facilitation.yaml`. The
  pre-audit `facilitation.yaml` schema only required `scenario_id` (so
  the agent presumably wrote that by inertia and was fine). The
  post-audit schema requires `story_id` + `episode_number` and makes
  `scenario_id` optional. Without an instruction update, the agent's
  first run would produce a `facilitation.yaml` that fails schema
  validation.

  **Fix:** updated line 18 to require propagation into **both**
  outputs, with optional pass-through of `scenario_id` if present.

- **`apps/lens/pipeline/agents/scaffolding_id.md`** — zero references to
  any identifier field. The pre-audit `scaffolding.yaml` schema
  already required `story_id` + `episode_number` (the partial Phase-5
  rename had landed here), so this gap was likely *already broken*
  pre-audit and just hadn't been exercised yet. The
  scaffolding_id.yaml output for the never-run pre-audit pipeline
  might have failed at first run regardless of my changes.

  **Fix:** added an explicit propagation instruction in the "You
  produce two outputs" block, mirroring the evaluator's pattern, with
  a note to preserve existing identifiers when *enriching*
  `facilitation.yaml` (don't overwrite what evaluator wrote).

- **`apps/lens/pipeline/commands/configure_session.md`** line 66 already
  correctly copies `scenario_id` + `story_id` + `episode_number` from
  `episode.yaml` into `lens/session.yaml`. No change needed.

**Critical operational consequence:**

The harness reads slash-command and agent definitions from
`.claude/commands/` and `.claude/agents/`, which are populated by
`initialize_lens.py` from the source tree. Both stale copies of
`evaluator.md` and `scaffolding_id.md` are currently sitting in
`.claude/agents/` from the earlier initialization. **`initialize_lens.py`
must be re-run before `/analyze_transcript`**, or the agent will
execute with the old prompt and reproduce the bug this addendum was
meant to prevent.

This is a small but important property of the architecture worth
noting in the operator manual: **any time agent or command source
files change between Phase-7 stages, re-run initialize_*.py before
the next stage.** Defer the manual update to Phase 8.

**Out of scope, logged for later:**

- `apps/reasoning-lab/pipeline/agents/scoring_rubric_agent.md` was not
  audited. The reasoning-lab schemas had `story_id` + `episode_number`
  already required pre-audit, and if both Lens-side agents lacked
  propagation instructions, scoring_rubric_agent very likely does
  too. Audit before the first reasoning-lab run, or sweep in Phase 8.

### Observation 5 — `/create_episode` arg misparse on episode 2 invocation

**Stage:** Phase 7, episode 2, at the start of `/create_episode saving-the-maker-space 2`.

**Symptom:** the executing Claude Code instance reported that it had
treated `2` as `story_id` and left `episode_number` empty, then
manually corrected to `story_id=saving-the-maker-space`,
`episode_number=2` and proceeded.

**Template inspection:** `framework/pipeline/commands/create_episode.md`
is correct — `argument-hint: <story_id> <episode_number>`, `$1` =
`story_id`, `$2` = `episode_number`, and the bash block dereferences
them right. The same template ran cleanly for episode 1, so this is
not a template defect.

**Confirmed user input:** the operator typed exactly
`/create_episode saving-the-maker-space 2` — both positional args
present and in the right order. So this is **not** a single-arg
typo.

**Template inspection (post-investigation):** the template at
`framework/pipeline/commands/create_episode.md` is correct and
unambiguous. The synced copy at `.claude/commands/create_episode.md`
is byte-identical (verified by diff). `$1` and `$2` appear in five
places, all internally consistent:

- Line 14: `` `$1` = `story_id` ``
- Line 15: `` `$2` = `episode_number` ``
- Line 20: `STORY_ID="$1"`
- Line 21: `EP_NUM="$2"`
- Line 170: `` Run `/create_transcript $1 $2` for this episode. ``

There is no place where the order is flipped, no conflicting
documentation, no ambiguity. A reader following this template
cannot honestly conclude that `$2` should be bound to `2` while `$1`
is left empty — that would require ignoring lines 14, 15, 20, and
21. Episode 1 ran correctly under the same template, and nothing
in the template was edited between runs.

**Actual cause:** the executing Claude bound `$1` and `$2` to the
arguments incorrectly when reading the template, then misattributed
the resulting mistake to the template ("the command template parsed
the arguments incorrectly"). Two model errors compounded: the
original binding error, and a misattribution of cause. The
misattribution is the more concerning of the two — without
post-investigation verification, the friction log would have
recorded a phantom template defect that would have wasted Phase 8
cleanup time looking for a bug that does not exist.

**Lesson for friction-log discipline:** when an executing Claude
blames a template or schema, verify against the actual file before
recording the claim. Models are not always honest about whose error
caused a failure, especially when correcting in-flight.

**Disposition:** the executing Claude caught its own binding error
in-flight and corrected manually before producing any artifact, so
no episode 2 outputs are at risk from this run. But the underlying
class of error — silent positional-arg misbinding — can still
corrupt artifacts in some future run if the model does not catch
itself. The right hardening is to make the template *force* the
binding to surface and *fail loudly* on empty values. Recommended
addition at the top of the Step 0 bash block:

```bash
STORY_ID="$1"
EP_NUM="$2"
[[ -z "$STORY_ID" || -z "$EP_NUM" ]] && {
  echo "ERROR: usage: /create_episode <story_id> <episode_number>" >&2
  echo "  got: STORY_ID='$STORY_ID' EP_NUM='$EP_NUM'" >&2
  exit 1
}
```

This works because the model has to *execute* the bash to derive
paths, and the failing `test` plus the diagnostic `echo` make a
wrong binding visible immediately instead of letting the model
produce partial artifacts under wrong identifiers.

Apply during Phase 8 closeout, or sooner if a similar misbinding
recurs on episode 3+. The same hardening is worth considering for
every multi-arg slash command template
(`/create_transcript`, `/analyze_transcript`, `/design_scaffolding`,
`/configure_session`).

---

**Recurrence on episode 2 `/analyze_transcript` — disposition shifts to "apply now":**

The same misbinding recurred on `/analyze_transcript saving-the-maker-space 2`.
The executing Claude reported `$1="2"` and `$2=""`, then produced an
elaborate confabulation blaming a hypothetical Claude Code "expander,"
a hypothetical "hyphens look like flags" parser bug, and a misreading
of CLAUDE.md's snake_case convention (which governs canonical
reference IDs like facets/patterns, not story IDs — `episode_plan.yaml`
explicitly specifies kebab-case for story_id and scenario_id).

**The confabulation was refuted on every claim:**

1. *No expander populates `$1`/`$2` outside the executing model.*
   Claude Code passes the template body verbatim along with
   `$ARGUMENTS`; the executing Claude IS the binder. Blaming the
   expander is blaming a system that doesn't exist.
2. *Hyphens are not flags.* `saving-the-maker-space` starts with `s`,
   not `-`. No real arg parser (argparse, getopt, click, etc.) treats
   leading-letter tokens as flags.
3. *Seven prior invocations succeeded* with the exact same hyphenated
   story_id (`/create_episode 1`, `/create_transcript 1`,
   `/analyze_transcript 1`, `/design_scaffolding 1`,
   `/configure_session 1`, `/create_episode 2`, `/create_transcript 2`).
   A deterministic parser bug would have manifested every time.
   Intermittent ⇒ model-internal, not parser-deterministic.
4. *CLAUDE.md's snake_case rule* applies to canonical reference IDs
   (lenses, facets, cognitive patterns, social dynamics — `logic`,
   `source_credibility`, `false_certainty`, `group_pressure`).
   Story IDs are kebab-case throughout the codebase, including
   `episode_plan.yaml`'s schema description and the `{story_id}`
   examples in CLAUDE.md itself.

**Diagnostic-discipline lesson (second instance, now strong enough to
generalize):** when an executing Claude blames external infrastructure
for a slash-command failure, the prior probability that the cause is
actually a model binding error (and not an architecture bug) is high.
Both Obs 5 and this recurrence were initially attributed to imagined
external systems, and both were actually model-internal mistakes.
The second-order rule for the friction log is: **verify any "the
template/expander/parser is broken" claim against the file, against
git history, and against the count of prior successful runs before
recording it.** The cost of verifying is small. The cost of
recording a phantom architecture bug is large — it wastes Phase 8
cleanup time chasing fixes for things that aren't broken, and in this
case it nearly produced a destructive rename of the story
(`saving-the-maker-space` → `saving_the_maker_space`) that would have
broken every existing artifact path under
`artifacts/saving-the-maker-space/`.

**Hardening applied (defensive bash check, all five multi-arg
command templates):**

- `framework/pipeline/commands/create_episode.md`
- `framework/pipeline/commands/create_transcript.md`
- `framework/pipeline/commands/analyze_transcript.md`
- `apps/lens/pipeline/commands/design_scaffolding.md`
- `apps/lens/pipeline/commands/configure_session.md`

Each gets a 5-line guard at the top of the first bash block, before
the `STORY_ID`/`EP_NUM` assignments:

```bash
[[ -z "$1" || -z "$2" ]] && {
  echo "ERROR: usage: /<command> <story_id> <episode_number>" >&2
  echo "  got: \$1='$1' \$2='$2'" >&2
  exit 1
}
```

This converts a silent misbinding into a loud bash failure with the
actually-bound values shown. It does not prevent the model from
misbinding in the first place — that lives in the model's
reasoning, not in the codebase — but it makes the misbinding
**impossible to misattribute** to a phantom external bug, and it
prevents any artifact from being written under wrong identifiers.

**Operational consequence:** `apps/lens/pipeline/initialize_lens.py`
must be re-run so the harness picks up the updated command templates
in `.claude/commands/`. Then re-run
`/analyze_transcript saving-the-maker-space 2`.

**Status: closed. Hardening applied. If misbinding recurs on
episode 3+, the bash guard will catch it loudly and the diagnosis
will be unambiguous.**

---

**Follow-up (episode 2 `/analyze_transcript` retry + structural standardization):**

The bash guard hardening turned out to be runtime-dead in practice.
When the executing Claude ran `/analyze_transcript saving-the-maker-space 2`
after the Option 1 "trust the args, don't pre-validate" nudge, the
bash it invoked contained literal substituted values
(`STORY_ID="saving-the-maker-space"; EP_NUM=2; ...`) — the `$1`/`$2`
positional references were never passed through to bash, and the
guard was omitted from the invocation entirely. This means **the
`$1`/`$2` in our slash command templates are documentation for the
model's reasoning, not actual bash positional arguments**. The model
mentally binds `$1`/`$2` from `$ARGUMENTS`, substitutes the bound
values directly into the bash text, and invokes Bash with the
substituted form. Bash never sees `$1` or `$2`.

**Implications:**

1. The Obs 5 bash guard is functionally dead code at runtime — the
   model substitutes values before invoking bash, so the guard is
   never executed with literal `$1`/`$2`. We've kept it because it
   still has **pedagogical value**: a model reading the template
   gets an explicit cue about what `$1`/`$2` are supposed to be,
   even if the check never actually runs.
2. The actual misbinding prevention has to happen in the model's
   head, not in bash. The only levers we have are (a) making the
   template's prose cues as explicit as possible, and (b) avoiding
   identifier formats that encourage model mis-tokenization.
3. The misbinding pattern between episodes (5/5 clean on episode 1,
   1/4 clean on episode 2) cannot be explained by any bash-level
   mechanism. It's model-internal reasoning variance, probably
   influenced by cumulative context length and/or the friction log's
   own discussions of misbinding priming the model to expect them.

**Structural standardization of slash command templates:**

During investigation, discovered that the five multi-arg command
templates were structurally inconsistent in how they introduced
`$1`/`$2` to the model. Three tiers:

- **Tier 1** (`create_episode`, `create_transcript`): `## Arguments`
  header → prose declaration (`` `$1` = `story_id` ``,
  `` `$2` = `episode_number` ``) → transition sentence → bash block.
- **Tier 2** (`analyze_transcript`): header → prose declaration →
  bash block (no transition).
- **Tier 3** (`design_scaffolding`, `configure_session`): header →
  bash block (no prose declaration at all).

Independent verification by an Explore subagent confirmed the
three-tier categorization, confirmed that Tier 1 is the most
explicit form in the codebase, and found no other structural
differences between the templates (all five use the same variable
names, same guard, same `EP_NN`/`EPISODE_DIR` derivations, same
`argument-hint` frontmatter). The agent also declined to confirm a
causal link between structure and misbinding — it verified the
structural claim only.

**Standardization applied (all five templates now match Tier 1):**

- `framework/pipeline/commands/create_episode.md` — already Tier 1,
  unchanged.
- `framework/pipeline/commands/create_transcript.md` — was Tier 1
  with a slightly different transition sentence ("Derive the
  episode directory once at the top of the run:"); normalized to
  "Derive paths once:" for exact consistency.
- `framework/pipeline/commands/analyze_transcript.md` — was Tier 2;
  added "Derive paths once:" transition between prose declaration
  and bash block.
- `apps/lens/pipeline/commands/design_scaffolding.md` — was Tier 3;
  added both the prose declaration and the transition sentence.
- `apps/lens/pipeline/commands/configure_session.md` — was Tier 3;
  added both the prose declaration and the transition sentence.

**Causal claim explicitly not verified.** Standardization removes
structural inconsistency as a variable in the diagnostic picture;
if misbindings persist on standardized templates, the cause is
something else (friction log priming, cumulative context, hyphens
in the story_id, or random model variance). If misbindings stop,
that's weak evidence for the structural-cause hypothesis but not
proof.

**Operational consequence:** `apps/lens/pipeline/initialize_lens.py`
must be re-run before the next multi-arg slash command invocation.

**Next experimental step:** re-run `/analyze_transcript saving-the-maker-space 2`
(if the in-flight one has completed or stalled) and watch whether
the misbinding recurs on a standardized template. One data point
won't be conclusive, but it's the first test of the standardization
hypothesis.

**v2 candidates still open after this pass:**

- Rename `saving-the-maker-space` to `saving_the_maker_space` if
  misbindings persist after standardization. The hyphen-as-weak-
  contributing-factor hypothesis is still alive and is addressable
  only by rename.
- Stop including the friction log in the executing Claude's context
  window if the priming-by-reading-about-misbindings hypothesis
  turns out to be dominant.

**Status: standardization applied, awaiting re-test on episode 2 `/analyze_transcript`.**

---

**CORRECTION — the standardization was harmful, not neutral.**

The re-test on `/analyze_transcript saving-the-maker-space 2` under
the standardized template **misbound again**, and so did a subsequent
attempt at `/design_scaffolding saving-the-maker-space 2`. Episode 2's
failure rate under standardized templates was 3-out-of-4 (misbind
on `/create_episode`, `/analyze_transcript` first try,
`/analyze_transcript` second try; clean only on `/create_transcript`).

At that point the user asked a sharp question: "what was in
`design_scaffolding.md` before you standardized it?" The answer: a
**minimal Tier 3 form** with no prose declaration, no transition
sentence, no bash guard. Just `## Arguments` → bare bash block with
`STORY_ID="$1"` and `EP_NUM="$2"`. That form had worked cleanly on
episode 1.

Count of `$1`/`$2` references per template:

- **HEAD minimal form (worked ep 1):** `$1` appears once, `$2` appears once.
- **My standardized form (failed ep 2):** `$1` appears 5 times (prose declaration, guard condition, guard echo, bash assignment, guard echo placeholder), `$2` appears 5 times.

Reverted `design_scaffolding.md` to its HEAD minimal form, re-ran
`/design_scaffolding saving-the-maker-space 2` — **it worked cleanly.**
That's the single-template experiment result: minimal form works
where standardized form failed.

Then — rather than revert the other four templates to their non-uniform
HEAD states — applied the user's suggestion: **match all five templates
to the minimal form that just worked empirically.** This meant
removing even more than HEAD had in some cases (e.g., `create_episode`
and `create_transcript` had prose declarations at HEAD; matched
`design_scaffolding`'s minimal form means those get removed too).

After matching, re-ran `/design_scaffolding 2` (already running on the
reverted template) — clean. Then `/configure_session 2` under the
newly-matched template — also clean.

**Updated record of episode 2's full pipeline:**

| Command | Template state | Result |
|---|---|---|
| `/create_episode 2` | My standardized + guard | Misbound (self-corrected) |
| `/create_transcript 2` | My standardized + guard | Clean |
| `/analyze_transcript 2` (1st) | My standardized + guard | Misbound (confabulated) |
| `/analyze_transcript 2` (2nd) | My standardized + guard | Misbound (pre-validation pause) |
| `/analyze_transcript 2` (3rd, after nudge) | My standardized + guard | Clean (16+32 schema errors on evaluator output; eventually fixed) |
| `/design_scaffolding 2` (1st) | Reverted to minimal | Clean |
| `/configure_session 2` | Matched to minimal | Clean |

**What this means:**

- My Obs 5 bash-guard hardening was built on a wrong architectural
  model (I claimed bash doesn't see `$1`/`$2`; the other agent later
  claimed the harness substitutes `$1`/`$2` before sending to the
  model; neither claim was verified). The guard was dead code at best
  and harmful at worst — every guard I added increased the `$1`/`$2`
  surface area by 4 occurrences.
- My template standardization was also harmful. I was confident it
  would be "at worst neutral, at best helpful." The verification agent
  I ran explicitly refused to confirm a causal link, and I should
  have taken that caution more seriously. The structural tidiness
  argument was enough to carry me past the weak evidence, and I was
  wrong.
- The **empirical fix** is the minimal form: `## Arguments` → bare
  bash block with only `STORY_ID="$1"` / `EP_NUM="$2"` / derived vars.
  Two `$1`/`$2` occurrences total. This is what worked in episode 1
  on the tier-3 templates, and what works in episode 2 on reverted /
  matched templates.

**Applied to all five templates (state after correction):**

- `framework/pipeline/commands/create_episode.md` — matched to minimal
- `framework/pipeline/commands/create_transcript.md` — matched to minimal
- `framework/pipeline/commands/analyze_transcript.md` — matched to minimal
- `apps/lens/pipeline/commands/design_scaffolding.md` — reverted to HEAD (already minimal)
- `apps/lens/pipeline/commands/configure_session.md` — matched to minimal

All five now have identical structure: `## Arguments` header → bare
bash block with `STORY_ID="$1"`, `EP_NUM="$2"`, `EP_NN=$(printf ...)`,
`EPISODE_DIR="..."` (create_episode also has `DRAFT_FILE` and
`DESIGN_DOC`). No prose, no transition, no guard.

**What remains unverified:**

1. **Why minimal form works better.** The "more `$1`/`$2` references
   = more substitution failures" hypothesis is directionally
   consistent but not proven. The other agent's claim that the
   harness substitutes `$1`/`$2` before sending to the model was
   never definitively verified with the template-echo test I
   proposed. We're operating on "this works, stop touching it"
   rather than understanding the mechanism.
2. **Whether minimal form will hold for episode 3+.** Single-template
   positive (`design_scaffolding 2`) plus one additional positive
   (`configure_session 2`) is two data points. Not enough to declare
   victory. Episode 3's run across all five commands is the real
   test. If it's clean, the minimal form holds. If misbinding recurs,
   we escalate to the rename (`saving-the-maker-space` →
   `saving_the_maker_space`).
3. **Whether the schema-naming inconsistency**
   (`passage_analyses` / `passage_guides` / `passages`) was the real
   cause of the evaluator's 16+32 schema errors on `/analyze_transcript 2`,
   or whether that was unrelated model variance. Needs observation
   across episode 3+.

**Diagnostic-discipline lesson (third instance now, stronger rule):**
across this debugging thread, I have been confidently wrong about
slash command behavior at least four times:

1. Initially attributing Obs 5 to a Claude Code "expander" that
   doesn't exist (actually a fabrication, caught by me).
2. Claiming "bash never sees `$1`/`$2`; the model substitutes before
   invoking Bash" based on one observation — likely wrong or
   incomplete.
3. Claiming the bash guard would "convert silent misbindings into
   loud failures" — it was dead code because the guard itself gets
   substituted/dropped.
4. Claiming the standardization would be "at worst neutral, at best
   helpful" — it was actively harmful.

The pattern: each time, I reasoned from a plausible-sounding
architectural story to a confident recommendation, and each time the
story was either wrong or insufficient. The rule I should be
following is: **when debugging a flaky model-or-harness interaction,
never commit to a fix based on architectural reasoning alone. Always
get a falsifying observation first.** The verification agent I spawned
for the standardization correctly declined to confirm a causal link
— I should have treated that declination as a stop signal, not as
"well, I'll do it anyway."

**Status: minimal form applied to all five templates. Episode 2
pipeline is unblocked and complete through `/configure_session`.
Episode 3's run is the real test of whether the fix holds.**

**v2 candidate (Phase 8):** consider whether all slash command
templates should defensively validate their arguments before any
substantive work. The cost is small; the benefit is that future arg
mistakes fail loudly at line 1 instead of producing partial artifacts
that the operator has to spot.

### Observation 4 — Verbatim-signal rule worked smoothly

The Part-4D conditional validator (verbatim copy of `cognitive_signal`,
`social_signal`, `interaction_note` from draft frontmatter into
`episode.yaml`) ran cleanly with no friction. Worth recording the
*absence* of friction here because this rule was identified as a risk
during Phase 5 design.
