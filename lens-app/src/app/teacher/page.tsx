import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";

export default async function TeacherDashboard() {
  const session = await getSession();
  if (!session.userId || session.role !== "teacher") {
    redirect("/login");
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Teacher Dashboard</h1>
      <p className="mt-2 text-muted-foreground">
        Logged in as {session.username}
      </p>
    </div>
  );
}
