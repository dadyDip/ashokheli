import prisma from "./prisma.js";
import { lockMatchFunds, settleMatch } from "./services/funds.service.js";
import { getAIUserId } from "./aiUser.js";

function isCapturablePos(pos) {
  return typeof pos === "number" && pos >= 0 && pos <= GLOBAL_MAX_POS;
}


export function setupLudoGame(io) {
  const rooms = {};
  const socketToPlayer = new Map();

  function emitRoom(roomId) {
    const room = rooms[roomId];
    if (!room) return;

    room.actionId = (room.actionId || 0) + 1;
    room.serverTime = Date.now();

    io.to(roomId).emit("update-room", roomSummary(room));
  }

  function roomSummary(room) {
    return {
      roomId: room.roomId,
      phase: room.phase,
      maxPlayers: room.maxPlayers,
      order: room.order,
      playerCount: room.order.length, // 🔥 FIX
      turn: room.turn,
      dice: room.dice,
      playersData: room.playersData,
      gameStarted: room.phase === "playing", // 🔥 FIX
      actionId: room.actionId,
      serverTime: room.serverTime,
      winningAmount: room.winningAmount ?? 0,
  };
  }

  function nextTurnId(room, currentPlayerId) {
    const order = room.order;
    if (!order || order.length === 0) return null;
    const idx = order.indexOf(currentPlayerId);
    return order[(idx + 1) % order.length];
  }

  function advanceTurn(room, currentPlayerId) {
    room.turn = nextTurnId(room, currentPlayerId);
    room.dice = null;
    room.hasRolled = false;
    room.isMoving = false;
  }


  function shouldKeepTurn(room, moveResult, playerId) {
    if (moveResult?.captured) return true;
    if (moveResult?.finished) return true;
    if (room.dice === 6) return true;

    return false;
  }

    // ---------------- MOVEMENT ---------------- //
  function canPlayerMove(room, playerId, dice) {
    if (dice == null) return false;
    const p = room.playersData[playerId];
    if (!p) return false;
      return p.pieces.some(pos => {
        if (pos === -1) return dice === 6;
        return pos + dice <= FINAL_CELL;
      });
  }

  function listValidMoves(room, playerId, dice) {
    const moves = [];
    const p = room.playersData[playerId];
    if (!p || dice == null) return moves;
    p.pieces.forEach((pos, i) => {
      if (pos === -1 && dice === 6) moves.push(i);
      else if (pos >= 0 && pos + dice <= FINAL_CELL) moves.push(i);

    });
    return moves;
  }
  function performMove(room, playerId, pieceIndex) {
    if (!room?.playersData) return null;

    const player = room.playersData[playerId];
    if (!player) return null;

    let finished = false;
    let won = false;

    let pos = player.pieces[pieceIndex];

    // -------- MOVE LOGIC --------
    if (pos === -1) pos = 0;
    else pos += room.dice;

    player.pieces[pieceIndex] = pos;

    const landed = mapPosForClient(player.color, pos);

    // -------- CAPTURE --------
    const captured = handleCapture(room, playerId, pieceIndex, pos);

    // -------- FINISH --------
    if (pos === FINAL_CELL) {
      finished = true;
      room.sixCount[playerId] = 0;
    }

    if (captured) {
      room.sixCount[playerId] = 0;
    }

    // -------- WIN --------
    if (isWinner(player)) {
      won = true;
      room.phase = "ended";
      room.winner = playerId;
      room.winningAmount =
        Number(room.entryFee) * Number(room.maxPlayers);
    }

    return {
      playerId,
      pieceIndex,
      newPos: pos,
      global: landed,
      captured,
      finished,
      won,
    };
  }

  function handleCapture(room, attackerId, pieceIndex, newPos) {
    const attacker = room.playersData[attackerId];
    const landed = resolvePos(attacker.color, newPos);

    // ❌ NOT GLOBAL
    if (!landed || landed.type !== "global") return false;

    const gIdx = landed.index;

    // ❌ SAFE CELL
    if (SAFE_CELLS.includes(gIdx)) return false;

    // ❌ BLOCK
    const blockColor = getBlockAtGlobal(gIdx, room.playersData);
    if (blockColor && blockColor !== attacker.color) return false;

    let captured = false;

    for (const [pid, defender] of Object.entries(room.playersData)) {
      if (pid === attackerId) continue;

      defender.pieces.forEach((dPos, i) => {
        if (!isCapturablePos(dPos)) return;

        const r = resolvePos(defender.color, dPos);
        if (r.type !== "global") return;

        if (r.index === gIdx) {
          defender.pieces[i] = -1;
          captured = true;

          console.log(
            `💥 CAPTURE: ${attacker.color} captured ${defender.color} at ${gIdx}`
          );
        }
      });
    }

    return captured;
  }


  // ---------------- Ai ---------------- //
  function runAI(roomId, playerId) {
    const room = rooms[roomId];
    if (!room) return;

    const p = room.playersData[playerId];
    if (!p || !p.isAI || p.connected) return;
    if (room.turn !== playerId) return;

    // 🟡 STEP 1: ROLL DICE
    if (room.dice === null) {
      room.dice = Math.floor(Math.random() * 6) + 1;
      emitRoom(roomId);

      // ⏳ wait 3 seconds AFTER roll before move
      setTimeout(() => {
        if (!canPlayerMove(room, playerId, room.dice)) {
          advanceTurn(room, playerId);
          emitRoom(roomId);
          maybeTriggerAI(roomId);
          return;
        }

        runAI(roomId, playerId); // proceed to move
      }, 300);

      return;
    }

    // 🟡 STEP 2: MOVE PIECE
    const moves = listValidMoves(room, playerId, room.dice);
    if (!moves.length) {
      advanceTurn(room, playerId);
      emitRoom(roomId);
      maybeTriggerAI(roomId);
      return;
    }

    const pieceIndex = moves[Math.floor(Math.random() * moves.length)];
    const result = performMove(room, playerId, pieceIndex);
    const keepTurn = shouldKeepTurn(room, result, playerId);
    if (keepTurn) {
      room.dice = null;
      room.hasRolled = false;
      room.sixCount[playerId] = 0;
    } else {
      room.sixCount[playerId] = 0;
      advanceTurn(room, playerId);
    }
    if (
      result.won &&
      !room.isDemo &&
      !room.settled
    ) {
      room.settled = true;

      settleMatch(
        room.matchId,
        room.playersData[playerId].userId
      ).catch(console.error);
    }


    emitRoom(roomId);
    maybeTriggerAI(roomId);
  }

  function maybeTriggerAI(roomId) {
    const room = rooms[roomId];
    if (!room) return;

    if (room._aiThinking) return;

    const pid = room.turn;
    const p = room.playersData[pid];

    if (!p || !p.isAI || p.connected) return;

    room._aiThinking = true;

    setTimeout(() => {
      room._aiThinking = false;
      runAI(roomId, pid);
    }, 200);
  }




  const COLORS = {
    2: ["blue", "green"],
    3: ["blue", "red", "green"],
    4: ["blue", "red", "green", "yellow"],
  };

  // ---------------- SOCKET ---------------- //
  io.on("connection", socket => {

    socket.on("join-ludo-room", async ({
      roomId,
      name,
      playerId,
      userId,
      validated,
      demo = false,
    }) => {


      /* ================= 1️⃣ AUTH ================= */
      if (!validated || !userId || !playerId) {
        socket.emit("join-error", "Authentication required");
        return;
      }

      /* ================= 2️⃣ LOAD ROOM FROM DB ================= */
      let dbRoom = null;

      if (!demo) {
        dbRoom = await prisma.room.findUnique({ where: { id: roomId } });

        if (!dbRoom) {
          socket.emit("join-error", "Room does not exist");
          return;
        }
      }
      const maxPlayers = demo
        ? dbRoom?.maxPlayers ?? 4
        : dbRoom.maxPlayers;

      const entryFee = demo ? 0 : Number(dbRoom.entryFee || 0);

      /* ================= 3️⃣ BALANCE CHECK ================= */
      if (!demo && entryFee > 0) {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { balance: true },
        });

        if (!user || user.balance < entryFee) {
          socket.emit("join-error", "Not enough balance");
          return;
        }
      }

      /* ================= 4️⃣ ROOM INIT ================= */
      if (!rooms[roomId]) {
        rooms[roomId] = {
          roomId,
          isDemo: Boolean(demo),
          phase: "waiting",
          maxPlayers,
          entryFee,
          winningAmount: Number(entryFee) * Number(maxPlayers),
          matchId: null,
          settled: false,
          playersData: {},
          order: [],
          turn: null,
          dice: null,
          hasRolled: false,
          isMoving: false,
          sixCount: {},
          _aiThinking: false,
          disconnectTimers: {},
          lastHumanLeftAt: null,
          createdAt: Date.now(),
        };

        console.log("🆕 ROOM INITIALIZED (MEMORY)", { roomId });
      }

      const room = rooms[roomId];

      /* ================= 5️⃣ RECONNECT ================= */
      if (room.playersData[playerId]) {
        const p = room.playersData[playerId];

        p.socketId = socket.id;
        p.connected = true;
        p.isAI = false;

        // cancel AI takeover timer
        if (room.disconnectTimers[playerId]) {
          clearTimeout(room.disconnectTimers[playerId]);
          delete room.disconnectTimers[playerId];
        }
        room.winningAmount =
        Number(room.entryFee) * Number(room.maxPlayers);

        socket.join(roomId);
        socketToPlayer.set(socket.id, { roomId, playerId, userId });

        console.log("🔁 PLAYER RECONNECTED", { roomId, playerId });

        emitRoom(roomId);
        return;
      }

      /* ================= 6️⃣ ROOM FULL ================= */
      if (room.order.length >= room.maxPlayers) {
        socket.emit("room-full");
        return;
      }

      /* ================= 7️⃣ ADD HUMAN PLAYER ================= */
      const colorList = COLORS[room.maxPlayers] || COLORS[2];
      const color = colorList[room.order.length];

      room.playersData[playerId] = {
        playerId,
        userId,
        name: name || "Player",
        socketId: socket.id,
        connected: true,
        isAI: false,
        color,
        pieces: [-1, -1, -1, -1],
      };

      room.order.push(playerId);

      room.sixCount[playerId] = 0;
      room.turn ??= playerId;

      socket.join(roomId);
      socketToPlayer.set(socket.id, { roomId, playerId, userId });

      console.log("✅ PLAYER JOINED", {
        roomId,
        playerId,
        count: room.order.length,
      });

      /* ================= 9️⃣ START GAME RULES ================= */
      const humanCount = Object.values(room.playersData).filter(
        p => !p.isAI
      ).length;


      const shouldStart = room.isDemo
        ? room.order.length === 1 // demo = start after first human
        : humanCount === room.maxPlayers;



      if (shouldStart && room.phase === "waiting") {
        // 🤖 ADD AI ONLY FOR DEMO ROOMS
        if (room.isDemo) {
          const aiUserId = await getAIUserId();
          const colorList = COLORS[room.maxPlayers];

          for (let i = room.order.length; i < room.maxPlayers; i++) {
            const aiPlayerId = `AI-${i}-${roomId}`;

            room.playersData[aiPlayerId] = {
              playerId: aiPlayerId,
              userId: aiUserId,
              name: "AI Bot",
              socketId: null,
              connected: false,
              isAI: true,
              color: colorList[i],
              pieces: [-1, -1, -1, -1],
            };

            room.order.push(aiPlayerId);
            room.sixCount[aiPlayerId] = 0;
          }

          console.log("🤖 DEMO BOTS FINALIZED", room.order);
        }

        room.phase = "starting";

        console.log("🚀 STARTING GAME", {
          roomId,
          humans: humanCount,
          maxPlayers: room.maxPlayers,
        });

        const match = await prisma.match.create({
          data: {
            gameType: "LUDO",
            stake: demo ? 0 : room.entryFee,
            status: "PLAYING",
            roomId,
            players: {
              create: Object.values(room.playersData)
                .filter(p => !p.isAI)
                .map(p => ({ userId: p.userId })),
            },
          },
        });

        room.matchId = match.id;

        if (!room.isDemo) {
          await lockMatchFunds(match.id);
        }

        room.phase = "playing";
        room.winningAmount = room.entryFee * room.order.length;
        room.turn = room.order[0];

        console.log("🎮 GAME LIVE", {
          roomId,
          matchId: match.id,
          firstTurn: room.turn,
        });

        emitRoom(roomId);
        if (room.isDemo) {
          maybeTriggerAI(roomId);
        }

      }
    });

    socket.on("roll-dice", ({ roomId, playerId }) => {
      const room = rooms[roomId];
      if (!room || room.turn !== playerId) return;
      if (room.dice !== null) return; 

      const dice = Math.floor(Math.random() * 6) + 1;
      room.dice = dice;
      room.hasRolled = true;
      console.log(`🎲 ${playerId} rolled ${dice}`);

      if (dice === 6) {
        room.sixCount[playerId]++;

        if (room.sixCount[playerId] === 3) {
          console.log(`🔥 ${playerId} rolled 3 sixes — LAST SIX DESTROYED`);

          room.sixCount[playerId] = 0;
          room.dice = null;
          room.hasRolled = false;
          room.isMoving = false;
          advanceTurn(room, playerId);

          emitRoom(roomId);
          maybeTriggerAI(roomId);
          return;
        }
      } else {
        room.sixCount[playerId] = 0;
      }

      // auto-pass if no moves
      if (!canPlayerMove(room, playerId, dice)) {
        console.log(`⛔ ${playerId} cannot move with dice=${dice}, passing turn`);
        advanceTurn(room, playerId);
        room.dice = null;
        room.hasRolled = false;
        room.isMoving = false; // ✅ REQUIRED
        room.sixCount[playerId] = 0; // ✅ also reset six streak

        emitRoom(roomId);
        maybeTriggerAI(roomId)
        return;
      }


      emitRoom(roomId);
    });

    socket.on("move-piece", ({ roomId, playerId, pieceIndex }) => {
      const room = rooms[roomId];
      if (!room) return;

      // ❌ not your turn
      if (room.turn !== playerId) return;

      // ❌ must roll first
      if (room.dice == null) {
        console.log("🚫 Move blocked: roll dice first");
        emitRoom(roomId);
        return;
      }

      // ❌ prevent double moves
      if (room.isMoving) return;
      room.isMoving = true;

      const validMoves = listValidMoves(room, playerId, room.dice);

      // ❌ invalid click
      if (!validMoves.includes(pieceIndex)) {
        console.log(`🚫 Invalid move click by ${playerId}`);
        room.isMoving = false;
        emitRoom(roomId);
        return;
      }

      // ================= PERFORM MOVE =================
      const moveResult = performMove(room, playerId, pieceIndex);
      room.isMoving = false;

      const keepTurn = shouldKeepTurn(room, moveResult, playerId);

      if (keepTurn) {
        room.dice = null;
        room.hasRolled = false;
        room.sixCount[playerId] = 0;
      } else {
        room.sixCount[playerId] = 0;
        advanceTurn(room, playerId);
      }
      // ================= WIN SETTLEMENT =================
      if (
        moveResult.won &&
        !room.isDemo &&
        !room.settled
      ) {
        room.settled = true;

        settleMatch(
          room.matchId,
          room.playersData[playerId].userId
        ).catch(console.error);
      }

      // ================= EMITS =================
      io.to(roomId).emit("animate-move", {
        ...moveResult,
        dice: room.dice,
      });

      emitRoom(roomId);
    });


    socket.on("piece-captured", () => {
      playSound("cut");
    });

    socket.on("disconnect", () => {
      const info = socketToPlayer.get(socket.id);
      if (!info) return;

      const { roomId, playerId } = info;
      const room = rooms[roomId];
      if (!room) return;

      const p = room.playersData[playerId];
      if (!p) return;

      p.connected = false;

      console.log("🔌 PLAYER DISCONNECTED", { roomId, playerId });

      // AI takeover after 10s
      room.disconnectTimers[playerId] = setTimeout(() => {
        if (!p.connected) {
          p.isAI = true;
          console.log("🤖 AI TOOK OVER", { roomId, playerId });
          maybeTriggerAI(roomId);
        }
      }, 50_000);

      // Cleanup if everyone left
      setTimeout(() => {
        const anyHuman = Object.values(room.playersData).some(
          p => !p.isAI && p.connected
        );

        if (!anyHuman && room.phase !== "playing") {
          console.log("🧹 ROOM CLEANED", roomId);
          delete rooms[roomId];
        }
      }, 30_000);
    });

      });
    }


