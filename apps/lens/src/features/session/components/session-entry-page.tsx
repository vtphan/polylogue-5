"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { loadSession, loadSessionIndex } from "@/lib/storage/session-storage";
import type { SessionIndexEntry } from "@/lib/types/content";
import { deriveSessionRouteStage, sessionStagePath } from "@/features/session/lib/routes";

type SessionEntryPageProps = {
  episodeTitle: string;
  episodeContext: string;
};

export function SessionEntryPage({
  episodeTitle,
  episodeContext,
}: SessionEntryPageProps) {
  const router = useRouter();
  const [recentSessions, setRecentSessions] = useState<SessionIndexEntry[]>(() => loadSessionIndex());
  const [resumeError, setResumeError] = useState<string | null>(null);

  function resumeSession(localSessionId: string) {
    const storedSession = loadSession(localSessionId);
    if (!storedSession) {
      setResumeError("That saved local session could not be loaded. It may be stale or malformed.");
      setRecentSessions(loadSessionIndex());
      return;
    }

    setResumeError(null);
    router.push(sessionStagePath(localSessionId, deriveSessionRouteStage(storedSession)));
  }

  const latestSession = recentSessions[0] ?? null;

  return (
    <main className="min-h-screen px-6 py-8 text-[var(--foreground)] sm:px-8 lg:px-12">
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <div className="lens-panel lens-reveal rounded-[2rem] p-8 md:p-10">
          <div className="grid gap-6 lg:grid-cols-[1.12fr_0.88fr] lg:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[var(--accent-strong)]">
                Polylogue Lens
              </p>
              <h1
                className="mt-3 max-w-3xl text-5xl leading-none sm:text-6xl"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Read together, notice one turn, and build a response as a table.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-[color:rgba(29,36,48,0.76)] sm:text-lg">
                {episodeTitle} is ready for a shared-device session. Students only need the next step in
                front of them. Research and runtime details live on a separate page.
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-[var(--line)] bg-[rgba(255,255,255,0.56)] p-5">
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--moss)]">
                Today&apos;s episode
              </div>
              <div className="mt-2 text-2xl font-semibold">{episodeTitle}</div>
              <div className="mt-3 text-sm leading-6 text-[color:rgba(37,50,68,0.72)]">{episodeContext}</div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <section className="lens-panel rounded-[2rem] p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--moss)]">
              Start
            </p>
            <h2 className="mt-2 text-3xl leading-tight" style={{ fontFamily: "var(--font-display)" }}>
              Begin a new shared-device session.
            </h2>
            <p className="mt-4 text-sm leading-6 text-[color:rgba(29,36,48,0.78)]">
              The next page lets you confirm who is at this table before reading begins.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                className="rounded-full bg-[var(--surface-ink)] px-5 py-3 text-sm font-semibold text-white"
                href="/session/setup"
              >
                Start new session
              </Link>
              <Link
                className="rounded-full border border-[var(--line)] bg-white px-5 py-3 text-sm font-semibold text-[var(--surface-ink)]"
                href="/research"
              >
                View research page
              </Link>
            </div>
          </section>

          <section className="lens-panel rounded-[2rem] p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--moss)]">
              Resume
            </p>
            <h2 className="mt-2 text-3xl leading-tight" style={{ fontFamily: "var(--font-display)" }}>
              Return to a saved table session.
            </h2>

            {resumeError ? (
              <div className="mt-4 rounded-[1.25rem] border border-[rgba(146,74,48,0.24)] bg-[rgba(255,245,236,0.92)] px-4 py-4 text-sm leading-6 text-[rgba(114,56,34,0.92)]">
                {resumeError}
              </div>
            ) : null}

            {latestSession ? (
              <button
                className="mt-5 w-full rounded-[1.4rem] border border-[var(--line)] bg-[var(--background)]/72 px-5 py-5 text-left"
                onClick={() => resumeSession(latestSession.local_session_id)}
                type="button"
              >
                <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
                  Resume latest
                </div>
                <div className="mt-2 text-lg font-semibold text-[var(--surface-ink)]">
                  {latestSession.group_label}
                </div>
                <div className="mt-2 text-sm leading-6 text-[color:rgba(37,50,68,0.72)]">
                  Stage <code>{latestSession.current_backbone_stage}</code>
                  {latestSession.current_focal_turn_id ? (
                    <>
                      {" "}on <code>{latestSession.current_focal_turn_id}</code>
                    </>
                  ) : null}
                </div>
              </button>
            ) : (
              <div className="mt-5 rounded-[1.4rem] border border-dashed border-[var(--line)] px-4 py-5 text-sm leading-6 text-[color:rgba(29,36,48,0.72)]">
                No saved browser-local sessions yet.
              </div>
            )}

            {recentSessions.length > 1 ? (
              <div className="mt-5 grid gap-3">
                {recentSessions.slice(1, 4).map((entry) => (
                  <button
                    key={entry.local_session_id}
                    className="rounded-[1.1rem] border border-[var(--line)] bg-white/74 px-4 py-4 text-left"
                    onClick={() => resumeSession(entry.local_session_id)}
                    type="button"
                  >
                    <div className="text-sm font-semibold text-[var(--surface-ink)]">{entry.group_label}</div>
                    <div className="mt-1 text-xs uppercase tracking-[0.14em] text-[var(--accent-strong)]">
                      {entry.current_backbone_stage} · updated {new Date(entry.updated_at).toLocaleString()}
                    </div>
                  </button>
                ))}
              </div>
            ) : null}
          </section>
        </div>
      </section>
    </main>
  );
}
