# Pipeline Technical Specification

This document specifies the pipeline that generates AI group discussions for the Lens app. The pipeline takes a topic and instructional goals as input and produces a set of artifacts — a scripted discussion, an expert analysis, and a facilitation guide — that the app renders and the teacher uses.

The pipeline is designed from the conceptual framework (`polylogue-v5-4.md`) and the facet inventory (`facet-inventory.md`). Every design decision traces to one of three concerns: (1) the artifacts must support the app's two-phase session structure — Evaluate then Explain, each with its own Individual → Peer → AI cycle, (2) the hidden layer (facets) must be precise enough for generation and assessment but invisible to students, and (3) the artifacts must be sufficiently indexed for the app to reference specific moments in the discussion.

---

## 1. What the Pipeline Produces

The pipeline produces six artifacts per scenario. Each is a YAML file stored in `registry/{scenario_id}/`.

| Artifact | File | Who consumes it | Purpose |
|---|---|---|---|
| Scenario plan | `scenario.yaml` | Pipeline (internal) | Blueprint for discussion generation — topic, personas, targeted facets, turn outline |
| Discussion transcript | `transcript.yaml` | App (student-facing) | The scripted group discussion students evaluate, fully enumerated |
| Expert analysis | `analysis.yaml` | App (AI perspective phase), pipeline (quality check) | Per-passage expert observations through each lens, with facet identification and explanatory variable mapping |
| Facilitation guide | `facilitation.yaml` | Teacher | What's structurally present, what students are likely to see and miss, scaffolding suggestions |
| Scaffolding materials | `scaffolding.yaml` | App (student scaffolding) | Pedagogical materials the app needs at runtime — hints, prompts, starters, rubric entries — produced by an instructional designer agent from the evaluator's analysis |
| Session configuration | `session.yaml` | App (session setup) | Which transcript, which passages to evaluate, lens assignments, AI perspective delivery |

### Why These Six

The app runs a two-phase session. Each phase has its own Individual → Peer → AI cycle:

```
EVALUATE PHASE (What do you see in the reasoning?)
  Individual:  Student evaluates passages through lenses (rating + articulation)
  Peer:        Students see how their group evaluated the same passages differently
  AI:          AI perspective on evaluation — per-lens observations, no explanatory vocabulary

EXPLAIN PHASE (Why did they think this way?)
  Individual:  Student considers why the characters reasoned the way they did — perspective taking, not diagnosis
  Peer:        Students see how their group considered the question differently
  AI:          AI perspective on explanation — cognitive × social vocabulary, as one possible reading
```

The pipeline artifacts support this structure:

- **Evaluate — Individual:** The transcript (what students read), the session configuration (which passages, which lenses, the articulation prompt), and the scaffolding materials (partial hints, lens-specific entry prompts, difficulty signals).
- **Evaluate — Peer:** No pipeline artifact — peer exchange uses live student responses. But the transcript must be rich enough to produce diverse readings, which is a generation concern. The facilitation guide provides the teacher with discussion starter questions for groups.
- **Evaluate — AI:** The expert analysis, evaluate block — per-lens observations only, no explanatory vocabulary yet. The scaffolding materials provide reflection prompts specific to each AI observation.
- **Explain — Individual:** The session configuration (explanation prompt, optional reference lists) and the scaffolding materials (passage-specific sentence starters, bridge prompts connecting Evaluate observations to the perspective-taking task).
- **Explain — Peer:** No pipeline artifact — peer exchange uses live student responses.
- **Explain — AI:** The expert analysis, explain block — introduces cognitive and social vocabulary as one possible reading, not a definitive diagnosis. The scaffolding materials provide reflection prompts specific to each AI explanation.
- **Teacher throughout:** The facilitation guide, organized by phase.
- **Assessment:** The scaffolding materials include observation rubric entries — what a student might say at different levels of differentiation — enabling the app to do approximate matching without LLM access at runtime.

The scenario plan is consumed only by the pipeline itself — it governs generation but is not rendered by the app.

---

## 2. Artifact Specifications

### 2.1 Scenario Plan (`scenario.yaml`)

The blueprint for a single discussion. Created by the operator (via `create_scenario`) and consumed by the pipeline's generation agents.

```yaml
scenario_id: string                    # kebab-case identifier (e.g., "ocean-pollution-solutions")
topic: string                          # The discussion topic in plain language
context: string                        # PBL connection — what unit, what driving question, why this topic
instructional_goals:                   # What the teacher wants students to practice
  - string

personas:                              # 2-3 discussion participants
  - name: string
    perspective: string                # What this persona believes/values and why
    knowledge: string                  # What they've researched or experienced
    weaknesses: string                 # What they'll get wrong and why — phrased as character
                                       # traits, NOT as facet names or framework terminology

target_facets:                         # Which facets are targeted for weakness (hidden layer)
  - facet_id: string                   # From facet inventory (e.g., "source_credibility")
    target_quality: weak | strong      # Usually weak — what quality level is designed
    primary_lens: string               # The lens most likely to reveal this facet
    also_visible_through:              # Other lenses that can reveal it (from facet inventory)
      - string
    designed_explanation:               # The explanatory variables that account for this facet
      cognitive_pattern: string | null  # From the cognitive patterns list (e.g., "confirmation_bias")
      social_dynamic: string | null    # From the social dynamics list (e.g., "group_pressure")
      interaction_note: string | null  # How the cognitive and social forces interact, if both present
    carrier_persona: string            # Which persona primarily manifests this facet weakness

discussion_arc: string                 # Narrative description of how the discussion unfolds —
                                       # where tension rises, where it resolves or fails to resolve

turn_outline:                          # Ordered sequence of turns
  - speaker: string                    # Persona name
    accomplishes: string               # What this turn does for the discussion — phrased in
                                       # natural language, no facet names, no framework terminology
```

**Design notes:**

- `weaknesses` and `accomplishes` fields use natural language, not framework terminology. This is the information barrier — the dialog writer sees persona traits and narrative goals, not facet targets. The pipeline operator writes these fields with the facet targets in mind, but the dialog writer reads them as character and story.
- `target_facets` is stripped before the scenario plan is passed to the dialog writer. The dialog writer never sees facet IDs, lens names, or explanatory variables.
- `designed_explanation` captures the *intended* cognitive-social account. The evaluator may identify different or additional explanatory variables in the generated transcript — the designed explanation is a target, not a constraint.
- Personas must have genuine disagreement — different positions on a decision, tradeoff, or interpretation, not just different areas of focus toward the same conclusion.

### 2.2 Discussion Transcript (`transcript.yaml`)

The scripted group discussion, fully enumerated for app rendering and cross-referencing.

```yaml
scenario_id: string
personas:                              # Persona metadata for app rendering
  - name: string
    perspective: string                # Brief description (student-visible)

turns:
  - turn_id: string                    # Sequential: "turn_01", "turn_02", ...
    speaker: string                    # Persona name
    sentences:
      - sentence_id: string            # Sequential within turn: "turn_01.s01", "turn_01.s02", ...
        text: string                   # The sentence text
```

**Design notes:**

