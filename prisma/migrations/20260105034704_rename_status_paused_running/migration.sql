-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Process" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'paused',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Process" ("createdAt", "description", "id", "name", "status", "updatedAt") SELECT "createdAt", "description", "id", "name", "status", "updatedAt" FROM "Process";
DROP TABLE "Process";
ALTER TABLE "new_Process" RENAME TO "Process";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
