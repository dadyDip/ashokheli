"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import Confetti from "react-confetti";
import { useCardGame } from "../context/GameContext";
import { useRouter } from "next/navigation";


import Card from "./Card";

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
export default function CallBreakBoard() {
  const router = useRouter();
  const { room, playerId, winningAmount, socket } = useCardGame();
  const playSound = useSounds();
  const [winnerPid, setWinnerPid] = useState(null);
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    const originalTouchAction = document.body.style.touchAction;

    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.touchAction = originalTouchAction;
    };
  }, []);



  if (!room) return <Center>Connecting…</Center>;
  const me = room.playersData?.[playerId];
  if (!me) return <Center>Registering…</Center>;

  const order = room.order || [];
  const targetScore = room.targetScore ?? 30;

  /* ===== DEAL SOUND ===== */
  useEffect(() => {
    if (room.phase === "bidding") playSound("deal");
  }, [room.phase]);

  /* ===== TURN SOUND ===== */
  useEffect(() => {
    if (room.turn === playerId) playSound("turn");
  }, [room.turn]);

  /* ===== TRICK WINNER ===== */
  useEffect(() => {
    if (room.trickWinner) {
      setWinnerPid(room.trickWinner);
      setTimeout(() => setWinnerPid(null), 900);
    }
  }, [room.trickWinner]);

  /* ===== MATCH END SOUND (FIXED) ===== */
  useEffect(() => {
    if (room.phase === "ended") {
      playSound("win");
    }
  }, [room.phase]);

  /* ===== ROTATION ===== */
  const meIndex = order.indexOf(playerId);
  const rotated =
    meIndex === -1
      ? order
      : [...order.slice(meIndex), ...order.slice(0, meIndex)];

  const seatMap = {
    0: "bottom", // me
    1: "left",
    2: "top",
    3: "right",
  };
  const maxScore = Math.max(
    ...Object.values(room.playersData).map(p => p.score ?? 0)
  );
  const winners = Object.values(room.playersData).filter(
    p => (p.score ?? 0) === maxScore
  );
  const winnerNames = winners.map(p => p.name).join(", ");

  const [playWinSound, setPlayWinSound] = useState(false);
  const [playCoinSound, setPlayCoinSound] = useState(false);

  // Play victory sound once when component mounts
  useEffect(() => {
    const winAudio = new Audio("/sounds/win.mp3");
    winAudio.play().catch(() => {});
    setPlayWinSound(true);

    // delay coin sound slightly after win
    const coinTimeout = setTimeout(() => {
      const coinAudio = new Audio("/sounds/coin.mp3");
      coinAudio.play().catch(() => {});
      setPlayCoinSound(true);
    }, 700); // 0.7s after win

    return () => clearTimeout(coinTimeout);
  }, []);

  const leadSuit = room.playedCards?.[0]?.card?.suit;

  function canPlay(card) {
    if (room.turn !== playerId) return false;
    if (!leadSuit) return true;
    const hasLead = me.hand.some(c => c.suit === leadSuit);
    return hasLead ? card.suit === leadSuit : true;
  }
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



  /* ================= SCORE BOARD ================= */
  const ScoreBoard = () => {
    return (
      <>
        {/* ================= LEFT SCOREBOARD ================= */}
        <div
          className="
            fixed z-50
            top-[6px] left-[6px]
            w-[300px]
            px-4 py-3
            text-sm
            bg-emerald-950/95
            rounded-xl
            shadow-xl
            origin-top-left
            transition-transform duration-300 ease-out

            [@media(max-height:700px)]:scale-90
            [@media(max-height:600px)]:scale-80
            [@media(max-height:500px)]:scale-60
            [@media(max-height:420px)]:scale-50
          "
        >
          {/* TITLE */}
          <div className="font-semibold mb-2">
            ♠ Call Break — Target {targetScore}
          </div>

          {/* PLAYER SCORES INLINE */}
          <div className="text-xs mb-2 text-emerald-300">
            {order
              .map(
                pid =>
                  `${room.playersData[pid].name} ${
                    room.playersData[pid].score ?? 0
                  }`
              )
              .join(" | ")}
          </div>

          {/* BID / TRICKS GRID */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
            {order.map(pid => {
              const p = room.playersData[pid];
              return (
                <React.Fragment key={pid}>
                  <div>{p.name}</div>
                  <div>
                    {p.bid ?? 0}–{p.tricks ?? 0}
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* ================= RIGHT WINNING AMOUNT ================= */}
        <div
          className="
            fixed z-50
            top-[6px] right-[6px]
            px-4 py-3
            text-sm
            bg-emerald-950/95
            rounded-xl
            shadow-xl
            text-right
            origin-top-right
            transition-transform duration-300 ease-out

            [@media(max-height:700px)]:scale-90
            [@media(max-height:600px)]:scale-80
            [@media(max-height:500px)]:scale-70
            [@media(max-height:420px)]:scale-65
          "
        >
          <div className="font-semibold">
            Winning Amount
          </div>
          <div className="font-bold text-emerald-300">
            💰 TK{winningAmount}
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
            className="antialiased text-2xl tracking-wide font-semibold bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent"
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
              Call Break
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
  if (room.phase === "bidding") {
    return (
      <Table>
        <ScoreBoard />

        {room.trumpCard && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Card card={room.trumpCard} disabled />
            <div className="mt-1 text-xs">TRUMP</div>
          </div>
        )}

        {room.turn === playerId && me.bid == null && (
          <div className="absolute bottom-32 left-1/2 -translate-x-1/2 grid grid-cols-7 gap-2">
            {Array.from({ length: 13 }, (_, i) => i + 1).map(bid => (
              <button
                key={bid}
                className="bg-emerald-800 px-3 py-2 rounded"
                onClick={() =>
                  socket.emit("place-bid", {
                    roomId: room.roomId,
                    playerId,
                    bid,
                  })
                }
              >
                {bid}
              </button>
            ))}
          </div>
        )}

        <MyHand
          me={me}
          canPlay={canPlay}
          socket={socket}
          room={room}
          playSound={playSound}
        />
      </Table>
    );
  }

  /* ================= PLAYING ================= */
  if (room.phase === "playing") {
    return (
      <Table>
        <ScoreBoard />

        <div className="absolute inset-0 flex items-center justify-center gap-6">
          {room.playedCards.map((pc, i) => (
            <motion.div
              key={i}
              animate={
                winnerPid === pc.pid
                  ? { scale: [1, 1.3, 1], y: [-10, -30, 0] }
                  : { scale: 1 }
              }
            >
              <Card card={pc.card} disabled />
            </motion.div>
          ))}
        </div>

        {rotated.map((pid, i) => {
          const p = room.playersData[pid];
          const seat = seatMap[i];
          const isTurn = room.turn === pid;

          if (pid === playerId) {
            return (
              <MyHand
                key={pid}
                me={p}
                canPlay={canPlay}
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
        })};
            
      </Table>
    );
  }
  if (room.phase === "ended") {
    return (
      <Center>
        {/* Confetti */}
        {playWinSound && <Confetti recycle={false} numberOfPieces={200} />}

        <div className="text-center space-y-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1.2 }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
          >
            <h1 className="text-5xl">🏆 Match Finished!</h1>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-3xl font-bold text-emerald-400">
             Congratulations to Winner{winners.length > 1 ? "s" : ""}: {winnerNames}
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-xl text-yellow-300 font-semibold"
          >
            Winning Amount: 💰💸 TK{winningAmount}.00
          </motion.div>

          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            <button
              onClick={() => {
                socket.emit("exit-room", {
                  roomId: room.roomId,
                  playerId,
                });

                // ✅ CLIENT NAVIGATION
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


function MyHand({ me, canPlay, socket, room, playSound, isTurn }) {
  // Compute responsive scale based on window height
  const [scale, setScale] = React.useState(1);

  React.useEffect(() => {
    function updateScale() {
      const h = window.innerHeight;
      if (h <= 400) setScale(0.85); // 15% smaller
      else if (h <= 420) setScale(0.9);
      else if (h <= 550) setScale(0.95);
      else setScale(1);
    }
    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);

  return (
    <div
      className="absolute left-1/2 bottom-[-90px] h-44 w-[640px] -translate-x-1/2"
      style={{ transform: `translateX(-50%) scale(${scale})` }}
    >
      {me.hand.map((c, i) => {
        const mid = (me.hand.length - 1) / 2;
        const diff = i - mid;
        const playable = canPlay(c);

        return (
          <motion.div
            key={i}
            className="absolute left-1/2"
            animate={{ x: diff * 48, opacity: isTurn ? 1 : 0.9 }}
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