- Every sentence has a unique ID. The expert analysis, facilitation guide, student annotations, and app all reference sentences by ID. This is the indexing foundation.
- The transcript schema is framework-independent — it describes structure (turns, sentences, speakers), not content. It transfers from v4 unchanged.
- Enumeration is mechanical and deterministic — a script assigns IDs after generation. The dialog writer produces natural prose; enumeration is applied afterward.
- Turn count target: 10-14 turns, 1-3 sentences per turn, total discussion under 400 words. Short turns feel natural for 6th-grade characters and keep the word count manageable. The discussion must be readable in 3 minutes, leaving time for re-reading during evaluation.

### 2.3 Expert Analysis (`analysis.yaml`)

The expert perspective that students encounter in the AI phases. This is the pipeline's most framework-dependent artifact — it bridges the hidden layer (facets, explanatory variables) and the visible layer (what the AI says to students). The visible layer is split into two blocks matching the session's two phases: the AI shows lens-based observations after Evaluate and explanatory vocabulary after Explain.

```yaml
scenario_id: string

passage_analyses:                      # One per evaluable passage (a passage is 1-3 consecutive turns)
  - passage_id: string                 # "passage_01", "passage_02", ...
    turns: [string]                    # Turn IDs included in this passage (e.g., ["turn_03", "turn_04"])
    sentence_range: [string]           # All sentence IDs in this passage

    # --- Hidden layer (not shown to students) ---
    facet_annotations:
      - facet_id: string               # From facet inventory
        quality_level: string          # "strong", "weak", or a brief qualitative description
        evidence_sentences: [string]   # Sentence IDs where this facet is observable
        primary_lens: string           # The lens most likely to reveal this
        also_visible_through: [string] # Other lenses that can reveal it
        explanatory_variables:
          cognitive_pattern: string | null
          social_dynamic: string | null
          interaction: string | null   # How cognitive and social forces interact here
        was_targeted: boolean          # Whether this facet was a design target in the scenario plan
        notes: string | null           # Evaluator observations — unexpected findings, quality issues

    # --- Visible layer: Evaluate AI reveal ---
    # Shown after the Evaluate phase's peer discussion.
    # Per-lens observations only — no explanatory vocabulary yet.
    ai_perspective_evaluate:
      through_logic:                   # What the AI sees through the Logic lens
        observation: string | null     # Written as a perspective: "Looking at the logic here, I notice..."
        key_sentences: [string]        # Sentence IDs the observation references
      through_evidence:                # What the AI sees through the Evidence lens
        observation: string | null
        key_sentences: [string]
      through_scope:                   # What the AI sees through the Scope lens
        observation: string | null
        key_sentences: [string]
      what_to_notice: string           # A brief, student-friendly prompt: "Something interesting to
                                       # think about: did anyone in the group push back on this?"
      what_to_notice_sentences: [string] | null  # Optional sentence IDs that "this" refers to

    # --- Visible layer: Explain AI reveal ---
    # Shown after the Explain phase's peer discussion.
    # Introduces cognitive and social vocabulary as perspective.
    ai_perspective_explain:
      explanatory_note: string | null  # "A cognitive scientist might say..." or "In group dynamics
                                       # research, this pattern is called..." — introduces vocabulary
                                       # as perspective, not verdict
      cognitive_connection: string | null  # How a cognitive pattern accounts for what was observed,
                                           # written as "one way to think about this..."
      social_connection: string | null     # How a social dynamic accounts for what was observed
      interaction_note: string | null      # How cognitive and social forces interacted here —
                                           # "Notice how [cognitive pattern] persisted because
                                           # [social dynamic]..." or the reverse direction

    # --- Perspectival diversity metadata (hidden layer) ---
    # Used for pipeline quality assessment and shared with the facilitation guide.
    # The facilitation guide references this section rather than duplicating it.
    diversity_potential:
      expected_lens_split: string      # Which lenses are likely to produce different readings
      likely_student_observations:     # What students are likely to see, and what they might miss
        - lens: string
          observations: [string]       # Discrete expected observations (not a summary paragraph)
          might_miss: [string]         # Specific things students might not notice
```

**Design notes:**

- The artifact has three layers: hidden facet annotations (for pipeline quality checks and teacher facilitation), two visible AI perspective blocks (one per session phase), and diversity metadata (for pipeline quality assessment and facilitation).
- **The AI perspective is split into two blocks** matching the session's two phases. `ai_perspective_evaluate` gives per-lens observations after students have evaluated and discussed. `ai_perspective_explain` introduces explanatory vocabulary after students have formed and discussed their own explanations. This enforces the framework's dependency: you evaluate *what* before you explain *why*. Showing both at once would let the explanation frame the evaluation.
- The Evaluate AI perspective is written *per lens*, not per facet. Students see observations organized by the lenses they've been using, not by a hidden taxonomy. A single observation through the Evidence lens might touch multiple facets without naming any of them.
- `ai_perspective_evaluate` observations are written as perspectives, not answers: "Looking at the evidence here, I notice that both sources come from the same organization. When all your evidence traces back to one origin, it can look like a lot of support but actually represent a single perspective." The tone is "here's what I see" not "here's what's wrong."
- `ai_perspective_explain` introduces formal vocabulary (confirmation bias, group_pressure) as named concepts from disciplines — "a psychologist might call this..." — not as the correct answer. The tone reinforces perspective taking: the AI offers one way of considering why the characters reasoned the way they did, not a definitive diagnosis. Students who encountered different readings in peer discussion now have a disciplinary perspective to compare against their own. The `interaction_note` models how cognitive and social forces connect — this is the most sophisticated move, and many students will encounter it for the first time here.
- `what_to_notice` is a lightweight prompt designed to redirect attention without giving away the answer. It bridges the Evaluate AI reveal and the upcoming Explain phase — an invitation to start thinking about *why*.
- Not every lens has an observation for every passage. Null observations are fine — they mean the AI has nothing to add through that lens for this passage.
- `diversity_potential` is not shown to students. It serves two audiences: the pipeline (quality assessment — will this transcript produce perspectival diversity?) and the facilitation guide (the teacher needs to know what students are likely to see and miss). The facilitation guide inlines this content for teacher usability — the same observations exist in both places, serving different functions (quality assessment here, classroom scaffolding there).

### 2.4 Facilitation Guide (`facilitation.yaml`)

The teacher's companion for running the session. Organized by passage, with scaffolding for each of the session's two phases (Evaluate and Explain) and their three steps (Individual, Peer, AI).

