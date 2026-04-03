# Student Session Experience — Redesign

This document specifies the student session experience for the Lens app. It replaces the Session Experience Flow section of `app-design.md` and supersedes the tablet-first assumptions in `app-implementation-plan.md`. The student experience is responsive (laptop and tablet), not tablet-first.

**Companion documents:**
- `polylogue-v5-4.md` — Conceptual framework (perspectival learning model, lenses, facets, explanatory variables)
- `app-design.md` — Full app design (roles, data model, assessment) — session flow section is superseded by this document
- `app-implementation-plan.md` — Build plan (Phase 3 will reference this document)

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

**1. Responsive, not device-specific.** The layout adapts to the available viewport. On a laptop (1024px+), the experience can use wider layouts and side-by-side panels. On a tablet (768-1024px), the layout consolidates. Below 768px, single-column. No device-specific code paths — one responsive layout.

**2. Content-first, not chrome-first.** The student's attention should be on the passage text and their own writing, not on UI controls. Headers, navigation, and progress indicators should be minimal and unobtrusive. The writing environment should feel spacious.

**3. Reduce cognitive load at every step.** A 6th grader in a 50-minute class period should never feel lost. The current step, what's expected, and how to proceed should be obvious without instructions. Progressive disclosure — show what's needed now, reveal more on demand.

**4. Shared-screen legibility.** During group discussion and group diagnosis, 2-4 students are looking at one screen while talking. Text must be readable at arm's length. Information density should sustain a conversation without excessive scrolling.

