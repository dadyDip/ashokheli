// app/api/transactions/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function GET(req) {
  const user = verifyToken(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const url = new URL(req.url);
    const getAll = url.searchParams.get('all') === 'true';
    const type = url.searchParams.get('type'); // optional filter by type

    // Build where clause
    const whereClause = {
      userId: user.id
    };

    // Filter by transaction type if specified
    if (type) {
      whereClause.type = type.toUpperCase();
    }

    // Get ALL transactions - NO LIMIT
    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc'
      }
      // REMOVED take limit completely
    });

    // Also get deposit requests
    const deposits = await prisma.depositRequest.findMany({
      where: {
        userId: user.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Format deposit requests as transactions
    const depositTransactions = deposits.map(deposit => ({
      id: deposit.id,
      type: "DEPOSIT",
      amount: deposit.amount,
      status: deposit.status,
      provider: deposit.method,
      reference: deposit.trxId,
      createdAt: deposit.createdAt,
      metadata: { method: deposit.method }
    }));

    // Also get withdraw requests
    const withdraws = await prisma.withdrawRequest.findMany({
      where: {
        userId: user.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Format withdraw requests as transactions
    const withdrawTransactions = withdraws.map(withdraw => ({
      id: withdraw.id,
      type: "WITHDRAW",
      amount: withdraw.amount,
      status: withdraw.status,
      provider: withdraw.method,
      reference: withdraw.account,
      createdAt: withdraw.createdAt,
      metadata: { method: withdraw.method, account: withdraw.account }
    }));

    // Combine all transactions
    const allTransactions = [
      ...transactions,
      ...depositTransactions,
      ...withdrawTransactions
    ];

    // Remove duplicates (in case transaction already exists in both places)
    const uniqueTransactions = Array.from(
      new Map(allTransactions.map(tx => [tx.id, tx])).values()
    );

    // Sort by date (newest first)
    uniqueTransactions.sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );

    return NextResponse.json(uniqueTransactions);

  } catch (err) {
    console.error("Error fetching transactions:", err);
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}