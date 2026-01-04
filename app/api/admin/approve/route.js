import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function GET(req) {
  const admin = verifyToken(req);

  if (!admin || admin.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const withdraws = await prisma.withdrawRequest.findMany({
    where: { status: "pending" },
    include: {
      user: {
        select: { email: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(withdraws);
}
