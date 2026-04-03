"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface SessionSummary {
  sessionId: string;
  topic: string;
  createdAt: string;
  lensId: string | null;
  passagesEvaluated: number;
  passagesExplained: number;
  avgWordCount: number;
  hintCount: number;
  peerAdditions: number;
  consensusCompleted: boolean;
}

interface GrowthData {
  studentId: string;
  lensesUsed: string[];
  sessions: SessionSummary[];
  growthNote: { content: string; updatedAt: string } | null;
}

const LENS_LABELS: Record<string, string> = {
  logic: "Logic",
  evidence: "Evidence",
  scope: "Scope",
};

const ALL_LENSES = ["logic", "evidence", "scope"];

export function StudentDashboardClient({
  studentId,
  studentName,
}: {
  studentId: string;
  studentName: string;
}) {
  const [data, setData] = useState<GrowthData | null>(null);

  useEffect(() => {
    fetch(`/api/students/${studentId}/growth`)
      .then((r) => r.json())
      .then(setData);
  }, [studentId]);

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const { sessions, lensesUsed, growthNote } = data;

  // Compute gamified indicators
  const totalPassagesBeyond = sessions.reduce(
    (sum, s) => sum + Math.max(0, s.passagesEvaluated - 1),
    0
  ); // approximate — threshold not available here
  const sessionsWithPeerAdditions = sessions.filter(
    (s) => s.peerAdditions > 0
  ).length;
  const sessionsWithConsensus = sessions.filter(
    (s) => s.consensusCompleted
  ).length;

  return (
    <div className="mx-auto max-w-md min-h-screen p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold">Hi, {studentName.split(" ")[0]}!</h1>
        <p className="text-sm text-muted-foreground">Your learning journey</p>
      </div>

      {/* Growth indicators */}
      <div className="grid grid-cols-2 gap-3">
        {/* Lens collection */}
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="flex justify-center gap-2 mb-2">
              {ALL_LENSES.map((lens) => (
                <div
                  key={lens}
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-lg ${
                    lensesUsed.includes(lens)
                      ? "bg-primary text-primary-foreground"
                      : "border-2 border-dashed border-muted-foreground/30 text-muted-foreground/30"
                  }`}
                >
                  {lens === "logic" ? "L" : lens === "evidence" ? "E" : "S"}
                </div>
              ))}
            </div>
            <p className="text-xs font-medium">Lens Collection</p>
            <p className="text-xs text-muted-foreground">
              {lensesUsed.length} of 3 explored
            </p>
            {lensesUsed.length === 3 && (
              <Badge className="mt-1 text-xs">All explored!</Badge>
            )}
          </CardContent>
        </Card>

        {/* Curiosity trail */}
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="flex justify-center gap-0.5 mb-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className={`h-8 w-3 rounded-full ${
                    i < Math.min(totalPassagesBeyond, 5)
                      ? "bg-green-500"
                      : "bg-muted"
                  }`}
                />
              ))}
            </div>
            <p className="text-xs font-medium">Curiosity Trail</p>
            <p className="text-xs text-muted-foreground">
              {totalPassagesBeyond > 0
                ? `${totalPassagesBeyond} extra passages explored`
                : "Explore beyond the minimum!"}
            </p>
          </CardContent>
        </Card>

        {/* Voice marker */}
        <Card>
          <CardContent className="pt-4 text-center">
            <div
              className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full text-2xl ${
                sessionsWithPeerAdditions > 0
                  ? "bg-purple-100 dark:bg-purple-900"
                  : "bg-muted"
              }`}
            >
              {sessionsWithPeerAdditions > 0 ? "💬" : "○"}
            </div>
            <p className="text-xs font-medium mt-2">Voice</p>
            <p className="text-xs text-muted-foreground">
              {sessionsWithPeerAdditions > 0
                ? `Added ideas in ${sessionsWithPeerAdditions} session${sessionsWithPeerAdditions !== 1 ? "s" : ""}`
                : "Share your thinking after seeing peers"}
            </p>
          </CardContent>
        </Card>

        {/* Team marker */}
        <Card>
          <CardContent className="pt-4 text-center">
            <div
              className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full text-2xl ${
                sessionsWithConsensus > 0
                  ? "bg-blue-100 dark:bg-blue-900"
                  : "bg-muted"
              }`}
            >
              {sessionsWithConsensus > 0 ? "🤝" : "○"}
            </div>
            <p className="text-xs font-medium mt-2">Team</p>
            <p className="text-xs text-muted-foreground">
              {sessionsWithConsensus > 0
                ? `Group consensus in ${sessionsWithConsensus} session${sessionsWithConsensus !== 1 ? "s" : ""}`
                : "Complete a group consensus"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Teacher's note */}
      {growthNote && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">
              A note from your teacher
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{growthNote.content}</p>
          </CardContent>
        </Card>
      )}

      {/* Journey map */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Your Journey</CardTitle>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No sessions yet. Your journey starts soon!
            </p>
          ) : (
            <div className="space-y-3">
              {sessions.map((s, i) => (
                <div key={s.sessionId} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                        s.lensId
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      {s.lensId
                        ? s.lensId.charAt(0).toUpperCase()
                        : i + 1}
                    </div>
                    {i < sessions.length - 1 && (
                      <div className="h-6 w-0.5 bg-border" />
                    )}
                  </div>
                  <div className="flex-1 pb-2">
                    <p className="text-sm font-medium">{s.topic}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {s.lensId && (
                        <Badge variant="outline" className="text-xs">
                          {LENS_LABELS[s.lensId]}
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {s.passagesEvaluated} passages
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
