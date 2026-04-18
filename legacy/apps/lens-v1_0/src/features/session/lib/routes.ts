import type { PersistedSession } from "@/lib/types/content";

export type SessionRouteStage =
  | "landing"
  | "read"
  | "respond"
  | "compare"
  | "discuss"
  | "revise"
  | "complete";

export function sessionStagePath(sessionId: string, stage: SessionRouteStage): string {
  if (stage === "landing") {
    return `/session/${sessionId}`;
  }

  return `/session/${sessionId}/${stage}`;
}

export function deriveSessionRouteStage(session: PersistedSession): SessionRouteStage {
  if (session.progress_state.episode_complete === true) {
    return "complete";
  }

  if (session.current_backbone_stage === "revise") {
    return "revise";
  }

  if (session.current_backbone_stage === "discuss") {
    return "discuss";
  }

  if (session.current_backbone_stage === "compare") {
    return "compare";
  }

  if (session.current_backbone_stage === "respond" && session.current_focal_turn_id) {
    return "respond";
  }

  if (session.current_focal_turn_id) {
    return "read";
  }

  return "landing";
}
