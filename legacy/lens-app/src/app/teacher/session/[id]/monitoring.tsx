"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StaleBanner } from "@/components/ui/stale-banner";
import { useConnectivity } from "@/lib/offline/use-connectivity";
import { FacilitationPanel } from "./facilitation-panel";

interface StudentStatus {
  phase: string;
  step: string;
  lastActivity: string | null;
  passagesCompleted: number;
}

interface GroupMember {
  id: string;
  fullName: string;
  lens: string | null;
  status: StudentStatus;
}

interface GroupData {
  id: string;
  label: string;
  gateOverrides: Record<string, boolean>;
  members: GroupMember[];
}

interface EvalResponse {
  id: string;
  studentId: string;
  passageId: string;
  step: string;
  lensId: string;
  rating: string | null;
  content: string;
  createdAt: string;
}

interface ExplResponse {
  id: string;
  studentId: string;
  passageId: string;
  step: string;
  content: string;
  createdAt: string;
}

interface ConsensusEntry {
  id: string;
  sessionGroupId: string;
  passageId: string;
  phase: string;
  position: string;
  rationale: string;
}

interface MonitorData {
  session: {
    id: string;
    status: string;
    joinCode: string;
    classId: string;
    className: string;
    scenarioTopic: string;
    selectedPassages: string[] | null;
  };
  artifacts: Record<string, unknown>;
  groups: GroupData[];
  evaluateResponses: EvalResponse[];
  explainResponses: ExplResponse[];
  consensus: ConsensusEntry[];
}

const STEP_LABELS: Record<string, string> = {
  not_started: "Not started",
  starting: "Starting",
  individual: "Individual",
  peer: "Peer",
  ai: "AI",
  consensus: "Consensus",
};

const IDLE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

