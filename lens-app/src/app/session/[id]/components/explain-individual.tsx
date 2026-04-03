"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { submitWithQueue } from "@/lib/offline/queue";
import type {
  Passage,
  Turn,
  EvalResponse,
  ExplResponse,
  PassageScaffolding,
  SessionConfig,
  GroupInfo,
  ConsensusEntry,
} from "../types";
import { LENS_LABELS } from "../types";

const GENERIC_STARTERS = [
  "I think they reasoned this way because they were focused on...",
  "I think the group...",
  "The group made it easier/harder for this kind of thinking because...",
];

interface Props {
  sessionId: string;
  studentId: string;
  passages: Passage[];
  turns: Turn[];
  lensId: string;
  evaluateResponses: EvalResponse[];
  explainResponses: ExplResponse[];
  consensus: ConsensusEntry[];
  scaffolding: PassageScaffolding[];
  session: SessionConfig;
  group: GroupInfo;
  analysis: unknown;
  onRefresh: () => Promise<void>;
  onReady: () => void;
  onSyncRefresh?: () => void;
}

export function ExplainIndividual({
  sessionId,
  studentId,
  passages,
  turns,
  lensId,
  evaluateResponses,
  explainResponses,
  scaffolding,
  session,
  onRefresh,
  onReady,
  onSyncRefresh,
}: Props) {
  const [activePassage, setActivePassage] = useState<string | null>(null);

  const completedPassages = new Set(
    explainResponses
      .filter((r) => r.step === "individual")
      .map((r) => r.passageId)
  );

  const threshold = session.thresholdExplain || passages.length;
  const meetsThreshold = completedPassages.size >= threshold;

  if (activePassage) {
    const scaff = scaffolding.find((s) => s.passage_id === activePassage);
    const evalResponses = evaluateResponses.filter(
      (r) => r.passageId === activePassage
    );
    const existingExplain = explainResponses.filter(
      (r) => r.passageId === activePassage && r.step === "individual"
    );

    return (
      <ExplainPassageModal
        sessionId={sessionId}
        studentId={studentId}
        passageId={activePassage}
        lensId={lensId}
        scaffolding={scaff}
        evaluateResponses={evalResponses}
        existingResponses={existingExplain}
        showSentenceStarters={session.scaffoldingSentenceStarters}
        showReferenceLists={session.scaffoldingReferenceLists}
        onClose={() => setActivePassage(null)}
        onSubmit={async () => {
          await onRefresh();
        }}
        onSyncRefresh={onSyncRefresh}
      />
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="border-b p-4">
        <div className="mx-auto max-w-2xl">
          <h2 className="font-medium">Explain</h2>
          <p className="text-xs text-muted-foreground">
            Why did they think this way?
          </p>
        </div>
      </div>

      <div className="border-b bg-accent/30 px-4 py-2">
        <div className="mx-auto max-w-2xl flex items-center justify-between text-sm">
          <span>
            {completedPassages.size} of {passages.length} passages explained
          </span>
          {meetsThreshold && (
            <Button size="sm" onClick={onReady}>
              Ready for Peer Discussion
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="mx-auto max-w-2xl space-y-3">
          {turns.map((turn, i) => {
            const passageHere = passages.find((p) => {
              const range = p.turn_range || p.turns;
              const lastTurn = Array.isArray(range)
                ? range[range.length - 1]
                : i;
              return lastTurn === i;
            });

            return (
              <div key={i}>
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-medium">
                    {turn.speaker.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-muted-foreground">
                      {turn.speaker}
                    </p>
                    <p className="text-sm">{turn.text}</p>
                  </div>
                  {passageHere && (
                    <button
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                        completedPassages.has(passageHere.id)
                          ? "bg-primary text-primary-foreground"
                          : "border-2 border-primary text-primary"
                      }`}
                      onClick={() => setActivePassage(passageHere.id)}
                      aria-label={`Passage ${passages.indexOf(passageHere) + 1}${completedPassages.has(passageHere.id) ? " (completed)" : ""}`}
                    >
                      {passages.indexOf(passageHere) + 1}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {meetsThreshold && (
        <div className="border-t bg-accent/30 p-4 text-center">
          <p className="mb-2 text-sm">
            You&apos;ve explained enough passages. You can keep going or move to
            peer discussion.
          </p>
          <Button onClick={onReady}>Ready for Peer Discussion</Button>
        </div>
      )}
    </div>
  );
}

function ExplainPassageModal({
  sessionId,
  studentId,
  passageId,
  lensId,
  scaffolding,
  evaluateResponses,
  existingResponses,
  showSentenceStarters,
  showReferenceLists,
  onClose,
  onSubmit,
  onSyncRefresh,
}: {
  sessionId: string;
  studentId: string;
  passageId: string;
  lensId: string;
  scaffolding?: PassageScaffolding;
  evaluateResponses: EvalResponse[];
  existingResponses: ExplResponse[];
  showSentenceStarters: boolean;
  showReferenceLists: boolean;
  onClose: () => void;
  onSubmit: () => Promise<void>;
  onSyncRefresh?: () => void;
}) {
  const [content, setContent] = useState("");
  const [showMoreHelp, setShowMoreHelp] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const bridgePrompt =
    scaffolding?.explain?.bridge_prompts?.[lensId] ||
    `You noticed something through the ${LENS_LABELS[lensId]} lens. Now think about why — what was going on when this happened?`;

  const passageStarters =
    scaffolding?.explain?.passage_sentence_starters || [];

  async function handleSubmit() {
    if (!content.trim()) return;
    setSubmitting(true);

    await submitWithQueue(studentId, `/api/sessions/${sessionId}/responses/explain`, {
      passageId,
      step: "individual",
      content: content.trim(),
    });
    onSyncRefresh?.();

    setContent("");
    await onSubmit();
    onClose();
    setSubmitting(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background" role="dialog" aria-label={`Explain passage ${passageId}`}>
      <div className="flex items-center justify-between border-b p-4">
        <h2 className="font-medium text-base">Explain — Passage {passageId}</h2>
        <Button variant="ghost" size="sm" className="min-h-[44px] min-w-[44px]" onClick={onClose}>
          Close
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="mx-auto max-w-2xl space-y-4">
          {/* Previous evaluate responses */}
          {evaluateResponses.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">
                  Your Evaluate observations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {evaluateResponses.map((r) => (
                  <div key={r.id} className="flex items-start gap-2 text-sm">
                    {r.rating && (
                      <Badge variant="outline" className="text-xs shrink-0">
                        {r.rating}
                      </Badge>
                    )}
                    <span>{r.content}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Bridge prompt */}
          <div className="rounded-lg bg-accent/50 p-3">
            <p className="text-sm">{bridgePrompt}</p>
          </div>

          {/* Existing explain responses */}
          {existingResponses.map((r) => (
            <div key={r.id} className="rounded border bg-accent/20 p-3">
              <p className="text-xs text-muted-foreground">
                {new Date(r.createdAt).toLocaleTimeString()}
              </p>
              <p className="mt-1 text-sm">{r.content}</p>
            </div>
          ))}

          {/* Sentence starters */}
          {showSentenceStarters && existingResponses.length === 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">
                Sentence starters
              </p>
              {GENERIC_STARTERS.map((starter, i) => (
                <button
                  key={i}
                  className="block w-full rounded border px-3 py-2 text-left text-sm text-muted-foreground hover:bg-accent/50"
                  onClick={() => setContent(starter)}
                >
                  {starter}
                </button>
              ))}
              {!showMoreHelp && passageStarters.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowMoreHelp(true)}
                >
                  I need more help
                </Button>
              )}
              {showMoreHelp &&
                passageStarters.map((starter, i) => (
                  <button
                    key={`p-${i}`}
                    className="block w-full rounded border border-amber-200 bg-amber-50 px-3 py-2 text-left text-sm dark:border-amber-800 dark:bg-amber-950"
                    onClick={() => setContent(starter)}
                  >
                    {starter}
                  </button>
                ))}
            </div>
          )}

          {/* Reference lists */}
          {showReferenceLists && existingResponses.length === 0 && (
            <details className="rounded border p-3">
              <summary className="cursor-pointer text-sm font-medium">
                Reference: Thinking patterns & group dynamics
              </summary>
              <div className="mt-2 grid gap-4 sm:grid-cols-2 text-xs">
                <div>
                  <p className="font-medium mb-1">Cognitive Patterns</p>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>Confirmation bias — looking only for supporting info</li>
                    <li>Tunnel vision — focusing on one aspect</li>
                    <li>Overgeneralization — one case = all cases</li>
                    <li>False cause — assuming correlation = causation</li>
                    <li>Uncritical acceptance — accepting claims without checking</li>
                    <li>Black and white thinking — only two options</li>
                    <li>Egocentric thinking — only my experience matters</li>
                    <li>False certainty — more confident than evidence allows</li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium mb-1">Social Dynamics</p>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>Conformity — going along with the group</li>
                    <li>Conflict avoidance — not voicing disagreement</li>
                    <li>Authority deference — trusting a source because it seems authoritative</li>
                    <li>Groupthink — group consensus without critical evaluation</li>
                  </ul>
                </div>
              </div>
            </details>
          )}

          {/* Input */}
          <textarea
            className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-base"
            placeholder="Why do you think they reasoned this way?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />

          <Button
            onClick={handleSubmit}
            disabled={!content.trim() || submitting}
            className="w-full min-h-[44px] text-base"
          >
            {submitting ? "Submitting..." : "Submit"}
          </Button>
        </div>
      </div>
    </div>
  );
}
