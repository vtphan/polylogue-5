import type { PersistedSession, SessionConfig, Student } from "@/lib/types/content";

export type StoppingPoint = "round-complete" | "revision-reached" | "episode-complete" | null;

type SessionBootstrapInput = {
  sessionConfig: SessionConfig;
  rosterOverride?: Student[];
};

function resolveRoster(sessionConfig: SessionConfig): Student[] {
  return sessionConfig.group?.students ?? [];
}

function resolveStartingStudentId(sessionConfig: SessionConfig, roster: Student[]): string {
  const configuredStudentId = sessionConfig.ui?.starting_student_id;
  if (configuredStudentId && roster.some((student) => student.id === configuredStudentId)) {
    return configuredStudentId;
  }

  const firstStudent = roster[0];
  if (!firstStudent) {
    throw new Error(`Session config "${sessionConfig.config_id}" has no roster to initialize`);
  }

  return firstStudent.id;
}

function initialCohortState(roster: Student[]): PersistedSession["cohort_response_state"] {
  return Object.fromEntries(roster.map((student) => [student.id, "pending"]));
}

function findNextPendingStudent(
  rosterOrder: string[],
  currentStudentId: string,
  cohortState: PersistedSession["cohort_response_state"],
): string {
  const currentIndex = Math.max(rosterOrder.indexOf(currentStudentId), 0);

  for (let offset = 1; offset <= rosterOrder.length; offset += 1) {
    const candidateId = rosterOrder[(currentIndex + offset) % rosterOrder.length];

    if (candidateId && cohortState[candidateId] === "pending") {
      return candidateId;
    }
  }

  return currentStudentId;
}

export function createInitialSessionRecord({
  sessionConfig,
  rosterOverride,
}: SessionBootstrapInput): PersistedSession {
  const roster = rosterOverride && rosterOverride.length > 0 ? rosterOverride : resolveRoster(sessionConfig);
  const startingStudentId = resolveStartingStudentId(sessionConfig, roster);
  const rosterOrder = roster.map((student) => student.id);
  const timestamp = new Date().toISOString();

  return {
    local_session_id: crypto.randomUUID(),
    config_id: sessionConfig.config_id,
    episode_source: sessionConfig.episode.source,
    roster,
    roster_order: rosterOrder,
    active_student_id: startingStudentId,
    next_responder_id: findNextPendingStudent(
      rosterOrder,
      startingStudentId,
      initialCohortState(roster),
    ),
    current_focal_turn_id: null,
    current_backbone_stage: "read",
    pacing_policy: sessionConfig.ui?.pacing ?? "guided",
    responses: {},
    evaluative_judgments: {},
    cohort_response_state: initialCohortState(roster),
    scaffold_usage: {},
    comparison_state: {},
    discussion_state: {},
    recognition_state: {},
    progress_state: {},
    updated_at: timestamp,
  };
}

export function withUpdatedTimestamp(session: PersistedSession): PersistedSession {
  return {
    ...session,
    updated_at: new Date().toISOString(),
  };
}

export function deriveStoppingPoint(session: PersistedSession): StoppingPoint {
  if (session.progress_state.episode_complete === true) {
    return "episode-complete";
  }

  if (session.current_backbone_stage === "revise") {
    return "revision-reached";
  }

  const allSaved = Object.values(session.cohort_response_state).every((value) => value === "saved");
  if (allSaved && session.current_backbone_stage === "compare") {
    return "round-complete";
  }

  return null;
}

export function saveStudentResponse(
  session: PersistedSession,
  studentId: string,
  payload: {
    responseText: string;
    judgment: string;
  },
): PersistedSession {
  const responseKey = session.current_focal_turn_id
    ? `${session.current_focal_turn_id}:${studentId}`
    : `unfocused:${studentId}`;

  const nextCohortState = {
    ...session.cohort_response_state,
    [studentId]: "saved" as const,
  };

  const allSaved = Object.values(nextCohortState).every((value) => value === "saved");
  const nextActiveStudentId = allSaved
    ? studentId
    : findNextPendingStudent(session.roster_order, studentId, nextCohortState);

  return withUpdatedTimestamp({
    ...session,
    active_student_id: nextActiveStudentId,
    next_responder_id: allSaved
      ? nextActiveStudentId
      : findNextPendingStudent(session.roster_order, nextActiveStudentId, nextCohortState),
    current_backbone_stage: allSaved ? "compare" : "respond",
    responses: {
      ...session.responses,
      [responseKey]: {
        responseText: payload.responseText,
        studentId,
        turnId: session.current_focal_turn_id,
      },
    },
    evaluative_judgments: {
      ...session.evaluative_judgments,
      [responseKey]: payload.judgment,
    },
    cohort_response_state: nextCohortState,
  });
}

export function beginFocalTurn(session: PersistedSession, turnId: string): PersistedSession {
  return withUpdatedTimestamp({
    ...session,
    current_focal_turn_id: turnId,
    current_backbone_stage: "respond",
    active_student_id: session.active_student_id,
    next_responder_id: findNextPendingStudent(
      session.roster_order,
      session.active_student_id,
      session.cohort_response_state,
    ),
  });
}

export function startDiscussion(session: PersistedSession): PersistedSession {
  return withUpdatedTimestamp({
    ...session,
    current_backbone_stage: "discuss",
    discussion_state: {
      ...session.discussion_state,
      first_cue_opened: true,
    },
  });
}

export function reachRevision(session: PersistedSession): PersistedSession {
  return withUpdatedTimestamp({
    ...session,
    current_backbone_stage: "revise",
  });
}
