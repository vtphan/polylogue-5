"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LENS_LABELS, LENS_QUESTIONS } from "../types";
import { LENS_ICONS } from "@/lib/constants/lens-colors";
import type { LensId } from "@/lib/constants/lens-colors";

export function LensAssignmentScreen({
  sessionId,
  mode,
  existingLens,
  onAssigned,
}: {
  sessionId: string;
  mode: string;
  existingLens: string | null;
  onAssigned: (lensId: string) => void;
}) {
  const [selected, setSelected] = useState<string | null>(existingLens);
  const [submitting, setSubmitting] = useState(false);

  // If already assigned, show it and continue
  if (existingLens) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Your Lens</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border-2 border-primary p-4 text-center">
              <p className="text-2xl font-bold">
                {LENS_LABELS[existingLens]}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {LENS_QUESTIONS[existingLens]}
              </p>
            </div>
            <Button className="w-full min-h-[44px] text-base" onClick={() => onAssigned(existingLens)}>
              Start Evaluating
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If mode is "assign", this shouldn't happen (teacher pre-assigns)
  // But handle gracefully — show choice
  async function handleChoose() {
    if (!selected) return;
    setSubmitting(true);

    const res = await fetch(`/api/sessions/${sessionId}/lens-assignment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lensId: selected }),
    });

    if (res.ok) {
      onAssigned(selected);
    }
    setSubmitting(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Choose Your Lens</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Pick the lens you&apos;ll use to evaluate the discussion.
          </p>
          {(["evidence", "logic", "scope"] as LensId[]).map((lens) => (
            <button
              key={lens}
              className={`w-full rounded-lg border-2 p-4 text-left transition-colors min-h-[44px] ${
                selected === lens
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
              onClick={() => setSelected(lens)}
              aria-pressed={selected === lens}
            >
              <p className="font-medium text-base">
                <span aria-hidden="true" className="mr-1.5">{LENS_ICONS[lens]}</span>
                {LENS_LABELS[lens]}
              </p>
              <p className="text-sm text-muted-foreground">
                {LENS_QUESTIONS[lens]}
              </p>
            </button>
          ))}
          <Button
            className="w-full min-h-[44px] text-base"
            disabled={!selected || submitting}
            onClick={handleChoose}
          >
            {submitting ? "Saving..." : "Continue"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
