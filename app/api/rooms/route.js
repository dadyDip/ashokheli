import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

/* ===================================================== */
/* ====================== POST ========================= */
/* ===================================================== */

export async function POST(req) {
  try {
    const auth = req.headers.get("authorization");

    const isInternal =
      auth === `Bearer ${process.env.INTERNAL_ADMIN_TOKEN}`;

    let user = null;

    if (!isInternal) {
      user = await verifyToken(req);
      if (!user) {
        return new Response("Unauthorized", { status: 401 });
      }
    }

    if (!user && !isInternal) {
      return new Response("Unauthorized", { status: 401 });
    }

    const body = await req.json();

    /* ================= GET ROOM ================= */
    if (body.action === "GET") {
      const room = await prisma.room.findUnique({
        where: { id: body.roomId },
      });

      if (!room) {
        return Response.json({ error: "ROOM_NOT_FOUND" }, { status: 404 });
      }

      return Response.json({
        id: room.id,
        gameType: room.gameType,
        entryFee: room.entryFee,
        targetScore: room.targetScore,
        maxPlayers: room.maxPlayers,
        status: room.status,
      });
    }
    /* ===================================================== */
    /* ================= CREATE ROOM ======================= */
    /* ===================================================== */
    if (body.action === "CREATE") {
      const entryFee = Number(body.entryFee ?? 0);
      const targetScore = Number(body.targetScore ?? 30);
      const maxPlayers = Number(body.maxPlayers ?? 4);

      if (!body.gameType) {
        return Response.json(
          { error: "GAME_TYPE_REQUIRED" },
          { status: 400 }
        );
      }

      if (entryFee < 0 || targetScore <= 0 || maxPlayers <= 1) {
        return Response.json(
          { error: "INVALID_VALUES" },
          { status: 400 }
        );
      }

      // 💰 balance check for paid rooms
      if (!isInternal && entryFee > 0 && user.balance < entryFee) {
        return Response.json(
          { error: "INSUFFICIENT_BALANCE" },
          { status: 400 }
        );
      }

      const room = await prisma.room.create({
        data: {
          gameType: body.gameType,
          entryFee,
          matchType: body.matchType,
          targetScore,
          maxPlayers,
          host: { connect: { id: user.id } },  // ✅ CORRECT
          status: "WAITING",
          isInstant: !!body.instant,
          isPublic: true,
        },
      });

      return Response.json({ roomId: room.id });
    }

    /* ===================================================== */
    /* ================= JOIN ROOM ========================= */
    /* ===================================================== */
    if (body.action === "JOIN") {
      if (!body.roomId) {
        return Response.json(
          { error: "ROOM_ID_REQUIRED" },
          { status: 400 }
        );
      }

      const room = await prisma.room.findUnique({
        where: { id: body.roomId },
      });

      if (!room) {
        return Response.json(
          { error: "ROOM_NOT_FOUND" },
          { status: 404 }
        );
      }

      // already joined?
      const existing = await prisma.roomPlayer.findUnique({
        where: {
          roomId_userId: {
            roomId: room.id,
            userId: user.id,
          },
        },
      });

      if (existing) {
        return Response.json({ ok: true });
      }

      // ❗ DO NOT deduct balance here
      // 🔒 Funds are locked at MATCH START only
      await prisma.roomPlayer.create({
        data: {
          roomId: room.id,
          userId: user.id,
          paid: room.entryFee > 0,
        },
      });


      return Response.json({ ok: true });
    }

    /* ===================================================== */
    /* ================= REFUND ROOM ======================= */
    /* ===================================================== */
    if (body.action === "REFUND") {
      if (!isInternal) {
        return Response.json(
          { error: "FORBIDDEN" },
          { status: 403 }
        );
      }

      await refundRoom(body.roomId);
      return Response.json({ ok: true });
    }

    return Response.json(
      { error: "INVALID_ACTION" },
      { status: 400 }
    );
  } catch (err) {
    console.error("🔥 /api/rooms ERROR", err);
    return Response.json(
      { error: "INTERNAL_SERVER_ERROR" },
      { status: 500 }
    );
  }
}

/* ===================================================== */
/* ================= REFUND LOGIC ====================== */
/* ===================================================== */

async function refundRoom(roomId) {
  if (!roomId) return;

  const room = await prisma.room.findUnique({
    where: { id: roomId },
  });

  if (!room || room.entryFee === 0) return;

  const players = await prisma.roomPlayer.findMany({
    where: { roomId, paid: true },
  });

  await prisma.$transaction(async (tx) => {
    for (const p of players) {
      await tx.user.update({
        where: { id: p.userId },
        data: {
          balance: { increment: room.entryFee },
        },
      });
    }

    await tx.roomPlayer.deleteMany({ where: { roomId } });
    await tx.room.delete({ where: { id: roomId } });
  });

}
