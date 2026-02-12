import { PrismaClient } from "@prisma/client";
import { verifyToken } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET(request) {
  try {
    const user = verifyToken(request);
    
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get fresh user data from database
    const freshUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        promoCode: true,
        balance: true,
        totalDeposited: true,
        createdAt: true,
      }
    });

    if (!freshUser) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    return Response.json(freshUser);
  } catch (error) {
    console.error("Error fetching user:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}