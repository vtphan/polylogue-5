import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { ReviewClient } from "./review-client";

export default async function SessionReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session.userId || (session.role !== "teacher" && session.role !== "researcher")) {
    redirect("/login");
  }

  const { id } = await params;
  return <ReviewClient sessionId={id} />;
}