```yaml
scenario_id: string
overview:
  topic: string
  targeted_facets_summary: string      # Plain-language summary of what's designed into the discussion
  session_timing: string               # Suggested time allocation: Evaluate (I→P→AI) + Explain (I→P→AI)
  what_to_expect: string               # General guidance: what students tend to notice first,
                                       # where they struggle, common misconceptions

passage_guides:
  - passage_id: string
    turns: [string]
    summary: string                    # What happens in this passage, in plain language

    whats_here:                        # What is structurally present (teacher-facing, uses facet language)
      - facet: string                  # Facet name (e.g., "source credibility")
        quality: string                # "strong", "weak", brief description
        visible_through: [string]      # Which lenses reveal it
        explanation: string            # Why it's this way — cognitive pattern, social dynamic, or both

    # --- Evaluate phase scaffolding ---
    evaluate:
      individual:
        if_students_are_stuck: string  # Lens-based redirects: "Try looking through the Evidence
                                       # lens — what do you notice about the sources?"
      peer:
        likely_disagreements: string   # Where students are likely to see different things
        productive_questions: [string] # Questions the teacher can pose to deepen discussion
        watch_for: string              # Signs that discussion is productive vs. stalled
      ai:
        what_the_ai_will_say: string   # Summary of the Evaluate AI perspective (no surprises)
        likely_student_reactions: string
        follow_up: string              # Bridge to the Explain phase

    # --- Explain phase scaffolding ---
    explain:
      individual:
        if_students_are_stuck: string  # Prompts for the explanation: "Think about what was
                                       # happening in the group when this happened..."
      peer:
        likely_disagreements: string   # Where students are likely to offer different explanations
        productive_questions: [string] # Questions that push toward cognitive-social interaction
        watch_for: string
      ai:
        what_the_ai_will_say: string   # Summary of the Explain AI perspective (vocabulary introduction)
        likely_student_reactions: string
        follow_up: string              # What to do after the session

    # --- Observation predictions (inlined for teacher convenience) ---
    likely_observations:
      - lens: string
        will_likely_see: [string]      # What students looking through this lens will probably notice
        might_miss: [string]           # What they might not notice — helps the teacher direct attention

# --- Whole-class debrief materials ---
debrief:
  key_takeaways: [string]              # 2-3 main insights from this scenario that the teacher can
                                       # surface in whole-class discussion. Written in teacher language
                                       # (uses facet vocabulary). e.g., "Students who looked through
                                       # Evidence and Scope likely saw different aspects of the same
                                       # weakness — this is a good moment to make perspectival
                                       # diversity visible to the class."

  cross_group_prompts: [string]        # Questions the teacher can pose to the whole class after
                                       # groups have completed both phases. Designed to surface
                                       # cross-group patterns and make the perspectival learning
                                       # model visible at the class level.
                                       # e.g., "Did any group have members who saw the same passage
                                       # very differently? What lenses were they using?"
                                       # e.g., "Did anyone's explanation change after hearing from
                                       # their group or the AI? What changed your mind?"

  connection_to_next: string | null    # Optional bridge to future sessions — what capacity this
                                       # session exercised and what might come next.
                                       # e.g., "This discussion had strong cross-lens visibility —
                                       # next session's discussion will require closer reading
                                       # through a single lens."
```

**Design notes:**

- The facilitation guide uses facet language openly — this is a teacher-facing document, and teachers are part of the "operator" audience who sees the hidden layer.
- Scaffolding is organized by session phase (Evaluate, Explain) and step (Individual, Peer, AI) because that's when the teacher needs it.
- `if_students_are_stuck` offers lens-based redirects in the Evaluate phase ("Try looking through the Scope lens") and explanatory prompts in the Explain phase ("Think about what was happening in the group..."). Never answers.
- `likely_observations` is inlined in the guide rather than referenced from `analysis.yaml`. The same content exists in `analysis.yaml`'s `diversity_potential` (for pipeline quality assessment), but the teacher needs a self-contained document they can scan in 2-3 minutes and consult while circulating among groups. Cross-referencing two files during a live session is not realistic.
- The `overview` section gives the teacher the big picture; `passage_guides` are referenced during the session as needed.
- The `debrief` section supports the whole-class wrap-up that typically follows the I→P→AI cycles. `key_takeaways` help the teacher name what happened in the session. `cross_group_prompts` make the perspectival learning model visible at the class level — students hear how other groups saw the same discussion differently. `connection_to_next` helps the teacher frame growth across sessions.

### 2.5 Session Configuration (`session.yaml`)

Tells the app how to set up and run the session. Reflects the two-phase structure: Evaluate (I→P→AI) then Explain (I→P→AI).

```yaml
scenario_id: string
transcript_file: string                # Path to transcript.yaml
analysis_file: string                  # Path to analysis.yaml
scaffolding_file: string               # Path to scaffolding.yaml

onboarding:                            # Displayed before evaluation begins
  topic_summary: string                # Brief context for students ("A group of students is discussing...")
  reading_instruction: string          # "Read the discussion, then we'll look at it together through
                                       # different lenses."
  # Persona names and perspectives are read from transcript.yaml's personas field

passages:                              # Which parts of the transcript students evaluate
  - passage_id: string                 # Must match passage_ids in analysis.yaml
    turns: [string]                    # Turn IDs in this passage
    evaluable: boolean                 # Whether students evaluate this passage (some are context-setting)
    suggested_order: integer | null     # Suggested evaluation order (1 = first). Based on difficulty
                                       # signal from scaffolding.yaml. Teacher can override.

lens_definitions:                      # The three lenses, as shown to students
  - lens_id: string                    # "logic", "evidence", "scope"
    name: string                       # Display name
    question: string                   # The lens question ("Does the reasoning hold?")
lens_scope: evaluate_only              # Lenses apply to the Evaluate phase only. The Explain phase
                                       # is lens-independent — students explain across all passages
                                       # they evaluated, regardless of which lens they used.

# --- Evaluate phase configuration ---
evaluate_phase:
  sequence: [individual, peer, ai]
  individual:
    instructions: string               # What the app tells the student to do
    rating_options: ["strong", "weak"]
    articulation_prompt: string        # "What do you see? Why did you rate it this way?"
  peer:
    instructions: string               # "See how your group members evaluated this passage..."
  ai:
    instructions: string               # "Here's what an expert noticed when looking through each lens..."
    source: ai_perspective_evaluate    # Which block in analysis.yaml to render
    response_required: boolean         # If true, student must write a brief response before the
                                       # phase is complete. Default: true.
    response_prompt: string            # Prompt for the required response. Passage-specific reflection
                                       # prompts from scaffolding.yaml override this generic prompt.

# --- Explain phase configuration ---
explain_phase:
  sequence: [individual, peer, ai]
  individual:
    instructions: string               # What the app tells the student to do
    explanation_prompt: string         # "Why do you think they reasoned this way?"
    sentence_starters:                 # Scaffolding for 6th graders — optional, teacher-controlled
      - category: cognitive
        starter: "I think they reasoned this way because they were focused on..."
      - category: social
        starter: "I think the group..."
      - category: interaction
        starter: "The group made it easier/harder for this kind of thinking because..."
  peer:
    instructions: string               # "See how your group members explained this..."
  ai:
    instructions: string               # "Here's how a cognitive scientist and social psychologist
                                       #  might think about what happened..."
    source: ai_perspective_explain     # Which block in analysis.yaml to render
    response_required: boolean         # If true, student must write a brief response before the
                                       # phase is complete. Default: true.
    response_prompt: string            # Prompt for the required response. Passage-specific reflection
                                       # prompt from scaffolding.yaml overrides this generic prompt.
  reference_lists:                     # Optional — teacher decides whether to show these
    show_cognitive_patterns: boolean
    show_social_dynamics: boolean
    cognitive_patterns:
      - id: string
        name: string
        description: string
    social_dynamics:
      - id: string
        name: string
        description: string
```

