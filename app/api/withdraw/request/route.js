import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function POST(req) {
  const user = verifyToken(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { method, amount, account } = await req.json();

  if (!method || !amount || !account) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const taka = Number(amount);
  if (isNaN(taka) || taka <= 0) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }

  const paisa = Math.round(taka * 100);

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
  });

  if (!dbUser || dbUser.balance < paisa) {
    return NextResponse.json(
      { error: "Insufficient balance" },
      { status: 400 }
    );
  }

  // 🔥 DEDUCT IMMEDIATELY + CREATE REQUEST (ATOMIC)
  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: {
        balance: { decrement: paisa },
        totalWithdrawn: { increment: paisa },
      },
    }),

    prisma.withdrawRequest.create({
      data: {
        userId: user.id,
        method,
        account,
        amount: paisa, // PAISA
        status: "pending",
      },
    }),

    prisma.transaction.create({
      data: {
        userId: user.id,
        type: "WITHDRAW",
        amount: paisa,
        status: "PENDING",
        provider: method,
        reference: account,
      },
    }),
  ]);

  return NextResponse.json({ success: true });
}
