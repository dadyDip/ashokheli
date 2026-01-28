import * as CallBreak from "./games/callbreak.js";
import {
  startSevenCalls,
  placeBid as placeSevenCallsBid,
  setPowerCard,
  playCard as playSevenCard,
} from "./games/sevenCalls.js";
import prisma from "./prisma.js";
import { lockMatchFunds, lockMatchFundsWithAI } from "./services/funds.service.js";
import { settleMatch, settleTeamMatch, settleMatchWithAI } from "./services/funds.service.js";
import { triggerAITurn } from "./ai/ai.controller.js";
import { getAIUserId } from './aiUser.js';
import { revealPower } from "./games/sevenCalls.js";
import { assignSevenCallsTeams } from "./games/sevenCalls.js";
import {
  startFlash,
  flashAction,
  flashDisconnect
} from "./games/flash.js";


const socketToPlayer = new Map();

const cardRooms = {};


/* ======================================================
   SOCKET SETUP
====================================================== */
export function setupCardGame(io) {
  io.on("connection", socket => {
    console.log("🔌 CONNECT", socket.id);

    /* ===================== JOIN ROOM ===================== */
    socket.on(
      "join-card-room",
      async ({
        roomId,
        playerId,
        userId,
        name,
        targetScore,
        entryFee,
        validated,
        demo = false,
        mode,
      }) => {
        try {
          /* ================= VALIDATION ================= */
          if (!validated) {
            console.warn("⚠️ join rejected: not validated");
            return;
          }

          if (!userId) {
            socket.emit("join-error", "❌ Authentication required");
            return;
          }

          console.log("👤 join attempt", { userId, playerId, roomId });

          /* ================= ROOM LOOKUP ================= */
          let room = cardRooms[roomId];

          if (!room) {
            // 🎮 DEMO ROOM — NO DB
            if (demo === true) {
              const gameType = mode === "seven" ? "seven" : "callbreak";

              room = createRoom(roomId, gameType);

              room.gameType = gameType;
              room.hasAI = false;

              if (targetScore && Number(targetScore) > 0) {
                room.matchType = "target";
                room.targetScore = Number(targetScore);
              } else {
                room.matchType = "per-lead";
                delete room.targetScore; // 🔥 ENSURE CLEAN STATE
              }


              room.isDemo = true;
              room.entryFee = 0;
              room.maxPlayers = 4;
              room.phase = "waiting";
              room.matchMode = "DEMO";


              cardRooms[roomId] = room;

              console.log("🎮 DEMO ROOM CREATED", {
                roomId,
                gameType,
                matchType: room.matchType,
                targetScore: room.targetScore,
              });
            }
            // 💰 REAL ROOM — EXISTING LOGIC (UNCHANGED)
            else {
              const dbRoom = await prisma.room.findUnique({
                where: { id: roomId },
                select: {
                  entryFee: true,
                  gameType: true,
                  maxPlayers: true,
                  targetScore: true,
                  matchType: true,
                  isInstant: true,
                },
              });

              if (!dbRoom) {
                socket.emit("join-error", "❌ Room does not exist");
                return;
              }

              room = createRoom(roomId, dbRoom.gameType);
              room.matchMode = dbRoom.isInstant ? "INSTANT" : "MULTI";
              room.gameType = dbRoom.gameType;
              room.mode = dbRoom.gameType;
              room.hasAI = false;
              room.fairness = {
                mode: "NORMAL",       // NORMAL | SOFT_BIAS
                userWinTarget: 0.25,  // 25% target winrate
              };
              room.matchType = dbRoom.matchType || "target";
              room.entryFee = dbRoom.entryFee;
              room.maxPlayers = dbRoom.maxPlayers ?? 4;
              room.targetScore = dbRoom.targetScore ?? 20;
              room.phase = "waiting";

              cardRooms[roomId] = room;
            }
          }


          /* ================= DUPLICATE JOIN GUARD ================= */
          if (room.playersData[playerId]) {
            const existingPlayer = room.playersData[playerId];

            // 🔁 RECONNECT CASE
            if (existingPlayer) {
              /* ================= RECONNECT FLOW ================= */

              const pid = existingPlayer.playerId;

              // 1️⃣ restore identity
              existingPlayer.socketId = socket.id;
              existingPlayer.connected = true;
              existingPlayer.isAI = false;
              existingPlayer.aiControlled = false;
              existingPlayer.connected = true;

              socket.join(roomId);

              socketToPlayer.set(socket.id, {
                roomId,
                playerId: pid,
                userId,
              });

              console.log("🔄 RECONNECTED", {
                playerId: pid,
                phase: room.phase,
                turn: room.turn,
              });

              emit(io, room);
              const turnPid = room.turn;
              const turnPlayer = room.playersData[turnPid];

              if (
                room.phase === "playing" &&
                turnPlayer &&
                turnPlayer.isAI &&
                turnPlayer.connected === false
              ) {
                console.log("🤖 AI CONTINUE AFTER RECONNECT", turnPid);
                setTimeout(() => maybeTriggerAI(io, room), 300);
              } else {
                console.log("🧠 No AI action needed after reconnect");
              }

              return;
            }

            // ❌ REAL DUPLICATE (different user)
            console.warn("🚫 Duplicate playerId with different user", {
              playerId,
              userId,
              existingUser: existingPlayer.userId,
            });

            socket.emit("join-error", "❌ Player slot already taken");
            return;
          }

          /* ================= ENTRY FEE CHECK ================= */
          if (!room.isDemo && room.entryFee > 0) {
            const balance = await getUserBalance(userId);
            if (balance < room.entryFee) {
              socket.emit("join-error", "❌ Not enough balance");
              return;
            }
          }



          /* ================= SAFE TO JOIN ================= */
          socket.join(roomId);

          socketToPlayer.set(socket.id, {
            roomId,
            playerId,
            userId,
          });

          addPlayer(room, playerId, userId, socket.id, name);
          socket.emit("update-room", room);

          console.log("✅ player joined", {
            roomId,
            players: Object.keys(room.playersData).length,
          });
          // 🤖 AUTO-FILL AI FOR REAL MATCHES
          if (room.matchMode === "INSTANT") {
            const aiUserId = await getAIUserId(); // server-owned user
            if (room.matchMode === "INSTANT" && room.entryFee > 0) {
              room.fairness.mode = "SOFT_BIAS";
            }
            while (room.order.length < room.maxPlayers) {
              const aiPid = `AI-${room.order.length}-${room.roomId}`;

              room.playersData[aiPid] = {
                playerId: aiPid,
                userId: aiUserId,
                name: "AI Bot",
                hand: [],
                bid: null,
                tricks: 0,
                score: 0,
                connected: false,
                isAI: true,
                isPaidAI: true,
                socketId: null,
              };

              room.order.push(aiPid);
            }
            room.hasAI = true;
          }

          /* ================= START MATCH IF READY ================= */
          const totalPlayers = Object.keys(room.playersData).length;
          const humanPlayers = Object.values(room.playersData).filter(p => !p.isAI).length;

          let readyToStart = false;

          // Existing logic (keep intact)
          if (
            room.phase === "waiting" &&
            (
              (room.matchMode === "INSTANT" && totalPlayers === room.maxPlayers) ||
              (room.matchMode === "MULTI" && humanPlayers === room.maxPlayers)
            )
          ) {
            readyToStart = true;
          }

          // 🔹 Flash-specific logic (non-breaking)
          if (
            room.phase === "waiting" &&
            room.gameType === "flash" &&
            humanPlayers >= 2 // min 2 humans to start
          ) {
            readyToStart = true;
          }

          if (readyToStart) {
            console.log("🎯 MATCH READY — STARTING", {
              mode: room.matchMode,
              totalPlayers,
              humanPlayers,
            });

            room.phase = "starting";

            // 💰 CREATE MATCH + LOCK FUNDS (REAL MATCHES ONLY)
            if (!room.isDemo) {
              const match = await prisma.match.create({
                data: {
                  gameType: room.gameType,
                  stake: room.entryFee,
                  status: "WAITING",
                  roomId: room.roomId,
                  players: {
                    create: Object.values(room.playersData)
                      .filter(p => !p.isAI)
                      .map(p => ({ userId: p.userId })),
                  },
                },
              });

              room.matchId = match.id;

              if (room.hasAI) {
                await lockMatchFundsWithAI(match.id);
              } else {
                await lockMatchFunds(match.id);
              }

              io.to(room.roomId).emit("funds-locked");
            }

            // 🎮 START GAME
            startGame(room);
            emit(io, room);
            maybeTriggerAI(io, room); // bidding / play
          }

          emit(io, room);
        } catch (err) {
          console.error("🔥 join-card-room fatal error", err);
          socket.emit("join-error", "❌ Internal server error");
        }
      }
    );

    socket.on("flash-action", ({ roomId, action, amount }) => {
      const room = cardRooms[roomId];
      if (!room || room.gameType !== "flash") return;

      const info = socketToPlayer.get(socket.id);
      if (!info) return;

      const pid = info.playerId;
      if (room.turn !== pid) return;

      flashAction(room, pid, action, amount);
      emit(io, room);
      maybeTriggerAI(io, room);
    });

    /* ===================== PLACE BID ===================== */
    socket.on("place-bid", ({ roomId, playerId, bid }) => {
      const room = cardRooms[roomId];
      if (!room) return;

      if (room.phase !== "bidding") return;
      if (room.turn !== playerId) return;

      // prevent double bids
      if (room.playersData[playerId].bid !== null) return;

      if (room.gameType === "seven") {
        placeSevenCallsBid(room, playerId, bid);
      } else {
        CallBreak.placeBid(room, playerId, bid);
      }
      console.log(
        "[BID]",
        room.gameType,
        playerId,
        "→",
        bid,
        "NEXT:",
        room.turn
      );

      emit(io, room);
      if (room.turn !== playerId) {
        maybeTriggerAI(io, room);
      }
    });

    /* ===================== POWER CARD ===================== */
    socket.on("set-power-card", ({ roomId, playerId, card }) => {
      const room = getRoom(roomId);
      if (!room || room.gameType !== "seven") return;
      if (room.phase !== "power-select") return;
      if (room.turn !== playerId) return;

      setPowerCard(room, playerId, card);
      emit(io, room);
      maybeTriggerAI(io, room);
    });


    socket.on("pass-reveal", ({ roomId, playerId }) => {
      const room = cardRooms[roomId];
      if (!room || !room.pendingReveal) return;
      if (room.pendingReveal.playerId !== playerId) return;

      const p = room.playersData[playerId];
      p.passedReveal = true;

      room.pendingReveal = null;

      // allow player to play any card
      emit(io, room);
      maybeTriggerAI(io, room);
    });



    socket.on("reveal-power", ({ roomId, playerId }) => {
      const room = cardRooms[roomId];
      if (!room || !room.hiddenPower) return;
      if (room.hiddenPower.revealed) return;

      if (room.pendingReveal?.playerId !== playerId) return;

      const updatedRoom = {
        ...room,
        pendingReveal: null,
        powerSuit: room.hiddenPower.card.suit,
        hiddenPower: { ...room.hiddenPower, revealed: true },
      };

      cardRooms[roomId] = updatedRoom;

      emit(io, updatedRoom);
      maybeTriggerAI(io, updatedRoom);

    });



    /* ===================== PLAY CARD ===================== */
    socket.on("play-card", ({ roomId, playerId, card }) => {
      const room = cardRooms[roomId];
      if (!room) return;

      if (room.gameType === "seven") {
        playSevenCard(io, room, playerId, card);
      } else {
        CallBreak.playCard(io, room, playerId, card);
      }
      emit(io, room);
      maybeTriggerAI(io, room);
    });
    socket.on("restart-game", ({ roomId }) => {
      const room = cardRooms[roomId];
      if (!room) return;

      resetRoomForRestart(room);
      startGame(room);
      emit(io, room);
      maybeTriggerAI(io, room);
    });

    socket.on("vote-rematch", async ({ roomId, playerId, vote }) => {
      const room = cardRooms[roomId];
      if (!room || room.phase !== "ended") return;
      if (!room.playersData[playerId]) return;

      if (!room.rematchVotes) room.rematchVotes = {};
      room.rematchVotes[playerId] = vote;

      const votes = Object.values(room.rematchVotes);
      const yesVotes = votes.filter(v => v === true).length;
      const totalPlayers = room.order.length;

      const realPlayers = Object.values(room.playersData).filter(p => !p.isAI).length;

      // 🔹 DEMO / single real player → instant rematch
      if (vote === true && realPlayers === 1) {
        room.round = 1;
        room.roundHistory = [];
        room.rematchVotes = {};

        for (const pid of room.order) {
          const p = room.playersData[pid];
          p.score = 0;
          p.tricks = 0;
          p.bid = null;
        }

        resetCallBreakForRematch(room);

        // ✅ NEW MATCH FOR EVERY REAL REMATCH
        await createNewMatchForRematch(room, io);

        startGame(room);
        emit(io, room);
        maybeTriggerAI(io, room);
        return;
      }

      // 🔹 NORMAL MATCH → everyone must vote YES
      if (votes.length === totalPlayers && yesVotes === totalPlayers) {
        room.round = 1;
        room.roundHistory = [];
        room.rematchVotes = {};

        for (const pid of room.order) {
          const p = room.playersData[pid];
          p.score = 0;
          p.tricks = 0;
          p.bid = null;
        }

        resetCallBreakForRematch(room);

        // ✅ ALWAYS CREATE NEW MATCH (INSTANT / MULTI / AI / REAL)
        await createNewMatchForRematch(room, io);

        startGame(room);
        emit(io, room);
        maybeTriggerAI(io, room);
        return;
      }

      emit(io, room);
    });


    socket.on("vote-rematch-7call", async ({ roomId, playerId, vote }) => {
      const room = cardRooms[roomId];

      // ✅ Seven Calls uses "finished"
      if (!room || room.phase !== "finished") return;
      if (!room.playersData[playerId]) return;

      if (!room.rematchVotes) room.rematchVotes = {};
      room.rematchVotes[playerId] = vote;

      // 🔥 update UI vote state
      io.to(roomId).emit("update-rematch-votes", room.rematchVotes);

      const totalPlayers = room.order.length;
      const votes = Object.values(room.rematchVotes);
      const yesVotes = votes.filter(v => v === true).length;

      const realPlayers = Object.values(room.playersData).filter(p => !p.isAI).length;

      // 🔹 DEMO / AI match → instant rematch
      if (vote === true && realPlayers === 1) {
        room.rematchVotes = {};

        resetSevenCallsForRematch(room);

        // ✅ NEW MATCH ID
        await createNewMatchForRematch(room, io);

        startSevenCalls(room);
        emit(io, room);
        maybeTriggerAI(io, room);
        return;
      }

      // 🔹 NORMAL MATCH → all must vote YES
      if (votes.length === totalPlayers && yesVotes === totalPlayers) {
        room.rematchVotes = {};

        resetSevenCallsForRematch(room);

        // ✅ NEW MATCH ID
        await createNewMatchForRematch(room, io);

        startSevenCalls(room);
        emit(io, room);
        maybeTriggerAI(io, room);
        return;
      }

      // ❌ everyone voted NO
      if (votes.length === totalPlayers && yesVotes === 0) {
        room.rematchVotes = {};
        io.to(roomId).emit("rematch-cancelled");
      }
    });


    /* ===================== DISCONNECT ===================== */
    socket.on("disconnect", () => {
      console.log("⚡ DISCONNECT", socket.id);

      const info = socketToPlayer.get(socket.id);
      if (!info) return;

      socketToPlayer.delete(socket.id); // 🧹 cleanup


      const { roomId, playerId } = info;
      const room = cardRooms[roomId];
      if (!room) return;
      if (!room || room.gameType !== "flash") return;
      const player = room.playersData[playerId];
      if (!player) return;

      player.connected = false;
      player.isAI = true;          // 🔥 REQUIRED
      player.aiControlled = true;  // optional, fine to keep

      console.log("🤖 DISCONNECTED", playerId);

      emit(io, room);
      if (room.turn === playerId) {
        console.log("🤖 AI taking over after grace", playerId);

        // wait 1.5s before AI takeover
        setTimeout(() => {
          const pCheck = room.playersData[playerId];
          if (!pCheck || pCheck.connected) return; // player reconnected
          console.log("🤖 AI taking over (player still disconnected)", playerId);
          maybeTriggerAI(io, room);
        }, 1500);
      }


      // ⏳ GRACE PERIOD — DO NOT DELETE IMMEDIATELY
      setTimeout(() => {
        const stillThere = cardRooms[roomId];
        if (!stillThere) return;

        const p = stillThere.playersData[playerId];
        if (p?.connected) return; // 🔥 RECONNECTED

        const anyConnected = stillThere.order.some(
          pid => stillThere.playersData[pid].connected
        );

        // ❗ ONLY CLEAN IF GAME NEVER STARTED
        if (!anyConnected && stillThere.phase === "waiting") {
          console.log("🧹 ROOM CLEANED", roomId);
          delete cardRooms[roomId];
        }
      }, 30000); // ⬅ 30s grace
    });
  });
}

