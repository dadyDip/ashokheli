import { prisma } from "./prisma";

export async function updateTurnover(userId, betAmount, winAmount, effectiveTurnover, gameType, matchId) {
  try {
    // Get active bonuses for this user
    const activeBonuses = await prisma.bonus.findMany({
      where: {
        userId: userId,
        status: "active",
        currentTurnover: { lt: prisma.bonus.fields.turnoverAmount }
      },
      orderBy: { createdAt: 'asc' }
    });

    if (activeBonuses.length === 0) {
      // Still update user total turnover even without active bonuses
      await prisma.user.update({
        where: { id: userId },
        data: {
          totalTurnover: { increment: effectiveTurnover }
        }
      });
      return { 
        updated: false, 
        message: "No active bonuses", 
        turnoverApplied: effectiveTurnover 
      };
    }

    // Update user total turnover in the user table
    await prisma.user.update({
      where: { id: userId },
      data: {
        totalTurnover: { increment: effectiveTurnover }
      }
    });

    let totalTurnoverApplied = 0;
    let unlockedBonuses = [];

    // Apply turnover to each active bonus
    for (const bonus of activeBonuses) {
      const remainingRequired = bonus.turnoverAmount - bonus.currentTurnover;
      const turnoverToAdd = Math.min(effectiveTurnover - totalTurnoverApplied, remainingRequired);
      
      if (turnoverToAdd > 0) {
        // Update bonus turnover
        const updatedBonus = await prisma.bonus.update({
          where: { id: bonus.id },
          data: {
            currentTurnover: { increment: turnoverToAdd }
          }
        });

        totalTurnoverApplied += turnoverToAdd;

        // Check if bonus is completed
        if (updatedBonus.currentTurnover >= updatedBonus.turnoverAmount) {
          // Mark bonus as withdrawable and completed
          await prisma.bonus.update({
            where: { id: bonus.id },
            data: {
              isWithdrawable: true,
              status: "completed",
              completedAt: new Date()
            }
          });

          unlockedBonuses.push({
            id: bonus.id,
            amount: bonus.amount / 100
          });
        }
      }
      
      if (totalTurnoverApplied >= effectiveTurnover) break;
    }

    // Log turnover activity in the casinoSpin table for audit trail
    await prisma.casinoSpin.create({
      data: {
        userId: userId,
        gameCode: 'TURNOVER',
        gameName: 'Turnover Tracking',
        betAmount: betAmount,
        winAmount: winAmount,
        netResult: effectiveTurnover, // Using netResult to store effective turnover
        gameRound: `TURNOVER_${matchId || Date.now()}`,
        timestamp: new Date(),
        status: 'COMPLETED',
        matchId: matchId || null
      }
    });

    // AFTER ALL BONUSES ARE COMPLETED, UNLOCK THE BALANCE
    if (unlockedBonuses.length > 0) {
      // Check if ALL active bonuses are now completed
      const remainingActiveBonuses = await prisma.bonus.findMany({
        where: {
          userId: userId,
          status: "active",
          NOT: {
            id: { in: unlockedBonuses.map(b => b.id) }
          }
        }
      });

      // If no more active bonuses, unlock the user's balance
      if (remainingActiveBonuses.length === 0) {
        await prisma.user.update({
          where: { id: userId },
          data: {
            lockedBalance: 0 // Set locked balance to 0
          }
        });
        
        // Also update all completed bonuses to mark them as fully processed
        await prisma.bonus.updateMany({
          where: {
            userId: userId,
            status: "completed",
            isWithdrawable: true
          },
          data: {
            status: "withdrawn_ready" // or any status you prefer
          }
        });
        
        
      }
    }

    return {
      updated: true,
      totalTurnoverApplied: totalTurnoverApplied,
      effectiveTurnover: effectiveTurnover,
      unlockedBonuses: unlockedBonuses,
      betAmount: betAmount,
      winAmount: winAmount,
      netWinLoss: winAmount - betAmount
    };

  } catch (error) {
    console.error("Turnover tracking error:", error);
    
    // Log error in console only (no schema changes needed)
    console.error("Turnover Error Details:", {
      userId,
      betAmount,
      winAmount,
      effectiveTurnover,
      gameType,
      matchId,
      error: error.message
    });
    
    return { 
      error: error.message, 
      updated: false, 
      turnoverApplied: 0 
    };
  }
}

// Helper function to calculate effective turnover based on game rules
export function calculateEffectiveTurnover(betAmount, winAmount, gameType) {
  const betPaisa = Math.round(betAmount);
  const winPaisa = Math.round(winAmount);
  
  // Different games might have different rules
  switch(gameType) {
    case 'casino_crash':
    case 'casino_slots':
      if (winPaisa === 0) {
        // Loss: full bet counts towards turnover
        return betPaisa;
      } else if (winPaisa >= betPaisa) {
        // Win (or break-even): only 0.5% of bet counts (0.005 = 5 paisa per 1000 bet)
        return Math.round(betPaisa * 0.005); // 0.5% of bet
      } else {
        // Partial win: only the lost portion counts
        return betPaisa - winPaisa;
      }
      
    case 'sports_betting':
      // For sports, only lost portion counts
      return Math.max(0, betPaisa - winPaisa);
      
    default:
      // Default: full bet for loss, 0.5% for win
      return winPaisa > 0 ? Math.round(betPaisa * 0.005) : betPaisa;
  }
}