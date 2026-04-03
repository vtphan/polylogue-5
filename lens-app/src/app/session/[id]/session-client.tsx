"use client";

import { useEffect, useState, useCallback } from "react";
import type {
  SessionConfig,
  GroupInfo,
  EvalResponse,
  ExplResponse,
  ConsensusEntry,
  SessionStep,
  PassageScaffolding,
  Persona,
  Turn,
  Passage,
} from "./types";
import { OnboardingScreen } from "./components/onboarding";
import { ReadingScreen } from "./components/reading";
import { LensAssignmentScreen } from "./components/lens-assignment";
import { EvaluateIndividual } from "./components/evaluate-individual";
import { PeerStep } from "./components/peer-step";
import { AIStep } from "./components/ai-step";
import { ConsensusStep } from "./components/consensus-step";
import { ExplainIndividual } from "./components/explain-individual";
import { CompletionScreen } from "./components/completion";
import { useSync } from "@/lib/offline/use-sync";
import { SyncIndicator } from "@/components/ui/sync-indicator";
import {
  cacheArtifacts,
  getCachedArtifacts,
  evictCache,
} from "@/lib/offline/artifact-cache";

interface SessionData {
  session: SessionConfig;
  scenario: {
    topic: string;
    artifacts: {
      scenario: { topic: string; context: string; personas?: Persona[] };
      transcript: { turns?: Turn[]; personas?: Persona[] };
      session: { passages?: Passage[] };
      analysis: {
        ai_perspective_evaluate?: Record<string, unknown>;
        ai_perspective_explain?: Record<string, unknown>;
        passages?: { passage_id: string; ai_perspective_evaluate?: unknown; ai_perspective_explain?: unknown }[];
      };
      scaffolding: { passage_scaffolding?: PassageScaffolding[] };
      facilitation: unknown;
    };
  };
  group: GroupInfo;
  lensAssignment: { lensId: string } | null;
  evaluateResponses: EvalResponse[];
  explainResponses: ExplResponse[];
  consensus: ConsensusEntry[];
}

// Infer current step from server state (supports browser refresh)
function inferStep(d: SessionData): SessionStep {
  const hasLens = !!d.lensAssignment;
  const evalIndividual = d.evaluateResponses.filter((r) => r.step === "individual");
  const evalPeer = d.evaluateResponses.filter((r) => r.step === "peer");
  const evalAI = d.evaluateResponses.filter((r) => r.step === "ai");
  const evalConsensus = d.consensus.filter((c) => c.phase === "evaluate");
  const explIndividual = d.explainResponses.filter((r) => r.step === "individual");
  const explPeer = d.explainResponses.filter((r) => r.step === "peer");
  const explAI = d.explainResponses.filter((r) => r.step === "ai");
  const explConsensus = d.consensus.filter((c) => c.phase === "explain");

  // Work backwards from completion
  if (explConsensus.length > 0) {
    const passages = d.session.selectedPassages
      ? d.session.selectedPassages
      : [];
    if (passages.length === 0 || explConsensus.length >= passages.length) {
      return "complete";
    }
    return "explain-consensus";
  }
  if (explAI.length > 0) return "explain-ai";
  if (explPeer.length > 0) return "explain-peer";
  if (explIndividual.length > 0) return "explain-individual";
  if (evalConsensus.length > 0) return "explain-individual"; // group finished evaluate consensus
  if (evalAI.length > 0) return "evaluate-consensus"; // has AI responses, waiting for consensus
  if (evalPeer.length > 0) return "evaluate-ai";
  if (evalIndividual.length > 0) return "evaluate-individual";
  if (hasLens) return "evaluate-individual";
  return "onboarding";
}

