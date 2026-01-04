import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

export async function GET(req) {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = auth.split(" ")[1];
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  if (decoded.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const deposits = await prisma.depositRequest.findMany({
    where: { status: "pending" },
    include: { user: true },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(deposits);
}
