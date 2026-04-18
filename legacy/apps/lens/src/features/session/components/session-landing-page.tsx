"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { deriveSessionRouteStage } from "@/features/session/lib/routes";
import { useSessionStore } from "@/features/session/store/use-session-store";
import { loadSession } from "@/lib/storage/session-storage";

type SessionLandingPageProps = {
  episodeContext: string;
  episodeTitle: string;
  sessionId: string;
};

export function SessionLandingPage({
  episodeContext,
  episodeTitle,
  sessionId,
}: SessionLandingPageProps) {
  const router = useRouter();
  const session = useSessionStore((state) => state.session);
  const hydrateSession = useSessionStore((state) => state.hydrateSession);
  const storedSession = useMemo(() => {
    if (session?.local_session_id === sessionId) {
      return session;
    }

    return loadSession(sessionId);
  }, [session, sessionId]);

  useEffect(() => {
    if (session?.local_session_id === sessionId) {
      return;
    }

    if (!storedSession) {
      return;
    }

    hydrateSession(storedSession);
  }, [hydrateSession, session?.local_session_id, sessionId, storedSession]);

  useEffect(() => {
    if (!session || session.local_session_id !== sessionId) {
      return;
    }

    const routeStage = deriveSessionRouteStage(session);
    if (routeStage !== "landing") {
      router.replace(`/session/${sessionId}/${routeStage}`);
    }
  }, [router, session, sessionId]);

  if (!storedSession) {
    return (
      <main className="min-h-screen px-6 py-8 text-[var(--foreground)] sm:px-8 lg:px-12">
        <section className="mx-auto max-w-4xl">
          <div className="lens-panel rounded-[2rem] p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent-strong)]">
              Session Missing
            </p>
            <h1 className="mt-3 text-4xl leading-tight" style={{ fontFamily: "var(--font-display)" }}>
              This saved session is no longer available in local storage.
            </h1>
            <div className="mt-6">
              <Link
                className="rounded-full bg-[var(--surface-ink)] px-5 py-3 text-sm font-semibold text-white"
                href="/"
              >
                Return home
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  if (!session || session.local_session_id !== sessionId) {
    return null;
  }

  return (
    <main className="min-h-screen px-6 py-8 text-[var(--foreground)] sm:px-8 lg:px-12">
      <section className="mx-auto grid w-full max-w-4xl gap-6">
        <div className="lens-panel rounded-[2rem] p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--moss)]">
            Episode Landing
          </p>
          <h1 className="mt-2 text-4xl leading-tight" style={{ fontFamily: "var(--font-display)" }}>
            {episodeTitle}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-[color:rgba(29,36,48,0.76)]">
            {episodeContext}
          </p>
        </div>

        <section className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <div className="lens-panel rounded-[2rem] p-7">
            <div className="grid gap-3 rounded-[1.4rem] border border-[var(--line)] bg-[var(--background)]/70 p-5 text-sm leading-6 text-[color:rgba(29,36,48,0.84)]">
              <div>
                Active student: <code>{session.active_student_id}</code>
              </div>
              <div>
                Pacing policy: <code>{session.pacing_policy}</code>
              </div>
              <div>
                Focal turn: <code>{session.current_focal_turn_id ?? "not selected yet"}</code>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {session.roster.map((student) => {
                const active = student.id === session.active_student_id;
                return (
                  <span
                    key={student.id}
                    className={`rounded-full px-3 py-2 text-sm font-semibold ${
                      active
                        ? "bg-[var(--surface-ink)] text-white"
                        : "border border-[var(--line)] bg-white text-[var(--surface-ink)]"
                    }`}
                  >
                    {student.name}
                  </span>
                );
              })}
            </div>
          </div>

          <div className="lens-panel rounded-[2rem] p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--moss)]">
              Ready
            </p>
            <h2 className="mt-2 text-3xl leading-tight" style={{ fontFamily: "var(--font-display)" }}>
              Move into the reading view when the table is set.
            </h2>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                className="rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white"
                href={`/session/${sessionId}/read`}
              >
                Begin reading
              </Link>
              <Link
                className="rounded-full border border-[var(--line)] bg-white px-5 py-3 text-sm font-semibold text-[var(--surface-ink)]"
                href="/"
              >
                Return home
              </Link>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
