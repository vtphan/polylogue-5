# Document Revision Plan — 2026-04-03

This plan captures all design decisions from the conceptual framework review and instructional design discussion. It serves as a checklist for updating project documents.

---

## Design Decisions

### Conceptual Framework
1. **AI voice as reference, teacher as authority.** AI is a fallible external perspective. Teacher is the human expert who synthesizes at the class level. Authority lives with the human, not the algorithm.
2. **No separate Evaluate/Explain phases.** One integrated flow. Students articulate what they see and why they think it happened in a single open prompt per passage. No phase names.
3. **Mixed-valence passages.** Transcripts contain predominantly weak reasoning with genuine moments of sound reasoning for contrast, motivation, and calibration.
4. **Deficit-only explanatory variables are acceptable.** Cognitive patterns and social dynamics remain deficit-focused. Students explain strength contrastively ("here they actually questioned each other, unlike...") using their own words, not a positive taxonomy (Option B).
5. **Coverage gaps (Relevance, Inferential Validity)** having no social dynamic connection are acceptable — a pipeline design consideration, not a framework flaw.
6. **Differentiation** means students getting better at pinpointing specific facets and specific cognitive/social mechanisms — not about developing diverse personal perspectives.
7. **Two complementary learning modes.** Verbal = brainstorming (generative, exploratory). Written = articulation (precise, committed). Both essential; app captures articulation, classroom enables brainstorming. Learning happens in the interaction between the two.

### Instructional Design
8. **Nomenclature.** Individual writing = diagnosis. Group conclusion = assessment (revisable, no finality). Assessment can always be updated; learning is continual.
9. **Chat-style interaction.** Messages in a thread, not form submissions. No editing — students append new messages to update. Captures deliberation traces naturally and rewards engagement.
10. **Per-passage state machine** (not linear phases):
    - States: Diagnose, Discuss, Reviewing AI, Submit Assessment
    - Not a linear sequence — an elaborate state machine with multiple valid transitions
    - One hard gate: individual diagnoses must be submitted before peers' are visible
    - AI perspective before assessment costs a lifeline; AI perspective after assessment is free
11. **Unified scaffold sequence.** Hints and AI perspective are one graduated sequence per passage. Pipeline produces variable length (minimum 2: one hint + AI perspective). Each hint costs a lifeline from the shared pool. Groups can skip remaining hints by submitting assessment (AI unlocks free).
12. **Scope lens structurally addressed** through scaffold sequences — passages targeting Scope facets have scaffolds that direct attention there.
13. **Teacher role is minimal during session.** Teacher observes but doesn't intervene. At the end, teacher leads whole-class debrief and records assessment note. Authority is deployed once, at the class level.
14. **Face-to-face assessment blind spot** accepted as a boundary, mitigated by chat-style threads (capture articulation traces), engagement metrics, and teacher observation.
15. **Four sources of perspective.** Individual → Peer → AI voice → Teacher. Fixed sequence.

---

## Part 1: Conceptual Framework (docs/polylogue-v5-5.md)

### Section 1 — Core Premise
- [x] Remove the two sequential questions framing (Evaluate then Explain as separate operations)
- [x] Reframe as one integrated question: students examine reasoning, articulate what they see (both sound and weak), and consider why the characters reasoned the way they did
- [x] The path still runs Lenses → Facets → Explanatory Variables, but not in two separate phases

### Section 5 — Perspectival Learning Model
- [x] Three Sources → Four Sources of Perspective (Individual, Peer, AI voice, Teacher)
- [x] AI as reference, Teacher as authority
- [x] Add brainstorming (verbal, generative) alongside articulation (written, precise) as complementary learning modes
- [x] Clarify that the learning happens in the interaction between the two modes

### Section 6 — What the Framework Teaches
- [x] Reframe the three capacities as integrated, not tied to separate phases
- [x] Evaluative differentiation: clarify as pinpointing specific facets and mechanisms with increasing precision
- [x] Explanatory reasoning as perspective taking: no longer a separate-phase outcome; students explain weakness through deficit patterns and strength contrastively
- [x] What Counts as Learning: update to reflect integrated flow

### Sections 2-4, 7-10 — No structural changes needed

---

## Part 2: Research Overview (RESEARCH-OVERVIEW.md)

### Pedagogical Goals
- [x] Goal #1: Expand to include brainstorming as complementary mode
- [x] Goal #3: AI Voice as Reference, Teacher as Authority
- [x] Goal #5: Reframe to reflect integrated flow, not a separate Explain phase

### Instructional Design
- [x] Add mixed-valence passage design principle
- [x] Remove Two Phases section — replace with integrated flow description, no phase names
- [x] Replace per-passage cycle with per-passage state machine (Diagnose → Discuss → Reviewing AI → Submit Assessment) with valid transitions
- [x] Add chat-style interaction section
- [x] Replace scaffolding section with unified scaffold sequence
- [x] Revise lifeline mechanics to match unified scaffold sequence
- [x] Teacher Debrief section
- [x] Update What the System Captures for chat-style data model and engagement metrics
- [x] Update What Students Learn to mirror v5-5 Section 6 changes

---

## Part 3: Cross-Document Consistency Checks

### docs/pipeline-spec.md
- [x] Update session structure description (per-passage state machine)
- [x] Update analysis artifact: unified AI perspective (merged evaluate/explain blocks)
- [x] Update facilitation guide schema (per-state, not per-phase)
- [x] Update session config schema (removed two-phase structure)
- [x] Update scaffolding schema (unified scaffold sequence)
- [x] Update Stage 3/4 descriptions
- [x] Update app contract section (Section 7)

### CLAUDE.md
- [x] Update session structure description
- [x] Update AI perspective description (unified, not split)
- [x] Update scaffolding description (unified scaffold sequence)
- [x] Update project overview line

### docs/app-design.md
- [x] Revision note added referencing this plan
- [ ] Full rewrite of session flow, data model, UI specs, assessment needed (deferred — large document)

### docs/app-student-experience.md
- [x] Revision note added referencing this plan
- [ ] Full rewrite needed — heavy "Dr. Chen", two-phase, expert reveal references (deferred — large document)

### docs/user-stories.md
- [x] Revision note added referencing this plan
- [ ] Update needed — two-phase, I→P→AI→Consensus references (deferred — large document)

---

## Remaining Work

Three large documents (app-design.md, app-student-experience.md, user-stories.md) have revision notes but need full rewrites to align with the new design. These are deferred because:
1. They are implementation-level documents (UI specs, user flows) that depend on the conceptual framework and instructional design being stable first
2. Each is 10-17k tokens and requires careful, section-by-section rewriting
3. The revision notes ensure no one builds against the old design unknowingly

The source-of-truth documents (RESEARCH-OVERVIEW.md, polylogue-v5-5.md, CLAUDE.md, pipeline-spec.md) are updated and internally consistent.
