import prisma from "../prisma.js";
import { getSystemWallet } from "./systemWallet.js";

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


export async function lockMatchFundsWithAI(matchId) {
  console.log("🔒 [FUNDS+AI] Locking funds:", matchId);

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { players: true },
  });

  if (!match) throw new Error("MATCH_NOT_FOUND");
  if (match.status !== "WAITING") return;

  const stake = match.stake;
  const totalPlayers = match.maxPlayers ?? 4;
  const aiCount = totalPlayers - match.players.length;

  await prisma.$transaction(async (tx) => {
    /* ================= SYSTEM WALLET ================= */
    const systemWallet = await tx.systemWallet.findFirst();
    if (!systemWallet) throw new Error("SYSTEM_WALLET_MISSING");

    const aiTotalStake = aiCount * stake;

    if (systemWallet.balance < aiTotalStake) {
      throw new Error("SYSTEM_FUNDS_LOW");
    }

    // 🔐 LOCK AI FUNDS
    await tx.systemWallet.update({
      where: { id: systemWallet.id },
      data: {
        balance: { decrement: aiTotalStake },
      },
    });


    console.log("🤖 [AI] Locked funds", {
      aiCount,
      aiTotalStake,
    });

    /* ================= HUMAN PLAYERS ================= */
    for (const p of match.players) {
      const user = await tx.user.findUnique({
        where: { id: p.userId },
        select: { balance: true },
      });

      if (!user || user.balance < stake) {
        throw new Error("INSUFFICIENT_BALANCE");
      }

      await tx.user.update({
        where: { id: p.userId },
        data: {
          balance: { decrement: stake },
        },
      });

      await tx.transaction.create({
        data: {
          userId: p.userId,
          type: "LOSS",
          amount: stake,
          status: "PENDING",
          reference: match.id,
        },
      });
    }

    await tx.match.update({
      where: { id: match.id },
      data: { status: "PLAYING" },
    });
  });

  console.log("✅ [FUNDS+AI] Locked successfully");
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

  // ✅ FIX: include AI money in the pot
  const totalPlayers = match.maxPlayers ?? 4; // total seats including AI
  const distributable = totalPlayers * stake;

  const playerIds = match.players.map(p => p.userId);
  const fee = Math.floor(distributable * 0.025);
  const pot = distributable - fee;

  await prisma.$transaction(async (tx) => {
    // 🔓 unlock human players only
    if (playerIds.length > 0) {
      await tx.user.updateMany({
        where: { id: { in: playerIds } },
        data: {
          lockedBalance: { decrement: stake },
        },
      });
    }

    // mark losses completed
    await tx.transaction.updateMany({
      where: {
        reference: match.id,
        type: "LOSS",
        status: "PENDING",
      },
      data: { status: "COMPLETED" },
    });

    // 🏆 pay human winner (includes AI stakes)
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

    // mark match finished
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
  const totalPlayers = match.maxPlayers ?? 4; // total seats including AI
  const totalPot = totalPlayers * stake;

  // 💸 2.5% platform fee
  const fee = Math.floor(totalPot * 0.025);
  const distributable = totalPot - fee;

  // Split among winners
  const perWinner = Math.floor(distributable / winnerUserIds.length);

  const allHumanIds = match.players
    .filter(p => !p.isAI)
    .map(p => p.userId);

  const allUserIds = match.players.map(p => p.userId);

  await prisma.$transaction(async (tx) => {
    const systemWallet = await getSystemWallet(tx);

    // 🔓 unlock human players only
    if (allHumanIds.length > 0) {
      await tx.user.updateMany({
        where: { id: { in: allHumanIds } },
        data: { lockedBalance: { decrement: stake } },
      });
    }

    // mark losses completed for all humans
    await tx.transaction.updateMany({
      where: {
        reference: match.id,
        type: "LOSS",
        status: "PENDING",
      },
      data: { status: "COMPLETED" },
    });

    // 🏆 pay winners
    for (const winnerId of winnerUserIds) {
      const winnerPlayer = match.players.find(p => p.userId === winnerId);

      if (winnerPlayer?.isAI) {
        // AI winners → system wallet
        await tx.systemWallet.update({
          where: { id: systemWallet.id },
          data: { balance: { increment: perWinner } },
        });

        await tx.transaction.create({
          data: {
            type: "WIN",
            amount: perWinner,
            status: "COMPLETED",
            reference: match.id,
            provider: "SYSTEM",
          },
        });
      } else {
        // Human winners → get share (includes AI stakes)
        await tx.user.update({
          where: { id: winnerId },
          data: {
            balance: { increment: perWinner },
            wins: { increment: 1 },
          },
        });

        await tx.transaction.create({
          data: {
            userId: winnerId,
            type: "WIN",
            amount: perWinner,
            status: "COMPLETED",
            reference: match.id,
          },
        });
      }
    }

    // mark match finished
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


export async function settleMatchWithAI(matchId, winner) {
  console.log("🏁 [FUNDS+AI] Settling match:", matchId);

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { players: true },
  });

  if (!match || match.status === "FINISHED") return;

  const stake = match.stake;
  const totalPlayers = match.maxPlayers ?? 4; // AI included
  const totalPot = totalPlayers * stake;

  const fee = Math.floor(totalPot * 0.025);
  const pot = totalPot - fee;

  await prisma.$transaction(async (tx) => {
    const systemWallet = await getSystemWallet(tx);

    // 🔓 unlock humans only (AI money is in system wallet already)
    const humanIds = match.players.filter(p => !p.isAI).map(p => p.userId);
    if (humanIds.length > 0) {
      await tx.user.updateMany({
        where: { id: { in: humanIds } },
        data: { lockedBalance: { decrement: stake } },
      });
    }

    // mark losses done
    await tx.transaction.updateMany({
      where: {
        reference: match.id,
        type: "LOSS",
        status: "PENDING",
      },
      data: { status: "COMPLETED" },
    });

    if (winner.isAI) {
      // 🤖 AI wins → system wallet gets full pot
      await tx.systemWallet.update({
        where: { id: systemWallet.id },
        data: { balance: { increment: pot } },
      });

      await tx.transaction.create({
        data: {
          type: "WIN",
          amount: pot,
          status: "COMPLETED",
          reference: match.id,
          provider: "SYSTEM",
        },
      });

    } else {
      // 👤 HUMAN wins → human gets full pot (including AI stakes)
      await tx.user.update({
        where: { id: winner.userId },
        data: {
          balance: { increment: pot },
          wins: { increment: 1 },
        },
      });

      await tx.transaction.create({
        data: {
          userId: winner.userId,
          type: "WIN",
          amount: pot,
          status: "COMPLETED",
          reference: match.id,
        },
      });
    }

    // mark match finished
    await tx.match.update({
      where: { id: match.id },
      data: {
        status: "FINISHED",
        finishedAt: new Date(),
      },
    });
  });

  console.log("🏆 [FUNDS+AI] Match settled", {
    matchId,
    winner: winner.isAI ? "SYSTEM" : winner.userId,
    pot,
  });
}
