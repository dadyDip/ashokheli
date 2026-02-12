"use client";

import { useRouter } from "next/navigation";
import { Flame, Dice5, Coins } from "lucide-react";

export default function CasinoGrid({ games }) {
  const router = useRouter();

  // Icon mapping
  const gameIcons = {
    crash: Flame,
    dice: Dice5,
    slot: Coins,
  };

  // Color mapping for Tailwind classes and drop-shadow
  const gameStyles = {
    crash: {
      border: "border-emerald-500/20 hover:border-emerald-400",
      glow: "bg-emerald-500/20",
      text: "text-emerald-400",
      textSmall: "text-emerald-300",
      dropShadow: "rgba(16,185,129,0.8)", // emerald-500 rgba approximation
    },
    dice: {
      border: "border-blue-500/20 hover:border-blue-400",
      glow: "bg-blue-500/20",
      text: "text-blue-400",
      textSmall: "text-blue-300",
      dropShadow: "rgba(59,130,246,0.8)", // blue-500 rgba approximation
    },
    slot: {
      border: "border-purple-500/20 hover:border-purple-400",
      glow: "bg-purple-500/20",
      text: "text-purple-400",
      textSmall: "text-purple-300",
      dropShadow: "rgba(139,92,246,0.8)", // purple-500 rgba approximation
    },
  };

  // Add default Slot game
  const allGames = [
    ...games,
    {
      id: "slot",
      name: "Slot Machine",
      description: "Classic 3-reel slots",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5 p-6">
      {allGames.map((game) => {
        const Icon = gameIcons[game.id] || Flame;
        const style = gameStyles[game.id] || gameStyles.crash;

        return (
          <button
            key={game.id}
            onClick={() => router.push(`/casino/${game.id}`)}
            className={`group relative rounded-2xl overflow-hidden
              bg-gradient-to-br from-gray-900 to-gray-800
              ${style.border}
              transition-all duration-300 hover:-translate-y-1`}
          >
            {/* Glow */}
            <div
              className={`absolute inset-0 opacity-0 group-hover:opacity-100 blur-2xl transition`}
              style={{ backgroundColor: style.glow }}
            />

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center justify-center h-36 gap-2">
              <Icon
                className="h-8 w-8"
                style={{ color: "", filter: `drop-shadow(0 0 10px ${style.dropShadow})` }}
              />
              <span className="text-lg font-bold text-white">{game.name}</span>
              <span className={style.textSmall}>Play Now</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
