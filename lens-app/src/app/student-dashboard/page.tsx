import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { StudentDashboardClient } from "./dashboard-client";

export default async function StudentDashboardPage() {
  const session = await getSession();
  if (!session.userId || session.role !== "student") {
    redirect("/student-login");
  }

  return (
    <StudentDashboardClient
      studentId={session.userId}
      studentName={session.fullName || "Student"}
    />
  );
}
