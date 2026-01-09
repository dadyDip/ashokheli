import * as CallBreak from "./games/callbreak.js";
import {
  startSevenCalls,
  placeBid as placeSevenCallsBid,
  setPowerCard,
  playCard as playSevenCard,
} from "./games/sevenCalls.js";
import prisma from "./prisma.js";
import { lockMatchFunds } from "./services/funds.service.js";
import { settleMatch, settleTeamMatch, } from "./services/funds.service.js";
import { triggerAITurn } from "./ai/ai.controller.js";
import { getAIUserId } from './aiUser.js';
import { revealPower } from "./games/sevenCalls.js";
import { assignSevenCallsTeams } from "./games/sevenCalls.js";


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
            if (demo) {
              const gameType = mode === "seven" ? "seven" : "callbreak";

              room = createRoom(roomId, gameType);

              room.gameType = gameType;

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
                },
              });

              if (!dbRoom) {
                socket.emit("join-error", "❌ Room does not exist");
                return;
              }

              room = createRoom(roomId, dbRoom.gameType);
              room.gameType = dbRoom.gameType;
              room.mode = dbRoom.gameType;
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

            console.log("💰 balance check", {
              userId,
              balance,
              required: room.entryFee,
            });

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
          if (room.isDemo) {
            const aiUserId = await getAIUserId();

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
                socketId: null,
              };

              room.order.push(aiPid);
            }
          }
          /* ================= START MATCH IF READY ================= */
          if (
            Object.keys(room.playersData).length === room.maxPlayers &&
            room.phase === "waiting"
          ) {
            console.log("🎯 ALL PLAYERS JOINED — STARTING MATCH");

            room.phase = "starting";

            if (!room.isDemo) {
              const match = await prisma.match.create({
                data: {
                  gameType: room.gameType,
                  stake: room.entryFee,
                  status: "WAITING",
                  roomId: room.roomId,
                  players: {
                    create: Object.values(room.playersData).map(p => ({
                      userId: p.userId,
                    })),
                  },
                },
              });

            room.matchId = match.id;
            await lockMatchFunds(match.id);
            io.to(room.roomId).emit("funds-locked");
          }

            startGame(room);
            emit(io, room);
            maybeTriggerAI(io, room); // phase → bidding
          }

          emit(io, room);
        } catch (err) {
          console.error("🔥 join-card-room fatal error", err);
          socket.emit("join-error", "❌ Internal server error");
        }
      }
    );

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

    socket.on("vote-rematch", ({ roomId, playerId, vote }) => {
      const room = cardRooms[roomId];
      if (!room || room.phase !== "ended") return;

      if (!room.rematchVotes) room.rematchVotes = {};
      room.rematchVotes[playerId] = vote;

      const yesVotes = Object.values(room.rematchVotes).filter(v => v).length;
      const totalPlayers = room.order.length;

      // 🔥 DEMO / AI MATCH → auto-restart if real player voted yes
      const realPlayers = Object.values(room.playersData).filter(p => !p.isAI).length;

      if (vote && realPlayers === 1) {
        room.round = 1;
        room.roundHistory = [];
        room.rematchVotes = {};

        for (const pid of room.order) {
          const p = room.playersData[pid];
          p.score = 0;
          p.tricks = 0;
          p.bid = null;
        }

        startGame(room);
      }

      // 🔥 Normal 4-player match
      else if (yesVotes === totalPlayers) {
        room.round = 1;
        room.roundHistory = [];
        room.rematchVotes = {};

        for (const pid of room.order) {
          const p = room.playersData[pid];
          p.score = 0;
          p.tricks = 0;
          p.bid = null;
        }

        startGame(room);
      }

      emit(io, room);
    });

    socket.on("vote-rematch-7call", ({ roomId, playerId, vote }) => {
      const room = rooms[roomId];
      if (!room || !room.playersData[playerId]) return;

      // Initialize rematchVotes if not exists
      if (!room.rematchVotes) room.rematchVotes = {};

      room.rematchVotes[playerId] = vote;

      // Broadcast current votes to everyone
      io.to(roomId).emit("update-rematch-votes", room.rematchVotes);

      const votes = Object.values(room.rematchVotes);
      const allVoted = votes.length === room.order.length;
      const demoRoom = room.isDemo || false;

      if (demoRoom && votes.includes(true)) {
        // Start immediately if demo room and any vote is yes
        startNewSevenCallsMatch(room);
      } else if (!demoRoom && allVoted) {
        // Only start if all players voted
        const anyYes = votes.some(v => v);
        if (anyYes) startNewSevenCallsMatch(room);
        else {
          // If all voted NO, end match normally
          io.to(roomId).emit("rematch-cancelled");
          room.rematchVotes = {};
        }
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

      const player = room.playersData[playerId];
      if (!player) return;

      player.connected = false;
      player.isAI = true; 
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
export async function onGameEnded(room) {
  if (!room.matchId) throw new Error("No matchId");

  const winnerPid = room.winner;
  if (!winnerPid) throw new Error("No winner");

  const winnerPlayer = room.playersData[winnerPid];
  if (!winnerPlayer || !winnerPlayer.userId) {
    throw new Error("Winner has no userId");
  }

  const winnerUserId = winnerPlayer.userId; // REAL DB ID

  console.log("🏁 Settling match", { matchId: room.matchId, winnerUserId });

  if (room.gameType === "seven") {
    await settleTeamMatch(room, [winnerUserId]);
  } else {
    await settleMatch(room.matchId, winnerUserId);
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

function emit(io, room) {
  room.actionId++;
  room.serverTime = Date.now();
  io.to(room.roomId).emit("update-room", room);
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

function startGame(room) {
  if (room.gameType === "seven") {
    // 🧠 FINALIZE ROOM BEFORE GAME START
    assignSevenCallsTeams(room);


    startSevenCalls(room);
  } else {
    CallBreak.startCallBreak(room);
  }
}

function startNewSevenCallsMatch(room) {
  // Reset match state
  room.phase = "waiting";
  room.playedCards = [];
  room.hiddenPower = {};
  room.rematchVotes = {};
  room.order = shuffle([...room.order]); // optional: shuffle player order
  room.playersData = Object.fromEntries(
    Object.entries(room.playersData).map(([pid, p]) => ({
      [pid]: {
        ...p,
        hand: [],
        bid: null,
        tricks: 0,
      },
    }))
  );

  // Emit updated room to all
  io.to(room.roomId).emit("update-room", room);

  // Optionally trigger deal if needed
  io.to(room.roomId).emit("start-sevencalls");
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


// async function resolveMatch(room) {
//   if (!room.matchId) return;

//   await fetch(`${process.env.BASE_URL}/api/match/resolve`, {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//       Authorization: `Bearer ${process.env.INTERNAL_ADMIN_TOKEN}`,
//     },
//     body: JSON.stringify({
//       matchId: room.matchId,
//       gameType: room.mode === "seven" ? "SEVEN" : "CALLBREAK",
//       winners: room.winners,
//     }),
//   });
// }
async function getUserBalance(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { balance: true },
  });

  return user?.balance ?? 0;
}



export {
  startGame,
};
