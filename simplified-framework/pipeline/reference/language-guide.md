# Language Guide (P10 Tier 2)

> Reviewer reference for authoring dialog + scaffolding in the simplified
> framework. Complements the shorter prompt-level guidance in the dialog
> writer and lesson-package-builder agent specs. Examples are drawn from
> `the-white-squirrel` / `episode_01 (The Sighting)`.

There are three blocks: a **shared core** that applies to everything
student-facing, **dialog-only** additions, and **scaffolding-only** additions.
Each rule has one worked example from ep 1.

---

## Shared core (dialog + scaffolding)

### 1. Write for an average or slightly-struggling 6th grader.

Aim for plain words, short clauses, concrete nouns. When you are tempted
by a phrase that feels too elevated, read it aloud — if a 6th grader
would not say it, rewrite.

**Worked example — ep 1 `episode.summary`.** An earlier draft opened:
> "In this episode, watch how fast they accept an expert-sounding explanation."

The compound adjective "expert-sounding" is grade-8+ vocabulary. The
revision landed at plain words that carry the same meaning:
> "In this episode, watch how fast they accept a story that sounds official."

Both sentences say the same thing; the second is readable for the student.

### 2. Preserve signal phrases verbatim when you quote them.

A signal phrase is the sentence a student can underline and read aloud
as the flaw itself — "that basically proves it," "it has to be," "so
that's not nothing." These are the teaching handles. Do not soften,
abbreviate, or paraphrase them. If a dialog turn ends on a signal phrase,
quote it word-for-word in the warm-up or level prompt, including the
closer punctuation.

**Worked example — ep 1 `levels[3].prompt`.** The level quotes James
verbatim:
> "Anya's literally a grad student at U of M, this is what she works on, if she says biosignature about our squirrel that's not nothing."

"That's not nothing" is the credentialed-adjacent signal phrase from the
taxonomy's `heightened` cue for `trusting_a_source_too_quickly`. Keeping
it verbatim lets the student catch the phrase. A paraphrase like "she
knows about this" would dissolve the teaching handle.

### 3. Flag unfamiliar words in-dialog; do not narrator-explain them.

