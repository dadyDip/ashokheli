// app/api/rooms/verify-access/route.js
import { getUserFromToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req) {
  const user = await getUserFromToken(req);
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { roomId } = await req.json();

  const room = await prisma.room.findUnique({ where: { id: roomId } });
  if (!room) {
    return Response.json({ error: "Room not found" }, { status: 404 });
  }

  if (room.entryFee > 0) {
    const wallet = await prisma.wallet.findUnique({
      where: { userId: user.id },
    });

    if (!wallet || wallet.balance < room.entryFee) {
      return Response.json(
        { error: "Insufficient balance" },
        { status: 403 }
      );
    }
  }

  return Response.json({ ok: true });
}
