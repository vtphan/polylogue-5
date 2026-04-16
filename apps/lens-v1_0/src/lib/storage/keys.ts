export const SESSION_INDEX_KEY = "lens:v1:session-index";
export const LAST_SESSION_KEY = "lens:v1:ui:last-session";

export function sessionRecordKey(localSessionId: string): string {
  return `lens:v1:session:${localSessionId}`;
}
