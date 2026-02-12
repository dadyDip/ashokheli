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

    // Get all referred users
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Calculate stats
    let totalEarned = 0;
    let activeReferrals = 0;
    let pendingReferrals = 0;
    let completedReferrals = [];
    let eligibleFriends = [];

    for (const referral of referrals) {
      // Check if bonus was claimed for this referral
      const bonusClaimed = await prisma.bonus.findFirst({
        where: {
          userId: userId,
          type: "referral_reward",
          amount: 25000, // 250 TK in paisa
          createdAt: {
            gte: referral.createdAt
          }
        }
      });

      if (bonusClaimed) {
        totalEarned += bonusClaimed.amount;
        completedReferrals.push({
          id: referral.id,
          name: `${referral.firstName || 'বন্ধু'} ${referral.lastName || ''}`.trim(),
          deposited: referral.totalDeposited / 100,
          turnover: referral.totalTurnover / 100,
          bonusAmount: bonusClaimed.amount / 100,
          claimedAt: bonusClaimed.createdAt
        });
      }

      // Check if friend qualifies for bonus
      const qualifies = referral.totalDeposited >= 30000 && referral.totalTurnover >= 300000;
      
      if (qualifies) {
        activeReferrals++;
        if (!bonusClaimed) {
          pendingReferrals++;
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
    }

    return NextResponse.json({
      success: true,
      totalReferrals: referrals.length,
      activeReferrals,
      pendingReferrals,
      completedReferrals,
      eligibleFriends,
      totalEarned: totalEarned / 100,
      stats: {
        totalReferrals: referrals.length,
        qualifiedReferrals: activeReferrals,
        pendingRewards: pendingReferrals,
        totalEarned: totalEarned / 100
      }
    });

  } catch (err) {
    console.error("Referral stats error:", err);
    return NextResponse.json({ 
      success: false,
      totalReferrals: 0,
      activeReferrals: 0,
      pendingReferrals: 0,
      eligibleFriends: [],
      totalEarned: 0,
      stats: {
        totalReferrals: 0,
        qualifiedReferrals: 0,
        pendingRewards: 0,
        totalEarned: 0
      }
    });
  }
}