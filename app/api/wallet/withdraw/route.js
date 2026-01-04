import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function POST(req) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { amount } = await req.json();

    if (!amount || amount <= 0)
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });

    const transactions = await prisma.transaction.findMany({
      where: { userId: decoded.userId },
    });

    const balance = transactions.reduce((sum, t) => sum + t.amount, 0);

    // 🔐 CRITICAL RULE
    if (balance < amount)
      return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });

    await prisma.$transaction([
      prisma.transaction.create({
        data: {
          userId: decoded.userId,
          type: "WITHDRAW",
          amount: -amount, // NEGATIVE
          status: "PENDING",
        },
      }),

      prisma.user.update({
        where: { id: decoded.userId },
        data: {
          totalWithdrawn: { increment: amount },
        },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
