// lib/bonus-utils.js
import { prisma } from "./prisma";

export async function checkWithdrawableBalance(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      balance: true,
      bonusBalance: true
    }
  });
  
  const activeBonuses = await prisma.bonus.findMany({
    where: {
      userId: userId,
      status: "active",
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } }
      ]
    }
  });
  
  let withdrawableRealBalance = user.balance;
  let withdrawableBonusBalance = 0;
  let nonWithdrawableBonusBalance = 0;
  
  for (const bonus of activeBonuses) {
    if (bonus.isWithdrawable && bonus.currentTurnover >= bonus.turnoverAmount) {
      withdrawableBonusBalance += bonus.amount;
    } else {
      nonWithdrawableBonusBalance += bonus.amount;
    }
  }
  
  return {
    totalBalance: user.balance + user.bonusBalance,
    withdrawableBalance: withdrawableRealBalance + withdrawableBonusBalance,
    realBalance: user.balance,
    bonusBalance: user.bonusBalance,
    withdrawableRealBalance,
    withdrawableBonusBalance,
    nonWithdrawableBonusBalance,
    hasLockedBonus: nonWithdrawableBonusBalance > 0
  };
}

export async function validateWithdrawalAmount(userId, amount) {
  const balanceInfo = await checkWithdrawableBalance(userId);
  
  if (balanceInfo.totalBalance < amount) {
    return {
      valid: false,
      error: "Insufficient total balance",
      details: balanceInfo
    };
  }
  
  if (balanceInfo.withdrawableBalance < amount) {
    // Calculate required turnover
    const shortfall = amount - balanceInfo.withdrawableBalance;
    const turnoverNeeded = await calculateRequiredTurnover(userId, shortfall);
    
    return {
      valid: false,
      error: "Turnover requirements not met",
      details: {
        ...balanceInfo,
        requiredTurnover: turnoverNeeded,
        shortfall: shortfall
      }
    };
  }
  
  return {
    valid: true,
    details: balanceInfo
  };
}

async function calculateRequiredTurnover(userId, amountNeeded) {
  const activeBonuses = await prisma.bonus.findMany({
    where: {
      userId: userId,
      status: "active",
      isWithdrawable: false,
      currentTurnover: { lt: prisma.bonus.fields.turnoverAmount }
    },
    orderBy: { createdAt: 'asc' }
  });
  
  let remaining = amountNeeded;
  let totalTurnover = 0;
  
  for (const bonus of activeBonuses) {
    if (remaining <= 0) break;
    
    const usableAmount = Math.min(bonus.amount, remaining);
    const turnoverMultiplier = bonus.turnoverAmount / bonus.originalAmount;
    const turnoverForAmount = Math.ceil(usableAmount * turnoverMultiplier);
    
    // Account for already completed turnover
    const completedRatio = bonus.currentTurnover / bonus.turnoverAmount;
    const completedForAmount = turnoverForAmount * completedRatio;
    const remainingTurnover = turnoverForAmount - completedForAmount;
    
    totalTurnover += remainingTurnover;
    remaining -= usableAmount;
  }
  
  return Math.ceil(totalTurnover);
}