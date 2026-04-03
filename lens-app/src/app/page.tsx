import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";

export default async function Home() {
  const session = await getSession();

  if (!session.userId) {
    redirect("/login");
  }

  // Redirect authenticated users to their dashboard
  switch (session.role) {
    case "researcher":
      redirect("/researcher");
    case "teacher":
      redirect("/teacher");
    case "student":
      redirect("/student-dashboard");
    default:
      redirect("/login");
  }
}
