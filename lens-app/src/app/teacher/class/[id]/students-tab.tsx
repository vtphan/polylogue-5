"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface Student {
  id: string;
  fullName: string;
}

export function StudentsTab({
  classId,
  students,
  onUpdate,
}: {
  classId: string;
  students: Student[];
  onUpdate: () => void;
}) {
  const [namesText, setNamesText] = useState("");
  const [adding, setAdding] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function handleBatchAdd(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);
    setResult(null);

    const names = namesText
      .split("\n")
      .map((n) => n.trim())
      .filter(Boolean);

    const res = await fetch(`/api/classes/${classId}/students`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ names }),
    });

    if (res.ok) {
      const data = await res.json();
      const created = data.results.filter(
        (r: { status: string }) => r.status === "created"
      ).length;
      const existing = data.results.length - created;
      setResult(
        `Added ${data.results.length}: ${created} new, ${existing} existing`
      );
      setNamesText("");
      onUpdate();
    }
    setAdding(false);
  }

  async function handleRemove(studentId: string) {
    await fetch(`/api/classes/${classId}/students`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId }),
    });
    onUpdate();
  }

  return (
    <div className="space-y-4 pt-4">
      <Card>
        <CardHeader>
          <CardTitle>Add Students</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleBatchAdd} className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="names">Student names (one per line)</Label>
              <textarea
                id="names"
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={namesText}
                onChange={(e) => setNamesText(e.target.value)}
                placeholder={"Alex Chen\nJordan Kim\nSam Patel"}
              />
            </div>
            <Button type="submit" disabled={adding}>
              {adding ? "Adding..." : "Add Students"}
            </Button>
            {result && (
              <p className="text-sm text-muted-foreground">{result}</p>
            )}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Enrolled Students ({students.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {students.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No students enrolled.
            </p>
          ) : (
            <div className="space-y-1">
              {students
                .sort((a, b) => a.fullName.localeCompare(b.fullName))
                .map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between rounded px-3 py-2 hover:bg-accent/50"
                  >
                    <span>{s.fullName}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemove(s.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      Remove
                    </Button>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
