import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function verifyAdmin(request) {
  try {
    // Get token from cookies
    const token = request.cookies.get("token")?.value;
    if (!token) return null;

    // Since you're using localStorage, we need a different approach
    // For API routes, you can send user data in headers or verify via database
    
    // Alternative: Get user ID from headers
    const userId = request.headers.get("x-user-id");
    const userRole = request.headers.get("x-user-role");
    
    if (!userId || userRole !== "admin") {
      return null;
    }

    // Verify user exists and is admin
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || user.role !== "admin") {
      return null;
    }

    return user;
  } catch (error) {
    console.error("Auth error:", error);
    return null;
  }
}

export async function verifySubAgent(request) {
  try {
    const userId = request.headers.get("x-user-id");
    const userRole = request.headers.get("x-user-role");
    
    if (!userId || userRole !== "sub-agent") {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || user.role !== "sub-agent") {
      return null;
    }

    return user;
  } catch (error) {
    console.error("Auth error:", error);
    return null;
  }
}