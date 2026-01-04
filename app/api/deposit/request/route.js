import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function POST(req) {
  const user = verifyToken(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { method, amount, trxId } = await req.json();

  if (!method || !amount || !trxId) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const taka = Number(amount);

  if (isNaN(taka) || taka <= 0) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }

  // ✅ CONVERT HERE (ONCE)
  const paisa = Math.round(taka * 100);

  try {
    await prisma.depositRequest.create({
      data: {
        userId: user.id,
        method,
        amount: paisa, // ✅ STORED AS PAISA
        trxId,
        status: "pending",
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: "Duplicate or invalid transaction" },
      { status: 400 }
    );
  }
}
