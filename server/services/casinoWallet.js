import prisma from "../prisma.js";

export async function lockCasinoFunds({ userId, stake, gameType, matchId }) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { balance: true },
  });

  if (!user) throw new Error("USER_NOT_FOUND");
  if (user.balance < stake) throw new Error("INSUFFICIENT_BALANCE");

  await prisma.$transaction([
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
      },
    }),
  ]);
}

export async function settleCasinoFunds({ matchId, winAmount }) {
  const game = await prisma.casinoGame.findFirst({
    where: { matchId, status: "PLAYING" },
  });

  if (!game) throw new Error("GAME_NOT_FOUND");

  const result = winAmount > 0 ? "WIN" : "LOSS";

  await prisma.$transaction([
    prisma.user.update({
      where: { id: game.userId },
      data: {
        lockedBalance: { decrement: game.stake },
        balance: { increment: winAmount },
        wins: result === "WIN" ? { increment: 1 } : undefined,
        losses: result === "LOSS" ? { increment: 1 } : undefined,
      },
    }),

    prisma.casinoGame.update({
      where: { id: game.id },
      data: {
        status: "FINISHED",
        result,
        winAmount,
        finishedAt: new Date(),
      },
    }),
  ]);
}
