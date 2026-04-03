"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface StudentEntry {
  id: string;
  fullName: string;
}

export default function StudentLoginPage() {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState("");
  const [students, setStudents] = useState<StudentEntry[] | null>(null);
  const [sessionId, setSessionId] = useState("");
  const [topic, setTopic] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleJoinCode(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/student-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ joinCode }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Invalid join code");
        return;
      }

      const data = await res.json();
      setSessionId(data.sessionId);
      setTopic(data.topic);
      setStudents(data.students);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSelectStudent(studentId: string) {
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/student-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ joinCode, studentId }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Login failed");
        return;
      }

      router.push(`/session/${sessionId}`);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Step 1: Enter join code
  if (!students) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle className="text-2xl">Join Session</CardTitle>
            <CardDescription>
              Enter the code your teacher shared.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleJoinCode} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="joinCode">Join Code</Label>
                <Input
                  id="joinCode"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="ABC123"
                  className="text-center text-2xl tracking-widest"
                  required
                />
              </div>
              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Looking up..." : "Join"}
              </Button>
            </form>
            <div className="mt-4 text-center text-sm text-muted-foreground">
              <a href="/login" className="underline">
                Teacher or researcher? Sign in here
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Step 2: Select name from roster
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">Select Your Name</CardTitle>
          <CardDescription>{topic}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {students.map((s) => (
              <Button
                key={s.id}
                variant="outline"
                className="w-full justify-start min-h-[44px] text-base"
                onClick={() => handleSelectStudent(s.id)}
                disabled={loading}
              >
                {s.fullName}
              </Button>
            ))}
          </div>
          {error && (
            <p className="mt-2 text-sm text-red-600">{error}</p>
          )}
          <div className="mt-4">
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => {
                setStudents(null);
                setError("");
              }}
            >
              Back
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
