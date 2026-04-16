import type { LoaderBundle, PersistedSession } from "@/lib/types/content";
type ProbeOption = {
  text: string;
};

type ProbeEntry = {
  question?: string;
  options?: ProbeOption[];
};

export type RuntimeLevel = {
  id: string;
  turnId: string;
  question: string;
  options: string[];
};

function nowIso(): string {
  return new Date().toISOString();
}

function getFacetProbeMap(bundle: LoaderBundle): Record<string, ProbeEntry> {
  const probesRoot = bundle.assistivePackage.diagnostic_support.probes as Record<string, unknown>;
  const facet = probesRoot.facet;
  if (!facet || typeof facet !== "object") {
    return {};
  }

  const byTurn = (facet as Record<string, unknown>).by_turn;
  if (!byTurn || typeof byTurn !== "object") {
    return {};
  }

  return byTurn as Record<string, ProbeEntry>;
}

function getProbeTurns(bundle: LoaderBundle): string[] {
  return Object.keys(getFacetProbeMap(bundle)).sort((left, right) =>
    left.localeCompare(right, undefined, { numeric: true }),
  );
}

export function buildRuntimeLevels(bundle: LoaderBundle): RuntimeLevel[] {
  const probeMap = getFacetProbeMap(bundle);

  return getProbeTurns(bundle)
    .map((turnId, index) => {
      const probe = probeMap[turnId];
      if (!probe?.question || !Array.isArray(probe.options)) {
        return null;
      }

      const options = probe.options
        .map((option) => option?.text?.trim())
        .filter((value): value is string => Boolean(value));

      if (options.length === 0) {
        return null;
      }

      return {
        id: `level-${index + 1}`,
        turnId,
        question: probe.question.trim(),
        options,
      };
    })
    .filter((level): level is RuntimeLevel => level !== null);
}

export function createInitialSession(bundle: LoaderBundle): PersistedSession {
  const levels = buildRuntimeLevels(bundle);
  const firstLevel = levels[0] ?? null;

  return {
    local_session_id: `${bundle.sessionConfig.config_id}-${Date.now()}`,
    config_id: bundle.sessionConfig.config_id,
    episode_source: bundle.sessionConfig.episode.source,
    current_phase: "read",
    pacing_policy: bundle.sessionConfig.ui?.pacing ?? "guided",
    reading_complete: false,
    warmup_state: {
      modeled_complete: false,
      guided_complete: false,
    },
    current_level_id: firstLevel?.id ?? null,
    current_turn_id: firstLevel?.turnId ?? null,
    level_order: levels.map((level) => level.id),
    completed_level_ids: [],
    responses: {},
    scaffold_usage: {},
    badge_state: {
      earned: [],
    },
    progress_state: {
      episode_complete: false,
    },
    updated_at: nowIso(),
  };
}

export function ensureBadge(session: PersistedSession, badge: string): PersistedSession {
  if (session.badge_state.earned.includes(badge)) {
    return session;
  }

  return {
    ...session,
    badge_state: {
      earned: [...session.badge_state.earned, badge],
    },
  };
}

export function markReadingComplete(session: PersistedSession): PersistedSession {
  return {
    ...ensureBadge(
      {
        ...session,
        current_phase: "warmup",
        reading_complete: true,
        updated_at: nowIso(),
      },
      "read-the-episode",
    ),
  };
}

export function completeWarmup(session: PersistedSession, kind: "modeled" | "guided"): PersistedSession {
  const nextWarmupState = {
    ...session.warmup_state,
    modeled_complete: kind === "modeled" ? true : session.warmup_state.modeled_complete,
    guided_complete: kind === "guided" ? true : session.warmup_state.guided_complete,
  };

  const shouldEnterLevels = nextWarmupState.modeled_complete && nextWarmupState.guided_complete;

  return ensureBadge(
    {
      ...session,
      current_phase: shouldEnterLevels ? "level" : "warmup",
      warmup_state: nextWarmupState,
      updated_at: nowIso(),
    },
    kind === "modeled" ? "warmup-1" : "warmup-2",
  );
}

export function skipSecondWarmup(session: PersistedSession): PersistedSession {
  return {
    ...ensureBadge(
      {
        ...session,
        current_phase: "level",
        warmup_state: {
          ...session.warmup_state,
          guided_complete: true,
        },
        updated_at: nowIso(),
      },
      "warmup-2-skipped",
    ),
  };
}

export function recordSupportStep(session: PersistedSession, levelId: string, step: string): PersistedSession {
  const current = session.scaffold_usage[levelId] ?? [];
  if (current.includes(step)) {
    return session;
  }

  return {
    ...session,
    scaffold_usage: {
      ...session.scaffold_usage,
      [levelId]: [...current, step],
    },
    updated_at: nowIso(),
  };
}

export function saveLevelResponse(
  session: PersistedSession,
  level: RuntimeLevel,
  initialAnswer: string,
  finalAnswer: string,
): PersistedSession {
  const supportSteps = session.scaffold_usage[level.id] ?? [];
  const answerChanged = initialAnswer !== finalAnswer;
  const completedLevelIds = session.completed_level_ids.includes(level.id)
    ? session.completed_level_ids
    : [...session.completed_level_ids, level.id];

  const nextLevelId = session.level_order.find((id) => !completedLevelIds.includes(id)) ?? null;

  let nextSession: PersistedSession = {
    ...session,
    current_phase: nextLevelId ? "level" : "complete",
    current_level_id: nextLevelId,
    current_turn_id: nextLevelId ? level.turnId : null,
    completed_level_ids: completedLevelIds,
    responses: {
      ...session.responses,
      [level.id]: {
        level_id: level.id,
        turn_id: level.turnId,
        question: level.question,
        options: level.options,
        initial_answer: initialAnswer,
        final_answer: finalAnswer,
        support_requested: supportSteps.length > 0,
        support_steps_viewed: supportSteps,
        answer_changed: answerChanged,
        completed_at: nowIso(),
      },
    },
    progress_state: {
      episode_complete: nextLevelId === null,
    },
    updated_at: nowIso(),
  };

  nextSession = ensureBadge(nextSession, level.id);
  if (supportSteps.length > 0) {
    nextSession = ensureBadge(nextSession, `${level.id}-used-support`);
  }
  if (answerChanged) {
    nextSession = ensureBadge(nextSession, `${level.id}-changed-answer`);
  }
  if (nextLevelId === null) {
    nextSession = ensureBadge(nextSession, "episode-complete");
  }

  return nextSession;
}

export function getTurnText(bundle: LoaderBundle, turnId: string | null): string[] {
  if (!turnId) {
    return [];
  }

  const transcriptId = `turn_${turnId.slice(1)}`;
  const turn = bundle.transcript.turns.find((entry) => entry.turn_id === transcriptId);
  return turn ? turn.sentences.map((sentence) => sentence.text) : [];
}

export function buildWarmupTurnIds(bundle: LoaderBundle): { modeled: string | null; guided: string | null } {
  const probeTurns = getProbeTurns(bundle);
  return {
    modeled: probeTurns[0] ?? null,
    guided: probeTurns[1] ?? probeTurns[0] ?? null,
  };
}

export function getAvailableLevelById(bundle: LoaderBundle, levelId: string | null): RuntimeLevel | null {
  if (!levelId) {
    return null;
  }

  return buildRuntimeLevels(bundle).find((level) => level.id === levelId) ?? null;
}
