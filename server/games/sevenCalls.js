import { createDeck, shuffle, deal } from "../core/deck.js";
import { compareCards } from "../core/compareCards.js";
import { nextTurn } from "../core/turn.js";
import { settleTeamMatch } from "../services/funds.service.js";
import { triggerAITurn } from "../ai/ai.controller.js";


/* ======================================================
   START GAME
====================================================== */
export function startSevenCalls(room) {


  room.dealerIndex ??= 0;
  room.targetScore ??= 30;

  room.roundHistory ??= [];

  room.teamBid ??= { 1: 5, 2: 5 };
  room.teamBidder ??= { 1: null, 2: null };

  room.phase = "bidding";

  room.teamTricks = { 1: 0, 2: 0 };
  room.teamScores = { 1: 0, 2: 0 };
  room.scoreHistory = { 1: [], 2: [] };
  room.playedCards = [];
  room.round = 1;

  room.deck = createDeck();
  shuffle(room.deck);

  // Deal first 5 cards for bidding
  const firstHands = deal(room.deck, room.order, 5);

  room.order.forEach((pid, i) => {
    const p = room.playersData[pid];
    p.hand = firstHands[pid];
    p.bid = null;
    p.powerSuit = null;
    p.tricks = 0;
    p.canRevealPower = false;
    p.passedReveal = false;
  });

  room.trick = 0;
  room.highestBid = 0;
  room.highestBidder = null;
  room.powerSuit = null;
  room.hiddenPower = null;
  const startIndex =
    (room.dealerIndex + 1) % room.order.length;

  room.turn = room.order[startIndex];

}

export function assignSevenCallsTeams(room) {
  room.order.forEach((pid, index) => {
    const p = room.playersData[pid];
    if (!p) return;

    p.team = index % 2 === 0 ? 1 : 2;
  });

  console.log(
    "👥 SevenCalls teams:",
    room.order.map(pid => ({
      pid,
      team: room.playersData[pid].team,
      isAI: room.playersData[pid].isAI,
    }))
  );
}


/* ======================================================
   PLACE BID
====================================================== */
function calculateTeamBids(room) {
  let highestBid = 5;
  let highestBidder = null;

  // find highest individual bid
  room.order.forEach(pid => {
    const p = room.playersData[pid];
    if (p.bid > highestBid) {
      highestBid = p.bid;
      highestBidder = pid;
    }
  });

  // default bids
  room.teamBid = { 1: 5, 2: 5 };
  room.teamBidder = { 1: null, 2: null };

  // if nobody bid above 5 → team 1 defaults
  if (!highestBidder) {
    room.teamBidder[1] = room.order.find(
      pid => room.playersData[pid].team === 1
    );
    return;
  }

  const winningTeam = room.playersData[highestBidder].team;

  room.teamBid[winningTeam] = highestBid;
  room.teamBidder[winningTeam] = highestBidder;
}


export function placeBid(room, pid, bid, emitCb) {
  const p = room.playersData[pid];
  if (p.bid !== null) return;
    // ================= FORCED LAST BID RULE =================
  const bidsSoFar = room.order.filter(
    id => room.playersData[id].bid !== null
  );

  const isLastBidder = bidsSoFar.length === room.order.length - 1;

  const noOneBidAboveFive = bidsSoFar.every(
    id => room.playersData[id].bid === 5
  );

  if (isLastBidder && noOneBidAboveFive) {
    bid = 7; // 🔒 FORCE
  }


  p.bid = Number(bid);

  // 🔥 FORCE STATE SYNC FOR AI
  if (emitCb) emitCb();

  nextTurn(room);

  if (!room.order.every(id => room.playersData[id].bid !== null)) {
    return;
  }

  calculateTeamBids(room);

  const t1 = room.teamBid[1];
  const t2 = room.teamBid[2];

  let winningTeam = t1 >= t2 ? 1 : 2;

  room.highestBid = room.teamBid[winningTeam];

  room.highestBidder =
    room.teamBidder[winningTeam] ||
    room.order.find(pid => room.playersData[pid].team === winningTeam);

  room.phase = "power-select";
  room.turn = room.highestBidder;
}


/* ======================================================
   SET POWER CARD
====================================================== */
export function setPowerCard(room, pid, card) {
  if (pid !== room.highestBidder) return;

  const p = room.playersData[pid];

  // Flag the card as power in hand
  const index = p.hand.findIndex(c => c.suit === card.suit && c.value === card.value);
  if (index !== -1) {
    p.hand[index].power = true;
    p.powerCard = p.hand[index]; // reference to same card object
  }

  room.hiddenPower = {
    pid,
    card: p.hand[index],
    revealed: false
  };

  dealRemainingCards(room); // deal remaining 8 cards to everyone
  room.phase = "playing";
  room.turn = pid; // highest bidder leads
}

