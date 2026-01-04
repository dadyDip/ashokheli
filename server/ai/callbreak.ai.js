import { playCard, placeBid } from "../games/callbreak.js";
const AI_THINK_TIME = 3000; // 3 seconds

function rank(v) {
  const order = ["2","3","4","5","6","7","8","9","10","J","Q","K","A"];
  return order.indexOf(v);
}

export function callbreakAIMove(io, room, pid) {
  // ✅ Safe player lookup
  let p = room.playersData[pid];

  // If PID is invalid, pick any AI still in the game
  if (!p || !p.isAI) {
    const fallbackPid = Object.keys(room.playersData).find(
      key => room.playersData[key]?.isAI && !room.playersData[key]?.connected
    );
    if (!fallbackPid) return; // No AI left
    pid = fallbackPid;
    p = room.playersData[pid];
  }

  // Skip if human is connected
  if (p.connected) return;
  setTimeout(() => {
    // Phase handling
    if (room.phase === "bidding") {
      callbreakAIBid(io, room, pid);
    } else if (room.phase === "playing") {
      callbreakAIPlay(io, room, pid);
    }
  }, AI_THINK_TIME);
}


function callbreakAIBid(io, room, pid) {
  const p = room.playersData[pid];
  if (!p || p.bid != null) return;

  // AI bid heuristic
  let score = 0;
  for (const c of p.hand) {
    if (c.value === "A") score += 1;
    if (["K","Q"].includes(c.value)) score += 0.5;
    if (c.suit === room.trumpSuit) score += 0.75;
  }

  const bid = Math.max(1, Math.min(8, Math.round(score)));
  placeBid(room, pid, bid);

  io.to(room.roomId).emit("update-room", room);

  // ✅ Trigger next AI if needed
  const nextPid = room.turn;
  const nextPlayer = room.playersData[nextPid];
  if (nextPlayer?.isAI && !nextPlayer.connected) {
    setTimeout(() => callbreakAIMove(io, room, nextPid), 200);
  }
}

function callbreakAIPlay(io, room, pid) {
  const p = room.playersData[pid];
  if (!p || room.turn !== pid) return;
  if (!p.hand.length) return;

  const leadSuit = room.playedCards[0]?.card?.suit;
  let legal = [...p.hand];

  if (leadSuit) {
    const follow = legal.filter(c => c.suit === leadSuit);
    if (follow.length) legal = follow;
  }

  // Play lowest card
  legal.sort((a, b) => rank(a.value) - rank(b.value));

  const chosen = legal[0];
  if (!chosen) return;

  playCard(io, room, pid, chosen);

  // ✅ Trigger next AI if next turn is AI
  const nextPid = room.turn;
  const nextPlayer = room.playersData[nextPid];
  if (nextPlayer?.isAI && !nextPlayer.connected) {
    setTimeout(() => callbreakAIMove(io, room, nextPid), 200);
  }
}
