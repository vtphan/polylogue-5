-- CreateTable
CREATE TABLE "students" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "catalog_stories" (
    "story_id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "premise" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "catalog_episodes" (
    "story_id" TEXT NOT NULL,
    "episode_id" TEXT NOT NULL,
    "episode_title" TEXT NOT NULL,
    "lesson_package_path" TEXT NOT NULL,
    "transcript_path" TEXT NOT NULL,
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,

    PRIMARY KEY ("story_id", "episode_id")
);

-- CreateTable
CREATE TABLE "runs" (
    "run_id" TEXT NOT NULL PRIMARY KEY,
    "student_id" TEXT NOT NULL,
    "story_id" TEXT NOT NULL,
    "episode_id" TEXT NOT NULL,
    "current_scene_index" INTEGER NOT NULL DEFAULT 0,
    "scene_high_water_mark" INTEGER NOT NULL DEFAULT 0,
    "stars_earned" INTEGER NOT NULL DEFAULT 0,
    "reading_finished_at" DATETIME,
    "started_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "runs_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "runs_story_id_episode_id_fkey" FOREIGN KEY ("story_id", "episode_id") REFERENCES "catalog_episodes" ("story_id", "episode_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "quiz_attempts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "run_id" TEXT NOT NULL,
    "level_id" TEXT NOT NULL,
    "turn_id" TEXT NOT NULL,
    "step1_first_option" TEXT,
    "step1_final_option" TEXT,
    "step1_locked_at" DATETIME,
    "step2_option" TEXT,
    "step3_first_option" TEXT,
    "step3_final_option" TEXT,
    "step3_locked_at" DATETIME,
    "used_hint" BOOLEAN NOT NULL DEFAULT false,
    "stars_earned" INTEGER NOT NULL DEFAULT 0,
    "locked_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "quiz_attempts_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "runs" ("run_id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "runs_student_id_idx" ON "runs"("student_id");

-- CreateIndex
CREATE INDEX "runs_story_id_episode_id_idx" ON "runs"("story_id", "episode_id");

-- CreateIndex
CREATE UNIQUE INDEX "runs_student_id_story_id_episode_id_key" ON "runs"("student_id", "story_id", "episode_id");

-- CreateIndex
CREATE INDEX "quiz_attempts_run_id_idx" ON "quiz_attempts"("run_id");

-- CreateIndex
CREATE UNIQUE INDEX "quiz_attempts_run_id_level_id_key" ON "quiz_attempts"("run_id", "level_id");
