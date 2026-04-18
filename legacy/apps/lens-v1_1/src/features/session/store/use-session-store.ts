"use client";

import { create } from "zustand";
import type { LoaderBundle, PersistedSession } from "@/lib/types/content";
import { saveSession } from "@/lib/storage/session-storage";
import {
  completeWarmup,
  createInitialSession,
  markReadingComplete,
  recordSupportStep,
  saveLevelResponse,
  skipSecondWarmup,
  type RuntimeLevel,
} from "@/features/session/lib/runtime";

type SessionStoreState = {
  session: PersistedSession | null;
  initializeSession: (bundle: LoaderBundle) => void;
  hydrateSession: (session: PersistedSession) => void;
  finishReading: () => void;
  finishWarmup: (kind: "modeled" | "guided") => void;
  skipGuidedWarmup: () => void;
  viewSupportStep: (levelId: string, step: string) => void;
  saveLevel: (level: RuntimeLevel, initialAnswer: string, finalAnswer: string) => void;
};

function persistSession(session: PersistedSession) {
  saveSession(session);
  return { session };
}

export const useSessionStore = create<SessionStoreState>((set, get) => ({
  session: null,
  initializeSession: (bundle) => {
    set(persistSession(createInitialSession(bundle)));
  },
  hydrateSession: (session) => {
    set({ session });
  },
  finishReading: () => {
    const currentSession = get().session;
    if (!currentSession) {
      return;
    }

    set(persistSession(markReadingComplete(currentSession)));
  },
  finishWarmup: (kind) => {
    const currentSession = get().session;
    if (!currentSession) {
      return;
    }

    set(persistSession(completeWarmup(currentSession, kind)));
  },
  skipGuidedWarmup: () => {
    const currentSession = get().session;
    if (!currentSession) {
      return;
    }

    set(persistSession(skipSecondWarmup(currentSession)));
  },
  viewSupportStep: (levelId, step) => {
    const currentSession = get().session;
    if (!currentSession) {
      return;
    }

    set(persistSession(recordSupportStep(currentSession, levelId, step)));
  },
  saveLevel: (level, initialAnswer, finalAnswer) => {
    const currentSession = get().session;
    if (!currentSession) {
      return;
    }

    set(persistSession(saveLevelResponse(currentSession, level, initialAnswer, finalAnswer)));
  },
}));
