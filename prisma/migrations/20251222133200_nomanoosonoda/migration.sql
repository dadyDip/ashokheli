-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "gameType" TEXT NOT NULL,
    "stake" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "roomId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" DATETIME
);

-- CreateTable
CREATE TABLE "MatchPlayer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "matchId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isWinner" BOOLEAN,
    "score" INTEGER,
    CONSTRAINT "MatchPlayer_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MatchPlayer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Room" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "gameType" TEXT,
    "maxPlayers" INTEGER,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "entryFee" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'WAITING',
    "hostId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Room_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Room" ("createdAt", "gameType", "hostId", "id", "isPublic", "maxPlayers", "status") SELECT "createdAt", "gameType", "hostId", "id", "isPublic", "maxPlayers", "status" FROM "Room";
DROP TABLE "Room";
ALTER TABLE "new_Room" RENAME TO "Room";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "MatchPlayer_matchId_userId_key" ON "MatchPlayer"("matchId", "userId");
