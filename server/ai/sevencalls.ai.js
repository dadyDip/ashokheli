import {
  playCard,
  placeBid,
  setPowerCard,
  revealPower
} from "../games/sevenCalls.js";

/* ======================================================
   CONFIG
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
   ENTRY POINT (SINGLE SOURCE OF TRUTH)
====================================================== */

export function sevenCallsAIMove(io, room, pid) {
  if (!room || !pid) return;

  const p = room.playersData?.[pid];
  if (!p || !p.isAI || p.connected) return;
  p.memory ??= {
    playedCards: [],
    voidSuits: {} // pid -> Set(suits)
  };

  if (room.turn !== pid) return;

  // block during pending reveal by others
  if (room.pendingReveal && room.pendingReveal.playerId !== pid) return;

  if (p._thinking) return;
  p._thinking = true;

  setTimeout(() => {
    try {
      const liveP = room.playersData?.[pid];
      if (!liveP || !liveP.isAI || liveP.connected) return;
      if (room.turn !== pid) return;

      if (room.phase === "bidding") {
        sevenCallsAIBid(io, room, pid);
      }
      else if (room.phase === "power-select") {
        sevenCallsAISetPower(io, room, pid);
      }
      else if (room.phase === "playing") {
        sevenCallsAIPlay(io, room, pid);
      }
    } finally {
      p._thinking = false;
    }
  }, thinkDelay());
}

/* ======================================================
   BIDDING AI
====================================================== */

function sevenCallsAIBid(io, room, pid) {
  const p = room.playersData[pid];
  if (!p || p.bid !== null || room.turn !== pid) return;

  const suitMap = {};
  for (const c of p.hand) {
    suitMap[c.suit] ??= [];
    suitMap[c.suit].push(c);
  }

  let bid = 5;
  for (const suit in suitMap) {
    const cards = suitMap[suit];
    const big = cards.filter(c => ["A","K","Q"].includes(c.value));
    if (cards.length >= 4 || big.length >= 3) {
      bid = 7;
      break;
    }
  }

  placeBid(room, pid, bid);
  io.to(room.roomId).emit("update-room", room);

  // ✅ Trigger next AI if needed
  const nextPid = room.turn;
  const nextPlayer = room.playersData[nextPid];
  if (nextPlayer?.isAI && !nextPlayer.connected) {
    setTimeout(() => sevenCallsAIMove(io, room, nextPid), 200);
  }
}

/* ======================================================
   POWER SELECT AI
====================================================== */

function sevenCallsAISetPower(io, room, pid) {
  const p = room.playersData[pid];
  if (!p || room.highestBidder !== pid || room.turn !== pid) return;

  // ✅ if player is online, AI does nothing
  if (p.connected) return;

  // AI chooses power card as before
  const suitScore = {};
  for (const c of p.hand) {
    suitScore[c.suit] ??= 0;
    if (c.value === "A") suitScore[c.suit] += 3;
    if (c.value === "K") suitScore[c.suit] += 2;
    if (c.value === "Q") suitScore[c.suit] += 1;
    if (c.value === "J") suitScore[c.suit] += 0.5;
  }

  const bestSuit = Object.entries(suitScore)
    .sort((a, b) => b[1] - a[1])[0]?.[0];
  if (!bestSuit) return;

  const card = p.hand.find(c => c.suit === bestSuit);
  if (!card) return;

  setPowerCard(room, pid, card);
  io.to(room.roomId).emit("update-room", room);

  setTimeout(() => chainNextAI(io, room), 200);
}



/* ======================================================
   PLAYING AI
====================================================== */

function sevenCallsAIPlay(io, room, pid) {
  const p = room.playersData[pid];
  if (!p || !p.hand?.length || room.turn !== pid) return;

  /* ---------- REVEAL LOGIC ---------- */

  if (room.pendingReveal?.playerId === pid) {
    // reveal power if needed
    if (shouldRevealPower(room, pid)) {
      revealPower(io, room, pid); // unified
    } else {
      room.playersData[pid].passedReveal = true;
      room.pendingReveal = null;
      // continue AI move
      sevenCallsAIMove(io, room, pid);
    }
    return; // stop current playCard, AI move continues
  }


  if (room.pendingReveal) return;

  /* ---------- CARD CHOICE ---------- */

  const leadSuit = room.playedCards[0]?.card?.suit;
  let legal = [...p.hand];

  if (leadSuit) {
    const follow = legal.filter(c => c.suit === leadSuit);
    if (follow.length) legal = follow;
  }


  const chosen = chooseAggressiveCard(room, pid, legal);

  if (!chosen) return;

  playCard(io, room, pid, chosen);
  rememberPlay(room, pid, chosen);


  chainNextAI(io, room);
}

