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
  // deal cards
  const hands = deal(deck, room.order, 13);

  room.order.forEach(pid => {
    const p = room.playersData[pid];
    p.hand = hands[pid];
    p.tricks = 0;
    p.bid = null;
  });

  // First bidder = left of dealer
  room.turn = room.order[(room.dealerIndex + 1) % 4];
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

function endGame(room) {
  if (room.phase === "ended") return; // 🛑 SAFETY

  room.phase = "ended";

  let winner = null;
  let maxScore = -Infinity;

  room.order.forEach(pid => {
    const score = room.playersData[pid].score;
    if (score > maxScore) {
      maxScore = score;
      winner = pid;
    }
  });

  room.winner = winner;

  console.log("🏆 CALL BREAK FINISHED");
  console.log("Winner:", winner);

  // 🔥 TRIGGER SETTLEMENT
  setImmediate(() => {
    onGameEnded(room).catch(err =>
      console.error("💥 Settlement failed", err)
    );
  });
}


