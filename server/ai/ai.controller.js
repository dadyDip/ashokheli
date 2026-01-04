import { callbreakAIMove } from "./callbreak.ai.js";
import { sevenCallsAIMove } from "./sevencalls.ai.js";

function emit(io, room) {
  if (!io || !room) return;
  io.to(room.roomId).emit("update-room", room);
}

export function triggerAITurn(io, room) {
  if (!room) return;

  // Only active phases
  if (!["bidding", "playing", "power-select"].includes(room.phase)) return;

  const pid = room.turn;
  if (!pid) return;

  const p = room.playersData?.[pid];

  console.log("🤖 triggerAITurn", {
    pid,
    connected: p?.connected,
    isAI: p?.isAI,
    phase: room.phase,
    gameType: room.gameType,
  });

  // Only AI + not connected
  if (!p || !p.isAI || p.connected) return;

  // 🛡️ Guard: prevent infinite loops / double thinking
  if (room._aiThinking) return;
  room._aiThinking = true;

  setTimeout(() => {
    try {
      console.log("🤖 AI MOVE", room.gameType, pid);

      if (room.gameType === "callbreak") {
        callbreakAIMove(io, room, pid);
      } else if (room.gameType === "seven") {
        sevenCallsAIMove(io, room, pid);
      }

      emit(io, room);
    } finally {
      // Always release lock
      room._aiThinking = false;
    }
  }, 200);
}
