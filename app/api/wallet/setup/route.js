// app/api/wallet/setup/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function GET(req) {
  const user = verifyToken(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get user's e-wallets
    const ewallets = await prisma.eWallet.findMany({
      where: { userId: user.id },
      orderBy: { isDefault: 'desc' }
    });

    // Check if user has transaction password
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: { hasTransactionPassword: true, dailyWithdrawCount: true }
    });

    // Get max daily withdraw limit (you can make this configurable)
    const maxDailyWithdraw = 99;

    return NextResponse.json({
      hasTransactionPassword: userData?.hasTransactionPassword || false,
      ewallets: ewallets.map(w => ({
        id: w.id,
        type: w.type,
        accountNumber: w.accountNumber,
        accountHolder: w.accountHolder,
        isDefault: w.isDefault
      })),
      dailyWithdrawCount: userData?.dailyWithdrawCount || 0,
      maxDailyWithdraw
    });
  } catch (err) {
    console.error("Error fetching wallet setup:", err);
    return NextResponse.json(
      { error: "Failed to fetch wallet setup" },
      { status: 500 }
    );
  }
}