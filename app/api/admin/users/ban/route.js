import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function POST(req) {
  const admin = verifyToken(req);
  if (!admin || admin.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId, banned } = await req.json();
  if (!userId || typeof banned !== "boolean") {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: userId },
    data: { isBanned: banned },
  });

  return NextResponse.json({ success: true });
}