/* ======================================================
   HELPERS
====================================================== */
function ensureWinControl(room) {
  if (!room._winControl) {
    room._winControl = {
      games: 0,
      userWins: 0,
    };
  }
}

export async function onGameEnded(room) {
  if (!room.matchId) throw new Error("No matchId");

  const winnerPid = room.winner;
  if (!winnerPid) throw new Error("No winner");

  const winnerPlayer = room.playersData[winnerPid];
  if (!winnerPlayer) {
    throw new Error("Winner player not found");
  }

  const winnerUserId = winnerPlayer.userId;

  console.log("🏁 Settling match", {
    matchId: room.matchId,
    winnerPid,
    winnerUserId,
    isAI: winnerPlayer.isAI,
  });
  if (room.fairness?.mode === "SOFT_BIAS") {
    ensureWinControl(room);

    room._winControl.games++;

    const winner = room.playersData[room.winner];
    if (winner && !winner.isAI) {
      room._winControl.userWins++;
    }
  }


  // ================= SEVEN / TEAM =================
  if (room.gameType === "seven") {
    await settleTeamMatch(room.matchId, [winnerUserId]);
    return;
  }

  // ================= CALLBREAK =================
  if (winnerPlayer.isAI) {
    await settleMatchWithAI(room.matchId, winnerPlayer);
  } else {
    await settleMatch(room.matchId, winnerUserId); // OLD FLOW (works)
  }
}