export function SessionClient({
  sessionId,
  studentId,
}: {
  sessionId: string;
  studentId: string;
}) {
  const [data, setData] = useState<SessionData | null>(null);
  const [currentStep, setCurrentStep] = useState<SessionStep>("onboarding");
  const [loading, setLoading] = useState(true);
  const sync = useSync(studentId);

  const loadSession = useCallback(async () => {
    try {
      const res = await fetch(`/api/sessions/${sessionId}/student`);
      if (res.ok) {
        const d: SessionData = await res.json();
        setData(d);
        // Cache artifacts for offline use (evicts previous session)
        evictCache();
        cacheArtifacts(sessionId, studentId, d);
        return d;
      }
    } catch {
      // Network error — try loading from cache
      const cached = getCachedArtifacts(sessionId, studentId);
      if (cached) {
        const d = cached as SessionData;
        setData(d);
        return d;
      }
    }
    return null;
  }, [sessionId, studentId]);

  useEffect(() => {
    loadSession().then((d) => {
      if (d) {
        // C3 fix: restore session step from server state on load/refresh
        const inferredStep = inferStep(d);
        setCurrentStep(inferredStep);
      }
      setLoading(false);
    });
  }, [loadSession]);

  const refresh = useCallback(async () => {
    const d = await loadSession();
    // Detect session closed mid-work
    if (d && d.session.status === "closed" && currentStep !== "complete") {
      setCurrentStep("complete");
    }
  }, [loadSession, currentStep]);

  // Poll for session status changes (e.g., teacher closes session)
  useEffect(() => {
    if (currentStep === "complete" || currentStep === "onboarding" || currentStep === "reading") return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/sessions/${sessionId}/student`);
        if (res.ok) {
          const d: SessionData = await res.json();
          if (d.session.status === "closed") {
            setData(d);
            setCurrentStep("complete");
          }
        }
      } catch {
        // Ignore — offline handling covers this
      }
    }, 10000); // Check every 10s
    return () => clearInterval(interval);
  }, [sessionId, currentStep]);

  if (loading || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading session...</p>
      </div>
    );
  }

  const syncIndicator = (
    <SyncIndicator status={sync.status} unsyncedCount={sync.unsyncedCount} />
  );

  const { session, scenario, group, lensAssignment } = data;
  const artifacts = scenario.artifacts;
  const passages: Passage[] = session.selectedPassages
    ? (artifacts.session?.passages || []).filter((p: Passage) =>
        session.selectedPassages!.includes(p.id)
      )
    : artifacts.session?.passages || [];

  const scaffolding = artifacts.scaffolding?.passage_scaffolding || [];
  const turns = artifacts.transcript?.turns || [];
  const personas = artifacts.transcript?.personas || artifacts.scenario?.personas || [];

  const lensId = lensAssignment?.lensId || null;

  // Common props
  const commonProps = {
    sessionId,
    studentId,
    passages,
    scaffolding,
    turns,
    lensId: lensId || "",
    evaluateResponses: data.evaluateResponses,
    explainResponses: data.explainResponses,
    consensus: data.consensus,
    group,
    session,
    onRefresh: refresh,
  };

  if (session.status === "closed" && currentStep !== "complete") {
    return (
      <CompletionScreen
        lensId={lensId}
        evaluateResponses={data.evaluateResponses}
        explainResponses={data.explainResponses}
        consensus={data.consensus}
        passages={passages}
        sessionClosed
      />
    );
  }

  switch (currentStep) {
    case "onboarding":
      return (
        <OnboardingScreen
          topic={scenario.topic}
          context={artifacts.scenario?.context || ""}
          personas={personas}
          onContinue={() => setCurrentStep("reading")}
        />
      );

    case "reading":
      return (
        <ReadingScreen
          turns={turns}
          onFinished={() => setCurrentStep("lens-assignment")}
        />
      );

    case "lens-assignment":
      return (
        <LensAssignmentScreen
          sessionId={sessionId}
          mode={session.lensAssignmentMode}
          existingLens={lensId}
          onAssigned={(newLensId) => {
            if (data) {
              setData({
                ...data,
                lensAssignment: { lensId: newLensId },
              });
            }
            setCurrentStep("evaluate-individual");
          }}
        />
      );

    case "evaluate-individual":
      return (
        <>{syncIndicator}
        <EvaluateIndividual
          {...commonProps}
          analysis={artifacts.analysis}
          onReady={() => setCurrentStep("evaluate-peer")}
          onSyncRefresh={sync.refreshCount}
        />
        </>
      );

    case "evaluate-peer":
      return (
        <>{syncIndicator}
        <PeerStep
          {...commonProps}
          phase="evaluate"
          onMoveToAI={() => setCurrentStep("evaluate-ai")}
          onSyncRefresh={sync.refreshCount}
        />
        </>
      );

    case "evaluate-ai":
      return (
        <>{syncIndicator}
        <AIStep
          {...commonProps}
          phase="evaluate"
          analysis={artifacts.analysis}
          onFinished={() => setCurrentStep("evaluate-consensus")}
          onSyncRefresh={sync.refreshCount}
        />
        </>
      );

    case "evaluate-consensus":
      return (
        <>{syncIndicator}
        <ConsensusStep
          {...commonProps}
          phase="evaluate"
          analysis={artifacts.analysis}
          onFinished={async () => {
            // C3 fix: refresh data and verify group consensus is complete
            // before allowing phase transition
            await refresh();
            setCurrentStep("explain-individual");
          }}
        />
        </>
      );

    case "explain-individual":
      return (
        <>{syncIndicator}
        <ExplainIndividual
          {...commonProps}
          analysis={artifacts.analysis}
          onReady={() => setCurrentStep("explain-peer")}
          onSyncRefresh={sync.refreshCount}
        />
        </>
      );

    case "explain-peer":
      return (
        <>{syncIndicator}
        <PeerStep
          {...commonProps}
          phase="explain"
          onMoveToAI={() => setCurrentStep("explain-ai")}
          onSyncRefresh={sync.refreshCount}
        />
        </>
      );

    case "explain-ai":
      return (
        <>{syncIndicator}
        <AIStep
          {...commonProps}
          phase="explain"
          analysis={artifacts.analysis}
          onFinished={() => setCurrentStep("explain-consensus")}
          onSyncRefresh={sync.refreshCount}
        />
        </>
      );

    case "explain-consensus":
      return (
        <>{syncIndicator}
        <ConsensusStep
          {...commonProps}
          phase="explain"
          analysis={artifacts.analysis}
          onFinished={() => setCurrentStep("complete")}
        />
        </>
      );

    case "complete":
      return (
        <CompletionScreen
          lensId={lensId}
          evaluateResponses={data.evaluateResponses}
          explainResponses={data.explainResponses}
          consensus={data.consensus}
          passages={passages}
        />
      );

    default:
      return null;
  }
}
