import {
  buildTranscriptTurnIndex,
  buildTurnNormalizationPreview,
} from "@/lib/content/loaders";
import { RuntimeStatePanel } from "@/components/runtime-state-panel";
import { loadDefaultLensBundle } from "@/lib/content/default-bundle";

export default async function ResearchPage() {
  const bundle = await loadDefaultLensBundle().catch((error) => {
    return error;
  });

  if (bundle instanceof Error) {
    return (
      <RuntimeStatePanel
        description="Lens could not load the configured manifest or episode artifacts for the research view."
        detail={bundle.message}
        eyebrow="Load Failure"
        title="The research bundle did not validate."
      />
    );
  }

  const turnIndex = buildTranscriptTurnIndex(bundle.transcript);
  const normalizationPreview = buildTurnNormalizationPreview(
    bundle.transcript,
    bundle.assistivePackage,
  );
  const firstTurn = turnIndex.get("t02");
  const firstPassage = bundle.assistivePackage.analytic_core.passages[0];

  return (
    <main className="min-h-screen px-6 py-8 text-[var(--foreground)] sm:px-8 lg:px-12">
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <div className="lens-panel rounded-[2rem] p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent-strong)]">
            Research View
          </p>
          <h1 className="mt-3 text-4xl leading-tight" style={{ fontFamily: "var(--font-display)" }}>
            Runtime contract and artifact proof for the current Lens bundle.
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-[color:rgba(29,36,48,0.76)]">
            This page is intentionally separate from the student experience. Use it to inspect the loaded
            session config, transcript, and assistive package without exposing those details on the main flow.
          </p>
        </div>

        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="lens-panel rounded-[2rem] p-7">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--moss)]">
              Contract proof
            </div>
            <div className="mt-5 grid gap-3 text-sm leading-6 text-[color:rgba(29,36,48,0.84)]">
              <div>
                Resolved config <code>{bundle.sessionConfig.config_id}</code> against manifest version{" "}
                <code>{bundle.manifest.manifest_version}</code>.
              </div>
              <div>
                Loaded transcript for <code>{bundle.transcript.story_id}</code>, episode{" "}
                <code>{bundle.transcript.episode_number}</code>, with <code>{bundle.transcript.turns.length}</code> turns.
              </div>
              <div>
                Loaded assistive package schema <code>{bundle.assistivePackage.package_meta.schema_version}</code> with{" "}
                <code>{firstPassage?.target_turn_ids.length ?? 0}</code> target turns in the first passage.
              </div>
              <div>
                Normalized sample: <code>{normalizationPreview.transcriptTurnKeys[1]?.transcriptId}</code> maps to{" "}
                <code>{normalizationPreview.transcriptTurnKeys[1]?.turnKey}</code>.
              </div>
              <div>
                Reverse mapping sample: <code>{normalizationPreview.packageTurnKeys[0]?.turnKey}</code> maps to{" "}
                <code>{normalizationPreview.packageTurnKeys[0]?.transcriptId}</code>.
              </div>
              <div>
                Turn <code>t02</code> resolves to speaker <code>{firstTurn?.speaker}</code>.
              </div>
            </div>
          </div>

          <div className="lens-dark-panel rounded-[2rem] p-7 text-white">
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--gold)]">
              Active content
            </div>
            <div className="mt-5 grid gap-4">
              <div className="rounded-[1.25rem] border border-white/12 bg-white/6 p-4 text-sm leading-6 text-white/84">
                Story <code>{bundle.transcript.story_id}</code>, episode <code>{bundle.transcript.episode_number}</code>.
              </div>
              <div className="rounded-[1.25rem] border border-white/12 bg-white/6 p-4 text-sm leading-6 text-white/84">
                Default session config <code>{bundle.sessionConfig.config_id}</code>.
              </div>
              <div className="rounded-[1.25rem] border border-white/12 bg-white/6 p-4 text-sm leading-6 text-white/84">
                Assistive package contains <code>{bundle.assistivePackage.analytic_core.passages.length}</code> passage groupings.
              </div>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
