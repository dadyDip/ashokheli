"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import Confetti from "react-confetti";
import { useCardGame } from "../context/GameContext";
import { useRouter } from "next/navigation";

import Card from "./Card";


const TableContainer = ({ children }) => {
  return (
    <div className="fixed inset-0 overflow-hidden bg-gradient-to-br from-emerald-950 to-black">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-full h-full max-w-[900px] max-h-[900px]">
          {children}
        </div>
      </div>
    </div>
  );
};


/* ================= FLOATING CARD ================= */
const FloatingCard = ({ delay = 0 }) => (
  <motion.div
    animate={{ y: [0, -4, 0] }}
    transition={{
      duration: 3.5,
      repeat: Infinity,
      ease: "easeInOut",
      delay,
    }}
    className="
      w-[50px] h-[70px]
      rounded-lg
      border border-yellow-500/40
      bg-emerald-950
      shadow-md
    "
  />
);

/* ================= PLAYER SEAT ================= */
const PlayerSeat = ({ name, className }) => (
  <div className={`absolute flex flex-col items-center ${className}`}>
    <div className="flex -space-x-6">
      {[0, 1, 2, 3].map(i => (
        <FloatingCard key={i} delay={i * 0.25} />
      ))}
    </div>

    <div className="mt-2 px-4 py-1 text-xs rounded-full border border-yellow-500/40 text-yellow-300 bg-emerald-950/60 backdrop-blur">
      {name}
    </div>
  </div>
);

/* ================= SOUNDS ================= */
function useSounds() {
  const ref = useRef({});
  useEffect(() => {
    ref.current = {
      deal: new Audio("/sounds/deal.mp3"),
      card: new Audio("/sounds/card.mp3"),
      turn: new Audio("/sounds/turn.mp3"),
      win: new Audio("/sounds/win.mp3"),
    };
  }, []);
  return name => {
    const s = ref.current[name];
    if (!s) return;
    s.currentTime = 0;
    s.play().catch(() => {});
  };
}

