// Behavioral signal computation — all computed at query time from response data.
// No LLM, no pre-computed scores. Objective proxies only.

interface EvalResponse {
  id: string;
  studentId: string;
  passageId: string;
  step: string | { toString(): string };
  lensId: string | { toString(): string };
  rating: string | { toString(): string } | null;
  content: string;
  hintUsed: boolean | null;
  redirectTriggered: boolean | null;
  createdAt: string | Date;
}

interface ExplResponse {
  id: string;
  studentId: string;
  passageId: string;
  step: string | { toString(): string };
  content: string;
  hintUsed: boolean | null;
  createdAt: string | Date;
}

interface ConsensusEntry {
  id: string;
  sessionGroupId: string;
  passageId: string;
  phase: string | { toString(): string };
  position: string | { toString(): string };
  rationale: string;
  submittedBy: string;
}

export interface BehavioralSignals {
  engagement: {
    passagesBeyondThreshold: number;
    totalPassagesEvaluated: number;
    totalPassagesExplained: number;
    hintUsageCount: number;
  };
  participation: {
    individualResponses: number;
    peerAdditions: number;
    aiReflectionWordCount: number;
    consensusSubmitter: boolean;
  };
  reasoning: {
    avgWordCount: number;
    wordCountTrajectory: number[];
    redirectTriggerRate: number;
    transcriptReferenceRate: number;
  };
  discussing: {
    postPeerAdditionRate: number;
    postPeerAdditionCount: number;
    peerInfluencedRate: number;
  };
  collaborating: {
    consensusPassages: number;
    avgRationaleWordCount: number;
    positions: { passageId: string; position: string }[];
    individualToGroupDivergence: number;
  };
}

function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

// Simple keyword overlap: proportion of words in text that appear in reference
function keywordOverlap(text: string, reference: string): number {
  const textWords = new Set(
    text.toLowerCase().replace(/[^\w\s]/g, "").split(/\s+/).filter((w) => w.length > 3)
  );
  const refWords = new Set(
    reference.toLowerCase().replace(/[^\w\s]/g, "").split(/\s+/).filter((w) => w.length > 3)
  );
  if (textWords.size === 0) return 0;
  let overlap = 0;
  for (const w of textWords) {
    if (refWords.has(w)) overlap++;
  }
  return overlap / textWords.size;
}

