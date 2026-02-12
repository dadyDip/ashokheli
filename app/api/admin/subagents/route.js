import { PrismaClient } from "@prisma/client";
import { verifyToken } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET(request) {
  try {
    // Use YOUR auth system
    const user = verifyToken(request);
    
    if (!user || user.role !== "admin") {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subAgents = await prisma.user.findMany({
      where: {
        role: "sub-agent"
      },
      include: {
        _count: {
          select: { referrals: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return Response.json({ success: true, subAgents });
  } catch (error) {
    console.error("Error fetching sub-agents:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}