export function restoreRoom(roomId, gameType) {
  if (cardRooms[roomId]) return cardRooms[roomId];

  const room = createRoom(roomId, gameType);
  room.status = "PLAYING";

  cardRooms[roomId] = room;
  return room;
}

export async function attachAI(room) {
  const userId = await getAIUserId(); 
  const aiPid = `AI-${userId}`;

  room.playersData[aiPid] = {
    playerId: aiPid,
    userId,        
    isAI: true,
    connected: true,
    name: "AI Bot",
  };

  room.order.push(aiPid);
}

function getRoom(roomId) {
  return cardRooms[roomId] || null;
}

export function emit(io, room) {
  room.actionId++;
  room.serverTime = Date.now();

  for (const [pid, p] of Object.entries(room.playersData)) {
    if (!p.socketId) continue;

    const safeRoom = serializeRoomForPlayer(room, pid);
    io.to(p.socketId).emit("update-room", safeRoom);
  }
}

function advanceDealer(room) {
  room.dealerIndex =
    (room.dealerIndex + 1) % room.order.length;
}

function maybeTriggerAI(io, room) {
  if (!["bidding","playing","power-select"].includes(room.phase)) return;

  const pid = room.turn;
  const p = room.playersData[pid];
  if (!p?.isAI || p.connected) return;

  if (room._aiThinking) return;

  room._aiThinking = true;

  setTimeout(() => {
    room._aiThinking = false;
    triggerAITurn(io, room);
  }, 300);
}

