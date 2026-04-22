export type Phase = "A" | "B" | "C" | "D";

export type Turn = {
  role: "user" | "assistant";
  content: string;
};

export type SessionState = {
  storyId: string | null;
  phase: Phase;
  phaseBuffer: Turn[];
};

const PHASE_BUFFER_LIMIT = 10;

const globalAny = globalThis as { __polylogue_session?: SessionState };

function init(): SessionState {
  return {
    storyId: null,
    phase: "A",
    phaseBuffer: [],
  };
}

export function getSession(): SessionState {
  if (!globalAny.__polylogue_session) {
    globalAny.__polylogue_session = init();
  }
  return globalAny.__polylogue_session;
}

export function appendTurns(turns: Turn[]): void {
  const s = getSession();
  s.phaseBuffer.push(...turns);
  if (s.phaseBuffer.length > PHASE_BUFFER_LIMIT) {
    s.phaseBuffer.splice(0, s.phaseBuffer.length - PHASE_BUFFER_LIMIT);
  }
}

export function setStoryId(storyId: string): void {
  const s = getSession();
  s.storyId = storyId;
}

export function setPhase(phase: Phase): void {
  const s = getSession();
  s.phase = phase;
}
