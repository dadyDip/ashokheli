import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

export async function GET(req) {
  try {
    // 🔐 Read & validate token (same pattern as deposits)
    const auth = req.headers.get("authorization");
    if (!auth?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = auth.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // ✅ Fetch pending withdraws
    const withdraws = await prisma.withdrawRequest.findMany({
      where: { status: "pending" },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(withdraws);
  } catch (err) {
    console.error("Admin withdraw fetch error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
