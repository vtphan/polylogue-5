import type { Transcript, TranscriptTurn } from "@/lib/domain";

export function getAllTurns(transcript: Transcript): TranscriptTurn[] {
  return transcript.scenes.flatMap((scene) => scene.turns);
}

// Shared "targeted turn plus one adjacent turn before/after when available"
// rule. Turn lookups now cross scenes — turn_id stays the primary key so
// lesson_package.yaml references still resolve.
export function selectTurnContext(
  transcript: Transcript,
  turnId: string,
): { targetIndex: number; turns: TranscriptTurn[] } {
  const all = getAllTurns(transcript);
  const targetIndex = all.findIndex((turn) => turn.turn_id === turnId);
  if (targetIndex === -1) {
    throw new Error(`Lesson references unknown turn_id "${turnId}"`);
  }
  const start = Math.max(0, targetIndex - 1);
  const end = Math.min(all.length, targetIndex + 2);
  return {
    targetIndex: targetIndex - start,
    turns: all.slice(start, end),
  };
}
