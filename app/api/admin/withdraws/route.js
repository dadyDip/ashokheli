import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function GET(req) {
  try {
    const admin = verifyToken(req);
    if (!admin || admin.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const withdraws = await prisma.withdrawRequest.findMany({
      where: {
        status: "pending"
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true, // Only phone, no email
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    return NextResponse.json(withdraws);
  } catch (error) {
    console.error("Error fetching withdraws:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}