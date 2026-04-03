"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ConsensusEntry {
  sessionGroupId: string;
  passageId: string;
  phase: string;
  position: string;
  rationale: string;
}

interface GroupData {
  id: string;
  label: string;
  members: { id: string; fullName: string }[];
}

interface PassageGuide {
  passage_id?: string;
  evaluate?: {
    individual?: {
      whats_here?: string;
      likely_observations?: Record<string, string>;
      if_students_are_stuck?: string;
    };
    peer?: {
      likely_disagreements?: string;
      productive_questions?: string[];
      watch_for?: string;
    };
    ai?: {
      what_the_ai_will_say?: string;
      likely_student_reactions?: string;
      follow_up?: string;
    };
  };
  explain?: {
    individual?: {
      whats_here?: string;
      likely_observations?: string;
      if_students_are_stuck?: string;
    };
    peer?: {
      likely_disagreements?: string;
      productive_questions?: string[];
      watch_for?: string;
    };
    ai?: {
      what_the_ai_will_say?: string;
      likely_student_reactions?: string;
      follow_up?: string;
    };
  };
}

interface FacilitationArtifact {
  overview?: string;
  passage_guides?: PassageGuide[];
  debrief?: {
    key_takeaways?: string[];
    cross_group_prompts?: string[];
    connection_to_next?: string;
  };
}

type PhaseView = "evaluate" | "explain" | "debrief";
type StepView = "individual" | "peer" | "ai" | "consensus";

