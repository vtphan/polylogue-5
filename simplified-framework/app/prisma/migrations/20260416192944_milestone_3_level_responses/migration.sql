-- CreateTable
CREATE TABLE "level_responses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "run_id" TEXT NOT NULL,
    "level_id" TEXT NOT NULL,
    "initial_answer" TEXT NOT NULL,
    "final_answer" TEXT NOT NULL,
    "used_hint" BOOLEAN NOT NULL DEFAULT false,
    "answer_changed" BOOLEAN NOT NULL DEFAULT false,
    "completed_at" DATETIME NOT NULL,
    CONSTRAINT "level_responses_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "session_runs" ("run_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "scaffold_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "run_id" TEXT NOT NULL,
    "level_id" TEXT NOT NULL,
    "step_key" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "scaffold_events_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "session_runs" ("run_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "level_responses_run_id_idx" ON "level_responses"("run_id");

-- CreateIndex
CREATE UNIQUE INDEX "level_responses_run_id_level_id_key" ON "level_responses"("run_id", "level_id");

-- CreateIndex
CREATE INDEX "scaffold_events_run_id_level_id_idx" ON "scaffold_events"("run_id", "level_id");

-- CreateIndex
CREATE UNIQUE INDEX "scaffold_events_run_id_level_id_step_key_key" ON "scaffold_events"("run_id", "level_id", "step_key");
