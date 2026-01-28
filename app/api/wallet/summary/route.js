import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";


export async function GET(req) {
  try {
    const auth = req.headers.get("authorization");

    if (!auth || !auth.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = auth.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    if (!userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        balance: true,
        totalDeposited: true,
        totalWithdrawn: true,
        gamesPlayed: true,
        wins: true,
        losses: true,
      },
    });


    return NextResponse.json(user);
  } catch (err) {
    console.error("Wallet summary error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
