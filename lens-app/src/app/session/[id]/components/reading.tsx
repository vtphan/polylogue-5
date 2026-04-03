"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import type { Turn } from "../types";

export function ReadingScreen({
  turns,
  onFinished,
}: {
  turns: Turn[];
  onFinished: () => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [hasScrolledToEnd, setHasScrolledToEnd] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    function handleScroll() {
      if (!el) return;
      const atBottom =
        el.scrollHeight - el.scrollTop - el.clientHeight < 50;
      if (atBottom) setHasScrolledToEnd(true);
    }

    el.addEventListener("scroll", handleScroll);
    // Check immediately in case content fits without scrolling
    handleScroll();
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <div className="border-b p-4 text-center">
        <h2 className="font-medium">Read the Discussion</h2>
        <p className="text-xs text-muted-foreground">
          Scroll through the entire conversation before continuing
        </p>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4"
      >
        <div className="mx-auto max-w-2xl space-y-3">
          {turns.map((turn, i) => (
            <div key={i} className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-medium">
                {turn.speaker.charAt(0)}
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  {turn.speaker}
                </p>
                <p className="text-base">{turn.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t p-4 text-center">
        <Button
          onClick={onFinished}
          disabled={!hasScrolledToEnd}
          className="w-full max-w-sm min-h-[44px] text-base"
        >
          {hasScrolledToEnd
            ? "Continue"
            : "Scroll to the end to continue"}
        </Button>
      </div>
    </div>
  );
}
