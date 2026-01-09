import { playCard, placeBid } from "../games/callbreak.js";

/* ======================================================
   CONFIG (MATCH SEVENCALLS STYLE)
====================================================== */

const THINK_TIME_MIN = 220;
const THINK_TIME_MAX = 340;

function thinkDelay() {
  return THINK_TIME_MIN + Math.random() * (THINK_TIME_MAX - THINK_TIME_MIN);
}

function rank(v) {
  const order = ["2","3","4","5","6","7","8","9","10","J","Q","K","A"];
  return order.indexOf(v);
}

/* ======================================================
   ENTRY POINT — SINGLE SOURCE OF TRUTH
====================================================== */

export function callbreakAIMove(io, room, pid) {
  if (!room || !pid) return;

  const token = room.roundToken; // 🔒 CAPTURE TOKEN
  const p = room.playersData?.[pid];
  if (!p || !p.isAI || p.connected) return;
  if (room.turn !== pid) return;

  if (p._thinking) return;
  p._thinking = true;

  setTimeout(() => {
    try {
      // ❌ ROUND CHANGED → CANCEL
      if (room.roundToken !== token) return;

      const liveP = room.playersData?.[pid];
      if (!liveP || !liveP.isAI || liveP.connected) return;
      if (room.turn !== pid) return;

      // ❌ TRICK RESOLVING → CANCEL
      if (room.resolvingTrick) return;

      if (room.phase === "bidding") {
        callbreakAIBid(io, room, pid);
      }
      else if (room.phase === "playing") {
        callbreakAIPlay(io, room, pid);
      }
    } finally {
      p._thinking = false;
    }
  }, thinkDelay());
}


/* ======================================================
   BIDDING AI
====================================================== */

function callbreakAIBid(io, room, pid) {
  const p = room.playersData[pid];
  if (!p || p.bid !== null || room.turn !== pid) return;

  let score = 0;
  for (const c of p.hand) {
    if (c.value === "A") score += 1;
    if (["K","Q"].includes(c.value)) score += 0.5;
    if (c.suit === room.trumpSuit) score += 0.75;
  }

  const bid = Math.max(1, Math.min(8, Math.round(score)));

  placeBid(room, pid, bid);
  io.to(room.roomId).emit("update-room", room);

  chainNextAI(io, room);
}

/* ======================================================
   PLAYING AI
====================================================== */

function callbreakAIPlay(io, room, pid) {
  const p = room.playersData[pid];
  if (!p || !p.hand?.length || room.turn !== pid) return;

  const legal = getLegalCards(p, room);
  if (!legal.length) return;

  const chosen = pickCardSmart(p, legal, room); // 👈 NEW
  if (!chosen) return;

  playCard(io, room, pid, chosen);

  // 🔥 FORCE SYNC — THIS FIXES REFRESH BUG
  io.to(room.roomId).emit("update-room", room);

  chainNextAI(io, room);
}

/* ======================================================
   LEGAL CARD LOGIC (UNCHANGED RULES)
====================================================== */

function getLegalCards(p, room) {
  const leadSuit = room.playedCards[0]?.card?.suit;
  const firstPlayer = room.playedCards.length === 0;

  let legal = [...p.hand];

  if (firstPlayer) {
    if (!room.trumpUnlocked) {
      legal = legal.filter(c => c.suit !== room.trumpSuit);
    }
  } else {
    const follow = legal.filter(c => c.suit === leadSuit);
    if (follow.length) {
      legal = follow;
    }
  }

  return legal.length ? legal : [...p.hand];
}
function pickCardSmart(p, legal, room) {
  const trump = room.trumpSuit;
  const played = room.playedCards;
  const first = played.length === 0;

  // Sort high → low
  const highFirst = [...legal].sort((a,b) => rank(b.value) - rank(a.value));
  const lowFirst  = [...legal].sort((a,b) => rank(a.value) - rank(b.value));

  // 🟢 LEADING
  if (first) {
    // Prefer strong non-trump lead
    const strongNonTrump = highFirst.filter(
      c => c.suit !== trump && rank(c.value) >= rank("Q")
    );
    if (strongNonTrump.length) return strongNonTrump[0];

    // Else dump lowest non-trump
    const safe = lowFirst.filter(c => c.suit !== trump);
    if (safe.length) return safe[0];

    // Else forced trump
    return lowFirst[0];
  }

  // 🟢 FOLLOWING
  const leadSuit = played[0].card.suit;
  const winning = getWinningCard(played, trump);

  // Can beat current winner?
  const killers = legal.filter(c =>
    beats(c, winning, trump, leadSuit)
  );

  if (killers.length) {
    // Win cheaply
    return killers.sort((a,b) => rank(a.value) - rank(b.value))[0];
  }

  // Can't win → dump lowest
  return lowFirst[0];
}
function beats(card, current, trump, leadSuit) {
  if (card.suit === current.suit) {
    return rank(card.value) > rank(current.value);
  }
  if (card.suit === trump && current.suit !== trump) return true;
  return false;
}

function getWinningCard(played, trump) {
  let win = played[0].card;
  const leadSuit = win.suit;

  for (const p of played.slice(1)) {
    const c = p.card;
    if (beats(c, win, trump, leadSuit)) win = c;
  }
  return win;
}


/* ======================================================
   AI CHAINING (CRITICAL FIX)
====================================================== */
function chainNextAI(io, room) {
  if (room.resolvingTrick) return;
  if (room.phase !== "playing" && room.phase !== "bidding") return;

  const nextPid = room.turn;
  const nextPlayer = room.playersData?.[nextPid];

  if (nextPlayer?.isAI && !nextPlayer.connected) {
    setTimeout(() => {
      // 🔒 cancel if round changed
      if (room.phase === "ended") return;
      callbreakAIMove(io, room, nextPid);
    }, 200);
  }
}
