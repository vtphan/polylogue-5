"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useSessionStore } from "@/features/session/store/use-session-store";
import type { SessionConfig, Student } from "@/lib/types/content";

type SessionSetupPageProps = {
  episodeTitle: string;
  sessionConfig: SessionConfig;
};

function deriveRoster(sessionConfig: SessionConfig): Student[] {
  return sessionConfig.group?.students ?? [];
}

function parseRosterDraft(rosterDraft: string): Student[] {
  return rosterDraft
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((name, index) => ({
      id: `s${index + 1}`,
      name,
    }));
}

export function SessionSetupPage({
  episodeTitle,
  sessionConfig,
}: SessionSetupPageProps) {
  const router = useRouter();
  const session = useSessionStore((state) => state.session);
  const initializeSession = useSessionStore((state) => state.initializeSession);

  const defaultRoster = useMemo(() => deriveRoster(sessionConfig), [sessionConfig]);
  const [rosterDraft, setRosterDraft] = useState(
    defaultRoster.map((student) => student.name).join("\n"),
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [startingSession, setStartingSession] = useState(false);

  useEffect(() => {
    if (startingSession && session?.config_id === sessionConfig.config_id) {
      router.replace(`/session/${session.local_session_id}`);
    }
  }, [router, session, sessionConfig.config_id, startingSession]);

  function continueToSession() {
    const roster = parseRosterDraft(rosterDraft);
    if (roster.length === 0) {
      setFormError("Enter at least one student before starting the session.");
      return;
    }

    setFormError(null);
    setStartingSession(true);
    initializeSession(sessionConfig, roster);
  }

  return (
    <main className="min-h-screen px-6 py-8 text-[var(--foreground)] sm:px-8 lg:px-12">
      <section className="mx-auto grid w-full max-w-4xl gap-6">
        <div className="lens-panel rounded-[2rem] p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--moss)]">
            Group Setup
          </p>
          <h1 className="mt-2 text-4xl leading-tight" style={{ fontFamily: "var(--font-display)" }}>
            Confirm who is sharing this device before {episodeTitle} begins.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-[color:rgba(29,36,48,0.76)]">
            Use one student name per line. The app will create a single local session for this table and
            assign the first active student automatically.
          </p>
        </div>

        <section className="lens-panel rounded-[2rem] p-7">
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-[var(--surface-ink)]">Roster</span>
            <textarea
              className="min-h-56 rounded-[1.25rem] border border-[var(--line)] bg-[var(--background)]/70 px-4 py-4 outline-none"
              onChange={(event) => setRosterDraft(event.target.value)}
              value={rosterDraft}
            />
          </label>

          {formError ? (
            <div className="mt-4 rounded-[1.25rem] border border-[rgba(146,74,48,0.24)] bg-[rgba(255,245,236,0.92)] px-4 py-4 text-sm leading-6 text-[rgba(114,56,34,0.92)]">
              {formError}
            </div>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              className="rounded-full bg-[var(--surface-ink)] px-5 py-3 text-sm font-semibold text-white"
              onClick={continueToSession}
              type="button"
            >
              Continue to episode
            </button>
            <Link
              className="rounded-full border border-[var(--line)] bg-white px-5 py-3 text-sm font-semibold text-[var(--surface-ink)]"
              href="/"
            >
              Back
            </Link>
          </div>
        </section>
      </section>
    </main>
  );
}