/* ================= MAIN ================= */
export default function SevenCallsBoard() {
  const router = useRouter();

  const { room, playerId, winningAmount, socket } = useCardGame();
  
  const playSound = useSounds();

  if (!room) return <Center>Connecting…</Center>;
  const me = room.playersData?.[playerId];
  if (!me) return <Center>Registering…</Center>;

  const phase = room.phase;
  const order = room.order || [];
  const pendingReveal =
  room.pendingReveal &&
  room.pendingReveal.playerId === me.playerId;
  const [showTrump, setShowTrump] = useState(false);
  

  useEffect(() => {
    if (room.hiddenPower?.revealed) {
      setShowTrump(true);
      const t = setTimeout(() => setShowTrump(false), 4000);
      return () => clearTimeout(t);
    }
  }, [room.hiddenPower?.revealed]);

  /* ===== SOUNDS ===== */
  useEffect(() => {
    if (phase === "bidding") playSound("deal");
  }, [phase]);
  const [playWinSound, setPlayWinSound] = useState(false);

  useEffect(() => {
    if (room?.phase === "ended") {
      playSound("win");
      setPlayWinSound(true);
    }
  }, [room?.phase]);

  useEffect(() => {
    if (room.turn === playerId) playSound("turn");
  }, [room.turn]);

  /* ===== ROTATION ===== */
  const meIndex = order.indexOf(playerId);
  const rotated =
    meIndex === -1
      ? order
      : [...order.slice(meIndex), ...order.slice(0, meIndex)];

  const seatMap = ["bottom", "left", "top", "right"];

  /* ================= SCORE BOARD ================= */
    const renderScoreHistory = team => {
    const history = room.scoreHistory?.[team];
    if (!history || history.length === 0) {
      return <div className="opacity-50">—</div>;
    }

    return (
      <div className="flex flex-wrap gap-1">
        {history.map((score, i) => (
          <span
            key={i}
            className={`px-1.5 py-0.5 rounded text-[11px] ${
              score >= 0
                ? "bg-emerald-700/40 text-emerald-200"
                : "bg-red-700/40 text-red-200"
            }`}
          >
            {score > 0 ? `+${score}` : score}
          </span>
        ))}
      </div>
    );
  };

  const ScoreBoard = () => {
    const team1 = order.filter(pid => room.playersData[pid].team === 1);
    const team2 = order.filter(pid => room.playersData[pid].team === 2);

    const team1Names = team1.map(pid => room.playersData[pid].name).join(" ");
    const team2Names = team2.map(pid => room.playersData[pid].name).join(" ");

    const team1Score = room.teamScores?.[1] ?? 0;
    const team2Score = room.teamScores?.[2] ?? 0;



    return (
      <>
        {/* LEFT SCOREBOARD */}
        <div
          className="
            fixed z-50 bg-emerald-950/95 rounded-xl shadow-xl
            top-[5px] left-[5px]
            px-4 py-3 w-[300px] text-sm

            origin-top-left
            scale-100

            [@media(max-height:700px)]:scale-75
            [@media(max-height:550px)]:scale-65
            [@media(max-height:420px)]:scale-55
          "
          style={{
            transform: window.innerHeight <= 400 ? "scale(0.5)" : undefined,
          }}
        >
          {/* TITLE */}
          <div className="font-semibold mb-1">
            ♠ Seven Calls — Target {room.targetScore}
          </div>

          {/* TEAM NAMES */}
          <div className="text-xs mb-1 text-emerald-300">
            T1: {team1Names} | T2: {team2Names}
          </div>

          {/* TEAM TOTAL SCORES */}
          <div className="text-sm mb-2 font-semibold">
            Team1: {team1Score} | Team2: {team2Score}
          </div>

          {/* TEAM BIDS / TRICKS */}
          <div className="text-xs mb-2 space-y-1">
            <div>
              Team 1 bids: {room.teamBid?.[1] ?? "-"} | tricks:{" "}
              {room.teamTricks?.[1] ?? 0}
            </div>
            <div>
              Team 2 bids: {room.teamBid?.[2] ?? "-"} | tricks:{" "}
              {room.teamTricks?.[2] ?? 0}
            </div>
          </div>

          {/* SCORE HISTORY */}
          <div className="text-xs">
            <div className="font-semibold mt-2">Team 1 History</div>
            {renderScoreHistory(1)}

            <div className="font-semibold mt-2">Team 2 History</div>
            {renderScoreHistory(2)}
          </div>
        </div>

          <div
            className="
              fixed top-5 right-5 z-50
              bg-emerald-950/95 rounded-xl px-4 py-3 shadow-xl text-right

              origin-top-right
              scale-100

              [@media(max-height:700px)]:scale-75
              [@media(max-height:550px)]:scale-65
              [@media(max-height:420px)]:scale-60
            "
          >

          <div className="font-semibold mb-1">
            Winning Amount: 💰 TK{winningAmount}
          </div>
        </div>
      </>
    );
  };

  /* ================= WAITING ================= */
  if (room.phase === "waiting") {
    const seatPositions = [
      // Bottom (YOU)
      `
        bottom-[40px] left-1/2 -translate-x-1/2
        [@media(max-height:700px)]:bottom-[20px]
        [@media(max-height:600px)]:bottom-[10px]
      `,

      // Left
      `
        left-[40px] top-1/2 -translate-y-1/2
        [@media(max-height:600px)]:left-[80px]
      `,

      // Top
      `
        top-[40px] left-1/2 -translate-x-1/2
        [@media(max-height:700px)]:top-[100px]
        [@media(max-height:600px)]:top-[160px]
      `,

      // Right
      `
        right-[40px] top-1/2 -translate-y-1/2
        [@media(max-height:600px)]:right-[80px]
      `,
    ];


    return (
      <>
        {/* TOP LEFT LOGO (OUTSIDE SCALE) */}
        <div className="fixed z-50 top-[env(safe-area-inset-top)] left-[env(safe-area-inset-left)] px-4 py-3">
          <h1
            className="antialiased text-3xl tracking-wide font-semibold bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent"
            style={{ fontFamily: "'Story Script', cursive" }}
          >
            AshoKheli
          </h1>
        </div>

        <TableContainer>
          {/* CENTER */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-yellow-400 text-[90px]"
            >
              ♠
            </motion.div>

            <div className="mt-4 text-lg tracking-widest font-semibold text-emerald-300 uppercase">
              Seven Calls
            </div>
          </div>

          {/* PLAYERS */}
          {rotated.map((pid, index) => {
            const player = room.playersData[pid];
            return (
              <PlayerSeat
                key={pid}
                name={player?.name || "Waiting…"}
                className={seatPositions[index]}
              />
            );
          })}

          {/* WAITING TEXT */}
          <div className="absolute bottom-[130px] left-1/2 -translate-x-1/2">
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="px-6 py-2 rounded-full border border-yellow-500/40 text-yellow-300 text-sm"
            >
              Waiting for players…
            </motion.div>
          </div>
        </TableContainer>
      </>
    );
  }

  /* ================= BIDDING ================= */
  if (phase === "bidding") {
    return (
      <Table>
        <ScoreBoard />

        {/* 5 CARD PREVIEW */}
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex gap-4">
          {me.hand.slice(0, 5).map((c, i) => (
            <Card key={i} card={c} disabled />
          ))}
        </div>

        {/* BID BUTTONS */}
        {room.turn === playerId && me.bid == null && (
          <div className="absolute inset-0 flex items-center justify-center z-30">
            <div className="flex gap-6 bg-emerald-950/90 px-6 py-4 rounded-xl shadow-xl">
              {[5, 7, 8, 10].map(bid => (
                <button
                  key={bid}
                  className="bid-btn bg-emerald-800 px-6 py-3 rounded-xl text-xl"
                  onClick={() =>
                    socket.emit("place-bid", {
                      roomId: room.roomId,
                      playerId,
                      bid,
                    })
                  }
                >
                  {bid === 5 ? "Pass (5)" : bid}
                </button>
              ))}
            </div>
          </div>
        )}
      </Table>
    );
  }

  /* ================= POWER SELECT ================= */
  if (phase === "power-select") {
    return (
      <Table>
        <ScoreBoard />

        {room.highestBidder === playerId && me.powerCard == null ? (
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex gap-4">
            {me.hand.map((c, i) => (
              <Card
                key={i}
                card={c}
                onClick={() =>
                  socket.emit("set-power-card", {
                    roomId: room.roomId,
                    playerId,
                    card: c,
                  })
                }
              />
            ))}
          </div>
        ) : (
          <Center>Waiting for highest bidder…</Center>
        )}
      </Table>
    );
  }

  /* ================= PLAYING ================= */
  if (phase === "playing") {
    return (
      <>
        <Table>
          <ScoreBoard />

          {/* CENTER POT */}
          <div className="absolute inset-0 flex items-center justify-center gap-6">
            {room.playedCards.map((pc, i) => (
              <motion.div key={i}>
                <Card card={pc.card} disabled />
              </motion.div>
            ))}
          </div>
          {/* 🔥 TRUMP REVEAL OVERLAY */}
          {showTrump && room.hiddenPower?.revealed && (
            <div className="absolute inset-0 flex items-center justify-center z-50">
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1.15, opacity: 1 }}
                transition={{ duration: 0.25 }}
                className="bg-black/80 p-6 rounded-xl shadow-2xl"
              >
                <div className="text-center text-lg mb-3 text-emerald-300 font-bold">
                  🔥 TRUMP REVEALED
                </div>
                <Card card={room.hiddenPower.card} />
              </motion.div>
            </div>
          )}

          {/* PLAYERS */}
          {rotated.map((pid, i) => {
            const p = room.playersData[pid];
            const seat = seatMap[i];
            const isTurn = room.turn === pid;

            if (pid === playerId) {
              return (
                <MyHand
                  key={pid}
                  me={p}
                  socket={socket}
                  room={room}
                  playSound={playSound}
                  isTurn={isTurn}
                />
              );
            }

            return (
              <EnemyHand
                key={pid}
                player={p}
                seat={seat}
                isTurn={isTurn}
              />
            );
          })}
        </Table>

        {/* ✅ REVEAL / PASS OVERLAY — OUTSIDE TABLE */}
        {pendingReveal && (
          <div className="fixed inset-0 flex items-center justify-center z-[9999]">
            <div className="bg-emerald-950/95 px-8 py-6 rounded-xl shadow-2xl flex gap-6">
              <button
                className="bg-red-600 hover:bg-red-500 px-6 py-3 rounded-lg text-xl font-semibold"
                onClick={() =>
                  socket.emit("reveal-power", {
                    roomId: room.roomId,
                    playerId,
                  })
                }
              >
                🔥 Reveal Power
              </button>

              <button
                className="bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-lg text-xl font-semibold"
                onClick={() =>
                  socket.emit("pass-reveal", {
                    roomId: room.roomId,
                    playerId,
                  })
                }
              >
                ➡️ Pass
              </button>
            </div>
          </div>
        )}
      </>
    );
  }


  /* ================= FINISHED ================= */
