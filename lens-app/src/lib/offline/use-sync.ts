"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getUnsyncedCount, syncAll } from "./queue";

export type SyncStatus = "synced" | "pending" | "offline";

/**
 * Hook that manages offline sync status for a student.
 * - Tracks unsynced count
 * - Monitors online/offline status
 * - Runs background sync on reconnect and at intervals
 */
export function useSync(studentId: string) {
  const [status, setStatus] = useState<SyncStatus>("synced");
  const [unsyncedCount, setUnsyncedCount] = useState(0);
  const [online, setOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const syncingRef = useRef(false);

  const refreshCount = useCallback(() => {
    const count = getUnsyncedCount(studentId);
    setUnsyncedCount(count);
    if (count === 0) {
      setStatus("synced");
    } else if (!navigator.onLine) {
      setStatus("offline");
    } else {
      setStatus("pending");
    }
  }, [studentId]);

  const attemptSync = useCallback(async () => {
    if (syncingRef.current || !navigator.onLine) return;
    syncingRef.current = true;
    try {
      await syncAll(studentId);
    } finally {
      syncingRef.current = false;
      refreshCount();
    }
  }, [studentId, refreshCount]);

  // Listen for online/offline events
  useEffect(() => {
    function handleOnline() {
      setOnline(true);
      attemptSync();
    }
    function handleOffline() {
      setOnline(false);
      setStatus("offline");
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [attemptSync]);

  // Periodic sync attempt (every 5s if there are unsynced entries)
  useEffect(() => {
    const interval = setInterval(() => {
      if (getUnsyncedCount(studentId) > 0 && navigator.onLine) {
        attemptSync();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [studentId, attemptSync]);

  // Initial check
  useEffect(() => {
    refreshCount();
    attemptSync();
  }, [refreshCount, attemptSync]);

  return { status, unsyncedCount, online, refreshCount, attemptSync };
}
