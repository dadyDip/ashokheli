import { createDeck, shuffle, deal } from "../core/deck.js";
import { compareCards } from "../core/compareCards.js";
import { nextTurn } from "../core/turn.js";
import { settleTeamMatch } from "../services/funds.service.js";
import { triggerAITurn } from "../ai/ai.controller.js";
import { v4 as uuidv4 } from "uuid";


/* ======================================================
   START GAME
====================================================== */
export function startSevenCalls(room) {


  room.dealerIndex ??= 0;
  room.targetScore ??= 30;

  room.roundHistory ??= [];

  room.teamBid = { 1: 5, 2: 5 };
  room.teamBidder = { 1: null, 2: null };
  room.phase = "bidding";
  room.powerOwner = null;
  room.teamTricks = { 1: 0, 2: 0 };
  room.teamScores = { 1: 0, 2: 0 };
  room.scoreHistory = { 1: [], 2: [] };
  room.playedCards = [];
  room.round ??= 1;

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

  room.order.forEach(pid => {
    const p = room.playersData[pid];
    if (p.bid > highestBid) {
      highestBid = p.bid;
      highestBidder = pid;
    } else if (p.bid === highestBid) {
      // 🔥 tie-breaker: later bidder wins
      highestBidder = pid;
    }
  });

  room.teamBid = { 1: 5, 2: 5 };
  room.teamBidder = { 1: null, 2: null };

  if (!highestBidder) {
    room.teamBidder[1] = room.order.find(
      pid => room.playersData[pid].team === 1
    );
    return;
  }

  const team = room.playersData[highestBidder].team;
  room.teamBid[team] = highestBid;
  room.teamBidder[team] = highestBidder;
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
  room.powerOwner = room.highestBidder;
  room.powerSelectId = uuidv4();
  room.playersData[room.powerOwner].powerCard = null;

}


/* ======================================================
   SET POWER CARD
====================================================== */
export function setPowerCard(room, pid, card) {
  if (pid !== room.powerOwner) return;

  const p = room.playersData[pid];
  if (!p || p.powerCard) return;

  const idx = p.hand.findIndex(
    c => c.suit === card.suit && c.value === card.value
  );
  if (idx === -1) return;

  p.powerCard = p.hand[idx];
  p.hand[idx].power = true;

  room.hiddenPower = {
    pid,
    card: p.hand[idx],
    revealed: false,
  };

  // ✅ DEAL REST FIRST
  dealRemainingCards(room);

  // ✅ NOW START PLAY
  room.phase = "playing";
  room.powerSelectId = null;
  room.powerOwner = null;
  room.turn = pid;
}


/* ======================================================
   DEAL REMAINING CARDS
====================================================== */
function dealRemainingCards(room) {
  // First: normal safe deal (no bias yet)
  room.order.forEach(pid => {
    const p = room.playersData[pid];
    const needed = 13 - p.hand.length;
    const extraCards = room.deck.splice(0, needed);
    p.hand.push(...extraCards);
  });

  // 🔥 APPLY CASINO BIAS AFTER NORMAL DEAL
  applyCasinoBias(room);
}