/* ======================================================
   DEAL REMAINING CARDS
====================================================== */
function dealRemainingCards(room) {
  room.order.forEach(pid => {
    const p = room.playersData[pid];
    const needed = 13 - p.hand.length;
    // Make sure power card is not duplicated
    const extraCards = room.deck.splice(0, needed);
    p.hand.push(...extraCards);
  });
}

/* ======================================================
   PLAY CARD
====================================================== */
export function playCard(io, room, pid, card) {
  const player = room.playersData[pid];
  if (!player) return;

  if (room.turn !== pid) return;

  // allow AI even if disconnected
  if (!player.connected && !player.isAI) return;

  const idx = player.hand.findIndex(
    c => c.suit === card.suit && c.value === card.value
  );
  if (idx === -1) return;

  const leadSuit = room.playedCards[0]?.card?.suit ?? null;

  /* ================= REVEAL CHECK ================= */
  if (
    leadSuit &&
    !room.powerSuit &&
    !player.hand.some(c => c.suit === leadSuit) &&
    !room.pendingReveal &&
    !player.passedReveal
  ) {
    room.pendingReveal = { playerId: pid, leadSuit };
    maybeAutoResolveReveal(io, room, pid);
    return;
  }

  if (room.pendingReveal?.playerId === pid) return;

  /* ================= REMOVE CARD ================= */
  const [played] = player.hand.splice(idx, 1);

  room.playedCards.push({
    pid,
    card: played,
    power: room.powerSuit && played.suit === room.powerSuit,
  });

  console.log("🎴 CARD PLAYED", pid, played, "AI:", player.isAI);

  /* ================= TRICK ================= */
  if (room.playedCards.length === room.order.length) {
    resolveTrick(room);
  } else {
    nextTurn(room);
  }

  io.to(room.roomId).emit("update-room", room);
}

/* ======================================================
   REVEAL POWER CARD
====================================================== */
export function checkCanRevealPower(room, pid) {
  const p = room.playersData[pid];
  const leadSuit = room.playedCards[0]?.card?.suit;
  if (!leadSuit) return false;
  
  // Player has no card of lead suit
  const hasLead = p.hand.some(c => c.suit === leadSuit);
  return !hasLead && room.hiddenPower && !room.hiddenPower.revealed;
}

export function revealPower(room, pid) {
  if (!room.hiddenPower) return;
  if (room.hiddenPower.revealed) return;
  if (room.awaitingPowerReveal !== pid) return;

  room.hiddenPower.revealed = true;
  room.powerSuit = room.hiddenPower.card.suit;
  room.awaitingPowerReveal = null;

  Object.values(room.playersData).forEach(p => {
    p.canRevealPower = false;
  });
}



/* ======================================================
   RESOLVE TRICK
====================================================== */
function resolveTrick(room) {
  if (!room.playedCards.length) return;

  const leadSuit = room.playedCards[0].card.suit;
  const powerSuit = room.powerSuit;

  let winner = room.playedCards[0];

  for (const play of room.playedCards.slice(1)) {
    if (
      compareCards(leadSuit, play.card, winner.card, powerSuit) > 0
    ) {
      winner = play;
    }
  }

  const winnerPlayer = room.playersData[winner.pid];
  if (!winnerPlayer) {
    console.warn("⚠️ Winner missing", winner.pid);
    room.playedCards = [];
    return;
  }

  winnerPlayer.tricks = (winnerPlayer.tricks || 0) + 1;
  room.teamTricks[winnerPlayer.team] =
    (room.teamTricks[winnerPlayer.team] || 0) + 1;

  room.turn = winner.pid;
  room.playedCards = [];
  room.trick++;

  for (const p of Object.values(room.playersData)) {
    p.passedReveal = false;
    p.canRevealPower = false;
  }

  checkRoundEnd(room);
}


