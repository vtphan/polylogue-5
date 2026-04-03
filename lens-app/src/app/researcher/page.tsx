import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScenarioPanel } from "./scenarios";
import { TeacherPanel } from "./teachers";

export default async function ResearcherDashboard() {
  const session = await getSession();
  if (!session.userId || session.role !== "researcher") {
    redirect("/login");
  }

  return (
    <div className="mx-auto max-w-5xl p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Researcher Dashboard</h1>
        <LogoutButton />
      </div>
      <Tabs defaultValue="scenarios">
        <TabsList>
          <TabsTrigger value="scenarios">Scenarios</TabsTrigger>
          <TabsTrigger value="teachers">Teachers</TabsTrigger>
        </TabsList>
        <TabsContent value="scenarios">
          <ScenarioPanel />
        </TabsContent>
        <TabsContent value="teachers">
          <TeacherPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function LogoutButton() {
  return (
    <form action="/api/auth/logout" method="POST">
      <button
        type="submit"
        className="text-sm text-muted-foreground underline hover:text-foreground"
      >
        Sign out
      </button>
    </form>
  );
}
