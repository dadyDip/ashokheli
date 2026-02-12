// app/api/deposit/approve/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

// Turnover multipliers
const PRESET_TURNOVER_MULTIPLIER = 10; // For preset bonuses (100=60, etc.)
const PROGRAM_TURNOVER_MULTIPLIER = 7; // For program bonuses (20%, 30%, etc.)
const DEPOSIT_TURNOVER_MULTIPLIER = 1; // For real money deposits

export async function POST(req) {
  const admin = verifyToken(req);

  if (!admin || admin.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await req.json();
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  try {
    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Get deposit info
      const deposit = await tx.depositRequest.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              lockedBalance: true
            }
          }
        }
      });

      if (!deposit || deposit.status !== "pending") {
        throw new Error("Invalid deposit request");
      }

      const depositAmountPaisa = deposit.amount;
      const depositAmountTaka = depositAmountPaisa / 100;

      // 2. Get bonus info from transaction table
      const bonusTx = await tx.transaction.findFirst({
        where: {
          userId: deposit.userId,
          type: "deposit_bonus_info",
          reference: deposit.trxId
        }
      });

      let presetBonusAmount = 0;
      let programBonusAmount = 0;
      let totalBonus = 0;
      
      if (bonusTx && bonusTx.metadata) {
        try {
          // Parse metadata if it's a string
          const metadata = typeof bonusTx.metadata === 'string' 
            ? JSON.parse(bonusTx.metadata) 
            : bonusTx.metadata;
          
          presetBonusAmount = metadata.presetBonus || 0;
          programBonusAmount = metadata.programBonus || 0;
          totalBonus = metadata.totalBonus || 0;
        } catch (e) {
          console.error("Error parsing bonus metadata:", e);
        }
      }

      const presetBonusPaisa = Math.round(presetBonusAmount * 100);
      const programBonusPaisa = Math.round(programBonusAmount * 100);
      const totalBonusPaisa = Math.round(totalBonus * 100);

      // 3. Create deposit turnover (1x for real money)
      const depositTurnoverAmount = depositAmountPaisa * DEPOSIT_TURNOVER_MULTIPLIER;
      
      await tx.bonus.create({
        data: {
          userId: deposit.userId,
          type: "DEPOSIT_TURNOVER",
          amount: depositAmountPaisa, // Real money amount
          originalAmount: depositAmountPaisa,
          turnoverAmount: depositTurnoverAmount,
          currentTurnover: 0,
          status: "active",
          isWithdrawable: false
        }
      });

      // 4. Create preset bonus turnover (10x) if exists
      if (presetBonusAmount > 0) {
        const presetTurnoverAmount = presetBonusPaisa * PRESET_TURNOVER_MULTIPLIER;
        await tx.bonus.create({
          data: {
            userId: deposit.userId,
            type: "PRESET_BONUS",
            amount: presetBonusPaisa,
            originalAmount: presetBonusPaisa,
            turnoverAmount: presetTurnoverAmount,
            currentTurnover: 0,
            status: "active",
            isWithdrawable: false,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
          }
        });
      }

      // 5. Create program bonus turnover (7x) if exists
      if (programBonusAmount > 0) {
        const programTurnoverAmount = programBonusPaisa * PROGRAM_TURNOVER_MULTIPLIER;
        await tx.bonus.create({
          data: {
            userId: deposit.userId,
            type: "PROGRAM_BONUS",
            amount: programBonusPaisa,
            originalAmount: programBonusPaisa,
            turnoverAmount: programTurnoverAmount,
            currentTurnover: 0,
            status: "active",
            isWithdrawable: false,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
          }
        });
      }

      // 6. Calculate total amounts to add to user balance
      const totalAmountToAdd = depositAmountPaisa + totalBonusPaisa;
      
      // Calculate new locked balance (real money + bonuses)
      const currentLockedBalance = deposit.user.lockedBalance || 0;
      const newLockedBalance = currentLockedBalance + totalAmountToAdd;

      // 7. Update deposit status
      await tx.depositRequest.update({
        where: { id },
        data: {
          status: "approved",
          approvedAt: new Date(),
        },
      });

      // 8. Update user balance
      const updateData = {
        balance: { increment: totalAmountToAdd },
        lockedBalance: newLockedBalance,
        totalDeposited: { increment: depositAmountPaisa }
      };
      
      if (totalBonusPaisa > 0) {
        updateData.totalBonusGiven = { increment: totalBonusPaisa };
      }
      
      await tx.user.update({
        where: { id: deposit.userId },
        data: updateData
      });

      // 9. Create transaction records
      // Main deposit transaction
      await tx.transaction.create({
        data: {
          userId: deposit.userId,
          type: "DEPOSIT",
          amount: depositAmountPaisa,
          status: "COMPLETED",
          provider: deposit.method,
          reference: deposit.trxId
        }
      });

      // Bonus transaction if any
      if (totalBonusPaisa > 0) {
        await tx.transaction.create({
          data: {
            userId: deposit.userId,
            type: "BONUS_CREDIT",
            amount: totalBonusPaisa,
            status: "COMPLETED",
            provider: deposit.method,
            reference: deposit.trxId
          }
        });
      }

      return {
        depositAmount: depositAmountPaisa,
        presetBonus: presetBonusPaisa,
        programBonus: programBonusPaisa,
        totalAdded: totalAmountToAdd
      };
    });

    // Format response
    const depositAmountTaka = result.depositAmount / 100;
    const presetBonusTaka = result.presetBonus / 100;
    const programBonusTaka = result.programBonus / 100;
    const totalAddedTaka = result.totalAdded / 100;

    let message = `Deposit approved. ${depositAmountTaka}৳ added to user balance with 1x turnover requirement.`;

    if (presetBonusTaka > 0) {
      message += `\nPreset bonus: ${presetBonusTaka}৳ with 10x turnover requirement.`;
    }

    if (programBonusTaka > 0) {
      message += `\nProgram bonus: ${programBonusTaka}৳ with 7x turnover requirement.`;
    }

    message += `\nTotal added to balance: ${totalAddedTaka}৳`;

    return NextResponse.json({ 
      success: true,
      message: message,
      details: {
        depositAmount: depositAmountTaka,
        presetBonus: presetBonusTaka,
        programBonus: programBonusTaka,
        totalAdded: totalAddedTaka
      }
    });

  } catch (error) {
    console.error("Deposit approval error:", error);
    
    return NextResponse.json({ 
      error: error.message || "Failed to approve deposit" 
    }, { status: 500 });
  }
}