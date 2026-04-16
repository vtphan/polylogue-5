"use client";

import { create } from "zustand";
import type { SessionConfig, PersistedSession, Student } from "@/lib/types/content";
import { deriveStoppingPoint, createInitialSessionRecord, beginFocalTurn, reachRevision, saveStudentResponse, startDiscussion } from "@/features/activity/engine";
import { saveSession } from "@/lib/storage/session-storage";

type SessionStoreState = {
  session: PersistedSession | null;
  stoppingPoint: ReturnType<typeof deriveStoppingPoint>;
  initializeSession: (sessionConfig: SessionConfig, rosterOverride?: Student[]) => void;
  hydrateSession: (session: PersistedSession) => void;
  selectFocalTurn: (turnId: string) => void;
  saveActiveStudentResponse: (payload: { responseText: string; judgment: string }) => void;
  openDiscussion: () => void;
  moveToRevision: () => void;
};

function persistSession(session: PersistedSession) {
  saveSession(session);
  return {
    session,
    stoppingPoint: deriveStoppingPoint(session),
  };
}

export const useSessionStore = create<SessionStoreState>((set, get) => ({
  session: null,
  stoppingPoint: null,
  initializeSession: (sessionConfig, rosterOverride) => {
    const session = createInitialSessionRecord({ sessionConfig, rosterOverride });
    set(persistSession(session));
  },
  hydrateSession: (session) => {
    set({
      session,
      stoppingPoint: deriveStoppingPoint(session),
    });
  },
  selectFocalTurn: (turnId) => {
    const currentSession = get().session;
    if (!currentSession) {
      return;
    }

    set(persistSession(beginFocalTurn(currentSession, turnId)));
  },
  saveActiveStudentResponse: (payload) => {
    const currentSession = get().session;
    if (!currentSession) {
      return;
    }

    set(
      persistSession(
        saveStudentResponse(currentSession, currentSession.active_student_id, payload),
      ),
    );
  },
  openDiscussion: () => {
    const currentSession = get().session;
    if (!currentSession) {
      return;
    }

    set(persistSession(startDiscussion(currentSession)));
  },
  moveToRevision: () => {
    const currentSession = get().session;
    if (!currentSession) {
      return;
    }

    set(persistSession(reachRevision(currentSession)));
  },
}));
