import { PrismaClient } from "@prisma/client";
import { verifyToken } from "@/lib/auth";

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    const user = verifyToken(request);
    
    if (!user || user.role !== "admin") {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = await request.json();

    if (!userId) {
      return Response.json({ error: "User ID is required" }, { status: 400 });
    }

    const userToPromote = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!userToPromote) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        role: "sub-agent"
      }
    });

    return Response.json({ 
      success: true, 
      message: "User promoted to sub-agent",
      user: updatedUser 
    });
  } catch (error) {
    console.error("Error promoting user:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}