export function MonitoringDashboard({
  sessionId,
}: {
  sessionId: string;
}) {
  const [data, setData] = useState<MonitorData | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(false);
  const [now, setNow] = useState<number>(0);
  const [isCompact, setIsCompact] = useState(false);
  const connectivity = useConnectivity();

  // Set client-only values after mount to avoid hydration mismatch
  useEffect(() => {
    setNow(Date.now());
    setIsCompact(window.innerWidth < 1024);
  }, []);

  const poll = useCallback(async () => {
    try {
      const res = await fetch(`/api/sessions/${sessionId}/monitor`);
      if (res.ok) {
        setData(await res.json());
        setNow(Date.now());
        connectivity.markSuccess();
      } else {
        connectivity.markFailure();
      }
    } catch {
      connectivity.markFailure();
    }
  }, [sessionId, connectivity]);

  useEffect(() => {
    poll();
    const interval = setInterval(poll, 3000);
    return () => clearInterval(interval);
  }, [poll]);

  async function handleAdvance(groupId: string, gate: string) {
    await fetch(`/api/sessions/${sessionId}/advance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionGroupId: groupId, gate }),
    });
    poll();
  }

  async function handleClose() {
    await fetch(`/api/sessions/${sessionId}/close`, { method: "POST" });
    poll();
  }

  async function handleReopen() {
    await fetch(`/api/sessions/${sessionId}/reopen`, { method: "POST" });
    poll();
  }

  if (!data) {
    return <div className="p-8">Loading...</div>;
  }

  const { session, groups } = data;

  // Find selected student's responses
  const studentResponses = selectedStudent
    ? {
        evaluate: data.evaluateResponses.filter(
          (r) => r.studentId === selectedStudent
        ),
        explain: data.explainResponses.filter(
          (r) => r.studentId === selectedStudent
        ),
      }
    : null;

  const selectedStudentName =
    selectedStudent &&
    groups
      .flatMap((g) => g.members)
      .find((m) => m.id === selectedStudent)?.fullName;

  return (
    <div className="flex h-screen flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-4">
          <Link
            href={`/teacher/class/${session.classId}`}
            className="text-sm text-muted-foreground hover:underline"
          >
            ← Back
          </Link>
          <h1 className="font-medium">{session.scenarioTopic}</h1>
          <Badge variant={session.status === "active" ? "default" : "secondary"}>
            {session.status}
          </Badge>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-lg border-2 border-primary px-4 py-1 font-mono text-xl font-bold">
            {session.joinCode}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowGuide(!showGuide)}
          >
            {showGuide ? "Hide Guide" : "Guide"}
          </Button>
          {session.status === "active" ? (
            <Button variant="outline" size="sm" onClick={handleClose}>
              Close Session
            </Button>
          ) : session.status === "closed" ? (
            <Button variant="outline" size="sm" onClick={handleReopen}>
              Reopen
            </Button>
          ) : null}
        </div>
      </div>

      {/* Stale connectivity banner */}
      {connectivity.isStale && (
        <StaleBanner
          lastUpdated={connectivity.lastUpdated}
          online={connectivity.online}
        />
      )}

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel: groups */}
        <div className="w-80 shrink-0 overflow-y-auto border-r p-4 space-y-4">
          {groups.map((group) => {
            const dominantStep = getDominantStep(group.members);

            return (
              <Card key={group.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between text-sm">
                    {group.label}
                    <Badge variant="outline" className="text-xs">
                      {dominantStep}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  {group.members.map((m) => {
                    const isIdle =
                      now > 0 &&
                      m.status.lastActivity &&
                      now - new Date(m.status.lastActivity).getTime() >
                        IDLE_THRESHOLD_MS;

                    return (
                      <button
                        key={m.id}
                        className={`flex w-full items-center justify-between rounded px-2 py-1 text-left text-sm hover:bg-accent/50 ${
                          selectedStudent === m.id ? "bg-accent" : ""
                        }`}
                        onClick={() => setSelectedStudent(m.id)}
                      >
                        <div className="flex items-center gap-2">
                          <span>{m.fullName}</span>
                          {m.lens && (
                            <span className="text-xs text-muted-foreground">
                              ({m.lens})
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <StatusDot
                            phase={m.status.phase}
                            step={m.status.step}
                          />
                          {isIdle && (
                            <span className="text-xs text-amber-600" title="Idle">
                              !
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}

                  {/* Advance buttons */}
                  <div className="flex gap-1 pt-2">
                    {!group.gateOverrides.evaluate_consensus && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs"
                        onClick={() =>
                          handleAdvance(group.id, "evaluate_consensus")
                        }
                      >
                        Skip Eval Gate
                      </Button>
                    )}
                    {!group.gateOverrides.explain_consensus && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs"
                        onClick={() =>
                          handleAdvance(group.id, "explain_consensus")
                        }
                      >
                        Skip Expl Gate
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Right panel: student detail or guide */}
        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4">
            {selectedStudent && studentResponses ? (
              <div>
                <h2 className="mb-4 text-lg font-medium">
                  {selectedStudentName}&apos;s Responses
                </h2>
                {studentResponses.evaluate.length === 0 &&
                studentResponses.explain.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No responses yet.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {studentResponses.evaluate.length > 0 && (
                      <div>
                        <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                          Evaluate
                        </h3>
                        <div className="space-y-2">
                          {studentResponses.evaluate.map((r) => (
                            <ResponseCard key={r.id} response={r} type="evaluate" />
                          ))}
                        </div>
                      </div>
                    )}
                    {studentResponses.explain.length > 0 && (
                      <div>
                        <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                          Explain
                        </h3>
                        <div className="space-y-2">
                          {studentResponses.explain.map((r) => (
                            <ResponseCard
                              key={r.id}
                              response={r}
                              type="explain"
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                <p>Click a student to see their responses</p>
              </div>
            )}
          </div>

          {/* Facilitation guide panel — compact on smaller screens (tablet) */}
          {showGuide && (
            <div className="w-72 shrink-0 border-l overflow-y-auto lg:w-96">
              <FacilitationPanel
                artifacts={data.artifacts}
                groups={groups}
                consensus={data.consensus}
                selectedPassages={session.selectedPassages}
                autoPhase={getAutoPhase(groups)}
                autoStep={getAutoStep(groups)}
                compact={isCompact}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusDot({ phase, step }: { phase: string; step: string }) {
  let color = "bg-gray-300";
  let label = "Not started";

  if (phase === "evaluate") {
    color =
      step === "consensus"
        ? "bg-green-500"
        : step === "ai"
          ? "bg-blue-500"
          : step === "peer"
            ? "bg-yellow-500"
            : "bg-orange-400";
    label = `Eval: ${STEP_LABELS[step] || step}`;
  } else if (phase === "explain") {
    color =
      step === "consensus"
        ? "bg-emerald-600"
        : step === "ai"
          ? "bg-indigo-500"
          : step === "peer"
            ? "bg-amber-500"
            : "bg-purple-400";
    label = `Expl: ${STEP_LABELS[step] || step}`;
  }

  return (
    <span
      className={`inline-block h-2.5 w-2.5 rounded-full ${color}`}
      title={label}
    />
  );
}

function ResponseCard({
  response,
  type,
}: {
  response: EvalResponse | ExplResponse;
  type: "evaluate" | "explain";
}) {
  return (
    <div className="rounded border p-3 text-sm">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Badge variant="outline" className="text-xs">
          {response.step}
        </Badge>
        <span>{response.passageId}</span>
        {type === "evaluate" && "lensId" in response && (
          <Badge variant="secondary" className="text-xs">
            {(response as EvalResponse).lensId}
          </Badge>
        )}
        {type === "evaluate" &&
          "rating" in response &&
          (response as EvalResponse).rating && (
            <Badge variant="outline" className="text-xs">
              {(response as EvalResponse).rating}
            </Badge>
          )}
        <span>{new Date(response.createdAt).toLocaleTimeString()}</span>
      </div>
      <p className="mt-1">{response.content}</p>
    </div>
  );
}

function getDominantStep(members: GroupMember[]): string {
  const steps = members.map(
    (m) => `${m.status.phase}:${m.status.step}`
  );
  const counts = new Map<string, number>();
  for (const s of steps) {
    counts.set(s, (counts.get(s) || 0) + 1);
  }
  let max = "";
  let maxCount = 0;
  for (const [s, c] of counts) {
    if (c > maxCount) {
      max = s;
      maxCount = c;
    }
  }
  return max.replace(":", " / ") || "not started";
}

// Auto-detect dominant phase across all groups for facilitation guide
function getAutoPhase(groups: GroupData[]): "evaluate" | "explain" {
  const allMembers = groups.flatMap((g) => g.members);
  const phases = allMembers.map((m) => m.status.phase);
  const explainCount = phases.filter((p) => p === "explain").length;
  return explainCount > phases.length / 2 ? "explain" : "evaluate";
}

function getAutoStep(
  groups: GroupData[]
): "individual" | "peer" | "ai" | "consensus" {
  const allMembers = groups.flatMap((g) => g.members);
  const steps = allMembers.map((m) => m.status.step);
  const counts = new Map<string, number>();
  for (const s of steps) {
    counts.set(s, (counts.get(s) || 0) + 1);
  }
  let max = "individual";
  let maxCount = 0;
  for (const [s, c] of counts) {
    if (c > maxCount && ["individual", "peer", "ai", "consensus"].includes(s)) {
      max = s;
      maxCount = c;
    }
  }
  return max as "individual" | "peer" | "ai" | "consensus";
}
