/**
 * Artifact cache — stores session artifacts (transcript, scaffolding, AI perspectives)
 * in localStorage at session entry. Only one session is cached at a time.
 * Previous session data is evicted on new session entry.
 */

const CACHE_KEY = "polylogue_artifacts";
const CACHE_META_KEY = "polylogue_artifacts_meta";

interface CachedArtifacts {
  sessionId: string;
  studentId: string;
  data: unknown;
  cachedAt: number;
}

/** Cache session artifacts for offline use */
export function cacheArtifacts(
  sessionId: string,
  studentId: string,
  data: unknown
): void {
  if (typeof window === "undefined") return;
  try {
    const cached: CachedArtifacts = {
      sessionId,
      studentId,
      data,
      cachedAt: Date.now(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cached));
    localStorage.setItem(
      CACHE_META_KEY,
      JSON.stringify({ sessionId, studentId, cachedAt: cached.cachedAt })
    );
  } catch {
    // localStorage full — not critical, artifacts are loaded from server on reconnect
  }
}

/** Retrieve cached artifacts for a session. Returns null if not cached or wrong session. */
export function getCachedArtifacts(
  sessionId: string,
  studentId: string
): unknown | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cached: CachedArtifacts = JSON.parse(raw);
    if (cached.sessionId === sessionId && cached.studentId === studentId) {
      return cached.data;
    }
    return null;
  } catch {
    return null;
  }
}

/** Evict cached artifacts (called on new session entry) */
export function evictCache(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(CACHE_META_KEY);
  } catch {
    // ignore
  }
}

/** Check if artifacts are cached for this session */
export function isCached(sessionId: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(CACHE_META_KEY);
    if (!raw) return false;
    const meta = JSON.parse(raw);
    return meta.sessionId === sessionId;
  } catch {
    return false;
  }
}
