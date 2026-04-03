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
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{topic}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-base text-muted-foreground">{context}</p>

          {personas.length > 0 && (
            <div>
              <h3 className="mb-2 text-base font-medium">
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

          <p className="text-base font-medium">
            Read the discussion, then we&apos;ll look at it together through
            different lenses.
          </p>

          <Button className="w-full min-h-[44px] text-base" onClick={onContinue}>
            Read the Discussion
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