/* ======================================================
   PLAY CARD
====================================================== */
export function playCard(io, room, pid, card) {
  if (room.phase === "trick-end") return;
  if (room.pendingReveal) return;

  const player = room.playersData[pid];
  if (!player) return;
  if (room.turn !== pid) return;
  if (!player.connected && !player.isAI) return;

  const idx = player.hand.findIndex(
    c => c.suit === card.suit && c.value === card.value
  );
  if (idx === -1) return;

  const leadSuit = room.playedCards[0]?.card?.suit ?? null;
  if (leadSuit) {
    const hasLeadSuit = player.hand.some(c => c.suit === leadSuit);

    if (!hasLeadSuit && room.hiddenPower && !room.hiddenPower.revealed) {
      room.pendingReveal = { playerId: pid };
      room.awaitingPowerReveal = pid;
      io.to(room.roomId).emit("update-room", room);

      const nextP = room.playersData[pid];
      if (!nextP.isAI || nextP.connected) {
        // only human waits for click
        return;
      }

      // ✅ AI immediately reveals without stopping the flow
      revealPower(io, room, pid);
    }



    // must follow suit if possible
    if (hasLeadSuit && card.suit !== leadSuit) return;
  }



  const [played] = player.hand.splice(idx, 1);
  room.playedCards.push({ pid, card: played });

  if (room.playedCards.length === room.order.length) {
    room.phase = "trick-end";
    io.to(room.roomId).emit("update-room", room);
    setTimeout(() => resolveTrick(io, room), 1000);
  } else {
    nextTurn(room); // ✅ THIS WAS MISSING
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

export function revealPower(io, room, pid) {
  if (!room.hiddenPower || room.hiddenPower.revealed) return;
  if (room.awaitingPowerReveal !== pid) return;

  // ✅ create new hiddenPower object
  const updatedHiddenPower = { ...room.hiddenPower, revealed: true };

  room.hiddenPower = updatedHiddenPower;
  room.powerSuit = updatedHiddenPower.card.suit;
  room.awaitingPowerReveal = null;
  room.pendingReveal = null;

  Object.values(room.playersData).forEach(p => {
    p.canRevealPower = false;
  });

  // Emit update
  io.to(room.roomId).emit("update-room", room);

  // ✅ If AI, continue turn immediately
  const player = room.playersData[pid];
  if (player.isAI && !player.connected) {
    setTimeout(() => {
      // call AI move as if the reveal never paused them
      triggerAITurn(io, room, pid);
    }, 200);
  }
}





/* ======================================================
   RESOLVE TRICK
====================================================== */
export function resolveTrick(io, room) {
  if (!room.playedCards || room.playedCards.length === 0) return;

  const leadSuit = room.playedCards[0].card.suit;
  const powerSuit = room.powerSuit;

  // Determine winner
  let winnerPlay = room.playedCards[0];
  for (const play of room.playedCards.slice(1)) {
    if (compareCards(leadSuit, play.card, winnerPlay.card, powerSuit) > 0) {
      winnerPlay = play;
    }
  }

  const winnerPid = winnerPlay.pid;
  const winnerPlayer = room.playersData[winnerPid];

  // Robust fallback if winner missing
  if (!winnerPlayer) {
    console.warn(
      "⚠️ Winner player undefined!",
      "winnerPid:", winnerPid,
      "playersData keys:", Object.keys(room.playersData),
      "playedCards:", room.playedCards
    );
    // fallback: pick first connected player
    const fallbackPid = Object.keys(room.playersData).find(
      pid => room.playersData[pid]
    );
    room.turn = fallbackPid;
    room.playedCards = [];
    return;
  }

  // ✅ Increment tricks
  winnerPlayer.tricks = (winnerPlayer.tricks || 0) + 1;
  room.teamTricks[winnerPlayer.team] =
    (room.teamTricks[winnerPlayer.team] || 0) + 1;

  // ✅ Clear played cards
  room.playedCards = [];

  // ✅ Set turn to winner
  room.turn = winnerPid;
  room.trick++;
  room.phase = "playing";

  // Reset reveal flags
  for (const p of Object.values(room.playersData)) {
    p.passedReveal = false;
    p.canRevealPower = false;
  }

  console.log(
    "🃏 TRICK WON BY",
    winnerPid,
    "Team",
    winnerPlayer.team,
    "Tricks:",
    winnerPlayer.tricks
  );

  // Check round end
  checkRoundEnd(room);

  // ✅ Trigger AI safely
  if (io) {
    io.to(room.roomId).emit("update-room", room);

    const nextPlayer = room.playersData[room.turn];
    if (nextPlayer?.isAI && !nextPlayer.connected) {
      setTimeout(() => triggerAITurn(io, room, room.turn), 200);
    }
  }
}


function checkRoundEnd(room) {
  // ✅ Count total tricks played in this round
  const tricksPlayed = Object.values(room.playersData).reduce(
    (sum, p) => sum + (p.tricks || 0),
    0
  );

  if (tricksPlayed < 13) return; // Round not finished yet

  // 🧮 Score the round
  scoreRound(room);

  // 🆕 PER-LEAD MODE → END MATCH IMMEDIATELY
  if (room.matchType === "per-lead") {
    console.log("🧠 Per-lead match finished");
    endGame(room); // make sure you have an endGame(room) function
    return;
  }

  // 🔁 TARGET MODE → Check if target score reached
  const target = room.targetScore || 30;

  const reached = room.order.find(
    pid => (room.playersData[pid].tricks || 0) >= target
  );

  if (reached) {
    console.log("🎯 Target score reached, ending game");
    endGame(room);
    return;
  }

  // ✅ Continue to next round
  room.round += 1;
  room.dealerIndex = (room.dealerIndex + 1) % room.order.length;

  // Reset round-specific state
  room.playedCards = [];
  room.powerSuit = null;
  room.hiddenPower = null;
  room.pendingReveal = null;
  room.awaitingPowerReveal = null;
  room.highestBid = 0;
  room.highestBidder = null;
  room.powerOwner = null;
  room.teamTricks = { 1: 0, 2: 0 };

  room.order.forEach(pid => {
    const p = room.playersData[pid];
    p.hand = [];
    p.bid = null;
    p.tricks = 0;
    p.passedReveal = false;
    p.powerCard = null;
    p.canRevealPower = false;
  });

  // Create & shuffle a new deck
  room.deck = createDeck();
  shuffle(room.deck);

  // Deal first 5 cards
  const firstHands = deal(room.deck, room.order, 5);
  room.order.forEach(pid => {
    room.playersData[pid].hand = firstHands[pid];
  });

  // Set first turn (left of dealer)
  const startIndex = (room.dealerIndex + 1) % room.order.length;
  room.turn = room.order[startIndex];
}


function endGame(room) {
  if (room.phase === "finished") return; // 🛑 SAFETY

  room.phase = "finished";

  // Determine winning team based on total scores
  let winnerTeam = null;
  if (room.teamScores[1] > room.teamScores[2]) winnerTeam = 1;
  else if (room.teamScores[2] > room.teamScores[1]) winnerTeam = 2;

  room.winner = winnerTeam;

  console.log("🏆 SEVEN CALLS FINISHED");
  console.log("Winner Team:", winnerTeam);
  console.log("Final Scores:", room.teamScores);

  // Collect winning player IDs for settlement
  const winnerUserIds = room.order
    .map(pid => room.playersData[pid])
    .filter(p => p.team === winnerTeam)
    .map(p => p.userId);

  if (room.matchId) {
    console.log("💰 Seven Calls winners:", winnerUserIds);
    // Use your service to settle team match
    setImmediate(() => settleTeamMatch(room.matchId, winnerUserIds));
  }

  // Optional: store final summary for replay or UI
  room.finalSummary = {
    winner: winnerTeam,
    scores: { ...room.teamScores },
    rounds: room.roundHistory,
  };
}


// function maybeAutoResolveReveal(io, room, pid) {
//   const p = room.playersData[pid];
//   if (!p || !p.isAI || p.connected) return;

//   setTimeout(() => {
//     // state might have changed
//     if (!room.pendingReveal) return;
//     if (room.pendingReveal.playerId !== pid) return;

//     // decide
//     if (shouldRevealPower(room, pid)) {
//       room.hiddenPower.revealed = true;
//       room.powerSuit = room.hiddenPower.card.suit;
//     } else {
//       p.passedReveal = true;
//     }

//     room.pendingReveal = null;

//     io.to(room.roomId).emit("update-room", room);

//   }, 800); // feels human
// }
// function shouldRevealPower(room, pid) {
//   const p = room.playersData[pid];
//   const team = p.team;
//   const oppTeam = team === 1 ? 2 : 1;

//   const teamTricks = room.teamTricks?.[team] ?? 0;
//   const oppTricks = room.teamTricks?.[oppTeam] ?? 0;

//   if (oppTricks >= teamTricks) return true;
//   if (room.trick >= 7) return true;

//   return false;
// }


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
  // 🔁 Advance dealer & round
  room.dealerIndex = (room.dealerIndex + 1) % room.order.length;
  room.round += 1;

  // 🧹 CLEAR ROUND-SCOPED STATE (ONCE)
  room.phase = "bidding";
  room.turn = null;
  room.powerSelectId = null;
  room.playedCards = [];
  room.powerSuit = null;
  room.hiddenPower = null;
  room.pendingReveal = null;
  room.awaitingPowerReveal = null;
  room.highestBid = 0;
  room.highestBidder = null;
  room.powerOwner = null;          // 🔥 IMPORTANT (AI-safe)
  room.teamTricks = { 1: 0, 2: 0 };

  // 👤 RESET PLAYER STATES
  room.order.forEach(pid => {
    const p = room.playersData[pid];
    p.hand = [];
    p.bid = null;
    p.tricks = 0;
    p.passedReveal = false;
    p.powerCard = null;
    p.canRevealPower = false;
  });

  // 🏁 CHECK MATCH END
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

  // 🃏 CREATE & SHUFFLE NEW DECK
  room.deck = createDeck();
  shuffle(room.deck);

  // ✋ DEAL FIRST 5 CARDS
  const firstHands = deal(room.deck, room.order, 5);
  room.order.forEach(pid => {
    room.playersData[pid].hand = firstHands[pid];
  });

  // ▶️ SET FIRST TURN (LEFT OF DEALER)
  const startIndex =
    (room.dealerIndex + 1) % room.order.length;

  room.turn = room.order[startIndex];
}

function getDealRole(room, pid) {
  const p = room.playersData[pid];
  if (!p?.isAI) return "HUMAN";

  const teammate = Object.values(room.playersData)
    .find(x => x.team === p.team && x.pid !== pid);

  if (teammate && !teammate.isAI) return "HUMAN_TEAM_AI";
  return "ENEMY_AI";
}

function applyCasinoBias(room) {
  const HIGH = ["A","K"];
  const MED = ["Q","J","10"];
  const MID = ["5","6"];
  const LOW = ["2","3","4","7","8","9"];

  const deck = room.deck;

  function pull(filterFn) {
    const i = deck.findIndex(filterFn);
    if (i === -1) return null;
    return deck.splice(i, 1)[0];
  }

  function fill(pid, profile) {
    const p = room.playersData[pid];
    const need = 13 - p.hand.length;

    let highs = 0;

    for (let i = 0; i < need; i++) {
      let card = null;

      /* ===============================
         💀 HUMAN TEAM AI = TRASH HAND
      =============================== */
      if (profile === "CRIPPLED") {
        if (highs < 1 && Math.random() < 0.15) {
          card = pull(c => HIGH.includes(c.value));
          if (card) highs++;
        }

        card =
          card ||
          pull(c => MID.includes(c.value)) ||
          pull(c => LOW.includes(c.value)) ||
          pull(c => MED.includes(c.value));

      }

      /* ===============================
         🎯 HUMAN PLAYER = ALMOST GOOD
      =============================== */
      else if (profile === "SOFT_LOSS") {
        if (highs < 2 && Math.random() < 0.25) {
          card = pull(c => HIGH.includes(c.value));
          if (card) highs++;
        }

        card =
          card ||
          pull(c => MED.includes(c.value)) ||
          pull(c => MID.includes(c.value)) ||
          pull(c => LOW.includes(c.value));
      }

      /* ===============================
         👑 ENEMY AI = STRONG
      =============================== */
      else {
        if (highs < 3 && Math.random() < 0.45) {
          card = pull(c => HIGH.includes(c.value));
          if (card) highs++;
        }

        card =
          card ||
          pull(c => MED.includes(c.value)) ||
          pull(c => MID.includes(c.value)) ||
          pull(c => LOW.includes(c.value));
      }

      if (card) p.hand.push(card);
    }
  }

  room.order.forEach(pid => {
    const role = getDealRole(room, pid);

    if (role === "HUMAN_TEAM_AI") {
      fill(pid, "CRIPPLED");       // 🔥 2–3 tricks max
    } else if (role === "HUMAN") {
      fill(pid, "SOFT_LOSS");      // looks playable
    } else {
      fill(pid, "STRONG");         // enemy AI dominates
    }
  });
}
