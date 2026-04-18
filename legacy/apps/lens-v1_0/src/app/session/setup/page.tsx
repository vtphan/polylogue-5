import { SessionSetupPage } from "@/features/session/components/session-setup-page";
import { loadDefaultLensBundle } from "@/lib/content/default-bundle";

export default async function SessionSetupRoute() {
  const bundle = await loadDefaultLensBundle();

  return (
    <SessionSetupPage
      episodeTitle="Strangers in the Old Forest"
      sessionConfig={bundle.sessionConfig}
    />
  );
}
