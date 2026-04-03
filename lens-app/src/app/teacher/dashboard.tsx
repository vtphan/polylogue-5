"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
import { PedagogyPrimer } from "@/components/pedagogy-primer";

interface ClassSummary {
  id: string;
  name: string;
  section: string | null;
  _count: { enrollments: number; sessions: number };
}

const PRIMER_SEEN_KEY = "polylogue_primer_seen";

export function TeacherDashboardClient() {
  const router = useRouter();
  const [classes, setClasses] = useState<ClassSummary[]>([]);
  const [name, setName] = useState("");
  const [section, setSection] = useState("");
  const [creating, setCreating] = useState(false);
  const [showPrimer, setShowPrimer] = useState(false);

  // Show primer on first visit
  useEffect(() => {
    if (!localStorage.getItem(PRIMER_SEEN_KEY)) {
      setShowPrimer(true);
    }
  }, []);

  async function loadClasses() {
    const res = await fetch("/api/classes");
    if (res.ok) setClasses(await res.json());
  }

  useEffect(() => {
    loadClasses();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);

    const res = await fetch("/api/classes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, section: section || undefined }),
    });

    if (res.ok) {
      setName("");
      setSection("");
      loadClasses();
    }
    setCreating(false);
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", {
      method: "POST",
      headers: { "Accept": "application/json" },
    });
    router.push("/login");
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-8 sm:py-8">
      {showPrimer && (
        <PedagogyPrimer
          onClose={() => {
            setShowPrimer(false);
            localStorage.setItem(PRIMER_SEEN_KEY, "1");
          }}
        />
      )}

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Teacher Dashboard</h1>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowPrimer(true)}
            className="text-sm text-muted-foreground underline hover:text-foreground"
          >
            How it works
          </button>
          <button
            onClick={handleLogout}
            className="text-sm text-muted-foreground underline hover:text-foreground"
          >
            Sign out
          </button>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Create Class</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="flex flex-wrap items-end gap-3">
            <div className="space-y-2">
              <Label htmlFor="className">Name</Label>
              <Input
                id="className"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Period 3"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="section">Section</Label>
              <Input
                id="section"
                value={section}
                onChange={(e) => setSection(e.target.value)}
                placeholder="6A"
              />
            </div>
            <Button type="submit" disabled={creating}>
              Create
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {classes.map((c) => (
          <Link key={c.id} href={`/teacher/class/${c.id}`}>
            <Card className="cursor-pointer transition-colors hover:bg-accent/50">
              <CardHeader>
                <CardTitle>
                  {c.name}
                  {c.section && (
                    <span className="ml-2 text-sm font-normal text-muted-foreground">
                      {c.section}
                    </span>
                  )}
                </CardTitle>
                <CardDescription>
                  {c._count.enrollments} student{c._count.enrollments !== 1 ? "s" : ""}
                  {" · "}
                  {c._count.sessions} session{c._count.sessions !== 1 ? "s" : ""}
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
        {classes.length === 0 && (
          <p className="text-sm text-muted-foreground">No classes yet.</p>
        )}
      </div>
    </div>
  );
}
