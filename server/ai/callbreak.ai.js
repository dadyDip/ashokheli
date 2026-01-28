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

function ensureAIMemory(room) {
  room._aiMemory ||= {
    played: [],
    suitsGone: {
      hearts: 0,
      diamonds: 0,
      clubs: 0,
      spades: 0,
    },
    trumpsPlayed: 0,
  };
}
function ensureWinControl(room) {
  room._winControl ||= {
    games: 0,
    userWins: 0,
  };
}

function winPressure(room) {
  ensureWinControl(room);

  const { games, userWins } = room._winControl;
  if (games < 5) return 0; // warm-up

  const rate = userWins / games;

  if (rate > 0.30) return 1;   // crush harder
  if (rate < 0.20) return -1;  // ease a bit
  return 0;
}


function isBiased(room) {
  return room.fairness?.mode === "SOFT_BIAS";
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

  // Step 1: Score own hand realistically
  let score = 0;
  for (const c of p.hand) {
    if (c.value === "A") score += 1.5;      // Ace almost guarantees 1 trick
    else if (c.value === "K") score += 1;   // King likely wins a trick
    else if (c.value === "Q") score += 0.7;
    else if (c.value === "J") score += 0.5;

    if (c.suit === room.trumpSuit) score += 0.8; // trump boost
  }

  // Small bias for paid / hard mode
  if (isBiased(room)) score += 0.5;

  // Step 2: Account for remaining tricks
  const totalSoFar = Object.values(room.playersData)
    .map(p => p.bid)
    .filter(b => b !== null)
    .reduce((a,b) => a + b, 0);

  const playersLeft = Object.values(room.playersData)
    .filter(p => p.bid === null).length;

  const remainingTricks = Math.max(0, 13 - totalSoFar);

  // Step 3: Calculate safe bid
  let bid = Math.round(score);

  // 🔹 Smart cap: cannot claim more than realistic remaining tricks
  const maxSafe = Math.ceil(remainingTricks / playersLeft);
  bid = Math.min(bid, maxSafe);

  // Step 4: Prevent overbidding too high
  bid = Math.min(bid, 7); // max bid AI will take realistically

  // Step 5: Never bid 0, always secure at least 1 trick
  bid = Math.max(bid, 1);

  // Step 6: Smooth sequential progression
  const previousBid = Object.values(room.playersData)
    .map(p => p.bid)
    .filter(b => b !== null)
    .pop();

  if (previousBid) {
    // Avoid weird jumps, keep ±1 trick
    bid = Math.min(bid, previousBid + 1);
    bid = Math.max(bid, previousBid - 1);
  }

  // Step 7: Optional “confidence tweak” to win your bid
  // If pressure high (user won too often), AI can add +1 trick safely
  if (winPressure(room) === 1) bid = Math.min(bid + 1, maxSafe);

  // Final bid placement
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
  ensureAIMemory(room);

  room._aiMemory.played.push(chosen);
  room._aiMemory.suitsGone[chosen.suit]++;

  if (chosen.suit === room.trumpSuit) {
    room._aiMemory.trumpsPlayed++;
  }


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
  ensureAIMemory(room);

  const mem = room._aiMemory;
  const trump = room.trumpSuit;
  const played = room.playedCards;
  const first = played.length === 0;
  const biased = room.fairness?.mode === "SOFT_BIAS";

  const highFirst = [...legal].sort((a,b) => rank(b.value) - rank(a.value));
  const lowFirst  = [...legal].sort((a,b) => rank(a.value) - rank(b.value));

  // 🧠 LEADING
  if (first) {
    // If trump mostly exhausted → dominate
    if (biased && mem.trumpsPlayed >= 7) {
      const strong = highFirst.filter(c => c.suit === trump);
      if (strong.length) return strong[0];
    }

    // Lead suit that's mostly gone (safe)
    const safeSuit = Object.entries(mem.suitsGone)
      .filter(([_, count]) => count >= 9)
      .map(([s]) => s);

    const safeLead = highFirst.find(c => safeSuit.includes(c.suit));
    if (safeLead) return safeLead;

    // Default safe play
    return lowFirst.find(c => c.suit !== trump) || lowFirst[0];
  }

  // 🧠 FOLLOWING
  const leadSuit = played[0].card.suit;
  const winning = getWinningCard(played, trump);

  const killers = legal.filter(c =>
    beats(c, winning, trump, leadSuit)
  );

  if (killers.length) {
    // Win cheaply
    return killers.sort((a,b) => rank(a.value) - rank(b.value))[0];
  }

  // 🧠 PAID MATCH → SMART SACRIFICE
  if (biased) {
    const dump = lowFirst.filter(c => c.suit !== trump);
    if (dump.length) return dump[0];
  }
  const pressure = winPressure(room);

  if (pressure === 1) {
    // AI goes ruthless
    const killers = legal.filter(c =>
      beats(c, getWinningCard(played, trump), trump, played[0]?.card?.suit)
    );
    if (killers.length) {
      return killers.sort((a,b) => rank(a.value) - rank(b.value))[0];
    }
  }


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
