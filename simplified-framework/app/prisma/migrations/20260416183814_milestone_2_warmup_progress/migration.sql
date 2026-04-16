-- CreateTable
CREATE TABLE "warmup_progress" (
    "run_id" TEXT NOT NULL PRIMARY KEY,
    "modeled_complete" BOOLEAN NOT NULL DEFAULT false,
    "guided_submitted" BOOLEAN NOT NULL DEFAULT false,
    "guided_selected_answer_id" TEXT,
    "guided_used_hint" BOOLEAN NOT NULL DEFAULT false,
    "guided_complete" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "warmup_progress_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "session_runs" ("run_id") ON DELETE CASCADE ON UPDATE CASCADE
);
