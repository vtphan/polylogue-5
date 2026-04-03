import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { ClassDetailClient } from "./class-detail";

export default async function ClassDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session.userId || session.role !== "teacher") {
    redirect("/login");
  }

  const { id } = await params;
  return <ClassDetailClient classId={id} />;
}
