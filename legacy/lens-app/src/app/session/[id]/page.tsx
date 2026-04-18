import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { SessionClient } from "./session-client";

export default async function SessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session.userId || session.role !== "student") {
    redirect("/student-login");
  }

  const { id } = await params;
  return <SessionClient sessionId={id} studentId={session.userId} />;
}
