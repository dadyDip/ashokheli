import { PrismaClient } from "@prisma/client";
import { verifyToken } from "@/lib/auth";

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    const user = verifyToken(request);
    
    if (!user || user.role !== "sub-agent") {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { amount } = await request.json();

    if (!amount || amount <= 0) {
      return Response.json({ error: "Invalid amount" }, { status: 400 });
    }

    console.log("Claim request:", { userId: user.id, amount, inTaka: amount/100 });

    // Get referrals and their deposits
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
          }
        }
      }
    });

    // Get already claimed commissions
    const claimedCommissions = await prisma.transaction.findMany({
      where: {
        userId: user.id,
        type: 'commission',
        status: 'completed'
      },
      select: {
        reference: true
      }
    });

    const claimedDepositIds = new Set();
    claimedCommissions.forEach(tx => {
      if (tx.reference) {
        claimedDepositIds.add(tx.reference);
      }
    });

    console.log("Claimed deposit IDs:", Array.from(claimedDepositIds));

    // Find unclaimed deposits
    const depositsToClaim = [];
    let totalAvailable = 0;
    let remainingAmount = amount;

    for (const referral of referrals) {
      for (const deposit of referral.deposits) {
        if (!claimedDepositIds.has(deposit.id)) {
          const commissionAmount = Math.floor(deposit.amount * 0.09);
          totalAvailable += commissionAmount;
          
          if (remainingAmount > 0 && commissionAmount <= remainingAmount) {
            depositsToClaim.push({
              depositId: deposit.id,
              commissionAmount: commissionAmount,
              referralName: `${referral.firstName} ${referral.lastName}`
            });
            remainingAmount -= commissionAmount;
          }
        }
      }
    }

    console.log("Available commission:", totalAvailable, "Requested:", amount);
    console.log("Deposits to claim:", depositsToClaim);

    // Check if enough commission available
    if (totalAvailable < amount) {
      return Response.json({ 
        error: `Only ${totalAvailable/100} TK available to claim. Requested: ${amount/100} TK`,
        available: totalAvailable
      }, { status: 400 });
    }

    // Check 7-day cooldown
    const lastClaim = await prisma.transaction.findFirst({
      where: {
        userId: user.id,
        type: 'commission',
        status: 'completed'
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (lastClaim) {
      const lastClaimDate = new Date(lastClaim.createdAt);
      const now = new Date();
      const daysSinceLastClaim = Math.floor((now - lastClaimDate) / (1000 * 60 * 60 * 24));
      
      if (daysSinceLastClaim < 7) {
        return Response.json({ 
          error: `You can claim again in ${7 - daysSinceLastClaim} days` 
        }, { status: 400 });
      }
    }

    // Update user balance
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        balance: {
          increment: amount
        }
      }
    });

    console.log("Updated user balance:", updatedUser.balance);

    // Create commission transaction records
    for (const deposit of depositsToClaim) {
      await prisma.transaction.create({
        data: {
          userId: user.id,
          type: 'commission',
          amount: deposit.commissionAmount,
          status: 'completed',
          reference: deposit.depositId, // Store deposit ID in reference field
          provider: 'sub-agent-system'
        }
      });
    }

    // Create a summary transaction for the total amount
    await prisma.transaction.create({
      data: {
        userId: user.id,
        type: 'commission-payout',
        amount: amount,
        status: 'completed',
        reference: `CLAIM-${Date.now()}`,
        provider: 'sub-agent-system'
      }
    });

    return Response.json({ 
      success: true, 
      message: `Successfully claimed ${amount/100} TK commission!`,
      newBalance: updatedUser.balance,
      claimedAmount: amount,
      claimedDeposits: depositsToClaim.length
    });
  } catch (error) {
    console.error("Error claiming commission:", error);
    return Response.json({ 
      error: "Internal server error",
      details: error.message 
    }, { status: 500 });
  }
}