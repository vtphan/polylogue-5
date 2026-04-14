# Student Session Experience — Redesign

This document specifies the student session experience for the Lens app. It replaces the Session Experience Flow section of `app-design.md` and supersedes the tablet-first assumptions in `app-implementation-plan.md`. The student experience is responsive (laptop and tablet), not tablet-first.

**Companion documents:**
- `polylogue-v5-5.md` — Conceptual framework (perspectival learning model, lenses, facets, explanatory variables)
- `app-design.md` — Full app design (roles, data model, assessment) — session flow section is superseded by this document
- `app-implementation-plan.md` — Build plan (Phase 3 will reference this document)

> **Revision note (2026-04-03):** This document uses the old two-phase (Evaluate/Explain) design with "Dr. Chen" as expert, a three-beat rhythm, and batch expert reveal. The current design uses a single integrated flow with a per-passage state machine (Diagnose → Discuss → Reviewing AI → Submit Assessment), chat-style interaction, a unified scaffold sequence, AI voice as fallible reference (not "Dr. Chen"), and teacher-led whole-class debrief. This document needs a full rewrite. See `docs/revision-plan-2026-04-03.md` for the plan and `RESEARCH-OVERVIEW.md` for the current instructional design.

---

## Part 1: Pedagogical Goals

The framework teaches critical thinking through two sequential questions: *What do you see in the reasoning?* (Evaluate) and *Why did they think this way?* (Explain). The student experience must serve five pedagogical goals derived from the perspectival learning model.

### Goal 1: Articulation Before Encounter

Students must form and commit to their own perspective before seeing anyone else's. The learning happens in the act of articulation — transforming a vague impression into an examinable claim. A student who writes "the evidence is weak" has done cognitive work. A student who writes "there's plenty of evidence but the sources aren't reliable" has done more. The UI must make individual articulation feel like the main event, not a prerequisite to unlock the next step.

**Implication:** The individual diagnosis is where students spend the most time and do the deepest thinking. The UI should create a focused writing environment — not a form to fill out.

### Goal 2: Perspectival Diversity Through Structure

Different observations from the same passage are not noise — they are the mechanism of learning. When two students see different problems in the same passage, that difference reveals the multi-dimensionality of the reasoning. The share step must make these differences visible, legible, and interesting — not just a list of what everyone wrote.

**Implication:** When peer diagnoses are revealed, the display needs visual structure that surfaces *where* perspectives diverge. The student should see at a glance: who noticed what, through which lens, and where the interesting disagreements are.

### Goal 3: Expert as Reward, Not Authority

The expert perspective (disguised as a fictional expert, "Dr. Chen") is revealed only after the group has committed to its own diagnosis — as the payoff for doing the work, not as the answer key. Students encounter the expert's thinking after they've formed, shared, discussed, and finalized their own. This means they have a perspective to compare against, not a blank slate to fill.

**Implication:** The expert reveal is a phase-end event, not a per-passage tool. It arrives after all group diagnoses are complete, creating a moment of reflection across everything the group did.

### Goal 4: Face-to-Face Discussion, Not Chat

The app structures and displays perspectives. Discussion happens in the classroom, out loud, between students sitting together. The app is a shared reference artifact — something the group looks at together while talking — not a communication channel. Students will naturally talk to each other during individual work too, and the app shouldn't try to prevent that. The gate is the written commitment: you must write your own diagnosis before seeing others'.

**Implication:** Group screens should be designed as *shared reference displays*, optimized for 2-4 students looking at one or two screens together. Information density should sustain a conversation without scrolling through pages of content.

### Goal 5: Cognitive and Social Forces Interact

In the Explain phase, students consider both cognitive patterns (individual thinking tendencies) and social dynamics (group interaction patterns) — and crucially, how they interact. "She had tunnel vision, and nobody pushed back, so she just kept going" connects both forces. The UI must support this integrated thinking, not present cognitive and social as separate checklists.

**Implication:** Scaffolding (sentence starters, reference lists) should invite connection between cognitive and social forces, not present them as independent categories to select from.

---

## Part 2: Instructional Design

### Session Structure

The session has two sequential phases. Students complete all of Evaluate before moving to Explain — they cannot go back. Within each phase, students work through passages in a per-passage cycle that blends individual and group work fluidly.

```
Enter → Read Transcript → EVALUATE (per-passage cycles → expert reveal) → EXPLAIN (per-passage cycles → expert reveal) → Complete
```

### Entering the Session

Two entry screens establish context before any analytical work begins.

**Onboarding.** Topic, context, and character introductions. The student learns who the characters are and what they're discussing. Tone is inviting and age-appropriate — "Let's see what these kids are saying..." This is brief — 30 seconds of reading.

