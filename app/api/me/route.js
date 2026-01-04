import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function GET(req) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        transactions: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const balance = user.transactions.reduce(
      (sum, t) => sum + t.amount,
      0
    );

    return NextResponse.json({
      id: user.id,
      name: `${user.firstName} ${user.lastName}`,
      balance,
      totalDeposited: user.totalDeposited,
      totalWithdrawn: user.totalWithdrawn,
      gamesPlayed: user.gamesPlayed,
      wins: user.wins,
      losses: user.losses,
      transactions: user.transactions,
    });
  } catch (err) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}