function checkRoundEnd(room) {
  const noCardsLeft = room.order.every(
    pid => room.playersData[pid].hand.length === 0
  );

  if (!noCardsLeft) return;

  scoreRound(room);

  // determine round winner
  const winningTeam =
    room.teamTricks[1] > room.teamTricks[2] ? 1 : 2;

  // collect player names
  const teamPlayers = { 1: [], 2: [] };
  room.order.forEach(pid => {
    const p = room.playersData[pid];
    teamPlayers[p.team].push(p.name || p.guestName || pid);
  });

  // ✅ SAVE ROUND HISTORY
  room.roundHistory.push({
    round: room.round,
    winningTeam,
    teamBids: { ...room.teamBid },
    teamTricks: { ...room.teamTricks },
    scores: {
      1: room.scoreHistory[1].at(-1),
      2: room.scoreHistory[2].at(-1),
    },
    players: teamPlayers,
  });

  // ✅ LOG
  console.log(`🏁 ROUND ${room.round} FINISHED`);
  console.log("Winner Team:", winningTeam);
  console.log("Team 1:", room.teamTricks[1], "/", room.teamBid[1]);
  console.log("Team 2:", room.teamTricks[2], "/", room.teamBid[2]);
  console.log("Total Scores:", room.teamScores);

  resetForNextRound(room);
}
function maybeAutoResolveReveal(io, room, pid) {
  const p = room.playersData[pid];
  if (!p || !p.isAI || p.connected) return;

  setTimeout(() => {
    // state might have changed
    if (!room.pendingReveal) return;
    if (room.pendingReveal.playerId !== pid) return;

    // decide
    if (shouldRevealPower(room, pid)) {
      room.hiddenPower.revealed = true;
      room.powerSuit = room.hiddenPower.card.suit;
    } else {
      p.passedReveal = true;
    }

    room.pendingReveal = null;

    io.to(room.roomId).emit("update-room", room);

    // 🔥 resume game flow
    triggerAITurn(io, room);
  }, 800); // feels human
}
function shouldRevealPower(room, pid) {
  const p = room.playersData[pid];
  const team = p.team;
  const oppTeam = team === 1 ? 2 : 1;

  const teamTricks = room.teamTricks?.[team] ?? 0;
  const oppTricks = room.teamTricks?.[oppTeam] ?? 0;

  if (oppTricks >= teamTricks) return true;
  if (room.trick >= 7) return true;

  return false;
}


function getTeamBid(team) {
  const bids = room.order
    .map(pid => room.playersData[pid].bid)
    .filter(b => b !== "pass");

  if (bids.length === 0) return 5; // default if all passed
  return Math.max(...bids);
}

function scoreRound(room) {
  [1, 2].forEach(team => {
    const bid = room.teamBid?.[team] ?? 5;
    const tricks = room.teamTricks[team];

    const score = tricks >= bid ? bid : -bid;
    room.teamScores[team] += score;
    room.scoreHistory[team].push(score);
  });
}


function resetForNextRound(room) {
  room.dealerIndex = (room.dealerIndex + 1) % room.order.length;
  room.round += 1;
  room.playedCards = [];
  room.powerSuit = null;
  room.hiddenPower = null;
  room.pendingReveal = null;

  room.order.forEach(pid => {
    const p = room.playersData[pid];
    p.hand = [];
    p.bid = null;
    p.tricks = 0;
    p.passedReveal = false;
  });

  room.teamTricks = { 1: 0, 2: 0 };

  if (
    room.teamScores[1] >= room.targetScore ||
    room.teamScores[2] >= room.targetScore
  ) {
    room.phase = "finished";
    room.winner =
      room.teamScores[1] > room.teamScores[2] ? 1 : 2;
    if (room.matchId) {
      const winningTeam = room.winner;

      const winnerUserIds = room.order
        .map(pid => room.playersData[pid])
        .filter(p => p.team === winningTeam)
        .map(p => p.userId);

      console.log("💰 Seven Calls winners:", winnerUserIds);

      settleTeamMatch(room.matchId, winnerUserIds);
    }  

    room.finalSummary = {
      winner: room.winner,
      scores: { ...room.teamScores },
      rounds: room.roundHistory,
    };

    console.log("🏆 GAME FINISHED");
    console.log("Winner Team:", room.winner);
    console.log("Final Scores:", room.teamScores);
    return;
  }


  room.phase = "bidding";
  room.playedCards = [];
  room.powerSuit = null;
  room.hiddenPower = null;
  room.pendingReveal = null;
  room.highestBid = 0;
  room.highestBidder = null;
  room.teamTricks = { 1: 0, 2: 0 };

  room.deck = createDeck();
  shuffle(room.deck);

  const firstHands = deal(room.deck, room.order, 5);
  room.order.forEach(pid => {
    const p = room.playersData[pid];
    p.hand = firstHands[pid];
    p.bid = null;
    p.tricks = 0;
    p.passedReveal = false;
  });

  const startIndex =
    (room.dealerIndex + 1) % room.order.length;

  room.turn = room.order[startIndex];


}
