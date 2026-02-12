import { PrismaClient } from "@prisma/client";
import { verifyToken } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET(request) {
  try {
    const user = verifyToken(request);
    
    if (!user || user.role !== "sub-agent") {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get referrals for this sub-agent
    const referrals = await prisma.user.findMany({
      where: {
        referredById: user.id
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        deposits: {
          where: {
            status: 'approved'
          },
          select: {
            id: true,
            amount: true,
            createdAt: true,
          }
        }
      }
    });

    // Calculate commissions (9% of each deposit)
    const commissions = [];
    let totalCommission = 0; // in paisa
    let availableCommission = 0; // in paisa

    // Get all claimed commissions to mark which ones are claimed
    const claimedCommissions = await prisma.transaction.findMany({
      where: {
        userId: user.id,
        type: 'commission',
        status: 'completed'
      },
      select: {
        amount: true,
        createdAt: true,
        reference: true // We'll use reference field to store deposit ID
      }
    });

    // Create a map of claimed deposit IDs from reference field
    const claimedDepositIds = new Set();
    claimedCommissions.forEach(tx => {
      if (tx.reference) {
        claimedDepositIds.add(tx.reference);
      }
    });

    referrals.forEach(referral => {
      referral.deposits.forEach(deposit => {
        const commissionAmount = Math.floor(deposit.amount * 0.09); // 9% of deposit
        totalCommission += commissionAmount;
        
        const isClaimed = claimedDepositIds.has(deposit.id);
        if (!isClaimed) {
          availableCommission += commissionAmount;
        }
        
        commissions.push({
          id: deposit.id,
          referralName: `${referral.firstName} ${referral.lastName}`,
          depositAmount: deposit.amount,
          commissionAmount: commissionAmount,
          status: isClaimed ? 'claimed' : 'pending',
          depositId: deposit.id,
          createdAt: deposit.createdAt
        });
      });
    });

    // Sort by date
    commissions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Get last claim date
    let lastClaimDate = null;
    if (claimedCommissions.length > 0) {
      // Sort by date and get the latest
      claimedCommissions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      lastClaimDate = claimedCommissions[0].createdAt;
    }

    return Response.json({ 
      success: true, 
      commissions,
      totalCommission, // in paisa
      availableCommission, // in paisa
      lastClaimDate
    });
  } catch (error) {
    console.error("Error fetching commissions:", error);
    return Response.json({ 
      error: "Internal server error",
      details: error.message 
    }, { status: 500 });
  }
}