**Reading.** The full transcript displayed as a conversation. The student reads the entire discussion before analyzing any part of it. The reading experience should feel immersive — like overhearing a conversation between classmates. The student must scroll through the whole transcript before proceeding. No highlights, no passage markers, no analysis prompts — pure reading.

### The Per-Passage Cycle

Both Evaluate and Explain follow the same three-beat rhythm for each passage:

```
INDIVIDUAL          →  SHARE & DISCUSS       →  GROUP DIAGNOSIS
Write your own         See what everyone        Decide together:
diagnosis.             thinks. Talk it out.     what's most likely?
```

Each passage moves through this cycle independently. Students can work on multiple passages in parallel — they don't need to finish one passage before starting another. The app tracks each passage's status separately.

#### Beat 1: Individual Diagnosis

Each student examines the passage and writes their own diagnosis — what they think the problem is. After writing, they tag a lens: a natural-language choice that categorizes what kind of problem they noticed.

**The student cannot see anyone else's diagnosis for this passage until they submit their own.** This is the one hard gate. It ensures every student does the cognitive work of articulation before encountering other perspectives.

A student can talk to neighbors (physically — the app can't prevent this and shouldn't try). But they must commit their own thinking in writing and tag their own lens before seeing peers.

#### Beat 2: Share & Discuss

When all group members have submitted individual diagnoses for a passage, everyone's diagnoses become visible automatically. No button to click — the reveal is the reward for everyone committing their thinking.

Each peer's diagnosis is displayed with their name, their lens tag, and their text. The student's own diagnosis is included for comparison. The display highlights interesting divergences — different lens tags on the same passage, or similar tags with different reasoning.

Discussion happens face-to-face, around the screen. The app is the shared reference.

#### Beat 3: Group Diagnosis

After discussing, the group submits a single group diagnosis for the passage — the one they think is most likely. One member writes it; the group tags a lens together. This is not forced consensus on everything the group noticed — it's the group exercising judgment: "Of all the things we saw, which is the strongest diagnosis?"

Any group member can append additional thoughts after submission.

#### Passage Independence

Passages are independent tracks, each at its own stage:

```
Passage 1:  [individual ✓] → [all in ✓] → [group diagnosis ✓]  done
Passage 2:  [individual ✓] → [waiting for Jordan...]            in progress
Passage 3:  [individual —]                                      not started
```

A student who has submitted their individual diagnosis for Passage 1 and is waiting for groupmates can start working on Passage 2 or 3. When the group is all in for a passage, they naturally pause to discuss and submit the group diagnosis, then return to individual work on other passages.

This avoids fast students sitting idle. They work ahead on other passages while slower students catch up.

#### Phase Gate

The phase is complete when all passages have group diagnoses. Then the expert reveal happens, and the group transitions to the next phase (or completes the session).

### Lifelines

Each group has a shared pool of lifelines — hints they can spend when stuck. The pool size equals the number of passages (3 passages = 3 lifelines). Essentially one hint per passage, though the group can spend them however they choose — two on a hard passage and none on an easy one.

**What costs a lifeline:**

| Action | Cost | What the student gets |
|---|---|---|
| Request a hint during individual work | 1 lifeline | A directional nudge from the pipeline's `partial_hints` — points to *where* to look, not *what* to see. E.g., "Something about where Maya got her information..." |
| Request a second hint on the same passage | 1 lifeline | A different hint, from a different lens perspective |

**What's free:**
- Reading the highlighted passage
- Talking to groupmates (physical)
- Writing individual diagnoses
- Seeing peer diagnoses (after submitting your own)
- Submitting group diagnoses
- The expert reveal at phase end
- All automatic pedagogical mechanisms (misreading redirects, deepening probes, reflection prompts — see below)

**Lifeline mechanics:**
- The lifeline counter is visible to all group members in the header — simple icons that dim as they're used
- Using a lifeline requires confirmation: "This uses one of your group's lifelines (2 remaining). Use it?" This prevents accidental clicks and creates a moment where the student might ask a peer instead
- Lifelines are available during both individual work (Beat 1) and group discussion (Beat 2)
- When lifelines hit zero, nothing bad happens — the group just can't get more hints. "You're on your own now. Good thing you have each other."

### Reward

The reward is simply the number of passages the group diagnoses. The group's "score" is how many passages they completed the full cycle for. This is visible throughout — "Your group has diagnosed 2 of 3 passages."

### Automatic Pedagogical Mechanisms

Four mechanisms run automatically throughout the session — the student doesn't ask for them and they don't cost lifelines. They are part of the app's pedagogical design, not assistance tools.

