---
story_id: saving-the-maker-space
episode_number: 2
title: The Petition
premise: >
  A week after the announcement. The petition has been through three
  drafts and is about to be submitted. Mira wants to send it today.
  Dev — who has been quietly persuading the rest of the school to
  sign — is the one who will deliver it, and he wants the framing to
  be punchy. Theo has questions he still hasn't gotten answers to.
  At the meeting, Theo raises one last concern about where the
  evidence in the petition actually comes from; Mira restates the
  consensus; Dev clinches it; the petition ships.
lead_characters: [Mira, Dev, Theo]
primary_lens: evidence
mixed_valence_shape: unresolved_disagreement
previously: >
  After the announcement, the group formed around Mira's plan to write
  a petition. Their first meeting produced an outline and an unanswered
  question Theo never got back to.
targets:
  - facet: relevance
    lens: evidence
    carrier: Dev
    cognitive_pattern: null
    social_dynamic: null
    cognitive_signal: >
      Dev frames the petition around "the maker space is essential to
      learning" and "the kids love it" — both true and both unfalsifiable
      — instead of around any specific consequence the principal would
      have to weigh against the budget number that drove her decision.
      He treats emotional availability as relevance.
    social_signal: null
    interaction_note: >
      Dev's relevance failure is not deceptive; he genuinely thinks
      "kids love it" is the strongest argument because it is the most
      emotionally available one. He has not yet learned the gap between
      persuasive and relevant, and the petition ships on his framing
      because the framing sounds good in the room when he reads it aloud.

  - facet: inferential_validity
    lens: logic
    carrier: Dev
    cognitive_pattern: null
    social_dynamic: null
    cognitive_signal: >
      Dev's argument structure is "the maker space matters because the
      kids love it." This presupposes that mattering and being loved are
      the same thing, and offers no premise for why the principal should
      weigh love above budget. The conclusion does not follow from the
      premises he has supplied; the argument is performing the work of
      an argument without doing the work of one.
    social_signal: null
    interaction_note: >
      Pairs intentionally with the relevance target above — the same
      move seen from two angles. Dev's relevance failure (what he's
      arguing about) and his inferential_validity failure (whether his
      argument follows) are the same shallow-by-default move. Episode 3's
      logic-primary turn picks up exactly here when the principal walks
      Dev's argument through and finds nothing inside it.

  - facet: sufficiency
    lens: evidence
    carrier: Mira
    cognitive_pattern: false_certainty
    social_dynamic: group_pressure
    cognitive_signal: >
      When Theo asks for the third time where Ren's three sources
      actually came from, Mira shuts the question down with "we've been
      over this" rather than producing the sourcing. The petition ships
      citing three studies the group has not actually distinguished from
      each other — the same three sources from episode 1, still
      unaudited, now in print.
    social_signal: >
      Mira closes the meeting with a consensus statement ("so we're
      submitting today") — the same move from episode 1. Theo, who has
      the same unanswered question from episode 1 and one new one, does
      not say no, and his silence is treated as agreement for the second
      time in two episodes.
    interaction_note: >
      This is the deliberate second iteration of Mira's false_certainty
      + group_pressure pattern. Repeating it on purpose — the audience
      should recognize the move as a habit by the end of episode 2,
      which is what makes Theo's break in episode 3 read as a turn
      rather than as a coincidence.

strengths:
  - facet: source_credibility
    carrier: Theo
    note: >
      Unresolved-disagreement shape. Theo voices the source-quality
      question twice in this episode (early, when Mira reads the draft
      aloud, and again right before the consensus statement) and is
      shut down both times — once by Mira directly, once by Dev pivoting
      to "the principal isn't going to read the sources anyway." The
      strength is voiced but not heard. This sets up episode 3's
      strength_prevails turn: when the principal independently makes
      the same point Theo has been making for two episodes, his earlier
      asking is recontextualized for the group as having been right all
      along.

beats:
  - "Cold open: Dev practicing the petition's opening line in the maker space — 'the maker space is essential to learning at our school, and closing it would be —' Theo, on the couch nobody is supposed to sit on, asks 'essential how, though?'"
  - "Dev: 'it says the kids love it.' A beat. 'Which they do.' Mira reads the current draft aloud; it cites Ren's three studies without distinguishing them."
  - "Theo asks where the third source came from. Mira: 'we've been over this.' Theo doesn't push."
  - "Dev: 'look, the principal isn't going to read the sources. She's going to read the first paragraph and the signatures.'"
  - "Mira's premature consensus: 'so we're submitting today.' Theo doesn't say no."
  - "The petition is in the principal's mailbox. Dev claps Theo on the shoulder. Theo doesn't clap back."
---

## Authorial notes

Episode 2 is the petition shipping on a foundation everyone in the room has reason to mistrust, including the people writing it. The pattern from episode 1 has to repeat with enough force that the audience recognizes it as a pattern; the unresolved-disagreement shape means the right move is in the room *and is voiced this time* and still gets overridden. Theo's caution is louder here than in episode 1 — he asks twice instead of almost-asking — and that escalation matters because episode 3 is going to turn on the same question being asked by someone the group has to take seriously.

Dev becomes a real character in this episode for the first time. He has been at the table since episode 1 but episode 1 was about Mira, Theo, and Ren; episode 2 is the first time Dev's two failure modes (relevance, inferential_validity) get instantiated in dialog. The cleanest single beat for both is his "the maker space is essential to learning, and the kids love it" line — that's one sentence containing two distinct failures, and the rest of the episode is the group treating that one sentence as the spine of the petition.

The "Theo doesn't clap back" closing beat is the cliffhanger. It is not a question — nothing is unresolved structurally — but it tells the audience that this petition is being delivered by a group that is no longer fully aligned, and the principal's reply (episode 3) is going to land on a group whose internal disagreement is one beat away from the surface.

Sam is in the room but stays silent. The design doc commits her to silence in episodes 1 through 3, and episode 2 has to make her silence visible enough that the audience notices her not speaking at the moment Mira closes the consensus. The way to do this without making her a lead is to give her one stage direction (she looks up, she does not say anything) and then let the meeting move on. Ren is mentioned by name (the petition cites her three sources) but is not in the meeting — she's outside collecting more signatures. That's deliberate: it puts Theo in the position of having to defend the audit question alone, which is part of why he loses it.

I considered giving Theo a `confirmation_bias` pattern label here (the inverse-bias the design doc commits him to) and decided against it. The inverse-bias is functionally a *strength* in this episode and the season, and labeling it as a weakness would muddy what Theo is doing. The pattern surfaces in his behavior — he is the one who takes the principal seriously in episode 3 *because* she is contradicting the group — but it stays in the prose, not the targets list. story_consistency_reviewer should flag if it feels mislabeled here; if so we revisit.

## Why these targets

**relevance / Dev.** Dev's design-doc identity is that he confuses persuasive with relevant, and the petition is the cleanest place to instantiate that. The "essential to learning" framing is unfalsifiable on purpose: it sounds like an argument and it is not one, because nothing the principal could say in response would test it. This is the relevance failure in its most legible form — the petition is *not addressing* the question the principal is asking — and it has to land in episode 2 so that the principal's reply in episode 3 can engage with it directly.

**inferential_validity / Dev.** Same beat, different angle. The relevance target is about *what* Dev is arguing about; the inferential_validity target is about whether his argument *follows*. "The maker space matters because the kids love it" is both off-topic (relevance) and a non-sequitur (inferential_validity). I am putting both targets on Dev in the same episode because the design doc commits him to both facets and the season cannot afford to delay establishing one of them — episode 3 needs the inferential_validity weakness in place so that the principal's logic-lens response has something specific to land on.

**sufficiency / Mira / false_certainty / group_pressure.** Second iteration of the same pattern from episode 1. The repeat is the point: the audience needs to recognize the pattern as a pattern, not as a one-time mistake. The new element in episode 2 is that Theo *voices* the audit question this time (he asked once in episode 1 and was waved off; he asks twice in episode 2 and is shut down twice), so the same chain of moves now has visible friction. The friction is what makes episode 3's turn possible.

**source_credibility (strength) / Theo.** The unresolved-disagreement shape requires that Theo's strength surface and *not land*. The way to make it not land without making Theo look weak is to have him voice the question twice — neither attempt is half-hearted — and have both attempts get shut down by different people for different reasons (Mira: "we've been over this"; Dev: "the principal isn't going to read the sources anyway"). The strength is doing real work; the room is not letting it through. Episode 3 inverts this: when the principal independently produces the audit, the room has to face that the work has been there all along.
