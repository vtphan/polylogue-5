"use client";

import type { SyncStatus } from "@/lib/offline/use-sync";

interface SyncIndicatorProps {
  status: SyncStatus;
  unsyncedCount: number;
}

export function SyncIndicator({ status, unsyncedCount }: SyncIndicatorProps) {
  if (status === "synced") return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-lg px-3 py-2 text-sm shadow-lg ${
        status === "offline"
          ? "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
          : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      }`}
    >
      {status === "offline" ? (
        <>
          <span
            className="inline-block h-2 w-2 rounded-full bg-amber-500"
            aria-hidden="true"
          />
          <span>
            Saved locally ({unsyncedCount}) — will sync when back online
          </span>
        </>
      ) : (
        <>
          <span
            className="inline-block h-2 w-2 animate-pulse rounded-full bg-blue-500"
            aria-hidden="true"
          />
          <span>Syncing{unsyncedCount > 1 ? ` (${unsyncedCount})` : ""}...</span>
        </>
      )}
    </div>
  );
}
