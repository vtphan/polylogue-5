import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { TeacherDashboardClient } from "./dashboard";

export default async function TeacherDashboard() {
  const session = await getSession();
  if (!session.userId || session.role !== "teacher") {
    redirect("/login");
  }

  return <TeacherDashboardClient />;
}
