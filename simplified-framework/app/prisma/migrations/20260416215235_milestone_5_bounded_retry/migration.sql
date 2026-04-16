-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_level_responses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "run_id" TEXT NOT NULL,
    "level_id" TEXT NOT NULL,
    "initial_answer" TEXT NOT NULL,
    "final_answer" TEXT,
    "used_hint" BOOLEAN NOT NULL DEFAULT false,
    "answer_changed" BOOLEAN NOT NULL DEFAULT false,
    "completed_at" DATETIME,
    CONSTRAINT "level_responses_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "session_runs" ("run_id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_level_responses" ("answer_changed", "completed_at", "final_answer", "id", "initial_answer", "level_id", "run_id", "used_hint") SELECT "answer_changed", "completed_at", "final_answer", "id", "initial_answer", "level_id", "run_id", "used_hint" FROM "level_responses";
DROP TABLE "level_responses";
ALTER TABLE "new_level_responses" RENAME TO "level_responses";
CREATE INDEX "level_responses_run_id_idx" ON "level_responses"("run_id");
CREATE UNIQUE INDEX "level_responses_run_id_level_id_key" ON "level_responses"("run_id", "level_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
