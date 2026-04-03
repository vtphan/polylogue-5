"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { submitWithQueue } from "@/lib/offline/queue";
import { StaleBanner } from "@/components/ui/stale-banner";
import { useConnectivity } from "@/lib/offline/use-connectivity";
import type {
  Passage,
  Turn,
  EvalResponse,
  ExplResponse,
  GroupInfo,
  SessionConfig,
  PassageScaffolding,
} from "../types";
import { LENS_LABELS } from "../types";

interface Props {
  sessionId: string;
  studentId: string;
  passages: Passage[];
  turns: Turn[];
  lensId: string;
  evaluateResponses: EvalResponse[];
  explainResponses: ExplResponse[];
  group: GroupInfo;
  session: SessionConfig;
  scaffolding: PassageScaffolding[];
  phase: "evaluate" | "explain";
  onRefresh: () => Promise<void>;
  onMoveToAI: () => void;
  onSyncRefresh?: () => void;
}

export function PeerStep({
  sessionId,
  studentId,
  passages,
  lensId,
  phase,
  group,
  onRefresh,
  onMoveToAI,
  onSyncRefresh,
}: Props) {
  const [peerData, setPeerData] = useState<{
    members: { id: string; fullName: string }[];
    responses: (EvalResponse | ExplResponse)[];
  } | null>(null);
  const [appendContent, setAppendContent] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const connectivity = useConnectivity();

  const pollPeers = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/sessions/${sessionId}/responses/peers?phase=${phase}`
      );
      if (res.ok) {
        setPeerData(await res.json());
        connectivity.markSuccess();
      } else {
        connectivity.markFailure();
      }
    } catch {
      connectivity.markFailure();
    }
  }, [sessionId, phase, connectivity]);

  useEffect(() => {
    pollPeers();
    const interval = setInterval(pollPeers, 3000);
    return () => clearInterval(interval);
  }, [pollPeers]);

  async function handleAppend(passageId: string) {
    const text = appendContent[passageId];
    if (!text?.trim()) return;
    setSubmitting(true);

    const endpoint =
      phase === "evaluate"
        ? `/api/sessions/${sessionId}/responses/evaluate`
        : `/api/sessions/${sessionId}/responses/explain`;

    await submitWithQueue(studentId, endpoint, {
      passageId,
      step: "peer",
      lensId,
      content: text.trim(),
    });
    onSyncRefresh?.();

    setAppendContent((prev) => ({ ...prev, [passageId]: "" }));
    await onRefresh();
    setSubmitting(false);
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="border-b p-4">
        <div className="mx-auto max-w-2xl">
          <h2 className="font-medium">
            {phase === "evaluate" ? "Evaluate" : "Explain"} — Peer Discussion
          </h2>
          <p className="text-xs text-muted-foreground">
            See what your group members noticed. Discuss face-to-face, then add
            to your thinking.
          </p>
        </div>
      </div>

      {/* Stale connectivity banner */}
      {connectivity.isStale && (
        <StaleBanner
          lastUpdated={connectivity.lastUpdated}
          online={connectivity.online}
        />
      )}

      {/* Group members status */}
      <div className="border-b bg-accent/30 px-4 py-2">
        <div className="mx-auto max-w-2xl flex gap-2">
          {group.members.map((m) => {
            const hasResponses = peerData?.responses.some(
              (r) => r.studentId === m.id
            );
            return (
              <Badge
                key={m.id}
                variant={
                  m.id === studentId
                    ? "default"
                    : hasResponses
                      ? "outline"
                      : "secondary"
                }
              >
                {m.fullName}
                {m.id === studentId
                  ? " (you)"
                  : hasResponses
                    ? " ✓"
                    : " ..."}
              </Badge>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="mx-auto max-w-2xl space-y-6">
          {passages.map((passage) => {
            const peerResponses = (peerData?.responses || []).filter(
              (r) => r.passageId === passage.id
            );

            // Group by student
            const byStudent = new Map<string, (EvalResponse | ExplResponse)[]>();
            for (const r of peerResponses) {
              const existing = byStudent.get(r.studentId) || [];
              existing.push(r);
              byStudent.set(r.studentId, existing);
            }

            // H1 fix: lens-aware disagreement highlighting for Evaluate
            // H4 fix: cognitive vs social difference highlighting for Explain
            const highlightInfo =
              phase === "evaluate"
                ? getEvaluateHighlight(peerResponses as EvalResponse[])
                : getExplainHighlight(peerResponses as ExplResponse[]);

            return (
              <Card
                key={passage.id}
                className={highlightInfo ? "border-2 border-dashed border-amber-500" : ""}
                aria-label={highlightInfo ? `Passage ${passage.id} — ${highlightInfo}` : `Passage ${passage.id}`}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    Passage {passage.id}
                    {highlightInfo && (
                      <Badge
                        variant="outline"
                        className="border-amber-500 text-amber-600"
                      >
                        {highlightInfo}
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {peerResponses.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Waiting for peers...
                    </p>
                  ) : (
                    Array.from(byStudent.entries()).map(
                      ([studentIdKey, responses]) => {
                        const student = peerData?.members.find(
                          (m) => m.id === studentIdKey
                        );
                        return (
                          <div
                            key={studentIdKey}
                            className="rounded border bg-accent/20 p-3"
                          >
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span className="font-medium">
                                {student?.fullName || "Peer"}
                              </span>
                              {phase === "evaluate" &&
                                "lensId" in responses[0] && (
                                  <Badge variant="secondary" className="text-xs">
                                    {LENS_LABELS[(responses[0] as EvalResponse).lensId]}
                                  </Badge>
                                )}
                              {phase === "evaluate" &&
                                "rating" in responses[0] &&
                                (responses[0] as EvalResponse).rating && (
                                  <Badge variant="outline" className="text-xs">
                                    {(responses[0] as EvalResponse).rating}
                                  </Badge>
                                )}
                            </div>
                            {responses.map((r) => (
                              <p key={r.id} className="mt-1 text-sm">
                                {r.content}
                              </p>
                            ))}
                          </div>
                        );
                      }
                    )
                  )}

                  {/* Append box */}
                  <div className="flex gap-2">
                    <textarea
                      className="flex min-h-[40px] flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                      placeholder="Add to your thinking after discussion..."
                      value={appendContent[passage.id] || ""}
                      onChange={(e) =>
                        setAppendContent((prev) => ({
                          ...prev,
                          [passage.id]: e.target.value,
                        }))
                      }
                    />
                    <Button
                      size="sm"
                      onClick={() => handleAppend(passage.id)}
                      disabled={
                        !appendContent[passage.id]?.trim() || submitting
                      }
                    >
                      Add
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <div className="border-t p-4 text-center">
        {(() => {
          const peersWithResponses = (peerData?.responses || []).filter(
            (r) => r.studentId !== studentId
          );
          const hasPeerResponses = peersWithResponses.length > 0;
          return (
            <>
              {!hasPeerResponses && (
                <p className="mb-2 text-sm text-muted-foreground">
                  Waiting for at least one peer to share their responses...
                </p>
              )}
              <Button onClick={onMoveToAI} disabled={!hasPeerResponses}>
                Move to AI Step
              </Button>
            </>
          );
        })()}
      </div>
    </div>
  );
}

// H1 fix: Evaluate disagreement — only flag same-lens rating differences
// or same-lens different observations. Cross-lens differences are expected.
function getEvaluateHighlight(responses: EvalResponse[]): string | null {
  // Get individual-step responses (the primary observations)
  const individual = responses.filter((r) => r.step === "individual" && r.rating);

  // Group by lens
  const byLens = new Map<string, EvalResponse[]>();
  for (const r of individual) {
    const existing = byLens.get(r.lensId) || [];
    existing.push(r);
    byLens.set(r.lensId, existing);
  }

  // Check same-lens peers: different ratings = interesting difference
  for (const [, lensResponses] of byLens) {
    if (lensResponses.length < 2) continue;
    const ratings = new Set(lensResponses.map((r) => r.rating));
    if (ratings.size > 1) {
      return "Interesting differences";
    }
  }

  return null;
}

// H4 fix: Explain highlighting — flag where one peer mentions cognitive patterns
// and another mentions social dynamics
const COGNITIVE_KEYWORDS = [
  "confirmation bias", "tunnel vision", "overgeneralization", "false cause",
  "uncritical acceptance", "black and white", "egocentric", "false certainty",
  "focused on", "only looking", "assumed", "jumped to",
];
const SOCIAL_KEYWORDS = [
  "conformity", "conflict avoidance", "authority deference", "groupthink",
  "went along", "didn't disagree", "followed", "pressure", "group",
];

function getExplainHighlight(responses: ExplResponse[]): string | null {
  const individual = responses.filter((r) => r.step === "individual");
  if (individual.length < 2) return null;

  let hasCognitive = false;
  let hasSocial = false;

  for (const r of individual) {
    const lower = r.content.toLowerCase();
    if (COGNITIVE_KEYWORDS.some((k) => lower.includes(k))) hasCognitive = true;
    if (SOCIAL_KEYWORDS.some((k) => lower.includes(k))) hasSocial = true;
  }

  if (hasCognitive && hasSocial) {
    return "Different perspectives — cognitive & social";
  }
  return null;
}
