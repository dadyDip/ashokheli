import { createDeck, shuffle } from "../core/deck.js";
import { onGameEnded } from "../cardGame.js";

/* =====================================================
   CONSTANTS
===================================================== */
const BLIND_MULT = 1;
const SEEN_MULT = 2;
const MAX_BET = 1024;

/* =====================================================
   START FLASH HAND
===================================================== */
export function startFlash(room) {
  const deck = createDeck();
  shuffle(deck);

  const activePids = room.order.filter(pid => {
    const p = room.playersData[pid];
    return p.connected && !p.isEliminated && p.chips >= room.entryFee;
  });

  room.flash = {
    handNo: (room.flash?.handNo || 0) + 1,
    pot: 0,
    boot: room.entryFee,
    currentBet: room.entryFee,
    activePids,
    seen: {},
    packed: {},
    lastRaiser: null,
    turnCount: 0
  };

  activePids.forEach(pid => {
    const p = room.playersData[pid];
    p.hand = deck.splice(0, 3);
    p.isSeen = false;
    p.isPacked = false;

    p.chips -= room.entryFee;
    room.flash.pot += room.entryFee;
  });

  room.turn = activePids[0];
  room.phase = "betting";
}

/* =====================================================
   ACTION HANDLER
===================================================== */
export function flashAction(room, pid, action, amount = 0) {
  if (room.phase !== "betting") return;
  if (room.turn !== pid) return;

  const p = room.playersData[pid];
  const F = room.flash;
  if (!p || p.isPacked) return;

  const mult = p.isSeen ? SEEN_MULT : BLIND_MULT;

  switch (action) {
    case "PACK":
      p.isPacked = true;
      removeActive(room, pid);
      break;

    case "SEEN": {
      if (p.isSeen) return;
      const cost = F.currentBet * SEEN_MULT;
      if (p.chips < cost) return;
      p.chips -= cost;
      F.pot += cost;
      p.isSeen = true;
      break;
    }

    case "CALL": {
      const amt = F.currentBet * mult;
      if (p.chips < amt) return;
      p.chips -= amt;
      F.pot += amt;
      break;
    }

    case "RAISE": {
      const raiseTo = Number(amount);
      if (raiseTo <= F.currentBet || raiseTo > MAX_BET) return;

      const amt = raiseTo * mult;
      if (p.chips < amt) return;

      F.currentBet = raiseTo;
      p.chips -= amt;
      F.pot += amt;
      F.lastRaiser = pid;
      break;
    }

    case "SHOW":
      if (F.activePids.length === 2) {
        resolveShowdown(room);
        return;
      }
      return;
  }

  if (F.activePids.length === 1) {
    endHand(room, F.activePids[0]);
    return;
  }

  nextTurn(room);
}

/* =====================================================
   TURN
===================================================== */
function nextTurn(room) {
  const F = room.flash;
  const idx = F.activePids.indexOf(room.turn);
  room.turn = F.activePids[(idx + 1) % F.activePids.length];
  F.turnCount++;

  if (F.turnCount > 50 && F.activePids.length === 2) {
    resolveShowdown(room);
  }
}

/* =====================================================
   SHOWDOWN + HAND COMPARISON
===================================================== */
function resolveShowdown(room) {
  room.phase = "showdown";

  const [a, b] = room.flash.activePids;
  const handA = evaluateHand(room.playersData[a].hand);
  const handB = evaluateHand(room.playersData[b].hand);

  const winner = compareHands(handA, handB) > 0 ? a : b;
  endHand(room, winner);
}

/* =====================================================
   HAND END
===================================================== */
function endHand(room, winnerPid) {
  room.playersData[winnerPid].chips += room.flash.pot;

  cleanup(room);

  if (room.order.length < 2) {
    room.phase = "ended";
    onGameEnded(room);
    return;
  }

  startFlash(room);
}

/* =====================================================
   HAND RANKING (REAL TEEN PATTI)
===================================================== */
const RANKS = ["2","3","4","5","6","7","8","9","10","J","Q","K","A"];

function rankValue(v) {
  return RANKS.indexOf(v);
}

function evaluateHand(cards) {
  const values = cards.map(c => rankValue(c.value)).sort((a,b)=>a-b);
  const suits = cards.map(c => c.suit);

  const isFlush = suits.every(s => s === suits[0]);
  const isTrail = values[0] === values[1] && values[1] === values[2];

  // Sequence incl A-2-3
  let isSeq =
    values[2] - values[1] === 1 &&
    values[1] - values[0] === 1;

  const isA23 = values.toString() === "0,1,12";
  if (isA23) isSeq = true;

  let rank;
  if (isTrail) rank = 6;
  else if (isSeq && isFlush) rank = 5;
  else if (isSeq) rank = 4;
  else if (isFlush) rank = 3;
  else if (values[0] === values[1] || values[1] === values[2]) rank = 2;
  else rank = 1;

  return {
    rank,
    values: isA23 ? [1,0,-1] : values.slice().reverse()
  };
}

function compareHands(a, b) {
  if (a.rank !== b.rank) return a.rank - b.rank;
  for (let i = 0; i < 3; i++) {
    if (a.values[i] !== b.values[i]) {
      return a.values[i] - b.values[i];
    }
  }
  return 0;
}




/* =====================================================
   DISCONNECT HANDLING
===================================================== */
export function flashDisconnect(room, pid) {
  const p = room.playersData[pid];
  if (!p) return;

  p.isPacked = true;
  p.isEliminated = true;
  removeActive(room, pid);
}

/* =====================================================
   HELPERS
===================================================== */
function removeActive(room, pid) {
  room.flash.activePids =
    room.flash.activePids.filter(x => x !== pid);
}

/* =====================================================
   HELPERS
===================================================== */


function cleanup(room) {
  room.order = room.order.filter(pid => {
    const p = room.playersData[pid];
    return !p.isEliminated && p.chips > 0;
  });
}