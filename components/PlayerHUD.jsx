"use client";

import Dice from "./Dice"; // ✅ THIS WAS MISSING

export default function PlayerHUD({
  player,
  isTurn,
  diceValue,
  onRoll,
}) {
  if (!player) return null;

  const seatStyles = {
    bottom: "bottom-2 left-1/2 -translate-x-1/2",
    top: "top-2 left-1/2 -translate-x-1/2",
    left: "left-2 top-1/2 -translate-y-1/2",
    right: "right-2 top-1/2 -translate-y-1/2",
  };

  return (
    <div
      className={`
        absolute z-30
        ${seatStyles[player.seat]}
        flex items-center gap-2
        px-3 py-2 rounded-xl
        bg-black/60 text-white
        shadow-lg
      `}
    >
      {/* PLAYER NAME */}
      <div
        className="font-bold capitalize"
        style={{ color: player.color }}
      >
        {player.name || player.playerId}
      </div>

      {/* DICE ONLY ON TURN */}
      {isTurn && (
        <Dice
          value={diceValue ?? 1}
          onRoll={onRoll}
          size={42}
        />
      )}
    </div>
  );
}
