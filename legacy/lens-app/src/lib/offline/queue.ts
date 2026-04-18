/**
 * Offline response queue — saves responses to localStorage immediately,
 * syncs to server when connectivity is available. Uses client-generated
 * UUIDs for idempotent writes (server deduplicates by clientId).
 */

export interface QueuedResponse {
  clientId: string;
  endpoint: string; // e.g. "/api/sessions/{id}/responses/evaluate"
  body: Record<string, unknown>;
  createdAt: number; // timestamp
  synced: boolean;
}

const QUEUE_KEY_PREFIX = "polylogue_queue_";

function getQueueKey(studentId: string): string {
  return `${QUEUE_KEY_PREFIX}${studentId}`;
}

function generateClientId(): string {
  return crypto.randomUUID();
}

/** Read queue from localStorage for a given student */
export function getQueue(studentId: string): QueuedResponse[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getQueueKey(studentId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/** Write queue to localStorage */
function saveQueue(studentId: string, queue: QueuedResponse[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getQueueKey(studentId), JSON.stringify(queue));
  } catch {
    // localStorage full or unavailable — response was already submitted to server
  }
}

/** Enqueue a response. Returns the clientId for tracking. */
export function enqueueResponse(
  studentId: string,
  endpoint: string,
  body: Record<string, unknown>
): string {
  const clientId = generateClientId();
  const entry: QueuedResponse = {
    clientId,
    endpoint,
    body: { ...body, clientId },
    createdAt: Date.now(),
    synced: false,
  };
  const queue = getQueue(studentId);
  queue.push(entry);
  saveQueue(studentId, queue);
  return clientId;
}

/** Mark a queued response as synced and remove it */
export function markSynced(studentId: string, clientId: string): void {
  const queue = getQueue(studentId);
  saveQueue(
    studentId,
    queue.filter((q) => q.clientId !== clientId)
  );
}

/** Get count of unsynced responses */
export function getUnsyncedCount(studentId: string): number {
  return getQueue(studentId).filter((q) => !q.synced).length;
}

/** Try to sync a single queued response. Returns true if synced. */
async function syncOne(
  studentId: string,
  entry: QueuedResponse
): Promise<boolean> {
  try {
    const res = await fetch(entry.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entry.body),
    });
    // 201 = created, 409 = already exists (idempotent duplicate)
    if (res.ok || res.status === 409) {
      markSynced(studentId, entry.clientId);
      return true;
    }
    return false;
  } catch {
    return false; // network error — will retry later
  }
}

/** Sync all unsynced responses. Returns number successfully synced. */
export async function syncAll(studentId: string): Promise<number> {
  const queue = getQueue(studentId).filter((q) => !q.synced);
  let synced = 0;
  for (const entry of queue) {
    const ok = await syncOne(studentId, entry);
    if (ok) synced++;
    else break; // stop on first failure to preserve ordering
  }
  return synced;
}

/**
 * Submit a response: save to queue immediately, then attempt server sync.
 * Returns { clientId, serverResponse } — serverResponse is null if offline.
 */
export async function submitWithQueue(
  studentId: string,
  endpoint: string,
  body: Record<string, unknown>
): Promise<{
  clientId: string;
  synced: boolean;
  serverResponse: unknown | null;
}> {
  const clientId = enqueueResponse(studentId, endpoint, body);

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, clientId }),
    });

    if (res.ok || res.status === 409) {
      markSynced(studentId, clientId);
      const data = res.ok ? await res.json() : null;
      return { clientId, synced: true, serverResponse: data };
    }
    return { clientId, synced: false, serverResponse: null };
  } catch {
    // Network error — response is queued for later sync
    return { clientId, synced: false, serverResponse: null };
  }
}

/** Clear all synced entries for a student (cleanup) */
export function clearSynced(studentId: string): void {
  const queue = getQueue(studentId).filter((q) => !q.synced);
  saveQueue(studentId, queue);
}
