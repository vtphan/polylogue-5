"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type {
  Passage,
  EvalResponse,
  ExplResponse,
  ConsensusEntry,
} from "../types";
import { LENS_LABELS } from "../types";

export function CompletionScreen({
  lensId,
  evaluateResponses,
  explainResponses,
  consensus,
  passages,
  sessionClosed,
}: {
  lensId: string | null;
  evaluateResponses: EvalResponse[];
  explainResponses: ExplResponse[];
  consensus: ConsensusEntry[];
  passages: Passage[];
  sessionClosed?: boolean;
}) {
  const evaluatedPassages = new Set(
    evaluateResponses
      .filter((r) => r.step === "individual")
      .map((r) => r.passageId)
  );
  const explainedPassages = new Set(
    explainResponses
      .filter((r) => r.step === "individual")
      .map((r) => r.passageId)
  );

  const evalConsensus = consensus.filter((c) => c.phase === "evaluate");
  const explainConsensus = consensus.filter((c) => c.phase === "explain");

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>
            {sessionClosed ? "Session Closed" : "Session Complete!"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Passages evaluated</p>
              <p className="text-xl font-bold">
                {evaluatedPassages.size} / {passages.length}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Passages explained</p>
              <p className="text-xl font-bold">
                {explainedPassages.size} / {passages.length}
              </p>
            </div>
            {lensId && (
              <div>
                <p className="text-muted-foreground">Your lens</p>
                <Badge>{LENS_LABELS[lensId]}</Badge>
              </div>
            )}
            <div>
              <p className="text-muted-foreground">Group consensus</p>
              <p className="text-sm">
                {evalConsensus.length + explainConsensus.length} positions
              </p>
            </div>
          </div>

          {evalConsensus.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">
                Evaluate consensus
              </p>
              <div className="flex flex-wrap gap-1">
                {evalConsensus.map((c) => (
                  <Badge
                    key={c.id}
                    variant={
                      c.position === "agree" ? "default" : "secondary"
                    }
                    className="text-xs"
                  >
                    {c.passageId}: {c.position}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-lg bg-accent/50 p-3 text-sm">
            {evaluatedPassages.size > 0 && lensId && (
              <p>
                You evaluated {evaluatedPassages.size} passage
                {evaluatedPassages.size !== 1 ? "s" : ""} through the{" "}
                {LENS_LABELS[lensId]} lens.
                {lensId !== "logic" &&
                  " Next time, try looking through the Logic lens to see different things."}
                {lensId !== "evidence" &&
                  lensId === "logic" &&
                  " Next time, try looking through the Evidence lens to see different things."}
                {lensId === "evidence" &&
                  " Next time, try looking through the Scope lens to see different things."}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
