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
    aiReflections: number;
    consensusSubmitter: boolean;
  };
  reasoning: {
    avgWordCount: number;
    wordCountTrajectory: number[]; // per-passage word counts in order
    redirectTriggerRate: number; // 0-1
  };
  discussing: {
    postPeerAdditionRate: number; // 0-1
    postPeerAdditionCount: number;
  };
  collaborating: {
    consensusPassages: number;
    avgRationaleWordCount: number;
    positions: { passageId: string; position: string }[];
  };
}

export function computeSignals(
  studentId: string,
  evaluateResponses: EvalResponse[],
  explainResponses: ExplResponse[],
  consensus: ConsensusEntry[],
  thresholdEvaluate: number | null,
  thresholdExplain: number | null,
  sessionGroupId: string
): BehavioralSignals {
  const myEval = evaluateResponses.filter((r) => r.studentId === studentId);
  const myExpl = explainResponses.filter((r) => r.studentId === studentId);

  // Engagement
  const evalPassages = new Set(
    myEval.filter((r) => r.step === "individual").map((r) => r.passageId)
  );
  const explPassages = new Set(
    myExpl.filter((r) => r.step === "individual").map((r) => r.passageId)
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
    myEval.filter((r) => r.step === "individual").length +
    myExpl.filter((r) => r.step === "individual").length;
  const peerAdditions =
    myEval.filter((r) => r.step === "peer").length +
    myExpl.filter((r) => r.step === "peer").length;
  const aiReflections =
    myEval.filter((r) => r.step === "ai").length +
    myExpl.filter((r) => r.step === "ai").length;

  const groupConsensus = consensus.filter(
    (c) => c.sessionGroupId === sessionGroupId
  );
  const consensusSubmitter = groupConsensus.some(
    (c) => c.submittedBy === studentId
  );

  // Reasoning
  const individualEvalByPassage = myEval
    .filter((r) => r.step === "individual")
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const wordCountTrajectory = individualEvalByPassage.map(
    (r) => r.content.split(/\s+/).filter(Boolean).length
  );
  const avgWordCount =
    wordCountTrajectory.length > 0
      ? wordCountTrajectory.reduce((a, b) => a + b, 0) /
        wordCountTrajectory.length
      : 0;

  const redirectTriggered = myEval.filter(
    (r) => r.redirectTriggered === true
  ).length;
  const individualEvalCount = individualEvalByPassage.length;
  const redirectTriggerRate =
    individualEvalCount > 0 ? redirectTriggered / individualEvalCount : 0;

  // Discussing
  const totalPassagesForPeer = evalPassages.size + explPassages.size;
  const postPeerAdditionCount = peerAdditions;
  const postPeerAdditionRate =
    totalPassagesForPeer > 0
      ? postPeerAdditionCount / totalPassagesForPeer
      : 0;

  // Collaborating
  const consensusPositions = groupConsensus.map((c) => ({
    passageId: c.passageId,
    position: String(c.position),
  }));
  const rationaleWordCounts = groupConsensus.map(
    (c) => c.rationale.split(/\s+/).filter(Boolean).length
  );
  const avgRationaleWordCount =
    rationaleWordCounts.length > 0
      ? rationaleWordCounts.reduce((a, b) => a + b, 0) /
        rationaleWordCounts.length
      : 0;

  return {
    engagement: {
      passagesBeyondThreshold: passagesBeyondThreshold,
      totalPassagesEvaluated: evalPassages.size,
      totalPassagesExplained: explPassages.size,
      hintUsageCount,
    },
    participation: {
      individualResponses,
      peerAdditions,
      aiReflections,
      consensusSubmitter,
    },
    reasoning: {
      avgWordCount: Math.round(avgWordCount),
      wordCountTrajectory,
      redirectTriggerRate: Math.round(redirectTriggerRate * 100) / 100,
    },
    discussing: {
      postPeerAdditionRate:
        Math.round(postPeerAdditionRate * 100) / 100,
      postPeerAdditionCount,
    },
    collaborating: {
      consensusPassages: groupConsensus.length,
      avgRationaleWordCount: Math.round(avgRationaleWordCount),
      positions: consensusPositions,
    },
  };
}
