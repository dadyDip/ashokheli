"use client";

import React from "react";
import { motion } from "framer-motion";
import { useCardGame } from "../context/GameContext";
import { Eye, EyeOff, Coins } from "lucide-react";
import Card from "./Card";

export default function FlashBoard() {
  const { room, playerId, socket } = useCardGame();

  if (!room || !playerId) {
    return (
      <div className="h-[100dvh] w-full flex items-center justify-center text-white text-lg">
        ⏳ Connecting…
      </div>
    );
  }

  const me = room.playersData[playerId];
  const flash = room.flash ?? { activePids: [], currentBet: 0, pot: 0 };

  // Are we allowed to act?
  const canAct = flash.activePids?.includes(playerId) && !me.isPacked;

  const act = (action, amount = 0) => {
    socket.emit("flash-action", { roomId: room.roomId, action, amount });
  };

  return (
    <div className="h-[100dvh] w-full relative bg-gradient-to-br from-emerald-900 to-black overflow-hidden">
      {/* Felt + Vignette */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-[92vw] h-[72vh] rounded-full overflow-hidden">
          <div
            className="absolute inset-0 bg-[url('/textures/felt.jpg')] bg-cover bg-center opacity-90"
            style={{ mixBlendMode: "multiply" }}
          ></div>
          <div className="absolute inset-0 rounded-full shadow-[inset_0_0_90px_rgba(0,0,0,0.6)] pointer-events-none"></div>

          {/* Table Content */}
          <div className="relative w-full h-full">{/* Players + Pot */}</div>
        </div>
      </div>

      {/* Pot */}
      <motion.div
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ repeat: Infinity, duration: 1.8 }}
        className="absolute inset-0 flex items-center justify-center text-yellow-300 font-bold text-2xl pointer-events-none"
      >
        💰 {flash.pot}
      </motion.div>

      {/* Enemy Hand(s) */}
      {room.order
        .filter((pid) => pid !== playerId)
        .map((pid, i) => {
          const enemy = room.playersData[pid];
          return (
            <div
              key={pid}
              className={`absolute top-6 left-1/2 -translate-x-1/2 flex flex-col items-center`}
            >
              <div className="px-3 py-1 text-xs rounded-full bg-black/50 text-white mb-2">
                {enemy.name}
              </div>
              <div className="flex gap-1">
                {enemy.hand?.map((_, idx) => (
                  <Card key={idx} faceDown={true} />
                )) ?? [0, 1, 2].map((idx) => <Card key={idx} faceDown={true} />)}
              </div>
            </div>
          );
        })}

      {/* Your Hand */}
      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex flex-col items-center">
        <div className="flex gap-2 mb-2">
          {me.hand?.map((c, idx) => (
            <Card key={idx} card={c} faceDown={false} />
          )) ?? [0, 1, 2].map((idx) => <Card key={idx} faceDown={false} />)}
        </div>
        <div
          className={`px-4 py-1 text-sm rounded-full ${
            room.turn === playerId ? "bg-emerald-500 text-black" : "bg-black/50 text-white"
          }`}
        >
          {me.name}
        </div>
      </div>

      {/* Action Buttons */}
      {canAct && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex flex-wrap justify-center gap-2 px-4 py-3 bg-emerald-950/90 rounded-2xl shadow-xl z-50">
          <ActionButton action="pack" label="PACK" onClick={() => act("PACK")} />
          <ActionButton
            action="see"
            label={me.isSeen ? <EyeOff size={18} /> : <Eye size={18} />}
            onClick={() => act("SEEN")}
          />
          <ActionButton
            action="call"
            label={`CALL ${flash.currentBet}`}
            onClick={() => act("CALL", flash.currentBet)}
          />
          <ActionButton
            action="raise"
            label={`RAISE ${flash.currentBet * 2}`}
            onClick={() => act("RAISE", flash.currentBet * 2)}
          />
          <ActionButton action="nil" label="NIL BID" onClick={() => act("NIL")} />
          <ActionButton action="double" label="DOUBLE BID" onClick={() => act("DOUBLE")} />
        </div>
      )}
    </div>
  );
}

// Action Button Component
function ActionButton({ label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 rounded-xl font-bold text-white bg-gradient-to-br from-emerald-500 to-emerald-700 hover:scale-105 transform transition"
    >
      {label}
    </button>
  );
}
