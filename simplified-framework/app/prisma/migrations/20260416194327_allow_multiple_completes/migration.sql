-- The Milestone 1 schema used a full compound unique on
--   (config_id, episode_source, group_id, student_id, status)
-- which unintentionally also capped completed runs at one per student per
-- episode. §11.13 only ever required "at most one in_progress run" for that
-- tuple. Replace the full unique with a partial unique on in_progress rows,
-- plus a regular composite index for the non-partial lookup path.

-- DropIndex
DROP INDEX "session_runs_config_id_episode_source_group_id_student_id_status_key";

-- CreateIndex (regular; covers createOrResumeRun.findFirst)
CREATE INDEX "session_runs_config_id_episode_source_group_id_student_id_idx" ON "session_runs"("config_id", "episode_source", "group_id", "student_id");

-- CreateIndex (partial unique; enforces "at most one in_progress run" only)
CREATE UNIQUE INDEX "session_runs_open_run_partial_key" ON "session_runs"("config_id", "episode_source", "group_id", "student_id") WHERE "status" = 'in_progress';
