import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { v4 as uuidv4 } from 'uuid';

export async function POST(req) {
  try {

    /* ================= AUTH ================= */
    const user = verifyToken(req);

    if (!user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }


    /* ================= BODY ================= */
    const body = await req.json();
    const { maxPlayers = 4, entryFee = 0 } = body;

    const safeMaxPlayers = [2, 3, 4].includes(maxPlayers)
      ? maxPlayers
      : 4;

    const safeEntryFee =
      typeof entryFee === "number" && entryFee >= 0
        ? entryFee
        : 0;

    /* ================= CREATE DB ROOM ================= */
    const roomId = "ludo-" + uuidv4().slice(0, 6);

    const room = await prisma.room.create({
      data: {
        id: roomId,
        gameType: "LUDO",
        maxPlayers: safeMaxPlayers,
        entryFee: safeEntryFee,
        status: "WAITING",
        hostId: user.id,
      },
    });



    /* ================= RESPONSE ================= */
    return NextResponse.json({
      success: true,
      roomId: room.id,
      maxPlayers: room.maxPlayers,
      entryFee: room.entryFee,
    });
  } catch (err) {
    console.error("❌ [LUDO CREATE] Error", err);

    return NextResponse.json(
      { success: false, error: "Failed to create Ludo room" },
      { status: 500 }
    );
  }
}
