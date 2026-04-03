"use client";

interface StaleBannerProps {
  lastUpdated: Date | null;
  online: boolean;
}

function formatAge(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 10) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.floor(minutes / 60)}h ago`;
}

export function StaleBanner({ lastUpdated, online }: StaleBannerProps) {
  if (online && lastUpdated && Date.now() - lastUpdated.getTime() < 10000) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center gap-2 bg-amber-100 px-4 py-1.5 text-sm text-amber-800 dark:bg-amber-900 dark:text-amber-200"
    >
      <span
        className="inline-block h-2 w-2 rounded-full bg-amber-500"
        aria-hidden="true"
      />
      {!online ? (
        <span>Not receiving live updates — you are offline</span>
      ) : (
        <span>
          Not receiving live updates
          {lastUpdated && ` — last updated ${formatAge(lastUpdated)}`}
        </span>
      )}
    </div>
  );
}
