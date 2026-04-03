import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";

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

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Session</h1>
      <p className="mt-2 text-muted-foreground">
        Welcome, {session.fullName}. Session: {id}
      </p>
    </div>
  );
}
