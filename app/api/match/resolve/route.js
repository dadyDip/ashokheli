import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

const FEE_PERCENT = 2.5;

export async function POST(req) {
  const user = await verifyToken(req);
  if (!user || user.role !== "admin") {
    return new Response("Unauthorized", { status: 401 });
  }

  const { matchId, winners, gameType } = await req.json();

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { players: true },
  });

  if (!match || match.status === "FINISHED") {
    return new Response("Invalid match", { status: 400 });
  }

  const totalPlayers = match.players.length;
  const pot = match.stake * totalPlayers;
  const fee = Math.floor(pot * (FEE_PERCENT / 100));
  const netPot = pot - fee;

  // ✅ MARK MATCH FINISHED
  await prisma.match.update({
    where: { id: matchId },
    data: {
      status: "FINISHED",
      finishedAt: new Date(),
    },
  });

  const allPlayerIds = match.players.map(p => p.userId);
  const loserIds = allPlayerIds.filter(id => !winners.includes(id));

  /* ===================== LOSERS ===================== */
  if (loserIds.length) {
    await prisma.user.updateMany({
      where: { id: { in: loserIds } },
      data: {
        losses: { increment: 1 },
        gamesPlayed: { increment: 1 },
      },
    });

    await prisma.transaction.createMany({
      data: loserIds.map(uid => ({
        userId: uid,
        type: "LOSS",
        amount: match.stake,
        status: "COMPLETED",
      })),
    });
  }

  /* ===================== WINNERS ===================== */
  if (gameType === "CALLBREAK") {
    const winnerId = winners[0];

    await prisma.user.update({
      where: { id: winnerId },
      data: {
        balance: { increment: netPot },
        wins: { increment: 1 },
        gamesPlayed: { increment: 1 },
      },
    });

    await prisma.transaction.create({
      data: {
        userId: winnerId,
        type: "WIN",
        amount: netPot,
        status: "COMPLETED",
      },
    });
  }

  if (gameType === "SEVEN") {
    const splitAmount = Math.floor(netPot / winners.length);

    await prisma.user.updateMany({
      where: { id: { in: winners } },
      data: {
        balance: { increment: splitAmount },
        wins: { increment: 1 },
        gamesPlayed: { increment: 1 },
      },
    });

    await prisma.transaction.createMany({
      data: winners.map(uid => ({
        userId: uid,
        type: "WIN",
        amount: splitAmount,
        status: "COMPLETED",
      })),
    });
  }

  return Response.json({ success: true });
}
