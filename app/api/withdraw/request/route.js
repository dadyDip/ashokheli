// app/api/withdraw/request/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { sendTelegramNotification, formatWithdrawNotification } from "@/lib/telegram";

const MINIMUM_WITHDRAW = 200; // Minimum withdraw amount

export async function POST(req) {
  const user = verifyToken(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { method, amount, account } = await req.json();

  // Validate required fields
  if (!method || !amount || !account) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 });
  }

  // Validate payment method
  const validMethods = ['bkash', 'nagad'];
  if (!validMethods.includes(method.toLowerCase())) {
    return NextResponse.json({ error: "Invalid payment method" }, { status: 400 });
  }

  // Validate amount
  const taka = Number(amount);
  if (isNaN(taka) || taka <= 0) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }

  // Check minimum withdraw
  if (taka < MINIMUM_WITHDRAW) {
    return NextResponse.json(
      { error: `Minimum withdraw is ${MINIMUM_WITHDRAW} BDT` }, 
      { status: 400 }
    );
  }

  // Convert to paisa for storage
  const paisa = Math.round(taka * 100);

  // Validate account number
  const trimmedAccount = account.trim();
  if (!trimmedAccount.match(/^01[3-9]\d{8}$/)) {
    return NextResponse.json(
      { error: "Please enter a valid Bangladeshi mobile number (01XXXXXXXXX)" },
      { status: 400 }
    );
  }

  try {
    // Get user with balance
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        balance: true,
        lockedBalance: true,
        casinoId: true,
        firstName: true,
        lastName: true,
        phone: true,
        isBanned: true
      }
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user is banned
    if (dbUser.isBanned) {
      return NextResponse.json(
        { error: "Your account is banned from making withdrawals" },
        { status: 403 }
      );
    }

    // SIMPLE CHECK 1: Check total balance
    if (dbUser.balance < paisa) {
      return NextResponse.json(
        { 
          error: "Insufficient balance",
          details: {
            currentBalance: dbUser.balance / 100,
            requested: taka,
            shortfall: (paisa - dbUser.balance) / 100
          }
        },
        { status: 400 }
      );
    }

    // SIMPLE CHECK 2: Check if balance is locked
    if (dbUser.lockedBalance > 0) {
      // Balance is locked, check if ALL bonuses are completed
      const incompleteBonuses = await prisma.bonus.findMany({
        where: {
          userId: user.id,
          status: "active",
          currentTurnover: { lt: prisma.bonus.fields.turnoverAmount }
        }
      });
      
      if (incompleteBonuses.length > 0) {
        // Calculate remaining turnover
        let totalRemainingTurnover = 0;
        incompleteBonuses.forEach(bonus => {
          totalRemainingTurnover += (bonus.turnoverAmount - bonus.currentTurnover);
        });
        
        return NextResponse.json(
          { 
            error: "Complete bonus turnover to withdraw",
            details: {
              totalBalance: dbUser.balance / 100,
              isBalanceLocked: true,
              incompleteBonuses: incompleteBonuses.length,
              remainingTurnover: totalRemainingTurnover / 100,
              message: `Play ${totalRemainingTurnover / 100}৳ more to unlock withdrawal`
            }
          },
          { status: 400 }
        );
      } else {
        // All bonuses completed but balance still shows as locked
        // This shouldn't happen, but just in case, unlock it
        await prisma.user.update({
          where: { id: user.id },
          data: { lockedBalance: 0 }
        });
      }
    }

    // Check for recent duplicate requests
    const recentWithdraw = await prisma.withdrawRequest.findFirst({
      where: {
        userId: user.id,
        status: "pending",
        createdAt: {
          gte: new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
        }
      }
    });

    if (recentWithdraw) {
      return NextResponse.json(
        { error: "You already have a pending withdraw request. Please wait." },
        { status: 400 }
      );
    }

    // Simple transaction - just deduct from balance and create request
    await prisma.$transaction(async (tx) => {
      // Deduct balance and create withdraw request
      await tx.user.update({
        where: { id: user.id },
        data: {
          balance: { decrement: paisa },
          totalWithdrawn: { increment: paisa },
          // NO LONGER LOCKING THE WITHDRAWAL AMOUNT
          // When user withdraws, it's from unlocked balance
        },
      });

      const withdraw = await tx.withdrawRequest.create({
        data: {
          userId: user.id,
          method: method.toLowerCase(),
          account: trimmedAccount,
          amount: paisa,
          status: "pending",
        },
      });

      await tx.transaction.create({
        data: {
          userId: user.id,
          type: "WITHDRAW",
          amount: paisa,
          status: "PENDING",
          provider: method.toLowerCase(),
          reference: trimmedAccount,
        },
      });

      // Prepare user info for notification
      const displayName = dbUser.firstName 
        ? `${dbUser.firstName}${dbUser.lastName ? ' ' + dbUser.lastName : ''}`
        : dbUser.phone || user.id;

      // Send Telegram notification
      sendTelegramNotification(
        formatWithdrawNotification(
          { 
            id: user.id,
            displayName,
            phone: dbUser.phone 
          }, 
          { 
            method: method.toLowerCase(), 
            amount: paisa, 
            account: trimmedAccount 
          }
        )
      ).catch(error => {
        console.error("Failed to send Telegram notification:", error);
      });

      return withdraw;
    });

    return NextResponse.json({ 
      success: true, 
      message: "Withdraw request submitted successfully.", 
      data: {
        amount: taka,
        method: method.toLowerCase(),
        account: trimmedAccount,
        status: "pending"
      }
    });

  } catch (err) {
    console.error("Withdraw processing error:", err);
    
    // Handle specific errors
    if (err.code === 'P2002') {
      return NextResponse.json(
        { error: "Duplicate request detected" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to process withdraw request. Please try again." },
      { status: 500 }
    );
  }
}

// Simple withdrawal eligibility check
export async function checkWithdrawalEligibility(userId) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        balance: true,
        lockedBalance: true,
        isBanned: true
      }
    });

    if (!user || user.isBanned) {
      return { 
        canWithdraw: false, 
        message: "Account not eligible for withdrawal" 
      };
    }

    // Check if balance is locked
    if (user.lockedBalance > 0) {
      // Get incomplete bonuses for message
      const incompleteBonuses = await prisma.bonus.findMany({
        where: {
          userId: userId,
          status: "active",
          currentTurnover: { lt: prisma.bonus.fields.turnoverAmount }
        }
      });
      
      let totalRemainingTurnover = 0;
      incompleteBonuses.forEach(bonus => {
        totalRemainingTurnover += (bonus.turnoverAmount - bonus.currentTurnover);
      });
      
      return {
        canWithdraw: false,
        isBalanceLocked: true,
        message: `Complete ${totalRemainingTurnover / 100}৳ turnover to unlock withdrawal`,
        details: {
          totalBalance: user.balance / 100,
          locked: true,
          remainingTurnover: totalRemainingTurnover / 100
        }
      };
    }

    // Balance is unlocked
    const canWithdraw = user.balance >= 20000; // 200 TK minimum
    const availableBalance = user.balance;
    
    return {
      canWithdraw: canWithdraw,
      isBalanceLocked: false,
      message: canWithdraw 
        ? `You can withdraw up to ${availableBalance / 100}৳` 
        : `Minimum withdrawal is 200৳ (you have ${availableBalance / 100}৳)`,
      details: {
        totalBalance: user.balance / 100,
        availableBalance: availableBalance / 100,
        minimumRequired: 20000 - user.balance
      }
    };

  } catch (error) {
    console.error("Withdrawal eligibility check error:", error);
    return { 
      canWithdraw: false, 
      message: "Unable to check withdrawal eligibility" 
    };
  }
}