When the scene needs a technical word a 6th grader would not know, mark
the unfamiliarity inside the dialog ("bio-what?" / "some word she used
— biosignature?") or restate in plain words adjacent to the use. The
narrator never steps in to define the word for the student. If the
point of the word is that it is doing unearned authority work, let the
word do that work visibly, then let a character ask.

**Worked example — ep 1 turns t07 and t12.** Leela flags "biosignature"
inside the dialog twice:
> t07 — "Wait — biosignature? Bio-what? Y'all know what that word even means?"
> t12 — "Can someone actually tell me what biosignature means?"

The word sits unexplained through the middle of the scene, then Cam
reads the actual definition from his phone in t13. The definition
arrives as a student move (looking it up), not an author move. That is
the shape: technical vocabulary, flagged as unfamiliar, resolved by a
character, never by the narrator.

### 4. Prefer a plain-language description over the technical term.

When a scientific concept has to land in student-facing text, describe
the mechanism in everyday words instead of introducing the jargon. Use
the technical term only when the episode is deliberately teaching the
word itself.

**Worked example — ep 3 reference paragraph (planned).** The final
plain-language answer in the story arc is authored as:

> "Sometimes animals are born with a rare mutation — red eyes and white
> fur are one of those. It's so rare you'd almost never see one. But a
> long time ago, highways cut this patch of forest off from the rest of
> Memphis. A small group of squirrels got stuck here. In a small cut-off
> group, a rare thing shows up more often over time — so we see them here
> and not anywhere else."

No `heterozygous`, no `founder effect`, no `Punnett square`. The
mechanism is described in three plain moves: (a) a rare mutation, (b) a
forest patch cut off by highways, (c) in a small cut-off group, a rare
thing shows up more often over time. Ep 3's lesson package should
follow the same voice.

---

## Dialog-only additions

### 5. Keep each character's voice distinct.

Each character should be identifiable from three lines of dialog alone.
Cam's voice is phone-native and enthusiastic; James opens with "okay
but check this out" and closes with "it has to be"; Leela asks
slowing-down questions. Do not average the voices toward a neutral
narrator voice just to make the scene cleaner.

**Worked example — ep 1 scene 1.** Three consecutive turns:
- t01 (Cam, phone-native observation) — "Y'all. Its eyes were red. Like stoplight red."
- t02 (James, chain shape) — "Okay but check this out — red eyes, and it was just out in the open at like three o'clock, and nothing was chasing it, so something is up with that squirrel. It has to be."
- t03 (Leela, slowing question) — "Give me a second. We all saw the same squirrel, right?"

A reader can identify the speaker from the shape of the line, not
just the name label. Preserve that.

### 6. Preserve reasoning chains and signal-phrase stacks exactly.

When the teachable move in a turn is a stacked chain (`so → so → so`)
or a piled source cue (anonymous account + popularity + corroboration),
keep the stacking in one breath. Do not split the moment across two
turns or reflow it into shorter sentences — the stacking **is** the
flaw, and the student needs to see it land as a single motion.

**Worked example — ep 1 turn t04 (unmistakable source-quickness).** Cam
stacks four cues in one breath:

> "I saw a TikTok about this a few months ago. Some account,
> 'overton_something,' I'm looking for it — okay the video had like a
> million views, and the comments were all people going 'yeah same,
> something's up over here,' 'I saw one too.' That basically proves
> something is happening in this park."

The four cues (no-name account / popularity / comment corroboration /
certainty escalator) land together. If you split this into two turns —
"Cam: there's a TikTok." / "Cam: it had a million views." — the
stacking dissolves and the `unmistakable` amplification slips to
`showcased`. Keep it whole.

---

## Scaffolding-only additions

### 7. Narrator voice, not character voice. Direct and explanatory.

Scaffolding prose (warm-up walk-throughs, worked explanations,
feedback, takeaways) is narrator-to-student, not character-to-character.
No contractions that belong to a character ("y'all," "okay but"), no
dramatic flourishes, no "let's unpack this." Direct, explanatory, and
short.

**Worked example — ep 1 modeled warm-up `worked_explanation`.**

> "Count the cues Cam piles on. 'Some account' — we do not know who
> posted it. 'A million views' — popular is not the same as right. 'The
> comments all agreed' — that is the same crowd, not new evidence.
> 'That basically proves it' — a certainty word doing work the source
> cannot back up."

The walk-through enumerates the cues in Cam's voice (quoted verbatim)
and restates each in the narrator's plain voice. No dramatic framing,
no "let's see what's going on here." The student reads four short
parallel lines and sees the flaw decomposed.

### 8. Respect the word caps.

Soft caps (validator warns past each):

| Field | Cap |
|---|---|
| `episode.summary` | ~60 words |
| `episode.previously` (ep 2+) | ~40 words |
| `warmups.*.best_answer_text` | ~40 words |
| `warmups.*.worked_explanation` | ~60 words |
| `warmups.*.takeaway` | ~20 words |
| `scene.summary` (transcript) | ~30 words |

The caps are soft-but-real. Going one or two words over on a block that
reads well is fine; going 30% over systematically is the pattern to
watch for, and it usually means the block is carrying two ideas that
want to be one.

**Worked example — ep 1 modeled warm-up `takeaway` (cap 20).**

> "Popular and official-looking are not the same as right. Count the
> cues, then ask who."

Fifteen words. One rule, one instruction. The earlier draft tried to
say "when you hear a stack of cues on a video, remember to count them
before you decide," which was 19 words but carried two ideas crammed
into one sentence. Splitting into two short sentences landed cleaner.

### 9. Short sentences. Readability is driven by sentence length as much as by word choice.

The Flesch-Kincaid check in the validator is sensitive to long
sentences — a single 30-word sentence tips the score even if the words
themselves are plain. When a warning fires and the vocabulary is
already simple, check for a run-on sentence and split it.

**Worked example — ep 1 modeled warm-up `best_answer_text` revision.**

An earlier draft was one long sentence:
> "Cam stacks four kinds of cues — a no-name account, a million views, agreeing comments, and 'basically proves' — but none of them tells us who made the video or whether they knew anything about squirrels."

FK scored this at grade 14.7 — not because the words were hard, but
because it was a 34-word run-on. The fix was splitting into three
sentences:

> "Cam piles on four cues — a no-name account, a million views,
> agreeing comments, and 'basically proves.' None of those cues tells
> us who made the video. None of them tells us if that person knew
> anything about squirrels."

Same content, same vocabulary, three short sentences. FK drops below
threshold. When the validator warns and the words already look right,
check sentence length first.

---

## What this guide does not replace

- **Validators.** The Python validators in
  `simplified-framework/pipeline/scripts/` are authoritative. If a guide
  rule drifts from a validator, the validator wins.
- **The flaw taxonomy's `amplification_guidance` blocks.** Those are the
  authoritative cue lists for dialog writing and flaw review. This guide
  covers *register and readability*, not *when a flaw moment lands at
  which amplification*.
- **The linguistic guidance inside each agent spec.** Those are the
  short in-prompt versions that every authoring agent sees. This guide
  is the longer reviewer-facing companion with worked examples.
