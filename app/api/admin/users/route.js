import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function GET(req) {
  const admin = verifyToken(req);
  if (!admin || admin.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      role: true,
      isVerified: true,
      isBanned: true,
      balance: true,
      totalDeposited: true,
      totalWithdrawn: true,
      gamesPlayed: true,
      wins: true,
      losses: true,
      createdAt: true,
      lastActiveAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(users);
}
