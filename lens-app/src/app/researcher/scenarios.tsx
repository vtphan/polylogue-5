"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Scenario {
  id: string;
  topic: string;
  status: string;
  publishedAt: string;
}

export function ScenarioPanel() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [registryPath, setRegistryPath] = useState("");
  const [importResult, setImportResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadScenarios() {
    const res = await fetch("/api/scenarios");
    if (res.ok) setScenarios(await res.json());
  }

  useEffect(() => {
    loadScenarios();
  }, []);

  async function handleImport(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setImportResult(null);

    try {
      const res = await fetch("/api/scenarios/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registryPath }),
      });
      const data = await res.json();

      if (!res.ok) {
        setImportResult(`Error: ${data.error}`);
        return;
      }

      const imported = data.results.filter(
        (r: { status: string }) => r.status === "imported"
      ).length;
      const skipped = data.results.filter(
        (r: { status: string }) => r.status === "already_imported"
      ).length;
      const errCount = data.errors.length;

      setImportResult(
        `Imported: ${imported}, Skipped: ${skipped}${errCount > 0 ? `, Errors: ${errCount}` : ""}`
      );
      loadScenarios();
    } catch {
      setImportResult("Network error");
    } finally {
      setLoading(false);
    }
  }

  async function toggleStatus(id: string, currentStatus: string) {
    const newStatus = currentStatus === "available" ? "hidden" : "available";
    const res = await fetch(`/api/scenarios/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) loadScenarios();
  }

  return (
    <div className="space-y-6 pt-4">
      <Card>
        <CardHeader>
          <CardTitle>Import Scenarios</CardTitle>
          <CardDescription>
            Import scenario artifacts from the pipeline registry directory.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleImport} className="flex items-end gap-3">
            <div className="flex-1 space-y-2">
              <Label htmlFor="registryPath">Registry Path</Label>
              <Input
                id="registryPath"
                value={registryPath}
                onChange={(e) => setRegistryPath(e.target.value)}
                placeholder="/path/to/registry"
                required
              />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? "Importing..." : "Import"}
            </Button>
          </form>
          {importResult && (
            <p className="mt-3 text-sm text-muted-foreground">{importResult}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Scenarios</CardTitle>
          <CardDescription>
            {scenarios.length} scenario{scenarios.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {scenarios.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No scenarios imported yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Topic</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Published</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scenarios.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.topic}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {s.id}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          s.status === "available" ? "default" : "secondary"
                        }
                      >
                        {s.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(s.publishedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="space-x-1">
                      <Link href={`/researcher/scenario/${s.id}/pipeline`}>
                        <Button variant="ghost" size="sm">
                          Pipeline
                        </Button>
                      </Link>
                      <Link href={`/researcher/scenario/${s.id}/artifacts`}>
                        <Button variant="ghost" size="sm">
                          Artifacts
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleStatus(s.id, s.status)}
                      >
                        {s.status === "available" ? "Hide" : "Show"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
