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

    // Get user with active bonuses
    const [user, allActiveBonuses, completedBonuses] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          firstName: true,
          balance: true,
          lockedBalance: true,
          totalBonusGiven: true,
          totalTurnover: true,
          isFirstDepositBonusClaimed: true,
          promoCode: true,
          totalDeposited: true,
          referredById: true
        }
      }),
      prisma.bonus.findMany({
        where: {
          userId: userId,
          status: "active",
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } }
          ]
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.bonus.findMany({
        where: {
          userId: userId,
          status: { in: ["completed", "used"] }
        },
        orderBy: { updatedAt: 'desc' },
        take: 10
      })
    ]);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Separate bonuses by type
    const activeBonuses = {
      welcome: [],
      daily: [],
      referral: []
    };

    let totalActiveBonus = 0;
    let totalRequiredTurnover = 0;
    let totalCompletedTurnover = 0;
    let withdrawableBonusBalance = 0;
    let nonWithdrawableBonusBalance = 0;

    allActiveBonuses.forEach(bonus => {
      totalActiveBonus += bonus.amount;
      totalRequiredTurnover += bonus.turnoverAmount;
      totalCompletedTurnover += bonus.currentTurnover;

      // Categorize by type
      if (bonus.type === 'first_deposit_300') {
        activeBonuses.welcome.push(bonus);
      } else if (bonus.type === 'red_card') {
        activeBonuses.daily.push(bonus);
      } else if (bonus.type === 'referral_reward') {
        activeBonuses.referral.push(bonus);
      }

      // Calculate withdrawable balance
      if (bonus.isWithdrawable || bonus.currentTurnover >= bonus.turnoverAmount) {
        withdrawableBonusBalance += bonus.amount;
      } else {
        nonWithdrawableBonusBalance += bonus.amount;
      }
    });

    // Get referral stats
    const referrals = await prisma.user.findMany({
      where: {
        referredById: userId
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        totalDeposited: true,
        totalTurnover: true,
        createdAt: true
      }
    });

    // Calculate eligible referrals for bonus
    const eligibleFriends = [];
    let totalReferralEarned = 0;

    for (const referral of referrals) {
      // Check if bonus was claimed for this referral
      const bonusClaimed = await prisma.bonus.findFirst({
        where: {
          userId: userId,
          type: "referral_reward",
          // Since no metadata, we'll check by date and amount
          amount: 25000, // 250 TK in paisa
          createdAt: {
            gte: referral.createdAt
          }
        }
      });

      if (bonusClaimed) {
        totalReferralEarned += bonusClaimed.amount;
      }

      const isEligible = referral.totalDeposited >= 30000 && referral.totalTurnover >= 300000;
      
      if (isEligible && !bonusClaimed) {
        eligibleFriends.push({
          id: referral.id,
          firstName: referral.firstName || 'বন্ধু',
          lastName: referral.lastName || '',
          totalDeposited: referral.totalDeposited,
          totalTurnover: referral.totalTurnover,
          depositAmount: referral.totalDeposited / 100,
          turnoverAmount: referral.totalTurnover / 100
        });
      }
    }

    return NextResponse.json({
      success: true,
      user: {
        ...user,
        totalReferrals: referrals.length,
        totalReferralEarned: totalReferralEarned / 100,
        eligibleReferrals: eligibleFriends.length
      },
      bonuses: {
        active: allActiveBonuses,
        byType: activeBonuses,
        completed: completedBonuses,
        summary: {
          totalActiveBonus: totalActiveBonus / 100,
          totalRequiredTurnover: totalRequiredTurnover / 100,
          totalCompletedTurnover: totalCompletedTurnover / 100,
          remainingTurnover: Math.max(0, (totalRequiredTurnover - totalCompletedTurnover) / 100),
          completionPercentage: totalRequiredTurnover > 0 
            ? Math.round((totalCompletedTurnover / totalRequiredTurnover) * 100) 
            : 0,
          withdrawableBonusBalance: withdrawableBonusBalance / 100,
          nonWithdrawableBonusBalance: nonWithdrawableBonusBalance / 100,
          hasLockedBonus: nonWithdrawableBonusBalance > 0
        }
      },
      referrals: {
        total: referrals.length,
        eligible: eligibleFriends,
        totalEarned: totalReferralEarned / 100
      }
    });

  } catch (err) {
    console.error("Bonus status error:", err);
    return NextResponse.json({ 
      success: false,
      error: "Server error" 
    }, { status: 500 });
  }
}