export function computeSignals(
  studentId: string,
  evaluateResponses: EvalResponse[],
  explainResponses: ExplResponse[],
  consensus: ConsensusEntry[],
  thresholdEvaluate: number | null,
  thresholdExplain: number | null,
  sessionGroupId: string,
  passageTexts?: Record<string, string> // passage_id -> passage text for transcript reference
): BehavioralSignals {
  const myEval = evaluateResponses.filter((r) => r.studentId === studentId);
  const myExpl = explainResponses.filter((r) => r.studentId === studentId);

  // Engagement
  const evalPassages = new Set(
    myEval.filter((r) => String(r.step) === "individual").map((r) => r.passageId)
  );
  const explPassages = new Set(
    myExpl.filter((r) => String(r.step) === "individual").map((r) => r.passageId)
  );
  const evalThreshold = thresholdEvaluate || evalPassages.size;
  const explThreshold = thresholdExplain || explPassages.size;
  const passagesBeyondThreshold =
    Math.max(0, evalPassages.size - evalThreshold) +
    Math.max(0, explPassages.size - explThreshold);

  const hintUsageCount =
    myEval.filter((r) => r.hintUsed === true).length +
    myExpl.filter((r) => r.hintUsed === true).length;

  // Participation
  const individualResponses =
    myEval.filter((r) => String(r.step) === "individual").length +
    myExpl.filter((r) => String(r.step) === "individual").length;
  const peerAdditions =
    myEval.filter((r) => String(r.step) === "peer").length +
    myExpl.filter((r) => String(r.step) === "peer").length;

  // BUG FIX: AI reflection word count (was counting responses, not words)
  const aiEvalResponses = myEval.filter((r) => String(r.step) === "ai");
  const aiExplResponses = myExpl.filter((r) => String(r.step) === "ai");
  const aiReflectionWordCount =
    aiEvalResponses.reduce((sum, r) => sum + wordCount(r.content), 0) +
    aiExplResponses.reduce((sum, r) => sum + wordCount(r.content), 0);

  const groupConsensus = consensus.filter(
    (c) => c.sessionGroupId === sessionGroupId
  );
  const consensusSubmitter = groupConsensus.some(
    (c) => c.submittedBy === studentId
  );

  // Reasoning — FIXED: include both Evaluate and Explain individual responses
  const allIndividualByTime = [
    ...myEval.filter((r) => String(r.step) === "individual"),
    ...myExpl.filter((r) => String(r.step) === "individual"),
  ].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
  const wordCountTrajectory = allIndividualByTime.map((r) =>
    wordCount(r.content)
  );
  const avgWordCount =
    wordCountTrajectory.length > 0
      ? wordCountTrajectory.reduce((a, b) => a + b, 0) /
        wordCountTrajectory.length
      : 0;

  const redirectTriggered = myEval.filter(
    (r) => r.redirectTriggered === true
  ).length;
  const individualEvalCount = myEval.filter(
    (r) => String(r.step) === "individual"
  ).length;
  const redirectTriggerRate =
    individualEvalCount > 0 ? redirectTriggered / individualEvalCount : 0;

  // Transcript reference: keyword overlap between student responses and passage text
  let transcriptReferenceRate = 0;
  if (passageTexts) {
    const evalIndividual = myEval.filter(
      (r) => String(r.step) === "individual"
    );
    if (evalIndividual.length > 0) {
      const overlaps = evalIndividual.map((r) => {
        const pText = passageTexts[r.passageId] || "";
        return keywordOverlap(r.content, pText);
      });
      transcriptReferenceRate =
        overlaps.reduce((a, b) => a + b, 0) / overlaps.length;
    }
  }

  // Discussing
  const totalPassagesForPeer = evalPassages.size + explPassages.size;
  const postPeerAdditionCount = peerAdditions;
  const postPeerAdditionRate =
    totalPassagesForPeer > 0
      ? postPeerAdditionCount / totalPassagesForPeer
      : 0;

  // Peer-influenced content: keyword overlap between student's peer additions and peers' responses
  const peerStepEval = myEval.filter((r) => String(r.step) === "peer");
  const peerStepExpl = myExpl.filter((r) => String(r.step) === "peer");
  const peerResponses = [
    ...evaluateResponses.filter(
      (r) => r.studentId !== studentId && String(r.step) === "individual"
    ),
    ...explainResponses.filter(
      (r) => r.studentId !== studentId && String(r.step) === "individual"
    ),
  ];
  const allPeerText = peerResponses.map((r) => r.content).join(" ");
  const myPeerAdditions = [...peerStepEval, ...peerStepExpl];
  let peerInfluencedRate = 0;
  if (myPeerAdditions.length > 0 && allPeerText.length > 0) {
    const overlaps = myPeerAdditions.map((r) =>
      keywordOverlap(r.content, allPeerText)
    );
    peerInfluencedRate =
      overlaps.reduce((a, b) => a + b, 0) / overlaps.length;
  }

  // Collaborating
  const consensusPositions = groupConsensus.map((c) => ({
    passageId: c.passageId,
    position: String(c.position),
  }));
  const rationaleWordCounts = groupConsensus.map((c) =>
    wordCount(c.rationale)
  );
  const avgRationaleWordCount =
    rationaleWordCounts.length > 0
      ? rationaleWordCounts.reduce((a, b) => a + b, 0) /
        rationaleWordCounts.length
      : 0;

  // Individual-to-group divergence: how often the student's AI reflection
  // sentiment differs from the group consensus position
  let individualToGroupDivergence = 0;
  if (groupConsensus.length > 0) {
    let divergences = 0;
    for (const gc of groupConsensus) {
      // Find student's AI reflection for this passage/phase
      const aiReflection =
        String(gc.phase) === "evaluate"
          ? myEval.find(
              (r) =>
                r.passageId === gc.passageId && String(r.step) === "ai"
            )
          : myExpl.find(
              (r) =>
                r.passageId === gc.passageId && String(r.step) === "ai"
            );

      if (aiReflection) {
        // Heuristic: if consensus is "disagree" but student's reflection
        // uses agreement language (or vice versa), count as divergence
        const lower = aiReflection.content.toLowerCase();
        const agreeWords = ["agree", "right", "correct", "exactly", "same"];
        const disagreeWords = [
          "disagree",
          "different",
          "wrong",
          "but",
          "however",
          "not sure",
          "miss",
        ];
        const leanAgree = agreeWords.some((w) => lower.includes(w));
        const leanDisagree = disagreeWords.some((w) => lower.includes(w));

        if (
          (String(gc.position) === "agree" && leanDisagree && !leanAgree) ||
          (String(gc.position) === "disagree" && leanAgree && !leanDisagree)
        ) {
          divergences++;
        }
      }
    }
    individualToGroupDivergence = divergences / groupConsensus.length;
  }

  return {
    engagement: {
      passagesBeyondThreshold,
      totalPassagesEvaluated: evalPassages.size,
      totalPassagesExplained: explPassages.size,
      hintUsageCount,
    },
    participation: {
      individualResponses,
      peerAdditions,
      aiReflectionWordCount,
      consensusSubmitter,
    },
    reasoning: {
      avgWordCount: Math.round(avgWordCount),
      wordCountTrajectory,
      redirectTriggerRate: Math.round(redirectTriggerRate * 100) / 100,
      transcriptReferenceRate:
        Math.round(transcriptReferenceRate * 100) / 100,
    },
    discussing: {
      postPeerAdditionRate:
        Math.round(postPeerAdditionRate * 100) / 100,
      postPeerAdditionCount,
      peerInfluencedRate:
        Math.round(peerInfluencedRate * 100) / 100,
    },
    collaborating: {
      consensusPassages: groupConsensus.length,
      avgRationaleWordCount: Math.round(avgRationaleWordCount),
      positions: consensusPositions,
      individualToGroupDivergence:
        Math.round(individualToGroupDivergence * 100) / 100,
    },
  };
}
