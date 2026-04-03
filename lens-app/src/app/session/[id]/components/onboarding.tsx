"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Persona } from "../types";

export function OnboardingScreen({
  topic,
  context,
  personas,
  onContinue,
}: {
  topic: string;
  context: string;
  personas: Persona[];
  onContinue: () => void;
}) {
  return (
    <div className="mx-auto max-w-2xl p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{topic}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{context}</p>

          {personas.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-medium">
                Characters in the discussion
              </h3>
              <div className="flex flex-wrap gap-2">
                {personas.map((p, i) => (
                  <Badge key={i} variant="outline" className="py-1">
                    {p.name}
                    {p.perspective && (
                      <span className="ml-1 font-normal text-muted-foreground">
                        — {p.perspective}
                      </span>
                    )}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <p className="text-sm font-medium">
            Read the discussion, then we&apos;ll look at it together through
            different lenses.
          </p>

          <Button className="w-full" onClick={onContinue}>
            Read the Discussion
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
