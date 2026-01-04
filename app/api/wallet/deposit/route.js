import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function POST(req) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { amount, provider } = await req.json();

    // SECURITY CHECKS
    if (!amount || amount <= 0)
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });

    if (amount < 50 * 100)
      return NextResponse.json({ error: "Minimum deposit ৳50" }, { status: 400 });

    if (!["BKASH", "NAGAD", "ROCKET"].includes(provider))
      return NextResponse.json({ error: "Invalid provider" }, { status: 400 });

    // WRITE TRANSACTION
    await prisma.$transaction([
      prisma.transaction.create({
        data: {
          userId: decoded.userId,
          type: "DEPOSIT",
          amount: amount, // POSITIVE
          status: "COMPLETED",
          provider,
        },
      }),

      prisma.user.update({
        where: { id: decoded.userId },
        data: {
          totalDeposited: { increment: amount },
        },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