/* ---------------- PATH CONFIG ---------------- */
const globalPath = [
  { x: 0, y: 6 }, { x: 1, y: 6 }, { x: 2, y: 6 }, { x: 3, y: 6 }, { x: 4, y: 6 }, { x: 5, y: 6 },
  { x: 6, y: 5 }, { x: 6, y: 4 }, { x: 6, y: 3 }, { x: 6, y: 2 }, { x: 6, y: 1 }, { x: 6, y: 0 },
  { x: 7, y: 0 }, { x: 8, y: 0 }, { x: 8, y: 1 }, { x: 8, y: 2 }, { x: 8, y: 3 }, { x: 8, y: 4 }, { x: 8, y: 5 },
  { x: 9, y: 6 }, { x: 10, y: 6 }, { x: 11, y: 6 }, { x: 12, y: 6 }, { x: 13, y: 6 }, { x: 14, y: 6 },
  { x: 14, y: 7 }, { x: 14, y: 8 }, { x: 13, y: 8 }, { x: 12, y: 8 }, { x: 11, y: 8 }, { x: 10, y: 8 }, { x: 9, y: 8 },
  { x: 8, y: 9 }, { x: 8, y: 10 }, { x: 8, y: 11 }, { x: 8, y: 12 }, { x: 8, y: 13 }, { x: 8, y: 14 },
  { x: 7, y: 14 }, { x: 6, y: 14 }, { x: 6, y: 13 }, { x: 6, y: 12 }, { x: 6, y: 11 }, { x: 6, y: 10 }, { x: 6, y: 9 },
  { x: 5, y: 8 }, { x: 4, y: 8 }, { x: 3, y: 8 }, { x: 2, y: 8 }, { x: 1, y: 8 }, { x: 0, y: 8 },
  { x: 0, y: 7 } // pre-final for red
];
const pathLength = 52;    
const stretchLen = 5;   
const finishPos = pathLength + stretchLen; 
const safeCells = [1, 9, 14, 22, 27, 35, 40, 48];
const FINAL_CELL = 56;
const PATH_LEN = 52;          // render cells 0–51
const GLOBAL_MAX_POS = 50;   // ONLY these can be captured
const ENTRY_POS = 51;        // protected
const STRETCH_START = 52;    // 52–55
const FINISH_POS = 56;
const SAFE_CELLS = [1, 9, 14, 22, 27, 35, 40, 48];

