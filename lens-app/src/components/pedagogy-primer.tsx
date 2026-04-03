"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PRIMER_CARDS = [
  {
    title: "What students will do",
    content:
      "Students read a scripted group discussion, then evaluate the reasoning through different lenses, then explain why the group thought the way they did. The whole session takes about 50 minutes.",
  },
  {
    title: "Lenses",
    content:
      "There are three ways of looking at reasoning: Logic (does the argument hold?), Evidence (is the claim supported?), and Scope (is the analysis thorough?). Each student gets one lens, so the group sees the discussion from multiple angles.",
  },
  {
    title: "The four steps",
    content:
      "Each phase has four steps: individual thinking first, then peer discussion (face-to-face), then an expert perspective, then group consensus on whether they agree with the expert. Each step builds on the last.",
  },
  {
    title: "Why peer discussion matters",
    content:
      "Students with different lenses notice different things. The peer step makes those differences visible and productive. Discussion happens face-to-face; the app just makes thinking persistent and shareable.",
  },
  {
    title: "The expert is not the answer",
    content:
      "The AI perspective is framed as one more voice, not the correct answer. The consensus step is where students decide whether they buy it. Disagreeing is legitimate — that\u2019s the point.",
  },
];

interface PrimerProps {
  onClose: () => void;
}

export function PedagogyPrimer({ onClose }: PrimerProps) {
  const [page, setPage] = useState(0);

  const card = PRIMER_CARDS[page];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <Card className="mx-4 w-full max-w-md">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {page + 1} of {PRIMER_CARDS.length}
            </p>
            <Button variant="ghost" size="sm" onClick={onClose}>
              Skip
            </Button>
          </div>
          <CardTitle className="text-lg">{card.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm leading-relaxed">{card.content}</p>

          {/* Progress dots */}
          <div className="flex justify-center gap-1.5" role="tablist" aria-label="Primer progress">
            {PRIMER_CARDS.map((_, i) => (
              <button
                key={i}
                className={`h-2 w-2 rounded-full transition-colors ${
                  i === page ? "bg-primary" : "bg-muted"
                }`}
                onClick={() => setPage(i)}
                aria-label={`Page ${i + 1}`}
                aria-selected={i === page}
                role="tab"
              />
            ))}
          </div>

          <div className="flex justify-between">
            <Button
              variant="ghost"
              onClick={() => setPage((p) => p - 1)}
              disabled={page === 0}
            >
              Back
            </Button>
            {page < PRIMER_CARDS.length - 1 ? (
              <Button onClick={() => setPage((p) => p + 1)}>Next</Button>
            ) : (
              <Button onClick={onClose}>Got it</Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
