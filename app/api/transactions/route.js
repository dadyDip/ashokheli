import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function GET(req) {
  const user = await verifyToken(req);
  if (!user) return new Response("Unauthorized", { status: 401 });

  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const tx = await prisma.transaction.findMany({
    where: {
      userId: user.id,
      createdAt: {
        gte: cutoff, // ✅ last 24 hours only
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return Response.json(tx);
}
