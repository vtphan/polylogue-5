"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { BehavioralSignals } from "@/lib/signals/behavioral";

interface EvalResponse {
  id: string;
  studentId: string;
  passageId: string;
  step: string;
  lensId: string;
  rating: string | null;
  content: string;
  createdAt: string;
  student: { id: string; fullName: string };
}

interface ExplResponse {
  id: string;
  studentId: string;
  passageId: string;
  step: string;
  content: string;
  createdAt: string;
  student: { id: string; fullName: string };
}

interface ConsensusEntry {
  id: string;
  sessionGroupId: string;
  passageId: string;
  phase: string;
  position: string;
  rationale: string;
}

interface GroupData {
  id: string;
  label: string;
  members: { id: string; fullName: string; lens: string | null }[];
}

interface ReviewData {
  session: {
    id: string;
    status: string;
    className: string;
    scenarioTopic: string;
    selectedPassages: string[] | null;
  };
  groups: GroupData[];
  evaluateResponses: EvalResponse[];
  explainResponses: ExplResponse[];
  consensus: ConsensusEntry[];
  studentSignals: Record<string, BehavioralSignals>;
}

const LENS_LABELS: Record<string, string> = {
  logic: "Logic",
  evidence: "Evidence",
  scope: "Scope",
};

export function ReviewClient({ sessionId }: { sessionId: string }) {
  const [data, setData] = useState<ReviewData | null>(null);

  useEffect(() => {
    fetch(`/api/sessions/${sessionId}/review`)
      .then((r) => r.json())
      .then(setData);
  }, [sessionId]);

  if (!data) return <div className="p-8">Loading...</div>;

  const passages = data.session.selectedPassages || [];

  return (
    <div className="mx-auto max-w-5xl p-8">
      <Link
        href={`/teacher/session/${sessionId}`}
        className="text-sm text-muted-foreground hover:underline"
      >
        ← Back to session
      </Link>
      <h1 className="mt-2 text-2xl font-bold">Session Review</h1>
      <p className="text-muted-foreground">
        {data.session.scenarioTopic} — {data.session.className}
      </p>

      <Tabs defaultValue="by-passage" className="mt-6">
        <TabsList>
          <TabsTrigger value="by-passage">By Passage</TabsTrigger>
          <TabsTrigger value="by-student">By Student</TabsTrigger>
          <TabsTrigger value="by-group">By Group</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
        </TabsList>

        <TabsContent value="by-passage">
          <div className="space-y-6 pt-4">
            {passages.map((passageId) => {
              const evalResponses = data.evaluateResponses.filter(
                (r) => r.passageId === passageId && r.step === "individual"
              );
              const consensusEntries = data.consensus.filter(
                (c) => c.passageId === passageId
              );

              // Group by lens
              const byLens = new Map<string, EvalResponse[]>();
              for (const r of evalResponses) {
                const existing = byLens.get(r.lensId) || [];
                existing.push(r);
                byLens.set(r.lensId, existing);
              }

              return (
                <Card key={passageId}>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Passage {passageId}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {Array.from(byLens.entries()).map(([lens, responses]) => (
                      <div key={lens}>
                        <Badge className="mb-2">{LENS_LABELS[lens]}</Badge>
                        <div className="space-y-2 pl-4 border-l-2">
                          {responses.map((r) => (
                            <div key={r.id} className="text-sm">
                              <span className="font-medium">
                                {r.student.fullName}
                              </span>
                              {r.rating && (
                                <Badge
                                  variant="outline"
                                  className="ml-2 text-xs"
                                >
                                  {r.rating}
                                </Badge>
                              )}
                              <p className="text-muted-foreground mt-0.5">
                                {r.content}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    {consensusEntries.length > 0 && (
                      <div className="border-t pt-2">
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          Consensus
                        </p>
                        {consensusEntries.map((c) => {
                          const group = data.groups.find(
                            (g) => g.id === c.sessionGroupId
                          );
                          return (
                            <div key={c.id} className="text-sm">
                              <Badge
                                variant={
                                  c.position === "agree"
                                    ? "default"
                                    : "secondary"
                                }
                                className="text-xs"
                              >
                                {group?.label}: {c.position}
                              </Badge>
                              <span className="ml-2 text-muted-foreground">
                                ({c.phase}) {c.rationale}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="by-student">
          <div className="space-y-6 pt-4">
            {data.groups.flatMap((g) =>
              g.members.map((student) => {
                const evalResponses = data.evaluateResponses.filter(
                  (r) => r.studentId === student.id
                );
                const explResponses = data.explainResponses.filter(
                  (r) => r.studentId === student.id
                );

                return (
                  <Card key={student.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        {student.fullName}
                        {student.lens && (
                          <Badge variant="outline">
                            {LENS_LABELS[student.lens]}
                          </Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {[...evalResponses, ...explResponses]
                          .sort(
                            (a, b) =>
                              new Date(a.createdAt).getTime() -
                              new Date(b.createdAt).getTime()
                          )
                          .map((r) => (
                            <div
                              key={r.id}
                              className="flex items-start gap-2 text-sm"
                            >
                              <Badge variant="outline" className="text-xs shrink-0">
                                {"lensId" in r ? "eval" : "expl"}:{r.step}
                              </Badge>
                              <span className="text-xs text-muted-foreground shrink-0">
                                {r.passageId}
                              </span>
                              <span>{r.content}</span>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        <TabsContent value="by-group">
          <div className="space-y-6 pt-4">
            {data.groups.map((group) => {
              const groupConsensus = data.consensus.filter(
                (c) => c.sessionGroupId === group.id
              );

              return (
                <Card key={group.id}>
                  <CardHeader>
                    <CardTitle className="text-base">
                      {group.label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {passages.map((passageId) => {
                      const consensusEntries = groupConsensus.filter(
                        (c) => c.passageId === passageId
                      );
                      if (consensusEntries.length === 0) return null;

                      // Get AI reflections from members
                      const aiReflections = data.evaluateResponses.filter(
                        (r) =>
                          r.passageId === passageId &&
                          r.step === "ai" &&
                          group.members.some((m) => m.id === r.studentId)
                      );

                      return (
                        <div key={passageId} className="border-t pt-2">
                          <p className="text-sm font-medium">
                            Passage {passageId}
                          </p>
                          {aiReflections.map((r) => (
                            <p
                              key={r.id}
                              className="text-xs text-muted-foreground ml-2"
                            >
                              {r.student.fullName}: {r.content}
                            </p>
                          ))}
                          {consensusEntries.map((c) => (
                            <div key={c.id} className="mt-1">
                              <Badge
                                variant={
                                  c.position === "agree"
                                    ? "default"
                                    : "secondary"
                                }
                                className="text-xs"
                              >
                                {c.phase}: {c.position}
                              </Badge>
                              <span className="ml-2 text-sm">
                                {c.rationale}
                              </span>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="engagement">
          <div className="space-y-4 pt-4">
            {data.groups.flatMap((g) =>
              g.members.map((student) => {
                const signals = data.studentSignals[student.id];
                if (!signals) return null;

                return (
                  <Card key={student.id}>
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-base">
                        {student.fullName}
                        {student.lens && (
                          <Badge variant="outline" className="text-xs">
                            {LENS_LABELS[student.lens]}
                          </Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-5">
                        <SignalCard
                          label="Passages beyond threshold"
                          value={signals.engagement.passagesBeyondThreshold}
                        />
                        <SignalCard
                          label="Post-peer additions"
                          value={signals.discussing.postPeerAdditionCount}
                        />
                        <SignalCard
                          label="Avg word count"
                          value={signals.reasoning.avgWordCount}
                        />
                        <SignalCard
                          label="Hint usage"
                          value={signals.engagement.hintUsageCount}
                        />
                        <SignalCard
                          label="Redirect rate"
                          value={`${Math.round(signals.reasoning.redirectTriggerRate * 100)}%`}
                        />
                        <SignalCard
                          label="AI reflection words"
                          value={signals.participation.aiReflectionWordCount}
                        />
                        <SignalCard
                          label="Peer influence"
                          value={`${Math.round(signals.discussing.peerInfluencedRate * 100)}%`}
                        />
                        <SignalCard
                          label="Transcript ref"
                          value={`${Math.round(signals.reasoning.transcriptReferenceRate * 100)}%`}
                        />
                        <SignalCard
                          label="Group divergence"
                          value={`${Math.round(signals.collaborating.individualToGroupDivergence * 100)}%`}
                        />
                      </div>
                      <GrowthNoteForm studentId={student.id} />
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function GrowthNoteForm({ studentId }: { studentId: string }) {
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch(`/api/students/${studentId}/growth`)
      .then((r) => r.json())
      .then((data) => {
        if (data.growthNote?.content) {
          setNote(data.growthNote.content);
        }
        setLoaded(true);
      });
  }, [studentId]);

  async function handleSave() {
    setSaving(true);
    const res = await fetch(`/api/students/${studentId}/growth-note`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: note }),
    });
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  }

  if (!loaded) return null;

  return (
    <div className="mt-4 border-t pt-4 space-y-2">
      <p className="text-xs font-medium text-muted-foreground">
        Growth Note (visible to student)
      </p>
      <textarea
        className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        placeholder="Write a qualitative growth note for this student..."
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          onClick={handleSave}
          disabled={!note.trim() || saving}
        >
          {saving ? "Saving..." : "Save Note"}
        </Button>
        {saved && (
          <span className="text-xs text-green-600">Saved</span>
        )}
      </div>
    </div>
  );
}

function SignalCard({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-bold">{value}</p>
    </div>
  );
}
