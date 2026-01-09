"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import Confetti from "react-confetti";
import { useCardGame } from "../context/GameContext";
import { useRouter } from "next/navigation";
import { useMobileFullscreen } from "@/app/useMobileFullscreen";


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
  const fullscreenReady = useMobileFullscreen();
  const [winnerPid, setWinnerPid] = useState(null);
  const [playWinSound, setPlayWinSound] = useState(false);
  const [playCoinSound, setPlayCoinSound] = useState(false);
  const [trumpBroken, setTrumpBroken] = useState(false);
  const [rematchVotes, setRematchVotes] = useState({});



  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;

    // ===============================
    // LOCK PAGE HEIGHT & SCROLL
    // ===============================
    html.style.height = "100%";
    body.style.height = "100%";

    html.style.overflow = "hidden";
    body.style.overflow = "hidden";

    html.style.overscrollBehavior = "none";
    body.style.overscrollBehavior = "none";

    // ✅ pinch-zoom only
    body.style.touchAction = "pinch-zoom";

    // ===============================
    // Prevent zooming out below original size (iOS Safari / Brave)
    // ===============================
    const preventZoomOut = (e) => {
      if (e.scale < 1) e.preventDefault(); // block zoom out
    };

    const preventScroll = (e) => {
      e.preventDefault(); // block all swipe/scroll
    };

    // iOS gestures
    document.addEventListener("gesturestart", preventZoomOut, { passive: false });
    document.addEventListener("gesturechange", preventZoomOut, { passive: false });

    // block touch scroll
    document.addEventListener("touchmove", preventScroll, { passive: false });

    return () => {
      // ===============================
      // RESET STYLES / EVENTS
      // ===============================
      html.style.height = "";
      body.style.height = "";

      html.style.overflow = "";
      body.style.overflow = "";

      html.style.overscrollBehavior = "";
      body.style.overscrollBehavior = "";

      body.style.touchAction = "";

      document.removeEventListener("gesturestart", preventZoomOut);
      document.removeEventListener("gesturechange", preventZoomOut);
      document.removeEventListener("touchmove", preventScroll);
    };
  }, []);


  if (!room) return <Center>Connecting…</Center>;
  const scoringType = room.matchType || "target";

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

  const trumpSuit = room.trumpSuit; // <-- from server

  useEffect(() => {
    if (room?.rematchVotes) {
      setRematchVotes(room.rematchVotes);
    }
  }, [room?.rematchVotes]);


  useEffect(() => {
    if (!room.playedCards) return;

    const trumpPlayed = room.playedCards.some(
      pc => pc.card.suit === room.trumpSuit
    );

    if (trumpPlayed && !trumpBroken) {
      setTrumpBroken(true);
    }
  }, [room.playedCards, room.trumpSuit, trumpBroken]);


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

    const leadSuit = room.playedCards?.[0]?.card?.suit;

    // ===============================
    // LEADING THE TRICK
    // ===============================
    if (!leadSuit) {
      // 🚫 Cannot lead with trump if not broken
      if (card.suit === trumpSuit && !trumpBroken) {
        return false;
      }
      return true;
    }

    // ===============================
    // FOLLOW SUIT
    // ===============================
    const hasLeadSuit = me.hand.some(
      c => c.suit === leadSuit
    );

    if (hasLeadSuit) {
      return card.suit === leadSuit;
    }

    // ===============================
    // VOID IN LEAD SUIT
    // ===============================
    // Player has no lead suit → anything allowed (including trump)
    return true;
  }

  function getBoxColor(pid) {
    if (rematchVotes?.[pid] === true) return "bg-blue-500";
    if (rematchVotes?.[pid] === false) return "bg-red-500";
    return "bg-emerald-500";
  }

  {!fullscreenReady && (
    <div className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center">
      <div
        className="text-emerald-300 text-lg font-semibold"
        onClick={fullscreenReady} // or whatever triggers it
      >
        Tap to start game
      </div>
    </div>
  )}

  const TableContainer = ({ children }) => {
    return (
      <div className="
        fixed inset-0
        overflow-hidden
        touch-none   /* 🔒 */
        bg-gradient-to-br from-emerald-950 to-black
      ">
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
            ♠ Call Break — {scoringType === "per-lead" ? "Per Lead (1 Round)" : `Target ${targetScore}`}
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
            Total POT: {winningAmount / 100}tk
          </div>
        </div>
      </>
    );
  };


  /* ================= WAITING ================= */
  if (room.phase === "waiting") {
    const seatPositions = [
      // Bottom (YOU)
      `bottom-[40px] left-1/2 -translate-x-1/2
      [@media(max-height:700px)]:bottom-[20px]
      [@media(max-height:600px)]:bottom-[10px]`,
      // Left
      `left-[40px] top-1/2 -translate-y-1/2
      [@media(max-height:600px)]:left-[80px]`,
      // Top
      `top-[40px] left-1/2 -translate-x-1/2
      [@media(max-height:700px)]:top-[100px]
      [@media(max-height:600px)]:top-[160px]`,
      // Right
      `right-[40px] top-1/2 -translate-y-1/2
      [@media(max-height:600px)]:right-[80px]`,
    ];

    // Detect portrait mode
    const isPortrait = typeof window !== "undefined" && window.innerHeight > window.innerWidth;

    return (
      <>
        {/* TOP LEFT LOGO */}
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

          {/* ROTATE PHONE TIP */}
          {isPortrait && (
            <div className="absolute bottom-[80px] left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-yellow-500/10 rounded-full text-yellow-300 text-sm">
              <motion.div
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                🔄
              </motion.div>
              Rotate your phone for better experience
            </div>
          )}

          {/* REFRESH TIP */}
          <div className="absolute bottom-[30px] left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-yellow-500/10 text-yellow-300 text-xs">
            Tip: If game gets stuck, just refresh
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
          <div
            className="
              fixed
              left-1/2 -translate-x-1/2
              bottom-[env(safe-area-inset-bottom)]
              flex gap-2
              px-3 py-2
              rounded-t-xl
              z-50
              w-full max-w-md
              justify-between
            "
          >
            {[2,3,4,5,6,7,8].map(bid => (
              <button
                key={bid}
                className="
                  flex-1
                  bg-emerald-800
                  hover:bg-emerald-700
                  active:scale-95
                  py-2
                  rounded-lg
                  font-semibold
                "
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
        <UserTurnIndicator isTurn={room.turn === playerId} />

            
      </Table>
    );
  }
  if (room.phase === "ended") {
    const winner = winners[0]; // only one winner
    return (
      <Center>
        {playWinSound && <Confetti recycle={false} numberOfPieces={200} />}
        <div className="flex flex-col items-center gap-6">
          {/* WINNER NAME BIG */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1.3 }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
          >
            <h1 className="text-6xl font-extrabold text-emerald-400">
              🏆 {winner.name}
            </h1>
          </motion.div>

          {/* WINNING AMOUNT */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-3xl font-bold text-yellow-300"
          >
            💰 Winning Amount: {winningAmount / 100} TK
          </motion.div>

          {/* PLAYER VOTE BOXES */}
          <div className="grid grid-cols-2 gap-4 mt-4">
            {room.order.map(pid => (
              <PlayerVoteBox
                key={pid}
                name={room.playersData[pid].name}
                color={getBoxColor(pid)}
              />
            ))}
          </div>

          {/* REMATCH BUTTON */}
          <motion.button
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ repeat: Infinity, duration: 1.2 }}
            onClick={() =>
              socket.emit("vote-rematch", {
                roomId: room.roomId,
                playerId,
                vote: true,
              })
            }
            className="
              mt-6 px-10 py-4
              bg-emerald-500
              hover:bg-emerald-400
              rounded-2xl
              text-black text-xl font-bold
              shadow-[0_0_40px_rgba(16,185,129,0.9)]
            "
          >
            🔁 PLAY AGAIN
          </motion.button>

          {/* EXIT MATCH BUTTON RED */}
          <motion.button
            onClick={() => {
              socket.emit("vote-rematch", {
                roomId: room.roomId,
                playerId,
                vote: false,
              });
              router.push("/");
            }}
            className="
              mt-4 px-12 py-3
              bg-red-600 hover:bg-red-500
              text-white font-bold text-lg
              rounded-xl
              shadow-lg
            "
          >
            ❌ EXIT MATCH
          </motion.button>
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
    <div
      className="
        h-[100dvh]
        relative
        overflow-hidden
        touch-none   /* 🔒 */
        bg-gradient-to-br from-emerald-900 to-black
      "
    >
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

const SUIT_ORDER = {
  diamonds: 0,
  spades: 1,
  hearts: 2,
  clubs: 3,
};

const VALUE_ORDER = {
  A: 1,
  2: 2,
  3: 3,
  4: 4,
  5: 5,
  6: 6,
  7: 7,
  8: 8,
  9: 9,
  10: 10,
  J: 11,
  Q: 12,
  K: 13,
};

function sortHand(hand) {
  return [...hand].sort((a, b) => {
    if (SUIT_ORDER[a.suit] !== SUIT_ORDER[b.suit]) {
      return SUIT_ORDER[a.suit] - SUIT_ORDER[b.suit];
    }
    return VALUE_ORDER[a.value] - VALUE_ORDER[b.value];
  });
}

function MyHand({ me, canPlay, socket, room, playSound, isTurn }) {
  const [scale, setScale] = React.useState(1);
  const [draggingId, setDraggingId] = React.useState(null);

  React.useEffect(() => {
    function updateScale() {
      const h = window.innerHeight;
      if (h <= 400) setScale(0.85);
      else if (h <= 420) setScale(0.9);
      else if (h <= 550) setScale(0.95);
      else setScale(1);
    }
    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);

  const hand = sortHand(me.hand);
  const count = hand.length;
  const mid = (count - 1) / 2;

  return (
    <div
      className="absolute left-1/2 bottom-[-90px] h-48 w-[680px]"
      style={{ transform: `translateX(-50%) scale(${scale})` }}
    >
      {hand.map((c, i) => {
        const playable = canPlay(c);
        const diff = i - mid;
        const isDragging = draggingId === c.id;

        // 🎴 SUBTLE FAN (FIXED)
        const x = diff * 50;
        const rotate = isDragging ? 0 : diff * 3;
        const lift = isDragging ? 0 : Math.abs(diff) * 2;

        return (
          <motion.div
            key={c.id}
            className="absolute left-1/2 touch-none"
            drag={playable && isTurn ? "y" : false}
            dragConstraints={{ top: -200, bottom: 0 }}
            dragElastic={0.1}
            dragMomentum={false}

            onClick={() => {
              if (!canPlay(c) || !isTurn) return;

              playSound("card");
              socket.emit("play-card", {
                roomId: room.roomId,
                playerId: me.playerId,
                card: c,
              });
            }}

            onDragStart={() => {
              setDraggingId(c.id);
            }}


            onDragEnd={(e, info) => {
              setDraggingId(null);

              if (!playable || !isTurn) return;

              // 🎯 PLAY THRESHOLD (CENTER DROP)
              if (info.offset.y < -90) {
                playSound("card");
                socket.emit("play-card", {
                  roomId: room.roomId,
                  playerId: me.playerId,
                  card: c,
                });
              }
              // else → Framer auto-snaps back
            }}

            animate={{
              x,
              y: lift,
              rotate,
              scale: isDragging ? 1.08 : 1,
              opacity: isTurn ? 1 : 0.85,
              zIndex: isDragging ? 100 : i,
            }}

            transition={{
              type: "spring",
              stiffness: 500,
              damping: 38,
            }}

            whileHover={
              playable && isTurn && !isDragging
                ? { y: -22, scale: 1.1, zIndex: 50 }
                : {}
            }
          >
            <Card card={c} disabled={!playable || !isTurn} />
          </motion.div>
        );
      })}
    </div>
  );
}
function UserTurnIndicator({ isTurn }) {
  return (
    <div
      className={`
        fixed z-[999]
        bottom-[10px] left-[10px]
        w-12 h-12
        rounded-full
        flex items-center justify-center
        transition-all duration-300 ease-out

        ${isTurn
          ? "bg-emerald-500 scale-110 shadow-[0_0_20px_rgba(16,185,129,0.95)]"
          : "bg-white/10 border border-white/20"}
      `}
    >
      {/* PULSE RING (only on turn) */}
      {isTurn && (
        <span className="
          absolute inset-0
          rounded-full
          animate-ping
          bg-emerald-400/50
        " />
      )}

      {/* USER ICON */}
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        className={`relative z-10 ${
          isTurn ? "text-black" : "text-white/70"
        }`}
      >
        <path
          d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12Zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8V22h19.2v-2.8c0-3.2-6.4-4.8-9.6-4.8Z"
          fill="currentColor"
        />
      </svg>
    </div>
  );
}
function PlayerVoteBox({ name, color }) {
  return (
    <div
      className={`
        w-28 h-20 rounded-xl
        flex items-center justify-center
        text-white font-semibold
        shadow-lg transition-all
        ${color}
      `}
    >
      {name}
    </div>
  );
}


export function EnemyHand({ player, seat, isTurn }) {
  const h = typeof window !== "undefined" ? window.innerHeight : 1000;
  const w = typeof window !== "undefined" ? window.innerWidth : 1000;

  /* ================= HEIGHT DELTA ================= */
  const delta = Math.max(0, 500 - h);

  /* ================= OUTWARD PUSH ================= */
  const sidePush = Math.min(80, 40 + delta * 0.6); // LEFT / RIGHT
  const topPush = Math.min(70, 30 + delta * 0.5);  // TOP
  const bottomPush = Math.min(50, 20 + delta * 0.4);

  /* ================= MOBILE OFFSET ================= */
  const isMobile = w < 768; // mobile check
  const mobileOffset = isMobile ? -7 : 0; // left/right hands move 7% upward

  /* ================= POSITION ================= */
  const stylePos = (() => {
    switch (seat) {
      case "top":
        return { top: `${18 - topPush}px`, left: "50%", transform: "translateX(-50%)" };
      case "bottom":
        return { bottom: `${8 - bottomPush}px`, left: "50%", transform: "translateX(-50%)" };
      case "left":
        return { left: `${8 - sidePush}px`, top: `calc(50% + ${mobileOffset}%)`, transform: "translateY(-50%)" };
      case "right":
        return { right: `${4 - sidePush}px`, top: `calc(50% + ${mobileOffset}%)`, transform: "translateY(calc(-50% - 10px))" };
      default:
        return null;
    }
  })();

  if (!stylePos) return null;

  /* ================= CARD SCALE ================= */
  const scale =
    h > 720 ? 1 :
    h > 600 ? 0.96 :
    h > 480 ? 0.92 :
    h > 400 ? 0.88 :
    0.84;

  /* ================= ROTATION ================= */
  const rotate = seat === "left" ? "rotate-90" : seat === "right" ? "-rotate-90" : "";

  return (
    <div className="absolute pointer-events-none" style={stylePos}>
      {/* HAND + PLAYER NAME */}
      <div className="relative h-28 w-72 flex flex-col items-center">
        {/* ===== PLAYER NAME CARD ===== */}
        <div className="mb-2 relative z-10">
          <span
            className={`px-3 py-1 text-xs font-medium text-white bg-emerald-700 rounded-full ${
              isTurn ? "ring-2 ring-emerald-400" : ""
            }`}
          >
            {player.name}
          </span>
        </div>

        {/* ===== HAND CARDS ===== */}
        <div className={`absolute inset-0 ${rotate}`}>
          {player.hand.map((_, i) => {
            const mid = (player.hand.length - 1) / 2;
            const diff = i - mid;

            return (
              <div
                key={i}
                className="absolute left-1/2"
                style={{
                  transform: `translateX(calc(-50% + ${diff * 12}px)) rotate(${diff * 3}deg)`,
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

