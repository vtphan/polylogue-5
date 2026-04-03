"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

export function AIStep({
  sessionId,
  passages,
  lensId,
  evaluateResponses,
  explainResponses,
  scaffolding,
  phase,
  analysis,
  onRefresh,
  onFinished,
}: Props) {
  const [reflections, setReflections] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);

  // Check which passages already have AI-step responses
  const existingAIResponses =
    phase === "evaluate"
      ? evaluateResponses.filter((r) => r.step === "ai")
      : explainResponses.filter((r) => r.step === "ai");

  const respondedPassages = new Set(
    existingAIResponses.map((r) => r.passageId)
  );
  const allResponded =
    passages.every(
      (p) => respondedPassages.has(p.id) || submitted.has(p.id)
    );

  async function handleSubmitReflection(passageId: string) {
    const text = reflections[passageId];
    if (!text?.trim()) return;
    setSubmitting(true);

    const endpoint =
      phase === "evaluate"
        ? `/api/sessions/${sessionId}/responses/evaluate`
        : `/api/sessions/${sessionId}/responses/explain`;

    await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        passageId,
        step: "ai",
        lensId,
        content: text.trim(),
      }),
    });

    setSubmitted((prev) => new Set(prev).add(passageId));
    await onRefresh();
    setSubmitting(false);
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="border-b p-4">
        <div className="mx-auto max-w-2xl">
          <h2 className="font-medium">
            {phase === "evaluate" ? "Evaluate" : "Explain"} — Expert Perspective
          </h2>
          <p className="text-xs text-muted-foreground">
            {phase === "evaluate"
              ? "Here\u2019s what an expert noticed when looking through each lens \u2014 one more voice in the conversation, not the final answer."
              : "An expert explains why the characters may have reasoned this way, using thinking patterns and group dynamics."}
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

            const scaff = scaffolding.find(
              (s) => s.passage_id === passage.id
            );
            const reflectionPrompt =
              phase === "evaluate"
                ? scaff?.evaluate?.ai_reflection_prompts?.[lensId]
                : scaff?.explain?.ai_reflection_prompt;

            const alreadyResponded =
              respondedPassages.has(passage.id) || submitted.has(passage.id);

            // Extract structured fields from perspective object
            const perspObj = perspective && typeof perspective === "object"
              ? perspective as Record<string, unknown>
              : null;
            const perspText = perspective
              ? typeof perspective === "string"
                ? perspective
                : perspObj?.text || perspObj?.observation || perspObj?.explanatory_note || JSON.stringify(perspective, null, 2)
              : null;
            const whatToNotice = perspObj?.what_to_notice as string | undefined;
            const cognitiveConnection = perspObj?.cognitive_connection as string | undefined;
            const socialConnection = perspObj?.social_connection as string | undefined;
            const interactionNote = perspObj?.interaction_note as string | undefined;

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
                    {perspText ? (
                      <p className="text-blue-900 dark:text-blue-100">
                        {String(perspText)}
                      </p>
                    ) : (
                      <p className="text-blue-600 dark:text-blue-400">
                        No perspective available for this passage.
                      </p>
                    )}
                  </div>

                  {/* H3 fix: what_to_notice prompt (Evaluate) */}
                  {phase === "evaluate" && whatToNotice && (
                    <div className="rounded-lg bg-amber-50 p-3 text-sm dark:bg-amber-950">
                      <p className="text-amber-800 dark:text-amber-200">
                        {whatToNotice}
                      </p>
                    </div>
                  )}

                  {/* C2 fix: structured explanatory content (Explain) */}
                  {phase === "explain" && (cognitiveConnection || socialConnection || interactionNote) && (
                    <div className="space-y-2">
                      {cognitiveConnection && (
                        <div className="rounded border-l-2 border-purple-400 bg-purple-50 p-2 text-sm dark:bg-purple-950">
                          <p className="text-xs font-medium text-purple-600 dark:text-purple-400">Cognitive pattern</p>
                          <p className="text-purple-900 dark:text-purple-100">{cognitiveConnection}</p>
                        </div>
                      )}
                      {socialConnection && (
                        <div className="rounded border-l-2 border-green-400 bg-green-50 p-2 text-sm dark:bg-green-950">
                          <p className="text-xs font-medium text-green-600 dark:text-green-400">Social dynamic</p>
                          <p className="text-green-900 dark:text-green-100">{socialConnection}</p>
                        </div>
                      )}
                      {interactionNote && (
                        <div className="rounded border-l-2 border-orange-400 bg-orange-50 p-2 text-sm dark:bg-orange-950">
                          <p className="text-xs font-medium text-orange-600 dark:text-orange-400">Interaction</p>
                          <p className="text-orange-900 dark:text-orange-100">{interactionNote}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Reflection prompt */}
                  {reflectionPrompt && (
                    <p className="text-sm text-muted-foreground italic">
                      {reflectionPrompt}
                    </p>
                  )}

                  {/* Existing AI response or input */}
                  {alreadyResponded ? (
                    <div className="rounded border bg-accent/20 p-3">
                      <p className="text-xs text-muted-foreground">
                        Your reflection submitted ✓
                      </p>
                      {existingAIResponses
                        .filter((r) => r.passageId === passage.id)
                        .map((r) => (
                          <p key={r.id} className="mt-1 text-sm">
                            {r.content}
                          </p>
                        ))}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <textarea
                        className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        placeholder="What do you think about the expert's perspective?"
                        value={reflections[passage.id] || ""}
                        onChange={(e) =>
                          setReflections((prev) => ({
                            ...prev,
                            [passage.id]: e.target.value,
                          }))
                        }
                      />
                      <Button
                        size="sm"
                        onClick={() => handleSubmitReflection(passage.id)}
                        disabled={
                          !reflections[passage.id]?.trim() || submitting
                        }
                      >
                        Submit Reflection
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {allResponded && (
        <div className="border-t p-4 text-center">
          <Button onClick={onFinished}>Continue to Consensus</Button>
        </div>
      )}
    </div>
  );
}
