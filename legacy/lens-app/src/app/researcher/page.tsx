import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScenarioPanel } from "./scenarios";
import { TeacherPanel } from "./teachers";

export default function ResearcherDashboard() {
  return (
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
  );
}
