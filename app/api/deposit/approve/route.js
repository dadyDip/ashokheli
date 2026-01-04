import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function POST(req) {
  const admin = verifyToken(req);

  if (!admin || admin.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await req.json();
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const deposit = await prisma.depositRequest.findUnique({
    where: { id },
  });

  if (!deposit || deposit.status !== "pending") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // ✅ amount is ALREADY in paisa
  const paisaAmount = deposit.amount;

  await prisma.$transaction([
    // 1️⃣ approve deposit
    prisma.depositRequest.update({
      where: { id },
      data: {
        status: "approved",
        approvedAt: new Date(), // ✅ CORRECT FIELD
      },
    }),

    // 2️⃣ update user wallet
    prisma.user.update({
      where: { id: deposit.userId },
      data: {
        balance: { increment: paisaAmount },
        totalDeposited: { increment: paisaAmount },
      },
    }),

    // 3️⃣ create transaction record
    prisma.transaction.create({
      data: {
        userId: deposit.userId,
        type: "DEPOSIT",
        amount: paisaAmount,
        status: "COMPLETED",
        provider: deposit.method,
        reference: deposit.trxId,
      },
    }),
  ]);

  return NextResponse.json({ success: true });
}
