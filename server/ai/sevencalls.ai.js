import {
  playCard,
  placeBid,
  setPowerCard,
  revealPower
} from "../games/sevenCalls.js";

function getAIRole(room, pid) {
  const p = room.playersData[pid];
  if (!p?.isAI) return "HUMAN";

  const teammate = Object.values(room.playersData)
    .find(x => x.team === p.team && x.pid !== pid);

  if (teammate && !teammate.isAI) return "HUMAN_TEAM_AI";
  return "ENEMY_AI";
}

function applyHandicap(value, role) {
  if (role === "HUMAN_TEAM_AI") {
    // 20–35% decision degradation
    return value * (0.65 + Math.random() * 0.15);
  }
  return value; // enemy AI untouched
}

function aiMistakeChance(role, base) {
  if (role === "HUMAN_TEAM_AI") {
    return base + Math.random() * 0.15; // 15–30%
  }
  return base * 0.3; // enemy AI almost perfect
}


/* ======================================================
   CONFIG
====================================================== */

const THINK_TIME_MIN = 220;
const THINK_TIME_MAX = 340;

function thinkDelay() {
  return THINK_TIME_MIN + Math.random() * (THINK_TIME_MAX - THINK_TIME_MIN);
}

const BID_OPTIONS = [5, 7, 8];

function cardRank(v) {
  return ["2","3","4","5","6","7","8","9","10","J","Q","K","A"].indexOf(v);
}

function isBig(c) {
  return ["A","K","Q","J","10"].includes(c.value);
}

function suitCount(hand) {
  const m = {};
  for (const c of hand) m[c.suit] = (m[c.suit] || 0) + 1;
  return m;
}


function rank(v) {
  const order = ["2","3","4","5","6","7","8","9","10","J","Q","K","A"];
  return order.indexOf(v);
}

function ensureAIMemory(room) {
  room._aiMemory ||= {
    played: [],
    suitsGone: { hearts:0, diamonds:0, clubs:0, spades:0 },
    trumpsPlayed: 0
  };
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

  const role = getAIRole(room, pid);
  const cards = p.fullHand ?? p.hand;

  /* ===============================
     HAND EVALUATION (IMPROVED)
  =============================== */

  const suitStats = {};
  for (const c of cards) {
    suitStats[c.suit] ??= {
      count: 0,
      big: 0,   // A,K
      mid: 0    // Q,J
    };

    suitStats[c.suit].count++;

    if (["A", "K"].includes(c.value)) suitStats[c.suit].big++;
    else if (["Q", "J"].includes(c.value)) suitStats[c.suit].mid++;
  }

  let raw = 0;
  let strongSuitFound = false;

  for (const s in suitStats) {
    const { count, big, mid } = suitStats[s];

    // 🔥 MAIN TRIGGERS YOU ASKED FOR
    if (big >= 2 && count >= 2) {
      raw += 3.5;               // 2 big same suit → push 7
      strongSuitFound = true;
    }

    if (count >= 3) {
      raw += 2.8;               // 3 same suit → push 7
      strongSuitFound = true;
    }

    // normal scaling
    if (count === 4) raw += 1.5;
    if (count >= 5) raw += 2.2;

    if (big === 1 && mid >= 1) raw += 0.8;
    if (big >= 1 && count >= 3) raw += 1.2;
  }

  /* ===============================
     TEAM ASSUMPTION
  =============================== */

  const teammate = Object.values(room.playersData)
    .find(x => x.team === p.team && x.pid !== pid);

  if (teammate) raw += 0.4;

  /* ===============================
     ROLE ADJUSTMENT
  =============================== */

  if (role === "HUMAN_TEAM_AI") {
    // overconfident but weak cards overall (bias already applied)
    raw += 0.7;

    if (Math.random() < 0.25) raw -= 0.6; // doubt
  }

  if (role === "ENEMY_AI") {
    // calmer, slightly better judgement
    if (Math.random() < 0.2) raw += 0.5;
  }

  raw = applyHandicap(raw, role);

  /* ===============================
     BID DECISION (AGGRESSIVE 7)
  =============================== */

  let bid = 5;

  // 🔥 FORCE TRY FOR 7 IF CONDITIONS MET
  if (strongSuitFound) {
    if (Math.random() < 0.7) bid = 7; // MOST of the time
  }

  // normal ladder
  if (raw >= 6.5) bid = 8;
  else if (raw >= 3.6 && Math.random() < 0.75) bid = 7;

  /* ===============================
     BELIEVABLE ERRORS
  =============================== */

  // teammate AI sometimes overbids
  if (role === "HUMAN_TEAM_AI" && bid === 7 && Math.random() < 0.15) {
    bid = 8;
  }

  // enemy AI rarely drops
  if (role === "ENEMY_AI" && Math.random() < 0.05) {
    bid = 5;
  }

  bid = Math.max(5, Math.min(8, bid));

  placeBid(room, pid, bid);
  io.to(room.roomId).emit("update-room", room);
  chainNextAI(io, room);
}



