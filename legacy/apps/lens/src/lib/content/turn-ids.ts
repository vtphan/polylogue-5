const TRANSCRIPT_PREFIX = "turn_";

export function transcriptTurnIdToAppKey(turnId: string): string {
  if (!turnId.startsWith(TRANSCRIPT_PREFIX)) {
    throw new Error(`Expected transcript turn id, received "${turnId}"`);
  }

  return `t${turnId.slice(TRANSCRIPT_PREFIX.length)}`;
}

export function appKeyToTranscriptTurnId(turnKey: string): string {
  if (!/^t\d+$/.test(turnKey)) {
    throw new Error(`Expected app turn key, received "${turnKey}"`);
  }

  return `${TRANSCRIPT_PREFIX}${turnKey.slice(1)}`;
}
