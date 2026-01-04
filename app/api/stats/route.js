import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function GET(req) {
  const user = verifyToken(req);
  if (!user) return new Response("Unauthorized", { status: 401 });

  const u = await prisma.user.findUnique({
    where: { id: user.id },
  });

  const winRate =
    u.gamesPlayed > 0
      ? Math.round((u.wins / u.gamesPlayed) * 100)
      : 0;

  return Response.json({
    gamesPlayed: u.gamesPlayed,
    wins: u.wins,
    losses: u.losses,
    winRate,
  });
}
