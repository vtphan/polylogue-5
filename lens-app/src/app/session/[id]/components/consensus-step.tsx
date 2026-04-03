"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  Passage,
  Turn,
  EvalResponse,
  ExplResponse,
  ConsensusEntry,
  GroupInfo,
  SessionConfig,
  PassageScaffolding,
} from "../types";

interface Props {
  sessionId: string;
  studentId: string;
  passages: Passage[];
  turns: Turn[];
  lensId: string;
  evaluateResponses: EvalResponse[];
  explainResponses: ExplResponse[];
  consensus: ConsensusEntry[];
  group: GroupInfo;
  session: SessionConfig;
  scaffolding: PassageScaffolding[];
  phase: "evaluate" | "explain";
  analysis: {
    passages?: {
      passage_id: string;
      ai_perspective_evaluate?: unknown;
      ai_perspective_explain?: unknown;
    }[];
    [key: string]: unknown;
  };
  onRefresh: () => Promise<void>;
  onFinished: () => void;
}

export function ConsensusStep({
  sessionId,
  studentId,
  passages,
  phase,
  consensus,
  group,
  analysis,
  onRefresh,
  onFinished,
}: Props) {
  const [peerData, setPeerData] = useState<{
    members: { id: string; fullName: string }[];
    responses: (EvalResponse | ExplResponse)[];
  } | null>(null);
  const [positions, setPositions] = useState<
    Record<string, "agree" | "disagree">
  >({});
  const [rationales, setRationales] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [allReady, setAllReady] = useState(false);

  // Poll for peer readiness (check if all members finished AI step OR teacher override)
  const checkReadiness = useCallback(async () => {
    // Check for teacher gate override
    const overrideRes = await fetch(`/api/sessions/${sessionId}/advance`);
    if (overrideRes.ok) {
      const { overrides } = await overrideRes.json();
      const gateKey = `${phase}_consensus`;
      if (overrides[gateKey]) {
        setAllReady(true);
        // Still fetch peer data for display
        const peerRes = await fetch(
          `/api/sessions/${sessionId}/responses/peers?phase=${phase}`
        );
        if (peerRes.ok) setPeerData(await peerRes.json());
        return;
      }
    }

    const res = await fetch(
      `/api/sessions/${sessionId}/responses/peers?phase=${phase}`
    );
    if (!res.ok) return;

    const data = await res.json();
    setPeerData(data);

    // Check if all members have AI-step responses for all passages
    const peerIds = group.members.map((m) => m.id);
    const allFinished = peerIds.every((peerId) => {
      return passages.every((passage) => {
        if (peerId === studentId) return true; // Self is already done
        return data.responses.some(
          (r: EvalResponse | ExplResponse) =>
            r.studentId === peerId &&
            r.passageId === passage.id &&
            r.step === "ai"
        );
      });
    });

    setAllReady(allFinished);
  }, [sessionId, phase, group.members, passages, studentId]);

  useEffect(() => {
    checkReadiness();
    const interval = setInterval(checkReadiness, 3000);
    return () => clearInterval(interval);
  }, [checkReadiness]);

  // Already submitted consensus entries
  const submittedConsensus = new Set(
    consensus.filter((c) => c.phase === phase).map((c) => c.passageId)
  );

  const allConsensusSubmitted = passages.every((p) =>
    submittedConsensus.has(p.id)
  );

  async function handleSubmitConsensus(passageId: string) {
    if (!positions[passageId] || !rationales[passageId]?.trim()) return;
    setSubmitting(true);

    await fetch(`/api/sessions/${sessionId}/consensus`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        passageId,
        phase,
        position: positions[passageId],
        rationale: rationales[passageId].trim(),
      }),
    });

    await onRefresh();
    setSubmitting(false);
  }

  if (!allReady) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6">
        <Card className="w-full max-w-sm">
          <CardContent className="space-y-4 pt-6 text-center">
            <h2 className="font-medium">Waiting for Group</h2>
            <p className="text-sm text-muted-foreground">
              All group members need to finish the AI step before consensus can
              begin.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {group.members.map((m) => {
                const hasAIResponses =
                  m.id === studentId ||
                  (peerData?.responses || []).some(
                    (r) => r.studentId === m.id && r.step === "ai"
                  );
                return (
                  <Badge
                    key={m.id}
                    variant={hasAIResponses ? "default" : "secondary"}
                  >
                    {m.fullName} {hasAIResponses ? "✓" : "..."}
                  </Badge>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="border-b p-4">
        <div className="mx-auto max-w-2xl">
          <h2 className="font-medium">
            {phase === "evaluate" ? "Evaluate" : "Explain"} — Group Consensus
          </h2>
          <p className="text-xs text-muted-foreground">
            {phase === "evaluate"
              ? "Does your group agree or disagree with the expert's observations?"
              : "The expert called this a thinking pattern. Does that match what your group sees, or is something else going on?"}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="mx-auto max-w-2xl space-y-6">
          {passages.map((passage) => {
            const passageAnalysis = analysis?.passages?.find(
              (p) => p.passage_id === passage.id
            );
            const perspective =
              phase === "evaluate"
                ? passageAnalysis?.ai_perspective_evaluate
                : passageAnalysis?.ai_perspective_explain;

            const alreadySubmitted = submittedConsensus.has(passage.id);
            const existingConsensus = consensus.find(
              (c) => c.passageId === passage.id && c.phase === phase
            );

            // Get peer AI reflections
            const peerAIReflections = (peerData?.responses || []).filter(
              (r) => r.passageId === passage.id && r.step === "ai"
            );

            return (
              <Card key={passage.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    Passage {passage.id}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* AI perspective */}
                  <div className="rounded-lg bg-blue-50 p-3 text-sm dark:bg-blue-950">
                    <p className="mb-1 text-xs font-medium text-blue-600 dark:text-blue-400">
                      Expert perspective
                    </p>
                    <p className="text-blue-900 dark:text-blue-100">
                      {perspective
                        ? typeof perspective === "string"
                          ? perspective
                          : JSON.stringify(perspective, null, 2)
                        : "No perspective available."}
                    </p>
                  </div>

                  {/* Peer AI reflections */}
                  {peerAIReflections.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">
                        Group reflections
                      </p>
                      {peerAIReflections.map((r) => {
                        const member = group.members.find(
                          (m) => m.id === r.studentId
                        );
                        return (
                          <div
                            key={r.id}
                            className="rounded bg-accent/30 p-2 text-sm"
                          >
                            <span className="font-medium text-xs">
                              {member?.fullName}:
                            </span>{" "}
                            {r.content}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Consensus form or result */}
                  {alreadySubmitted && existingConsensus ? (
                    <div className="rounded border bg-accent/20 p-3">
                      <Badge
                        variant={
                          existingConsensus.position === "agree"
                            ? "default"
                            : "secondary"
                        }
                      >
                        Group {existingConsensus.position === "agree" ? "agrees" : "disagrees"}
                      </Badge>
                      <p className="mt-1 text-sm">
                        {existingConsensus.rationale}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 border-t pt-2">
                      <div className="flex gap-3">
                        <Button
                          variant={
                            positions[passage.id] === "agree"
                              ? "default"
                              : "outline"
                          }
                          size="sm"
                          onClick={() =>
                            setPositions((prev) => ({
                              ...prev,
                              [passage.id]: "agree",
                            }))
                          }
                        >
                          Agree
                        </Button>
                        <Button
                          variant={
                            positions[passage.id] === "disagree"
                              ? "default"
                              : "outline"
                          }
                          size="sm"
                          onClick={() =>
                            setPositions((prev) => ({
                              ...prev,
                              [passage.id]: "disagree",
                            }))
                          }
                        >
                          Disagree
                        </Button>
                      </div>
                      <textarea
                        className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        placeholder="Why does your group agree or disagree?"
                        value={rationales[passage.id] || ""}
                        onChange={(e) =>
                          setRationales((prev) => ({
                            ...prev,
                            [passage.id]: e.target.value,
                          }))
                        }
                      />
                      <Button
                        size="sm"
                        onClick={() => handleSubmitConsensus(passage.id)}
                        disabled={
                          !positions[passage.id] ||
                          !rationales[passage.id]?.trim() ||
                          submitting
                        }
                      >
                        Submit Group Consensus
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {allConsensusSubmitted && (
        <div className="border-t p-4 text-center">
          <Button onClick={onFinished}>
            {phase === "evaluate"
              ? "Continue to Explain Phase"
              : "Complete Session"}
          </Button>
        </div>
      )}
    </div>
  );
}