**Design notes:**

- The session configuration explicitly encodes the two-phase structure. Each phase has its own sequence (I→P→AI), its own instructions, and its own AI source block. The app renders `ai_perspective_evaluate` after the Evaluate peer discussion and `ai_perspective_explain` after the Explain peer discussion — never both at once.
- `onboarding` provides the content for a dedicated reading step before evaluation begins. The app displays the topic summary, character names and perspectives (from `transcript.yaml`), and a reading instruction. Students read the full discussion before any evaluation prompt appears.
- `lens_scope: evaluate_only` makes explicit that lenses are an Evaluate phase tool. The Explain phase is lens-independent — students explain *why* using cognitive and social variables, not lenses.
- `suggested_order` on passages lets the app suggest an accessibility-first ordering. The teacher can override by reordering passages in the config.
- `response_required` on the AI steps ensures students engage with the AI perspective rather than scrolling past it. The response can be brief (even one sentence) — the purpose is the moment of consideration, not the length.
- `lens_definitions` are included in the session config (not hardcoded in the app) so they can be adjusted per session if needed — e.g., an early session might only use two lenses.
- `sentence_starters` scaffold 6th graders into the explanation phase. The three categories (cognitive, social, interaction) gently structure their thinking without imposing the framework's vocabulary. The interaction starter ("The group made it easier/harder...") is particularly important — it prompts students to connect cognitive and social forces, which is the framework's deepest learning objective. Sentence starters are optional and teacher-controlled.
- `reference_lists` for cognitive patterns and social dynamics are shown at the teacher's discretion. Early sessions might hide them to encourage free articulation; later sessions might show them to introduce vocabulary. The toggle is per-session, not per-passage.
- The session config does not include assessment criteria. Assessment uses the scaffolding materials (observation rubric entries) and the expert analysis — that matching logic lives in the app, not the pipeline.

### 2.6 Scaffolding Materials (`scaffolding.yaml`)

Pedagogical materials produced by an instructional designer agent from the evaluator's analysis. These are the materials the app needs at runtime to scaffold student engagement — hints, prompts, starters, and rubric entries that require LLM intelligence to produce but that the app renders without LLM access.

