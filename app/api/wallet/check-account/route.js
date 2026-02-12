// app/api/wallet/check-account/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function GET(req) {
  const user = verifyToken(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const number = url.searchParams.get('number');
  const type = url.searchParams.get('type');

  if (!number || !type) {
    return NextResponse.json({ error: "Number and type required" }, { status: 400 });
  }

  try {
    // Check if this number+type exists for ANY user
    const existingWallet = await prisma.eWallet.findFirst({
      where: {
        accountNumber: number,
        type: type
      }
    });

    if (!existingWallet) {
      return NextResponse.json({ exists: false });
    }

    // Check if it belongs to current user
    const isOwn = existingWallet.userId === user.id;

    return NextResponse.json({
      exists: true,
      isOwn: isOwn,
      userId: existingWallet.userId
    });

  } catch (err) {
    console.error("Error checking account:", err);
    return NextResponse.json(
      { error: "Failed to check account" },
      { status: 500 }
    );
  }
}