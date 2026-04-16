import type { Transcript } from "@/lib/domain";

// Shared "targeted turn plus one adjacent turn before/after when available"
// rule. Used by both warm-up and level screens so first-turn and last-turn
// edge cases stay consistent per §10.30.
export function selectTurnContext(
  transcript: Transcript,
  turnId: string,
): { targetIndex: number; turns: Transcript["turns"] } {
  const targetIndex = transcript.turns.findIndex((turn) => turn.turn_id === turnId);
  if (targetIndex === -1) {
    throw new Error(`Lesson references unknown turn_id "${turnId}"`);
  }
  const start = Math.max(0, targetIndex - 1);
  const end = Math.min(transcript.turns.length, targetIndex + 2);
  return {
    targetIndex: targetIndex - start,
    turns: transcript.turns.slice(start, end),
  };
}