The key architectural principle: **the pipeline has LLM access; the app does not.** Any intelligence the app needs must be baked into the artifacts at pipeline time. The evaluator produces the analytical foundation (what's structurally present, what the AI perspective says). The scaffolding instructional designer translates that analysis into pedagogical materials calibrated for 6th graders.

```yaml
scenario_id: string

passage_scaffolding:                   # One per evaluable passage
  - passage_id: string
    turns: [string]

    # --- Evaluate phase scaffolding ---
    evaluate:
      difficulty: string               # "accessible" | "moderate" | "challenging"
                                       # Two criteria:
                                       # 1. Cross-lens visibility — high = accessible (students
                                       #    likely to see something regardless of lens), low =
                                       #    challenging (only one lens reveals the facet).
                                       # 2. Signal strength — how obvious the targeted facet is
                                       #    in the text. A cartoonish weakness is accessible
                                       #    even with low visibility; a subtle weakness is
                                       #    challenging even with high visibility.
                                       # Both matter. High visibility + strong signal = accessible.
                                       # Low visibility + subtle signal = challenging.
                                       # Mixed combinations = moderate.
                                       # The app uses this to suggest passage order.

      partial_hints:                   # Per-lens starting points for stuck students.
        - lens: string                 # Not complete observations — just enough direction to
          hints:                       # get the student looking at the right thing.
            - string                   # e.g., "Something about the sources..." or
                                       # "Notice how the conclusion compares to the evidence..."

      lens_entry_prompts:              # Per-lens, per-passage prompts more specific than the
        - lens: string                 # generic "What do you see?"
          prompt: string               # e.g., "Looking through Evidence: what sources did they
                                       # use, and are those sources convincing?"

      ai_reflection_prompts:           # Per-lens prompts shown after the Evaluate AI reveal.
        - lens: string                 # More engaging than the generic "What do you think?"
          prompt: string               # e.g., "The AI noticed the sources all come from one
                                       # place. Did you notice that too, or were you looking
                                       # at something different?"

    # --- Explain phase scaffolding ---
    explain:
      passage_sentence_starters:       # Passage-specific starters, more directed than the
        - category: string             # generic session-level starters.
          starter: string              # e.g., "I think Maya kept going back to cost because..."
                                       # Gestures toward what's there without naming the pattern.

      bridge_prompts:                    # Per-lens prompts connecting the student's Evaluate
        - lens: string                 # observation to the Explain task. The app selects the
          prompt: string               # variant matching the student's Evaluate lens.
                                       # e.g., Evidence: "You noticed something about the
                                       # evidence. Now think about *why* — what was going on
                                       # in the group when this happened?"
                                       # Logic: "You noticed something about the reasoning.
                                       # Now think about *why* — what led them to think that way?"

      ai_reflection_prompt: string     # Shown after the Explain AI reveal.
                                       # e.g., "The AI called this confirmation bias. Does that
                                       # match what you were trying to say, or do you see it
                                       # differently?"

    # --- Common misreadings ---
    common_misreadings:                # Predictable misinterpretations the app can detect and
      - lens: string                   # respond to without LLM access at runtime.
        misreadings:
          - pattern: string            # What the student might write. e.g., "the evidence is
                                       # strong because there's a lot of it" (when the passage
                                       # has abundant but unreliable evidence)
            redirect: string           # A gentle prompt that redirects without giving the answer.
                                       # e.g., "You noticed there's a lot of evidence — now look
                                       # more closely at where it comes from."
                                       # Written in student-friendly language. Does not name the
                                       # correct observation — just redirects attention.

    # --- Assessment support ---
    observation_rubric:                # What a student might say when evaluating, at different
      - lens: string                   # levels of differentiation. Evaluate phase only.
        levels:                        # The app uses these for approximate matching without
          - level: basic               # LLM access at runtime.
            examples: [string]         # e.g., "the evidence is weak"
          - level: developing
            examples: [string]         # e.g., "they didn't have enough evidence for that big
                                       #  a claim"
          - level: differentiated
            examples: [string]         # e.g., "there's plenty of evidence but it all comes
                                       #  from one source, and one source isn't enough for
                                       #  something that affects everyone"

    explanation_rubric:                # What a student might say when explaining. Explain
      categories:                      # phase — lens-independent. Organized by explanation
                                       # type (cognitive, social, interaction) and level.
        - category: cognitive          # Student identifies an individual thinking pattern
          levels:
            - level: basic             # e.g., "she was biased"
              examples: [string]
            - level: developing        # e.g., "she only looked for evidence she agreed with"
              examples: [string]
        - category: social             # Student identifies a group dynamic
          levels:
            - level: basic             # e.g., "the group just went along with it"
              examples: [string]
            - level: developing        # e.g., "nobody pushed back when she said it"
              examples: [string]
        - category: interaction        # Student connects cognitive and social forces
          levels:                      # This is the framework's deepest learning objective.
            - level: developing        # e.g., "she had tunnel vision and nobody stopped her"
              examples: [string]
            - level: differentiated    # e.g., "she only looked for evidence she agreed with,
              examples: [string]       #  and nobody challenged her, so she just kept going —
                                       #  the group made it easy for her to stay stuck"

```

**Design notes:**

- The scaffolding instructional designer is a different agent from the transcript instructional designer (Stage 2). The transcript instructional designer sharpens the content students *read*. The scaffolding instructional designer produces the materials that help students *engage with* that content. Different inputs, different outputs, different competencies.
- **Partial hints** are deliberately incomplete. The calibration principle: **direct attention to *where* to look, not *what* to see.** A hint should point to a region of the reasoning (the sources, the conclusion, what the group did) without naming what about that region is notable. "Something about the sources..." directs to a region. "The sources all come from one place" names what's notable — that's an observation, not a hint. The scaffolding instructional designer's prompt must encode this distinction. Note: for some passages, directing to a region makes the observation practically obvious because there's only one notable thing there. This is unavoidable, but the articulation work is preserved because the hint appears above the text box — the student still writes their own observation in their own words.
- **Passage-specific sentence starters** are more directed than the generic session-level starters in `session.yaml`. The generic starter says "I think they reasoned this way because they were focused on..." The passage-specific starter says "I think Maya kept going back to cost because..." The app can show the generic starter first and offer the passage-specific starter as a fallback if the student is stuck.
- **Bridge prompts** are the transition between phases, produced per-lens so the app can select the variant matching the student's Evaluate lens. A student who evaluated through Evidence sees "You noticed something about the evidence..." while a student who evaluated through Logic sees "You noticed something about the reasoning..." This personalization is pre-computed by the pipeline (one variant per lens per passage), not computed at runtime.
- **Observation rubric entries** (Evaluate phase) give the app a matching vocabulary for lens-based articulations. Each entry shows what a student might say at three levels of differentiation (basic, developing, differentiated) for a given lens on a given passage. **Explanation rubric entries** (Explain phase) are organized by explanation type — cognitive-only, social-only, and interaction — with levels within each type. This structure lets the assessment system track not just whether explanations are getting more specific (levels), but whether students are progressing from single-force explanations (cognitive or social alone) to interaction explanations (connecting both). Interaction is the framework's deepest learning objective; it has no "basic" level because connecting two forces is inherently at least developing. The app compares the student's free-text responses against these examples to assess quality and track growth over time — without needing LLM access at runtime. The matching is approximate (keyword/semantic overlap), not exact.
- **Common misreadings** anticipate predictable student errors — cases where a student sees something real but incomplete or misattributed. The redirect is calibrated like a partial hint: it redirects attention without naming the correct observation. e.g., a student who writes "the evidence is strong because there's a lot of it" when the sources are all unreliable gets "You noticed there's a lot of evidence — now look more closely at where it comes from." The app matches student articulations against misreading patterns (keyword/semantic overlap) and surfaces the redirect inline. This follows the same architectural principle as hints and rubrics: the pipeline has LLM access; the app does not. Misreadings that require LLM-level judgment to detect are out of scope — only predictable, pattern-matchable misreadings belong here.
- **Discussion starters belong in the facilitation guide, not here.** The scaffolding instructional designer enriches the facilitation guide's `productive_questions` fields with passage-specific, pipeline-generated questions for the teacher to use during peer discussion. These are teacher-facing materials and belong in `facilitation.yaml`, not in a student scaffolding artifact.
- All text in this artifact is written in student-friendly language — 6th-grade vocabulary, concrete examples, no framework terminology. The instructional designer agent translates the evaluator's analytical language into pedagogical language.

### 2.7 Student Annotations (app-side schema)

This schema is not a pipeline artifact — it defines how the app stores student responses. It is specified here because the assessment system matches student annotations against pipeline artifacts (observation rubric, explanation rubric, facet annotations), and the matching strategy needs to know the structure of what it's matching.

```yaml
student_id: string
session_id: string
passage_id: string

evaluate:                              # Evaluate phase responses
  lens: string                         # Which lens the student used
  rating: strong | weak                # The student's rating
  responses:                           # Append-only list — student can always add more
    - text: string                     # What the student wrote
      timestamp: datetime
      step: individual | peer | ai     # Which step prompted this response
      hint_used: boolean               # Whether the student viewed a partial hint before writing

explain:                               # Explain phase responses
  responses:                           # Append-only list
    - text: string
      timestamp: datetime
      step: individual | peer | ai
      starter_used: string | null      # Which sentence starter the student used, if any
                                       # (generic category or passage-specific)
```

**Design notes:**

- `step` records which step prompted each response — individual (first articulation), peer (added after seeing peers), or ai (added after seeing AI perspective). This lets the assessment system track how perspectives build over the sequence.
- `hint_used` tracks whether the student saw a partial hint before writing. A student who relies on hints across multiple sessions isn't developing evaluative differentiation — this is a growth indicator alongside articulation quality.
- `starter_used` records which sentence starter, if any, the student used. Tracks scaffolding dependency over time.
- The schema is per-student, per-session, per-passage. A student's full record across sessions is assembled from these individual annotations.

---

## 3. Pipeline Stages

The pipeline runs as a sequence of operator-invoked commands. Each command orchestrates one or more agents and produces one or more artifacts.

```
create_scenario ——→ create_transcript ——→ analyze_transcript ——→ design_scaffolding ——→ configure_session
     ↓                     ↓                      ↓                     ↓                     ↓
scenario.yaml        transcript.yaml         analysis.yaml        scaffolding.yaml       session.yaml
                                             facilitation.yaml ←── (enriched)
```

### Stage 1: `create_scenario`

**Input:** Operator prompt — topic, PBL context, instructional goals, number of personas, targeted facets.

**Process:**
1. The operator specifies the topic, instructional goals, and which facets to target (by ID from the facet inventory). The operator also specifies the desired cognitive patterns and social dynamics.
2. A planning agent drafts the scenario plan: personas with perspectives and weaknesses, the discussion arc, and the turn outline with `accomplishes` fields.
3. A validation agent reviews the plan against pedagogical criteria:
   - Are the targeted facets detectable through the lenses specified?
   - Do the facets have sufficient cross-lens visibility to produce perspectival diversity?
   - Are persona perspectives in genuine tension?
   - Are the `accomplishes` fields written in natural language without framework terminology?
   - Does the turn outline avoid anti-patterns (extended unchecked agreement, concerns raised but never acknowledged)?
4. The operator reviews the validation, revises if needed, and approves the plan.

**Output:** `scenario.yaml`

**Information barrier:** The scenario plan contains `target_facets` with full framework terminology. This section is stripped before the plan is passed to Stage 2. The dialog writer sees personas, discussion arc, and turn outline — character and story, not framework targets.

### Stage 2: `create_transcript`

**Input:** `scenario.yaml` (with `target_facets` stripped)

**Process:**
1. A dialog writer agent receives the scenario plan minus target facets and writes the discussion as natural prose — characters speaking in 6th-grade language, with distinct voices and the narrative arc specified in the plan.
2. A structural review (script or manual) checks: turn count within range, speaker names match plan, turn order follows outline, all turns present.
   - If structural issues are found, the dialog writer is re-invoked (clean retry, no feedback from the failed attempt, max 3 attempts). If the plan consistently produces structural failures, the plan is the problem.
3. An instructional designer agent receives the raw transcript and the full scenario plan (including `target_facets`). The instructional designer sharpens expression: ensures signal moments are visible but natural, enforces 6th-grade language, checks that designed weaknesses are perceptible. The instructional designer does not add or remove content — only refines phrasing and signal clarity.
4. An enumeration step (deterministic script) assigns sequential IDs to turns and sentences.

**Output:** `transcript.yaml`

**Notes:**
- The dialog writer operates behind the information barrier — it sees character traits and narrative goals, not facets or lenses.
- The instructional designer operates *outside* the information barrier — it sees the full plan including targets and uses that knowledge to sharpen signals without making them cartoonish.
- Enumeration is purely mechanical. It runs after all creative work is done.

### Stage 3: `analyze_transcript`

**Input:** `transcript.yaml`, `scenario.yaml` (full, including `target_facets`)

**Process:**
1. The operator (or a script) segments the transcript into evaluable passages — groups of 1-3 consecutive turns that contain a coherent segment of the discussion. Passage boundaries are placed where the discussion shifts topic, introduces a new claim, or changes direction. Each passage gets a sequential ID.
2. An evaluator agent reads the full transcript and scenario plan and produces the expert analysis:
   - **Hidden layer:** For each passage, identifies which facets are present, at what quality level, through which lenses, with what explanatory variables. Flags whether each facet was a design target or an emergent observation.
   - **Evaluate AI perspective:** For each passage, writes per-lens observations — what the AI notices through Logic, Evidence, and Scope. No explanatory vocabulary yet. Includes a `what_to_notice` prompt that bridges toward the Explain phase.
   - **Explain AI perspective:** For each passage, writes the explanatory perspective — introducing cognitive patterns and social dynamics as disciplinary vocabulary, modeling how they interact. Written as perspective, not verdict.
   - **Diversity metadata:** For each passage, assesses which lenses are likely to produce different readings and lists discrete expected student observations per lens.
3. The evaluator also produces the facilitation guide as a separate output — organized by passage and by phase (Evaluate, Explain), with scaffolding for each step (Individual, Peer, AI), teacher-facing facet descriptions, and whole-class debrief materials (key takeaways, cross-group discussion prompts, connection to future sessions).

**Output:** `analysis.yaml`, `facilitation.yaml` (initial version — enriched in Stage 4)

**Notes:**
- The evaluator sees everything — transcript, full scenario plan, facet inventory. It operates entirely outside the information barrier. Its job is to produce both the hidden-layer annotations (for quality assessment and teacher facilitation) and the visible-layer AI perspective (for students).
- The AI perspective must be written as perspective, not verdict. The evaluator prompt must encode this distinction carefully: "write as if you are one more voice in the exchange, offering what you notice, not what is correct."
- The facilitation guide produced here contains the evaluator's analytical scaffolding: what's structurally present, what students are likely to see and miss, basic productive questions for peer discussion. Stage 4 (design_scaffolding) enriches the facilitation guide's `productive_questions` with passage-specific discussion starters written in teacher-friendly language. The facilitation guide is produced in Stage 3, enriched in Stage 4.
- Passage segmentation could be done by the evaluator agent, by the operator, or by a simple heuristic script (e.g., every 2-3 turns). The key constraint is that passage IDs must be consistent across `analysis.yaml`, `facilitation.yaml`, and `session.yaml`.

### Stage 4: `design_scaffolding`

**Input:** `analysis.yaml`, `facilitation.yaml`, `transcript.yaml`, `scenario.yaml` (full)

**Process:**
1. A scaffolding instructional designer agent receives the evaluator's full output (expert analysis and facilitation guide), the transcript, and the scenario plan.
2. For each evaluable passage, the agent produces:
   - **Partial hints** per lens — directional prompts that tell the student *where* to look, not *what* to see. Written in 6th-grade language.
   - **Lens-specific entry prompts** — per-lens, per-passage prompts more directed than the generic articulation prompt.
   - **Difficulty signals** — accessible / moderate / challenging, based on cross-lens visibility (high = accessible, low = challenging).
   - **Common misreadings** per lens — predictable misinterpretations with gentle redirects. The redirect follows the same calibration principle as partial hints: redirect attention without naming the correct observation. Only pattern-matchable misreadings belong here.
   - **Passage-specific sentence starters** — more directed than the generic session-level starters, gesturing toward what's structurally present without naming it.
   - **Bridge prompts** — connecting what the student observed in the Evaluate phase to the perspective-taking task.
   - **AI reflection prompts** — per-lens prompts for after the Evaluate AI reveal, and a passage-level prompt for after the Explain AI reveal. These reference the AI perspective's content and therefore depend on the evaluator's output.
   - **Observation rubric entries** — what a student might say at basic, developing, and differentiated levels for each lens, enabling runtime assessment without LLM access.
3. The agent also enriches the facilitation guide's `productive_questions` fields with passage-specific discussion starter questions for the teacher to use during Peer steps. These are written into `facilitation.yaml`, not `scaffolding.yaml`, because they are teacher-facing, not student-facing.

**Output:** `scaffolding.yaml` (student-facing scaffolding). Also enriches `facilitation.yaml`'s `productive_questions` fields with passage-specific discussion starters (teacher-facing). The facilitation guide is produced in Stage 3 and enriched in Stage 4.

**Notes:**
- The scaffolding instructional designer operates entirely outside the information barrier — it sees everything the evaluator saw, plus the evaluator's output.
- This agent thinks like a teacher, not a cognitive scientist. Its input is the evaluator's analytical language; its output is pedagogical language calibrated for 6th graders.
- The architectural principle: the pipeline has LLM access, the app does not. Everything the app needs to scaffold student engagement at runtime must be produced here.
- The scaffolding materials are validated against three criteria: (1) partial hints must direct to a *region*, not name the *observation* — the calibration principle is "where to look, not what to see"; (2) all text must be in student-friendly language — no framework terminology, no facet names, no analytical abstractions; (3) AI reflection prompts must reference the specific content of the AI perspective they follow, not be generic.

### Stage 5: `configure_session`

**Input:** `transcript.yaml`, `analysis.yaml`, `scaffolding.yaml`

**Process:**
1. A configuration step (script or operator) produces the session configuration:
   - Lists all passages with their turn ranges
   - Marks which passages are evaluable (some opening/closing turns may be context-setting only)
   - Includes lens definitions and phase instructions
   - Includes the evaluation scaffold (strong/weak + articulation prompt) and explanation scaffold
   - Optionally includes cognitive pattern and social dynamic reference lists (teacher-controlled)
   - References the scaffolding materials file

**Output:** `session.yaml`

**Notes:**
- This stage is largely mechanical — it assembles information from the transcript, analysis, and scaffolding into the format the app expects.
- The teacher can adjust the session configuration before running it: hide certain lenses for an early session, choose whether to show the explanatory variable reference lists, select which passages to evaluate if the full set is too many for a single session.

---

## 4. Agents

The pipeline uses six agents. Each has a single role, a defined input, and a defined output schema.

| Agent | Stage | Sees target facets? | Role |
|---|---|---|---|
| **Planning agent** | create_scenario | Yes | Drafts scenario plans: personas, discussion arc, turn outline |
| **Validation agent** | create_scenario | Yes | Reviews scenario plans against pedagogical and structural criteria |
| **Dialog writer** | create_transcript | **No** (information barrier) | Writes natural discussion prose from character and narrative descriptions |
| **Transcript instructional designer** | create_transcript | Yes | Sharpens expression and signal moments without adding or removing content |
| **Evaluator** | analyze_transcript | Yes | Produces expert analysis (hidden + visible layers) and facilitation guide |
| **Scaffolding instructional designer** | design_scaffolding | Yes | Produces pedagogical scaffolding materials for the app from the evaluator's analysis |

**Two instructional designers, different jobs.** The transcript instructional designer (Stage 2) works on the content students *read* — sharpening the discussion's expression so designed weaknesses are perceptible but natural. The scaffolding instructional designer (Stage 4) works on the materials that help students *engage with* that content — hints, prompts, starters, rubric entries. The first thinks like an editor; the second thinks like a teacher.

**Agent count:** Six agents. The planning and validation agents could be combined into one agent with two passes (draft then self-review). The cleaner architecture is two separate agents — one generative, one critical — to avoid the well-documented tendency of LLMs to under-critique their own output. This is a design decision to be validated in the first end-to-end run.

---

## 5. The Information Barrier

The information barrier prevents the dialog writer from producing discussion that feels designed rather than natural. It operates through two mechanisms:

1. **Schema stripping:** The `create_transcript` command strips `target_facets` from the scenario plan before passing it to the dialog writer. The dialog writer sees personas (with `weaknesses` phrased as character traits), the discussion arc, and the turn outline with `accomplishes` fields — character and story, not framework targets.

2. **Language discipline:** The `weaknesses` and `accomplishes` fields in the scenario plan are written in natural language by the planning agent. "Only researched one source, tends to generalize from limited data" — not "will produce weak source diversity and sufficiency." The planning agent prompt must enforce this translation.

The instructional designer and evaluator operate *outside* the barrier — they need to see the full plan to do their jobs (sharpening signals, annotating facets). The barrier exists only for the dialog writer.

---

## 6. Enumeration and Indexing

All cross-referencing in the pipeline flows through sentence IDs. This is the indexing contract:

- **Turns** are numbered sequentially: `turn_01`, `turn_02`, ...
- **Sentences** are numbered sequentially within each turn: `turn_01.s01`, `turn_01.s02`, ...
- **Passages** are numbered sequentially: `passage_01`, `passage_02`, ... Each passage references a range of turn IDs.

Every artifact that references a moment in the discussion uses sentence IDs:

| Artifact | What it references | How |
|---|---|---|
| `analysis.yaml` | Where a facet is observable | `evidence_sentences: ["turn_03.s02", "turn_04.s01"]` |
| `analysis.yaml` | What the AI perspective points to | `key_sentences: ["turn_03.s02"]` |
| `facilitation.yaml` | What's structurally present | References passage IDs which contain turn IDs |
| `scaffolding.yaml` | Which passage a scaffold is for | `passage_id`, `turns` |
| `session.yaml` | Which passages students evaluate | `turns: ["turn_03", "turn_04"]` |
| Student annotations (app) | What the student is responding to | Passage ID + sentence IDs |

Enumeration is a deterministic script that runs once, after all creative generation is complete. It takes a pre-enumeration transcript (natural prose with speaker labels) and produces the enumerated `transcript.yaml`. No agent modifies sentence IDs after enumeration.

---

## 7. How the App Uses Pipeline Artifacts

This section specifies the contract between the pipeline and the app — what the app expects from each artifact and how it uses them. The app runs two phases (Evaluate, Explain), each with three steps (Individual, Peer, AI).

### Evaluate Phase

**Individual step.** The app displays a passage from the transcript and asks the student to:
1. Choose a lens (or the app assigns one)
2. Rate the passage as strong or weak through that lens
3. Articulate why — free text

Artifacts used:
- `transcript.yaml` — renders the passage text
- `session.yaml` → `evaluate_phase` — lens definitions, articulation prompt
- `scaffolding.yaml` → `passage_scaffolding[].evaluate` — difficulty signal (to suggest passage order), lens-specific entry prompt (more directed than the generic prompt), partial hints (if the student is stuck)

What the app stores: The student's lens choice, rating, and articulation, keyed to the passage ID.

**Peer step.** The app shows the student how peers in their group evaluated the same passage — which lens they used, how they rated it, what they wrote.

Artifacts used: None from the pipeline for student display. Peer responses come from the app's own database. The teacher uses `facilitation.yaml` → `passage_guides[].evaluate.peer.productive_questions` for group facilitation (enriched by the scaffolding instructional designer with passage-specific discussion starters).

**AI step.** The app shows the Evaluate AI perspective for the passage.

Artifacts used:
- `analysis.yaml` → `ai_perspective_evaluate` for the relevant passage — per-lens observations and `what_to_notice` prompt
- `scaffolding.yaml` → `passage_scaffolding[].evaluate.ai_reflection_prompts` — per-lens reflection prompts specific to this passage's AI observation

What the app does NOT show: `ai_perspective_explain` (not yet — that comes after the Explain phase's peer discussion), `facet_annotations`, or `diversity_potential`.

### Explain Phase

**Individual step.** The app asks students to explain *why* the characters reasoned the way they did.

Artifacts used:
- `session.yaml` → `explain_phase` — explanation prompt, generic sentence starters, optional reference lists
- `scaffolding.yaml` → `passage_scaffolding[].explain` — passage-specific sentence starters (more directed than the generic), bridge prompt connecting the student's Evaluate observation to the Explain task

What the app stores: The student's explanation, keyed to the passage ID.

**Peer step.** The app shows the student how peers in their group explained the same passage — what cognitive or social forces they identified, how they connected them.

Artifacts used: None from the pipeline for student display. Peer responses come from the app's own database. The teacher uses `facilitation.yaml` → `passage_guides[].explain.peer.productive_questions` for group facilitation (enriched by the scaffolding instructional designer with passage-specific discussion starters).

**AI step.** The app shows the Explain AI perspective — introducing cognitive and social vocabulary as perspective.

Artifacts used:
- `analysis.yaml` → `ai_perspective_explain` for the relevant passage — explanatory note, cognitive and social connections, interaction note
- `scaffolding.yaml` → `passage_scaffolding[].explain.ai_reflection_prompt` — reflection prompt specific to this passage's AI explanation

### Teacher Dashboard

The teacher sees:
- Which passages each student evaluated, through which lens, with what rating
- Student articulations (Evaluate phase) and explanations (Explain phase)
- The facilitation guide for the current session

**Artifacts used:**
- `facilitation.yaml` — the teacher's scaffolding companion, organized by phase and step, with observation predictions inlined
- `session.yaml` — passage and lens metadata
- Student responses from the app database

### Assessment (Background)

The app can compare student responses against pipeline artifacts to track growth over time:
- **Articulation quality** — Does the student's articulation match any of the facets present in the passage? Compared against `facet_annotations` and `observation_rubric`.
- **Perspectival range** — Does the student evaluate through multiple lenses across sessions? Tracked from stored lens choices.
- **Explanatory depth** — Does the student's explanation reference both cognitive and social forces? Does it connect them? Compared against `explanation_rubric` and `ai_perspective_explain`.
- **Scaffolding independence** — Is the student relying less on hints and sentence starters over time? Tracked from `hint_used` and `starter_used` fields in student annotations. A student who consistently needs partial hints or passage-specific starters across sessions isn't developing independent evaluative differentiation.

**Artifacts used:**
- `analysis.yaml` → `facet_annotations` (hidden layer) — the ground truth for what's structurally present
- `analysis.yaml` → `diversity_potential` → `likely_student_observations` — expected observations to match against, structured as discrete observation lists per lens
- `scaffolding.yaml` → `observation_rubric` — per-lens, per-passage examples of what students might say at basic, developing, and differentiated levels (Evaluate phase)
- `scaffolding.yaml` → `explanation_rubric` — per-passage examples of what students might say when explaining at basic, developing, and differentiated levels (Explain phase). Differentiated examples model cognitive-social interaction.
- Student annotations → `hint_used`, `starter_used` — scaffolding dependency tracking

The observation and explanation rubrics are the key enablers for app-side assessment. The app compares the student's free-text responses against rubric entries using approximate matching (keyword overlap, semantic similarity). The three levels (basic, developing, differentiated) let the app track whether a student's articulations and explanations are becoming more specific over time — the definition of evaluative differentiation and explanatory reasoning.

This matching remains approximate — student responses are free text, not structured data. A student who writes something valid that neither the evaluator nor the instructional designer anticipated should be recognized, not penalized. The rubric entries are a matching vocabulary, not a grading rubric.

### Session Lifecycle

Sessions have three states: **draft** (teacher is configuring, not yet visible to students), **active** (students can respond), and **closed** (teacher has ended the session, no new responses accepted). The session lifecycle is app-side state management, not a pipeline artifact — but the app must track it because:
- Student annotations are only accepted while the session is active
- The teacher dashboard shows different information in active (real-time monitoring) vs. closed (review and analysis) states
- A closed session can be reopened by the teacher if needed, but this should be rare

---

## 8. Reference Data

The pipeline depends on three reference files that define the framework's vocabulary. These are authored once and updated as the framework evolves.

| File | Contents | Used by |
|---|---|---|
| `reference/lenses.yaml` | Three lens definitions: ID, name, question, description | Session configuration, evaluator prompt, AI perspective writing |
| `reference/facet_inventory.yaml` | Eleven facets: ID, name, definition, quality range, primary lens, cross-lens visibility, explanatory connections | Scenario planning, evaluation, facilitation guide |
| `reference/explanatory_variables.yaml` | Eight cognitive patterns + four social dynamics: ID, name, description | Scenario planning, evaluation, explanation scaffold |

These reference files are the source of truth for all IDs used across the pipeline. Every artifact that references a facet, lens, cognitive pattern, or social dynamic uses the canonical ID from these files.

---

## 9. Scripts

Four deterministic scripts handle mechanical operations. These are pure Python (PyYAML only), accept file paths as arguments, and validate their own output.

| Script | What it does | When it runs |
|---|---|---|
| `enumerate_transcript.py` | Assigns sequential turn and sentence IDs to a raw transcript | After instructional designer polish, before analysis |
| `validate_schema.py` | Validates any YAML artifact against its schema definition | After every artifact is produced |
| `review_transcript.py` | Structural checks: turn count in range, speaker names match plan, turn order follows outline | After dialog writer output, before instructional designer |
| `segment_passages.py` | Segments an enumerated transcript into passages (groups of 1-3 turns) based on topic shifts, new claims, or direction changes | After enumeration, before evaluation. May be manual or heuristic. |

**Notes:**
- `segment_passages.py` is the most uncertain script. Passage segmentation requires judgment — where does a "segment" of discussion begin and end? A simple heuristic (every 2-3 turns) may suffice for the pilot. If segmentation quality matters, this could be an agent task rather than a script. To be validated in the first end-to-end run.
- `export_for_app.py` (v4) is replaced by the session configuration stage. The app reads `analysis.yaml` directly and renders only the `ai_perspective` block — no separate export step is needed.

---

## 10. Schema Summary

| Schema | Governs | New / Transfer |
|---|---|---|
| Scenario plan | `scenario.yaml` | New |
| Validation output | Planning agent → operator feedback | New |
| Dialog writer input | Scenario plan minus `target_facets` | New (derived from scenario plan schema) |
| Transcript (pre-enumeration) | Raw dialog writer output | Transfer from v4 |
| Transcript (post-enumeration) | `transcript.yaml` | Transfer from v4 |
| Expert analysis | `analysis.yaml` | New |
| Facilitation guide | `facilitation.yaml` | New |
| Scaffolding materials | `scaffolding.yaml` | New |
| Session configuration | `session.yaml` | New |
| Student annotations | App-side storage of student responses (Section 2.7) | New |
| Lens definitions | `reference/lenses.yaml` | New |
| Facet inventory | `reference/facet_inventory.yaml` | New (content exists, schema needed) |
| Explanatory variables | `reference/explanatory_variables.yaml` | New |

Thirteen schemas total. Two transfer from v4 (transcript structure). Eleven are new, reflecting the framework change.

---

## 11. Open Questions

These are design decisions that should be resolved during implementation, not before.

1. **Passage segmentation:** Script, agent, or manual? A heuristic script is fastest to build but may produce awkward boundaries. An agent produces better segmentation but adds an LLM call. Manual segmentation is most accurate but doesn't scale. Validate with the first scenario.

2. **Planning + validation as one agent or two?** Two agents is architecturally cleaner (generator vs. critic). One agent with a self-review pass is simpler. The risk with one agent is under-critique. Validate with the first scenario.

3. **Lens assignment in the Individual phase.** Does the app assign a lens to each student (ensuring coverage across the group), or does the student choose? Assignment guarantees perspectival diversity; choice respects student agency. This is an app design question but affects the session configuration schema. Note the framework implication: the framework claims perspectival diversity is "afforded by the architecture," but that affordance is only realized if students in the same group actually look through different lenses. For groups of 3-4, assignment (one lens per student, rotating across sessions) may be necessary to produce the diversity the peer exchange depends on.

4. **Faded scaffolding within a session.** Should passages have different scaffolding levels (highlighted → hinted → open)? Highlighted passages direct attention; hinted passages give a region cue ("look carefully at what happens in Alex's second response"); open passages leave discovery to the student. This supports progression within a session but adds complexity to both the session configuration and the app. The session config schema can accommodate it with a `scaffold_level` field per passage — but whether it's needed for the pilot is a session design question.

5. **Evaluator scope.** The evaluator currently produces both the expert analysis and the facilitation guide. These are related but serve different audiences (students vs. teachers) and have different quality criteria. If the evaluator prompt becomes too complex, splitting into two agents (one for analysis, one for facilitation) may be necessary.