"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface SessionSummary {
  sessionId: string;
  topic: string;
  createdAt: string;
  lensId: string | null;
  passagesEvaluated: number;
  peerAdditions: number;
  consensusCompleted: boolean;
  passagesBeyondThreshold: number;
}

interface GrowthData {
  studentId: string;
  lensesUsed: string[];
  sessions: SessionSummary[];
  growthNote: { content: string; updatedAt: string } | null;
}

interface ActiveSession {
  sessionId: string;
  topic: string;
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
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [noActiveSession, setNoActiveSession] = useState(false);

  useEffect(() => {
    // Load growth data
    fetch(`/api/students/${studentId}/growth`)
      .then((r) => r.json())
      .then(setData);

    // Check for active session via /api/auth/me
    // The student would have entered via join code, so check if they have a recent session
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then(() => {
        // We don't have a direct "active session for student" endpoint,
        // so we check the most recent session from growth data
        setNoActiveSession(true);
      });
  }, [studentId]);

  // Derive active session from growth data (most recent session)
  useEffect(() => {
    if (!data) return;
    if (data.sessions.length > 0) {
      const latest = data.sessions[data.sessions.length - 1];
      // If session was very recent (last 24 hours), show as active
      const isRecent =
        Date.now() - new Date(latest.createdAt).getTime() < 24 * 60 * 60 * 1000;
      if (isRecent) {
        setActiveSession({
          sessionId: latest.sessionId,
          topic: latest.topic,
        });
        setNoActiveSession(false);
      }
    }
  }, [data]);

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const { sessions, lensesUsed, growthNote } = data;

  // Compute gamified indicators using actual threshold data
  const totalPassagesBeyond = sessions.reduce(
    (sum, s) => sum + s.passagesBeyondThreshold,
    0
  );
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

      {/* Active session card */}
      {activeSession ? (
        <Link href={`/session/${activeSession.sessionId}`}>
          <Card className="border-2 border-primary cursor-pointer hover:bg-accent/50 transition-colors">
            <CardContent className="pt-4 text-center">
              <p className="text-lg font-bold">Current Session</p>
              <p className="text-sm text-muted-foreground">
                {activeSession.topic}
              </p>
              <Button className="mt-3 w-full">Enter Session</Button>
            </CardContent>
          </Card>
        </Link>
      ) : noActiveSession ? (
        <Card className="border-dashed">
          <CardContent className="pt-4 text-center">
            <p className="text-sm text-muted-foreground">
              No session right now. Check back when your teacher starts one!
            </p>
          </CardContent>
        </Card>
      ) : null}

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

        {/* Curiosity trail — uses actual passagesBeyondThreshold */}
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
              className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full text-xl ${
                sessionsWithPeerAdditions > 0
                  ? "bg-purple-100 dark:bg-purple-900"
                  : "bg-muted"
              }`}
            >
              {sessionsWithPeerAdditions > 0 ? "\u{1F4AC}" : "\u25CB"}
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
              className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full text-xl ${
                sessionsWithConsensus > 0
                  ? "bg-blue-100 dark:bg-blue-900"
                  : "bg-muted"
              }`}
            >
              {sessionsWithConsensus > 0 ? "\u{1F91D}" : "\u25CB"}
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
