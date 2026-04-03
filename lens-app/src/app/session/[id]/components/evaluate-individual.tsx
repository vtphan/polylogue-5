"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { submitWithQueue } from "@/lib/offline/queue";
import { TABLET } from "@/lib/constants/tablet";
import type {
  Passage,
  Turn,
  EvalResponse,
  PassageScaffolding,
  SessionConfig,
} from "../types";
import { LENS_LABELS, LENS_QUESTIONS } from "../types";

interface Props {
  sessionId: string;
  studentId: string;
  passages: Passage[];
  turns: Turn[];
  lensId: string;
  evaluateResponses: EvalResponse[];
  scaffolding: PassageScaffolding[];
  session: SessionConfig;
  analysis: unknown;
  onRefresh: () => Promise<void>;
  onReady: () => void;
  onSyncRefresh?: () => void;
}

export function EvaluateIndividual({
  sessionId,
  studentId,
  passages,
  turns,
  lensId,
  evaluateResponses,
  scaffolding,
  session,
  onRefresh,
  onReady,
  onSyncRefresh,
}: Props) {
  const [activePassage, setActivePassage] = useState<string | null>(null);

  // Count completed passages (have at least one individual-step response)
  const completedPassages = new Set(
    evaluateResponses
      .filter((r) => r.step === "individual")
      .map((r) => r.passageId)
  );

  const threshold = session.thresholdEvaluate || passages.length;
  const meetsThreshold = completedPassages.size >= threshold;

  if (activePassage) {
    const passage = passages.find((p) => p.id === activePassage)!;
    const scaff = scaffolding.find((s) => s.passage_id === activePassage);
    const existingResponses = evaluateResponses.filter(
      (r) => r.passageId === activePassage && r.step === "individual"
    );

    return (
      <PassageModal
        sessionId={sessionId}
        studentId={studentId}
        passage={passage}
        turns={turns}
        lensId={lensId}
        scaffolding={scaff}
        existingResponses={existingResponses}
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
      {/* Header */}
      <div className="border-b p-4">
        <div className="mx-auto max-w-2xl flex items-center justify-between">
          <div>
            <h2 className="font-medium">Evaluate</h2>
            <p className="text-xs text-muted-foreground">
              What do you see in the reasoning?
            </p>
          </div>
          <Badge variant="outline">
            {LENS_LABELS[lensId]}: {LENS_QUESTIONS[lensId]}
          </Badge>
        </div>
      </div>

      {/* Progress */}
      <div className="border-b bg-accent/30 px-4 py-2">
        <div className="mx-auto max-w-2xl flex items-center justify-between text-sm">
          <span>
            {completedPassages.size} of {passages.length} passages evaluated
          </span>
          {meetsThreshold && (
            <Button size="sm" onClick={onReady}>
              Ready for Peer Discussion
            </Button>
          )}
        </div>
      </div>

      {/* Transcript with passage icons */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="mx-auto max-w-2xl space-y-3">
          {turns.map((turn, i) => {
            // Check if any passage ends at this turn
            const passageHere = passages.find((p) => {
              const turnRange = p.turn_range || p.turns;
              const lastTurn = Array.isArray(turnRange)
                ? turnRange[turnRange.length - 1]
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
            You&apos;ve evaluated enough passages to move to peer discussion.
            You can keep evaluating or move on.
          </p>
          <Button onClick={onReady}>Ready for Peer Discussion</Button>
        </div>
      )}
    </div>
  );
}

function PassageModal({
  sessionId,
  studentId,
  passage,
  turns,
  lensId,
  scaffolding,
  existingResponses,
  onClose,
  onSubmit,
  onSyncRefresh,
}: {
  sessionId: string;
  studentId: string;
  passage: Passage;
  turns: Turn[];
  lensId: string;
  scaffolding?: PassageScaffolding;
  existingResponses: EvalResponse[];
  onClose: () => void;
  onSubmit: () => Promise<void>;
  onSyncRefresh?: () => void;
}) {
  const [rating, setRating] = useState<"strong" | "weak" | null>(null);
  const [content, setContent] = useState("");
  const [showHint, setShowHint] = useState(false);
  const [hintUsed, setHintUsed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [redirectMessage, setRedirectMessage] = useState<string | null>(null);
  const [redirectContent, setRedirectContent] = useState("");

  const passageTurns = getPassageTurns(passage, turns);
  const entryPrompt =
    scaffolding?.evaluate?.lens_entry_prompts?.[lensId] || LENS_QUESTIONS[lensId];
  const hints = scaffolding?.evaluate?.partial_hints?.[lensId] || [];
  const misreadings = scaffolding?.common_misreadings?.[lensId] || [];

  function handleShowHint() {
    setShowHint(true);
    setHintUsed(true);
  }

  async function handleSubmit() {
    if (!rating || !content.trim()) return;
    setSubmitting(true);

    const { synced } = await submitWithQueue(
      studentId,
      `/api/sessions/${sessionId}/responses/evaluate`,
      {
        passageId: passage.id,
        step: "individual",
        lensId,
        rating,
        content: content.trim(),
        hintUsed,
        redirectTriggered: false,
      }
    );
    onSyncRefresh?.();

    // Check for misreading redirect (works even if offline — local queue has the data)
    const redirect = checkMisreading(content, misreadings);
    if (redirect) {
      // Refresh parent state so existingResponses updates before showing redirect
      await onSubmit();
      setRedirectMessage(redirect);
    } else {
      await onSubmit();
      onClose();
    }
    setSubmitting(false);
  }

  async function handleRedirectSubmit() {
    if (!redirectContent.trim()) return;
    setSubmitting(true);

    await submitWithQueue(
      studentId,
      `/api/sessions/${sessionId}/responses/evaluate`,
      {
        passageId: passage.id,
        step: "individual",
        lensId,
        content: redirectContent.trim(),
        redirectTriggered: true,
      }
    );
    onSyncRefresh?.();

    await onSubmit();
    onClose();
    setSubmitting(false);
  }

  return (
    <div className={`${TABLET.fullscreenModal} flex flex-col bg-background`} role="dialog" aria-label={`Passage ${passage.id}`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b p-4">
        <h2 className="font-medium text-base">
          Passage {passage.id}
        </h2>
        <Button variant="ghost" size="sm" className="min-h-[44px] min-w-[44px]" onClick={onClose}>
          Close
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="mx-auto max-w-2xl space-y-4">
          {/* Passage text */}
          <Card>
            <CardContent className="space-y-2 pt-4">
              {passageTurns.map((turn, i) => (
                <div key={i}>
                  <span className="text-sm font-medium text-muted-foreground">
                    {turn.speaker}:
                  </span>{" "}
                  <span className="text-base">{turn.text}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Entry prompt */}
          <div className="rounded-lg bg-accent/50 p-3">
            <p className="text-base font-medium">
              Looking through {LENS_LABELS[lensId]}:
            </p>
            <p className="text-base text-muted-foreground">{entryPrompt}</p>
          </div>

          {/* Previous responses (read-only) */}
          {existingResponses.map((r) => (
            <div key={r.id} className="rounded border bg-accent/20 p-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="outline" className="text-xs">
                  {r.rating}
                </Badge>
                <span>{new Date(r.createdAt).toLocaleTimeString()}</span>
              </div>
              <p className="mt-1 text-sm">{r.content}</p>
            </div>
          ))}

          {/* New response form (only if no redirect active) */}
          {!redirectMessage && existingResponses.length === 0 && (
            <>
              {/* Rating */}
              <div className="flex gap-3">
                <Button
                  variant={rating === "strong" ? "default" : "outline"}
                  onClick={() => setRating("strong")}
                  className="flex-1 min-h-[44px] text-base"
                >
                  Strong
                </Button>
                <Button
                  variant={rating === "weak" ? "default" : "outline"}
                  onClick={() => setRating("weak")}
                  className="flex-1 min-h-[44px] text-base"
                >
                  Weak
                </Button>
              </div>

              {/* Hint */}
              {showHint && hints.length > 0 && (
                <div className="rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
                  {hints[0]}
                </div>
              )}

              {/* Articulation */}
              <textarea
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-base"
                placeholder="What do you notice?"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />

              <div className="flex items-center justify-between">
                {!showHint && hints.length > 0 && (
                  <Button variant="ghost" className="min-h-[44px]" onClick={handleShowHint}>
                    I need a hint
                  </Button>
                )}
                <div className="ml-auto">
                  <Button
                    onClick={handleSubmit}
                    disabled={!rating || !content.trim() || submitting}
                    className="min-h-[44px] px-6"
                  >
                    {submitting ? "Submitting..." : "Submit"}
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* Redirect */}
          {redirectMessage && (
            <div className="space-y-3">
              <div className="rounded border border-blue-200 bg-blue-50 p-3 text-base text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200">
                {redirectMessage}
              </div>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-base"
                placeholder="Add to your thinking..."
                value={redirectContent}
                onChange={(e) => setRedirectContent(e.target.value)}
              />
              <Button
                onClick={handleRedirectSubmit}
                disabled={!redirectContent.trim() || submitting}
              >
                {submitting ? "Submitting..." : "Submit"}
              </Button>
            </div>
          )}

          {/* Already responded — allow append */}
          {existingResponses.length > 0 && !redirectMessage && (
            <AppendBox
              sessionId={sessionId}
              studentId={studentId}
              passageId={passage.id}
              lensId={lensId}
              step="individual"
              phase="evaluate"
              onSubmit={async () => {
                await onSubmit();
              }}
              onSyncRefresh={onSyncRefresh}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function AppendBox({
  sessionId,
  studentId,
  passageId,
  lensId,
  step,
  phase,
  onSubmit,
  onSyncRefresh,
}: {
  sessionId: string;
  studentId: string;
  passageId: string;
  lensId: string;
  step: string;
  phase: string;
  onSubmit: () => Promise<void>;
  onSyncRefresh?: () => void;
}) {
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleAppend() {
    if (!content.trim()) return;
    setSubmitting(true);

    const endpoint =
      phase === "evaluate"
        ? `/api/sessions/${sessionId}/responses/evaluate`
        : `/api/sessions/${sessionId}/responses/explain`;

    await submitWithQueue(studentId, endpoint, {
      passageId,
      step,
      lensId,
      content: content.trim(),
    });
    onSyncRefresh?.();

    setContent("");
    await onSubmit();
    setSubmitting(false);
  }

  return (
    <div className="space-y-2">
      <textarea
        className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        placeholder="Add more to your thinking..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      <Button
        size="sm"
        onClick={handleAppend}
        disabled={!content.trim() || submitting}
      >
        Add
      </Button>
    </div>
  );
}

function getPassageTurns(passage: Passage, turns: Turn[]): Turn[] {
  const range = passage.turn_range || passage.turns;
  if (!range || !Array.isArray(range)) return [];

  if (range.length === 2 && typeof range[0] === "number") {
    // turn_range: [start, end]
    return turns.slice(range[0], range[1] + 1);
  }
  // turns: [0, 1, 2] — specific indices
  return range.map((i) => turns[i]).filter(Boolean);
}

function checkMisreading(
  content: string,
  misreadings: { trigger: string; redirect: string }[]
): string | null {
  const lower = content.toLowerCase();
  for (const m of misreadings) {
    if (lower.includes(m.trigger.toLowerCase())) {
      return m.redirect;
    }
  }
  return null;
}
