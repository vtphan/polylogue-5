-- CreateTable
CREATE TABLE "session_runs" (
    "run_id" TEXT NOT NULL PRIMARY KEY,
    "config_id" TEXT NOT NULL,
    "episode_source" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'in_progress',
    "currentPhase" TEXT NOT NULL DEFAULT 'read',
    "current_level_id" TEXT,
    "reading_complete" BOOLEAN NOT NULL DEFAULT false,
    "started_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "completed_at" DATETIME
);

-- CreateIndex
CREATE INDEX "session_runs_config_id_episode_source_group_id_idx" ON "session_runs"("config_id", "episode_source", "group_id");

-- CreateIndex
CREATE UNIQUE INDEX "session_runs_config_id_episode_source_group_id_student_id_status_key" ON "session_runs"("config_id", "episode_source", "group_id", "student_id", "status");
