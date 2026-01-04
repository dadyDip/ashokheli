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

  const withdraw = await prisma.withdrawRequest.findUnique({
    where: { id },
  });

  if (!withdraw || withdraw.status !== "pending") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // ✅ NO BALANCE CHANGE HERE
  await prisma.$transaction([
    prisma.withdrawRequest.update({
      where: { id },
      data: {
        status: "approved",
        processedAt: new Date(), // ✅ CORRECT FIELD
      },
    }),

    prisma.transaction.updateMany({
      where: {
        userId: withdraw.userId,
        type: "WITHDRAW",
        status: "PENDING",
        reference: withdraw.account,
      },
      data: {
        status: "COMPLETED",
      },
    }),
  ]);

  return NextResponse.json({ success: true });
}
