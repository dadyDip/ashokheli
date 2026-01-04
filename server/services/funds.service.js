import prisma from "../prisma.js";

/* =====================================================
   LOCK FUNDS — CALLED ONCE WHEN MATCH STARTS
===================================================== */
export async function lockMatchFunds(matchId) {
  console.log("🔒 [FUNDS] Locking funds for match:", matchId);

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { players: true },
  });

  if (!match) {
    console.error("❌ [FUNDS] Match not found:", matchId);
    throw new Error("MATCH_NOT_FOUND");
  }

  if (match.status !== "WAITING") {
    console.warn("⚠️ [FUNDS] Match already locked:", matchId);
    return;
  }

  const stake = match.stake;

  await prisma.$transaction(async (tx) => {
    for (const p of match.players) {
      const user = await tx.user.findUnique({
        where: { id: p.userId },
        select: { balance: true, lockedBalance: true },
      });

      if (!user || user.balance < stake) {
        console.error("❌ [FUNDS] Insufficient balance", {
          userId: p.userId,
          balance: user?.balance,
          stake,
        });
        throw new Error("INSUFFICIENT_BALANCE");
      }

      // 🔐 MOVE balance → lockedBalance
      await tx.user.update({
        where: { id: p.userId },
        data: {
          balance: { decrement: stake },
          lockedBalance: { increment: stake },
        },
      });

      // 🧾 audit log
      await tx.transaction.create({
        data: {
          userId: p.userId,
          type: "LOSS",
          amount: stake,
          status: "PENDING",
          reference: match.id,
        },
      });

      console.log("🔐 [FUNDS] Locked", {
        userId: p.userId,
        stake,
      });
    }

    await tx.match.update({
      where: { id: match.id },
      data: { status: "PLAYING" },
    });
  });

  console.log("✅ [FUNDS] Funds locked for match:", matchId);
}

/* =====================================================
   SETTLE MATCH — CALLED WHEN GAME ENDS
===================================================== */
export async function settleMatch(matchId, winnerUserId) {
  console.log("🏁 [FUNDS] Settling match:", matchId);

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { players: true },
  });

  if (!match) {
    console.error("❌ [FUNDS] Match not found:", matchId);
    throw new Error("MATCH_NOT_FOUND");
  }

  if (match.status === "FINISHED") {
    console.warn("⚠️ [FUNDS] Match already settled:", matchId);
    return;
  }

  const stake = match.stake;
  const distributable = match.players.length * stake;
  const playerIds = match.players.map(p => p.userId);
  const fee = Math.floor(distributable * 0.025);
  const pot = distributable - fee;

  await prisma.$transaction(async (tx) => {
    // 🔓 unlock everyone
    await tx.user.updateMany({
      where: { id: { in: playerIds } },
      data: {
        lockedBalance: { decrement: stake },
      },
    });

    // mark losses completed
    await tx.transaction.updateMany({
      where: {
        reference: match.id,
        type: "LOSS",
        status: "PENDING",
      },
      data: { status: "COMPLETED" },
    });

    // 🏆 pay winner
    await tx.user.update({
      where: { id: winnerUserId },
      data: {
        balance: { increment: pot },
        wins: { increment: 1 },
      },
    });

    await tx.transaction.create({
      data: {
        userId: winnerUserId,
        type: "WIN",
        amount: pot,
        status: "COMPLETED",
        reference: match.id,
      },
    });

    await tx.match.update({
      where: { id: match.id },
      data: {
        status: "FINISHED",
        finishedAt: new Date(),
      },
    });
  });

  console.log("🏆 [FUNDS] Match settled successfully:", {
    matchId,
    winnerUserId,
    pot,
  });
}
export async function settleTeamMatch(matchId, winnerUserIds) {
  console.log("🏁 [FUNDS] Settling TEAM match:", matchId);

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { players: true },
  });

  if (!match) throw new Error("MATCH_NOT_FOUND");
  if (match.status === "FINISHED") return;

  const stake = match.stake;
  const totalPot = match.players.length * stake;

  // 💸 2.5% platform fee
  const fee = Math.floor(totalPot * 0.025);
  const distributable = totalPot - fee;

  // split 50/50 between winning teammates
  const perWinner = Math.floor(distributable / winnerUserIds.length);

  const allUserIds = match.players.map(p => p.userId);

  await prisma.$transaction(async (tx) => {
    // 🔓 unlock everyone
    await tx.user.updateMany({
      where: { id: { in: allUserIds } },
      data: { lockedBalance: { decrement: stake } },
    });

    // mark losses completed
    await tx.transaction.updateMany({
      where: {
        reference: match.id,
        type: "LOSS",
        status: "PENDING",
      },
      data: { status: "COMPLETED" },
    });

    // 🏆 pay winners
    for (const userId of winnerUserIds) {
      await tx.user.update({
        where: { id: userId },
        data: {
          balance: { increment: perWinner },
          wins: { increment: 1 },
        },
      });

      await tx.transaction.create({
        data: {
          userId,
          type: "WIN",
          amount: perWinner,
          status: "COMPLETED",
          reference: match.id,
        },
      });
    }

    await tx.match.update({
      where: { id: match.id },
      data: {
        status: "FINISHED",
        finishedAt: new Date(),
      },
    });
  });

  console.log("🏆 [FUNDS] TEAM match settled", {
    matchId,
    totalPot,
    fee,
    perWinner,
  });
}