| Mechanism | When it fires | What it does | Pipeline source |
|---|---|---|---|
| **Misreading redirect** | After student submits individual diagnosis | Detects common misunderstandings via pattern matching; shows a gentle reorientation with a new text box to extend thinking | `common_misreadings` (per lens per passage) |
| **Deepening probe** | After student tags a lens | Shows a lens-specific follow-up question that pushes for more depth on what the student already noticed | `lens_entry_prompts` (per lens per passage) |
| **Reflection prompt** | During expert reveal | Shows a comparison question alongside the expert's perspective, turning passive reading into active reflection | `ai_reflection_prompts` (Evaluate), `ai_reflection_prompt` (Explain) |
| **Difficulty ordering** | Passage dashboard layout | Orders passages from accessible to challenging so students encounter easier passages first | `difficulty` (per passage) |

These mechanisms use the pipeline's per-passage, per-lens scaffolding data — the same data that was designed for the original 4-step flow, now repurposed for the 3-beat cycle. The pipeline does not need to change.

### Phase Identity

The two phases have distinct visual and linguistic identities so students viscerally feel the shift from one to the other.

| | Evaluate | Explain |
|---|---|---|
| **Core question** | "What's wrong?" | "Why did it happen?" |
| **Framing** | "You're the detective. Something's off. What's the problem?" | "You found the problem. Now figure out *why* — what made these kids think this way?" |
| **Accent color** | Amber/gold (investigation) | Purple/indigo (understanding) |
| **Icon** | 🔍 magnifying glass | 🧩 puzzle piece |
| **Lifeline label** | "Get another clue" | "Get a starter" |
| **Dr. Chen reveal** | "Here's what I spotted" | "Here's what might explain it" |
| **Tag question** | "What kind of problem?" | "What was going on?" |
| **Tag options** | Facts & sources / Reasoning / Full picture | How someone was thinking / How the group affected each other / Both fed into each other |

The color shift is the strongest signal. When the student transitions from Evaluate to Explain, the header, accent colors, and passage highlights all shift from amber to purple. The whole app feels different even though the structure (per-passage cycle) is the same.

### Evaluate Phase

**Framing:** "You're the detective. Something's off in this discussion — some parts are highlighted. Can you figure out what the problem is?"

#### Highlighted Passages