/* ================= ENDED ================= */
  if (room.phase === "finished") {
    const team1Players = order.filter(
      pid => room.playersData[pid].team === 1
    );
    const team2Players = order.filter(
      pid => room.playersData[pid].team === 2
    );

    const t1Score = room.teamScores?.[1] ?? 0;
    const t2Score = room.teamScores?.[2] ?? 0;

    const winnerTeam =
      t1Score === t2Score ? null : t1Score > t2Score ? 1 : 2;

    const winnerNames = winnerTeam
      ? (winnerTeam === 1 ? team1Players : team2Players)
          .map(pid => room.playersData[pid].name)
          .join(" & ")
      : "Draw";

    return (
      <Center>
        {/* 🎉 CONFETTI */}
        {playWinSound && (
          <Confetti recycle={false} numberOfPieces={260} />
        )}

        <div className="text-center space-y-6">
          {/* TITLE */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1.15 }}
            transition={{ type: "spring", stiffness: 320, damping: 14 }}
          >
            <h1 className="text-5xl font-bold">🏆 Match Finished!</h1>
          </motion.div>

          {/* WINNER */}
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-3xl font-bold text-emerald-400">
              {winnerTeam
                ? `Congratulations Team ${winnerTeam}!`
                : "It's a Draw!"}
            </h2>

            {winnerTeam && (
              <div className="text-lg mt-1 text-emerald-200">
                {winnerNames}
              </div>
            )}
          </motion.div>

          {/* SCORES */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45 }}
            className="text-xl font-semibold text-yellow-300"
          >
            Team 1: {t1Score} | Team 2: {t2Score}
          </motion.div>

          {/* WINNING AMOUNT */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-2xl text-green-400 font-bold"
          >
            Winning Amount: 💰 TK{winningAmount}.00
          </motion.div>

          {/* EXIT */}
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.75 }}
          >
            <button
              onClick={() => {
                socket.emit("exit-room", {
                  roomId: room.roomId,
                  playerId,
                });
                router.push("/");
              }}
              className="mt-4 px-8 py-3 bg-red-600 hover:bg-red-500 rounded-xl text-white text-lg font-semibold"
            >
              Exit Match
            </button>

          </motion.div>
        </div>
      </Center>
    );
  }


  return <Center>Unknown state</Center>;
}

