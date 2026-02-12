// app/api/deposit/request/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

const MINIMUM_DEPOSIT = 100;
const MAXIMUM_DEPOSIT = 25000;

export async function POST(req) {
  const user = verifyToken(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { method, amount, trxId, programId, presetBonus, paymentChannel, referenceId } = await req.json();

  // Validate required fields
  if (!method || !amount || !trxId) {
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

  // Check minimum deposit
  if (taka < MINIMUM_DEPOSIT) {
    return NextResponse.json(
      { error: `Minimum deposit is ${MINIMUM_DEPOSIT} BDT` }, 
      { status: 400 }
    );
  }

  // Check maximum deposit
  if (taka > MAXIMUM_DEPOSIT) {
    return NextResponse.json(
      { error: `Maximum deposit is ${MAXIMUM_DEPOSIT} BDT` }, 
      { status: 400 }
    );
  }

  // Convert to paisa for storage
  const paisa = Math.round(taka * 100);

  // Validate transaction ID
  const trimmedTrxId = trxId.trim();
  if (trimmedTrxId.length < 10) {
    return NextResponse.json({ error: "Transaction ID must be at least 10 characters" }, { status: 400 });
  }

  try {
    // Check if user exists and get their info
    const userInfo = await prisma.user.findUnique({
      where: { id: user.id },
      select: { 
        id: true,
        casinoId: true,
        firstName: true,
        lastName: true,
        phone: true,
        isBanned: true
      }
    });

    // Check if user is banned
    if (userInfo?.isBanned) {
      return NextResponse.json(
        { error: "Your account is banned from making deposits" },
        { status: 403 }
      );
    }

    // Check for duplicate transaction ID
    const existingDeposit = await prisma.depositRequest.findFirst({
      where: {
        trxId: trimmedTrxId,
        method: method.toLowerCase(),
      },
    });

    if (existingDeposit) {
      return NextResponse.json(
        { error: "This transaction ID has already been used" },
        { status: 400 }
      );
    }

    // Calculate bonuses - ONLY what user selected
    let presetBonusAmount = 0;
    let programBonusAmount = 0;
    
    // Check if preset bonus was selected
    if (presetBonus) {
      presetBonusAmount = Number(presetBonus) || 0;
    }
    
    // Calculate program bonus if program is selected
    if (programId && presetBonusAmount === 0) { // Only if no preset bonus
      // Bonus tiers for program
      const BONUS_TIERS = [
        { min: 100, bonusPercent: 20 },
        { min: 200, bonusPercent: 20 },
        { min: 500, bonusPercent: 20 },
        { min: 1000, bonusPercent: 20 },
        { min: 2000, bonusPercent: 20 },
        { min: 5000, bonusPercent: 25 },
        { min: 10000, bonusPercent: 25 },
        { min: 15000, bonusPercent: 30 },
        { min: 20000, bonusPercent: 30 },
        { min: 25000, bonusPercent: 35 },
      ];
      
      // Find applicable tier
      const applicableTier = BONUS_TIERS
        .slice()
        .reverse()
        .find(tier => taka >= tier.min);

      if (applicableTier) {
        programBonusAmount = (taka * applicableTier.bonusPercent) / 100;
      }
    }

    // Create deposit
    const deposit = await prisma.depositRequest.create({
      data: {
        userId: user.id,
        method: method.toLowerCase(),
        amount: paisa,
        trxId: trimmedTrxId,
        status: "pending",
      },
    });

    const totalBonus = presetBonusAmount + programBonusAmount;
    const totalBonusPaisa = Math.round(totalBonus * 100);
    
    // Store bonus info in transaction for approval phase
    if (totalBonus > 0) {
      await prisma.transaction.create({
        data: {
          userId: user.id,
          type: "deposit_bonus_info",
          amount: totalBonusPaisa,
          status: "pending",
          provider: method.toLowerCase(),
          reference: trimmedTrxId,
          metadata: JSON.stringify({
            depositId: deposit.id,
            presetBonus: presetBonusAmount,
            programBonus: programBonusAmount,
            totalBonus: totalBonus,
            depositAmount: taka,
            programId: programId || null,
            paymentChannel: paymentChannel || null,
            referenceId: referenceId || null
          })
        }
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Deposit request submitted successfully.", 
      deposit: {
        id: deposit.id,
        amount: taka,
        method: deposit.method,
        status: deposit.status,
        presetBonus: presetBonusAmount,
        programBonus: programBonusAmount,
        totalBonus: totalBonus,
        createdAt: deposit.createdAt
      }
    });

  } catch (err) {
    console.error("Deposit processing error:", err);
    
    if (err.code === 'P2002') {
      return NextResponse.json(
        { error: "This transaction ID has already been used" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to process deposit request. Please try again." },
      { status: 500 }
    );
  }
}

// GET endpoint - keep as is
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

    const deposits = await prisma.depositRequest.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: (page - 1) * limit,
      select: {
        id: true,
        amount: true,
        method: true,
        trxId: true,
        status: true,
        createdAt: true,
        approvedAt: true,
      }
    });

    const total = await prisma.depositRequest.count({ where: whereClause });

    // Convert amount from paisa to taka
    const formattedDeposits = deposits.map(deposit => ({
      ...deposit,
      amount: deposit.amount / 100,
    }));

    return NextResponse.json({
      success: true,
      deposits: formattedDeposits,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      }
    });

  } catch (err) {
    console.error("Get deposits error:", err);
    return NextResponse.json(
      { error: "Failed to fetch deposits" },
      { status: 500 }
    );
  }
}