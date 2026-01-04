"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Confetti from "react-confetti";
import { useRouter } from "next/navigation";
import { useLudoGame } from "@/context/GameContext";

const COLOR_MAP = {
  red: "#E53935",
  green: "#43A047",
  blue: "#1E88E5",
  yellow: "#FDD835",
};

export default function LudoWinOverlay() {
  const { room } = useLudoGame();
  const router = useRouter();

  if (!room?.winner) return null;

  const { winnerId, winnerName, color, entryFee, maxPlayers } = room;
  const winningAmount = entryFee * maxPlayers;

  // ⏱ Auto close after 5s
  useEffect(() => {
    const t = setTimeout(() => router.push("/"), 5000);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[999] flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          background: "rgba(0,0,0,0.75)",
          backdropFilter: "blur(8px)",
        }}
      >
        {/* 🎉 CONFETTI */}
        <Confetti
          numberOfPieces={260}
          gravity={0.25}
          colors={[COLOR_MAP[color]]}
        />

        {/* 🏆 WIN CARD */}
        <motion.div
          initial={{ scale: 0.7, y: 40 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 180 }}
          className="relative rounded-3xl p-8 text-center"
          style={{
            background: "rgba(255,255,255,0.08)",
            border: `2px solid ${COLOR_MAP[color]}`,
            boxShadow: `0 0 40px ${COLOR_MAP[color]}55`,
            color: "#fff",
            minWidth: 280,
          }}
        >
          <div className="text-sm uppercase opacity-70 tracking-widest">
            Winner
          </div>

          <div
            className="mt-2 text-3xl font-extrabold"
            style={{ color: COLOR_MAP[color] }}
          >
            {winnerName}
          </div>

          <div className="mt-4 text-sm opacity-80">
            Winning Amount
          </div>

          <div className="mt-1 text-4xl font-black">
            ৳ {winningAmount}
          </div>

          {/* 🔁 BUTTON */}
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push("/")}
            className="mt-6 px-6 py-3 rounded-xl font-bold"
            style={{
              background: COLOR_MAP[color],
              color: "#000",
            }}
          >
            Back to Lobby
          </motion.button>

          <div className="mt-3 text-xs opacity-60">
            Auto closing in 5 seconds…
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