function createRoom(roomId, gameType ) {
    if (!gameType) {
    throw new Error("❌ createRoom called without gameType");
  }

  console.log("🛠️ Creating room", { roomId, gameType });
  

  return {
    roomId,
    gameType,
    matchType: "target",
    round: 1,
    maxPlayers: 4, 
    dealerIndex: 0,
    teamScores: { 1: 0, 2: 0 },
    teamTricks: { 1: 0, 2: 0 },
    scoreHistory: { 1: [], 2: [] },
    hiddenPower: null,
    pendingReveal: null,
    awaitingPowerReveal: null,
    highestBid: 0,
    highestBidder: null,
    entryFee: 0,
    phase: "waiting",
    playersData: {},
    order: [],
    turn: null,
    playedCards: [],
    bids: {},
    trumpCard: null,
    trumpSuit: null,
    targetScore: 30,
    roundHistory: [],
    rematchVotes: {},
  };
}

function createPlayer(id, socketId, name) {
  return {
    id,
    name: name || `Player-${id.slice(0, 4)}`, // fallback if name missing
    hand: [],
    bid: null,
    powerCard: null,
    tricks: 0,
    team: null,
    connected: true,
    socketId,
  };
}

function serializeRoomForPlayer(room, viewerPid) {
  const clone = structuredClone(room);

  for (const [pid, p] of Object.entries(clone.playersData)) {
    // Hide opponents' cards
    if (pid !== viewerPid) {
      p.hand = p.hand.map(() => ({ hidden: true }));
      continue;
    }

    // Only limit to 5 cards for Seven Calls
    if (room.gameType === "seven" && (clone.phase === "bidding" || clone.phase === "power-select")) {
      p.hand = p.hand.slice(0, 5);
    }
  }

  return clone;
}


