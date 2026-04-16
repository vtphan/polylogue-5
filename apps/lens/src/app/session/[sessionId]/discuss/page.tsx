import { SessionStagePage } from "@/features/session/components/session-stage-page";
import { loadDefaultLensBundle } from "@/lib/content/default-bundle";

export default async function SessionDiscussRoute({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const bundle = await loadDefaultLensBundle();

  return (
    <SessionStagePage
      assistivePackage={bundle.assistivePackage}
      episodeTitle="Strangers in the Old Forest"
      sessionId={sessionId}
      stage="discuss"
      transcript={bundle.transcript}
    />
  );
}