**5. Stability over dynamism.** No content should shift, disappear, or rearrange while the student is reading or writing. Polling updates should appear as additions (a peer's diagnosis appears), never as replacements. Loading states should be calm — a subtle indicator, not a spinner that replaces content.

### Layout Architecture

#### Shell

Every session screen shares a common shell:

```
┌──────────────────────────────────────────────────┐
│  Phase Label    Passage Status   [Lifelines: ●●○]│  ← Sticky header (compact)
├──────────────────────────────────────────────────┤
│                                                  │
│                                                  │
│               Main Content Area                  │  ← Scrollable
│               (adapts per beat)                   │
│                                                  │
│                                                  │
├──────────────────────────────────────────────────┤
│                              [Primary Action]    │  ← Sticky footer (when action needed)
└──────────────────────────────────────────────────┘
```

**Header:** Minimal. Shows the current phase ("Evaluate" / "Explain"), passage status indicators (which passages are at which beat), and the lifeline counter. No navigation menu — the flow is linear. The header is a single row, not a banner.

**Footer:** Appears only when there's a primary action ("Submit Diagnosis", "Submit Group Diagnosis"). Sticky to bottom. Disappears when no action is available.

**Content area:** Fluid width with a readable maximum. `max-w-4xl` (896px) on laptop for comfortable reading; full-width minus padding on tablet. Content is vertically scrollable.

#### Responsive Breakpoints

Three layout tiers:

| Breakpoint | Viewport | Layout behavior |
|---|---|---|
| **Compact** | < 768px | Single column, stacked layout |
| **Medium** | 768px - 1023px | Single column with wider content area |
| **Wide** | 1024px+ | Optional side-by-side panels (passage + workspace) |

### Step-by-Step UI Specifications

#### Onboarding Screen

**Layout:** Centered content, single column.

**Content:**
- Topic as a heading
- Context as a short paragraph
- Character cards: each persona's name and brief description, laid out as a horizontal row on wide screens, vertical stack on compact
- "Let's read what they said" button at bottom

**Tone:** Inviting, not instructional. This is the opening of an activity, not the start of a test.

#### Reading Screen

**Layout:** Chat-style conversation, single column, centered.

**Content:**
- Each turn: speaker name (bold) + speech bubble or indented text
- Speaker colors or avatars for visual distinction between personas
- Smooth scrolling — the transcript should feel like overhearing a conversation

**Scroll gate:** The "Continue" button is visible at the bottom but disabled with a subtle indicator ("Keep reading...") until the student has scrolled through the full transcript.

**Responsive:** Generous margins on wide screens for a comfortable reading column. Minimal margins on compact screens.

#### Passage Dashboard

After reading, the student enters the main workspace for the phase. The passage dashboard is the home screen throughout each phase — showing all passages, their status, and providing access to each one.

**Layout:**

```
┌──────────────────────────────────────────────────┐
│  Evaluate Phase                  [Lifelines: ●●●]│
├──────────────────────────────────────────────────┤
│                                                  │
│  ┌─ Passage 1 ──────────────────────────────┐    │
│  │  "Alex: My cousin went to the science    │    │
│  │   museum and said it was boring..."      │    │
│  │                                          │    │
│  │  Hints: "Something about where Alex      │    │
│  │  got this information..."                │    │
│  │                                          │    │
│  │  Status: Waiting for Jordan...           │    │
│  │  [Your diagnosis ✓] [Maya ✓] [Jordan …] │    │
│  └──────────────────────────────────────────┘    │
│                                                  │
│  ┌─ Passage 2 ──────────────────────────────┐    │
│  │  "Maya: I looked it up and..."           │    │
│  │                                          │    │
│  │  Status: Ready — write your diagnosis    │    │
│  │  [Write Diagnosis]                       │    │
│  └──────────────────────────────────────────┘    │
│                                                  │
│  ┌─ Passage 3 ──────────────────────────────┐    │
│  │  ...                                     │    │
│  └──────────────────────────────────────────┘    │
│                                                  │
└──────────────────────────────────────────────────┘
```

Each passage is a card showing:
- A brief excerpt of the passage text (the highlighted turns)
- Free hints (1-2 directional nudges from the pipeline)
- Status: what beat this passage is at, who has submitted, who hasn't
- An action button appropriate to the current beat

Clicking a passage card opens the workspace for that passage.

#### Individual Diagnosis Workspace

**Layout (wide — 1024px+): Split panel.**

```
┌─────────────────────────┬──────────────────────────┐
│                         │                          │
│   Passage Text          │   Your Diagnosis         │
│   (highlighted turns    │                          │
│    in context)          │   What do you think is   │
│                         │   going on here?         │
│                         │                          │
│   Hints:                │   [Diagnosis textarea]   │
│   "Something about      │                          │
│    where Maya got her   │   What kind of problem?  │
│    information..."      │   ○ Facts & sources      │
│                         │   ○ Reasoning            │
│                         │   ○ Full picture         │
│   [Get another hint     │                          │
│    — costs 1 lifeline]  │   [Submit]               │
│                         │                          │
└─────────────────────────┴──────────────────────────┘
```

The split panel keeps the passage visible while writing. The passage panel shows the highlighted turns plus free hints. An additional hint button is available (costs a lifeline). The workspace has the diagnosis textarea and the lens tag selector.

**Layout (compact — below 1024px): Stacked.**

Passage text at top, workspace below. Acceptable because passages are short (1-3 turns).

**Diagnosis textarea.** Generous height — at least 120px, expandable. A simple prompt above: "What do you think is going on here?" No placeholder text.

**Lens tag.** Three radio-style options in natural language. Selecting one is required before submitting. The student can change their selection before submitting.

**Submit.** Disabled until the student has written something and tagged a lens. On submit, the student returns to the passage dashboard. The passage card updates to show their individual diagnosis as submitted.

#### Share & Discuss View

When all group members have submitted individual diagnoses for a passage, the passage card on the dashboard updates automatically — no button click needed. The card expands or the student taps to see the full share view.

**Layout: Card-based display of all diagnoses.**

```
┌──────────────────────────────────────────────────┐
│  Passage 1 — Everyone's In                       │
│                                                  │
│  ┌────────────────────────────────────────────┐  │
│  │  You [Reasoning]                           │  │
│  │  "The reasoning jumps from the museum      │  │
│  │   being boring to the amusement park       │  │
│  │   being better — that doesn't follow."     │  │
│  ├────────────────────────────────────────────┤  │
│  │  Maya [Facts & sources]                    │  │
│  │  "Alex only heard from one cousin.         │  │
│  │   That's not enough to decide."            │  │
│  ├────────────────────────────────────────────┤  │
│  │  Jordan [Full picture]                     │  │
│  │  "They're only thinking about fun and      │  │
│  │   ignoring cost, learning, everything."    │  │
│  └────────────────────────────────────────────┘  │
│                                                  │
│  ⚡ Different angles — you each saw something   │
│     different in this passage.                   │
│                                                  │
│  [Submit Group Diagnosis]                        │
└──────────────────────────────────────────────────┘
```

Each peer's diagnosis is a row: name, lens tag (in natural language), and their text. The student's own diagnosis is included (labeled "You").

**Divergence highlighting.** When lens tags differ (e.g., one student tagged "Facts & sources" and another tagged "Reasoning"), a subtle flag appears: "Different angles — you each saw something different." This is a conversation starter for the face-to-face discussion.

#### Group Diagnosis Submission

After the group discusses face-to-face, one member submits the group diagnosis. This can be done from the share view:

- A "Submit Group Diagnosis" button opens a workspace
- The group writes their diagnosis together (one student types)
- The group tags a lens together
- Submit

After submission, the passage card shows the group diagnosis as complete. Other group members can append additional thoughts.

The student returns to the passage dashboard and continues individual work on other passages.

#### Expert Reveal Screen

After all passages have group diagnoses, the phase transitions to the expert reveal. Dr. Chen's perspective appears for every passage on a single scrollable screen.

**Layout: Per-passage cards.**

```
┌──────────────────────────────────────────────────┐
│  What Dr. Chen Noticed                           │
├──────────────────────────────────────────────────┤
│                                                  │
│  ┌─ Passage 1 ──────────────────────────────┐    │
│  │  Your group said: "The reasoning jumps   │    │
│  │  from boring museum to better amusement  │    │
│  │  park." [Reasoning]                      │    │
│  │                                          │    │
│  │  Dr. Chen: "Looking at the evidence,     │    │
│  │  I notice Alex's only source is one      │    │
│  │  cousin's opinion..."                    │    │
│  │                                          │    │
│  │  Something to think about: "Did anyone   │    │
│  │  in the group push back on this?"        │    │
│  └──────────────────────────────────────────┘    │
│                                                  │
│  ┌─ Passage 2 ──────────────────────────────┐    │
│  │  ...                                     │    │
│  └──────────────────────────────────────────┘    │
│                                                  │
│  [Continue to Explain Phase →]                   │
└──────────────────────────────────────────────────┘
```

Each passage shows the group's diagnosis alongside Dr. Chen's perspective. The comparison is the point — did the group catch what the expert caught? Did they see something different?

The expert's "something to think about" prompts (from `what_to_notice` in the pipeline) set up the Explain phase.

#### Explain Phase Workspace

Same passage dashboard, same per-passage cycle, adapted for the Explain question.

**Individual Explanation workspace** shows:
- The passage text
- The student's Evaluate diagnosis and the expert's perspective (read-only context)
- A bridge prompt connecting Evaluate to Explain
- The explanation textarea
- The category tag (cognitive / social / both)

**Lifeline hints** in Explain are passage-specific sentence starters:
- "I think Maya felt so sure about the rain barrels because..."
- "I think Jake stopped pushing his question because..."

**Optional scaffolding** (teacher-configured):
- Reference lists: browsable cognitive patterns and social dynamics with brief, student-friendly descriptions

**Share, group explanation, and expert reveal** follow the same pattern as Evaluate. Dr. Chen's Explain perspective introduces formal vocabulary — confirmation bias, group pressure — as labels for things the students have already described in their own words.

#### Completion Screen

**Layout:** Centered, celebratory but not excessive.

**Content:**
- "Investigation Complete" heading
- Passages diagnosed and explained (the reward count)
- Lifelines used per phase
- A brief encouragement note

If the session was closed by the teacher mid-work, the heading changes to "Session Closed" and the message acknowledges the early end.

### Visual Design

#### Typography

- Body text: 16px minimum on all devices
- Passage text and student writing: comfortable to read, slightly spacious line height
- Headings: clear hierarchy — phase labels are prominent, passage numbers are secondary

#### Color

- Lens tags use consistent colors: each lens has a color carried through tags and highlights, paired with labels (not color-alone) for accessibility
- Expert perspective (Dr. Chen): muted blue-gray background — distinct but not commanding
- Divergence highlights: dashed border + subtle badge, not alarm-red
- Lifeline icons: warm color when available, dimmed when spent

#### Interaction States

- Buttons: clear enabled/disabled states. Disabled buttons look inactive, not hidden
- Textareas: generous, expandable. No tiny input boxes
- Submit feedback: brief confirmation (checkmark animation, "Saved"), not a modal or toast
- Polling/loading: subtle indicator in the header. Never a full-screen spinner
- Offline: quiet banner "Saved locally — will sync when connected"
- Lifeline confirmation: brief dialog before spending

#### Accessibility

- All interactive elements: minimum 44px tap target
- Lens tag colors use color + icon/label combinations (color-blind safe)
- Divergence highlighting uses pattern (dashed border) in addition to color
- Semantic HTML and ARIA landmarks throughout
- Keyboard navigation for all interactive elements
- Focus management: when a passage workspace opens, focus moves to the textarea

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