/* ================= HELPERS ================= */

function Center({ children }) {
  return (
    <div className="h-[100dvh] flex items-center justify-center bg-black text-emerald-100">
      {children}
    </div>
  );
}

function Table({ children }) {
  return (
    <div className="h-[100dvh] relative overflow-hidden bg-gradient-to-br from-emerald-900 to-black">
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="relative w-[92vw] h-[72vh] rounded-full
          bg-[url('/textures/felt.jpg')]
          bg-repeat bg-[length:400px_400px]
          shadow-[inset_0_0_90px_black,0_0_50px_rgba(0,255,180,0.3)]"
        >
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-800/80 to-emerald-950/90" />
          <div className="absolute inset-6 rounded-full border border-emerald-600/40" />
          {children}
        </div>
      </div>
    </div>
  );
}

function MyHand({ me, socket, room, playSound, isTurn }) {
  const leadSuit = room.playedCards?.[0]?.card?.suit;
  const canPlay = card => {
    if (room.turn !== me.playerId) return false;
    if (room.pendingReveal) return false;
    if (!leadSuit) return true;
    const hasLead = me.hand.some(c => c.suit === leadSuit);
    return !hasLead || card.suit === leadSuit;
  };

  return (
    <div className="
      absolute bottom-[-90px] left-1/2 -translate-x-1/2 h-44 w-[640px]

      scale-100
      [@media(max-height:400px)]:scale-[0.85]
    ">
      {me.hand.map((c, i) => {
        const mid = (me.hand.length - 1) / 2;
        const diff = i - mid;
        const playable = canPlay(c);

        return (
          <motion.div
            key={i}
            className="absolute left-1/2"
            animate={{ x: diff * 48 }}
            whileHover={playable ? { y: -26, scale: 1.12 } : {}}
            onClick={() => {
              if (!playable) return;
              playSound("card");
              socket.emit("play-card", {
                roomId: room.roomId,
                playerId: me.playerId,
                card: c,
              });
            }}
          >
            <Card card={c} disabled={!playable} />
          </motion.div>
        );
      })}
    </div>
  );
}

