import { SessionLandingPage } from "@/features/session/components/session-landing-page";

export default async function SessionLandingRoute({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;

  return (
    <SessionLandingPage
      episodeContext="Read together, choose one focal turn, and keep the table focused on the current step."
      episodeTitle="Strangers in the Old Forest"
      sessionId={sessionId}
    />
  );
}
