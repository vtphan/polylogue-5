import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { SessionWizard } from "./wizard";

export default async function NewSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session.userId || session.role !== "teacher") {
    redirect("/login");
  }

  const { id } = await params;
  return <SessionWizard classId={id} />;
}