function EnemyHand({ player, seat, isTurn }) {
  const h =
    typeof window !== "undefined" ? window.innerHeight : 1000;

  /* ================= HEIGHT DELTA ================= */
  const delta = Math.max(0, 500 - h);

  /* ================= OUTWARD PUSH ================= */
  const sidePush = Math.min(80, 40 + delta * 0.6); // LEFT / RIGHT
  const topPush = Math.min(70, 30 + delta * 0.5);  // TOP
  const bottomPush = Math.min(50, 20 + delta * 0.4);

  /* ================= POSITION ================= */
  const stylePos = (() => {
    switch (seat) {
      case "top":
        return {
          top: `${18 - topPush}px`, // 🔥 move UP
          left: "50%",
          transform: "translateX(-50%)",
        };

      case "bottom":
        return {
          bottom: `${8 - bottomPush}px`,
          left: "50%",
          transform: "translateX(-50%)",
        };

      case "left":
        return {
          left: `${8 - sidePush}px`, // 🔥 move LEFT
          top: "50%",
          transform: "translateY(-50%)",
        };

      case "right":
        return {
          right: `${4 - sidePush}px`, // 🔥 move RIGHT
          top: "50%",
          transform: "translateY(calc(-50% - 10px))",
        };

      default:
        return null;
    }
  })();

  if (!stylePos) return null;

  /* ================= CARD SCALE (UNCHANGED) ================= */
  const scale =
    h > 720 ? 1 :
    h > 600 ? 0.96 :
    h > 480 ? 0.92 :
    h > 400 ? 0.88 :
    0.84;

  /* ================= ROTATION ================= */
  const rotate =
    seat === "left"
      ? "rotate-90"
      : seat === "right"
      ? "-rotate-90"
      : "";

  return (
    <div className="absolute text-center pointer-events-none" style={stylePos}>
      {/* PLAYER NAME */}
      <div
        className={`mb-2 text-xs font-medium text-emerald-200 ${
          isTurn ? "ring-2 ring-emerald-400 rounded-full px-2" : ""
        }`}
      >
        {player.name}
      </div>

      {/* HAND */}
      <div className="relative h-28 w-72">
        <div className={`absolute inset-0 ${rotate}`}>
          {player.hand.map((_, i) => {
            const mid = (player.hand.length - 1) / 2;
            const diff = i - mid;

            return (
              <div
                key={i}
                className="absolute left-1/2"
                style={{
                  transform: `translateX(calc(-50% + ${
                    diff * 12
                  }px)) rotate(${diff * 3}deg)`,
                }}
              >
                <div style={{ transform: `scale(${scale})` }}>
                  <Card faceDown />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}



