"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StudentsTab } from "./students-tab";
import { GroupsTab } from "./groups-tab";

interface Student {
  id: string;
  fullName: string;
}

interface GroupMembership {
  student: Student;
}

interface GroupData {
  id: string;
  label: string;
  memberships: GroupMembership[];
}

interface SessionSummary {
  id: string;
  status: string;
  joinCode: string | null;
  createdAt: string;
  scenario: { topic: string };
}

interface ClassData {
  id: string;
  name: string;
  section: string | null;
  enrollments: { student: Student }[];
  groups: GroupData[];
  sessions: SessionSummary[];
}

export function ClassDetailClient({ classId }: { classId: string }) {
  const [classData, setClassData] = useState<ClassData | null>(null);

  const loadClass = useCallback(async () => {
    const res = await fetch(`/api/classes/${classId}`);
    if (res.ok) setClassData(await res.json());
  }, [classId]);

  useEffect(() => {
    loadClass();
  }, [loadClass]);

  if (!classData) {
    return <div className="p-8">Loading...</div>;
  }

  const students = classData.enrollments.map((e) => e.student);

  return (
    <div className="mx-auto max-w-5xl p-8">
      <div className="mb-6">
        <Link
          href="/teacher"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Back to dashboard
        </Link>
        <h1 className="mt-2 text-2xl font-bold">
          {classData.name}
          {classData.section && (
            <span className="ml-2 text-lg font-normal text-muted-foreground">
              {classData.section}
            </span>
          )}
        </h1>
      </div>

      <Tabs defaultValue="students">
        <TabsList>
          <TabsTrigger value="students">
            Students ({students.length})
          </TabsTrigger>
          <TabsTrigger value="groups">
            Groups ({classData.groups.length})
          </TabsTrigger>
          <TabsTrigger value="sessions">
            Sessions ({classData.sessions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="students">
          <StudentsTab
            classId={classId}
            students={students}
            onUpdate={loadClass}
          />
        </TabsContent>

        <TabsContent value="groups">
          <GroupsTab
            classId={classId}
            groups={classData.groups}
            allStudents={students}
            onUpdate={loadClass}
          />
        </TabsContent>

        <TabsContent value="sessions">
          <div className="space-y-4 pt-4">
            <Link href={`/teacher/class/${classId}/session/new`}>
              <Button>New Session</Button>
            </Link>
            {classData.sessions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No sessions yet.</p>
            ) : (
              <div className="space-y-2">
                {classData.sessions.map((s) => (
                  <Link
                    key={s.id}
                    href={
                      s.status === "active" || s.status === "closed"
                        ? `/teacher/session/${s.id}`
                        : `/teacher/class/${classId}/session/new`
                    }
                  >
                    <div className="flex cursor-pointer items-center justify-between rounded-lg border p-4 transition-colors hover:bg-accent/50">
                      <div>
                        <p className="font-medium">{s.scenario.topic}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(s.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        {s.joinCode && (
                          <span className="font-mono text-sm">
                            {s.joinCode}
                          </span>
                        )}
                        <Badge
                          variant={
                            s.status === "active"
                              ? "default"
                              : s.status === "draft"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {s.status}
                        </Badge>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