const startIndex = { red: 1, green: 14, yellow: 27, blue: 40 };
const entryIndex = { red: 51, green: 12, yellow: 25, blue: 38 };
const finalStretchCoords = {
  red: Array.from({ length: stretchLen }, (_, i) => ({ x: 1 + i, y: 7 })),
  green: Array.from({ length: stretchLen }, (_, i) => ({ x: 7, y: 1 + i })),
  blue: Array.from({ length: stretchLen }, (_, i) => ({ x: 7, y: 9 + i })),
  yellow: Array.from({ length: stretchLen }, (_, i) => ({ x: 9 + i, y: 7 })),
};

// ---------------- HELPERS ---------------- //

function resolvePos(color, pos) {
  if (pos === -1) return null;

  if (pos <= GLOBAL_MAX_POS) {
    return {
      type: "global",
      index: (startIndex[color] + pos) % PATH_LEN,
    };
  }

  if (pos === ENTRY_POS) {
    return { type: "entry" };
  }

  if (pos >= STRETCH_START && pos < FINISH_POS) {
    return { type: "stretch" };
  }

  return { type: "finished" };
}

function mapPosForClient(color, pos) {
  const r = resolvePos(color, pos);

  if (!r) return null;

  if (r.type === "global") {
    return {
      type: "global",
      index: r.index,
      coords: globalPath[r.index],
    };
  }

  if (r.type === "entry") {
    return { type: "entry" };
  }

  if (r.type === "stretch") {
    const stretchIndex = pos - STRETCH_START;
    return {
      type: "stretch",
      index: stretchIndex,
      coords: finalStretchCoords[color][stretchIndex],
    };
  }

  return { type: "finished" };
}


function isWinner(player) {
    return player.pieces.every(pos => pos === FINAL_CELL);
}

function getBlockAtGlobal(globalIdx, playersData) {
  const count = {};

  for (const p of Object.values(playersData)) {
    for (const pos of p.pieces) {
      if (!isCapturablePos(pos)) continue;

      const r = resolvePos(p.color, pos);
      if (r.type !== "global") continue;

      if (r.index === globalIdx) {
        count[p.color] = (count[p.color] || 0) + 1;
      }
    }
  }

  for (const c in count) {
    if (count[c] >= 2) return c;
  }

  return null;
}

