// app/api/casino/history/route.js
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function GET(req) {
  const user = verifyToken(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const url = new URL(req.url);
    const getAll = url.searchParams.get('all') === 'true';
    
    // Get ALL casino spins - NO LIMIT when all=true
    const spins = await prisma.casinoSpin.findMany({
      where: {
        userId: user.id,
        status: "COMPLETED"
      },
      orderBy: {
        timestamp: 'desc'
      }
      // REMOVED the take limit completely
    });

    // Get ALL casino games
    const games = await prisma.casinoGame.findMany({
      where: {
        userId: user.id,
        status: "COMPLETED"
      },
      orderBy: {
        finishedAt: 'desc'
      }
      // REMOVED the take limit completely
    });

    // Format casino spins
    const formattedSpins = spins.map(spin => ({
      id: spin.id,
      gameCode: spin.gameCode,
      gameName: spin.gameName || spin.gameCode,
      betAmount: spin.betAmount,
      winAmount: spin.winAmount,
      result: spin.winAmount > spin.betAmount ? "win" : "loss",
      status: spin.status,
      timestamp: spin.timestamp,
      gameRound: spin.gameRound,
      matchId: spin.matchId
    }));

    // Format casino games
    const formattedGames = games.map(game => ({
      id: game.id,
      gameCode: game.gameType,
      gameName: game.gameType,
      stake: game.stake,
      winAmount: game.winAmount || 0,
      result: game.winAmount > game.stake ? "win" : "loss",
      status: game.status,
      finishedAt: game.finishedAt,
      startedAt: game.startedAt,
      createdAt: game.createdAt,
      matchId: game.matchId
    }));

    return NextResponse.json({
      success: true,
      spins: formattedSpins,
      games: formattedGames,
      total: formattedSpins.length + formattedGames.length
    });

  } catch (err) {
    console.error("Error fetching casino history:", err);
    return NextResponse.json(
      { error: "Failed to fetch casino history" },
      { status: 500 }
    );
  }
}