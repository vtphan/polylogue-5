-- CreateTable
CREATE TABLE "catalog_stories" (
    "story_id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "premise" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_catalog_episodes" (
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
INSERT INTO "new_catalog_episodes" ("created_at", "episode_id", "episode_title", "is_available", "lesson_package_path", "story_id", "transcript_path", "updated_at") SELECT "created_at", "episode_id", "episode_title", "is_available", "lesson_package_path", "story_id", "transcript_path", "updated_at" FROM "catalog_episodes";
DROP TABLE "catalog_episodes";
ALTER TABLE "new_catalog_episodes" RENAME TO "catalog_episodes";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
