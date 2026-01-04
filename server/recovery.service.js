import prisma from "./prisma.js";
import { restoreRoom, attachAI, startGame } from "./cardGame.js";

/**
 * Recover all matches that were PLAYING when server crashed
 */
export async function recoverUnfinishedMatches(io) {
  const matches = await prisma.match.findMany({
    where: { status: "PLAYING" },
    include: {
      players: true,
    },
  });

  if (matches.length === 0) {
    return;
  }



  for (const match of matches) {

    const room = restoreRoom(match.roomId, match.gameType);

    for (const player of match.players) {
      attachAI(room, player.userId);
    }

    startGame(room, { recovered: true });

    io.to(room.id).emit("match-recovered");
  }
}
