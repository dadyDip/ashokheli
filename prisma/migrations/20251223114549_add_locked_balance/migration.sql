-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "password" TEXT NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
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
    "role" TEXT NOT NULL DEFAULT 'user'
);
INSERT INTO "new_User" ("balance", "createdAt", "email", "firstName", "gamesPlayed", "id", "isBanned", "isVerified", "lastActiveAt", "lastName", "losses", "password", "phone", "role", "totalDeposited", "totalWithdrawn", "updatedAt", "wins") SELECT "balance", "createdAt", "email", "firstName", "gamesPlayed", "id", "isBanned", "isVerified", "lastActiveAt", "lastName", "losses", "password", "phone", "role", "totalDeposited", "totalWithdrawn", "updatedAt", "wins" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