// GET method for withdraw history
export async function GET(req) {
  const user = verifyToken(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const status = url.searchParams.get('status');
  const limit = parseInt(url.searchParams.get('limit') || '10');
  const page = parseInt(url.searchParams.get('page') || '1');

  try {
    const whereClause = { userId: user.id };
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      whereClause.status = status;
    }

    const withdrawals = await prisma.withdrawRequest.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: (page - 1) * limit,
      select: {
        id: true,
        amount: true,
        method: true,
        account: true,
        status: true,
        createdAt: true,
        approvedAt: true,
      }
    });

    const total = await prisma.withdrawRequest.count({ where: whereClause });

    // Convert amount from paisa to taka
    const formattedWithdrawals = withdrawals.map(withdraw => ({
      ...withdraw,
      amount: withdraw.amount / 100, // Convert to BDT
    }));

    // Get current withdrawal eligibility status
    const eligibility = await checkWithdrawalEligibility(user.id);

    return NextResponse.json({
      success: true,
      withdrawals: formattedWithdrawals,
      currentStatus: eligibility,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      }
    });

  } catch (err) {
    console.error("Get withdrawals error:", err);
    return NextResponse.json(
      { error: "Failed to fetch withdrawals" },
      { status: 500 }
    );
  }
}

// Helper endpoint for frontend to check before withdrawing
export async function HEAD(req) {
  const user = verifyToken(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const eligibility = await checkWithdrawalEligibility(user.id);
    
    return NextResponse.json({
      success: true,
      ...eligibility
    });
  } catch (err) {
    console.error("Withdrawal check error:", err);
    return NextResponse.json(
      { error: "Failed to check withdrawal eligibility" },
      { status: 500 }
    );
  }
}