function addPlayer(room, playerId, userId, socketId, name) {
  room.playersData[playerId] = {
    playerId,
    userId,              // ✅ THIS FIXES EVERYTHING
    name: name || `Player-${playerId.slice(0, 4)}`,
    hand: [],
    bid: null,
    tricks: 0,
    score: 0,
    connected: true,
    socketId,
  };

  room.order.push(playerId);
}

export function startGame(room) {
  if (!room || room.phase === "playing") return;

  switch (room.gameType) {
    case "seven":
      // 🧠 FINALIZE ROOM BEFORE GAME START
      assignSevenCallsTeams(room);
      startSevenCalls(room);
      break;

    case "callbreak":
      CallBreak.startCallBreak(room);
      break;

    case "flash":
      startFlash(room);
      break;

    default:
      console.error("❌ Unknown gameType:", room.gameType);
  }
}

function resetRoomForRestart(room) {
  room.phase = "waiting";
  room.playedCards = [];
  room.round = 1;

  room.teamTricks = { 1: 0, 2: 0 };
  room.scoreHistory = { 1: [], 2: [] };
  room.teamScores = { 1: 0, 2: 0 };

  room.powerSuit = null;
  room.pendingReveal = null;
  room.hiddenPower = null;

  for (const pid of room.order) {
    const p = room.playersData[pid];
    p.hand = [];
    p.bid = null;
    p.tricks = 0;
    p.powerCard = null;
    p.passedReveal = false;
  }
}

