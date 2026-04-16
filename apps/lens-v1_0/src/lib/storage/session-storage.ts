"use client";

import {
  persistedSessionSchema,
  sessionIndexEntrySchema,
  sessionIndexSchema,
  type PersistedSession,
  type SessionIndex,
  type SessionIndexEntry,
} from "@/lib/types/content";
import { LAST_SESSION_KEY, SESSION_INDEX_KEY, sessionRecordKey } from "@/lib/storage/keys";

function getStorage(): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
}

function readJson(storageKey: string): unknown {
  const storage = getStorage();

  if (!storage) {
    return null;
  }

  const rawValue = storage.getItem(storageKey);
  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue);
  } catch {
    return null;
  }
}

function writeJson(storageKey: string, value: unknown): void {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  storage.setItem(storageKey, JSON.stringify(value));
}

export function loadSession(localSessionId: string): PersistedSession | null {
  const parsed = readJson(sessionRecordKey(localSessionId));
  if (!parsed) {
    return null;
  }

  const result = persistedSessionSchema.safeParse(parsed);
  return result.success ? result.data : null;
}

export function saveSession(session: PersistedSession): void {
  const parsed = persistedSessionSchema.parse(session);
  writeJson(sessionRecordKey(parsed.local_session_id), parsed);
  upsertSessionIndexEntry(toSessionIndexEntry(parsed));
  setLastSessionId(parsed.local_session_id);
}

export function loadSessionIndex(): SessionIndex {
  const parsed = readJson(SESSION_INDEX_KEY);
  if (!parsed) {
    return [];
  }

  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed.flatMap((entry) => {
    const result = sessionIndexEntrySchema.safeParse(entry);
    return result.success ? [result.data] : [];
  });
}

export function upsertSessionIndexEntry(entry: SessionIndexEntry): void {
  const parsedEntry = sessionIndexEntrySchema.parse(entry);
  const currentIndex = loadSessionIndex();

  const nextIndex = [
    parsedEntry,
    ...currentIndex.filter((item) => item.local_session_id !== parsedEntry.local_session_id),
  ].sort((left, right) => right.updated_at.localeCompare(left.updated_at));

  writeJson(SESSION_INDEX_KEY, sessionIndexSchema.parse(nextIndex));
}

export function getLastSessionId(): string | null {
  const parsed = readJson(LAST_SESSION_KEY);
  return typeof parsed === "string" ? parsed : null;
}

export function setLastSessionId(localSessionId: string): void {
  writeJson(LAST_SESSION_KEY, localSessionId);
}

export function toSessionIndexEntry(session: PersistedSession): SessionIndexEntry {
  return sessionIndexEntrySchema.parse({
    local_session_id: session.local_session_id,
    config_id: session.config_id,
    episode_source: session.episode_source,
    group_label: session.roster.map((student) => student.name).join(", "),
    updated_at: session.updated_at,
    current_backbone_stage: session.current_backbone_stage,
    current_focal_turn_id: session.current_focal_turn_id,
  });
}