The transcript reappears after reading, now with highlighted passages. Passages are ordered by difficulty (from the pipeline's `difficulty` field: accessible → moderate → challenging), so students naturally encounter easier passages first. The highlights are visual markers — a subtle glow, colored margin, or callout — that signal: something is worth examining here.

Each highlight is accompanied by hints from the pipeline's `partial_hints`. These are directional nudges that point to a region of the passage without naming the problem:

- "Something about where Maya got her information..."
- "Something about how sure she sounds compared to what she actually knows..."
- "Something about how the disagreement between them ends..."

The initial hints (1-2 per passage) are shown for free alongside the highlight. These orient the student's attention. Additional hints cost lifelines.

#### Individual Diagnosis (Evaluate)

For each passage, the student writes what they think the problem is. Free-form text — no templates, no rating scales. The student describes what they noticed in their own words.

After writing, the student tags a lens — three natural-language options:

> **What kind of problem did you find?**
> - "Something about the facts and sources" *(Evidence)*
> - "Something about the reasoning" *(Logic)*
> - "Something about what they're missing" *(Scope)*

The student picks whichever fits their diagnosis best. The lens vocabulary (Evidence, Logic, Scope) is recorded internally but doesn't need to be shown to the student as jargon.

**Deepening probe (automatic, after tagging).** Once the student tags a lens, the app shows a lens-specific follow-up from the pipeline's `lens_entry_prompts`. For example, if the student tagged "Facts & sources" (Evidence): *"Listen to how Maya describes what she knows. Does the way she says it match how much she actually found?"* This pushes the student to go deeper on what they already noticed — like a teacher walking by and saying "interesting — tell me more about that." The student can revise their diagnosis before submitting, or submit as-is.

**Misreading redirect (automatic, after submission).** After the student submits, the app checks their text against the pipeline's `common_misreadings` — per-lens pattern-redirect pairs. If the student's diagnosis matches a known misreading pattern, a gentle redirect appears: *"You noticed she found a website. Now think about what that website was actually about and whether one website is enough for how sure she sounds."* A new text box appears for the student to extend their thinking. This is not a correction — it's a reorientation. It catches students who think they've diagnosed the problem but actually missed it. Redirect usage is tracked silently.

#### Share & Group Diagnosis (Evaluate)

When all group members have submitted for a passage, diagnoses reveal. Each peer's diagnosis appears with their name and lens tag.

The group discusses face-to-face, then submits a group diagnosis: the problem they think is most likely. They tag a lens for the group diagnosis too.

#### Expert Reveal (Evaluate)

After all passages have group diagnoses, Dr. Chen's perspective appears for every passage. The expert's observations come from the pipeline's `ai_perspective_evaluate` — per-lens observations and "what to notice" prompts.

**Reflection prompt (automatic, per passage).** Alongside each expert perspective, the app shows a comparison prompt from the pipeline's `ai_reflection_prompts`: *"Dr. Chen noticed that Jake's question about Portland's rain never got answered. Did you catch that, or did it seem like Maya responded to it?"* This turns the expert reveal from passive reading into active reflection — the student compares their group's diagnosis against the expert's specific observations.

The reveal is a moment of reflection: Did we catch what the expert caught? Did we find something the expert didn't mention? Did we see it differently?

This also sets up the Explain phase. The student has just seen the expert's analysis — now the question shifts to *why*.

### Explain Phase

**Framing:** "You found the problems. Now figure out *why* — what made these kids think this way?"

The app shifts to purple/indigo accent colors. The 🧩 icon replaces 🔍. The student viscerally feels the phase change.

#### Bridge to Explain

Each passage shows the student's Evaluate work and the expert's perspective as read-only context. A bridge prompt connects the two phases — personalized to the lens the student (or group) used:

- "You noticed something about the evidence. Now think about *why* — what was going on in the group when this happened?"
- "You noticed something about the reasoning. Now think about *why* — what led them to think that way?"

The bridge prompt is free — not a lifeline.

#### Individual Explanation

For each passage, the student writes why they think the characters reasoned the way they did. The student has their Evaluate diagnosis and the expert's perspective as context.

After writing, the student tags a category — three natural-language options:

> **What was going on?**
> - "Something about how someone was thinking on their own" *(cognitive)*
> - "Something about how the group affected each other" *(social)*
> - "Both — someone's thinking and the group fed into each other" *(interaction)*

The third option — "both" — represents the deepest level of reasoning in the framework. Most students will pick cognitive or social. Students who pick "both" and write about the interaction are demonstrating the most sophisticated thinking.

**Lifeline hints in Explain:** Spending a lifeline reveals a passage-specific sentence starter from the pipeline's `passage_sentence_starters`:

- Cognitive: "I think Maya brushed past the Portland question because..."
- Social: "I think Jake stopped pushing his question because..."
- Interaction: "Maya seemed really certain and Jake backed down, and I think those two things are connected because..."

**Optional scaffolding (teacher-configured):**
- Sentence starters: generic session-level starters always visible; passage-specific starters cost a lifeline
- Reference lists: browsable cognitive patterns and social dynamics with brief, student-friendly descriptions — reference material, not a menu

#### Share & Group Explanation

Same pattern as Evaluate. When all group members submit individual explanations for a passage, they reveal. The group discusses and submits a group explanation with a category tag.

#### Expert Reveal (Explain)

After all passages have group explanations, Dr. Chen introduces formal vocabulary. This is where terms like "confirmation bias" and "group pressure" enter — as labels for things the students have already described in their own words.

The expert's Explain perspective includes cognitive connections, social connections, and interaction notes. This models the "both" thinking the framework values most — even if a student only tagged cognitive, Dr. Chen's reveal shows how cognitive and social forces interact, planting the seed for next time.

**Reflection prompt (automatic, per passage).** Alongside each expert perspective, a comparison prompt from the pipeline's `ai_reflection_prompt`: *"The AI talked about how confidence can take the place of evidence in a group. Does that match what you were trying to explain, or do you think something else was going on?"* This invites the student to engage with the formal vocabulary — does the expert's label fit what they described in their own words?

### Completion

**Summary screen:**
- How many passages diagnosed (Evaluate) and explained (Explain)
- Lifelines used per phase
- Group diagnoses and explanations (read-only recap)

The teacher leads a whole-class debrief from here, using consensus data and the facilitation guide.

---

## Part 3: UI/UX Design

### Design Principles

**1. One screen, not many.** Stop navigating between screens. During each phase, the student stays on one main view — the transcript with highlighted passages on one side, the workspace for the selected passage on the other. Selecting a passage updates the workspace without a page transition. The student never loses context.

**2. Simple and warm.** This is for 6th graders, not developers. Rounded corners, soft shadows, warm colors, generous whitespace. The app should feel like a game, not a form. Lifeline hearts, celebratory animations, Dr. Chen as a character with a speech bubble — personality everywhere.

**3. Responsive, not device-specific.** The layout adapts to the viewport. On wide screens (1024px+), the transcript and workspace sit side by side. On narrower screens, the transcript collapses and the workspace takes full width with a toggle to view the transcript. No device-specific code paths.

**4. Reduce cognitive load.** A 6th grader in a 50-minute class should never feel lost. What's expected and how to proceed should be obvious without instructions. Progressive disclosure — show what's needed now, reveal more on demand.

**5. Shared-screen legibility.** During group discussion, 2-4 students look at one screen while talking. Text readable at arm's length. Enough density to sustain conversation without excessive scrolling.

**6. Stability over dynamism.** Nothing shifts or rearranges while the student reads or writes. Polling updates appear as additions (a name gets a checkmark), never replacements. Loading states are calm — a subtle dot, not a spinner.

### Layout Architecture

#### The Main Screen (Wide — 1024px+)

During each phase, the student works from a single persistent screen:

```
┌────────────────────────────────────────────────────────┐
│  🔍 Find the Problem    ● ● ○           ❤️ ❤️ ❤️      │
├──────────┬─────────────────────────────────────────────┤
│          │                                             │
│ Transcript│                                            │
│          │           Workspace                         │
│ ┃ Alex:  │           (changes based on selected        │
│ ┃ My     │            passage and its current beat)    │
│ ┃ cousin │                                             │
│ ┃ went   │                                             │
│ ┃ to the │                                             │
│ ┃ science│                                             │
│ ┃ museum │                                             │
│ ████████ │← highlighted passage (click to select)      │
│ ████████ │                                             │
│ ┃ Sam:   │                                             │
│ ┃ Yeah,  │                                             │
│ ┃ that   │                                             │
│ ┃ makes  │                                             │
│ ┃ sense  │                                             │
│ ████████ │← another highlighted passage                │
│ ████████ │                                             │
│          │                                             │
└──────────┴─────────────────────────────────────────────┘
```

**Left panel — Transcript (always visible).** The full conversation, scrollable. Highlighted passages have a warm-colored background directly on the passage text — like a highlighter pen on the actual words, not a tiny icon next to them. Clicking a highlighted section selects that passage and loads its workspace in the right panel. The currently selected passage has a stronger highlight (solid border or deeper color). Passage progress dots at the top of the left panel show completion status.

**Right panel — Workspace (adapts per passage and beat).** When no passage is selected, shows a welcome prompt: "Click a highlighted section to investigate it." When a passage is selected, the workspace shows the appropriate content for that passage's current beat:

- **Not yet diagnosed:** Individual diagnosis form
- **Submitted, waiting for peers:** Status ("Waiting for Jordan...") + option to work on another passage
- **All in:** Share view with peer diagnoses + group diagnosis form
- **Group diagnosis done:** Completed card with checkmark

**Header.** One row: phase icon and label (🔍 "Find the Problem" or 🧩 "Figure Out Why"), passage progress dots (filled = done, outline = todo), lifeline hearts (❤️ filled = available, 🤍 outline = spent). The header color shifts with the phase — warm amber for Evaluate, cool purple for Explain.

#### The Main Screen (Compact — below 1024px)

The transcript panel collapses. The workspace takes full width. A floating button toggles the transcript as an overlay or slide-in panel. The student switches between reading the transcript and working in the workspace.

The passage progress dots move into the header and serve as navigation — tapping a dot selects that passage.

#### Responsive Breakpoints

| Breakpoint | Layout |
|---|---|
| **< 768px** | Workspace only. Transcript as overlay. Passage dots as nav. |
| **768px - 1023px** | Workspace only, wider. Transcript as slide-in panel. |
| **1024px+** | Side-by-side: transcript (left ~35%) + workspace (right ~65%). |

### Onboarding & Reading

**Onboarding.** Centered, single column. Topic as a friendly heading, context as a short paragraph, character cards with names and one-sentence descriptions (horizontal row on wide, stack on compact). Button: "Let's see what they said →". Warm, inviting — the start of an activity, not a test.

**Reading.** Chat-style conversation, centered. Each turn: speaker avatar (colored circle with initial) + name + speech bubble. Speaker colors distinguish personas. Smooth scrolling — feels like overhearing classmates talk. "Start investigating →" button at bottom, disabled until scroll completes, with a subtle "Keep reading..." hint.

After reading, the main screen appears with highlighted passages. The investigation begins.

### Workspace States (Per Passage)

The right panel workspace cycles through states as the passage moves through its beats.

#### State 1: Individual Diagnosis

The student writes their diagnosis for the selected passage.

```
┌─────────────────────────────────────────────┐
│  Passage 1                                  │
│                                             │
│  💡 Something about where Alex got          │
│     this information...                     │
│  💡 Something about how sure he sounds...   │
│                                             │
│  [🔍 Get another clue ❤️]                   │
│                                             │
│  ─────────────────────────────────────────  │
│                                             │
│  What do you think the problem is?          │
│                                             │
│  ┌───────────────────────────────────────┐  │
│  │                                       │  │
│  │                                       │  │
│  │                                       │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  What kind of problem?                      │
│  [ Facts & sources ][ Reasoning ][ Missing ]│
│                                             │
│                          [Submit diagnosis] │
└─────────────────────────────────────────────┘
```

**Hints area.** Free hints (1-2) shown at the top, always visible. Below them, the lifeline button: "🔍 Get another clue ❤️". Clicking it triggers a brief inline confirmation: "Use one of your group's clues? (2 left)" with two buttons: "Yes" / "Nah, I'll figure it out." On confirm, the new hint appears in the hints area and the header hearts update. After all lifelines spent, the button becomes "No more clues — you've got this!" and is disabled.

**Diagnosis textarea.** Generous (120px+ height, expandable). Prompt above in regular text, not placeholder. On wide screens, the passage text is visible in the left panel so the student can glance at it while writing.

**Lens tag.** Three pill-shaped buttons in a row. Each is tappable (44px+ height). Selecting one highlights it with the phase accent color; the others dim. The student can change selection before submitting.

**Submit.** Disabled until text + tag. On submit:
1. Deepening probe appears (from `lens_entry_prompts`) — a follow-up question that pushes deeper. The student can revise their diagnosis or proceed.
2. After proceeding, misreading check runs. If triggered, redirect appears with a new text box.
3. Passage dot in header fills to half (individual done, waiting for group).

#### State 2: Waiting for Peers

```
┌─────────────────────────────────────────────┐
│  Passage 1 — Waiting for everyone           │
│                                             │
│  Your diagnosis ✓                           │
│  Maya ✓                                     │
│  Jordan ⏳                                  │
│                                             │
│  Work on another passage while you wait?    │
│                                             │
│  [Go to Passage 2 →]  [Go to Passage 3 →]  │
└─────────────────────────────────────────────┘
```

Shows who has submitted and who hasn't. Offers navigation to other passages. Updates live via polling — when Jordan submits, the display transitions to State 3 automatically.

#### State 3: Share & Discuss

```
┌─────────────────────────────────────────────┐
│  Passage 1 — Everyone's in! 🎉             │
│                                             │
│  ┌─ You [Facts & sources] ──────────────┐   │
│  │ "Alex only heard from one cousin.    │   │
│  │  That's not enough to decide."       │   │
│  └──────────────────────────────────────┘   │
│                                             │
│  ┌─ Maya [Reasoning] ──────────────────┐    │
│  │ "Just because the museum is boring   │   │
│  │  doesn't mean the park is better."   │   │
│  └──────────────────────────────────────┘   │
│                                             │
│  ┌─ Jordan [What's missing] ───────────┐    │
│  │ "They're only thinking about fun."   │   │
│  └──────────────────────────────────────┘   │
│                                             │
│  💬 Different angles — you each found       │
│     something different!                    │
│                                             │
│  ───── Your group's diagnosis ─────         │
│                                             │
│  What does your group think is the          │
│  most important problem?                    │
│                                             │
│  ┌───────────────────────────────────────┐  │
│  │                                       │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  [ Facts & sources ][ Reasoning ][ Missing ]│
│                                             │
│                     [Submit group diagnosis] │
└─────────────────────────────────────────────┘
```

Peer diagnoses as cards with name and lens tag as a colored pill. Student's own included (labeled "You").

**Divergence flag.** When lens tags differ: "Different angles — you each found something different!" — a conversation starter.

**Group diagnosis form.** Inline below the peer cards — no separate screen. Group writes, tags, and submits together. After submission, the passage dot fills completely.

#### State 4: Completed

```
┌─────────────────────────────────────────────┐
│  Passage 1 ✅                               │
│                                             │
│  Your group's diagnosis:                    │
│  "Alex's only source is his cousin's        │
│   opinion — that's not enough evidence      │
│   for the whole class to decide on."        │
│   [Facts & sources]                         │
│                                             │
│  [+ Add more thoughts]                      │
└─────────────────────────────────────────────┘
```

Read-only recap with option to append. Clean, brief.

### Expert Reveal Screen

After all passages reach State 4, the main screen transitions to the expert reveal. The left panel still shows the transcript. The right panel becomes a scrollable reveal:

```
┌─────────────────────────────────────────────┐
│  🔍 Here's what Dr. Chen spotted            │
│                                             │
│  ┌─ Passage 1 ─────────────────────────┐    │
│  │                                     │    │
│  │  Your group: "Alex's only source    │    │
│  │  is his cousin's opinion."          │    │
│  │  [Facts & sources]                  │    │
│  │                                     │    │
│  │  🧑‍🔬 Dr. Chen:                      │    │
│  │  "Looking at the evidence, I notice │    │
│  │   Alex's only source is one         │    │
│  │   cousin's opinion. That's a pretty │    │
│  │   thin basis for a whole class      │    │
│  │   decision."                        │    │
│  │                                     │    │
│  │  🤔 Did anyone in the group push    │    │
│  │     back on this?                   │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  ┌─ Passage 2 ─────────────────────────┐    │
│  │  ...                                │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  [🧩 Now let's figure out why → ]           │
└─────────────────────────────────────────────┘
```

Dr. Chen appears with a small avatar and speech-bubble styling — a character, not a system message. The group's diagnosis sits beside Dr. Chen's perspective for direct comparison. Reflection prompts (🤔) appear as conversational questions.

The transition button uses the Explain phase icon and color: "🧩 Now let's figure out why →". The app shifts to purple/indigo.

### Explain Phase — Visual Differences

Same one-screen layout, same per-passage workspace cycle. Visually distinct:

- **Header:** 🧩 "Figure Out Why" in purple/indigo
- **Passage highlights:** Purple-tinted instead of amber
- **Workspace prompt:** "Why did they think this way?" instead of "What's the problem?"
- **Context at top of workspace:** Student's Evaluate diagnosis + Dr. Chen's perspective (read-only, collapsed by default, expandable)
- **Bridge prompt:** Personalized to their lens tag — "You noticed something about the facts. Now think about *why* — what made them trust that one source?"
- **Tag options:** Three pills: "Their thinking" / "The group" / "Both"
- **Lifeline button:** "🧩 Get a starter ❤️" — reveals a sentence starter instead of a clue
- **Dr. Chen reveal:** "🧩 Here's what might explain it" — introduces formal vocabulary (confirmation bias, group pressure) as labels for what students already described

### Completion Screen

Centered, celebratory. Phase colors blend (amber + purple gradient).

```
┌─────────────────────────────────────────────┐
│                                             │
│          🎉 Investigation Complete!         │
│                                             │
│    You diagnosed 3 passages                 │
│    and explained 3 passages                 │
│                                             │
│    Clues used: ❤️ ❤️ 🤍   (2 of 3)         │
│                                             │
│    Great detective work!                    │
│                                             │
└─────────────────────────────────────────────┘
```

If teacher closed session early: "Session ended — your work is saved."

### Visual Design

#### Typography

- Body text: 16px minimum everywhere
- Passage text: 17-18px with generous line height (1.6) for comfortable reading
- Student writing prompts: regular weight, warm color — not bold instructions
- Headings: friendly, not corporate

#### Color Palette

**Phase colors:**
- Evaluate: amber/gold (#F59E0B family) — warm, investigative
- Explain: purple/indigo (#8B5CF6 family) — thoughtful, deeper

**Lens tag colors** (consistent across both phases):
- Facts & sources (Evidence): blue pill
- Reasoning (Logic): green pill
- What's missing (Scope): orange pill
- Always paired with text label — never color-alone

**Category tag colors** (Explain phase):
- Their thinking (Cognitive): teal pill
- The group (Social): rose pill
- Both (Interaction): gradient pill (teal → rose)

**Dr. Chen:** Muted blue-gray speech bubble with a small avatar. Distinct from student cards but not elevated.

**Backgrounds:** Warm off-white (not cold gray). Cards with soft shadows and large rounded corners (12-16px border-radius).

#### Interaction Design

- **Buttons:** Large (48px+ height), rounded, clear enabled/disabled states. Primary actions use phase accent color.
- **Pill selectors (tags):** 44px+ height, rounded-full, tap-friendly. Selected = filled; unselected = outlined.
- **Textareas:** Generous (120px+ min-height), rounded corners, visible border. Prompt above in regular text.
- **Submit feedback:** Brief checkmark animation + passage dot fills in header. No modal, no toast.
- **Lifeline confirmation:** Inline below the button — not a modal popup. Keeps the student in context.
- **Peer arrival:** Name quietly gets a ✓. No sound, no shake, no interruption.
- **Phase transition:** Brief celebratory moment when the last passage completes, then expert reveal slides in.

#### Micro-Celebrations

6th graders need positive feedback loops:
- **Passage diagnosed:** Passage dot fills with a small pop animation
- **All group members in:** "Everyone's in! 🎉" header
- **Group diagnosis submitted:** Brief sparkle on the completed card
- **Phase complete:** Gentle confetti before expert reveal
- **Expert match:** If the group's lens tag matches Dr. Chen's focus: "🎯 You nailed it!"

These are brief (< 1 second) and non-blocking. They add warmth without interrupting flow.

#### Accessibility

- All interactive elements: minimum 44px tap target
- Lens/category tag colors paired with text labels (not color-alone)
- Divergence highlighting: dashed border + text flag
- Passage highlights: color + left border pattern (color-blind safe)
- Phase identity: icon + color + label (triple redundancy)
- Semantic HTML and ARIA landmarks throughout
- Keyboard navigation for all interactive elements
- Focus management: selecting a passage moves focus to the workspace

### State Management Architecture

#### Single Source of Truth

`SessionClient` holds all session state. Step components receive data as props and return user actions as callbacks. No component-local state that diverges from the parent.

#### Stable Polling

All polling uses a single `useStableInterval` hook that stores the callback in a ref, so the interval never restarts on re-renders:

```typescript
function useStableInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback);
  useEffect(() => { savedCallback.current = callback; });
  useEffect(() => {
    if (delay === null) return;
    const id = setInterval(() => savedCallback.current(), delay);
    return () => clearInterval(id);
  }, [delay]);
}
```

Polling concerns:

| Concern | Interval | Owner | Purpose |
|---|---|---|---|
| Session status | 10s | SessionClient | Detect teacher close |
| Peer submissions | 3s | SessionClient | Update passage status (who has submitted) |
| Group diagnosis status | 3s | SessionClient | Track which passages have group diagnoses |

Poll results update the central `data` state in `SessionClient`. Step components render from props — they never poll independently.

#### Passage State Machine

Each passage has an independent state:

```
not_started → individual_submitted → all_in → group_submitted
```

Transitions:
- `not_started → individual_submitted`: student submits their diagnosis
- `individual_submitted → all_in`: all group members have submitted (detected via polling)
- `all_in → group_submitted`: group submits group diagnosis

The phase-level gate: all passages reach `group_submitted` → expert reveal → next phase.

#### Offline Queue

All write operations use `submitWithQueue` — no exceptions. The queue handles:
- Immediate local save (optimistic)
- Background server sync
- Idempotent dedup via clientId
- Recovery on reconnect

#### Error Handling

Submit failures surface to the user: a quiet inline message ("Couldn't save — will retry") rather than silent failure. The student's work is never lost (localStorage queue), but the student should know when sync hasn't happened yet.

---

## Part 4: Data Model Changes

The redesigned flow changes what data is captured compared to the original design.

### What's New

| Data point | Level | Table | Purpose |
|---|---|---|---|
| Individual diagnosis text | Per student × passage | `EvaluateResponse` / `ExplainResponse` | Student's own analysis |
| Lens/category tag | Per student × passage | `EvaluateResponse` / `ExplainResponse` | What kind of problem/force they identified |
| Group diagnosis text | Per group × passage | `GroupDiagnosis` (new) | Group's best judgment |
| Group lens/category tag | Per group × passage | `GroupDiagnosis` (new) | Group's classification |
| Lifeline usage | Per group × passage | `LifelineUsage` (new) | Which passage, which hint |

### What's Removed

| Data point | Reason |
|---|---|
| Lens assignment (per student × session) | Eliminated — lenses are tagged per diagnosis, not pre-assigned |
| Strong/Weak rating | Eliminated — students write free-form diagnoses, no rating scale |
| AI step reflections | Eliminated — expert reveals at phase end, not per-passage with required reflection |
| Group consensus agree/disagree | Replaced by group diagnosis — the group writes their best diagnosis, not a vote on the expert's perspective |

### What's Unchanged

- `EvaluateResponse` and `ExplainResponse` remain append-only
- Responses are keyed by `(sessionId, studentId, passageId)`
- `clientId` for offline dedup
- Session lifecycle (draft → active → closed)

---

## What This Document Supersedes

- `app-design.md` Section "Session Experience Flow" (lines 621-809)
- `app-design.md` Section "Connectivity & Offline Resilience" — connectivity model unchanged but state architecture is specified here
- `app-implementation-plan.md` Phase 3 step descriptions (3.1-3.8) — implementation should follow this document
- `app-implementation-plan.md` Phase 7.4 "Tablet Optimization" — replaced by responsive design throughout
- All references to "tablet-first," "tablet-optimized," "touch-first"
- The concept of lens assignment as a session-level decision
- The 4-step per-phase structure (Individual → Peer → AI → Consensus) — replaced by the 3-beat per-passage cycle (Individual → Share & Discuss → Group Diagnosis)

## What This Document Does Not Change

- The two-phase structure (Evaluate → Explain, sequential, no going back)
- The pipeline artifacts and their schemas (partial_hints, lens_entry_prompts, ai_perspective_evaluate, etc.)
- The teacher monitoring dashboard (adapts to new step structure)
- The researcher tools
- The assessment and behavioral signals system (adapts to new data model)
- The pedagogical framework itself (lenses, facets, explanatory variables)
