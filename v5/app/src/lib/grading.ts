import type { ReaderLevel } from "@/lib/content";

// Three-star grading (v5, 2026-04-22).
//
//   Star 1 · Claim    — Step 1 final pick correct.
//   Star 2 · Polarity — Step 2 pick matches anchor polarity, given the
//                       correct claim has been revealed at Step 1 lock.
//   Star 3 · Reasoning — Step 3 final pick correct AND Star 2 earned.
//                        The reasoning star is conditional because articulating
//                        reasoning for a mis-framed argument is a different
//                        skill; the branch's teaching still happens, but the
//                        star only counts inside the authored frame.

export type LevelStars = {
  claim: boolean;
  polarity: boolean;
  reasoning: boolean;
  total: number;
};

// Canonical Step 2 pick that matches a given anchor polarity.
// weak anchor → "no_unsure" (student doesn't buy it)
// strong anchor → "yes_strong" (student buys it)
export function alignedStep2For(polarity: "weak" | "strong"): "yes_strong" | "no_unsure" {
  return polarity === "weak" ? "no_unsure" : "yes_strong";
}

export function polarityMatched(
  polarity: "weak" | "strong",
  step2Option: string | null | undefined,
): boolean {
  return Boolean(step2Option) && step2Option === alignedStep2For(polarity);
}

export function step3BranchKeyForStep2(step2Option: string): "why_yes" | "why_no" {
  return step2Option === "yes_strong" ? "why_yes" : "why_no";
}

export function computeLevelStars(params: {
  level: ReaderLevel;
  step1FinalOption: string | null | undefined;
  step2Option: string | null | undefined;
  step3FinalOption: string | null | undefined;
}): LevelStars {
  const { level, step1FinalOption, step2Option, step3FinalOption } = params;

  const claim = Boolean(
    step1FinalOption &&
      level.step_1_claim.feedback.correct.option_ids.includes(step1FinalOption),
  );

  const polarity = polarityMatched(level.polarity, step2Option);

  let reasoning = false;
  if (polarity && step2Option && step3FinalOption) {
    const branchKey = step3BranchKeyForStep2(step2Option);
    const branch = level.step_3[branchKey];
    reasoning = branch.feedback.correct.option_ids.includes(step3FinalOption);
  }

  const total = (claim ? 1 : 0) + (polarity ? 1 : 0) + (reasoning ? 1 : 0);

  return { claim, polarity, reasoning, total };
}
