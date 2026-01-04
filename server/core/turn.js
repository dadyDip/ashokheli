import { triggerAITurn } from "../ai/ai.controller.js";

/**
 * Advance turn to next human OR AI player
 * @param {object} room
 */
export function nextTurn(room) {
  const idx = room.order.indexOf(room.turn);

  for (let n = 1; n <= 4; n++) {
    const next = room.order[(idx + n) % 4];
    const p = room.playersData[next];
    if (!p) continue;

    // ✅ AI seats are valid turns
    if (p.connected || p.isAI) {
      room.turn = next;

      console.log("➡️ NEXT TURN", {
        nextPid: next,
        connected: p.connected,
        isAI: p.isAI,
        phase: room.phase,
        gameType: room.gameType,
      });

      // 🤖 auto-trigger AI
      if (p.isAI && !p.connected) {
        setTimeout(() => triggerAITurn(room), 300);
      }

      return;
    }
  }
}

