import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function GET(req) {
  try {
    const admin = verifyToken(req);
    if (!admin || admin.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true, // Removed email field
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
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}