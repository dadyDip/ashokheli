import { createDeck, shuffle, deal } from "../core/deck.js";
import { compareCards } from "../core/compareCards.js";
import { nextTurn } from "../core/turn.js";
import { onGameEnded } from "../cardGame.js";
import { triggerAITurn } from "../ai/ai.controller.js";


/* =====================================================
   START GAME / ROUND
===================================================== */
export function startCallBreak(room) {
  console.log("🎮 [CallBreak] startCallBreak", room.roomId);

  console.log("ORDER:", room.order);

  room.order.forEach(pid => {
    console.log("player before deal:", pid, room.playersData[pid]);
  });

  if (!room.round) room.round = 1;
  if (room.dealerIndex === undefined) room.dealerIndex = 0;

  room.phase = "bidding";
  room.playedCards = [];
  room.bids = {};
  const deck = createDeck();
  shuffle(deck);

  // 🔥 Trump revealed BEFORE bidding (Bangladeshi rule)
  room.trumpCard = deck[deck.length - 1];
  room.trumpSuit = room.trumpCard.suit;
  room.tricksPlayed = 0;
  room.roundToken = (room.roundToken || 0) + 1;
  room.trumpUnlocked = false;
  let hands;
  if (room.fairness?.mode === "SOFT_BIAS") {
    hands = biasedDeal(deck, room);
  } else {
    hands = deal(deck, room.order, 13);
  }
  room.order.forEach(pid => {
    const p = room.playersData[pid];
    p.hand = hands[pid];
    p.tricks = 0;
    p.bid = null;
  });
  delete room._aiMemory;
  
  // First bidder = left of dealer
  room.turn = room.order[(room.dealerIndex + 1) % 4];
}

function biasedDeal(deck, room) {
  const aiPids = room.order.filter(pid => room.playersData[pid].isAI);
  const humanPids = room.order.filter(pid => !room.playersData[pid].isAI);

  const HIGH = ["A", "K", "Q", "J"];
  const trumpSuit = room.trumpSuit;

  // Probability controls (SAFE RANGE)
  const biasChance = 0.65; // NOT 100%

  // fallback to fair deal
  if (Math.random() > biasChance) {
    return deal(deck, room.order, 13);
  }

  const highTrump = [];
  const highNonTrump = [];
  const lowCards = [];

  for (const c of deck) {
    if (HIGH.includes(c.value) && c.suit === trumpSuit) highTrump.push(c);
    else if (HIGH.includes(c.value)) highNonTrump.push(c);
    else lowCards.push(c);
  }

  const hands = {};
  room.order.forEach(pid => hands[pid] = []);

  // 🎯 Give AI a *small* edge
  aiPids.forEach(pid => {
    if (highTrump.length) hands[pid].push(highTrump.pop());
    if (highNonTrump.length) hands[pid].push(highNonTrump.pop());
  });

  // Normal deal remainder
  const remainingDeck = [...highTrump, ...highNonTrump, ...lowCards];
  shuffle(remainingDeck);

  let i = 0;
  while (remainingDeck.length) {
    const pid = room.order[i % room.order.length];
    if (hands[pid].length < 13) {
      hands[pid].push(remainingDeck.pop());
    }
    i++;
  }

  return hands;
}

/* =====================================================
   PLACE BID
===================================================== */
export function placeBid(room, pid, bid) {
  if (room.phase !== "bidding") return;
  if (room.turn !== pid) return;

  const p = room.playersData[pid];
  if (p.bid !== null) return;

  bid = Number(bid);
  if (!Number.isInteger(bid) || bid < 1 || bid > 13) return;
  if (!room.bidOrder) room.bidOrder = [];
  room.bidOrder.push(pid);

  p.bid = bid;
  room.bids[pid] = bid;

  // All bids done → start play
  if (Object.keys(room.bids).length === 4) {
    room.phase = "playing";
    room.playedCards = [];
    room.turn = room.order[(room.dealerIndex + 1) % 4];
    return;
  }

  nextTurn(room);
}

/* =====================================================
   PLAY CARD (Updated)
===================================================== */
export function playCard(io, room, pid, card) {
  if (!room || room.phase !== "playing") return;

  const p = room.playersData[pid];
  if (!p) return;

  // Only AI or connected human can play
  if (!p.connected && !p.isAI) return;

  if (room.turn !== pid) return;

  const idx = p.hand.findIndex(c => c.suit === card.suit && c.value === card.value);
  if (idx === -1) return;


  const leadSuit = room.playedCards[0]?.card?.suit;
  const hasLeadSuit = leadSuit
    ? p.hand.some(c => c.suit === leadSuit)
    : false;

  const isLeading = room.playedCards.length === 0;
  // ❌ Cannot lead trump while locked
  if (
    isLeading &&
    !room.trumpUnlocked &&
    card.suit === room.trumpSuit
  ) {
    console.log("❌ Cannot lead locked trump");
    return;
  }

  // ❌ Must follow lead suit if possible
  if (
    leadSuit &&
    hasLeadSuit &&
    card.suit !== leadSuit
  ) {
    console.log("❌ Must follow lead suit");
    return;
  }

  // Remove card from hand
  const [played] = p.hand.splice(idx, 1);
  room.playedCards.push({ pid, card: played });

  console.log("🃏 PLAY", pid, played);
  // ✅ Unlock trump ONLY when cutting (not following lead suit)
  if (
    leadSuit &&
    card.suit === room.trumpSuit &&
    card.suit !== leadSuit
  ) {
    room.trumpUnlocked = true;
    console.log("🔓 Trump unlocked by cut");
  }

  if (room.playedCards.length === room.order.length) {
    if (room.resolvingTrick) return; // 🛑 BLOCK DUPLICATES

    room.resolvingTrick = true;

    io.to(room.roomId).emit("update-room", room);

    setTimeout(() => {
      resolveTrick(io, room);
    }, 1000);
  } else {
    nextTurn(room);
    io.to(room.roomId).emit("update-room", room);
  }

  io.to(room.roomId).emit("update-room", room);
}


