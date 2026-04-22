"use client";

import { useCallback, useEffect, useState } from "react";

type StoryState = {
  storyId: string | null;
  phase: "A" | "B" | "C" | "D";
  storyContent: string | null;
  reviewContent: string | null;
  approved: boolean;
};

export function ArtifactPane({ refreshSignal }: { refreshSignal: number }) {
  const [state, setState] = useState<StoryState | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [approving, setApproving] = useState(false);
  const [approveErrors, setApproveErrors] = useState<string[] | null>(null);

  const fetchStory = useCallback(async () => {
    try {
      const res = await fetch("/api/story", { cache: "no-store" });
      if (!res.ok) throw new Error(`story HTTP ${res.status}`);
      setState((await res.json()) as StoryState);
      setFetchError(null);
    } catch (err) {
      setFetchError(String(err));
    }
  }, []);

  useEffect(() => {
    void fetchStory();
  }, [fetchStory, refreshSignal]);

  async function approve() {
    if (approving) return;
    setApproving(true);
    setApproveErrors(null);
    try {
      const res = await fetch("/api/approve", { method: "POST" });
      const body = (await res.json()) as { ok: boolean; errors?: string[] };
      if (!body.ok) {
        setApproveErrors(body.errors ?? ["unknown error"]);
      } else {
        await fetchStory();
      }
    } catch (err) {
      setApproveErrors([String(err)]);
    } finally {
      setApproving(false);
    }
  }

  const canApprove =
    !!state?.reviewContent && !state.approved && !approving;

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-sm font-semibold text-slate-700">Story artifacts</h2>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          {state?.storyId ? (
            <span className="font-mono">{state.storyId}</span>
          ) : (
            <span className="italic">no story yet</span>
          )}
          <span className="text-slate-300">·</span>
          <span>Phase {state?.phase ?? "—"}</span>
          {state?.approved && (
            <>
              <span className="text-slate-300">·</span>
              <span className="rounded bg-emerald-100 px-2 py-0.5 font-medium text-emerald-800">
                approved
              </span>
            </>
          )}
        </div>
      </div>

      {fetchError && (
        <p className="mb-2 text-xs text-red-600">fetch error: {fetchError}</p>
      )}

      <section className="mb-5">
        <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
          story.yaml
        </h3>
        {state?.storyContent ? (
          <pre className="whitespace-pre-wrap rounded border border-slate-200 bg-white p-3 font-mono text-xs leading-relaxed text-slate-800">
            {state.storyContent}
          </pre>
        ) : (
          <p className="text-xs text-slate-500">
            No commit yet. The agent will emit a{" "}
            <code>commit:story.yaml</code> block once you approve a Phase A draft.
          </p>
        )}
      </section>

      <section>
        <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
          story-design-review.md
        </h3>
        {state?.reviewContent ? (
          <pre className="whitespace-pre-wrap rounded border border-slate-200 bg-white p-3 font-mono text-xs leading-relaxed text-slate-800">
            {state.reviewContent}
          </pre>
        ) : (
          <p className="text-xs text-slate-500">
            No review yet. The agent commits this during Phase D.
          </p>
        )}

        {state?.reviewContent && (
          <div className="mt-3 flex items-start gap-3">
            <button
              type="button"
              onClick={approve}
              disabled={!canApprove}
              className="rounded bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white disabled:bg-slate-400"
            >
              {state.approved
                ? "Approved"
                : approving
                ? "Approving…"
                : "Approve story"}
            </button>
            {approveErrors && approveErrors.length > 0 && (
              <ul className="text-xs text-red-700">
                {approveErrors.map((e, i) => (
                  <li key={i}>• {e}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
