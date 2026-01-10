-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Room" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "gameType" TEXT,
    "matchType" TEXT NOT NULL DEFAULT 'target',
    "targetScore" INTEGER NOT NULL DEFAULT 30,
    "maxPlayers" INTEGER,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "entryFee" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'WAITING',
    "hostId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Room_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Room" ("createdAt", "entryFee", "gameType", "hostId", "id", "isPublic", "maxPlayers", "status", "targetScore") SELECT "createdAt", "entryFee", "gameType", "hostId", "id", "isPublic", "maxPlayers", "status", "targetScore" FROM "Room";
DROP TABLE "Room";
ALTER TABLE "new_Room" RENAME TO "Room";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
