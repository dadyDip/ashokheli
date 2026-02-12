import { PrismaClient } from "@prisma/client";
import { verifyToken } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET(request) {
  try {
    const user = verifyToken(request);
    
    if (!user || user.role !== "sub-agent") {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get referrals for this sub-agent (users who used their promo code or were referred by them)
    const referrals = await prisma.user.findMany({
      where: {
        referredById: user.id
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        totalDeposited: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return Response.json({ success: true, referrals });
  } catch (error) {
    console.error("Error fetching referrals:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}