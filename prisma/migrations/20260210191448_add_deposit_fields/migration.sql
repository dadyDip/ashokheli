/*
  Warnings:

  - Added the required column `updatedAt` to the `DepositRequest` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_DepositRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "trxId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "presetBonusAmount" INTEGER NOT NULL DEFAULT 0,
    "programBonusAmount" INTEGER NOT NULL DEFAULT 0,
    "totalBonusAmount" INTEGER NOT NULL DEFAULT 0,
    "turnoverMultiplier" INTEGER NOT NULL DEFAULT 1,
    "turnoverAmount" INTEGER NOT NULL DEFAULT 0,
    "paymentChannel" TEXT,
    "presetAmount" INTEGER,
    "programId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "approvedAt" DATETIME,
    "rejectedAt" DATETIME,
    "rejectionReason" TEXT,
    CONSTRAINT "DepositRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_DepositRequest" ("amount", "approvedAt", "createdAt", "id", "method", "status", "trxId", "userId") SELECT "amount", "approvedAt", "createdAt", "id", "method", "status", "trxId", "userId" FROM "DepositRequest";
DROP TABLE "DepositRequest";
ALTER TABLE "new_DepositRequest" RENAME TO "DepositRequest";
CREATE UNIQUE INDEX "DepositRequest_trxId_key" ON "DepositRequest"("trxId");
CREATE INDEX "DepositRequest_userId_idx" ON "DepositRequest"("userId");
CREATE INDEX "DepositRequest_status_idx" ON "DepositRequest"("status");
CREATE INDEX "DepositRequest_createdAt_idx" ON "DepositRequest"("createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
