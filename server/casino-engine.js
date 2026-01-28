import prisma from "./prisma.js";

export async function lockCasinoFunds({ userId, stake, gameType, matchId }) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { balance: true, lockedBalance: true },
  });

  if (!user) throw new Error("USER_NOT_FOUND");
  if (user.balance < stake) throw new Error("INSUFFICIENT_BALANCE");

  const transaction = await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: {
        balance: { decrement: stake },
        lockedBalance: { increment: stake },
      },
    }),

    prisma.casinoGame.create({
      data: {
        userId,
        stake,
        gameType,
        matchId,
        status: "PLAYING",
        metadata: { timestamp: new Date().toISOString() }
      },
    }),

    // Update system stats
    prisma.systemStats.upsert({
      where: { id: 1 },
      update: {
        totalBets: { increment: 1 },
        totalVolume: { increment: stake },
        [`${gameType.toLowerCase()}Bets`]: { increment: 1 },
        [`${gameType.toLowerCase()}Volume`]: { increment: stake }
      },
      create: {
        id: 1,
        totalBets: 1,
        totalVolume: stake,
        [`${gameType.toLowerCase()}Bets`]: 1,
        [`${gameType.toLowerCase()}Volume`]: stake
      }
    })
  ]);

  return transaction;
}

export async function settleCasinoFunds({ matchId, winAmount }) {
  const game = await prisma.casinoGame.findFirst({
    where: { matchId, status: "PLAYING" },
    include: { user: { select: { id: true } } }
  });

  if (!game) throw new Error("GAME_NOT_FOUND");

  const result = winAmount > 0 ? "WIN" : "LOSS";
  const profit = game.stake - winAmount; // House profit

  const transaction = await prisma.$transaction([
    // Update user balance
    prisma.user.update({
      where: { id: game.userId },
      data: {
        lockedBalance: { decrement: game.stake },
        balance: { increment: winAmount },
        totalWagered: { increment: game.stake },
        totalWon: { increment: winAmount },
        wins: result === "WIN" ? { increment: 1 } : undefined,
        losses: result === "LOSS" ? { increment: 1 } : undefined,
        ...(result === "WIN" && {
          biggestWin: winAmount > (game.user.biggestWin || 0) 
            ? winAmount 
            : undefined
        })
      },
    }),

    // Update game record
    prisma.casinoGame.update({
      where: { id: game.id },
      data: {
        status: "FINISHED",
        result,
        winAmount,
        profit: -profit, // Negative = user win, positive = house win
        finishedAt: new Date(),
        metadata: {
          ...(game.metadata || {}),
          settledAt: new Date().toISOString()
        }
      },
    }),

    // Update system stats
    prisma.systemStats.upsert({
      where: { id: 1 },
      update: {
        totalProfit: { increment: profit },
        [`${game.gameType.toLowerCase()}Profit`]: { increment: profit },
        ...(result === "WIN" 
          ? { totalWins: { increment: 1 } }
          : { totalLosses: { increment: 1 } }
        )
      },
      create: {
        id: 1,
        totalProfit: profit,
        [`${game.gameType.toLowerCase()}Profit`]: profit,
        totalWins: result === "WIN" ? 1 : 0,
        totalLosses: result === "LOSS" ? 1 : 0
      }
    }),

    // Record transaction for audit
    prisma.transaction.create({
      data: {
        userId: game.userId,
        type: "CASINO_" + result,
        amount: result === "WIN" ? winAmount : -game.stake,
        gameId: game.id,
        description: `${game.gameType} ${result.toLowerCase()}`,
        balanceBefore: game.user.balance,
        balanceAfter: game.user.balance - game.stake + winAmount
      }
    })
  ]);

  return transaction;
}

// Recovery function for unfinished games
export async function recoverUnfinishedSlotGames() {
  const unfinishedGames = await prisma.casinoGame.findMany({
    where: {
      gameType: "SLOT",
      status: "PLAYING",
      createdAt: { lt: new Date(Date.now() - 5 * 60 * 1000) } // Older than 5 mins
    },
    include: { user: true }
  });

  for (const game of unfinishedGames) {
    // Force settle as loss for stuck games
    await settleCasinoFunds({
      matchId: game.matchId,
      winAmount: 0
    });
    console.log(`Recovered stuck SLOT game: ${game.matchId}`);
  }

  return unfinishedGames.length;
}