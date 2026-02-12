// app/api/wallet/summary/route.js - SIMPLIFIED VERSION
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || "SUPER_SECRET_KEY";

export async function GET(req) {
  try {
    const auth = req.headers.get("authorization");
    if (!auth || !auth.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = auth.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.id;

    if (!userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Get user and active bonuses
    const [user, activeBonuses] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          balance: true,
          lockedBalance: true,
          totalDeposited: true,
          totalWithdrawn: true,
          totalTurnover: true,
          gamesPlayed: true,
          wins: true,
          losses: true,
          isFirstDepositBonusClaimed: true,
          promoCode: true,
          totalBonusGiven: true
        }
      }),
      prisma.bonus.findMany({
        where: {
          userId: userId,
          status: "active"
        }
      })
    ]);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Calculate totals
    let totalBonusAmount = 0;
    let totalRequiredTurnover = 0;
    let totalCompletedTurnover = 0;
    let allBonusesCompleted = true;

    activeBonuses.forEach(bonus => {
      totalBonusAmount += bonus.amount;
      totalRequiredTurnover += bonus.turnoverAmount;
      totalCompletedTurnover += bonus.currentTurnover;
      
      if (bonus.currentTurnover < bonus.turnoverAmount) {
        allBonusesCompleted = false;
      }
    });

    // SIMPLE LOGIC:
    // If balance is locked, user cannot withdraw ANYTHING
    // If balance is unlocked, user can withdraw everything
    const canWithdraw = user.lockedBalance === 0 || allBonusesCompleted;
    const withdrawableBalance = canWithdraw ? user.balance : 0;

    return NextResponse.json({
      ...user,
      totalBalance: user.balance,
      canWithdraw: canWithdraw,
      withdrawableBalance: withdrawableBalance,
      isBalanceLocked: user.lockedBalance > 0,
      bonusInfo: {
        totalActiveBonuses: activeBonuses.length,
        totalBonusAmount: totalBonusAmount,
        totalRequiredTurnover: totalRequiredTurnover,
        totalCompletedTurnover: totalCompletedTurnover,
        remainingTurnover: Math.max(0, totalRequiredTurnover - totalCompletedTurnover),
        progress: totalRequiredTurnover > 0 
          ? Math.round((totalCompletedTurnover / totalRequiredTurnover) * 100) 
          : 100,
        activeBonuses: activeBonuses.map(b => ({
          type: b.type,
          amount: b.amount / 100,
          requiredTurnover: b.turnoverAmount / 100,
          completedTurnover: b.currentTurnover / 100,
          progress: b.turnoverAmount > 0 
            ? Math.round((b.currentTurnover / b.turnoverAmount) * 100) 
            : 100,
          isCompleted: b.currentTurnover >= b.turnoverAmount
        }))
      },
      // Simple messages for frontend
      messages: {
        balanceStatus: user.lockedBalance > 0 
          ? "⚠️ Your balance is locked. Complete turnover to unlock withdrawal." 
          : "✅ Your balance is unlocked and ready for withdrawal.",
        withdrawalStatus: canWithdraw 
          ? `You can withdraw up to ${withdrawableBalance / 100}৳` 
          : "Complete bonus turnover to withdraw",
        turnoverStatus: totalRequiredTurnover > 0 
          ? `Play ${(totalRequiredTurnover - totalCompletedTurnover) / 100}৳ more to unlock balance`
          : "No turnover requirements"
      }
    });
  } catch (err) {
    console.error("Wallet summary error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}