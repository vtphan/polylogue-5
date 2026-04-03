"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

/* ─── Types ──────────────────────────────────────────────────── */

interface Summary {
  teacherCount: number;
  classCount: number;
  studentCount: number;
  sessionCount: number;
  sessionsByStatus: { draft: number; active: number; closed: number };
  activityByMonth: Record<string, number>;
}

interface TeacherStat {
  id: string;
  fullName: string;
  username: string;
  classCount: number;
  sessionCount: number;
  studentCount: number;
  lastActivity: string;
}

interface TeacherSession {
  id: string;
  status: string;
  joinCode: string | null;
  createdAt: string;
  activatedAt: string | null;
  closedAt: string | null;
  className: string;
  classId: string;
  scenario: { id: string; topic: string } | null;
  _count: { sessionGroups: number };
}

/* ─── Main Component ─────────────────────────────────────────── */

export function ObservatoryDashboard() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [teachers, setTeachers] = useState<TeacherStat[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<string | null>(null);
  const [teacherSessions, setTeacherSessions] = useState<TeacherSession[]>([]);

  useEffect(() => {
    fetch("/api/observatory/summary").then((r) => r.json()).then(setSummary);
    fetch("/api/observatory/teachers").then((r) => r.json()).then(setTeachers);
  }, []);

  useEffect(() => {
    if (!selectedTeacher) {
      setTeacherSessions([]);
      return;
    }
    fetch(`/api/observatory/teachers/${selectedTeacher}/sessions`)
      .then((r) => r.json())
      .then(setTeacherSessions);
  }, [selectedTeacher]);

  if (!summary) {
    return <p className="text-sm text-muted-foreground">Loading observatory data...</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-1 text-xl font-semibold">Observatory</h2>
        <p className="text-sm text-muted-foreground">
          Cross-teacher aggregate view of all activity.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <SummaryCard label="Teachers" value={summary.teacherCount} />
        <SummaryCard label="Classes" value={summary.classCount} />
        <SummaryCard label="Students" value={summary.studentCount} />
        <SummaryCard label="Sessions" value={summary.sessionCount} />
      </div>

      {/* Session Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sessions by Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <StatusBadge label="Draft" count={summary.sessionsByStatus.draft} color="bg-slate-200 text-slate-700" />
            <StatusBadge label="Active" count={summary.sessionsByStatus.active} color="bg-green-100 text-green-700" />
            <StatusBadge label="Closed" count={summary.sessionsByStatus.closed} color="bg-blue-100 text-blue-700" />
          </div>
        </CardContent>
      </Card>

      {/* Activity Chart */}
      {Object.keys(summary.activityByMonth).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Activity Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ActivityChart data={summary.activityByMonth} />
          </CardContent>
        </Card>
      )}

      {/* Teacher Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Teachers</CardTitle>
        </CardHeader>
        <CardContent>
          {teachers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No teachers yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Classes</TableHead>
                  <TableHead>Sessions</TableHead>
                  <TableHead>Students</TableHead>
                  <TableHead>Last Activity</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {teachers.map((t) => (
                  <TableRow
                    key={t.id}
                    className={selectedTeacher === t.id ? "bg-blue-50" : ""}
                  >
                    <TableCell className="font-medium">{t.fullName}</TableCell>
                    <TableCell>{t.classCount}</TableCell>
                    <TableCell>{t.sessionCount}</TableCell>
                    <TableCell>{t.studentCount}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(t.lastActivity).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setSelectedTeacher(selectedTeacher === t.id ? null : t.id)
                        }
                      >
                        {selectedTeacher === t.id ? "Collapse" : "Details"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Teacher Drill-down */}
      {selectedTeacher && teacherSessions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Sessions for {teachers.find((t) => t.id === selectedTeacher)?.fullName}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Scenario</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Groups</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teacherSessions.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">
                      {s.scenario?.topic ?? "—"}
                    </TableCell>
                    <TableCell>{s.className}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          s.status === "active"
                            ? "default"
                            : s.status === "closed"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {s.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{s._count.sessionGroups}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(s.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {selectedTeacher && teacherSessions.length === 0 && (
        <p className="text-sm text-muted-foreground">No sessions for this teacher yet.</p>
      )}
    </div>
  );
}

/* ─── Helper Components ──────────────────────────────────────── */

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}

function StatusBadge({
  label,
  count,
  color,
}: {
  label: string;
  count: number;
  color: string;
}) {
  return (
    <span className={`rounded-full px-3 py-1 text-sm font-medium ${color}`}>
      {label}: {count}
    </span>
  );
}

function ActivityChart({ data }: { data: Record<string, number> }) {
  const entries = Object.entries(data).sort(([a], [b]) => a.localeCompare(b));
  const maxVal = Math.max(...entries.map(([, v]) => v), 1);

  return (
    <div className="flex items-end gap-2" style={{ height: 120 }}>
      {entries.map(([month, count]) => (
        <div key={month} className="flex flex-1 flex-col items-center gap-1">
          <div
            className="w-full rounded-t bg-blue-400"
            style={{ height: `${(count / maxVal) * 100}px` }}
            title={`${month}: ${count} sessions`}
          />
          <span className="text-[10px] text-muted-foreground">
            {month.slice(5)}
          </span>
          <span className="text-[10px] font-medium">{count}</span>
        </div>
      ))}
    </div>
  );
}
