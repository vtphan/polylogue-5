# TODO v5-02

> **Status: open (2026-04-22).** Phase 4 skeleton is committed (`v5/app/`);
> this document tracks the cohesion / cognitive-load refinement of the
> student-facing quiz panel. The three-step quiz is the load-bearing
> teaching surface. How a student experiences it end-to-end — what they
> hold in mind, what they read, what pulls their attention where — is
> the single most important UX question in the app.

> **Scope note.** The three-step quiz panel internals are the only app
> surface explicitly permitted to evolve in v5 (see
> `feedback_v5_app_ui.md`). The scene-reader shell, episode chrome,
> right-rail layout, and other non-quiz surfaces are under the v5 UI-freeze
> rule and require explicit operator approval before any edit.

## Why this document exists

The Phase 4 port renders the pilot end-to-end, but it renders the
three-step quiz as three stacked sections in a narrow right rail. That
shape is structurally correct and reload-deterministic, but it has
cohesion problems that a student has to pay for in cognitive load. The
teaching arc runs across four things the student must hold in mind at
once, and the current layout puts those things in five different places.
That gap between *conceptual adjacency* and *physical adjacency* is the
surface this document is trying to close.

## Framing principle

> **Direct the flow of information to minimize extraneous cognitive load.**

Every beat the student reads should have exactly one place to look for
what they need next. The quiz's internal geometry should favor the most
intuitive reading order, not the most literal transcription of the
schema.

## Three aspects to scrutinize

These are the axes the next iteration should pass the panel through.

### 1. Verbosity of labels

The current panel carries labels at several layers that each add cost:

- Section eyebrows: "Step 1 — Claim", "Step 2 — Your take", "Step 3 — Why"
- Panel header eyebrow: "Reasoning check" / "Answered"
- Prompt text: full question inside a highlighted card
- "Correct" / "Not quite right" status line above locked options
- Per-choice feedback inside readonly option cards
- "Takeaway" label on the closing block

Questions to ask of each label:
- Does it teach, or does it explain the teaching?
- Is the label saying something the prompt or the visual state already says?
- Is the label carrying meaning the student actually uses, or is it
  stage-directing for the author?

