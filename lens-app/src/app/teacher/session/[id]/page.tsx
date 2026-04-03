import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { MonitoringDashboard } from "./monitoring";

export default async function SessionMonitorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session.userId || session.role !== "teacher") {
    redirect("/login");
  }

  const { id } = await params;
  return <MonitoringDashboard sessionId={id} />;
}
