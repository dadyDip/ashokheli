// app/api/turnover/stats/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function GET(req) {
  const user = verifyToken(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get casino spins for turnover stats
    const casinoSpins = await prisma.casinoSpin.findMany({
      where: { userId: user.id },
      select: {
        betAmount: true,
        winAmount: true,
        netResult: true,
        timestamp: true,
        status: true
      },
      orderBy: { timestamp: 'desc' }
    });

    // Calculate totals
    let totalPlayed = 0;
    let totalWon = 0;
    let totalLost = 0;
    let effectiveTurnover = 0;
    let todayTurnover = 0;
    let lastWeekTurnover = 0;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    lastWeek.setHours(0, 0, 0, 0);

    casinoSpins.forEach(spin => {
      totalPlayed += spin.betAmount;
      totalWon += Math.max(0, spin.winAmount);
      totalLost += Math.max(0, spin.betAmount - Math.max(0, spin.winAmount));
      
      // Calculate effective turnover (using your logic from updateTurnover function)
      if (spin.winAmount === 0) {
        effectiveTurnover += spin.betAmount; // Loss
      } else if (spin.winAmount >= spin.betAmount) {
        effectiveTurnover += Math.round(spin.betAmount * 0.005); // Win
      } else {
        effectiveTurnover += (spin.betAmount - spin.winAmount); // Partial win
      }

      // Today's turnover
      if (spin.timestamp >= today) {
        todayTurnover += spin.betAmount;
      }
      
      // Last week turnover
      if (spin.timestamp >= lastWeek) {
        lastWeekTurnover += spin.betAmount;
      }
    });

    // Get bonus turnover info
    const activeBonuses = await prisma.bonus.findMany({
      where: {
        userId: user.id,
        status: { in: ["active", "completed"] }
      },
      select: {
        currentTurnover: true,
        turnoverAmount: true
      }
    });

    let bonusTurnoverCompleted = 0;
    let bonusTurnoverRequired = 0;

    activeBonuses.forEach(bonus => {
      bonusTurnoverCompleted += bonus.currentTurnover;
      bonusTurnoverRequired += bonus.turnoverAmount;
    });

    // Convert from paisa to taka
    return NextResponse.json({
      totalPlayed: (totalPlayed / 100).toFixed(2),
      totalWon: (totalWon / 100).toFixed(2),
      totalLost: (totalLost / 100).toFixed(2),
      effectiveTurnover: (effectiveTurnover / 100).toFixed(2),
      todayTurnover: (todayTurnover / 100).toFixed(2),
      lastWeekTurnover: (lastWeekTurnover / 100).toFixed(2),
      bonusTurnoverCompleted: (bonusTurnoverCompleted / 100).toFixed(2),
      bonusTurnoverRequired: (bonusTurnoverRequired / 100).toFixed(2)
    });

  } catch (error) {
    console.error("Error fetching turnover stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch turnover stats" },
      { status: 500 }
    );
  }
}