The specific "Correct" label on Step 3 is already suspect — it reads as a
verdict on the Yes/No stance the student took at Step 2, which is
explicitly ungraded. A softer phrasing ("Good read" / "Worth another
look") would decouple reasoning-correctness from stance-judgment.

### 2. Grouping of questions/answers, choices/feedback

Items that belong conceptually together are currently spatially split:

- The **revealed claim** (after Step 1 locks) is the thing Step 2 asks
  the student to judge — but the claim is inside a readonly option card,
  not visible as a persistent reference while Step 2 and Step 3 render.
- **Step 3's correct-option feedback** carries the real reasoning lesson;
  the **level takeaway** is the distilled one-liner of the same beat.
  They sit on either side of the options grid instead of reading as one
  closing act.
- **Per-choice feedback** is tucked inside the option card it belongs to
  (this is the one grouping the current design gets right — feedback
  bound to the option the student picked).
- **Routing text** is a bridge between Step 2 and Step 3, but it
  currently reads as a decoration of Step 2 rather than a setup for
  Step 3.

Questions to ask of each grouping:
- If the student reads this block, what do they need in their eye-line
  to make sense of it?
- Are we duplicating information or just relocating it?
- Can one block absorb another without loss of legibility?

### 3. Things staying "in the way" after they reveal

Progressive reveal solves one problem (don't show later steps before the
student is ready) but creates another: once revealed, earlier steps stay
on screen in full detail, pushing the active step further down the scroll
and competing for the student's attention.

Specific failure modes:

- On a short viewport, by the time Step 3 renders, Step 1 has scrolled
  off. The revealed claim — the most load-bearing context Step 3 needs —
  is no longer visible.
- Wrong-pick feedback on Step 1 remains at full visual weight after the
  student locks the step on the retry. It keeps teaching a lesson the
  student has already absorbed, at the cost of the next step's footprint.
- The entire three-step stack remains visible after whole-level lock,
  meaning the takeaway — the thing the student should be sitting with —
  is at the bottom of a long scroll of completed material.

Questions to ask of each persistent block:
- Once a step is locked, does its full content still earn its screen real
  estate, or has it become noise?
- Can a locked step collapse to a one-line summary that remains
  re-expandable on demand?
- What should the *resting state* of a fully-completed level look like?
  (Probably: anchor text, one-line summary of each step's outcome,
  takeaway prominent.)

## Spatial tensions catalog (from walkthrough discussion, 2026-04-22)

Concrete frictions surfaced during design conversation. These are the
test cases the next iteration should resolve.

1. **Anchor turn ↔ quiz panel (left–right split).** The quiz is about
   one turn in the transcript. The turn is in the left column, the quiz
   is in the right rail. The red border tethers them, but the eye still
   has to cross columns repeatedly.

2. **Revealed claim ↔ Step 2 prompt.** Step 1's whole job is to settle
   the claim. The moment it locks, the claim lives inside a readonly
   option card with dashed feedback below it. Step 2 appears underneath
   asking "Do you buy the argument?" — but the argument requires the
   claim, and the claim is now a few visual registers away.

3. **Step 1 context ↔ Step 3, on short viewports.** By the time Step 3
   renders, Step 1 is scrolled up or off. The student loses the revealed
   claim anchor right when they need it most.

4. **Step 3 feedback ↔ takeaway.** Step 3's authored correct-option
   feedback is where most of the teaching happens. The takeaway is the
   distilled version of the same beat. They should feel like one closing
   act; they currently feel like two.

5. **Yes/No branch split is invisible.** Step 3's prompt changes based
   on Step 2's pick, but nothing in the panel labels that. A student
   re-opening the level later has no indication which Step 3 they're
   looking at.

6. **"Correct" label on Step 3 reads as a verdict on Step 2.** Calling a
   Step 3 pick "Correct" when Step 2 was framed as judgment-free creates
   exactly the cognitive snag that collapses the Step 2 / Step 3
   distinction for the student.

## Committed design (2026-04-22)

The panel has **two modes** separated by one state boundary:
`attempt.lockedAt` (set when Step 3 locks). In active mode the student
picks through the three steps with progressive reveal and per-step
compression. In completed mode the panel drops all scaffolding and
reads as a short authored narrative.

### Active mode — during the quiz

Two cards, semantic labels, no numeric "Step N" prefixes.

**Card 1 · Claim**
- Pre-lock: prompt + pickable options. If the student's first pick is
  wrong, it shows readonly (red + `by_option` feedback) while the other
  options remain live — the retry window. No "correct" reveal yet.
- On Step 1 lock: the card transitions to its narrative form (see
  completed mode Card 1 below). Wrong picks and unpicked options
  collapse away. Per-choice feedback was teaching material during the
  retry window; it's discharged once the step locks.

**Card 2 · Your take** (hidden until Step 1 locks)
- Step-2-pick-pending: prompt "Do you buy *[speaker]*'s argument?" +
  two options (`yes_strong` / `no_unsure`).
- Step-2 answered, Step-3 pending: Y/N options disappear (no "You said"
  chip — the why-prompt wording recovers which path was taken).
  Optional `routing_text` renders as an italic lead-in. The why-prompt
  from the selected branch appears with its options; same first-try +
  one-retry pattern as Step 1.
- Step 3 lock → flip to completed mode (below).

Wrong-pick compression rule: on each step's lock, wrong picks + unpicked
options disappear. The correct answer remains only as part of the
transition to narrative form.

### Completed mode — after whole-level lock

Four cards, pure authored content. No options, no controls.

**Card 1 · What *[speaker]* is arguing**
- Body: the correct Step 1 option text, rendered as a statement.
- Supporting: `step_1_claim.feedback.correct.text`.

**Card 2 · Your take**
- Framing line: *"You thought it was strong."* (for `yes_strong`) or
  *"You weren't convinced."* (for `no_unsure`).
- Body: `step_3[chosen_branch].feedback.correct.text` — the canonical
  reasoning from the branch the student took.
- The student's specific Step 3 pick text does **not** appear. The
  active-mode reveal already taught whatever correction was needed.

**Card 3 · Actually** *(conditional)*
- Appears **iff** the student's Step 2 pick is misaligned with the
  anchor's polarity:

  ```
  anchor.polarity === "weak"   && step2Option === "yes_strong" → show
  anchor.polarity === "strong" && step2Option === "no_unsure"  → show
  otherwise                                                     → hide
  ```

- Body: `step_3[opposite_branch].feedback.correct.text` — the canonical
  reasoning from the branch the student did **not** take. Gives the
  misaligned student the authored reading they would otherwise miss.

**Card 4 · Takeaway**
- Body: `level.takeaway`.

### Governing principle

> **Active mode handles correctness feedback. Completed mode is pure
> authored content keyed to the student's Y/N judgment.**

Every beat in the post-lock narrative pulls from authored text that
already exists in the lesson package. Stars carry the Step 3 performance
record separately; the narrative itself does not double-book that
signal.

### Resolved design questions

- ❓ "Step N" numeric labels dropped; semantic eyebrows only ("Claim",
  "Your take", "Actually", "Takeaway").
- ❓ Step 2 → Step 3 merged into one "Your take" card; Y/N chip dropped
  because the why-prompt wording ("…strong?" vs "…not convincing?")
  recovers the pick.
- ❓ Wrong picks collapse on each step's lock. No collapsed-record
  footer for v1; the retry window carried the teaching.
- ❓ Step 3 "Correct / Not quite right" label removed from post-lock
  view (it never appears in narrative mode). Active-mode retry state
  retains the red wrong-pick styling as the in-the-moment signal.
- ❓ Card 2 and Card 3 use authored canonical text only — student's
  Step 3 pick text does not appear in the narrative.
- ❓ `Actually` trigger is polarity-misalignment at Step 2, not Step 3
  wrong-pick. Step 2's non-graded framing is preserved in stars but the
  narrative does treat polarity as canonical.

### Scope of change

- `QuizPanel.tsx` — two-mode render; four new internal components
  (`ClaimCard`, `YourTakeCard`, `ActuallyCard`, `TakeawayCard`) plus
  helpers for each state transition.
- `ContinuousSceneReader.tsx` — resolve anchor speaker display name
  from the active level's `turn_id` and pass as prop.
- `globals.css` — additive `.narrative-card` styles.
- No schema change, no server action change, no Prisma change, no
  routing change.

### Needs explicit operator approval (outside this design)

- **Inline quiz under the anchor turn.** Still deferred. Addresses
  tension #1 but rewrites the scene-reader shell, which is under the
  UI-freeze rule. Hold until the two-column layout has been seen in
  practice to either carry or fight the new narrative flow.

## Next steps

1. **Land this design** — update QuizPanel, ContinuousSceneReader,
   globals.css.
2. **Walk the pilot in-browser** — verify both modes render cleanly
   across all four polarity × judgment combinations (weak/strong ×
   yes/no).
3. **Collect failure modes** — the first browser pass will surface new
   frictions not yet in the spatial-tensions catalog. Add them here.
4. **Defer the inline-quiz question** until the post-port walkthrough
   gives signal on whether the two-column shell helps or hurts.

## Cross-references

- Phase 4 scope (v5/todo-01.md §Phase 4) — original implementation plan
- Architecture §2.5 — app-layer runtime invariants
- Instructional design §5 — three-step quiz pedagogy
- Quiz components: `v5/app/src/app/runs/[runId]/_components/QuizPanel.tsx`
- Quiz CSS additions: `v5/app/src/app/globals.css` (§v5 three-step quiz additions)
- UI-freeze rule: `feedback_v5_app_ui.md` (auto-memory)
