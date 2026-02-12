"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import Confetti from "react-confetti";
import { useCardGame } from "../context/GameContext";
import { useRouter } from "next/navigation";
import { useMobileFullscreen } from "@/app/useMobileFullscreen";
import { useLang } from "@/app/i18n/useLang";
import {
  Trophy,
  RotateCcw,
  LogOut,
  Coins,
  Wallet,
} from "lucide-react";
import { useWalletBalance } from "@/components/hooks/useWalletBalance";

import Card from "./Card";


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

  if (!playerId) {
    return <div>⏳ Initializing player...</div>;
  }

  if (!room) return <Center>Connecting…</Center>;
  const me = room.playersData?.[playerId];
  if (!me) return <Center>Registering…</Center>;
  const fullscreenReady = useMobileFullscreen();
  const phase = room.phase;
  const order = room.order || [];
  const { t } = useLang();
  const pendingReveal =
  room.pendingReveal &&
  room.pendingReveal.playerId === me.playerId;
  const [showTrump, setShowTrump] = useState(false);
  const [rematchVotes, setRematchVotes] = useState({});
  const scoringType = room.matchType || "target";
  const targetScore = room.targetScore ?? 30;
  const { balance, loading } = useWalletBalance();
  
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

  useEffect(() => {
    if (!socket) return;

    socket.on("update-rematch-votes", votes => {
      setRematchVotes(votes);
    });

    socket.on("rematch-cancelled", () => {
      setRematchVotes({});
      alert("All players declined rematch.");
    });

    socket.on("start-sevencalls", () => {
      // Reset client state as well if needed
      // Example: fetch new room state from server
    });

    return () => {
      socket.off("update-rematch-votes");
      socket.off("rematch-cancelled");
      socket.off("start-sevencalls");
    };
  }, [socket]);


  /* ===== ROTATION ===== */
  const meIndex = order.indexOf(playerId);
  const rotated =
    meIndex === -1
      ? order
      : [...order.slice(meIndex), ...order.slice(0, meIndex)];
  const canPlay = (card) => {
    if (!room || !me) return false;
    if (room.turn !== playerId) return false;

    // No cards played yet → any card allowed
    if (room.playedCards.length === 0) return true;

    const leadSuit = room.playedCards[0].card.suit;

    const hasLeadSuit = me.hand.some(c => c.suit === leadSuit);

    // If player has lead suit, MUST play it
    if (hasLeadSuit) {
      return card.suit === leadSuit;
    }

    // Otherwise free to play anything
    return true;
  };

  const seatMap = ["bottom", "left", "top", "right"];
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
            ♠ Seven Calls — {scoringType === "per-lead" ? "Per Lead (1 Round)" : `Target ${targetScore}`}
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
            Winning Amount: 💰 TK{winningAmount / 100}
          </div>
        </div>
      </>
    );
  };

  if (room.phase === "waiting") {
    const [copied, setCopied] = useState(false);
    
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

    // Check if roomId exists, if not use a fallback
    const roomId = room.roomId || room.id || 'Waiting for ID...';

    const copyRoomId = () => {
      if (roomId && roomId !== 'Waiting for ID...') {
        navigator.clipboard.writeText(roomId).then(() => {
          setCopied(true);
          // Reset after 2 seconds
          setTimeout(() => {
            setCopied(false);
          }, 2000);
        }).catch(() => {
          // Optional: Show error state briefly
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        });
      }
    };

    // Function to extract first name only
    const getFirstName = (fullName) => {
      if (!fullName) return "Waiting…";
      return fullName.split(' ')[0];
    };

    return (
      <>
        {/* TOP LEFT LOGO */}
        <div className="fixed z-50 top-[env(safe-area-inset-top)] left-[env(safe-area-inset-left)] px-4 py-3">
          <h1
            className="antialiased text-2xl tracking-wide font-semibold bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent"
            style={{ fontFamily: "'Story Script', cursive" }}
          >
            RoyalsBet
          </h1>
        </div>

        <TableContainer>
          {/* ROOM ID DISPLAY - Compact and Clean */}
          <div className="fixed z-50 right-4 top-4 sm:top-6
            flex items-center gap-3 px-4 py-3
            bg-black/60 backdrop-blur-md rounded-xl
            border border-emerald-500/30
            shadow-[0_0_20px_rgba(16,185,129,0.15)]">
            
            {/* Copy Button at Start with Success State */}
            <button
              onClick={copyRoomId}
              className={`p-2.5 rounded-lg transition-all duration-200 
                shadow-[0_0_10px_rgba(16,185,129,0.3)]
                hover:shadow-[0_0_15px_rgba(16,185,129,0.5)]
                text-white ${copied 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              title={copied ? "Copied!" : "Copy Room ID"}
              disabled={roomId === 'Waiting for ID...'}
            >
              {copied ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                    d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
            </button>
            
            {/* Room ID Text */}
            <div className="flex flex-col">
              <div className="text-xs text-emerald-300/70 mb-1">Room ID</div>
              <span className="text-sm font-mono font-medium text-emerald-300 max-w-[140px] truncate">
                {roomId}
              </span>
              {copied && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="text-[10px] text-green-400 mt-1"
                >
                  Copied to clipboard!
                </motion.div>
              )}
            </div>
          </div>

          {/* CENTER CONTENT - Moved up */}
          <div className="absolute inset-0 flex flex-col items-center justify-start pt-16">
            {/* Smaller Spade Icon */}
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-yellow-400 text-[65px] mb-3"
            >
              ♠
            </motion.div>

            {/* Call Break Text */}
            <div className="text-xl font-bold tracking-widest uppercase text-emerald-300">
              Call Break
            </div>
          </div>

          {/* PLAYERS - Show first name only */}
          {rotated.map((pid, index) => {
            const player = room.playersData[pid];
            const firstName = getFirstName(player?.name);
            
            return (
              <PlayerSeat
                key={pid}
                name={firstName}
                className={seatPositions[index]}
              />
            );
          })}

          {/* WAITING TEXT */}
          <div className="absolute bottom-[120px] left-1/2 -translate-x-1/2">
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="px-6 py-2 rounded-full border border-yellow-500/40 text-yellow-300 text-sm"
            >
              Waiting for players…
            </motion.div>
          </div>

          <WalletBalance balance={winningAmount / 100} />
        </TableContainer>
      </>
    );
  }

  /* ================= BIDDING ================= */
  if (phase === "bidding") {
    return (
      <Table>
        <ScoreBoard />
        <BiddingHeader
          room={room}
          order={order}
          currentTurn={room.turn}
        />

        {/* 5 CARD PREVIEW */}
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex gap-4">
          {me.hand.slice(0, 5).map((c, i) => (
            <Card key={i} card={c} disabled />
          ))}
        </div>

        {/* BID BUTTONS */}
        {room.turn === playerId && me.bid == null && (
          <div
            className="
              fixed
              left-1/2 -translate-x-1/2
              bottom-[env(safe-area-inset-bottom)]
              z-50

              w-full max-w-md
              px-4 pb-3
              rounded-t-2xl
            "
          >
            <div className="flex gap-3 justify-between">
              {[5, 7, 8, 10].map(bid => (
                <button
                  key={bid}
                  className="
                    flex-1
                    bg-emerald-800
                    hover:bg-emerald-700
                    active:scale-95
                    py-3
                    rounded-xl
                    text-lg
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
    if (!me) return <Center>Registering…</Center>;

    const isPowerOwner = room.turn === playerId;
    const handReady = Array.isArray(me.hand) && me.hand.length > 0;

    return (
      <Table key={room.powerSelectId}>
        <ScoreBoard />

        {isPowerOwner && handReady ? (
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex gap-4">
            {me.hand.map((c, i) => (
              <Card
                key={`${room.powerSelectId}-${i}`}
                card={c}
                clickable
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
        ) : isPowerOwner && !handReady ? (
          <Center>Loading hand…</Center>
        ) : (
          <Center>Waiting for highest bidder…</Center>
        )}
      </Table>
    );
  }


  /* ================= PLAYING ================= */
  if (phase === "playing" || phase === "trick-end") {
    return (
      <>
        <Table>
          <ScoreBoard />
          <ExitRoomIcon
            onExit={() => {
              socket.emit("leave-room", {
                roomId: room.roomId,
                playerId,
              });
              router.push("/");
            }}
          />
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
          })}
          <UserTurnIndicator isTurn={room.turn === playerId} />
          <WalletBalance balance={loading ? "…" : balance} />
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
  if (room.phase === "finished") {
    const team1Players = room.order.filter(
      pid => room.playersData[pid].team === 1
    );
    const team2Players = room.order.filter(
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
      <>
        {/* 🌫 BACKGROUND DIM */}
        <div className="fixed inset-0 z-10 bg-black/40 backdrop-blur-[8px]" />

        {/* 🎴 REAL BOARD */}
        <Table />
        <WalletBalance
          balance={loading ? "…" : balance}
          centered
        />
        {/* 🎉 CONFETTI */}
        {playWinSound && (
          <Confetti recycle={false} numberOfPieces={180} />
        )}

        {/* 🏆 FINISHED UI (CENTER CONTENT ONLY) */}
        <div className="fixed inset-0 z-20 flex items-center justify-center pointer-events-none">
          {/* 🔥 SCALE ONLY CONTENT */}
          <div
            className="
              pointer-events-auto
              relative flex flex-col items-center gap-6
              transition-transform duration-300
              max-md:max-h-[500px] scale-[0.7]
              md:scale-100
            "
          >
            {/* WINNER HEADER */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1.15 }}
              transition={{ type: "spring", stiffness: 260, damping: 18 }}
              className="flex items-center gap-3"
            >
              <Trophy className="w-12 h-12 text-emerald-400 drop-shadow-[0_0_20px_rgba(16,185,129,0.8)]" />
              <h1 className="text-6xl font-extrabold tracking-wide text-emerald-400">
                {winnerTeam ? `TEAM ${winnerTeam}` : "DRAW"}
              </h1>
            </motion.div>

            {/* WINNER NAMES */}
            {winnerTeam && (
              <motion.div
                initial={{ opacity: 0, y: -18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="text-2xl font-semibold text-emerald-200 tracking-wide"
              >
                {winnerNames}
              </motion.div>
            )}

            {/* WINNING AMOUNT */}
            <motion.div
              initial={{ opacity: 0, y: -18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="flex items-center gap-2 text-3xl font-bold text-yellow-300"
            >
              <Coins className="w-7 h-7 text-yellow-300" />
              <span>{winningAmount / 200} TK</span>
            </motion.div>

            {/* PLAYER VOTES */}
            <div className="grid grid-cols-2 gap-4 mt-4">
              {room.order.map(pid => {
                const isWinner =
                  winnerTeam &&
                  room.playersData[pid].team === winnerTeam;

                return (
                  <div key={pid} className="relative">
                    {isWinner && (
                      <motion.div
                        className="absolute inset-0 rounded-xl pointer-events-none"
                        animate={{
                          boxShadow: [
                            "0 0 10px rgba(16,185,129,0.35)",
                            "0 0 28px rgba(16,185,129,0.85)",
                            "0 0 10px rgba(16,185,129,0.35)",
                          ],
                        }}
                        transition={{ repeat: Infinity, duration: 1.6 }}
                      />
                    )}

                    <PlayerVoteBox
                      name={room.playersData[pid].name}
                      color={getBoxColor(pid, rematchVotes)}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ================= PLAY AGAIN (BOTTOM RIGHT) ================= */}
        <motion.button
          onClick={() =>
            socket.emit("vote-rematch-7call", {
              roomId: room.roomId,
              playerId,
              vote: true,
            })
          }
          animate={{
            scale: [1, 1.08, 1],
            boxShadow: [
              "0 0 0 rgba(16,185,129,0)",
              "0 0 40px rgba(16,185,129,0.9)",
              "0 0 0 rgba(16,185,129,0)",
            ],
          }}
          transition={{ repeat: Infinity, duration: 1.2 }}
          className="
            fixed bottom-4 right-4 z-[999]
            flex items-center gap-3
            px-7 py-4
            rounded-2xl
            bg-emerald-500 hover:bg-emerald-400
            text-black font-bold text-lg
            shadow-none
          "
        >
          <RotateCcw size={20} />
          PLAY AGAIN
        </motion.button>

        {/* ================= EXIT (BOTTOM LEFT) ================= */}
        <button
          onClick={() => {
            socket.emit("vote-rematch", {
              roomId: room.roomId,
              playerId,
              vote: false,
            });
            router.push("/");
          }}
          className="
            fixed bottom-4 left-4 z-[999]
            flex items-center gap-3
            px-7 py-4
            rounded-2xl
            bg-red-600 hover:bg-red-500
            text-white font-bold text-lg
            shadow-none
            scale-[0.8]
          "
        >
          <LogOut size={18} />
          EXIT
        </button>

      </>
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
function BiddingHeader({ room, order, currentTurn }) {
  return (
    <div className="absolute top-6 left-1/2 -translate-x-1/2 w-full max-w-[92%] z-40">
      
      {/* BIG TITLE */}
      <div className="text-center mb-4">
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 1.8, repeat: Infinity }}
          className="
            text-4xl md:text-5xl
            font-bold tracking-widest
            text-yellow-300
            drop-shadow-[0_0_20px_rgba(253,224,71,0.6)]
          "
        >
          BIDDING
        </motion.div>
      </div>

      {/* PLAYERS ROW */}
      <div className="flex justify-center gap-2 flex-wrap">
        {order.map(pid => {
          const p = room.playersData[pid];
          const isTurn = currentTurn === pid;

          return (
            <motion.div
              key={pid}
              animate={
                isTurn
                  ? { scale: 1.08, boxShadow: "0 0 18px rgba(16,185,129,0.9)" }
                  : { scale: 1 }
              }
              className={`
                px-3 py-2 rounded-lg text-xs font-semibold
                min-w-[70px] text-center
                transition-all

                ${p.team === 1
                  ? "bg-emerald-800 text-emerald-200"
                  : "bg-indigo-800 text-indigo-200"}

                ${isTurn ? "ring-2 ring-yellow-400" : "opacity-80"}
              `}
            >
              <div>{p.name}</div>

              {/* BID STATUS */}
              <div className="mt-1 text-[11px] opacity-90">
                {p.bid != null ? (
                  p.bid === 5 ? "Pass" : `${p.bid}`
                ) : (
                  <span className="italic opacity-50">Waiting</span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
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

function getBoxColor(pid, votes) {
  if (!votes || votes[pid] == null) return "bg-gray-600";
  return votes[pid] ? "bg-emerald-500" : "bg-red-500";
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
              if (info.offset.y < -90) {
                playSound("card");
                socket.emit("play-card", {
                  roomId: room.roomId,
                  playerId: me.playerId,
                  card: c,
                });
              }
            }}

            animate={{
              x,
              y: lift,
              rotate,
              scale: isDragging ? 1.08 : 1,
              opacity: isTurn ? 1 : 0.95,
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

function WalletBalance({ balance, centered = false }) {
  return (
    <div
      className={`
        fixed z-[999]
        flex items-center gap-2
        px-3 py-2
        rounded-xl
        bg-black/40 backdrop-blur
        text-white/80 text-xs
        transition-all duration-300 ease-out

        ${
          centered
            ? "bottom-[18px] left-1/2 -translate-x-1/2"
            : "bottom-[14px] right-[14px]"
        }
      `}
    >
      <Wallet size={16} />
      <span>{balance} tk</span>
    </div>
  );
}


function ExitRoomIcon({ onExit }) {
  const { t } = useLang();

  return (
    <button
      onClick={() => {
        if (confirm(t.exitConfirm)) {
          onExit();
        }
      }}
      title={t.exitRoom}
      className="
        fixed z-50
        top-[74px] right-[12px]   /* ⬅️ JUST BELOW WINNING AMOUNT */
        h-9 w-9
        flex items-center justify-center
        rounded-full
        bg-black/40
        hover:bg-red-500/80
        border border-white/15
        text-white/80
        hover:text-white
        transition
      "
    >
      <LogOut size={16} />
    </button>
  );
}

