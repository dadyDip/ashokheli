-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN "metadata" JSONB;

-- CreateTable
CREATE TABLE "Bonus" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "originalAmount" INTEGER NOT NULL,
    "turnoverAmount" INTEGER NOT NULL,
    "currentTurnover" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "isWithdrawable" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Bonus_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BonusTransaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bonusId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "turnover" INTEGER NOT NULL,
    "gameType" TEXT,
    "matchId" TEXT,
    "metadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BonusTransaction_bonusId_fkey" FOREIGN KEY ("bonusId") REFERENCES "Bonus" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "BonusTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "casinoId" INTEGER,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "password" TEXT NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "bonusBalance" INTEGER NOT NULL DEFAULT 0,
    "totalBonusGiven" INTEGER NOT NULL DEFAULT 0,
    "totalTurnover" INTEGER NOT NULL DEFAULT 0,
    "lastBonusClaimedAt" DATETIME,
    "isFirstDepositBonusClaimed" BOOLEAN NOT NULL DEFAULT false,
    "promoCode" TEXT,
    "referredById" TEXT,
    "lockedBalance" INTEGER NOT NULL DEFAULT 0,
    "totalDeposited" INTEGER NOT NULL DEFAULT 0,
    "totalWithdrawn" INTEGER NOT NULL DEFAULT 0,
    "gamesPlayed" INTEGER NOT NULL DEFAULT 0,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "losses" INTEGER NOT NULL DEFAULT 0,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isBanned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "lastActiveAt" DATETIME,
    "role" TEXT NOT NULL DEFAULT 'user',
    "isAI" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "User_referredById_fkey" FOREIGN KEY ("referredById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_User" ("balance", "casinoId", "createdAt", "firstName", "gamesPlayed", "id", "isAI", "isBanned", "isVerified", "lastActiveAt", "lastName", "lockedBalance", "losses", "password", "phone", "promoCode", "referredById", "role", "totalDeposited", "totalWithdrawn", "updatedAt", "wins") SELECT "balance", "casinoId", "createdAt", "firstName", "gamesPlayed", "id", "isAI", "isBanned", "isVerified", "lastActiveAt", "lastName", "lockedBalance", "losses", "password", "phone", "promoCode", "referredById", "role", "totalDeposited", "totalWithdrawn", "updatedAt", "wins" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_casinoId_key" ON "User"("casinoId");
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");
CREATE UNIQUE INDEX "User_promoCode_key" ON "User"("promoCode");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Bonus_userId_idx" ON "Bonus"("userId");

-- CreateIndex
CREATE INDEX "Bonus_status_idx" ON "Bonus"("status");

-- CreateIndex
CREATE INDEX "Bonus_type_idx" ON "Bonus"("type");

-- CreateIndex
CREATE INDEX "Bonus_expiresAt_idx" ON "Bonus"("expiresAt");

-- CreateIndex
CREATE INDEX "BonusTransaction_bonusId_idx" ON "BonusTransaction"("bonusId");

-- CreateIndex
CREATE INDEX "BonusTransaction_createdAt_idx" ON "BonusTransaction"("createdAt");
