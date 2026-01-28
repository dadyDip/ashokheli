"use client";

import { useEffect, useState } from "react";
import SevenCallsBoard from "./SevenCallsBoard";
import CallBreakBoard from "./CallBreakBoard";
import { useCardGame } from "@/context/GameContext";
import { RotateCw } from "lucide-react";
import FlashBoard from "./FlashBoard";
export default function CardGameBoard() {
  const { room, playerId, mode } = useCardGame();
  const [isPortrait, setIsPortrait] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      const vv = window.visualViewport;

      const portrait =
        window.matchMedia("(orientation: portrait)").matches ||
        (vv ? vv.height > vv.width : false) ||
        window.innerHeight > window.innerWidth;

      setIsPortrait(portrait);
    };

    // initial check
    checkOrientation();

    // iOS + Android safe listeners
    window.addEventListener("resize", checkOrientation);
    window.addEventListener("orientationchange", checkOrientation);
    window.visualViewport?.addEventListener("resize", checkOrientation);

    return () => {
      window.removeEventListener("resize", checkOrientation);
      window.removeEventListener("orientationchange", checkOrientation);
      window.visualViewport?.removeEventListener("resize", checkOrientation);
    };
  }, []);

  // ===================== LOADING STATES =====================
  if (!playerId) {
    return <div>⏳ Initializing player...</div>;
  }

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        <div>
          <p>🎮 Setting up game…</p>
          <p className="text-sm opacity-70">Waiting for server state</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* 🔒 PORTRAIT BLOCK OVERLAY */}
      {isPortrait && (
        <div className="fixed inset-0 z-[9999] bg-black/95 flex flex-col items-center justify-center gap-6 text-white text-center p-6">
          <RotateCw className="w-20 h-20 text-emerald-400 animate-pulse" />
          <p className="text-xl sm:text-2xl font-semibold">
            Rotate your device
          </p>
          <p className="text-sm opacity-70">
            This game is played in landscape mode
          </p>
        </div>
      )}

      {/* 🎮 GAME BOARDS */}
      {!isPortrait && (
        <>
          {mode === "seven" && <SevenCallsBoard />}
          {mode === "callbreak" && <CallBreakBoard />}
          {mode === "flash" && <FlashBoard />}
        </>
      )}
    </>
  );
}