function resetSevenCallsForRematch(room) {
  // 🔥 CORE STATE
  room.phase = "bidding";
  room.round = 1;
  room.turn = null;
  room.playedCards = [];
  room.rematchVotes = {};

  // 🔥 BIDDING / POWER STATE
  room.bids = {};
  room.highestBid = 0;
  room.highestBidder = null;
  room.trumpSuit = null;
  room.trumpCard = null;
  room.hiddenPower = null;
  room.pendingReveal = null;
  room.awaitingPowerReveal = null;

  // 🔥 TEAM STATE
  room.teamScores = { 1: 0, 2: 0 };
  room.teamTricks = { 1: 0, 2: 0 };
  room.scoreHistory = { 1: [], 2: [] };
  room.roundHistory = [];

  // 🔥 PLAYER RESET
  for (const pid of room.order) {
    const p = room.playersData[pid];
    p.hand = [];
    p.bid = null;
    p.tricks = 0;
    p.score = 0;
    p.powerCard = null;
    p.passedReveal = false;
  }

  // ✅ ONLY CHANGE FOR INSTANT MATCH
  if (room.matchMode === "INSTANT") {
    advanceDealer(room);   // 🔥 THIS IS THE KEY
  }

  // teams stay same, order stays same
  assignSevenCallsTeams(room);
}


function resetCallBreakForRematch(room) {
  room.phase = "waiting";
  room.round = 1;
  room.turn = null;

  room.playedCards = [];
  room.bids = {};
  room.trumpSuit = null;
  room.trumpCard = null;
  room.rematchVotes = {};
  room.roundHistory = [];

  // 🔥 PLAYER RESET
  for (const pid of room.order) {
    const p = room.playersData[pid];
    p.hand = [];
    p.bid = null;
    p.tricks = 0;
    p.score = 0;
  }

  // ✅ ONLY FOR INSTANT MATCHES
  if (room.matchMode === "INSTANT") {
    advanceDealer(room);   // 🔥 rotate dealer
  }
}

async function getUserBalance(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { balance: true },
  });

  return user?.balance ?? 0;
}


async function createNewMatchForRematch(room, io) {
  if (room.isDemo) return;

  try {
    const match = await prisma.match.create({
      data: {
        gameType: room.gameType,
        stake: room.entryFee,
        status: "WAITING",
        roomId: room.roomId,
        players: {
          create: Object.values(room.playersData)
            .filter(p => !p.isAI)
            .map(p => ({ userId: p.userId })),
        },
      },
    });

    room.matchId = match.id;

    if (room.hasAI) {
      await lockMatchFundsWithAI(match.id);
    } else {
      await lockMatchFunds(match.id);
    }

    io.to(room.roomId).emit("funds-locked");

    console.log("🔁 NEW MATCH CREATED FOR REMATCH", {
      matchId: match.id,
      roomId: room.roomId,
    });
  } catch (err) {
    console.error("🔥 Failed to create rematch match:", err);
  }
}