/* ======================================================
   POWER SELECT AI
====================================================== */

function sevenCallsAISetPower(io, room, pid) {
  const p = room.playersData[pid];
  if (!p || room.highestBidder !== pid || room.turn !== pid) return;
  if (p.connected) return;
  const role = getAIRole(room, pid);
  const suits = suitCount(p.hand);

  let bestSuit = null;
  let bestScore = -1;

  for (const s in suits) {
    const cards = p.hand.filter(c => c.suit === s);
    let score = suits[s];

    if (cards.some(c => c.value === "A")) score += 3;
    if (cards.some(c => c.value === "K")) score += 2;

    // Trap preference: long but not obvious
    if (suits[s] === 4) score += 2;

    if (score > bestScore) {
      bestScore = score;
      bestSuit = s;
      if (role === "HUMAN_TEAM_AI" && Math.random() < 0.25) {
        // prefers slightly shorter suit (still reasonable)
        const alt = Object.entries(suits)
          .filter(([s]) => s !== bestSuit)
          .sort((a,b)=>b[1]-a[1])[0]?.[0];

        if (alt) bestSuit = alt;
      }
    }
  }

  const powerCard =
    p.hand
      .filter(c => c.suit === bestSuit)
      .sort((a,b)=>cardRank(a.value)-cardRank(b.value))[0];

  if (!powerCard) return;

  setPowerCard(room, pid, powerCard);
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
  const role = getAIRole(room, pid);

  // hesitation: miss perfect play
  if (role === "HUMAN_TEAM_AI" && Math.random() < 0.18) {
    return legal.sort((a,b)=>cardRank(a.value)-cardRank(b.value))[0];
  }

  const p = room.playersData[pid];
  const trick = room.playedCards;
  const leadSuit = trick[0]?.card?.suit;
  const powerSuit = room.powerSuit || room.hiddenPower?.card?.suit;

  // 🧨 CUT WHEN HUMANS GET GREEDY
  if (
    leadSuit &&
    powerSuit &&
    legal.some(c => c.suit === powerSuit) &&
    trick.some(t => !room.playersData[t.pid].isAI)
  ) {
    return legal
      .filter(c => c.suit === powerSuit)
      .sort((a,b)=>cardRank(a.value)-cardRank(b.value))[0];
  }

  // 🎣 BAIT: lead low in strong suit
  if (!leadSuit) {
    const suits = suitCount(p.hand);
    const baitSuit = Object.entries(suits)
      .sort((a,b)=>b[1]-a[1])[0][0];

    const bait = p.hand
      .filter(c => c.suit === baitSuit)
      .sort((a,b)=>cardRank(a.value)-cardRank(b.value));

    if (bait.length > 1) {
      if (role === "HUMAN_TEAM_AI" && Math.random() < 0.3) {
        return bait[1]; // plays slightly higher bait
      }
      return bait[0];
    }

  }

  // 🧠 PROTECT TEAMMATE
  const teammate = Object.values(room.playersData)
    .find(x => x.team === p.team && x.pid !== pid);

  if (teammate) {
    const tp = trick.find(t => t.pid === teammate.pid);
    if (tp) {
      const winning =
        trick.every(t =>
          t.pid === teammate.pid ||
          cardRank(tp.card.value) > cardRank(t.card.value)
        );
        if (winning) {
          if (role === "HUMAN_TEAM_AI" && Math.random() < 0.25) {
            // misread trick
            return legal.sort((a,b)=>cardRank(a.value)-cardRank(b.value))[0];
          }
          return legal.sort((a,b)=>cardRank(a.value)-cardRank(b.value))[0];
        }
    }
  }

  // ⚔️ WIN WITH MINIMUM FORCE
  if (leadSuit) {
    const highest = trick
      .filter(t => t.card.suit === leadSuit)
      .sort((a,b)=>cardRank(b.card.value)-cardRank(a.card.value))[0];

    const win = legal
      .filter(c => c.suit === leadSuit)
      .filter(c => cardRank(c.value) > cardRank(highest.card.value))
      .sort((a,b)=>cardRank(a.value)-cardRank(b.value));

    if (win.length) return win[0];
      }
    if (
      role === "HUMAN_TEAM_AI" &&
      room.trick >= 7 &&
      Math.random() < 0.35
    ) {
      // loses endgame by timing
      return legal.sort((a,b)=>cardRank(a.value)-cardRank(b.value))[0];
    }


  // 🗑️ DUMP TRASH
  return legal.sort((a,b)=>cardRank(a.value)-cardRank(b.value))[0];
}