/* =====================================================
   RESOLVE TRICK (Fixed)
===================================================== */
export function resolveTrick(io, room) {
  if (!room.resolvingTrick) return;
  if (!room.playedCards || room.playedCards.length === 0) return;

  const leadSuit = room.playedCards[0].card.suit;
  const trump = room.trumpSuit;

  // Determine winner
  let winnerPlay = room.playedCards[0];
  for (const play of room.playedCards.slice(1)) {
    if (compareCards(leadSuit, play.card, winnerPlay.card, trump) > 0) {
      winnerPlay = play;
    }
  }

  // Find player object robustly
  const winnerPid = winnerPlay.pid;
  const winnerPlayer = room.playersData[winnerPid];
  if (!winnerPlayer) {
    console.warn(
      "⚠️ Winner player undefined!",
      "winnerPid:", winnerPid,
      "playersData keys:", Object.keys(room.playersData),
      "playedCards:", room.playedCards
    );
    // fallback: pick first connected player
    const fallbackPid = Object.keys(room.playersData).find(pid => room.playersData[pid]);
    room.turn = fallbackPid;
    room.playedCards = [];
    return;
  }

  // ✅ Increment tricks
  winnerPlayer.tricks = (winnerPlayer.tricks || 0) + 1;
  room.tricksPlayed += 1;


  // ✅ Clear played cards
  room.playedCards = [];

  // ✅ Set turn to winner
  room.turn = winnerPid;

  console.log("🃏 TRICK WON BY", winnerPid, "Total Tricks:", winnerPlayer.tricks);

  // Check round end
  checkRoundEnd(room);
  room.resolvingTrick = false;

  // Emit update for all
  if (io) io.to(room.roomId).emit("update-room", room);
    setTimeout(() => {
    triggerAITurn(io, room);
  }, 200);
}


/* =====================================================
   ROUND END & SCORING
===================================================== */
function checkRoundEnd(room) {
  if (room.tricksPlayed < 13) return;

  // 🧮 Always score the round
  scoreRound(room);

  // 🆕 PER-LEAD MODE → END MATCH IMMEDIATELY
  if (room.matchType === "per-lead") {
    console.log("🧠 Per-lead match finished");
    endGame(room);
    return;
  }

  // 🔁 TARGET MODE (existing logic)
  const target = room.targetScore || 30;

  const reached = room.order.find(
    pid => room.playersData[pid].score >= target
  );

  if (reached) {
    endGame(room);
    return;
  }

  // continue to next round
  room.round++;
  room.dealerIndex = (room.dealerIndex + 1) % 4;

  startCallBreak(room);
}



function scoreRound(room) {
  room.roundHistory ||= [];

  const snapshot = {
    round: room.round,
    trump: room.trumpSuit,
    players: {}
  };

  room.order.forEach(pid => {
    const p = room.playersData[pid];
    const delta = p.tricks >= p.bid ? p.bid : -p.bid;
    p.score = (p.score || 0) + delta;

    snapshot.players[pid] = {
      bid: p.bid,
      tricks: p.tricks,
      score: p.score
    };
  });

  room.roundHistory.push(snapshot);
}

function decideCallBreakWinner(room) {
  const players = room.order.map(pid => {
    const p = room.playersData[pid];
    return {
      pid,
      bid: p.bid ?? 0,
      tricks: p.tricks ?? 0,
      score: p.score ?? 0,
      bidIndex: room.bidOrder?.indexOf(pid) ?? 999,
    };
  });

  // 1️⃣ Players who completed their bid
  const completed = players.filter(p => p.tricks >= p.bid && p.bid > 0);

  if (completed.length > 0) {
    completed.sort((a, b) => {
      // Higher bid wins
      if (b.bid !== a.bid) return b.bid - a.bid;
      // Earlier bidder wins
      return a.bidIndex - b.bidIndex;
    });

    return completed[0].pid;
  }

  // 2️⃣ Nobody completed → highest score
  players.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.bidIndex - b.bidIndex;
  });

  return players[0].pid;
}

function endGame(room) {
  if (room.phase === "ended") return;

  room.phase = "ended";

  const winner = decideCallBreakWinner(room);
  room.winner = winner;

  console.log("🏆 CALL BREAK FINISHED");
  console.log("Winner:", winner);

  setImmediate(() => {
    onGameEnded(room).catch(err =>
      console.error("💥 Settlement failed", err)
    );
  });
}