export function FacilitationPanel({
  artifacts,
  groups,
  consensus,
  selectedPassages,
  autoPhase,
  autoStep,
  compact = false,
}: {
  artifacts: Record<string, unknown>;
  groups: GroupData[];
  consensus: ConsensusEntry[];
  selectedPassages: string[] | null;
  autoPhase?: "evaluate" | "explain";
  autoStep?: "individual" | "peer" | "ai" | "consensus";
  compact?: boolean;
}) {
  const facilitation = artifacts.facilitation as FacilitationArtifact | undefined;
  const passageGuides = facilitation?.passage_guides || [];
  const debrief = facilitation?.debrief;

  const passages = selectedPassages || passageGuides.map((g) => g.passage_id || "");

  const [selectedPassage, setSelectedPassage] = useState(passages[0] || "");
  const [phaseView, setPhaseView] = useState<PhaseView>(autoPhase || "evaluate");
  const [stepView, setStepView] = useState<StepView>(autoStep || "individual");
  const [manualOverride, setManualOverride] = useState(false);

  // Auto-update phase/step from student progress unless teacher overrode
  useEffect(() => {
    if (!manualOverride && autoPhase) setPhaseView(autoPhase);
  }, [autoPhase, manualOverride]);
  useEffect(() => {
    if (!manualOverride && autoStep) setStepView(autoStep);
  }, [autoStep, manualOverride]);

  if (phaseView === "debrief") {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Debrief</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPhaseView("evaluate")}
          >
            Back to Guide
          </Button>
        </div>

        {debrief?.key_takeaways && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Key Takeaways</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-4 space-y-1 text-sm">
                {debrief.key_takeaways.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {debrief?.cross_group_prompts && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Cross-Group Prompts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {debrief.cross_group_prompts.map((p, i) => (
                <p key={i} className="text-sm">{p}</p>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Live consensus data */}
        {consensus.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">
                Consensus Positions (Live)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {passages.map((passageId) => {
                  const evalConsensus = consensus.filter(
                    (c) => c.passageId === passageId && c.phase === "evaluate"
                  );

                  if (evalConsensus.length === 0) return null;

                  return (
                    <div key={passageId}>
                      <p className="text-xs font-medium text-muted-foreground mb-1">
                        Passage {passageId}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {evalConsensus.map((c) => {
                          const group = groups.find(
                            (g) => g.id === c.sessionGroupId
                          );
                          return (
                            <Badge
                              key={c.sessionGroupId}
                              variant={
                                c.position === "agree"
                                  ? "default"
                                  : "secondary"
                              }
                              className="text-xs"
                            >
                              {group?.label}:{" "}
                              {c.position === "agree" ? "agrees" : "disagrees"}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {debrief?.connection_to_next && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Connection to Next</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{debrief.connection_to_next}</p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Find guide for selected passage
  const guide = passageGuides.find((g) => g.passage_id === selectedPassage);
  const phaseGuide = phaseView === "evaluate" ? guide?.evaluate : guide?.explain;
  const stepContent =
    stepView === "consensus"
      ? phaseGuide?.ai // Consensus shows AI content + peer questions
      : phaseGuide?.[stepView as keyof typeof phaseGuide];

  return (
    <div className="p-4 space-y-4">
      {/* Passage selector */}
      <div className="flex flex-wrap gap-1">
        {passages.map((p) => (
          <Button
            key={p}
            variant={selectedPassage === p ? "default" : "outline"}
            size="sm"
            className="text-xs"
            onClick={() => setSelectedPassage(p)}
          >
            {p}
          </Button>
        ))}
      </div>

      {/* Phase selector */}
      <div className="flex gap-1">
        {(["evaluate", "explain", "debrief"] as PhaseView[]).map((p) => (
          <Button
            key={p}
            variant={phaseView === p ? "default" : "ghost"}
            size="sm"
            className="text-xs capitalize"
            onClick={() => {
              setPhaseView(p);
              setManualOverride(true);
            }}
          >
            {p}
          </Button>
        ))}
        {manualOverride && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground"
            onClick={() => setManualOverride(false)}
          >
            Auto
          </Button>
        )}
      </div>

      {/* Step selector */}
      {(phaseView === "evaluate" || phaseView === "explain") && (
        <div className="flex gap-1">
          {(["individual", "peer", "ai", "consensus"] as StepView[]).map(
            (s) => (
              <Button
                key={s}
                variant={stepView === s ? "default" : "ghost"}
                size="sm"
                className="text-xs capitalize"
                onClick={() => {
                  setStepView(s);
                  setManualOverride(true);
                }}
              >
                {s}
              </Button>
            )
          )}
        </div>
      )}

      {/* Content */}
      {!stepContent ? (
        <p className="text-sm text-muted-foreground">
          No guide content for this passage/step.
        </p>
      ) : (
        <div className="space-y-3">
          {/* Individual step content */}
          {stepView === "individual" && (
            <>
              {/* Compact mode: only show "If Students Are Stuck" */}
              {compact ? (
                (stepContent as { if_students_are_stuck?: string })
                  ?.if_students_are_stuck && (
                  <GuideSection
                    title="If Students Are Stuck"
                    content={
                      (stepContent as { if_students_are_stuck: string })
                        .if_students_are_stuck
                    }
                  />
                )
              ) : (
                <>
                  {(stepContent as { whats_here?: string })?.whats_here && (
                    <GuideSection
                      title="What's Here"
                      content={(stepContent as { whats_here: string }).whats_here}
                    />
                  )}
                  {(stepContent as { likely_observations?: Record<string, string> | string })
                    ?.likely_observations && (
                    <GuideSection
                      title="Likely Observations"
                      content={
                        typeof (stepContent as { likely_observations: unknown }).likely_observations === "object"
                          ? Object.entries(
                              (stepContent as { likely_observations: Record<string, string> }).likely_observations
                            )
                              .map(([lens, obs]) => `${lens}: ${obs}`)
                              .join("\n")
                          : String((stepContent as { likely_observations: unknown }).likely_observations)
                      }
                    />
                  )}
                  {(stepContent as { if_students_are_stuck?: string })
                    ?.if_students_are_stuck && (
                    <GuideSection
                      title="If Students Are Stuck"
                      content={
                        (stepContent as { if_students_are_stuck: string })
                          .if_students_are_stuck
                      }
                    />
                  )}
                </>
              )}
            </>
          )}

          {/* Peer step content */}
          {stepView === "peer" && (
            <>
              {/* Compact mode: only show productive questions */}
              {compact ? (
                (stepContent as { productive_questions?: string[] })
                  ?.productive_questions && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">
                        Productive Questions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="list-disc pl-4 space-y-1 text-sm">
                        {(
                          (stepContent as { productive_questions: string[] })
                            .productive_questions
                        ).map((q, i) => (
                          <li key={i}>{q}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )
              ) : (
                <>
                  {(stepContent as { likely_disagreements?: string })
                    ?.likely_disagreements && (
                    <GuideSection
                      title="Likely Disagreements"
                      content={
                        (stepContent as { likely_disagreements: string })
                          .likely_disagreements
                      }
                    />
                  )}
                  {(stepContent as { productive_questions?: string[] })
                    ?.productive_questions && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">
                          Productive Questions
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="list-disc pl-4 space-y-1 text-sm">
                          {(
                            (stepContent as { productive_questions: string[] })
                              .productive_questions
                          ).map((q, i) => (
                            <li key={i}>{q}</li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                  {(stepContent as { watch_for?: string })?.watch_for && (
                    <GuideSection
                      title="Watch For"
                      content={
                        (stepContent as { watch_for: string }).watch_for
                      }
                    />
                  )}
                </>
              )}
            </>
          )}

          {/* AI step content */}
          {(stepView === "ai" || stepView === "consensus") && (
            <>
              {(stepContent as { what_the_ai_will_say?: string })
                ?.what_the_ai_will_say && (
                <GuideSection
                  title="What the AI Will Say"
                  content={
                    (stepContent as { what_the_ai_will_say: string })
                      .what_the_ai_will_say
                  }
                />
              )}
              {/* Full content only in non-compact mode */}
              {!compact && (
                <>
                  {(stepContent as { likely_student_reactions?: string })
                    ?.likely_student_reactions && (
                    <GuideSection
                      title="Likely Student Reactions"
                      content={
                        (stepContent as { likely_student_reactions: string })
                          .likely_student_reactions
                      }
                    />
                  )}
                  {(stepContent as { follow_up?: string })?.follow_up && (
                    <GuideSection
                      title="Follow Up"
                      content={
                        (stepContent as { follow_up: string }).follow_up
                      }
                    />
                  )}
                </>
              )}
            </>
          )}

          {/* Consensus also shows peer productive questions */}
          {stepView === "consensus" && phaseGuide?.peer?.productive_questions && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">
                  Productive Questions (from Peer step)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc pl-4 space-y-1 text-sm">
                  {phaseGuide.peer.productive_questions.map((q, i) => (
                    <li key={i}>{q}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

function GuideSection({
  title,
  content,
}: {
  title: string;
  content: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm whitespace-pre-wrap">{content}</p>
      </CardContent>
    </Card>
  );
}
