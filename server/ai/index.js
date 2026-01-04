import { callbreakAIMove } from "./callbreak.ai.js";
import { sevenCallsAIMove } from "./sevencalls.ai.js";

/**
 * Handles AI move for current turn
 */
export function handleAIMove(io, room, pid) {
  const p = room.playersData[pid];

  if (!p || !p.isAI) return;

  console.log("🤖 AI MOVE", room.gameType, room.phase, pid);

  if (room.gameType === "callbreak") {
    callbreakAIMove(io, room, pid);
  } else if (room.gameType === "seven") {
    sevenCallsAIMove(io, room, pid);
  }
}