/* ======================================================
   REVEAL DECISION
====================================================== */

function shouldRevealPower(room, pid) {
  if (room.hiddenPower?.revealed) return false;

  const p = room.playersData[pid];
  const team = p.team;
  const opp = team === 1 ? 2 : 1;

  // EARLY GAME CONTROL
  if (room.trick <= 2) return true;

  // IF LOSING → REVEAL
  if ((room.teamTricks[opp] ?? 0) >= (room.teamTricks[team] ?? 0)) {
    return true;
  }

  // ENDGAME = TOTAL DOMINATION
  if (room.trick >= 4) return true;

  return false;
}




/* ======================================================
   AI CHAINING (CALLBREAK-STYLE)
====================================================== */

function chainNextAI(io, room) {
  const nextPid = room.turn;
  const nextPlayer = room.playersData?.[nextPid];

  if (nextPlayer?.isAI && !nextPlayer.connected) {
    setTimeout(() => {
      sevenCallsAIMove(io, room, nextPid);
    }, 200);
  }
}


function rememberPlay(room, pid, card) {
  for (const player of Object.values(room.playersData)) {
    if (!player.isAI) continue;

    player.memory.playedCards.push({ pid, card });

    const leadSuit = room.playedCards[0]?.card?.suit;
    if (leadSuit && card.suit !== leadSuit) {
      player.memory.voidSuits[pid] ??= new Set();
      player.memory.voidSuits[pid].add(leadSuit);
    }
  }
}

function chooseAggressiveCard(room, pid, legal) {
  const p = room.playersData[pid];
  const trick = room.playedCards;
  const leadSuit = trick[0]?.card?.suit;
  const powerSuit =
    room.hiddenPower?.suit ??
    room.hiddenPower?.card?.suit ??
    room.powerSuit;

  /* ===============================
     🧨 POWER CUT (DOMINATION)
  =============================== */

  if (
    powerSuit &&
    leadSuit &&
    leadSuit !== powerSuit &&
    legal.some(c => c.suit === powerSuit)
  ) {
    const highest = trick
      .filter(t => t.card.suit === leadSuit)
      .sort((a, b) => rank(b.card.value) - rank(a.card.value))[0];

    // Only cut if trick is valuable
    if (!highest || rank(highest.card.value) >= rank("Q")) {
      return legal
        .filter(c => c.suit === powerSuit)
        .sort((a, b) => rank(a.value) - rank(b.value))[0];
    }
  }

  /* ===============================
     🎣 BAIT LOGIC (HUMAN TRAP)
  =============================== */
  const memory = p.memory;

  // Lead suit opponents are void in
  if (!leadSuit && memory) {
    for (const [oppPid, suits] of Object.entries(memory.voidSuits)) {
      const suit = [...suits][0];
      const killer = p.hand
        .filter(c => c.suit === suit)
        .sort((a, b) => rank(b.value) - rank(a.value))[0];
      if (killer) return killer;
    }
  }


  if (!leadSuit) {
    // Lead LOW in strong suit to bait A/K
    const suitCounts = {};
    for (const c of p.hand) suitCounts[c.suit] ??= 0, suitCounts[c.suit]++;

    const baitSuit = Object.entries(suitCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0];

    const baitCards = p.hand
      .filter(c => c.suit === baitSuit)
      .sort((a, b) => rank(a.value) - rank(b.value));

    if (baitCards.length > 1) return baitCards[0];
  }

  /* ===============================
     ⚔️ TRICK WINNING LOGIC
  =============================== */

  if (leadSuit) {
    const highest = trick
      .filter(t => t.card.suit === leadSuit)
      .sort((a, b) => rank(b.card.value) - rank(a.card.value))[0];

    const winning = legal
      .filter(c => c.suit === leadSuit)
      .filter(c => rank(c.value) > rank(highest.card.value))
      .sort((a, b) => rank(a.value) - rank(b.value));

    if (winning.length) {
      // Win with minimum force
      return winning[0];
    }
  }

  /* ===============================
     🗑️ DUMP TRASH (LOSS CONTROL)
  =============================== */

  return legal.sort((a, b) => rank(a.value) - rank(b.value))[0];
}

